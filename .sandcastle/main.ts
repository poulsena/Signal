import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

import { Output, createSandbox, pi, run } from '@ai-hero/sandcastle';
import { docker } from '@ai-hero/sandcastle/sandboxes/docker';
import { z } from 'zod';

const repoRoot = process.cwd();
const sandcastleDir = join(repoRoot, '.sandcastle');
const envPath = join(sandcastleDir, '.env');

if (existsSync(envPath)) {
	loadEnvFile(envPath);
}

const planSchema = z.object({
	summary: z.string().min(1),
	steps: z
		.array(
			z.object({
				description: z.string().min(1),
				files: z.array(z.string()),
				validation: z.string().min(1)
			})
		)
		.min(1),
	risks: z.array(z.string())
});

const reviewSchema = z.object({
	approved: z.boolean(),
	summary: z.string().min(1),
	findings: z.array(
		z.object({
			severity: z.enum(['blocking', 'advisory']),
			title: z.string().min(1),
			details: z.string().min(1),
			suggestedFix: z.string().min(1)
		})
	)
});

type Review = z.infer<typeof reviewSchema>;

function requiredEnv(name: string): string {
	const value = process.env[name]?.trim();
	if (!value) {
		throw new Error(
			`Missing ${name}. Copy .sandcastle/.env.example to .sandcastle/.env and configure it.`
		);
	}
	return value;
}

function positiveIntegerEnv(name: string, fallback: number): number {
	const raw = process.env[name];
	if (!raw) return fallback;
	const value = Number(raw);
	if (!Number.isInteger(value) || value < 1) {
		throw new Error(`${name} must be a positive integer; received ${raw}.`);
	}
	return value;
}

function git(args: string[]): string {
	return execFileSync('git', args, {
		cwd: repoRoot,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	}).trim();
}

function commandJson(command: string, args: string[]): unknown {
	const stdout = execFileSync(command, args, {
		cwd: repoRoot,
		encoding: 'utf8',
		stdio: ['ignore', 'pipe', 'pipe']
	});
	return JSON.parse(stdout) as unknown;
}

function slug(value: string): string {
	return (
		value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '')
			.slice(0, 42) || 'task'
	);
}

function argumentValue(args: string[], flag: string): string | undefined {
	const index = args.indexOf(flag);
	if (index === -1) return undefined;
	const value = args[index + 1];
	if (!value || value.startsWith('--')) {
		throw new Error(`${flag} requires a value.`);
	}
	return value;
}

const issueSchema = z.object({
	number: z.number(),
	title: z.string(),
	body: z.string(),
	url: z.string(),
	labels: z.array(z.object({ name: z.string() })),
	comments: z.array(z.object({ body: z.string() }))
});

function readIssue(number: string): { task: string; label: string } {
	const issue = issueSchema.parse(
		commandJson('gh', ['issue', 'view', number, '--json', 'number,title,body,url,labels,comments'])
	);
	const labels = issue.labels.map((label) => label.name);
	if (!labels.includes('ready-for-agent')) {
		throw new Error(
			`Issue #${issue.number} is not labeled ready-for-agent; refusing to implement it.`
		);
	}
	const comments = issue.comments
		.map((comment, index) => `Comment ${index + 1}:\n${comment.body}`)
		.join('\n\n');
	return {
		label: `issue-${issue.number}-${slug(issue.title)}`,
		task: [
			`GitHub issue #${issue.number}: ${issue.title}`,
			issue.url,
			`Labels: ${labels.join(', ')}`,
			'',
			issue.body,
			comments ? `\nDiscussion:\n${comments}` : ''
		].join('\n')
	};
}

function nextReadyIssue(): string {
	const schema = z.array(z.object({ number: z.number() })).max(1);
	const issues = schema.parse(
		commandJson('gh', [
			'issue',
			'list',
			'--state',
			'open',
			'--label',
			'ready-for-agent',
			'--limit',
			'1',
			'--json',
			'number'
		])
	);
	if (!issues[0]) {
		throw new Error(
			'No open issue is labeled ready-for-agent. Pass --task or --task-file for ad-hoc work.'
		);
	}
	return String(issues[0].number);
}

function resolveTask(args: string[]): { task: string; label: string } {
	const issue = argumentValue(args, '--issue');
	const inlineTask = argumentValue(args, '--task');
	const taskFile = argumentValue(args, '--task-file');
	const selected = [issue, inlineTask, taskFile].filter(Boolean);
	if (selected.length > 1) {
		throw new Error('Choose only one of --issue, --task, or --task-file.');
	}
	if (inlineTask) return { task: inlineTask, label: slug(inlineTask) };
	if (taskFile) {
		const path = resolve(repoRoot, taskFile);
		return { task: readFileSync(path, 'utf8'), label: slug(basename(path)) };
	}
	return readIssue(issue ?? nextReadyIssue());
}

function assertHostReady(imageName: string): { baseSha: string; baseBranch: string } {
	const trackedChanges = git(['status', '--porcelain', '--untracked-files=no']);
	if (trackedChanges) {
		throw new Error(
			'Tracked changes are present. Commit or stash them before running Sandcastle. Untracked files are allowed and are not copied into agent worktrees.'
		);
	}
	const baseBranch = git(['symbolic-ref', '--quiet', '--short', 'HEAD']);
	const baseSha = git(['rev-parse', 'HEAD']);
	execFileSync('docker', ['image', 'inspect', imageName], {
		cwd: repoRoot,
		stdio: 'ignore'
	});
	return { baseSha, baseBranch };
}

const modelsSchema = z.object({
	data: z.array(z.object({ id: z.string(), owned_by: z.string().optional() }))
});

async function assertOsaurusReady(requiredModels: string[]): Promise<void> {
	let response: Response;
	try {
		response = await fetch('http://127.0.0.1:1337/v1/models', {
			signal: AbortSignal.timeout(5_000)
		});
	} catch (error) {
		throw new Error(
			'Osaurus is not reachable on 127.0.0.1:1337. Start its loopback server before running Sandcastle.',
			{ cause: error }
		);
	}
	if (!response.ok) {
		throw new Error(`Osaurus model discovery failed: HTTP ${response.status}.`);
	}
	const models = modelsSchema.parse(await response.json());
	const available = new Set(models.data.map((model) => model.id));
	const missing = requiredModels.filter((model) => !available.has(model));
	if (missing.length > 0) {
		throw new Error(
			`Osaurus does not currently expose: ${missing.join(', ')}. Available models: ${[...available].join(', ') || 'none'}.`
		);
	}
}

function formatVerification(result: { exitCode: number; stdout: string; stderr: string }): string {
	const combined = [result.stdout.trim(), result.stderr.trim()].filter(Boolean).join('\n');
	const tail = combined.length > 12_000 ? combined.slice(-12_000) : combined;
	return [
		`Exit code: ${result.exitCode}`,
		'Command: pnpm check && pnpm test:unit -- --run && pnpm build',
		tail
	].join('\n');
}

function reviewFeedback(review: Review, verification: string, reviewerMutated: boolean): string {
	const findings = review.findings
		.map(
			(finding, index) =>
				`${index + 1}. [${finding.severity}] ${finding.title}\n${finding.details}\nRequired repair: ${finding.suggestedFix}`
		)
		.join('\n\n');
	return [
		'The independent review rejected the implementation. Repair every blocking problem, rerun the relevant checks, and commit the fixes on the current branch.',
		reviewerMutated
			? 'The reviewer also violated read-only mode; do not copy any changes from its isolated review branch.'
			: '',
		`Review summary: ${review.summary}`,
		findings ||
			'No structured findings were supplied; reconcile the rejection with the verification output.',
		'Automated verification:',
		verification,
		'Finish with a concise summary and <promise>COMPLETE</promise>.'
	]
		.filter(Boolean)
		.join('\n\n');
}

const args = process.argv.slice(2);
if (args.includes('--help')) {
	console.log(`Usage:
  pnpm sandcastle                         # next ready-for-agent issue
  pnpm sandcastle -- --issue 123         # a specific ready-for-agent issue
  pnpm sandcastle -- --task "description"
  pnpm sandcastle -- --task-file path.md`);
	process.exit(0);
}

const task = resolveTask(args);
const localModel = requiredEnv('SANDCASTLE_LOCAL_MODEL');
const plannerModel = process.env.SANDCASTLE_PLANNER_MODEL?.trim() || 'openai-chatgpt/gpt-5.6-sol';
const reviewerModel = process.env.SANDCASTLE_REVIEWER_MODEL?.trim() || 'openai-chatgpt/gpt-5.6-sol';
const maxReviewRounds = positiveIntegerEnv('SANDCASTLE_MAX_REVIEW_ROUNDS', 3);
const imageName = process.env.SANDCASTLE_IMAGE?.trim() || 'signal-web-app-sandcastle';
const { baseSha, baseBranch } = assertHostReady(imageName);
await assertOsaurusReady([...new Set([plannerModel, reviewerModel, localModel])]);

const runId = `${task.label}-${Date.now()}`;
const planningBranch = `sandcastle/plan/${runId}`;
const implementationBranch = `sandcastle/implement/${runId}`;
const pnpmStore = join(sandcastleDir, 'pnpm-store');
const sessionsDir = join(sandcastleDir, 'sessions');
mkdirSync(pnpmStore, { recursive: true });
mkdirSync(sessionsDir, { recursive: true });

const sandboxProvider = () =>
	docker({
		imageName,
		mounts: [{ hostPath: pnpmStore, sandboxPath: '/home/agent/.pnpm-store' }]
	});
const sessionStorage = {
	hostSessionsDir: sessionsDir,
	sandboxSessionsDir: '/home/agent/.pi/agent/sessions'
};
const piModel = (model: string) => `osaurus/${model}`;
const installHooks = {
	sandbox: {
		onSandboxReady: [
			{
				command: 'pnpm install --frozen-lockfile --store-dir /home/agent/.pnpm-store',
				timeoutMs: 180_000
			}
		]
	}
};

console.log(`Planning ${task.label} with ${plannerModel} through Osaurus...`);
const planResult = await run({
	name: 'planner',
	agent: pi(piModel(plannerModel), {
		thinking: 'high',
		sessionStorage
	}),
	sandbox: sandboxProvider(),
	branchStrategy: { type: 'branch', branch: planningBranch, baseBranch: baseSha },
	promptFile: join(sandcastleDir, 'plan-prompt.md'),
	promptArgs: { TASK: task.task },
	maxIterations: 1,
	output: Output.object({ tag: 'plan', schema: planSchema, maxRetries: 1 })
});
if (planResult.commits.length > 0 || planResult.preservedWorktreePath) {
	throw new Error(
		'The planner modified its read-only worktree. No implementation or merge was attempted.'
	);
}

const plan = JSON.stringify(planResult.output, null, 2);
console.log(`Implementing on ${implementationBranch} with local model ${localModel}...`);
const implementationSandbox = await createSandbox({
	branch: implementationBranch,
	baseBranch: baseSha,
	sandbox: sandboxProvider(),
	hooks: installHooks
});

let approved = false;
let latestImplementation;
try {
	latestImplementation = await implementationSandbox.run({
		name: 'implementer',
		agent: pi(piModel(localModel), {
			thinking: 'high',
			sessionStorage
		}),
		promptFile: join(sandcastleDir, 'implement-prompt.md'),
		promptArgs: { TASK: task.task, PLAN: plan },
		maxIterations: 1
	});

	const implementedHead = (await implementationSandbox.exec('git rev-parse HEAD')).stdout.trim();
	if (implementedHead === baseSha) {
		throw new Error(
			`The local implementer produced no commit. Branch retained as ${implementationBranch}.`
		);
	}

	for (let round = 1; round <= maxReviewRounds; round++) {
		console.log(`Running verification and review ${round}/${maxReviewRounds}...`);
		const verificationResult = await implementationSandbox.exec(
			'pnpm check && pnpm test:unit -- --run && pnpm build',
			{ onLine: (line) => console.log(`[verify] ${line}`) }
		);
		const verification = formatVerification(verificationResult);
		const reviewBranch = `sandcastle/review/${runId}-${round}`;
		const reviewResult = await run({
			name: `reviewer-${round}`,
			agent: pi(piModel(reviewerModel), {
				thinking: 'high',
				sessionStorage
			}),
			sandbox: sandboxProvider(),
			hooks: installHooks,
			branchStrategy: { type: 'branch', branch: reviewBranch, baseBranch: implementationBranch },
			promptFile: join(sandcastleDir, 'review-prompt.md'),
			promptArgs: {
				TASK: task.task,
				PLAN: plan,
				BASE_SHA: baseSha,
				IMPLEMENTATION_BRANCH: implementationBranch,
				VERIFICATION: verification
			},
			maxIterations: 1,
			output: Output.object({ tag: 'review', schema: reviewSchema, maxRetries: 1 })
		});

		const reviewerMutated =
			reviewResult.commits.length > 0 || Boolean(reviewResult.preservedWorktreePath);
		const hasBlockingFindings = reviewResult.output.findings.some(
			(finding) => finding.severity === 'blocking'
		);
		approved =
			reviewResult.output.approved &&
			!hasBlockingFindings &&
			verificationResult.exitCode === 0 &&
			!reviewerMutated;

		if (approved) {
			console.log(`Review approved: ${reviewResult.output.summary}`);
			break;
		}

		console.log(`Review rejected: ${reviewResult.output.summary}`);
		if (round === maxReviewRounds) break;
		const feedback = reviewFeedback(reviewResult.output, verification, reviewerMutated);
		if (!latestImplementation.resume) {
			throw new Error(
				'Pi implementation session was not captured; refusing to run a context-free repair pass.'
			);
		}
		latestImplementation = await latestImplementation.resume(feedback, {
			name: `implementer-repair-${round}`
		});
	}
} finally {
	await implementationSandbox.close();
}

if (!approved) {
	throw new Error(
		`Review did not approve after ${maxReviewRounds} round(s). Nothing was merged; inspect ${implementationBranch} and .sandcastle/logs/.`
	);
}

if (
	git(['rev-parse', 'HEAD']) !== baseSha ||
	git(['symbolic-ref', '--quiet', '--short', 'HEAD']) !== baseBranch
) {
	throw new Error(
		'The host branch moved during the run. Review passed, but the workflow refused to merge stale work.'
	);
}
if (git(['status', '--porcelain', '--untracked-files=no'])) {
	throw new Error(
		'Tracked host changes appeared during the run. Review passed, but nothing was merged.'
	);
}

execFileSync('git', ['merge', '--ff-only', implementationBranch], {
	cwd: repoRoot,
	stdio: 'inherit'
});
console.log(`Merged approved branch ${implementationBranch} into ${baseBranch}.`);

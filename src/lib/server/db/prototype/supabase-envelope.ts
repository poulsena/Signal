/**
 * PROTOTYPE — disposable Supabase Free deployment-envelope probe.
 *
 * Question: can Signal rely on Supabase Free's Frankfurt database for standard
 * PostgreSQL transactions through its serverless pooler, and what local-client
 * concurrency starts to degrade before implementation sets a conservative cap?
 *
 * This uses synthetic data only. It never prints credentials, hosts, database
 * names, user names, query text, or row contents.
 */
import { performance } from 'node:perf_hooks';
import postgres, { type Sql } from 'postgres';

const pooledUrl = requiredEnvironmentVariable('POSTGRES_URL');
const directUrl = requiredEnvironmentVariable('POSTGRES_URL_NON_POOLING');
const schemaName = 'signal_postgres_prototype';
const concurrencySteps = [1, 2, 4, 8, 16, 32] as const;
const transactionsPerWorker = 5;

const pooled = postgres(pooledUrl, {
	max: 20,
	idle_timeout: 5,
	connect_timeout: 10,
	prepare: false,
	onnotice: () => undefined
});

const direct = postgres(directUrl, {
	max: 1,
	idle_timeout: 5,
	connect_timeout: 10,
	prepare: false,
	onnotice: () => undefined
});

type StepResult = {
	concurrency: number;
	transactions: number;
	failures: number;
	elapsedMs: number;
	throughputPerSecond: number;
	latencyMs: {
		p50: number;
		p95: number;
		p99: number;
		max: number;
	};
};

type ProbeReport = {
	prototype: 'supabase-free-frankfurt';
	connections: {
		pooledPort: string;
		directPort: string;
		preparedStatementsDisabled: true;
		clientPoolMaximum: number;
	};
	server: {
		version: string;
		defaultTransactionIsolation: string;
		maximumConnections: number;
		isReplica: boolean;
	};
	correctness: {
		directConnection: 'passed';
		pooledTransaction: 'passed';
		rollback: 'passed';
		advisoryTransactionLock: 'passed';
	};
	load: StepResult[];
	observedOwnConnections: number;
	databaseBytesAfterProbe: number;
};

async function main(): Promise<void> {
	await prepareSyntheticSchema(direct);

	const server = await readServerEnvelope(pooled);
	await verifyDirectConnection(direct);
	await verifyPooledTransaction(pooled);
	await verifyRollback(pooled);
	await verifyAdvisoryTransactionLock(pooled);

	const load: StepResult[] = [];
	for (const concurrency of concurrencySteps) {
		load.push(await runLoadStep(pooled, concurrency));
	}

	const [{ connection_count: connectionCount }] = await pooled<
		[{ connection_count: number }]
	>`select count(*)::int as connection_count from pg_stat_activity where usename = current_user`;
	const [{ database_bytes: databaseBytes }] = await pooled<
		[{ database_bytes: number }]
	>`select pg_database_size(current_database())::float8 as database_bytes`;

	const report: ProbeReport = {
		prototype: 'supabase-free-frankfurt',
		connections: {
			pooledPort: new URL(pooledUrl).port || '5432',
			directPort: new URL(directUrl).port || '5432',
			preparedStatementsDisabled: true,
			clientPoolMaximum: 20
		},
		server,
		correctness: {
			directConnection: 'passed',
			pooledTransaction: 'passed',
			rollback: 'passed',
			advisoryTransactionLock: 'passed'
		},
		load,
		observedOwnConnections: connectionCount,
		databaseBytesAfterProbe: databaseBytes
	};

	console.log(JSON.stringify(report, null, 2));
}

function requiredEnvironmentVariable(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is not set`);
	return value;
}

async function prepareSyntheticSchema(sql: Sql): Promise<void> {
	await sql.unsafe(`create schema if not exists ${schemaName}`);
	await sql.unsafe(`
		create table if not exists ${schemaName}.probe_events (
			id bigint generated always as identity primary key,
			probe_run text not null,
			worker integer not null,
			created_at timestamptz not null default now()
		)
	`);
	await sql.unsafe(`
		create table if not exists ${schemaName}.rollback_canary (
			id text primary key
		)
	`);
}

async function readServerEnvelope(sql: Sql): Promise<ProbeReport['server']> {
	const [row] = await sql<
		[
			{
				version: string;
				default_transaction_isolation: string;
				maximum_connections: number;
				is_replica: boolean;
			}
		]
	>`
		select
			current_setting('server_version') as version,
			current_setting('default_transaction_isolation') as default_transaction_isolation,
			current_setting('max_connections')::int as maximum_connections,
			pg_is_in_recovery() as is_replica
	`;

	return {
		version: row.version,
		defaultTransactionIsolation: row.default_transaction_isolation,
		maximumConnections: row.maximum_connections,
		isReplica: row.is_replica
	};
}

async function verifyDirectConnection(sql: Sql): Promise<void> {
	const [{ value }] = await sql<[{ value: number }]>`select 1::int as value`;
	if (value !== 1) throw new Error('Direct connection probe failed');
}

async function verifyPooledTransaction(sql: Sql): Promise<void> {
	const value = await sql.begin(async (transaction) => {
		const [{ result }] = await transaction<[{ result: number }]>`select 40::int + 2::int as result`;
		return result;
	});
	if (value !== 42) throw new Error('Pooled transaction probe failed');
}

async function verifyRollback(sql: Sql): Promise<void> {
	const canaryId = `rollback-${crypto.randomUUID()}`;

	try {
		await sql.begin(async (transaction) => {
			await transaction.unsafe(`insert into ${schemaName}.rollback_canary (id) values ($1)`, [
				canaryId
			]);
			throw new ExpectedRollback();
		});
	} catch (error) {
		if (!(error instanceof ExpectedRollback)) throw error;
	}

	const [row] = await sql.unsafe<{ found: boolean }[]>(
		`select exists(select 1 from ${schemaName}.rollback_canary where id = $1) as found`,
		[canaryId]
	);
	if (row.found) throw new Error('Rollback probe left its canary row behind');
}

async function verifyAdvisoryTransactionLock(sql: Sql): Promise<void> {
	const lockKey = 913_371;
	const startedAt = performance.now();

	await Promise.all([
		sql.begin(async (transaction) => {
			await transaction`select pg_advisory_xact_lock(${lockKey})`;
			await transaction`select pg_sleep(0.05)`;
		}),
		sql.begin(async (transaction) => {
			await transaction`select pg_advisory_xact_lock(${lockKey})`;
			await transaction`select pg_sleep(0.05)`;
		})
	]);

	if (performance.now() - startedAt < 90) {
		throw new Error('Transaction advisory lock did not serialize the two holders');
	}
}

async function runLoadStep(sql: Sql, concurrency: number): Promise<StepResult> {
	const runId = crypto.randomUUID();
	const latencies: number[] = [];
	let failures = 0;
	const startedAt = performance.now();

	await Promise.all(
		Array.from({ length: concurrency }, async (_, worker) => {
			for (let iteration = 0; iteration < transactionsPerWorker; iteration += 1) {
				const transactionStartedAt = performance.now();
				try {
					await sql.begin(async (transaction) => {
						await transaction.unsafe(
							`insert into ${schemaName}.probe_events (probe_run, worker) values ($1, $2)`,
							[runId, worker]
						);
						await transaction`select pg_sleep(0.005)`;
					});
				} catch {
					failures += 1;
				} finally {
					latencies.push(performance.now() - transactionStartedAt);
				}
			}
		})
	);

	const elapsedMs = performance.now() - startedAt;
	return {
		concurrency,
		transactions: concurrency * transactionsPerWorker,
		failures,
		elapsedMs: round(elapsedMs),
		throughputPerSecond: round((concurrency * transactionsPerWorker * 1_000) / elapsedMs),
		latencyMs: {
			p50: percentile(latencies, 0.5),
			p95: percentile(latencies, 0.95),
			p99: percentile(latencies, 0.99),
			max: round(Math.max(...latencies))
		}
	};
}

function percentile(values: number[], quantile: number): number {
	const sorted = [...values].sort((left, right) => left - right);
	const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1);
	return round(sorted[index] ?? 0);
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}

class ExpectedRollback extends Error {}

try {
	await main();
} finally {
	await Promise.allSettled([pooled.end({ timeout: 5 }), direct.end({ timeout: 5 })]);
}

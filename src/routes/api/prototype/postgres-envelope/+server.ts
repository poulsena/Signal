/**
 * PROTOTYPE — temporary, token-protected Fluid/Supabase connection probe.
 *
 * This route uses synthetic data only and must not ship with the product.
 */
import { timingSafeEqual } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { attachDatabasePool } from '@vercel/functions';
import { env } from '$env/dynamic/private';
import { supabaseRootCa } from '$lib/server/db/prototype/supabase-ca';
import type { RequestHandler } from './$types';
import { Pool } from 'pg';

const connectionString = env.POSTGRES_URL;
if (!connectionString) throw new Error('POSTGRES_URL is not set');

const connectionUrl = new URL(connectionString);
connectionUrl.searchParams.delete('sslmode');

const pool = new Pool({
	connectionString: connectionUrl.toString(),
	ssl: { ca: supabaseRootCa, rejectUnauthorized: true },
	max: 4,
	min: 1,
	idleTimeoutMillis: 5_000,
	connectionTimeoutMillis: 10_000,
	allowExitOnIdle: false
});

attachDatabasePool(pool);

const instanceId = crypto.randomUUID().slice(0, 8);
const schemaName = 'signal_postgres_prototype';

export const GET: RequestHandler = async ({ request, url }) => {
	if (!isAuthorized(request)) {
		return Response.json({ error: 'unauthorized' }, { status: 401 });
	}

	const concurrency = boundedInteger(url.searchParams.get('concurrency'), 1, 16, 1);
	const startedAt = performance.now();
	const failures: string[] = [];
	const transactions = Array.from({ length: concurrency }, async (_, worker) => {
		const transactionStartedAt = performance.now();
		const client = await pool.connect();
		try {
			await client.query('begin');
			await client.query(
				`insert into ${schemaName}.probe_events (probe_run, worker) values ($1, $2)`,
				[`vercel-${instanceId}`, worker]
			);
			await client.query('select pg_sleep(0.005)');
			await client.query('commit');
		} catch (error) {
			await client.query('rollback').catch(() => undefined);
			failures.push(error instanceof Error ? error.name : 'unknown');
		} finally {
			client.release();
		}

		return performance.now() - transactionStartedAt;
	});
	const peakPool = {
		total: pool.totalCount,
		idle: pool.idleCount,
		waiting: pool.waitingCount
	};
	const latencies = await Promise.all(transactions);

	const connectionResult = await pool.query<{
		connection_count: number;
	}>(`select count(*)::int as connection_count from pg_stat_activity where usename = current_user`);
	const ownConnections = connectionResult.rows[0]?.connection_count ?? 0;

	return Response.json(
		{
			prototype: 'supabase-free-frankfurt-fluid',
			region: process.env.VERCEL_REGION ?? 'unknown',
			instanceId,
			concurrency,
			failures,
			elapsedMs: round(performance.now() - startedAt),
			latencyMs: {
				p50: percentile(latencies, 0.5),
				p95: percentile(latencies, 0.95),
				max: round(Math.max(...latencies))
			},
			pool: {
				maximum: 4,
				peak: peakPool,
				total: pool.totalCount,
				idle: pool.idleCount,
				waiting: pool.waitingCount,
				observedOwnConnections: ownConnections
			}
		},
		{ headers: { 'cache-control': 'private, no-store' } }
	);
};

function isAuthorized(request: Request): boolean {
	const expected = env.PROTOTYPE_BENCHMARK_TOKEN;
	const authorization = request.headers.get('authorization');
	if (!expected || !authorization?.startsWith('Bearer ')) return false;

	const receivedBytes = Buffer.from(authorization.slice('Bearer '.length));
	const expectedBytes = Buffer.from(expected);
	return (
		receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes)
	);
}

function boundedInteger(
	value: string | null,
	minimum: number,
	maximum: number,
	fallback: number
): number {
	const parsed = Number(value);
	if (!Number.isSafeInteger(parsed)) return fallback;
	return Math.min(maximum, Math.max(minimum, parsed));
}

function percentile(values: number[], quantile: number): number {
	const sorted = [...values].sort((left, right) => left - right);
	const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1);
	return round(sorted[index] ?? 0);
}

function round(value: number): number {
	return Math.round(value * 100) / 100;
}

# Zero-cost PostgreSQL deployment envelope prototype

Prototype date: 2026-08-17

## Question

Can Signal run a Frankfurt PostgreSQL correctness boundary on Vercel and keep the owner's bill at an enforceable $0, and which limits must the implementation specification lock?

## Outcome

The original envelope has no qualifying provider. The user subsequently made owner out-of-pocket `$0` the controlling constraint and explicitly accepted loss of production HA, paid Vercel Pro features, and service availability at free-tier quotas. Under those relaxed premises, the recommended initial envelope is:

- Vercel Hobby, with the application function pinned to Frankfurt `fra1`;
- Supabase Free, with the database in Central EU (Frankfurt), `eu-central-1`;
- the Supavisor transaction pooler for application traffic and the direct URL only for migrations and allowlisted logical exports;
- `pg` rather than `postgres.js` at the Fluid-compute boundary, because Vercel's `attachDatabasePool` helper requires the `pg` pool interface;
- a module-global `pg.Pool` with maximum 4 connections and 5-second idle timeout, attached with `attachDatabasePool`;
- Supabase's published CA installed in the client, certificate and hostname verification enabled, and Supabase SSL enforcement enabled; and
- synthetic, database-less previews. The two available Supabase Free projects are reserved for isolated production and staging resources.

This is a deliberately availability-limited envelope, not a production-HA design. Vercel Hobby and Supabase Free restrict or pause service at quota rather than billing overage. Supabase Free may also pause an inactive project. No SLA or automatic database failover is promised.

## Provisioned prototype

The disposable prototype was provisioned through the Vercel Marketplace without a card or paid subscription:

- Vercel project: `signal-web-app-prototype`, Hobby, zero recorded usage at creation;
- Supabase resource: `signal-postgres-prototype`, Free;
- database: PostgreSQL 17.6 on nano compute in Frankfurt;
- public application alias: <https://signal-web-app-prototype.vercel.app>;
- benchmark endpoint: bearer-token protected and backed only by a synthetic schema; and
- credentials: Vercel-managed plus a local ignored `.env.prototype.local`; no secret is committed.

The Vercel integration attached the prototype database to Development, Preview, and Production only for this disposable test. That attachment is not the intended production isolation model.

## Provider limits observed

The Supabase dashboard reported:

| Limit | Observed value |
| --- | ---: |
| Database size | 500 MB Free-plan quota |
| PostgreSQL connections | 60 |
| Supavisor underlying pool | 15 connections per user/database |
| Supavisor client connections | 200 |
| Active Free projects | 2 |
| Customer-restorable automatic backups | None shown |
| Point-in-time recovery | Not included |

The dashboard showed no backup and the Free plan excludes automatic backups and PITR. That does **not** prove Supabase creates no provider-internal recovery copy, nor establish a contractual media-deletion period. The user must accept that residual uncertainty for this $0 envelope; otherwise no candidate passes.

## Local correctness probe

The direct and pooled endpoints both connected. The probe confirmed:

- primary/writer connection, `read committed` default isolation, and `max_connections = 60`;
- transaction commit, rollback, and transaction-scoped advisory locking;
- zero failures across 315 synthetic transactions at stepped concurrency 1, 2, 4, 8, 16, and 32; and
- 18 observed connections for the database user at the peak, including provider-managed connections.

The 32-worker local step completed 160 transactions at 140.18 transactions/second with p50 203.09 ms, p95 239.22 ms, p99 360.66 ms, and maximum 440.36 ms. The synthetic database occupied approximately 10.4 MB after the probe.

## Deployed Fluid-compute probe

The deployed SvelteKit route ran with Node.js 24 in `fra1`, used a module-global four-connection `pg` pool, and attached that pool to Vercel's function lifecycle. The final bounded run produced:

| Simultaneous HTTP requests | Fluid instances observed | HTTP p50 | HTTP p95 | Failures | Maximum pool size |
| ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 1 | 245.42 ms | 245.42 ms | 0 | 1 |
| 4 | 2 | 235.16 ms | 260.93 ms | 0 | 4 |
| 8 | 4 | 124.98 ms | 587.75 ms | 0 | 4 |
| 16 | 8 | 144.09 ms | 620.96 ms | 0 | 4 |
| 32 | 19 | 140.72 ms | 648.97 ms | 0 | 4 |

One request running 16 concurrent transactions used all four pool connections, queued 12 waiters, completed in 744.68 ms, and had zero failures. Across the run, `pg_stat_activity` observed 17 connections for the database user. A separate earlier 32-request burst spread across 29 Fluid instances and also completed with zero failures.

The result proves short synthetic bursts, not sustained production capacity or provider failover. The implementation specification should start with:

- per-Fluid-instance pool maximum: **4**;
- Queue database-writing maximum concurrency: **8**;
- Workflow steps must not write to PostgreSQL directly; enqueue database work through that same capped consumer; and
- reserve the remaining Supavisor backend capacity for foreground traffic and administration, then lower the cap if sustained mixed-load testing shows pool wait or connection errors.

The Queue cap is conservative relative to the 15-connection Supavisor backend pool. It is an initial operational ceiling, not a throughput promise.

## TLS result

The Marketplace URL initially failed under `pg`'s certificate verification with `self-signed certificate in certificate chain`. Disabling certificate checks was rejected as an invalid fix.

The prototype instead:

1. installed Supabase's published `prod-ca-2021` root;
2. removed the connection-string `sslmode` before supplying the explicit trusted CA, preventing the parser from replacing the secure `ssl` object;
3. retained certificate and hostname verification; and
4. enabled “Enforce SSL on incoming connections” in Supabase.

After enforcement, a CA-verified Vercel transaction returned `200` from `fra1`, and a deliberate plaintext PostgreSQL connection was rejected with an SSL error.

## Cost and availability boundary

- [Vercel Hobby](https://vercel.com/docs/plans/hobby) is free. Vercel says Hobby projects are paused after exceeding included usage in most cases; on-demand Fluid usage is unavailable on Hobby.
- [Supabase Free cost control](https://supabase.com/docs/guides/platform/cost-control) says Free-plan usage is not charged. Continued quota excess leads to [service restrictions](https://supabase.com/docs/guides/platform/billing-faq), including pause, read-only mode, or HTTP 402 responses.
- Supabase Free includes two active projects, 500 MB per database, and no branching. [Supabase pricing](https://supabase.com/pricing)
- Free-plan service interruption and data loss are accepted for the owner-free initial envelope. Upgrading either platform requires a new explicit decision about payer and spend controls.

Vercel describes Hobby as intended for personal, non-commercial use. Before Signal becomes a commercial or organizational production service, plan eligibility must be re-evaluated even if usage remains within quota.

## Backup, deletion, and observability boundary

- Do not enable provider PITR, branching from production, or a paid plan with automatic whole-database backups.
- If Signal creates an application-owned logical export, use the direct URL and an explicit allowlist of private/user-scoped tables. Fail on every unclassified table; inspect the archive; encrypt before storage; exclude Shared Source Records and derivatives; and expire every version within seven days.
- No scoped backup target is selected by this prototype. It must itself have a hard `$0` boundary before the implementation can claim restorable backups.
- Keep database telemetry content-blind: connection counts, pool wait, transaction latency, error class, and anonymized cardinality only. Do not export statement text, bind values, or query samples.
- The dashboard cannot prove the absence of inaccessible provider recovery media. Provider-written confirmation remains necessary if that becomes a hard privacy gate again.

## Isolation and implementation locks

1. Use separate Supabase Free projects and distinct credentials for production and staging.
2. Never attach production or staging database credentials to Vercel Preview.
3. Preview deployments use schema-only local/synthetic data and no hosted database branch.
4. Pin all database-writing Vercel functions to `fra1`.
5. Use the transaction pooler for runtime traffic; use direct connections only for controlled migrations and allowlisted exports.
6. Use unnamed statements in transaction-pool mode; do not rely on session state, prepared statements, or session-scoped advisory locks.
7. Apply the pool and worker caps above and expose only content-blind saturation telemetry.
8. Treat free-tier pause, quota restriction, and lack of failover as expected states; the UI must fail closed and explain temporary unavailability.

## Remaining contradiction

This envelope supersedes the earlier Vercel Pro and production-HA assumptions. It therefore requires a follow-up architecture decision covering the owner-free hosting plan, synchronization cadence, free-tier service-stop behavior, preview strategy, and any changed durability promise. The existing architecture must not continue to imply paid Queue/Workflow/Cron behavior or automatic database failover.

## Reproduction

- `pnpm db:prototype` runs the local direct/pooled correctness and concurrency probe using ignored prototype credentials.
- `node scripts/prototype/benchmark-postgres-envelope.mjs` runs the token-protected deployed burst matrix when `PROTOTYPE_BENCHMARK_TOKEN` is available.
- `pnpm check` completed with zero errors and warnings.
- A reproducible Vercel Node.js 24 production build completed successfully with `@sveltejs/adapter-vercel`.

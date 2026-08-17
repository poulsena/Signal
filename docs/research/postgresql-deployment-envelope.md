# Managed PostgreSQL deployment envelope

Research date: 2026-08-17

## Current result

No documented Vercel Marketplace PostgreSQL offering satisfies the complete settled envelope:

- Vercel Functions and both databases must run in Frankfurt (`fra1` / provider equivalent), with no cross-region replica.
- Production requires automatic in-region HA/failover; staging may use a cheaper single compute.
- Signal may create only scoped logical backups of Signal-owned/private tables. Shared Source Records must not enter a restorative backup, and provider-managed whole-database backups or PITR are prohibited.
- The owner must pay $0, with no overage exposure. Credits, sponsorship, or another payer can make the owner's out-of-pocket amount $0, but they do not turn a paid plan into a documented free plan.

There is also an upstream contradiction before choosing a database: the decided architecture specifies Vercel Pro, while Vercel lists Pro at **$20/month** and describes Hobby—not Pro—as the $0 plan. Pro's $20 included usage credit is attached to the paid plan; the free Pro trial lasts 14 days. Therefore the complete deployment cannot have a durable, documented $0 list price unless a third party pays or the Vercel-plan decision changes. [Vercel pricing](https://vercel.com/pricing), [Vercel Pro trial](https://vercel.com/docs/plans/pro-plan/trials)

This is a constraint result, not a provider selection. A live prototype can validate behavior, but it cannot cure a documented paid base price or an unavoidable whole-database backup.

## Hard-gate comparison

Vercel's current storage documentation directs new Postgres projects to Marketplace providers and specifically names Neon, Supabase, and AWS Aurora PostgreSQL. The Marketplace also lists Nile and Prisma Postgres. [Vercel Marketplace storage](https://vercel.com/docs/marketplace-storage), [Vercel database integrations](https://vercel.com/marketplace/category/database)

| Marketplace candidate | Frankfurt and standard connection | Durable $0 / no overage | Production automatic HA | Can avoid whole-database recovery copies? | Gate result |
| --- | --- | --- | --- | --- | --- |
| Neon Free | Neon exposes AWS `eu-central-1` (Frankfurt), standard PostgreSQL connections, and PgBouncer pooling. [Neon Frankfurt example](https://neon.com/docs/manage/orgs-cli), [Neon pooling](https://neon.com/docs/connect/connection-pooling) | Explicit `$0`, no credit card, but limited to 100 CU-hours/project/month and 0.5 GB/project. The public pricing page does not state an enforceable production no-overage policy, so quota-exhaustion behavior still needs a live account check. [Neon pricing](https://neon.com/pricing) | Neon says automatic compute recovery normally takes seconds and redundant storage applies to every plan, including Free. It gives an SLA only to Scale and Business, so Free has no contractual availability/RTO commitment. [Neon HA](https://neon.com/blog/our-approach-to-high-availability), [Neon SLA](https://neon.com/sla) | **No.** Free includes six-hour time travel/restores, and Neon's security documentation says encrypted customer-data backups are retained for 30 days. There is no documented control that disables those copies. [Neon pricing](https://neon.com/pricing), [Neon security overview](https://neon.com/docs/security/security-overview) | Fails backup prohibition; end-to-end cost also fails because Vercel Pro is paid. |
| Supabase Free | Supabase offers AWS `eu-central-1` Frankfurt and a Supavisor transaction-mode endpoint intended for serverless clients. [Supabase regions](https://supabase.com/docs/guides/platform/regions), [Supabase connections](https://supabase.com/docs/guides/database/connecting-to-postgres) | Explicit `$0`, but only two active projects, 500 MB/project, and projects may pause after one week of inactivity. The two-project limit covers staging and production but leaves no database branching capacity; Branching is not included on Free. [Supabase pricing](https://supabase.com/pricing), [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod) | **No documented Free-plan automatic failover.** Supabase tells production users to use read replicas for disk-failure resilience, while read replicas are a paid add-on. [Supabase production checklist](https://supabase.com/docs/guides/deployment/going-into-prod), [Supabase billing](https://supabase.com/docs/guides/platform/billing-on-supabase) | The plan table says automatic backups and PITR are not included on Free, while the backup guide says automatic daily backups apply to Pro, Team, and Enterprise. That is promising but does **not** explicitly guarantee that no provider-internal whole-volume recovery copy exists; contractual confirmation is required. Paid plans fail because daily physical backups are automatic, and disabling PITR still produces new physical backups. [Supabase pricing](https://supabase.com/pricing), [Supabase backups](https://supabase.com/docs/guides/platform/backups) | Fails production HA and preview isolation; provider-internal backup absence remains unproven. |
| AWS Aurora PostgreSQL Express | Aurora is offered through Vercel Marketplace; Aurora Serverless Express is available in supported AWS regions including Frankfurt and provides a PostgreSQL-wire internet gateway. [Vercel AWS integration](https://vercel.com/marketplace/aws), [Aurora Express](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_GettingStartedAurora.AuroraPostgreSQL.ExpressConfig.html) | AWS offers new accounts an Aurora-capable Free Plan funded by credits, with no charges while it is active, but it expires after six months or when credits are exhausted. It is a prototype subsidy, not durable production pricing. [Aurora pricing](https://aws.amazon.com/rds/aurora/pricing/), [AWS Free Plan](https://docs.aws.amazon.com/awsaccountbilling/latest/aboutv2/free-tier-plans.html) | A writer plus an Aurora Replica in another AZ can fail over automatically using the writer endpoint; both instances are billable, and instance charges apply to replicas. [Aurora endpoints and failover](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Overview.Endpoints.html), [Aurora pricing](https://aws.amazon.com/rds/aurora/pricing/) | **No.** Aurora continuously backs up the whole cluster volume to S3, permits 1–35 days retention, defaults to one day, and explicitly says automated backups cannot be disabled. [Aurora backups](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.Managing.Backups.html) | Fails durable $0 and backup prohibition. |
| Nile Free | Nile's API documents `AWS_EU_CENTRAL_1`, and its Marketplace integration supplies a PostgreSQL URL. Nile also documents material PostgreSQL limitations, including unsupported user functions and triggers. [Nile create database](https://www.thenile.dev/docs/api-reference/databases/create-a-database), [Nile Vercel integration](https://www.thenile.dev/docs/integrations/vercel), [Nile compatibility](https://www.thenile.dev/docs/postgres/postgres-compatibility) | The Free plan lists `$0`, 1 GB, 50 million query tokens, and 500 connections, but also publishes per-unit overage prices and does not document a hard zero-spend cap. [Nile pricing](https://www.thenile.dev/pricing) | **Not documented.** Free has no SLA, and the public provider material found does not specify automatic compute failover, failure domains, RTO, or RPO. [Nile pricing](https://www.thenile.dev/pricing) | Nile says its support-assisted three-times-daily backups are paid-tier only, but it does not contractually state that Free has no internal whole-database recovery copies or publish a deletion timeline. [Nile backup and restore](https://www.thenile.dev/docs/support/backup_restore) | Fails documented HA; zero-overage and backup absence are unproven. |
| Prisma Postgres | Vercel's Marketplace page says the integration currently requires Prisma ORM for migrations and queries. That conflicts with Signal's existing `postgres.js`/Drizzle standard-Postgres path, so it is not an interchangeable candidate for this ticket. [Vercel Prisma integration](https://vercel.com/marketplace/prisma) | Not evaluated further. | Not evaluated further. | Not evaluated further. | Excluded by client/migration constraint. |

### What the table means for the human decision

- **No candidate passes all gates.** Neon Free comes closest on documented automatic recovery and $0 database list price, but its 30-day provider backup retention directly violates the backup boundary.
- **Supabase Free comes closest on absence of a customer-restorable backup feature**, but lacks production automatic HA and ephemeral database branching; the absence of internal recovery copies is not guaranteed.
- **Aurora has the clearest conventional in-region failover**, but its mandatory continuous whole-cluster backup is dispositive, and its free funding is temporary.
- **Nile Free has insufficient public guarantees** for automatic HA, hard cost capping, backup absence, deletion timing, and full PostgreSQL semantics.
- A grant, sponsor, or platform credit may satisfy “owner out-of-pocket $0” while it lasts, but the exact payer, duration, renewal, and overage liability must be recorded. Without that evidence, paid Vercel Pro and paid production database plans remain noncompliant.

## Envelope to validate if the hard conflicts are resolved

### Region and isolation

Set the application region explicitly to Vercel Frankfurt `fra1`, and provision the database in the provider's Frankfurt region. Vercel advises colocating Functions and the database to reduce latency; its regional configuration names `fra1` as Frankfurt. [Vercel Function regions](https://vercel.com/docs/functions/configuring-functions/region), [Vercel storage guidance](https://vercel.com/docs/storage)

Production and staging must be separate provider resources with separate credentials and separate Vercel projects/environments. Preview deployments must receive synthetic data only. Supabase preview branches are data-less by default and can be seeded, whereas Neon's Vercel workflow normally creates a copy-on-write branch from the linked parent; a Neon preview would therefore require a verified schema-only workflow and must never branch production data. [Supabase branching](https://supabase.com/docs/guides/deployment/branching), [Neon branching workflow](https://neon.com/docs/get-started-with-neon/workflow-primer)

### PostgreSQL connections and transactions

Use a module-global, bounded application pool under Fluid compute. Vercel recommends reusing a global pool, attaching its lifecycle to the function, and using a short idle timeout; Fluid may run multiple invocations concurrently in one instance. Exact pool and invocation limits must be measured, not inferred from provider connection ceilings. [Vercel pooling with Functions](https://examples.vercel.com/kb/guide/connection-pooling-with-functions), [Vercel Fluid compute](https://vercel.com/docs/fluid-compute)

Use the provider's transaction-pooled URL for request/work-item traffic and a direct connection for migrations and `pg_dump`. Neon documents PgBouncer transaction mode and its session-feature limitations. Supabase documents Supavisor transaction mode for serverless traffic and requires prepared statements to be disabled for `postgres.js` (`prepare: false`). [Neon pooling](https://neon.com/docs/connect/connection-pooling), [Supabase connections](https://supabase.com/docs/guides/database/connecting-to-postgres), [Supabase `postgres.js` prepared statements](https://supabase.com/docs/guides/troubleshooting/disabling-prepared-statements-qL8lEL)

Aurora Express does not support RDS Proxy because Express has no VPC, while RDS Proxy cannot be public. It would therefore depend on a carefully bounded application pool and reconnection logic; Vercel's documented pool helper targets `pg`-style pools, so compatibility with this repository's `postgres.js` client is a prototype item. [Aurora Express limitations](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_GettingStartedAurora.AuroraPostgreSQL.ExpressConfig.html), [RDS Proxy](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/rds-proxy.html)

### Scoped logical backup

If a qualifying provider exists, the application-owned backup must use an explicit allowlist of private schemas/tables rather than an exclusion-only rule. PostgreSQL documents that `pg_dump` produces a consistent export while the database is in use and supports table/schema include and exclude filters; it also warns that selected-table dumps do not automatically include every dependent object. [PostgreSQL `pg_dump`](https://www.postgresql.org/docs/current/app-pgdump.html)

The backup job must:

1. connect directly rather than through a transaction pooler;
2. fail if any table is unclassified;
3. prove from the archive table of contents that no Shared Source Record or derivative table is present;
4. encrypt before upload with a key outside the database;
5. expire every current and noncurrent object version within seven days; and
6. restore into an empty synthetic target in a scheduled drill, applying deletion tombstones before serving reads.

Those are application acceptance requirements. They do not make a provider's separate whole-database backup compliant.

### Content-blind telemetry and purge

Collect only connection counts, pool wait time, transaction latency, error classes, replica/failover state, queue depth, and anonymized cardinalities. Disable statement text, bind values, query samples, and provider query-history features wherever possible. Supabase's Postgres log schema includes an `event_message`, and Neon offers Postgres log export on Scale; both therefore require a canary audit rather than an assumption that telemetry is content-blind. [Supabase logs](https://supabase.com/docs/guides/monitoring-and-debugging/logs), [Neon logs and OpenTelemetry](https://neon.com/blog/logs-open-telemetry)

The 15-minute online purge test must seed a unique synthetic source canary into every online representation—primary tables, projections, caches, pending Queue messages, and Workflow state—then delete it and poll all representations until absent. It must be repeated during failover and worker retry. Provider backups/time travel are a separate hard gate and cannot be counted as “offline” merely because the application cannot query them.

### Queue and Workflow concurrency

Vercel Queue delivery is at-least-once and its push consumer has an explicit maximum-concurrency control; the API documents unlimited concurrency as the default. Signal must therefore set a finite limit, make handlers idempotent, and size the limit against measured database connections. [Vercel Queues](https://vercel.com/docs/queues), [Vercel Queues API](https://vercel.com/docs/queues/api)

No equivalent stable public Workflow concurrency guarantee was found. The official Workflow repository discusses concurrency controls as an RFC, while Workflow may execute independent steps in parallel. Until a supported control is verified, database-writing Workflow steps must pass through the same capped Queue or an application-level database semaphore. [Workflow concurrency RFC](https://github.com/vercel/workflow/discussions/301), [Workflow event sourcing](https://vercel.com/changelog/workflow-event-sourcing)

## Required live prototype and contractual checks

The prototype should stop at the first failed hard gate. It should use synthetic data only.

1. **Billing:** provision through Vercel Marketplace in a disposable account; record plan, region, required card, invoices, marketplace pass-through fees, quota behavior, and a provider/Vercel mechanism that makes overage impossible. Separately identify who pays the Vercel Pro base charge and for how long. Alerts are not a hard cap.
2. **Backup control:** inspect every backup, PITR, history, branch, snapshot, and delete setting through console and API. Obtain provider-written confirmation that no whole-database recovery copy is created and that deleted data cannot be restored. A black-box test cannot establish absence from inaccessible provider media.
3. **HA:** force or request an in-region compute/AZ failure with an open transaction. Measure disconnects, aborted transactions, reconnect behavior, RTO, RPO, duplicate Queue delivery, and recovery through the unchanged endpoint. Verify no cross-region replica is created.
4. **Pooling:** exercise `postgres.js` under deployed Fluid compute at stepped foreground and worker concurrency, including a rolling deployment and cold/warm instances. Record `pg_stat_activity`, provider connection metrics, pool wait, transaction failures, and connection recovery.
5. **Concurrency:** set a finite Queue maximum, run mixed foreground/Queue/Workflow load, and derive a safe cap from observed connections after reserving capacity for foreground traffic, migrations, and administration. Do not use the Queue default.
6. **Correctness:** run concurrent transaction, isolation/retry, advisory-lock, migration, and failover tests through both runtime and direct URLs. Confirm any pooler session limitations do not change the correctness boundary.
7. **Preview isolation:** prove a pull request can create and destroy a synthetic, data-less preview without ever receiving production credentials or copied production pages; verify provider resources and Vercel environment variables are removed on teardown.
8. **Scoped backup/restore:** dump only allowlisted private tables during write load, inspect the archive, encrypt it, restore it, apply tombstones, and demonstrate lifecycle expiry within seven days.
9. **Purge and telemetry:** run unique canary values through the 15-minute purge drill, then inspect application, Vercel, provider query history, database logs, metrics, traces, and exports for content leakage.
10. **Deletion:** delete only a synthetic disposable project and verify immediate credential revocation and documented media-erasure timing. Provider contractual retention/deletion language—not dashboard disappearance—is the acceptance evidence.

## Decision boundary

The present primary-source evidence yields no deployable choice. The unresolved human decision is whether to change at least one hard premise—Vercel Pro at owner cost $0, automatic production HA on a free tier, or the ban on provider-internal whole-database recovery copies—or obtain durable third-party payment plus provider-specific contractual guarantees. This note does not choose among those options.

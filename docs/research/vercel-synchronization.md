# Durable near-real-time GitHub synchronization on Vercel

_Research date: 2026-08-12. Scope: current first-party Vercel and GitHub documentation._

## Decision

Vercel is a viable host for Signal's synchronization plane, with two conditions:

1. **Postgres, not a function or queue alone, is the durable system of record for receipt and progress.** The webhook route should authenticate the raw request, insert an immutable inbox row plus an outbox row in one database transaction, and return `202` only after that commit. A Vercel Queue message containing only the inbox ID can then drive low-latency processing. This closes the gap created by GitHub's refusal to automatically retry failed webhook deliveries and keeps correctness independent of the queue's current public-beta status. GitHub requires a `2xx` within 10 seconds and explicitly recommends asynchronous processing; it also says failed deliveries are not automatically redelivered. ([GitHub webhook best practices](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks), [failed delivery handling](https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries), [Vercel Queues](https://vercel.com/docs/queues), [Vercel release phases](https://vercel.com/docs/release-phases))
2. **Run a reconciliation path in addition to webhooks.** Webhooks provide freshness, not completeness. Reconciliation and backfill should page through GitHub's authoritative API, upsert current resource state, and use the same idempotent write path as webhook consumers. This covers failed or oversized webhook deliveries, application downtime, bugs, and manual GitHub changes whose event was missed.

For a professional multi-user deployment, **Pro is the practical floor**: Hobby is intended for non-commercial personal projects and restricts Cron to once daily with up to 59 minutes of timing variance, whereas Pro supports per-minute Cron, paid overage, longer observability retention, and drains. ([Vercel plans](https://vercel.com/docs/plans), [Cron pricing and limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Vercel pricing](https://vercel.com/pricing))

## Recommended topology

```text
GitHub App webhook
       |
       v
regional Node.js Function (verify HMAC, validate event, <10 s)
       |
       v
Postgres transaction
  webhook_inbox (unique installation_id + delivery_id, raw payload/status)
  sync_outbox   (pending work)
       |
       +---- best-effort immediate publish ----> Vercel Queue (inbox ID only)
       |                                           |
       +---- Cron/Workflow republishes pending ----+
                                                   v
                                      idempotent queue consumer
                                      fetch authoritative GitHub state
                                                   |
                                                   v
                                      Postgres upsert + inbox complete
                                                   |
                                                   v
                                      UI refresh/realtime notification

Cron -> reconciliation Workflow -> paged GitHub reads -> same upsert path
UI/API -> on-demand backfill Workflow -> same paged path + progress rows
```

The immediate queue publish is an accelerator, not the durable handoff. If it fails after the database transaction, the outbox remains discoverable and can be republished by a short scheduled dispatcher. Returning `202` after the database commit is safe because the request is already recoverable locally. If the database commit fails, return a non-`2xx`, record the failure in platform telemetry, and rely on automated inspection/redelivery of recent GitHub failures plus reconciliation; GitHub retains delivery details and permits redelivery for only three days. ([GitHub redelivery](https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/redelivering-webhooks))

## Primitive selection

| Concern | Recommended primitive | Why / boundary |
| --- | --- | --- |
| Public webhook receipt | Regional Node.js Vercel Function + Postgres inbox/outbox transaction | Functions are appropriate for the short authenticated request. `waitUntil()`/Next.js `after()` is not the durable handoff: it remains bound by the function timeout and is cancelled when the function times out. ([Vercel Functions API](https://vercel.com/docs/functions/functions-api-reference/vercel-functions-package)) |
| High-volume one-step event work | Vercel Queues push consumer | Queues provide synchronous three-availability-zone persistence before publish returns, at-least-once delivery, visibility leases, retries, concurrency limits, and idempotency keys. Queue consumers must still be idempotent and order-independent. ([Queues concepts](https://vercel.com/docs/queues/concepts), [Queues API](https://vercel.com/docs/queues/api)) |
| Multi-page backfill, reconciliation, or multi-step repair | Vercel Workflow, with progress/checkpoints also visible in Postgres | Workflows are GA and provide durable step state, retries, sleeps/hooks without continuous compute, and run/step observability. Queues remain the better lower-level event-delivery primitive. ([Vercel Workflows GA](https://vercel.com/blog/a-new-programming-model-for-durable-execution), [Queues versus Workflow](https://vercel.com/docs/queues/concepts)) |
| Periodic trigger | Vercel Cron invokes a thin dispatcher or starts a Workflow | Cron does not retry failed invocations and has normal Function duration limits, so it must only schedule durable work, not own the full scan. ([Managing Cron Jobs](https://vercel.com/docs/cron-jobs/manage-cron-jobs)) |
| Canonical state, deduplication, progress, recovery | Marketplace Postgres | Vercel Postgres itself has been retired; Vercel connects external Postgres providers through Marketplace. Locate the database and Functions together and use pooling. ([Postgres on Vercel](https://vercel.com/docs/postgres), [Marketplace storage](https://vercel.com/docs/marketplace-storage)) |
| UI freshness | Poll canonical state first; adopt managed realtime or Vercel WebSockets only if measured UX requires sub-second push | Native Function WebSockets are new and their upgrade API is experimental. Connections are instance-pinned, end at Function maximum duration, require reconnects, and need an external pub/sub/state layer across instances. ([WebSocket support](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections), [Vercel WebSocket architecture](https://vercel.com/kb/guide/real-time-chat-websockets)) |

### Why not Queue-only receipt?

An accepted Queue message is durable and replicated, so Queue-only receipt can work technically. It is not the recommended production boundary today because Queues is still public beta and Vercel says beta products are not covered by the Enterprise SLA and are not recommended for a full production environment. A database inbox also supplies the audit trail, permanent deduplication window, replay controls, and operator-visible state that Queue retention cannot. ([Vercel Queues public beta](https://vercel.com/changelog/vercel-queues-now-in-public-beta), [release phases](https://vercel.com/docs/release-phases))

Workflow is GA and is the safer managed abstraction for long-running orchestration, but starting a Workflow for every small webhook adds events, stored state, and cost without replacing the need for resource-level idempotency. Use it for a synchronization run, not necessarily each delivery.

## Receipt, retries, ordering, and idempotency

### Facts

- GitHub signs the exact request body in `X-Hub-Signature-256`; validation should use HMAC-SHA256 and a constant-time comparison. `X-GitHub-Delivery` is globally unique and remains the same when a delivery is manually redelivered. ([signature validation](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries), [webhook best practices](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks))
- GitHub webhook payloads can be as large as 25 MB, while a Vercel Function request or response body is limited to 4.5 MB. GitHub does not send an event whose payload exceeds its own cap, and Vercel will reject a request over its lower cap. ([GitHub webhook payloads](https://docs.github.com/en/webhooks/webhook-events-and-payloads), [Vercel Function limits](https://vercel.com/docs/functions/limitations))
- Queues deliver at least once, not exactly once. The visibility timeout defaults to 60 seconds and is configurable/extendable up to 60 minutes. Delivery continues until acknowledgment or message expiry. Strict FIFO ordering is not guaranteed; retries are lower priority than new messages. ([Vercel Queues](https://vercel.com/docs/queues), [Queues API](https://vercel.com/docs/queues/api))
- Queue publish idempotency keys deduplicate only while the original message exists. The current maximum TTL/delay is seven days and the default TTL remains 24 hours. There is no built-in dead-letter queue; poison-message policy belongs in the consumer. ([seven-day Queue TTL](https://vercel.com/changelog/queues-now-supports-7-day-ttl), [Vercel Queues](https://vercel.com/docs/queues))

### Architectural consequences

- Put a unique database constraint on `(installation_id, github_delivery_id)`. Queue deduplication is an optimization; the database constraint is the permanent guarantee.
- Store `event`, `action`, hook/installation/repository identifiers, receive time, payload byte count, payload or an encrypted pointer to it, attempt count, status, and last error. Do not log secrets or full payloads.
- Publish a small versioned message such as `{ schemaVersion, inboxId }`, not the raw webhook. This avoids duplicating sensitive data, makes the database the replay source, and sidesteps an undocumented queue-payload dependency.
- Upsert resources by immutable GitHub ID and compare authoritative `updated_at`/version information. Prefer fetching current GitHub state to applying webhook deltas blindly. A retried or out-of-order older event must not overwrite newer state; deletion/tombstone events need an explicit monotonic rule.
- Acknowledge the Queue message only after the database transaction commits. On a transient GitHub/database error, let it retry with bounded exponential backoff and jitter. On a permanent validation/permission/not-found result, record a terminal status and acknowledge it. Persist poison events for operator replay because Queues has no native DLQ.
- Keep the 10-second ingress budget dominated by raw-body read, signature validation, and one local-region transaction. Monitor payload sizes because the 4.5 MB Vercel limit is lower than GitHub's 25 MB cap; reconciliation is the only general recovery for an event Vercel never accepts.

## Backfill and reconciliation

Use one durable `sync_run` per installation/repository and synchronization kind (`initial`, `reconcile`, `manual`). Enforce at most one active full scan for a scope with a database uniqueness/advisory-lock rule; duplicate requests should attach to the existing run.

Each Workflow step should fetch one bounded page, upsert it transactionally, persist the next cursor/watermark and rate-limit headers, then schedule the next page. The REST issues endpoint supports `since`, sorting by `updated`, and at most 100 results per page; it also returns pull requests, which must be filtered if Signal wants issues only. ([GitHub issues REST API](https://docs.github.com/en/rest/issues/issues))

For ongoing reconciliation:

1. Read from a persisted high-water mark with an overlap window rather than an exact timestamp boundary.
2. Sort by `updated`, page deterministically, and make every write idempotent.
3. Advance the high-water mark only after all pages for the window commit.
4. Periodically perform a slower complete inventory/tombstone sweep, because an updated-time incremental scan alone may not reveal every deletion or inaccessible resource.
5. Expose progress (`queued/running/completed/failed`, pages/items, watermark, error, timestamps) from Postgres so the UI and operators do not depend on temporary Workflow logs.

GitHub App installation tokens start at 5,000 REST requests/hour, scale for larger non-Enterprise installations up to 12,500/hour, and receive 15,000/hour for Enterprise Cloud organizations. Secondary limits include at most 100 concurrent REST+GraphQL requests and 900 REST points/minute; these secondary thresholds can change. Workers must honor `retry-after` and `x-ratelimit-reset`, cap concurrency per installation, and back off rather than hot-retry. ([GitHub REST rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)) Conditional authenticated requests that return `304` do not consume the primary rate limit and are useful for polling/reconciliation. ([GitHub REST best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api))

The periodic job should also inspect GitHub's recent failed webhook deliveries and request redelivery where permissions allow, but that is a three-day repair aid—not the source of truth. API reconciliation remains mandatory.

## Execution and plan boundaries

| Boundary | Current fact | Design impact |
| --- | --- | --- |
| GitHub response deadline | `2xx` within 10 seconds; no automatic failed-delivery retry. ([GitHub](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks)) | Commit inbox quickly; never run synchronization inline. |
| Function payload | 4.5 MB request and response. ([Vercel](https://vercel.com/docs/functions/limitations)) | Monitor webhook size; select only required events; reconcile missing state. |
| Fluid Function duration | Default is 300 s on all plans. Hobby max is 300 s. Pro/Enterprise have an 800 s established max; supported Node.js/Python Functions can opt into 1,800 s, but durations above 800 s are beta and require Fluid compute. ([duration configuration](https://vercel.com/docs/functions/configuring-functions/duration), [30-minute update](https://vercel.com/changelog/vercel-functions-can-now-run-up-to-30-minutes)) | Bound every worker/page well below the stable limit; rely on Workflow/Queue checkpoints, not a 30-minute invocation. |
| Queue lifecycle | Public beta on all plans; at-least-once; 24 h default and 7 d max TTL; 60 min max visibility lease; no DLQ. ([Queues](https://vercel.com/docs/queues), [TTL update](https://vercel.com/changelog/queues-now-supports-7-day-ttl)) | Database inbox/outbox is the durable recovery and poison ledger. |
| Queue price | Pricing lists 1M Queue API operations/month on Hobby and Pro usage starting at $0.60/M operations; push consumers also incur Function usage. ([pricing](https://vercel.com/pricing), [Queues beta announcement](https://vercel.com/changelog/vercel-queues-now-in-public-beta)) | Estimate operations as publish + receive/ack/retry, not webhook count alone. |
| Workflow price | Pricing lists 50K events/month and 1 GB written on Hobby; Pro rates are $20/M events, $0.50/GB written, and $0.50/GB-month retained. ([pricing](https://vercel.com/pricing)) | Prefer Workflow per scan/run rather than reflexively per small event; measure event amplification. |
| Cron | 100 jobs/project. Hobby: at most daily and hourly precision; Pro/Enterprise: at most once per minute with per-minute precision. Failed calls are not retried. ([Cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Cron management](https://vercel.com/docs/cron-jobs/manage-cron-jobs)) | Pro enables useful reconciliation/dispatcher cadence; Cron only starts durable work. |
| Runtime logs | Hobby 1 h, Pro 1 d, Enterprise 3 d; Observability Plus gives 30 d. Drains are Pro/Enterprise and cost $0.50/GB on Pro. ([pricing](https://vercel.com/pricing), [Drains](https://vercel.com/docs/drains)) | Durable sync state and alerts cannot live only in logs. |

## Postgres connectivity and transactions

Vercel now provisions Postgres through external Marketplace providers such as Neon, Supabase, or Aurora rather than a Vercel-owned Postgres service. Marketplace credentials are injected as environment variables. Vercel recommends placing Functions near the database and using serverless/provider pooling or PgBouncer. ([Postgres on Vercel](https://vercel.com/docs/postgres), [Marketplace storage](https://vercel.com/docs/marketplace-storage))

With Fluid compute, create the driver pool at module scope, release clients after each transaction, keep idle timeouts low, and use `attachDatabasePool()` so idle connections close before an instance is suspended. Fluid instances can serve concurrent requests, so `max = 1` does not cap total connections and damages concurrency; queue consumer concurrency must also be capped to what the database and GitHub installation can sustain. ([Vercel connection pooling](https://vercel.com/kb/guide/connection-pooling-with-functions))

The exact Postgres provider, region, pool limits, backup/PITR guarantees, realtime support, and price remain a separate deployment decision. They must be selected and load-tested together with the Queue consumer concurrency.

## Regions and deployment behavior

- New Function projects default to `iad1`. Functions should execute near their database. Pro can deploy Functions to up to three regions; Enterprise can use more regions and configure explicit Function failover regions. ([Function regions](https://vercel.com/docs/functions/configuring-functions/region))
- A Queue is created in one of Vercel's regions and synchronously replicated across three availability zones within that region. During regional outage handling, messages may temporarily be stored in a neighboring region; strict regional data residency is not supported. ([Vercel Queues](https://vercel.com/docs/queues))
- Queue topics are partitioned by deployment ID by default; in push mode a message returns to the deployment that published it, allowing old deployments to drain after a rollout. Include an explicit application schema version anyway, and set deployment retention long enough for the maximum Queue TTL. ([Vercel Queues](https://vercel.com/docs/queues))

**Inference:** start with one write region containing ingress, Queue, consumers, Workflow steps, and the primary Postgres endpoint. Multi-region ingress offers little value if every request still crosses regions to a single writer, and it increases connection and consistency complexity. If residency or regional failover is a requirement, prototype the complete database + Queue behavior rather than assuming Function multi-region settings make the state layer resilient.

## Near-real-time UI delivery

The correctness boundary is a committed Postgres revision, not a socket notification. Initially, have active clients poll a small conditional endpoint every 2-5 seconds, refetch on focus/reconnect, and render `lastSyncedAt` plus active `sync_run` progress. Cache by revision/ETag so unchanged polls are cheap. This is enough to validate whether users actually need sub-second delivery and avoids coupling the first synchronization implementation to another beta primitive.

If measurement shows that polling is insufficient, choose one of:

- a Postgres provider's managed realtime/changefeed facility, after the provider decision; or
- Vercel Function WebSockets plus an external Redis/pub-sub layer. Vercel now supports WebSockets, but connections are pinned to one Function, end when its maximum duration is reached, and future connections can land on another instance. The current Next.js upgrade helper is experimental, so clients must reconnect with backoff and always re-read canonical state after reconnect. ([WebSocket support](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections), [realtime architecture](https://vercel.com/kb/guide/real-time-chat-websockets))

Publish UI invalidation only after the resource transaction commits. Notifications may be duplicated or lost; payloads should carry a scope and revision, and receiving one should trigger a canonical fetch rather than be treated as state.

## Observability and operations

Vercel's Queue view exposes messages/second, totals queued/received/deleted, processing rate by consumer group, and maximum message age. Workflow run views expose step progress, payloads, outputs, performance, and run/step-filtered logs. ([Queue observability](https://vercel.com/docs/queues/observability), [Workflow log filtering](https://vercel.com/changelog/logs-filtering-for-vercel-workflows-now-available)) Vercel also supports OpenTelemetry instrumentation and Pro/Enterprise drains for persistent external telemetry. ([Vercel tracing](https://vercel.com/docs/tracing), [Drains](https://vercel.com/docs/drains))

Instrument and alert on:

- webhook acceptance latency, signature failures, payload bytes, database receipt failures;
- oldest pending inbox/outbox row, Queue maximum age, delivery count, terminal poison count;
- per-installation `source_updated_at -> committed_at` synchronization lag;
- backfill/reconciliation run age, page/item throughput, GitHub remaining/reset headers, `403`/`429` counts;
- reconciliation drift (resources inserted/updated/tombstoned despite no processed webhook);
- UI revision-to-observation latency.

Every log/span should carry `github_delivery_id`, `installation_id`, repository ID, `inbox_id`, Queue message ID, `sync_run_id`, Workflow run/step IDs, deployment ID, and execution region as applicable. The database should retain the current status and bounded error history because platform log retention is short on base plans.

## Unknowns requiring prototype or measurement

1. **Ingress envelope:** capture real payload-size distribution for only the GitHub events Signal subscribes to and test behavior near Vercel's 4.5 MB request limit.
2. **Durable handoff latency/failure modes:** inject failures between inbox commit, immediate Queue publish, Queue consumption, and acknowledgment; prove that the outbox dispatcher recovers every state without double-applying it.
3. **Queue beta readiness:** validate current SDK/API payload limits, throughput/rate limits, deployment draining, poison-message handling, observability retention, and support/SLA expectations. These are not all specified in current public documentation.
4. **Workflow economics and history growth:** measure events/data written per initial sync and large reconciliation, step replay overhead, cancellation, and behavior across deployments.
5. **GitHub inventory semantics:** define every Signal-owned resource and prove deletion/transfer/permission-loss detection; determine which REST/GraphQL endpoints provide reliable updated-time scans and conditional requests.
6. **Provider/database envelope:** select a Marketplace Postgres provider/region/plan, then load-test connection pool size, Queue concurrency, transaction latency, PITR, and failover.
7. **Freshness target:** measure webhook-to-commit and commit-to-visible p50/p95/p99. Decide whether 2-5 second polling meets the product target before adopting WebSockets or provider realtime.
8. **Regional failure:** test ingress and recovery during Queue, Function, and database regional impairment. Vercel Queue failover may move data temporarily, while database failover is provider-specific.

## Acceptance criteria for the later synchronization design

The later design should not be accepted until it demonstrates:

- a verified webhook is either durably committed within 10 seconds or visibly failed;
- replaying any delivery or processing events out of order leaves the same canonical state;
- a committed but unpublished inbox row is eventually processed;
- a killed/timed-out consumer is retried without duplicate effects;
- initial and on-demand backfills resume from checkpoints and respect GitHub limits;
- reconciliation repairs deliberately dropped webhook events and records drift;
- deployments can roll while old Queue work drains safely;
- an operator can identify and replay poison work from durable records;
- the UI recovers canonical state after missed notifications or reconnect;
- measured cost and latency fit the selected Vercel and Postgres plans.

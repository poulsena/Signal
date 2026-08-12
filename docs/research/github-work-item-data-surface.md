# GitHub work-item data surface

_Research date: 2026-08-12. Target: GitHub.com, REST API version `2026-03-10`, and the current GitHub GraphQL schema._

## Decision summary

A GitHub App can build a high-fidelity **current read model** of an Issue or Pull Request, but no single API is complete and GitHub does not expose an immutable, indefinitely retained event log. The practical design is:

1. use webhooks as change hints and persist every accepted delivery;
2. rehydrate authoritative current state from REST and GraphQL after each hint;
3. backfill with the Issue/PR timeline plus resource-specific collections;
4. treat edit history, deletions, inaccessible cross-references, human draft reviews, oversized PRs, and expired Actions detail as explicitly lossy.

REST is the broad, stable baseline. GraphQL is required for the deepest work-item graph: resolved review threads, typed timeline unions, Projects v2 field values, dependencies and hierarchy, content edit history, and viewer-dependent fields. Checks/statuses and Actions are separate resources keyed by commit SHA, not embedded PR history. GitHub's general activity Events API is unsuitable as a ledger because it is limited to 300 events and 30 days and can lag by up to six hours ([Events REST API](https://docs.github.com/en/rest/activity/events?apiVersion=2026-03-10)).

## Recommended canonical read

For each `repository + number`:

| Layer | Fetch | What it contributes |
| --- | --- | --- |
| Work item | REST `GET /repos/{owner}/{repo}/issues/{number}`; for a PR also `GET /repos/{owner}/{repo}/pulls/{number}` | Shared issue state plus PR-specific refs, merge and diff metadata |
| Conversation | Issue comments, reactions, PR reviews, review comments; GraphQL `reviewThreads` | Conversation bodies, authors, review state, diff anchors, replies, thread resolution |
| Activity | REST issue timeline and/or GraphQL `timelineItems` | Typed state changes and the interleaved timeline |
| Code | PR commits/files; commit/Git APIs when needed | Current PR commit membership, SHAs, patches and file stats |
| Quality | check suites/runs/annotations, commit statuses, optionally Actions runs/jobs/logs | Current and repeated check results and provider detail |
| Planning | labels, milestone, assignees, issue type/fields, sub-issues/dependencies, Projects v2 items/fields | Current planning context and selected changes |
| Identity | REST users/apps and GraphQL `Actor` objects | Stable IDs plus mutable display/login data and actor kind |

Every pull request is also an issue. GitHub explicitly directs integrations to use Issues endpoints for shared properties such as assignees, labels, milestones, and conversation comments ([Pull requests REST API](https://docs.github.com/en/rest/pulls/pulls)).

## Facts: resource coverage

### Issue and Pull Request details

The REST Issue representation supplies the repository-local number, database `id`, GraphQL `node_id`, title/body, author and association, state and `state_reason`, timestamps, lock state, labels, assignees, milestone, comment count, pinned comment, and a `pull_request` marker when the item is a PR. Current REST also has dedicated endpoints for issue field values and sub-issues ([Issues REST API](https://docs.github.com/en/rest/issues/issues), [Issue field values REST API](https://docs.github.com/en/rest/issues/issue-field-values?apiVersion=2026-03-10), [Sub-issues REST API](https://docs.github.com/en/rest/issues/sub-issues)). Labels and milestones are first-class resources with their own numeric and node identifiers ([Labels REST API](https://docs.github.com/en/rest/issues/labels), [Milestones REST API](https://docs.github.com/en/rest/issues/milestones)).

The REST Pull Request representation adds head/base repositories, refs and SHAs; draft/merged/mergeable state; merge commit; requested reviewers; auto-merge; additions, deletions, changed-file and commit counts; and links to commits, statuses, issue comments and review comments. The PR endpoint also serves raw diff or patch media types ([Pull requests REST API](https://docs.github.com/en/rest/pulls/pulls)).

GraphQL exposes a wider, composable graph. Current `Issue` fields include `issueType`, `issueFieldValues`, `parent`, `subIssues`, `blockedBy`, `blocking`, `linkedBranches`, `duplicateOf`, `pinnedIssueComment`, `projectItems`, reactions, content edits and the typed timeline. Current `PullRequest` fields include refs/OIDs, current files and commits, `reviewThreads`, `reviewDecision`, `statusCheckRollup`, auto-merge/merge-queue state, Projects v2 items and content edits ([GraphQL Issues reference](https://docs.github.com/en/graphql/reference/issues), [GraphQL Pull requests reference](https://docs.github.com/en/graphql/reference/pulls)).

Issue custom fields are distinct from Projects custom fields. Current GitHub Issues supports text, number, date, single-select and multi-select field values; fields can be public or organization-only, and changes appear in the issue timeline only for viewers allowed to see them. Pull requests do not support issue fields ([Adding and managing issue fields](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/adding-and-managing-issue-fields)).

### Comments, reactions, reviews and threads

PR “Conversation” comments are Issue comments. Fetch them through `GET /issues/{number}/comments`; REST returns raw Markdown, author, author association, timestamps, minimization state and IDs, while media types can request rendered HTML or plain text. Reactions are separately listable and GraphQL exposes reaction groups and reactors ([Issue comments REST API](https://docs.github.com/en/rest/issues/comments), [Reactions REST API](https://docs.github.com/en/rest/reactions/reactions)).

Inline PR review comments are a separate resource. They carry review ID, path, diff hunk, original/current commit, side and line/range coordinates, reply linkage, author, body and timestamps. The per-PR list defaults to ascending ID and supports sorting by creation/update plus an update-time `since` filter ([Pull request review comments REST API](https://docs.github.com/en/rest/pulls/comments)).

Reviews group zero or more inline comments under a state (`APPROVED`, `CHANGES_REQUESTED`, `COMMENTED`, `DISMISSED`, or `PENDING`), optional body, reviewer and commit. REST lists submitted reviews chronologically and exposes dismissal state and the review's comments ([Pull request reviews REST API](https://docs.github.com/en/rest/pulls/reviews)). Requested users/teams are a separate current-state collection; a user disappears from it after submitting a review ([Review requests REST API](https://docs.github.com/en/rest/pulls/review-requests)).

GraphQL is the authoritative convenient surface for review **threads**, not just flat comments: `PullRequestReviewThread` exposes its comments, path/line subject, outdated/resolved state, and `resolvedBy` ([GraphQL Pull requests reference](https://docs.github.com/en/graphql/reference/pulls)). This is necessary to reproduce GitHub's resolved-conversation UI without heuristically grouping REST replies.

GraphQL user-authored content exposes `editor`, `lastEditedAt`, and a paginated `userContentEdits` connection. Each `UserContentEdit` can contain editor, edit time and a textual diff, plus deletion metadata ([GraphQL Issues reference](https://docs.github.com/en/graphql/reference/issues), [GraphQL Users reference](https://docs.github.com/en/graphql/reference/users)). GitHub's UI documentation states that issue-body edit history is available unless the author or a writer removes it, so it is not an immutable audit trail ([Editing an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/editing-an-issue)).

### Timeline and state changes

REST offers two related collections:

- `/issues/{number}/events` is the state-change-oriented Issue Events collection and includes event ID/node ID, actor, timestamp, optional commit, label/assignee/milestone/rename/project data and `performed_via_github_app` ([Issue events REST API](https://docs.github.com/en/rest/issues/events)).
- `/issues/{number}/timeline` is the broader display timeline for both Issues and PRs, including comments and PR-specific activity in addition to issue events ([Timeline REST API](https://docs.github.com/en/rest/issues/timeline)).

GraphQL `timelineItems` is the richest typed form. The current schema includes assignment, label, milestone, lock, rename, close/reopen, transfer, cross-reference, subscribe, pin, duplicate, project, issue-field, type, dependency, parent/sub-issue and deletion event types. PR timelines additionally include commits, commit-comment threads, reviews, review threads, requested-review changes, draft/readiness, force-push/ref events, merge/auto-merge/merge-queue and deployment events ([GraphQL Issues reference](https://docs.github.com/en/graphql/reference/issues), [GraphQL Pull requests reference](https://docs.github.com/en/graphql/reference/pulls), [GraphQL unions reference](https://docs.github.com/enterprise-cloud@latest/graphql/reference/unions)).

Neither the timeline documentation nor the GraphQL schema promises an immutable append-only log, a retention duration, or a total ordering across timeline, checks, Projects and webhook deliveries. This absence matters: use a timeline as a backfill/display source, not as proof that every historical mutation is present.

### Commits, files, statuses, checks and Actions

`GET /pulls/{number}/commits` gives the commits currently in the PR, but is explicitly capped at 250. GitHub directs clients needing more to the general List Commits endpoint. `GET /pulls/{number}/files` is explicitly capped at 3,000 files. Both limits can prevent a simple endpoint walk from reproducing an oversized PR ([Pull requests REST API](https://docs.github.com/en/rest/pulls/pulls)). The general Commit endpoint exposes SHA/node ID, author and committer Git identities and linked GitHub users, parents, message, signature verification, stats and files ([Commits REST API](https://docs.github.com/en/rest/commits/commits)).

Commit statuses and Checks are separate systems. The combined-status endpoint rolls up the latest state per status context, while individual statuses preserve provider/context, target URL and creation data ([Commit statuses REST API](https://docs.github.com/en/rest/commits/statuses)). Check suites, check runs and annotations expose app, name, external ID, timestamps, status/conclusion, output and actions. Listing check runs for a ref defaults to `filter=latest`; use `filter=all`, or enumerate suites and their runs, to retain reruns and older run attempts ([Check runs REST API](https://docs.github.com/en/rest/checks/runs)). GraphQL `statusCheckRollup` combines `CheckRun` and `StatusContext` nodes for the PR head commit ([GraphQL Checks reference](https://docs.github.com/en/graphql/reference/checks)).

The Checks model is not the whole Actions detail. GitHub Actions uses Checks for results, but workflow runs/jobs/logs and artifacts have their own REST resources and require Actions access ([Using workflow run logs](https://docs.github.com/en/actions/how-tos/monitor-workflows/use-workflow-run-logs), [Workflow runs REST API](https://docs.github.com/en/rest/actions/workflow-runs?apiVersion=2026-03-10)). Logs and artifacts default to 90-day retention, can be configured shorter, and disappear with a deleted run, so historical UI drill-down is not indefinitely reconstructible ([Removing workflow artifacts](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/remove-workflow-artifacts)).

### Planning and project context

Current labels, milestone, assignees, issue type and issue fields come from the Issue/GraphQL object and their dedicated REST endpoints. Assignment, label, milestone, type and field mutations are represented in the timeline, but the current resource remains the authority for present state.

For Projects v2, query an Issue/PR's `projectItems`, then each `ProjectV2Item`'s owning project, archive state and `fieldValues`; query the project for field definitions, options, iterations, views and item configuration as needed. GitHub's documented GraphQL examples show project items, content and typed field values, and current REST also exposes Projects v2 item resources ([Using the API to manage Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-api-to-manage-projects), [Project items REST API](https://docs.github.com/en/rest/projects/items?apiVersion=2026-03-10)). Projects can be user- or organization-owned and can span repositories, so repository access alone does not imply project visibility.

Projects (classic) fields remain in parts of the GraphQL schema only as deprecated legacy surface; the current integration target is Projects v2 ([GraphQL Issues reference](https://docs.github.com/en/graphql/reference/issues)).

### Actors and identities

Persist identifiers, not names. GraphQL's `Actor` interface may be a `User`, `Bot`, `Organization`, `Mannequin`, or enterprise user; a requested reviewer may also be a team. REST/webhook payloads can identify the GitHub App that performed an event separately from the user/bot actor ([GraphQL Users reference](https://docs.github.com/en/graphql/reference/users), [GraphQL Pull requests reference](https://docs.github.com/en/graphql/reference/pulls), [Issue events REST API](https://docs.github.com/en/rest/issues/events)).

Most webhook payloads include `sender`, but GitHub documents that internal or unresolvable actions use the `ghost` placeholder; `sender` must not be assumed to identify a real person ([Webhook events and payloads](https://docs.github.com/en/webhooks/webhook-events-and-payloads)). Commit authorship has two layers: immutable-ish Git commit name/email plus a nullable GitHub user association, and the author and committer can differ ([Commits REST API](https://docs.github.com/en/rest/commits/commits)).

## Facts: identifiers

Use the following key hierarchy:

- **Repository:** GraphQL node ID / REST `node_id` as the cross-API key; REST numeric `id` as a secondary GitHub database identifier; owner/name only as a locator because repositories can be renamed or transferred.
- **Issue or PR:** node ID as the global key; numeric `id`/`fullDatabaseId` as a secondary key; `(repository node ID, number)` as the durable human locator. Issues and PRs share the repository's number sequence.
- **Comments, reviews, review threads, events, labels, milestones, Projects/items, check suites/runs and actors:** persist the node ID wherever supplied, plus REST numeric/full database ID and resource URL when available.
- **Git objects:** full object ID (currently normally SHA-1, but treat it as an opaque Git OID) plus repository identity. A branch/ref name is mutable and is not a commit identifier.
- **Webhook delivery:** `X-GitHub-Delivery` GUID. GitHub preserves the same GUID on manual redelivery, making it the deduplication key ([Webhook best practices](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks)).

GitHub documents that REST `node_id` values can be passed directly to GraphQL's `node(id:)`, and recommends retaining the global node ID in cross-API integrations ([Using global node IDs](https://docs.github.com/en/graphql/guides/using-global-node-ids)). Node IDs are opaque: GitHub supports legacy and newer formats, so never decode or synthesize them ([Migrating global node IDs](https://docs.github.com/en/graphql/guides/migrating-graphql-global-node-ids)).

## Facts: pagination and ordering

REST collections are paginated. Defaults are commonly 30 and per-page maxima commonly 100, but the endpoint contract is authoritative. Follow the response `Link` URLs rather than constructing page numbers; some endpoints use page, cursor-like `before`/`after`, or `since` schemes ([REST pagination](https://docs.github.com/en/rest/using-the-rest-api/using-pagination-in-the-rest-api)).

GraphQL connections require `first` or `last` from 1 through 100 and return `pageInfo` cursors. Nested connections paginate independently; a “single query” still needs loops for comments, timeline items, reviews, thread comments, commits, files, reactions, Projects and field values ([GraphQL pagination](https://docs.github.com/en/graphql/guides/using-pagination-in-the-graphql-api)).

Ordering is collection-specific:

- REST reviews are documented chronological.
- REST review comments default to ascending ID and offer `sort`/`direction`.
- repository-wide issue/review comment endpoints offer update-time `since` filters, useful for incremental repair but not a total-order cursor.
- GraphQL timeline connections offer cursor pagination and a `since` filter but no client-selected `orderBy`; other connections expose their own ordering arguments or none.
- webhook delivery order is not documented as a transaction order shared with API timelines.

Therefore retain source IDs, source timestamps, ingestion time and webhook delivery GUID. Do not collapse distinct events solely because their timestamps match, and do not infer causal order across APIs from page order.

## Facts: GitHub App access and rate limits

An installation token sees only repositories selected for that installation and cannot be broadened beyond the app's granted permissions. Installation tokens expire after one hour ([Generating an installation access token](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app)). A user access token is further bounded by both the app's grants and the authorizing user's access; an installation token is bounded by app grants and installation scope ([Choosing GitHub App permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app)).

Minimum read permissions for this map are normally:

| Data | GitHub App permission |
| --- | --- |
| Issues, issue comments, labels/milestones/assignees, issue/timeline events | Repository **Issues: read** (PR-shared endpoints may alternatively accept Pull requests read) |
| Organization issue-type/field definitions (beyond values attached to a readable issue) | Organization **Issue Types: read** and **Issue Fields: read** |
| PR metadata, reviews, review comments/threads, requested reviewers, PR commits/files | Repository **Pull requests: read** |
| Commit objects/content beyond the PR-specific surface | Repository **Contents: read** |
| Check suites/runs/annotations | Repository **Checks: read** |
| Legacy commit status contexts | Repository **Commit statuses: read** |
| Workflow runs/jobs/logs/artifacts | Repository **Actions: read** |
| Deployments and deployment statuses | Repository **Deployments: read** |
| Organization-owned Projects v2 | Organization **Projects: read**; repository-owned projects need repository Projects read |
| Basic repository/user metadata | Repository **Metadata: read** (automatically included for installations) |

GitHub publishes an endpoint-by-permission matrix and each REST endpoint advertises required permissions via documentation and `X-Accepted-GitHub-Permissions` ([Permissions required for GitHub Apps](https://docs.github.com/en/rest/authentication/permissions-required-for-github-apps)). GraphQL permission requirements are not field-by-field in the schema; GitHub instructs apps to test the intended queries, with insufficient permissions producing errors ([Choosing GitHub App permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app)).

REST installation tokens receive at least 5,000 requests/hour; Enterprise Cloud organization installations receive 15,000. Non-Enterprise installations scale after 20 repositories/users by 50 requests/hour each, capped at 12,500. User-token calls share the user's 5,000/hour budget (15,000 for qualifying Enterprise-owned apps). Secondary limits include at most 100 concurrent requests shared across REST/GraphQL and nominal point/CPU/content-generation limits; some thresholds can change or remain undisclosed ([REST rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)).

GraphQL uses a separate point budget: typically 5,000 points/hour for user or installation tokens and 10,000 for qualifying Enterprise Cloud installations, plus query node/time and secondary limits. Query `rateLimit` and inspect response cost/remaining/reset ([GraphQL rate and query limits](https://docs.github.com/en/graphql/overview/rate-limits-and-query-limits-for-the-graphql-api)). Use conditional REST requests; an authorized `304 Not Modified` does not consume primary REST quota ([REST best practices](https://docs.github.com/en/rest/using-the-rest-api/best-practices-for-using-the-rest-api)).

Pin `X-GitHub-Api-Version: 2026-03-10`. Unversioned calls still default to `2022-11-28`; REST additive fields may arrive in supported versions, while breaking changes use a dated version ([REST API versions](https://docs.github.com/en/rest/about-the-rest-api/api-versions?apiVersion=2026-03-10)). GraphQL is continuously versioned through schema deprecations/changelog rather than this REST header.

## Facts: webhook coverage and durability

Subscribe at least to `issues`, `issue_comment`, `pull_request`, `pull_request_review`, `pull_request_review_comment`, `check_run`, `check_suite`, `status`, `workflow_run`, `deployment`, `deployment_status`, `milestone`, `label`, `projects_v2`, and `projects_v2_item` as permissions and product scope require. Also handle installation/repository-selection and permission-change events because they change what can be read. The official payload reference is authoritative for which actions, properties, hook types and permissions each event supports ([Webhook events and payloads](https://docs.github.com/en/webhooks/webhook-events-and-payloads)).

Webhooks are not a durable queue:

- payloads over 25 MB are not delivered;
- GitHub considers receivers that take longer than 10 seconds failed;
- GitHub does not automatically retry failed deliveries;
- delivery details and manual/API redelivery are available only for the past three days;
- the delivery GUID identifies an original delivery and its redeliveries.

These are explicit GitHub guarantees and limits ([Webhook payload cap](https://docs.github.com/en/webhooks/webhook-events-and-payloads), [Handling failed deliveries](https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries), [Viewing deliveries](https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/viewing-webhook-deliveries), [Webhook best practices](https://docs.github.com/en/webhooks/using-webhooks/best-practices-for-using-webhooks)). A production reader must acknowledge quickly, verify the signature, enqueue durably, deduplicate by GUID, and run reconciliation polling inside the three-day repair window.

## Facts: data GitHub cannot guarantee an App can fetch later

1. **Deleted content bodies.** Current-list APIs omit deleted comments/reviews. A timeline may retain a deletion event, but not the deleted body. Only a webhook or prior snapshot captured before deletion can preserve it.
2. **Removed edit revisions.** GitHub lets an author or writer delete displayed edit history. GraphQL can read edit objects only while GitHub exposes them ([Editing an issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/editing-an-issue)).
3. **Inaccessible cross-references.** A cross-reference or project can point into a private/unselected repository or organization resource. The installation cannot expand beyond selected repositories and granted org permissions, even if a human viewer can see both sides ([Reviewing installed GitHub Apps](https://docs.github.com/en/enterprise-cloud@latest/apps/using-github-apps/reviewing-and-modifying-installed-github-apps)).
4. **Someone else's pending review.** A pending review is private draft state until submission. An installation is not a human reviewer and cannot rely on reading another user's unsent review/comments; model only submitted shared state as complete.
5. **Viewer-personal UI state.** `isReadByViewer`, subscriptions, `viewer*` capabilities, the viewer's latest review, and file viewed/unviewed state are tied to the authenticated identity. An installation token reports the App viewer, not every human's state. User-specific notifications and saved filters likewise require user authorization and are not repository truth.
6. **Oversized PR projections.** The PR commit endpoint caps at 250 and the files endpoint at 3,000. A generic Git walk can recover reachable commit objects, but cannot always recover historical PR membership after force-push/deletion or the exact server-generated diff projection ([Pull requests REST API](https://docs.github.com/en/rest/pulls/pulls)).
7. **Expired checks drill-down.** Check conclusions may remain while Actions logs/artifacts expire or are deleted; default retention is 90 days and configurable ([Removing workflow artifacts](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/remove-workflow-artifacts)). External check `details_url` content is controlled by another service and may disappear independently.
8. **Missed webhook payloads.** Failed deliveries are not automatically retried and recovery data expires after three days; oversized payloads are never delivered. Polling can repair current state, not necessarily the exact intermediate transition or deleted content.
9. **Public activity history.** The Events API is capped at 300/30 days and is delayed, so it cannot repair long outages or establish a complete work-item history ([Events REST API](https://docs.github.com/en/rest/activity/events?apiVersion=2026-03-10)).
10. **Reasons not modeled as data.** GitHub may expose that a state changed without preserving the human rationale, policy/ruleset version, exact CODEOWNERS evaluation, notification recipients, or external system state that caused it. Current branch rules and current team membership cannot safely be projected backward.

## Inferences for Signal's design

The following are design conclusions, not GitHub guarantees:

- **Current state can be made convergent.** Webhook-driven rehydration plus scheduled full pagination should converge to the App-visible current state even when deliveries are duplicated, reordered or briefly missed.
- **Historical completeness requires capture from installation time.** Persist raw webhook envelopes and versioned snapshots/deltas before GitHub can delete or redact them. Label pre-installation history and outage windows as incomplete rather than synthesizing events.
- **Use GraphQL selectively.** REST is easier to checkpoint and cache; GraphQL should fill semantic gaps such as thread resolution, content edit history, Projects values and typed timeline nodes. This controls cost and reduces the blast radius of schema changes.
- **Separate truth domains.** Store work-item current state, conversation, code, checks, Projects and observed events as related but independently synchronized streams. A single `updated_at` cannot checkpoint all of them.
- **Authorization is part of provenance.** Record installation ID, token mode (installation/user), permission set and repository selection with each sync. “Not returned” can mean absent, forbidden, redacted or not supported.
- **Completeness must be field-level.** A work item can be complete for current labels/comments yet incomplete for deleted bodies, private cross-references, old Actions logs or human viewer state. Surface those flags to downstream consumers.

## Empirical unknowns to test before implementation

GitHub's documentation does not settle these operational details. Test them with a disposable private organization/repository and the exact production App permission set:

1. Which `userContentEdits` and deletion nodes remain queryable after an author versus a maintainer removes edit history, and in what order.
2. Whether deletion webhooks include the last body for every issue comment, review body and inline comment case; what remains in REST and GraphQL timelines afterward.
3. Exact redaction/error shapes for cross-references, dependencies, sub-issues and Projects spanning installed and uninstalled private repositories.
4. Visibility of pending reviews/comments for installation tokens, App-authored reviews and user tokens for the review author.
5. Cursor stability when timeline items/comments are inserted, deleted or edited during a multi-page crawl; behavior of equal `updated_at` timestamps.
6. Whether GraphQL PR `files`/`commits` has practical or undocumented caps different from REST on PRs above 250 commits or 3,000 files, and how diff media responses fail.
7. `filter=all` check-run completeness across rerequests, Actions reruns, deleted workflow runs and head force-pushes.
8. Actor identity behavior after login changes, user deletion, Enterprise Managed User migration and mannequin reclamation.
9. Organization-only issue fields and private Projects behavior for installation versus user tokens, including partial GraphQL errors.
10. Mapping of every current GitHub UI timeline card to REST timeline media and GraphQL union members, including new merge queue, stacked PR, issue-field and dependency events.

## Implementation acceptance criteria

A “complete App-visible work item” reader should be considered ready when it:

- paginates every nested collection to exhaustion and records collection-specific ordering;
- captures both global node IDs and local/database identifiers without decoding them;
- reads both shared Issue and PR-specific resources;
- represents issue comments, reviews, inline comments and review threads as distinct types;
- enumerates checks with `filter=all` and legacy statuses for every relevant head/commit;
- resolves Projects v2 items and field definitions under explicit Projects permission;
- ingests/deduplicates signed webhooks and reconciles failed deliveries within three days;
- stores raw source payloads with API version/schema observation time;
- reports permissions/redaction/retention and hard-cap gaps per field/collection;
- never claims pre-installation or post-retention history is complete.

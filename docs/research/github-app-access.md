# GitHub App access across personal, organization, and EMU accounts

_Research date: 2026-08-12. Scope: GitHub Enterprise Cloud (GHEC), including GitHub.com and the data-resident GHE.com service. GitHub Enterprise Server is out of scope._

## Decision summary

Signal can use a GitHub App for read-only aggregation across ordinary personal accounts and organizations, including GHEC organizations, with an important authorization boundary:

- Treat an **installation** as the account owner's grant to Signal's app: which repositories and app permissions are available.
- Treat **user authorization** as a separate, per-Signal-User grant. A GitHub App user access token is limited to the intersection of the app installation's access and that GitHub user's current access.
- A single organization installation can safely serve multiple Signal Users only if Signal keeps an independent GitHub authorization for each user and never infers entitlement from the installation token. Use `GET /user/installations/{installation_id}/repositories` with that user's token as the canonical repository-intersection check.
- Installation tokens may ingest shared repository data once for efficiency, but every stored object must retain installation, organization, and repository provenance, and Signal must filter delivery using fresh per-user entitlement. GitHub explicitly warns that using an installation token for a user-facing action can reveal things that user should not see.
- Support ordinary GitHub.com personal and organization accounts first. EMU is viable through organization installations and per-user authorization, but not through ordinary installations on a managed user's personal namespace. GHE.com needs a tenant-local app/integration path; Marketplace apps are unavailable there and current docs do not establish cross-host portability for a GitHub.com app registration.

These conclusions follow GitHub's documented token intersection and security guidance; the shared-ingestion design is an architectural inference, not a GitHub guarantee. [User access-token intersection](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app), [GitHub App security guidance](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app), [GHE.com app availability](https://docs.github.com/en/enterprise-cloud@latest/apps/using-github-apps/about-using-github-apps)

## The two grants and three authentication modes

Installation and authorization are independent:

| Concern | Installation | User authorization |
| --- | --- | --- |
| Granting actor | Owner/admin of a personal account, organization, or enterprise | Each GitHub user |
| Grant | Repository, organization, or enterprise permissions requested by the app; repository selection where applicable | Requested user/account permissions and permission to act on the user's behalf |
| Credential | Installation access token | User access token (OAuth token with fine-grained app permissions) |
| Effective access | App permissions × repositories granted to installation | App permissions/access × user's permissions/access |
| Lifetime | Installation token: one hour | By default, user token: eight hours; refresh token: six months |
| Revocation | Repository removal, suspension, or uninstall affects the installation | User deauthorization invalidates that user's tokens but does not uninstall the app |

GitHub permits either grant without the other. The app itself can also authenticate with a short-lived JWT for app-management operations, such as minting an installation token; that JWT is not a repository entitlement. [Installation versus authorization](https://docs.github.com/en/enterprise-cloud@latest/apps/using-github-apps/installing-a-github-app-from-a-third-party#difference-between-installation-and-authorization), [GitHub App authentication modes](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app), [Installation token generation](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app), [User token generation and lifetime](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app)

For an organization installation, the installer can complete authorization immediately, but every other member still uses the web application or device flow to authorize individually. Thus installation ownership and Signal-user identity must not be conflated. GitHub also warns that the `installation_id` supplied to an app's setup URL can be spoofed; Signal must verify the association using a user token instead of trusting that query parameter. [Generating user tokens after installation](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-user-access-token-for-a-github-app#generating-a-user-access-token-when-a-user-installs-your-app), [Setup URL warning](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/about-the-setup-url)

## Shared installations and per-user entitlement

One installation is an account-level resource, not a per-user seat. GitHub Apps remain installed even if the person who installed the app leaves, and an organization installation may be used by multiple separately authorized users. [Why GitHub Apps are not tied to a user](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/about-creating-github-apps/deciding-when-to-build-a-github-app)

The safe authorization equation is:

`Signal-visible repository = installation repository grant ∩ app permissions ∩ current GitHub-user entitlement ∩ Signal product policy`

GitHub exposes the first three terms directly. With a GitHub App user token:

- `GET /user` binds the callback to a stable GitHub user `id`; GitHub recommends stable numeric IDs for users, repositories, organizations, and enterprises rather than mutable login names, slugs, or email addresses.
- `GET /user/installations` lists this app's installations the authenticated user has explicit permission to access.
- `GET /user/installations/{installation_id}/repositories` lists only repositories that both that installation and user can access and returns the user's repository permission.

[Authenticated user endpoint](https://docs.github.com/en/rest/users/users#get-the-authenticated-user), [User-installation endpoints](https://docs.github.com/en/rest/apps/installations#list-app-installations-accessible-to-the-user-access-token), [Repository intersection endpoint](https://docs.github.com/en/rest/apps/installations#list-repositories-accessible-to-the-user-access-token), [Durable identity and authorization guidance](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app#check-authorization-thoroughly-durably-and-often)

**Inference for Signal:** ingesting with a shared installation token is acceptable only as a backend optimization. It cannot prove that a particular Signal User may see the result because an installation token is bounded only by the app installation. Signal should retain repository provenance on normalized records, maintain a per-user allow-set derived from the user-token endpoints, recheck it on authentication and regularly thereafter, and deny cached organization data when the check fails. GitHub explicitly recommends regularly checking `GET /user/installations`, tracking the organization/enterprise context of saved data, and denying access when membership or SSO authorization is absent. [GitHub App best practices](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app#validate-organization-access-for-every-new-authentication)

## Account and enterprise matrix

| Account context | What is supported | Constraints relevant to Signal |
| --- | --- | --- |
| Ordinary personal account | User may install on all or selected personal repositories and separately authorize the app. | One installation belongs to that personal account. Organization-owned repositories require an organization installation; authorizing alone does not install. |
| Organization | Organization owners may install. Repository admins may install only on repositories they administer when the app requests neither organization permissions nor repository `Administration`. | Owners can restrict installation to owners and can disable app requests. Members/outside collaborators can request installation only if policy permits. One installation can serve many separately authorized users. |
| GHEC organization using personal accounts | Same organization model, with SAML SSO and IP-allow-list constraints where configured. | Users may need an active SSO session before requesting, installing, or authorizing; missing SSO can hide organization resources from the user token. App server IPs may require allow-list approval. |
| Enterprise-level GHEC installation | Enterprise owners can install eligible apps for enterprise permissions. This capability is in public preview. | It grants no organization or repository access, supports no enterprise-level webhooks, and cannot replace separate organization installations for Signal aggregation. |
| EMU on GitHub.com | Managed users cannot install ordinary apps on their user accounts. A managed user with repository admin can install an app for that repository if it asks for no organization permission; an organization owner can install on the organization. | Managed users' API/resource boundary is their enterprise: private/internal enterprise repositories and permitted private user repositories; the wider community is read-only. Paid-app purchase/install is restricted to enterprise owners. |
| Internal app in an EMU enterprise | Enterprise- or managed-user-owned apps have `internal` visibility and can be installed only on that enterprise and its organizations; enterprise users can authorize them. | This is a tenant-specific deployment, not a public multi-tenant Signal app. Outside collaborators cannot authorize an internal app. |
| GHE.com data residency | GitHub App APIs use the enterprise's dedicated host/API subdomain. | Marketplace apps are unavailable. GitHub says third-party apps cannot be installed on the enterprise account; the enterprise/org must own the app for enterprise use. Validate the exact tenant-local registration and organization-install flow empirically before promising support. |

[Third-party installation rules](https://docs.github.com/en/enterprise-cloud@latest/apps/using-github-apps/installing-a-github-app-from-a-third-party#requirements-to-install-a-github-app), [Organization app-request and installation policy](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/limiting-oauth-app-and-github-app-access-requests-and-installations), [Enterprise-level installation limitations](https://docs.github.com/en/enterprise-cloud@latest/apps/using-github-apps/installing-a-github-app-on-your-enterprise#current-limitations), [Managed-user restrictions](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/understanding-iam-for-enterprises/abilities-and-restrictions-of-managed-user-accounts#github-apps), [App visibility](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/registering-a-github-app/making-a-github-app-public-or-private), [GHE.com API host](https://docs.github.com/en/enterprise-cloud@latest/rest/apps/apps), [GHE.com/Marketplace constraints](https://docs.github.com/en/enterprise-cloud@latest/apps/using-github-apps/about-using-github-apps#finding-github-apps)

### GHEC identity and network policy

For SAML-protected organizations, a user may need an active organization or enterprise SSO session before installation, an installation request, or authorization. At authorization time, GitHub creates credential authorizations only for organizations with active SSO sessions. GitHub's documented recovery when repositories are absent is to establish SSO, revoke the app authorization, and authorize again. Signal must treat SSO loss as loss of entitlement, not as a transient UI problem. [SAML and GitHub Apps](https://docs.github.com/en/enterprise-cloud@latest/apps/using-github-apps/saml-and-github-apps)

Enterprise/organization IP allow lists can reject installation-token and user-token traffic unless the app's server addresses are accepted automatically from the app registration or added manually. For EMU enterprises using Microsoft Entra OIDC conditional access, user-token calls are evaluated using the Signal server's IP address; app-as-app and installation-token calls are not user calls and are always allowed by that IdP conditional-access check. That difference reinforces why successful backend ingestion is not evidence of user entitlement. [GitHub App IP allow lists](https://docs.github.com/en/enterprise-cloud@latest/apps/maintaining-github-apps/managing-allowed-ip-addresses-for-a-github-app), [EMU conditional access](https://docs.github.com/en/enterprise-cloud@latest/admin/managing-iam/configuring-authentication-for-enterprise-managed-users/about-support-for-your-idps-conditional-access-policy#github-apps-and-oauth-apps)

## Permissions for read-only aggregation

GitHub Apps have no explicit permissions by default, and GitHub recommends requesting the minimum set. Signal should avoid all write permissions and add read permissions only for data actually surfaced:

| Signal data | Minimum permission family to evaluate |
| --- | --- |
| Repository identity, visibility, basic metadata, collaborators/permission lookup | Repository `Metadata: read` (Metadata is mandatory/read-only for installed apps) |
| Branches, commits, trees, blobs, files, releases | Repository `Contents: read` |
| Issues and issue comments/events | Repository `Issues: read` |
| Pull requests, reviews, review comments | Repository `Pull requests: read` |
| Workflow runs/jobs/logs | Repository `Actions: read` |
| Check runs/suites | Repository `Checks: read` |
| Commit statuses | Repository `Commit statuses: read` |
| Deployments | Repository `Deployments: read` |
| Organization/member/team lifecycle webhooks | Organization `Members: read` |

The endpoint-to-permission mapping is API-specific, and some endpoints accept alternative permission combinations; the current REST permission table must be checked for every endpoint Signal adopts. GraphQL requires the corresponding app permissions as dictated by requested fields. [Choosing minimum permissions](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app), [REST endpoint permission matrix](https://docs.github.com/en/rest/authentication/permissions-required-for-github-apps), [GraphQL authentication and permissions](https://docs.github.com/en/graphql/guides/forming-calls-with-graphql)

**Inference for rollout:** omit organization permissions, especially `Members`, unless Signal needs membership events that cannot be covered by per-user revalidation. That preserves the documented path where repository admins can install a repository-only app and avoids requesting a broad organization directory merely to decide repository entitlement. The user-installation repository endpoint itself needs `Metadata: read`, not `Members`. [Organization installation restriction](https://docs.github.com/en/enterprise-cloud@latest/organizations/managing-programmatic-access-to-your-organization/limiting-oauth-app-and-github-app-access-requests-and-installations#about-github-app-installation-restrictions), [User repository intersection endpoint](https://docs.github.com/en/rest/apps/installations#list-repositories-accessible-to-the-user-access-token)

## Observable identity and access lifecycle

Signal can observe these first-party events:

| Event/source | What Signal learns | Permission/subscription |
| --- | --- | --- |
| OAuth callback and `GET /user` | Initial authorization succeeded; stable authenticated GitHub user ID | User authorization; `GET /user` needs no additional app permission |
| `github_app_authorization: revoked` | A user revoked the app; stop all calls for that user | Mandatory webhook; revocation only—there is no corresponding `authorized` webhook |
| `installation` | Created, deleted, suspended, unsuspended, or new permissions accepted; installation/account context | Mandatory webhook |
| `installation_repositories` | Repositories added to or removed from an installation; selection mode | Mandatory webhook |
| `installation_target: renamed` | Installed user/organization account was renamed | GitHub App webhook |
| `organization`, `member`, `membership`, `team`, `team_add` | Organization/member/team changes relevant to access | Requires organization `Members: read` |
| API revalidation | User's current installations, repository intersection, and permission | User token; authoritative fallback for changes not reliably represented by the selected webhooks |

[Webhook event definitions](https://docs.github.com/en/webhooks/webhook-events-and-payloads), [Authorization revocation event](https://docs.github.com/en/webhooks/webhook-events-and-payloads#github_app_authorization), [Installation event](https://docs.github.com/en/webhooks/webhook-events-and-payloads#installation), [Installation repository event](https://docs.github.com/en/webhooks/webhook-events-and-payloads#installation_repositories), [Installation target event](https://docs.github.com/en/webhooks/webhook-events-and-payloads#installation_target)

Webhook delivery is useful for prompt invalidation, but it is not a complete per-user entitlement ledger without broad member/team permissions. Signal should therefore combine signed, idempotently processed webhooks with periodic and session-time user-token revalidation. This is an inference aligned with GitHub's instruction to validate organization access regularly. [Authorization validation guidance](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app#validate-organization-access-for-every-new-authentication)

## Revocation, suspension, and permission changes

- A user alone can revoke their GitHub App authorization. Organization and enterprise owners cannot revoke an individual member's authorization, but can suspend or uninstall the installation so it cannot reach that account's resources. [Authorization ownership](https://docs.github.com/en/enterprise-cloud@latest/apps/using-github-apps/reviewing-and-revoking-authorization-of-github-apps)
- User deauthorization does not uninstall the app. Signal receives `github_app_authorization: revoked`; continued use of the user token returns `401`. [Authorization webhook](https://docs.github.com/en/webhooks/webhook-events-and-payloads#github_app_authorization)
- Suspending an installation blocks access to its resources. The party that suspended it controls unsuspension. Uninstalling removes access only for that installation account; the same user authorization may still work with other installations. [Suspending an installation](https://docs.github.com/en/apps/maintaining-github-apps/suspending-a-github-app-installation), [Reviewing or uninstalling apps](https://docs.github.com/en/enterprise-cloud@latest/apps/using-github-apps/reviewing-and-modifying-installed-github-apps#blocking-access)
- New repository/organization permissions require approval by each installation owner; new user/account permissions require approval by each authorized user. Added permissions do not take effect until approved. Removed permissions and webhooks take effect immediately. [Changing app permissions](https://docs.github.com/en/apps/maintaining-github-apps/modifying-a-github-app-registration#changing-the-permissions-of-a-github-app)
- Installation tokens expire after one hour. Signal should keep default-expiring user tokens (eight hours) and refresh tokens (six months), revoke credentials no longer needed, and handle refresh failure as deauthorization. [Token lifetime and storage guidance](https://docs.github.com/en/enterprise-cloud@latest/apps/creating-github-apps/about-creating-github-apps/best-practices-for-creating-a-github-app#expire-tokens)
- EMU lifecycle is IdP-driven. Enterprise incident response can revoke SSO authorizations or delete managed-user credentials; losing user-token access must immediately remove Signal visibility even if the organization installation and its backend ingestion remain active. [Token revocation by enterprise owners](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/token-expiration-and-revocation#token-revoked-by-enterprise-owners)

## Recommended Signal model

1. Store a GitHub connection keyed by stable GitHub `user.id`, with encrypted expiring user/refresh tokens.
2. Store installations separately by stable `installation.id`, installation target ID/type, permissions, repository selection, suspension state, and host (`github.com` versus a specific `*.ghe.com`).
3. Link many Signal Users to the same organization installation only after user-token verification through `GET /user/installations`.
4. Materialize each user's allowed repository IDs from `GET /user/installations/{id}/repositories`; refresh on login, token refresh, relevant webhooks, authorization errors, and a bounded periodic schedule.
5. Store all aggregated records with installation, organization/enterprise, and repository IDs. Gate every query/result against the requesting user's current allow-set; immediately quarantine visibility when entitlement is unknown or stale after a revocation signal.
6. Use a repository- and permission-scoped installation token for shared ingestion where useful. Never expose that token or use its successful reads as authorization evidence for a Signal User.
7. Verify webhook signatures, process deliveries idempotently, and reconcile against the API after lifecycle events.
8. Keep the initial app repository-only and read-only. Add organization `Members` only after measuring a concrete need that per-user reconciliation cannot meet.

Steps 3–8 are design recommendations inferred from GitHub's documented boundaries and best practices rather than product behavior GitHub guarantees.

## Unresolved empirical checks

Before claiming full enterprise support, run these tests with customer-like tenants:

1. **EMU on GitHub.com:** authorize a public Signal App as a managed user against an owner-installed organization app; confirm the user-installation intersection, organization member/guest-collaborator behavior, suspension, and SCIM deprovisioning latency.
2. **GHE.com data residency:** determine whether Signal must register a distinct tenant-owned/internal app, how callback and webhook routing works on the dedicated host, and whether any approved third-party deployment path exists. Current docs say Marketplace is unavailable and do not establish GitHub.com-registration portability.
3. **Entitlement loss timing:** record behavior and propagation after direct collaborator removal, team removal, organization removal, SAML credential revocation/expiry, EMU suspension, repository transfer, and private/internal visibility changes. Verify API status codes and how quickly `GET /user/installations/{id}/repositories` changes.
4. **Webhook fixtures:** capture and replay signed payloads for install/uninstall, suspend/unsuspend, `new_permissions_accepted`, all-to-selected and selected-to-all transitions, repository add/remove, account rename, and user deauthorization. Confirm ordering, duplication, and race behavior.
5. **Permission fixture:** test the final REST and GraphQL query set against a generated app manifest to prove that no write or unused organization permission is required.

Until those checks pass, describe EMU organization support as technically supported by documented primitives but not production-verified, and describe GHE.com support as discovery-stage.

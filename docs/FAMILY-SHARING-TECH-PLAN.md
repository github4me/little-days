# Family Sharing — Technical Plan

Status: **Draft for review, not approved for implementation**  
Date: 8 September 2026  
Baseline: existing Expo/React Native/TypeScript app, local SQLite, commit `6a22f51`.

## 1. Recommendation

Keep the existing mobile app. Add **one C# ASP.NET Core API, one Azure SQL database, and managed customer authentication**. Keep everything in the existing GitHub repository. Do not introduce microservices, Redis, a message broker, SignalR, or a third-party sync engine.

The product remains local-first: **draft locally → explicitly save → submit → accept or reject → refresh**. Family members share saved records, not live interactions.

This document proposes architecture and review decisions only. It does not provision Azure, change the app, or authorize a production deployment.

## 2. Agreed behavior

| Action | On this device | Shared with family |
| --- | --- | --- |
| Type, change an option, edit a record | Persist a private draft | Nothing |
| Start feeding/sleep timer | Persist a private active timer | Nothing; other people cannot stop it |
| Cancel an editor | Discard unsaved changes | Existing shared record unchanged |
| Save / Stop a timer | Save locally and queue an immutable operation | Submitted now if online, later if offline |
| Confirm delete | Queue a deletion; show pending state | Removed only when the server accepts |
| Conflicting update/delete | Retain rejected draft locally | No overwrite; display latest server state |

- Different record IDs are independent: retain all new records, including matching or overlapping times from different users. Never auto-deduplicate by time or values.
- For the **same record and base version**, the first valid operation committed by the server wins. Device tap time and device clocks do not determine priority.
- A conflict is terminal for that submitted operation: notify the user and refresh; never silently retry it against the newer version.
- Save while offline means **Saved on this device — waiting to share**, not “shared successfully.”
- Language, theme and personal reminders stay device-local and retain their existing immediate-save behavior. The Save boundary applies to shared data; account/family commands use explicit Create, Invite, Accept or Confirm buttons.
- No undo-delete feature. A rejected deletion restoring the actual server record is conflict recovery, not an undo operation.

## 3. Proposed first-release scope

One family space with one baby in the initial UI; schema supports multiple babies and memberships without implementing a full baby/family-management product now.

Proposed roles, requiring approval:

- **Owner:** manage baby profile, invitations and membership; read/write all care records.
- **Caregiver:** read, create, edit and delete shared care records, including another caregiver's entries.

Always show “Recorded by” and “Last edited by.” Attribution is not an edit lock. Shared editing is an explicit proposal that replaces the earlier creator-only suggestion and gives the agreed conflict rule a useful purpose. Defer a read-only role.

Keep a local-only mode with no account required. Keep avatars local in v1; family photo upload and Azure Blob Storage can be a separate small follow-up. Do not upload existing photos without consent.

## 4. Technology and deployment

| Layer | Proposed choice | Reason |
| --- | --- | --- |
| Mobile | Existing Expo + TypeScript + SQLite | Preserve UI, offline behavior and existing tests |
| API | C#, ASP.NET Core Minimal APIs, .NET 10 LTS | One deployable service with feature folders |
| Persistence | EF Core 10 + Azure SQL Database | Transactions, constraints and record version checks |
| Login | Microsoft Entra External ID customer tenant | Hosted email one-time-passcode login; no home-grown password system |
| Hosting | Azure App Service, Linux | Deploy a normal .NET application without container orchestration |
| Delivery | GitHub Actions + Bicep; retain Expo EAS | Repeatable Azure infrastructure, API deployment and mobile builds |
| Diagnostics | Azure Monitor/Application Insights | Failures, latency, retry/conflict counts; exclude care payloads |

.NET 10 is an active LTS release; pin SDK/dependencies and maintain supported patches. Confirm the chosen App Service runtime/region during setup. [Microsoft support policy](https://dotnet.microsoft.com/en-us/platform/support/policy), [App Service .NET configuration](https://learn.microsoft.com/en-us/azure/app-service/configure-language-dotnetcore).

Use an App Service managed identity for SQL access and GitHub-to-Azure OIDC for deployments rather than stored Azure passwords. [Managed identity database access](https://learn.microsoft.com/en-us/azure/app-service/tutorial-connect-msi-azure-database), [GitHub Actions deployment](https://learn.microsoft.com/en-us/azure/app-service/deploy-github-actions).

Propose Australia East for application/database hosting, subject to the Azure subscription and residency requirements. Identity and diagnostic service locations must be checked separately; this does not promise all processing stays in Australia.

Choose the smallest suitable always-available App Service and SQL tiers after a regional cost estimate. Avoid database auto-pause for the first family pilot unless its wake-up delay is acceptable. No dollar estimate is asserted before region, tiers and budget are approved.

## 5. Authentication and family invitations

Use browser-based OpenID Connect authorization-code login with PKCE through Expo AuthSession. Store native credentials in SecureStore, never the record database or backup JSON. The API validates access-token signature, issuer, audience, lifetime and scope; identify users by the provider's stable subject, not email. Expo requires a development/native build for this redirect flow, not Expo Go. [Expo authentication guide](https://docs.expo.dev/guides/authentication/).

External ID supports customer email-passcode user flows. Use a **customer external tenant**, not workforce guest accounts. Family membership is our application's SQL data, not Entra directory invitations or groups. [Customer user flows](https://learn.microsoft.com/en-us/entra/external-id/customers/how-to-user-flow-sign-up-sign-in-customers), [External tenant capabilities](https://learn.microsoft.com/en-us/entra/external-id/customers/concept-supported-features-customers).

Invitation flow:

1. Owner enters the recipient email and explicitly creates an invitation.
2. API generates a cryptographically random, single-use token, stores only its hash, and expires it after a proposed 72 hours.
3. Owner shares the link using the phone's share sheet; defer an application email-sending service.
4. Recipient signs in and accepts explicitly. API checks verified recipient identity/email, expiry, revocation and inviter authority, then atomically consumes the invitation and creates membership.
5. Accept retries return the existing result; concurrent acceptance cannot create duplicate memberships. Expired/revoked/wrong-recipient links grant no access.

A small HTTPS landing page served by the API supports installed-app links and a paste-invite fallback after installation. Do not rely on deferred deep links surviving an App Store install. Keep invite tokens out of request logs/referrers and use a no-third-party-content landing page.

**First technical spike:** verify External ID + Expo on an actual iPhone, including refresh, logout, API audience/scope and trustworthy recipient-email claims. If that integration fails, bring a revised login choice back for review rather than building custom authentication.

## 6. Data model

Minimum server tables:

- `Users`: internal ID, identity issuer/subject, display name, account state.
- `Families`: ID, owner user ID, aggregate revision for conditional refresh.
- `Memberships`: family/user composite key, role, active/revoked state.
- `Invitations`: family, token hash, intended recipient, expiry, consumed/revoked state, version.
- `Babies`: family ID, profile fields, `rowversion`.
- `Records`: globally unique client-generated ID, baby ID, type, existing typed care fields, creator, last editor, server timestamps, deletion marker, `rowversion`.
- `Operations`: user/family/operation ID unique key, canonical request hash and accepted result. This is a retry receipt, not an event-sourcing system.

Enforce family/baby relationships, one membership per user/family, owner invariants and validation in SQL/API. Derive actor and ownership fields on the server. Store UTC event instants; continue displaying local device time. Family ownership changes and member removal must also be transactional, not race-prone check-then-write operations.

Local tables, isolated by account/family:

- `SharedRecords`: last accepted server state and version.
- `Drafts`: private input, base record ID/version; includes rejected drafts.
- `ActiveTimers`: private running sessions, persisted start timestamp.
- `Outbox`: saved operations, immutable payload/version, attempt/status details.
- `SharedProfiles` / metadata: cached membership/profile and snapshot revision.

Do not send an entire local `State` object to overwrite a family. A current server version and a local draft must coexist.

## 7. Save protocol and conflicts

Suggested REST surface:

| Endpoint | Purpose |
| --- | --- |
| `GET /v1/me/families` | Authorized memberships |
| `POST /v1/families` | Explicitly create family and initial baby |
| `GET /v1/families/{id}/snapshot` | Authorized saved state, conditional ETag |
| `POST /v1/babies/{id}/records` | Create independent record with client ID |
| `PUT /v1/records/{id}` | Replace one record with `If-Match` version |
| `DELETE /v1/records/{id}` | Version-checked soft deletion |
| `PUT /v1/babies/{id}` | Owner's version-checked profile save |
| Family invitation/membership endpoints | Create, accept, revoke, leave, transfer ownership |

Each mutation includes `operationId`; edits/deletes also include the opaque base version. Do not compare timestamps for conflict detection.

Server transaction:

1. Authorize current membership and role; serialize membership revocation against writes for that family.
2. Check the operation receipt. Same ID + same request returns the accepted receipt without applying again. Reusing an ID for different input is rejected.
3. Validate the payload and conditional version, then write. Use EF Core concurrency tokens mapped to SQL `rowversion`; do not merely compare versions in application memory. [EF Core concurrency support](https://learn.microsoft.com/en-us/ef/core/saving/concurrency).
4. Commit record change, family revision and receipt atomically. Return the committed family revision alongside the record version. A failed transaction is not a winning action.

Return `201/200` on success; `412` for a stale `If-Match` (including edit-after-delete), `409` for incompatible ID reuse, and `403` for removed/insufficient membership. Use stable machine-readable codes and localized client messages. Unauthorized callers must not receive the current record in an error.

Example: both caregivers edit version A. One saves successfully and gets B. The second submits A, gets `412`, sees “Someone else updated this record. Your change wasn't saved. Showing the latest version,” and sees B. Their draft stays private. To try again, they review B and explicitly Save a new operation based on B. No automatic overwrite/merge.

For ambiguous network failures, retry the **same operation ID and payload**. Repeated deletes and saves must not duplicate effects. A retry receipt may describe an older accepted state; follow it with a refresh and never replace a newer local cache with that old response. Keep receipts for the pilot; define retention before introducing cleanup.

## 8. Local queue and refresh

On Save, atomically write the outbox operation and local pending representation in SQLite before any network request. Process operations sequentially per record. Initially allow only one unresolved saved operation per record; users may keep editing a separate draft but cannot submit another until the first resolves. Never mutate an in-flight payload.

Project an own pending edit over its accepted record by ID, not as a second record in charts. Count own saved-pending creations once and label them; private drafts/running timers do not contribute completed shared-record totals. On rejection, remove the pending overlay and recalculate from accepted state while retaining the rejected draft separately.

Retry transient network/5xx failures with backoff. Pause on expired login until reauthentication. Mark validation/permission/conflict failures as requiring attention, not endlessly retriable. A failed record must not block other independent records.

For the initial small-family release, use **conditional full snapshots**, not a change-feed protocol: refresh on app foreground, screen entry, pull-to-refresh, mutation outcome, and approximately every 30 seconds while an authenticated family screen is active. Use backoff and stop polling in background/offline. Shared records remain cached offline; mobile background execution is not a delivery guarantee.

Read snapshot revision and data in one consistent SQL snapshot transaction; only advance the client's ETag after the full response is atomically applied. Keep drafts/outbox separate when replacing the accepted cache. An error or partial response is never an empty successful snapshot. Authorize before returning even `304 Not Modified`.

Serialize refreshes per family. Include a monotonic family revision (encoded losslessly as a string) and reject snapshots older than the applied cache or an acknowledged mutation's revision. Guard every response with the current account/family session generation: a late response after sign-out, family change or revocation must never repopulate cleared data. Cancel in-flight requests where possible, but do not rely on cancellation alone for safety.

Trade-off: a changed snapshot transfers all family records. Benchmark a proposed 20,000-record household dataset before release; if bandwidth, memory or latency is unacceptable, add a properly ordered paginated change feed as a separately reviewed enhancement. Do not pretend this pilot approach scales indefinitely, or use SQL rowversion as a naive sync cursor.

After a conflict, immediately apply/fetch the newest authorized record and refresh summaries. Show “Latest status unavailable” if that fetch fails; preserve the last known state and draft. Other devices see accepted changes on their next refresh, not instantly.

## 9. Existing-code migration

Current `src/storage.ts` stores one validated JSON state in SQLite `app_data`; `App.tsx` funnels edits through whole-state `commit/upsert`. Timer starts currently use that same path. Introduce a small local repository and explicit `saveDraft`, `saveRecord` and `confirmDelete` services instead of attaching uploads to `saveState`.

Keep existing chart/UI components consuming a projected `State` while storage changes underneath. Update `EntryEditor.tsx`, both timer flows in `App.tsx`, the profile editor in `Settings.tsx`, and browser storage/test doubles. Reuse TypeScript domain rules and create matching C# validation with shared JSON test fixtures; do not trust client validation.

The current validator rejects unknown fields and enforces a single active feed/sleep across a state. Keep server metadata in a separate sync envelope and move active-session constraints into local timer storage. Do not apply them to the combined family history. Keep the browser preview local-only initially, with mocked API tests; a production signed-in web client needs a separately reviewed credential-storage design.

Migration sequence:

1. Version the local schema and create a recoverable local backup; keep existing local-only data intact.
2. Move unfinished feed/sleep sessions into private timer storage, not the shared record cache. Preserve timestamps and resume behavior.
3. On “Enable family sharing,” explain the upload, choose/create the destination family and preview counts.
4. Explicit confirmation creates deterministic, resumable import operations. No automatic upload on login, and no upload to a newly joined family by default.
5. Preserve legacy IDs through a stored mapping, preventing retries/re-import of the same migration from duplicating records. Different users' independently created/imported records remain separate.
6. Existing backup import remains a local workflow; never interpret “replace local data” as “delete the family's shared history.” A future shared import needs its own preview and explicit action.

Language/theme/reminder settings remain local. “Follow latest feed” uses the latest visible saved feed, including accepted family records; another caregiver's unfinished timer is intentionally invisible. Remote activity cannot reset a notification on an offline/suspended iPhone until the app refreshes—instant family reminders are out of v1 scope.

Record storage retains overlaps. Leave the existing sleep-summary interval-union rule unchanged unless separately approved, and make its meaning clear; retaining records does not require double-counting simultaneous sleep. Feed/diaper summaries count all distinct saved records.

## 10. Privacy and access lifecycle

- Check family membership for every record/profile/invite request; a guessed ID is never authorization. Restrict database networking and runtime SQL privileges.
- Do not log notes, names, birth dates, tokens, invitation links or request bodies. Monitor operation outcomes, not baby data.
- On sign-out, stop requests and clear tokens; prevent another account from seeing cached family data. Warn about pending local work before clearing it. Never submit one account's queue under another account.
- Removal stops server access immediately; on reconnection clear that family's accepted cache and cancel pending submissions. No remote system can recall exports or wipe a disconnected device immediately. Decide any offline-access expiry policy explicitly.
- Before public release, define account/family deletion, ownership transfer, export, retention and backup expiry. Shared-record ownership after a member leaves is a product decision, not a cascade-delete default.
- Update the current offline-only privacy/support copy and store disclosures before enabling uploads. Test database backup/restore and use synthetic data in test environments.

## 11. GitHub structure and delivery

Keep the mobile project at the repository root; add only:

```text
server/LittleDays.Api/          # One C# app: Records, Families, Identity features
server/LittleDays.Api.Tests/    # Unit and SQL-backed integration tests
contracts/fixtures/            # Shared validation/serialization examples
infra/                         # Bicep + environment parameters
.github/workflows/             # Mobile/API CI and approved deployments
```

Use feature branches and PRs, required CI checks, and no direct production deployment from a developer laptop. PR CI: current TypeScript/unit/browser tests, `dotnet test`, SQL-backed concurrency/invitation tests, dependency/secret checks. EF's in-memory provider alone cannot verify SQL rowversion behavior.

Merge deploys the API to an isolated preview environment; production promotion requires your approval. Review/apply EF migrations as a separate deployment step; use additive backward-compatible changes so previous mobile releases continue working. Keep `/v1` backward compatible and retain a tested API rollback artifact.

GitHub Actions uses scoped Azure OIDC identities and protected environments. Production API credentials never belong in the app. Expo public configuration contains only the API URL and public identity configuration. Continue EAS preview builds/updates; authentication native dependencies and URL registration require a compatible new native build, not just an OTA update.

Current delivery blocker: the GitHub plugin can read this repository, but its last code-write attempt returned HTTP 403. Repository Contents write access must be fixed before remote publishing. Azure deployments additionally need a scoped deployment identity; workflow updates need their own permitted access. GitHub integration authorization and local Git credentials are separate.

## 12. Delivery milestones and review gates

1. **Approve this plan:** roles, login, scope, region/budget and retention decisions.
2. **Prove login:** two real accounts on iPhone, verified invite recipient and API token validation; no production data migration.
3. **Backend vertical slice:** family/invite + create/edit/delete, atomic first-wins and idempotency proven against SQL.
4. **Local-first integration:** draft/timer separation, durable outbox, snapshots, migration and bilingual conflict/pending UX.
5. **Two-device pilot:** test normal/offline/concurrent behavior, access removal, reminders and restore. Fix correctness before expanding scope.
6. **Public-release gate:** privacy/account-deletion decisions, approved hosting estimate, rollback and operational checks.

Planning allowance: approximately **4–6 developer-weeks** for the small release after access and decisions are available, plus your review/device-testing time. This is a rough engineering estimate, not a delivery commitment; login and migration spikes refine it.

## 13. Acceptance checklist

- Packet/API tests prove no record/profile/photo mutation before explicit Save; timers survive restart privately and Stop produces one saved record.
- Two users create overlapping entries: both remain, retain creator attribution and appear after refresh.
- Concurrent edits and edit-versus-delete: exactly one succeeds for a base version; loser is notified, refreshed and keeps only a private draft.
- Response lost after server commit: retry creates no duplicate and does not restore an obsolete record version.
- Offline Save, process kill and reconnect: queue survives; pending label is truthful; stale operations fail visibly.
- Refresh while editing never overwrites typed input or publishes it; conflicts stay visible even if detected outside the editor.
- Deliberately reversed network responses cannot roll back the cache; late responses after logout/removal cannot restore another account's data.
- Wrong-family requests, removed members, expired/revoked invitations and two concurrent invitation acceptances are handled safely.
- Account switching leaks neither cached data nor pending operations; migration retries do not duplicate legacy records.
- SQL snapshot consistency, large household dataset, database restore, narrow screens, both languages and two real iPhones pass.

## 14. Decisions requested

1. Approve .NET 10 + Azure App Service + Azure SQL + Entra External ID, with Azure resource creation gated on a regional cost estimate?
2. May caregivers edit/delete **any shared care record**, while only the owner manages profile/members?
3. Approve email-passcode login and recipient-bound, single-use invitations shared through the phone, with no app email service initially?
4. Approve v1 limits: one-baby UI, local avatars, private running timers, foreground refresh rather than instant shared notifications?
5. Confirm Australia East preference and monthly hosting budget; decide account/family deletion and backup retention before public release.

No application implementation or cloud deployment should start until you review these choices.

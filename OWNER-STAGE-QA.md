# SVÆÐIÐ — closed owner trial

This release adds an authenticated owner-only trial on `/client` and a separate `/admin/hub` editor. Existing `/admin`, homepage, pricing, inquiries, legacy locks and Sjút routes are unchanged. It is NOT a real client release.

## Isolation

Every trial page, API and image request must pass the existing CMS `isOwner` check. No browser role value is trusted. No ChatGPT visitor identity is used as CMS authentication. Anonymous responses contain no synthetic content. All trial responses are private/no-store/noindex.

Only `hub_stage_*` tables are used. The trial adapter rejects queries referencing other tables. The new migration only creates these tables and adds columns to a newly created trial table; it does not update existing rows. Synthetic records are inserted only after the authenticated owner explicitly submits `/client/setup`, with exact-Origin CSRF protection. Viewing the setup page does not create records.

The runtime does not receive the R2 binding. The existing CMS authentication verifier reads R2 sessions; no new R2 write/delete/list or mail capability is introduced. Existing public portfolio photographs are embedded in server-generated, authenticated HTML. Real bookings, client creation, invitations, uploads and public authentication endpoints are disabled for this trial.

The owner can exercise the fixed synthetic client through `/client` and edit its synthetic draft through `/admin/hub`. The two synthetic principals are chosen by server code only after CMS authentication. They are not real user accounts or an authentication alternative for customers. Public clients will still require the tested Better Auth integration in the next release.

## Validation

- Production Vinext build succeeded.
- All 82 existing regression tests passed, including private static image containment.
- 16 Worker/D1 tests passed, including the new owner-stage lifecycle test.
- Owner-stage test covers anonymous denial, forged role-cookie denial, exact Origin and CSRF, synthetic setup replay, all three moodboards, answers/messages, Pixieset hidden then explicitly published, unavailable invitations/auth/uploads, zero outbound requests, and preservation of a legacy private sentinel.
- Current production source at 94ae1d1578c3671a58a4237bad9cb646f5cc37f4 was bundled and independently cloned.
- All 16 existing D1 tables and 42 rows were exported in read-only mode, restored locally, compared exactly, and compared again after applying the new migration. R2 is NOT in this backup.

## Rollback

Re-deploy the existing version 80 or a later known-safe pre-trial version; preserve its legacy containment. Leave trial tables intact. Do not roll back to an old version that reopens client access, and do not drop tables or restore a stale whole database. Source rollback disables the trial without touching existing data.

## Still required before real clients

R2 backup/restore through Sites; production Better Auth and mail delivery; real booking/admin workflow; full authenticated browser QA after owner sign-in. Owner-trial publication does not claim any of these are complete.

# Temporary legacy client containment

Base: live v72, commit d159d13129412e733d6e8dcca0fcbc5398621ae7. Not authorized for deployment.

- Quarantine all three legacy role engines; never honor a role-selected session.
- Keep existing owner authentication and CMS/client configuration operations.
- Move 25 project-specific images out of public; retain original bytes and hashes.
- Owner-only routes embed private image data only in server modules. Do not change ?inline to ?url.
- Do not migrate or delete D1/R2 records. No schema or migration changes.
- Public homepage, pricing, booking and gallery source remains unchanged.

Validation: node --test tests/*.test.mjs (78 passed); full Sites build; node scripts/containment-runtime-qa.mjs (isolated workerd, fake D1/R2, all outbound network disabled).

Pre-deployment gates: verified production R2 backup; determine/purge pre-existing CDN cache on all attached hosts; external live/visual QA where available; fresh check that live v72 has not changed. Do not call a saved, unpublished version live.

Rollback must retain containment. Reverting directly to v72 reopens the confirmed vulnerability. Do not restore the shared DB for a code-only rollback; it also contains youth-site data.

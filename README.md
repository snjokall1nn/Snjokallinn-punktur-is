# Snjókallinn · portfolio and editor

Public home HTML is in `content/home.html`; existing images, CSS and browser scripts are in `public/`. Vinext serves the home route and the authenticated editor at `/admin`.

## Editor

- Custom admin login at `/admin/login`; server-side PBKDF2 hash in secret `ADMIN_PASSWORD_HASH`, username in `ADMIN_USERNAME`. HttpOnly secure sessions last 12 hours; logout revokes them. IP-based failed-login throttling.
- `cms/draft.json` and `cms/published.json` are separate R2 snapshots. Draft saves use ETag conditional writes and revisions to reject stale edits.
- Uploads use authenticated same-origin requests, image signature checks and a 15 MB limit. The browser converts supported images to WebP at a maximum 2200 px edge.
- Draft media is owner-only; published images in visible albums are public. Removing a photo from drafts does not delete a currently published photo or its object. Media garbage collection is intentionally separate from publishing.
- New files are uploaded from the editor; external Pixieset links do not automatically import photos.
- Public album grids open an accessible image dialog with keyboard navigation and touch swipes.
- Layout editing supports reorder/hide and custom text sections. Freeform drag-and-drop layout design is not included.

Run `node --test tests/cms.test.mjs tests/pricing.test.mjs`, `node tests/chat.cjs` and `node tests/chat-timing.cjs`. Build through the Sites skill. The hosting manifest preserves project identity and declares the BUCKET R2 binding.

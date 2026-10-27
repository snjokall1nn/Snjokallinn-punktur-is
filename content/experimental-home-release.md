# Experimental Editorial — Drög 4.1

Prepared 2026-10-19 for snjokallinn.com. SAVE ONLY. Do not deploy without Alex's final authorization.

## Candidate

The photography homepage route already imports `content/home-c.html`. The sjut.is host branch is unchanged. Preserve the Drög 4.1 compositions and face-safe Embla overlay. No prices, inquiry APIs, service page files, story page files, authentication or runtime data were modified in this release-preparation pass.

Homepage CMS integration now uses the existing authenticated draft/published endpoints and media viewer. New fields prefixed `editorial-` coexist with all old field IDs. Custom legacy copy is preserved for the four previously mapped text fields. Unedited old defaults do not overwrite the new editorial copy. Existing albums, custom text sections, visibility and explicit ordering are supported. The approved default visual sequence stays intact until the editor changes ordering. Composed photography assets remain source-managed; uploaded CMS albums remain editable through the existing admin.

No CMS drafts or published content, production storage, or live booking submissions were written during the audit.

## Rollback

The last deployed version before the redesign is version 63, source commit `5ef8348016a2de6bec1672ff70667f112df9cd32`. It remains in native Sites history with its original deployment archive. Drög 4.1 before CMS integration is separately saved as version 69, commit `7602461a249a0a02fcfc1f634958d91d1d9b2078`.

`content/home-before-experimental.html` is an exact byte-for-byte copy of the homepage from version 63. For a homepage-only rollback, switch ONLY the HTML import in `app/route.ts` from `../content/home-c.html?raw` to `../content/home-before-experimental.html?raw`. Leave the host routing and all service and booking routes intact. All original text field IDs, original assets, scripts and service functions remain available. Build, save and obtain authorization before deploying that rollback. Do not restore an old CMS data snapshot over newer owner edits. A full version-63 deployment should be used only if a whole-site rollback is intended.

## Verified

- Production build passed.
- 34 targeted automated tests passed: CMS save/publish separation, content validation, owner authentication/session isolation, image privacy, editorial draft loading, custom copy compatibility, heading line spans, visibility/order/custom sections, pricing, inquiry handling, SEO and host boundaries. CMS frontend checks run in a simulated DOM, not a visual browser.
- All 13 homepage images decoded; image paths and responsive source paths exist. CSS, scripts and font resources exist.
- All 14 internal homepage links resolve to source routes and valid target anchors.
- The price/detail page, story page, pricing calculations, inquiry handler, seed and authentication source were byte-compared against Drög 4.1 and are unchanged.
- Embla geometry checked at 320, 360, 375, 390, 414, 430, 650, 651, 768, 1024, 1280 and 1440 px. Overlay starts at 76% of the uncropped final image height, below the conservatively protected face region ending at 58%. It stays within the visual container and allocated vertical space. Both photos keep their intrinsic ratios. This is a geometry check, not rendered-browser confirmation.

## Still unverified

Browser access to the local preview was denied by the browser's security policy earlier in this session. It was not bypassed. Desktop/mobile rendered typography, scrolling, image focus/crops and click interactions therefore still need visual confirmation, especially Embla at 320–430 px. The standalone review supports switching widths and is for visual review only.

Live owner login/edit/save/preview/publish against the deployed environment was not exercised. No real email or booking was sent. External Instagram/Pixieset availability and actual video playback remain unverified. Existing API tests exercise delivery with a mocked provider and verify errors/recipients/calculated totals.

## Hero collection update — Drög 4.2

Reuses the old `selectHero` server-side selection function and original 20-photo collection. A stable-ID cookie excludes the previous photograph even after the owner reorders the collection. Only the hero placeholder is selected at request time; other photographs and all six approved section texts stay fixed. One-image collections are supported; zero images and duplicate entries are rejected.

The existing admin now has a Forsíðumyndir tab. Add/upload, remove, reorder and edit accessible descriptions there, then use the existing draft/save/preview/publish workflow. CMS media access now recognizes published hero uploads while draft-only uploads remain owner-only. Older editor clients cannot accidentally erase the new collection. No production CMS data was changed during preparation.

Original hero files are retained; 640px and 1200px WebP derivatives are provided through srcset with actual width descriptors. New uploads use the existing image-processing/upload path at a maximum of 1600px and WebP quality .84. Intrinsic width/height and high fetch priority are emitted on the server; only the selected photo is requested. The hero uses its complete natural aspect ratio on desktop and mobile, with no cover crop. The mobile intro starts below the photo to avoid obscuring it.

45 targeted tests now pass, including the actual homepage GET function with cookies, public/draft collections, unchanged non-hero markup and Sjút host isolation. Build passed. Original responsive images decode; the largest 640px derivative is 76,230 bytes. Non-hero section DOMs were compared against version 70 and are unchanged. The price/detail, story, pricing-calculation and inquiry-handler files are unchanged. Visual browser QA and signed-in live admin interactions remain unverified because of the previously reported browser access restriction. Standalone Drög 4.2 includes a Ný forsíðumynd control for review; production selection uses the server cookie, not the standalone preview script.

Version 70 remains available but does not contain this newly requested hero collection feature. Do not publish version 70 as the completed candidate. The newly saved version containing this update must receive Alex's final authorization. Keep the version-63 homepage archive and rollback instructions above.

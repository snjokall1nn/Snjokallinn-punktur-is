# Secure fallback and pre-publication gates

Primary candidate: saved v73, commit 0b81833b607ac8e71b3dfb532d9100571229f867. Do not alter or deploy it without approval.

This separate fallback keeps v73's role/API/page containment and all current data. It only changes project-static-image delivery to unconditional maintenance (including the owner). Homepage, price, booking, CMS, client configuration and R2 owner-image delivery are unchanged. No old public image path or role session is restored. This version has no database migrations.

If deployed as an approved recovery action, owner-only project-static previews are temporarily unavailable; configuration editing remains available. Roll forward to an explicitly reviewed repaired version, never directly back to v72.

Missing production access/actions:

1. Managed R2 bucket identity and read/list/export access with object bytes and metadata. Logical binding BUCKET alone is not an external bucket credential.
2. A separate private restore bucket/location with put/read permissions and no production application binding. Export clients/, erna/uploads/, may/data/, cms/, media/, inquiries/, and inquiry-delivery/ where present. Discover additional relevant prefixes using a complete listing. Exclude authentication sessions/tokens from ordinary backup deliverables.
3. Paginate all listings, compute SHA-256 of object bytes, preserve HTTP/custom metadata, compare an after-export listing/ETags to identify concurrent changes, and test restore outside production. A mutable bucket is not an atomic snapshot; arrange a consistent cutoff or repeat until stable.
4. Hosting cache configuration and route/domain inventory, including custom cache keys, query variants, Workers Cache cross-version behavior and any extra reverse proxy. Static default headers alone do not prove actual configuration.
5. Coordinated purge when old public responses stop, using the actual cache mechanism. Zone purges do not purge Workers Cache. TTL waiting starts after the last possible old public response, not while live v72 still serves it. Browser/downloaded copies cannot be remotely revoked.
6. Unrestricted authorized live HTTP/header access and permitted managed browser preview. Current visual QA remains unverified at 320, 360, 375, 390, 414, 430px and desktop widths, including Embla face/overlap, crop, horizontal overflow and actual interactions.

No global admin credentials are needed. Use provider-scoped access through secure configuration or ask the hosting owner to perform the export/restore and cache actions. Do not put tokens in chat or expose a temporary unauthenticated export endpoint.

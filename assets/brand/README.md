# Brand Assets

`assets/brand` is the single source of truth for shared product icons.

- `hero.png` is used to generate desktop application icons.
- `public/favicon.svg` and `public/icons.svg` are synced into app `public/` directories by `scripts/sync-brand-assets.mjs`.

Do not edit copied files in `apps/web/public` or `apps/mobile/public` directly. Update the shared files here and run `pnpm sync:brand-assets` instead.

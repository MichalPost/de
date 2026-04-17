# Brand Assets

`assets/brand` is the single source of truth for shared product icons.

- `hero.png` is the original shared artwork.
- `public/favicon.svg` is the square master icon used by web, mobile, and desktop packaging.
- `public/icons.svg` is the shared SVG sprite file synced into app `public/` directories by `scripts/sync-brand-assets.mjs`.

Do not edit copied files in `apps/web/public` or `apps/mobile/public` directly. Update the shared files here and run `pnpm sync:brand-assets` instead.

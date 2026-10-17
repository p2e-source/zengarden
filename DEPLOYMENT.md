# Zen Garden — installation

## cPanel

Create `public_html/zen-garden/`. Upload **zen-garden-cpanel.zip** and extract it inside that folder. Confirm `index.html`, `assets/`, `art/`, `fonts/`, and `licenses/` are directly inside the folder, without another nested project directory.

Open **https://play2earn.world/zen-garden/**. No database, Node application, or build command is required on the host. Keep ordinary files at 644 and directories at 755. Use HTTPS and a current browser with WebGL support.

For the portal admin choose a locally hosted game, slug **zen-garden**, and upload the production ZIP. Client routing fallback is unnecessary. Use `public/art/cover.jpg` as the cover and `public/art/social.jpg` as the featured banner. Upload actual screenshots from `screenshots/` separately.

Do not replace any portal root files or other games. If global Apache rewriting catches existing static folders, ask the host to let this folder take precedence without replacing the portal routing configuration.

## Listing metadata

- Title: Zen Garden — A Little World of Peace
- Category: Simulation / Relaxation
- Age rating: Everyone
- Slug: zen-garden
- SEO title: Zen Garden – Relaxing 3D Garden Builder | Play2Earn.world
- Description: Create your own peaceful 3D Zen garden. Arrange stones, plant trees, rake sand, and enjoy beautiful relaxing scenery. Play free online.
- Short description: Build a little world of peace. Arrange miniature trees and stones, rake patterns into sand, and unwind beside your own tranquil pond.

## GitHub Pages

Push the complete source to a repository you own. Choose **Settings → Pages → GitHub Actions**, then manually run **Publish Zen Garden to GitHub Pages**. The workflow installs dependencies, runs unit/browser checks, builds, and uploads only `dist/`. It does not enable Pages settings automatically. The canonical link remains Play2Earn.world.

## Saves and sound

Gardens save locally in this browser. Changing browser, domain, or port creates a separate save. Browser privacy settings or clearing site data may erase progress. Reset asks for confirmation and can be undone during the same visit.

Choose **Settings → Enable sound** after a tap or click. Device mute and browser audio permissions still apply. Graphics presets apply immediately. Photo mode offers camera angles, hidden controls, and a downloadable PNG of the complete framed garden.

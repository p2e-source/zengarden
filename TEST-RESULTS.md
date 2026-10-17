# Test results — 17 October 2026

## Release checks

- TypeScript checks and production build passed.
- **6 unit tests passed**: all item footprints and rotations, valid initial layout, collisions, bridge/pond overlap, transactional undo/redo, bounded histories, and malformed saves.
- **16 Playwright Chromium tests passed**, with no skipped, failed, or flaky cases. The final run lasted approximately 154 seconds and served the **extracted cPanel ZIP** at `/zen-garden/`, rather than the source development server.
- Every one of the 13 extracted production files responded successfully over HTTP with correct JavaScript MIME types and byte-for-byte SHA-256 equality to the packaged files.
- The ZIP passed the portal's archive validator: root `index.html`, approved file extensions, safe paths, and size limits. Compressed size: 1,051,349 bytes. Expanded size: 2,395,852 bytes.

## Responsive browser matrix

Each of these viewports passed canvas sizing, scene-bounds framing, all ten essential 44px button targets within the viewport, no horizontal overflow, object placement, object dragging, undo/redo, saving, reloading, screenshot capture, and absence of browser errors:

| Width | Height | Input coverage |
| --- | --- | --- |
| 360 | 800 | Chromium touch emulation |
| 375 | 812 | Chromium touch emulation |
| 390 | 844 | Chromium touch emulation |
| 430 | 932 | Chromium touch emulation |
| 844 | 390 | Chromium touch emulation |
| 768 | 1024 | Chromium touch emulation |
| 1024 | 768 | Mouse |
| 1366 | 768 | Mouse |
| 1440 | 900 | Mouse |
| 1920 | 1080 | Mouse |
| 320 | 568 | Chromium touch emulation |
| 1000 | 500 | Mouse |

The remaining four browser tests covered persistent sand strokes with undo/redo, photo angles and hidden controls with a valid PNG download, atmosphere/graphics/audio controls and preference restore, and two-finger zoom/cancelled touch gestures without accidental placement.

## Visual review

Actual final screenshots at **390×844, 844×390, 768×1024, 1366×768, and 1920×1080** were opened and inspected. The garden, tree tops, pond, bridge, and toolbars remain visible, without stretched rendering, overlapping controls, or clipped labels. Phone portrait uses a more elevated angle; landscape uses a side tray. All twelve final viewport screenshots are included under `screenshots/`.

The responsive foundation was checked before the editing tools and final art were added. Additional interactive review in the in-app browser exercised placement, dragging, rotation, raking, reset confirmation, and saved reloads. A visible rake-texture defect found during development was fixed before the packaged-build checks.

## Limits

These are **Chromium software/emulation tests**, not certification on physical iPhones, Android phones, or Safari/Firefox. Physical device frame rates, thermal behavior, speakers, device mute switches, and iOS download behavior still need device testing. AudioContext activation and controls were tested; perceived sound quality on device speakers was not measured.

A modern HTTPS browser with WebGL is required. Storage belongs to the browser origin; clearing site data removes the garden. The app limits the garden to 30 objects, 80 saved rake strokes, and 40 undo transactions to control memory use. The cover artwork is promotional illustration, not a gameplay screenshot. GitHub Pages requires the repository owner to enable its Actions publishing source before the prepared workflow can publish.

Machine-readable results: [browser-results.json](tests/browser-results.json).

# Deutschland Pathways

**Rafi’s Sprachwelt · Local personal directory**

A completely redesigned static application for finding Bangladeshi people already in Germany through four pathways: Ausbildung, FSJ, BFD, and Au-pair. The included 20 records are fictional; every portrait is an original local SVG illustration.

## Open locally

For clean website URLs, run this from the project folder:

```text
node scripts/serve.js
```

Open **http://127.0.0.1:4173/**. Home uses `/`, the directory uses `/directory/`, and profiles use `/profile/?id=…`. No npm packages, build, internet connection, or account are needed. Stop the server with **Ctrl+C**. Use `node scripts/serve.js 4174` if the default port is occupied.

The server listens only on this computer and serves static application files. Existing `/index.html`, `/directory.html`, and `/profile.html` bookmarks redirect to the clean routes, preserving query parameters. Folder routes support direct visits and refreshes without an SPA fallback. The same folder structure works under a subdirectory on a static host that serves `index.html` files; legacy HTML bookmarks also have a client-side redirect for those hosts. Nothing is deployed automatically.

Double-clicking **index.html** still works as an offline compatibility option. A `file://` address necessarily shows a filename; use the HTTP address above for clean URLs. Classic scripts and local fonts work in either mode.

## What changed

- Light lavender theme matching the supplied Wörterbuch screenshot: the original `#f1f4f7 → #dad8f1 → #c0d3f1` background gradient, vivid blue headings, white glass surfaces, outlined blue pills, and `#5b21b6 → #2563eb` action gradients.
- A compact homepage containing only the shared header, the full title and introductory description, four category links, and footer. Categories sit directly beneath the introduction, with a two-by-two arrangement on phones; there are no people previews, floating compositions, search panels, statistics, or extra sections on the homepage.
- Clean directory styling with search, live counts, purple/blue pathway selection, city filtering, name/date sorting, simple white cards, and clear/reset controls. Navigation, profile headers, placeholders, empty states, footer, and native form controls share the reference palette.
- Poppins for English and SolaimanLipi for Bengali across the whole website, including mixed-language content and controls. All font files and licenses are bundled locally; no runtime font connection or installation is required.
- List, Icon, and Full views inside every category and the full directory. The selected view stays in the URL along with filters and sorting, survives filter resets, and returns with the profile's back link.
- Clean folder URLs throughout navigation, categories, profiles, breadcrumbs, and return links. Legacy bookmarks retain filters and profile IDs when redirected. Shared assets resolve correctly from nested pages, including when the site is installed under a subfolder.
- Editorial profile header, Bengali name, German location, optional arrival year and training specialization, optional biography and gallery, and related records.
- New Rafi’s Sprachwelt / Deutschland Pathways branding and a compact footer. No marketing sections or public-network claims.
- The four approved categories are the only valid categories in the data and UI. Five fictional people appear in each, all marked `inGermany: true`.

White surfaces, fine borders, and subtle shadows keep the interface simple. The shared navigation has just Home and Directory, and the footer is a single compact row. The homepage is arranged to keep all four categories visible in normal desktop and phone viewports; smaller windows and enlarged text may still need scrolling rather than clipping content. Missing personal images use a light lavender neutral illustration with initials derived from the supplied name; no photograph is invented.

## Motion

Motion is limited to short page/card entrances, filter feedback, navigation underlines, and the mobile menu. The homepage has no floating graphics, pointer effects, or continuous animation. `prefers-reduced-motion` disables the remaining motion.

## Personal records, kept outside Git

Private development pages load shared pathway metadata from `js/data.js`, the existing fictional development fixtures from `js/demo-data.js`, then optionally load `data/people.local.js`. The homepage renders only titles and categories and does not request local personal data. Public exports omit both the private loader and the fictional fixture loader. An empty local placeholder can contain:

```js
window.DP_LOCAL_PEOPLE = null;
```

The ignored local file may contain personal records. Its contents must never be copied into tracked files, examples, tests, or documentation. `null` or a missing local file uses the clearly labelled demo collection. An array replaces the demo collection; `[]` deliberately opens an empty local directory. An invalid array displays the labelled demo fallback instead of silently omitting records. `data/people.example.js` documents the schema and is never loaded by the application.

Each local record requires a unique lowercase `id`, a non-empty `name`, and `inGermany: true`. Use `ausbildung`, `fsj`, `bfd`, or `au-pair` when the category is known. Use a blank `category` when it was not supplied; those records remain visible under **All people**, with a neutral **Pathway pending** status. This status does not add a fifth pathway filter. `pathwayNote` preserves supplied details without inferring a category, and is searchable alongside specializations and Facebook URLs. Missing cities, arrival years, photographs and biographies remain blank. An absent image displays a neutral placeholder.

All remaining fields are optional. `createdAt` should be an ISO date for accurate **Recently added** sorting. A missing date sorts after dated records. `arrivalYear` must be a valid past/current year; `specialization` is displayed only for Ausbildung. A user's request to include Facebook URLs in their local directory authorizes the local link action; it does not establish permission to publish those records publicly.

Put approved personal images in **assets/private/** using simple filenames such as `portrait-01.jpg`. Both this directory and `data/people.local.js` are excluded by **.gitignore**. Accepted image formats are SVG, PNG, JPG/JPEG, WebP, and AVIF. Filenames may contain letters, digits, underscores, and hyphens. External image URLs and traversal paths are rejected; broken images receive a local avatar fallback.

The ignore rules prevent new files from being added by normal Git operations; they do not remove files that were already tracked. Do not put personal records in tracked demo files. Before any future commit, check that personal data and assets are absent from the staged changes.

This is a **local-use convention, not access control**. Anyone who can access these files can read the records. There is no password gate, authentication, database, encryption, or false claim of secure storage. Nothing is deployed or pushed automatically. Do not publish or share a folder containing private records. A missing optional file may appear as a resource warning in browser developer tools; it does not prevent the demo fallback from working.

## Search and Facebook

Search matches English/Bengali names, category labels/descriptions, and German cities. It ignores case, Latin accents, and extra spaces while preserving Bengali vowel signs. `FOJ` and `FÖJ` find the supplied FÖJ detail; `aupair`, `au pair`, and `au-pair` match the Au-pair pathway. FÖJ records remain in FSJ and show an `FSJ · FÖJ` badge in every directory view. Pathway and city filters combine with search. Filters, sorting, and display view are reflected in the URL when the browser allows file history updates, and the profile’s back link preserves them.

All demo Facebook URLs are empty. A Facebook action appears on the card and profile only when `facebookPermission: true` and `facebookUrl` is an HTTPS URL on an exact approved Facebook hostname. Links reject embedded credentials, alternate ports, unsafe schemes, and lookalike hosts, and open with `noopener noreferrer`. No scraping or lookup is performed.

## Files

```text
index.html                                   Homepage at /
directory/index.html                         Directory at /directory/
profile/index.html                           Profiles at /profile/
directory.html, profile.html                 Old-bookmark redirect pages
css/main.css                                  Design system and page styling
css/components.css                            Sticky navigation, cards, footer
css/animations.css                            Short entrances and reduced motion
css/responsive.css                            Responsive and touch adaptations
js/data.js                                    Shared categories and record normalization
js/demo-data.js                               Existing development-only fictional fixtures
js/public-data.js                             Approved-public-data bootstrap
data/people.public.js                         Explicit public dataset (currently empty)
js/local-data.js                              Optional ignored local-data loader
js/app.js                                     Shared safe rendering and category links
js/routes.js                                  Clean routes and offline link compatibility
js/legacy-route.js                            Legacy bookmark redirects
js/directory.js                               Search, filters, sorting, URL state
js/profile.js                                 Profile details and optional fields
data/people.example.js                        Documented local record schema
data/people.local.js                          Ignored private local records (never exported)
assets/icons/                                 Updated local logo and favicon
assets/images/                                Original fictional SVG portraits
scripts/create-assets.js                      Optional Node-only art regeneration
scripts/serve.js                              Dependency-free local static HTTP server
tests/verify.js                               Dependency-free checks
tests/routes.js                               Real HTTP route/redirect/asset checks
tests/security.js                             Publication/export/local-server security regressions
tests/public.js                               Actual generated output and project-path tests
scripts/check-public-files.js                  Guard against tracked local/private files
scripts/export-public.js                      Optional allowlisted demo-only static export
scripts/public-files.json                     Explicit reviewed public-asset manifest
scripts/public-policy.js                      Shared export, privacy, SVG, and credential policy
SECURITY.md                                   Publication controls and private reporting guidance
.gitignore                                    Private-data and private-image exclusions
```

## Verification and limits

See [SECURITY.md](SECURITY.md) before sharing source or deploying a website artifact. `node scripts/check-public-files.js` checks the actual Git index for restricted files, including files already tracked despite ignore rules. `node tests/security.js` checks these publication controls and the local static server's Host validation, response headers, and symlink boundaries.

`node scripts/export-public.js --output NEW_DIRECTORY` builds and validates a temporary staging directory, then creates a separate public output without merging or replacing existing files. Public pages load only `data/people.public.js` through `js/public-data.js`; they never request or contain `data/people.local.js`, including a stub. No real profiles are currently approved for publication, so the public directory honestly starts empty. It does not substitute fictional people. Private development records remain unchanged.

Run `node tests/verify.js` for the dependency-free verification suite. Add `--local` to validate every record and profile link in the ignored local file, without copying personal records into test fixtures. It checks source parsing, HTML nesting/references, CSS delimiters, category distribution, every profile route, search and filter combinations, sorting, reset and empty states, local-data fallback/override, pending pathways, optional fields, image fallback, approved-URL handling, injection resistance, and menu events. Responsive rules are checked at 360, 390, 768, 1024, and 1440 pixels. It also checks clean navigation paths, subfolder deployment paths, query-preserving skip links, legacy redirects, and offline compatibility.

Run `node tests/routes.js` for real HTTP checks of clean routes, refreshes, legacy redirects, query preservation, page assets, font MIME types, HEAD requests, and missing routes. This test starts a temporary loopback server and closes it afterward.

The suite uses a small DOM test double and structural CSS checks. **It is not a browser layout engine.** The authoring session has no connected browser and its native computer-use helper is unavailable. Rendered visual QA, actual pointer/frame-rate testing, keyboard focus testing, screen-reader testing, and real-device verification remain unverified. Inspect all three pages at the listed widths before relying on the layout or distributing the app.

Typography uses local Poppins WOFF2 files for Latin text and the bundled SolaimanLipi TrueType font for Bengali characters through a Unicode-specific font face. The Poppins files match the reference project byte for byte. Font licenses are included as `assets/fonts/Poppins-OFL.txt` and `assets/fonts/SolaimanLipi-OFL.txt`. Earlier Sora and Manrope assets and their licenses remain archived in `assets/fonts/`, but are neither preloaded nor referenced by the active CSS. The finished site makes no external font requests. Full localization and record-editing forms are not part of this build; records are supplied via the ignored local file. No software or npm packages were installed, no backend was added, and no deployment or Git push was performed.

## Phase 3 public export workflow

1. Edit and test the private source project. Run `node tests/verify.js --local`, `node tests/routes.js`, and `node tests/security.js`.
2. Review `data/people.public.js` separately. Local Facebook linking flags are not publication consent. The file currently approves no profiles.
3. Run `node scripts/export-public.js --output "D:\Deutschland\German Website\deutschland-pathways-public"` only when that target does not already exist.
4. Run `node scripts/check-public-files.js --output "D:\Deutschland\German Website\deutschland-pathways-public"` and `node tests/public.js "D:\Deutschland\German Website\deutschland-pathways-public"`.
5. Preview with `node scripts/serve.js 4174 --root "D:\Deutschland\German Website\deutschland-pathways-public" --base /deutschland-pathways/`, then visit `http://127.0.0.1:4174/deutschland-pathways/`. Stop with Ctrl+C.
6. Publishing, repository creation, Git initialization, visibility changes, pushes, and deployment are separate owner-approved Phase 4 tasks. None is automated.

The exporter refuses an existing target, including one containing `.git`. It validates all output paths, bytes, SVGs, asset references, and public data before and after copying. Future updates should use a new staging folder; replacing a previous public folder requires a separate reviewed decision. Do not copy the whole source directory or private Git history. No passwords, database, or new backend have been introduced.

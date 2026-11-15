# Deutschland Pathways — Phase 3 Verification Report

Prepared: 15 November 2026 at 19:01 (Asia/Dhaka).

Private source: `D:\Deutschland\German Website\deutschland-pathways-source`  
Public output: `D:\Deutschland\German Website\deutschland-pathways-public`

No GitHub repository was created, deleted, renamed, pushed, deployed, or given a different visibility. No Git history was rewritten. No source records or private images were deleted or modified.

## A. Project Architecture

The project is a buildless static HTML/CSS/classic-JavaScript application with custom Node.js utilities. It has no React/Next/Vite installation, npm dependency manifest, application backend, database, authentication service, privileged API integration, or required environment variables. There is no framework build, TypeScript project, or configured lint command to run.

The homepage contains the existing header, title, description, four pathway categories, and footer. Directory cards and profile pages are rendered in the browser. Search, category/city filters, sorting, and List/Icon/Full views compose through query parameters. A profile's return link preserves directory context. Folder routes and legacy redirects support direct visits, refreshes, offline file compatibility, and the `/deutschland-pathways/` project prefix.

Data now has three explicit parts:

1. `js/data.js`: pathway metadata and record normalization, without embedded profiles.
2. Private development: `js/demo-data.js` retains the **existing** fictional development fixtures; `js/local-data.js` optionally loads the ignored real local records. This preserves private development behavior.
3. Public export: `data/people.public.js` plus `js/public-data.js` load only separately reviewed public records. The current approved public dataset is empty. Neither the private loader nor the development demo loader is exported or requested.

All active fonts and images load locally. Poppins remains the Latin font and SolaimanLipi remains the Bengali font. CSS, font binaries, icons, and image bytes are unchanged. No appearance redesign, new authentication system, automatic deployment workflow, or external runtime dependency was introduced.

The earlier publicly inspected website used GitHub's generated Pages/Jekyll deployment workflow. That historical observation is not proof of the new private repository's current Pages settings. No custom deployment workflow exists in the inspected private source tree, and owner-only current Pages settings could not be inspected.

### Source Git verification

- Initial branch: `main`; initial working tree: clean.
- Initial/latest commit: `a0a6443c5eefe7c72a6259b08d31ed512a308bb6`.
- Intended HTTPS origin matches `nay102/deutschland-pathways-source.git` exactly.
- A read-only authenticated Git remote query returned the same `main` commit; `origin/main` also matches it. The intended commit therefore exists remotely.
- One commit is reachable through the accessible local refs. No tags or additional local branches were found.
- GitHub's connector returned Not Found for the private repository; unauthenticated repository metadata also returned 404. This is consistent with restricted access but does not directly verify the owner's **Private** visibility setting. That setting requires owner verification.
- Phase 3 changes are saved locally, unstaged and uncommitted. The original commit and refs are unchanged.

## B. Private Data Security

The real local file contains 36 records. It remains ignored and untracked in the current source index. Its SHA-256 is unchanged from the initial baseline. No files were present in `assets/private/` to export, and no private-image path is permitted in public output.

In private development, the optional loader still places local records into the in-memory directory, search, and profile renderer. This is a local-use convention, not access control. A static website that ships those values would disclose them regardless of `.gitignore` or frontend hiding. The local Facebook linking flag was not treated as consent for publication.

The public build now excludes `data/people.local.js` **entirely**, including the previous null stub. It excludes `js/local-data.js`, `js/demo-data.js`, and `assets/private/`. Public pages do not request these paths. Public requests for them returned 404 during testing.

No real records are approved for public display in the current public dataset. The safe alternative is an honest empty public directory, with the existing layout and working controls. No fake public profiles were invented or substituted. Individual unapproved profile IDs return the existing not-found page. Displaying real public profiles remains a separate publication/consent decision. A genuinely private multi-user directory would need approved backend storage and server-side authorization; that architecture was not added.

Privacy checks compare normalized identity/contact fingerprints in memory, including percent, numeric HTML, and Unicode escape decoding. They also compare private-file content hashes to detect renamed byte-for-byte copies. These checks never print private values and do not claim to recognize every possible transformation or establish consent.

### Local Git object retention

The broad object scan found the private-record blob in the **local source Git object database**. Follow-up inspection confirmed that it is not reachable from any accessible branch, tag, or reflog, and is not in the current index. Git integrity checking identified it as an unreachable blob. This finding does **not** establish that the private blob was pushed to the new remote repository.

It was left intact because cleanup or history modification was not authorized. Keep the source repository and local Git database private. Never copy its `.git` directory into the future public repository. The generated public directory contains no Git metadata and none of this blob's content.

## C. Public Export System

`scripts/public-files.json` is an explicit reviewed allowlist. It includes 52 public files: required HTML, browser JavaScript, styles, active local fonts and their licenses, icons, the reviewed vector images, the empty public dataset, and `.nojekyll`. Inactive archived fonts and development-only files are omitted from the deployment artifact.

`scripts/public-policy.js` centralizes manifest/path validation, exact public-page bootstrap generation, privacy fingerprints and file hashes, credential-shaped text checks, SVG checks, font signatures, and approved-data validation. The public HTML transformation only swaps the data bootstrap; it preserves the existing page markup and layout.

The exporter:

1. Validates the allowlist and source files without following symlinks/junctions.
2. Prepares only allowlisted public bytes and rejects privacy/security findings.
3. Writes a new temporary staging directory.
4. Validates the **actual staging directory** recursively.
5. Creates the separate target only if it does not already exist.
6. Copies the approved bytes with exclusive file creation, then validates the **actual final directory** again.
7. Cleans only its own verified temporary staging directory.

It never recursively copies the private source tree, merges into an existing target, deletes unknown files, replaces `.git`, or initializes Git. Refusal of an existing target containing a Git marker is covered by a regression test.

`node scripts/check-public-files.js --output DIRECTORY` independently validates actual output: exact file membership and byte integrity, required pages/assets, unknown directories, prohibited paths, symlinks/junctions, content fingerprints/hashes, credential-shaped text, SVG active/external resources, font signatures, HTML anchors, CSS/font references, routes, and public-data loading. Missing, modified, escaping, or unexpected output causes a nonzero exit status. The source-index check remains available separately.

### Image review

All 24 SVGs in `assets/images/` were inspected individually. Twenty exactly reproduce from the project's pre-existing vector-avatar generator; they are generic generated artwork, not photographs or portraits of the real local records. The other four are decorative vector illustrations or the neutral placeholder. No scripts, event handlers, external resources, embedded raster images, or sensitive metadata were found. Their original bytes were preserved. The companion image inventory records each filename, classification, hash, and check result without including personal records.

## D. Code Changes

| File | Change |
| --- | --- |
| `.gitignore` | Added explicit root privacy rules and local audit/export/key-container exclusions without removing existing rules. |
| `index.html` | Added the existing development-only data bootstrap in private source; public export substitutes the public bootstrap. |
| `directory/index.html` | Same bootstrap separation and an ID for the existing empty-state description; layout unchanged. |
| `profile/index.html` | Same private/public bootstrap separation; layout unchanged. |
| `js/data.js` | Separated shared metadata/normalization from profile data. |
| `js/demo-data.js` (new) | Moved the existing fictional fixtures out of deployable shared code; no new people invented. |
| `data/people.public.js` (new) | Explicit public publication input, currently empty. |
| `js/public-data.js` (new) | Validates and loads only approved public data; rejects demo/private-image records. |
| `js/app.js` | Added accurate public dataset messaging; private behavior retained. |
| `js/directory.js` | Added accurate public labels and an honest empty-public-data state. |
| `scripts/public-files.json` | Removed private/demo loaders and inactive fonts; explicitly included public data and `.nojekyll`. |
| `scripts/public-policy.js` (new) | Centralized reusable publication and content policy. |
| `scripts/check-public-files.js` | Added actual-directory validation, source integrity checks, privacy/content checks, and nonzero failure behavior. |
| `scripts/export-public.js` | Added staged validation, exclusive final output creation, full private-file exclusion, and final validation. |
| `scripts/serve.js` | Added explicit static-root/project-prefix preview options and correct text-license MIME handling; retained loopback/Host/symlink protections. |
| `scripts/create-assets.js` | Updated the development generator to load the existing separated demo fixture file. |
| `tests/verify.js` | Made the existing safe DOM loader reusable against generated output and retained source coverage. |
| `tests/security.js` | Strengthened privacy, manifest, content, output, failure-code, symlink, and overwrite-protection regressions. |
| `tests/public.js` (new) | Tests the actual generated site, empty-data behavior, controls, routes, assets, and project-path serving. |
| `README.md` | Documented the repeatable private-source/public-export workflow and preview commands. |
| `SECURITY.md` | Documented data separation, publication policy, validation scope, limits, and owner-only actions. |

The final report and supporting sanitized verification/image inventories are stored in ignored `security-reports/`, not in deployment output. No project files were deleted. No private records, CSS, font binaries, icons, or image assets were changed.

## E. Security Audit Results

| Finding | Severity | Affected file/location | Risk | Fix applied | Remaining action |
| --- | --- | --- | --- | --- | --- |
| Public export included a prohibited local-data stub | High policy violation | Original `scripts/export-public.js` output | Private-loader coupling could be mistaken for a safe publication boundary. | Stub and private loader are completely absent from output. | None for this artifact. |
| Public mode silently fell back to fictional profiles | Medium | Original shared data/export bootstrap | Misleading published content and unclear approval boundary. | Public data is explicit, empty, and never falls back to development fixtures. | Owner must review any future real public records. |
| Checker originally inspected only Git paths | High | Original `scripts/check-public-files.js` | Modified/renamed confidential output or unexpected files could bypass an index-only check. | Actual staging and final-directory content validation added, with negative tests and nonzero CLI failures. | Re-run for every future artifact. |
| Private blob retained in local Git storage | Medium, local source | Unreachable local Git blob; not reachable history or export | Copying the private Git database would retain confidential bytes. | Public output is fresh and contains no Git database. No cleanup was performed. | Keep source private; any cleanup requires separate approval. |
| Repository visibility could not be read through the connector | Manual verification | GitHub source repository settings | A successful Git read alone does not prove the visibility label. | Exact remote and remotely available commit verified; no settings changed. | Owner must verify the repository is Private. |
| Earlier public exposure may have left copies | Residual privacy risk | Previously public repository/site outside this export | Removing current files or deleting a repository cannot prove all copies are gone. | No confidential data carried into this artifact. | Review prior exposure separately; rotate credentials if any are later identified as exposed. |
| Person-named SVGs required inspection | Informational | 24 reviewed vector images | File extension/name alone cannot establish safety or provenance. | Individually inspected; 20 reproduced exactly from the existing generator; none flagged. | Review future replacements. |
| No credential candidates detected by available checks | Informational | Working files, Git objects, final output | Pattern checks have blind spots and do not prove credential inactivity. | Local redacted path/content/credential checks completed. | Reputable scanner run remains advisable when installed/approved. |

No confirmed XSS, open redirect, database credential, privileged frontend token, or external runtime service dependency was identified in the inspected code. User-controlled values continue through text rendering, approved link validation, and local image-path checks. This is not a guarantee of zero vulnerabilities.

## F. Test Results

| Command/check | Final result |
| --- | --- |
| `node scripts/check-public-files.js` | Passed: no restricted files in the current Git index. |
| `node tests/verify.js --local` | Passed: 43 application verification groups, including all 36 private local records handled in memory without printing their values. |
| `node tests/routes.js` | Passed: 66 source HTTP route, redirect, refresh, and asset checks. |
| `node tests/security.js` | Passed: 126 security regressions, including negative/fail-closed tests. |
| `node tests/public.js` | Passed: 138 generated-site DOM/control/project-path HTTP checks on a temporary export. |
| `node tests/public.js "D:\Deutschland\German Website\deutschland-pathways-public"` | Passed: the same 138 checks on the exact final folder. |
| `node scripts/check-public-files.js --output "D:\Deutschland\German Website\deutschland-pathways-public"` | Passed: 52 files, zero approved public records, no detected private data or unexpected output. |
| Working-tree credential-shaped content checks | Zero findings in 74 source files before the ignored report was added. |
| Git object content checks | 72 blob/commit objects inspected; zero credential-pattern findings. One private-record blob found and confirmed unreachable from refs/reflogs. |
| Git integrity and history | One reachable commit; integrity check completed; unreachable objects recorded without deletion. |
| Final public content/path/SVG/font/reference checks | Passed; all 52 files validated against the reviewed source plan and private fingerprints/hashes. |
| Asset/private-record preservation | Passed: original CSS, fonts, icons, images, and real local-data bytes remain unchanged. |

Two initial export tests failed during implementation. The first exposed an overly narrow filename rule that rejected `people.public.js`; the rule was corrected while retaining traversal and restricted-path checks. The second exposed missing text-license MIME handling in preview; it was corrected and retested. No failure was bypassed or labelled as a pass.

Skipped/not applicable:

- Gitleaks and TruffleHog are not installed. No scanner was installed without approval; no external scanning service received code or findings. Built-in checks are not presented as a Gitleaks scan.
- No npm install/audit, framework build, TypeScript check, or lint script applies to this dependency-free project.
- The browser inventory returned no enabled apps or browsers. Rendered visual QA, actual browser console-error inspection, keyboard/screen-reader behavior, and real-device checks were not performed. DOM tests use a test double; HTTP tests use real loopback requests. CSS responsiveness was structurally checked at 360, 390, 768, 1024, and 1440 pixels.
- There are no approved public people, so no real public person's rendered profile could be exercised. The public not-found route and the existing private profile renderer were tested instead; no fake public profile was added to make tests pass.

All temporary HTTP servers started by tests were closed. No preview or deployment service was left running.

## G. Final Public Export

Exact directory: **`D:\Deutschland\German Website\deutschland-pathways-public`**.

It did not exist at initial inspection or immediately before export. No existing output, unknown file, or `.git` directory was overwritten. A separate temporary staging build passed validation before final creation. The final directory was then revalidated and tested independently.

Contents:

- `.nojekyll`
- Five HTML files: homepage, directory/profile folder pages, and two legacy redirect pages.
- `css/`: four unchanged stylesheets.
- `js/`: seven browser-required scripts, with no local/demo loader.
- `data/people.public.js`: empty approved-public dataset.
- `assets/fonts/`: eight active font/license files.
- `assets/icons/`: two unchanged icons.
- `assets/images/`: 24 reviewed vector illustrations/placeholders.

Total: **52 files**. No `.git`, `.env`, private records/stubs, private images, tests, development scripts, reports, database dumps, backups, or source maps are present.

For future development, edit the private source, run tests, review the public data input, export to a new directory, validate the actual output, preview at the project path, and obtain separate publication approval. The updated README provides exact commands. Git initialization and GitHub publication belong to a later phase and were not performed.

## H. Remaining Risks

1. The owner must open the source repository settings and confirm the **Private** visibility label. Authenticated Git access and unauthenticated 404 responses corroborate restricted access but are not a direct settings read.
2. Rendered browser/console/device verification remains unavailable in this environment. HTTP and DOM checks passed; they do not replace visual inspection.
3. The public directory intentionally has no approved people. Publishing real records requires an explicit separate consent/content decision. Do not copy the private dataset or treat local link permission as public approval.
4. Unreachable private bytes remain in the local source Git database. Nothing from that database is in public output. Do not reuse that history for the public repository; cleanup requires separate approval.
5. Prior public copies/caches and owner-only GitHub security/Pages settings were not modified or proven purged. If actual credentials are later identified as previously exposed, revocation/rotation may be necessary even if the old repository was deleted.
6. Credential pattern/fingerprint checks are bounded. No detected credential was tested against an external provider, and no credential-inactivity or zero-risk guarantee is made.

## I. Final Status

**PHASE 3 REQUIRES MANUAL VERIFICATION**

The complete public artifact has been generated and has passed all available programmatic privacy, security, functional, asset, and project-path HTTP checks. No known blocking private-data defect remains in that artifact. The remaining important verification is the source repository's actual GitHub visibility setting; rendered browser review is also outstanding. These are reported rather than falsely marked passed. No Phase 4 GitHub operations were performed.

# Security and publication

This is a static HTML/CSS/JavaScript application. Browser assets and GitHub Pages files are public resources. There is no authentication backend, database, privileged API integration, or production environment-variable requirement. Confidential records cannot be protected by frontend hiding or a password embedded in JavaScript.

## Separate private development from public output

`data/people.local.js` and `assets/private/` are private local inputs. Never publish them or confidential derivatives. Git ignore rules do not untrack committed files or prevent directory uploads.

Private development uses `js/demo-data.js` for its existing fictional fallback fixtures and `js/local-data.js` for optional personal records. Those loaders and their data are excluded from public exports. The shared `js/data.js` contains categories and validation code only.

Public pages load `data/people.public.js` using `js/public-data.js`. This is an explicit publication input, not an automatic copy of private records. It currently contains no approved profiles. Public pages display an honest empty directory; fictional profiles are not silently substituted. A local `facebookPermission` flag authorizes a local link only and is not proof of public disclosure consent. Any future real public records require a separate owner-reviewed publication decision.

## Validate source and generated files

```text
node scripts/check-public-files.js
node tests/verify.js --local
node tests/routes.js
node tests/security.js
node scripts/export-public.js --output NEW_DIRECTORY
node scripts/check-public-files.js --output NEW_DIRECTORY
node tests/public.js NEW_DIRECTORY
```

The source check inspects the actual Git index, including restricted files already tracked despite ignore rules. The output checker recursively inspects the actual generated directory: exact allowlist membership and byte integrity, required files, unknown directories, private paths, symlinks/junctions, private-content hashes, normalized private-record fingerprints, credential-shaped text, active/external SVG content, font signatures, routes, anchors, and asset references. It rejects missing or unexpected content with a nonzero exit status. It never prints private values.

The explicit manifest includes only approved browser assets and necessary font licenses. The exporter validates a temporary staging directory before creating the target and validates the final copy again. It refuses to merge into or overwrite any existing directory, including `.git`. It never copies private Git history. Temporary cleanup is restricted to the exact temporary directory it created.

These checks do not establish legal consent, detect every possible encoding/transformation of confidential data, guarantee absence of secrets, or prove that a credential is inactive. If an approved public asset changes, review it again. Do not bypass a failing gate.

## Secret and history review

When an official reputable scanner is installed, run fully redacted scans locally:

```text
gitleaks git --log-opts="--all" --redact=100 --no-banner .
gitleaks dir --redact=100 --no-banner .
gitleaks dir --redact=100 --no-banner NEW_DIRECTORY
```

Keep detailed reports outside deployment output and in an ignored local location. Do not install tools, upload code to external scanning services, or retrieve stored production secrets without approval. Review GitHub secret-scanning alerts and push-protection settings with owner access; their availability/settings are not inferred from local tests.

If a credential was previously exposed, arrange explicit owner-approved revocation or rotation. Deleting a repository or removing a current file does not invalidate leaked credentials or prove old copies are gone. History cleanup needs a protected backup, collaborator coordination, explicit approval, and verification. Never automatically force-push, rewrite history, delete repositories, or change visibility.

## Local preview boundary

The development server binds to loopback, validates Host, uses same-origin resource protection and no-referrer headers, and rejects symlink/junction aliases. It serves private data only when that file exists in the private source root. Public export roots contain no private file and return 404 for private data/loader requests. These Node server headers do not configure GitHub Pages.

Use `--root NEW_DIRECTORY --base /deutschland-pathways/` to test the actual exported site at the future project path. No deployment is configured or triggered by these commands. GitHub Pages visibility, artifact settings, old caches/copies, and private repository visibility require independent owner verification where API access is unavailable.

Report security issues privately through a channel agreed with the owner. Never disclose credentials or personal records in public issues or pull requests.

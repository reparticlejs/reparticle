# CI, releases, and site deployment

## Checks

`check.yml` runs `pnpm check` and `pnpm packages:check` on pull requests, pushes to
`main`, and manual runs on Ubuntu, Windows, and macOS. The consumer check installs the actual tarballs in a
temporary app, audits production dependencies, checks TypeScript without
`skipLibCheck`, and renders particles in Chromium.

Common tests include unit and WebGL2 tests on every OS. macOS also runs the required
`pnpm test:webgpu` suite, including backend parity. WebGPU tests require a working
browser adapter and fail explicitly when one is unavailable. Locally, use
`pnpm test` for normal checks and `pnpm test:webgpu` for additional WebGPU coverage.

### Local commands and file layout

| Command               | Checks                                                    |
| --------------------- | --------------------------------------------------------- |
| `pnpm test`           | Unit and WebGL2 tests across the workspace                |
| `pnpm test:webgpu`    | WebGPU rendering and backend parity (requires an adapter) |
| `pnpm check`          | Formatting, lint, types, common tests, and builds         |
| `pnpm packages:check` | Install and verify the packed packages in a separate app  |

Browser tests live in each package's `tests/browser/webgl2` or
`tests/browser/webgpu` folder. Put comparisons that need both backends in
`webgpu`. There is no test-file list to maintain.

`scripts/testing/browser-project.ts` defines the browser projects;
`scripts/testing/chromium.ts` owns renderer selection. macOS uses Metal for both
backends to avoid comparing hardware WebGPU with SwiftShader's different math
precision. Hosted Linux and Windows use software WebGL2; local runs use their
normal renderer unless `REPARTICLE_TEST_RENDERER` selects `metal` or `software`.
The Checks matrix declares the renderer, WebGPU coverage, and separate
`verify-lockfile` and `upload-site` flags for tasks that run only once. Steps use those capabilities
rather than checking OS names.

`scripts/check-packed-consumer.ts` packs, installs, and checks the application in
`scripts/consumer/main.ts`. That fixture is type-checked against the installed
tarballs, outside the workspace.

Both workflows use `.github/actions/setup` for Node.js, pnpm, and dependency
installation. Jobs that launch a browser pass `browser: 'true'`; the setup action
lets Playwright install Chromium and the required platform libraries.

Make all three **Release checks (OS)** jobs required status checks in the repository's `main` branch
rules if merges must wait for CI. The workflow file alone does not enforce this.

Git enforces LF line endings for text on all three systems. Only Ubuntu uploads
the Pages artifact; deployment and releases wait for the entire matrix to pass.

## Action dependencies

Workflow `uses` entries keep readable version tags. GitHub executes the commits
recorded in `.github/workflows/actions.lock`, including nested action dependencies.
The lockfile is generated; do not edit it by hand.

After adding or changing an action, run:

```sh
gh extension install github/gh-actions-lock --pin v0.4.0
gh actions-lock --migrate-local-actions
gh actions-lock --verify
```

The extension requires `gh auth login`. Review and commit the workflow changes
and lockfile together. CI verifies the lockfile on Ubuntu; Dependabot checks
weekly for action updates and updates their locks in the same PR.

Same-repository actions use `$/` so GitHub resolves them at the workflow's commit.
Workflow lockfiles are currently a GitHub public-preview feature.

## Package releases

1. Add a changeset with `pnpm changeset` and merge it with the code.
2. After Checks succeeds on the current `main` commit, `publish.yml` creates or
   updates **Prepare the next reparticle release**. It also explicitly dispatches
   Checks on that PR's branch, since GitHub's default token does not trigger PR
   workflows automatically.
3. Review and merge the release PR. Checks runs on the merged commit.
4. The release workflow builds and verifies the packages again, then publishes
   through npm trusted publishing and creates package Git tags and GitHub releases.

Publication is disabled until the repository variable `NPM_TRUSTED_PUBLISHING`
is `true`. Version PRs can run before publication is enabled. Already-published
versions are handled by Changesets; setup does not release another `0.1.0`.

### One-time setup

In GitHub **Settings → Actions → General**, enable **Allow GitHub Actions to create
and approve pull requests**.

For **both** `@reparticle/core` and `@reparticle/pixi`, open npm package settings and
add a GitHub Actions trusted publisher:

| Setting              | Value          |
| -------------------- | -------------- |
| Organization or user | `reparticlejs` |
| Repository           | `reparticle`   |
| Workflow filename    | `publish.yml`  |
| Environment          | Leave empty    |

Enable direct publishing for this trusted publisher (not staging-only), then set
GitHub **Settings → Secrets and variables → Actions → Variables →
NPM_TRUSTED_PUBLISHING** to `true`. No npm token secret is required.

Only a successful `push` check from this repository's `main` branch can release.
The workflow checks that the candidate is still the current main commit before
selecting a release and again before publishing. Builds and consumer checks run
without npm publishing permissions; only the publishing job receives OIDC access.

npm scans new versions before they become installable, so registry availability
may lag successful publication by several minutes.

## GitHub Pages

In GitHub **Settings → Pages**, choose **GitHub Actions** as the build source. Then
set the repository Actions variable `PAGES_ENABLED` to `true`.

Successful pushes to `main` deploy the checked site to:

https://reparticlejs.github.io/reparticle/

The build includes docs, API, Lab, examples, and their shared artwork. PR builds
use the same path prefix but never deploy. Local development stays at `/`.

For a custom domain, configure it in Pages and set Actions variables `SITE_URL`
to its HTTPS origin and `SITE_BASE` to `/`. These values are included in the Turbo
build cache key. The `github-pages` environment can require deployment approval
if desired.

Commit and push these workflow files before enabling either deployment variable.
Neither variable is set by adding this configuration to the repository.

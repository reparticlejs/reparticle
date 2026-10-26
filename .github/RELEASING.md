# CI, releases, and site deployment

## Checks

`check.yml` runs `pnpm check` and `pnpm packages:check` on pull requests, pushes to
`main`, and manual runs on Ubuntu, Windows, and macOS. The consumer check installs the actual tarballs in a
temporary app, audits production dependencies, checks TypeScript without
`skipLibCheck`, and renders particles in Chromium.

Make all three **Release checks (OS)** jobs required status checks in the repository's `main` branch
rules if merges must wait for CI. The workflow file alone does not enforce this.

Git enforces LF line endings for text on all three systems. Only Ubuntu uploads
the Pages artifact; deployment and releases wait for the entire matrix to pass.

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

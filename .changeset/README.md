# Changesets

For a user-facing change to core or pixi, run `pnpm changeset`. Choose the affected
package, the bump (patch, minor, or major), and a short description of the change.
Commit the generated Markdown file with your code. Documentation-only and tooling
changes do not need a changeset.

Core and pixi share one release version. A changeset for either package bumps both.
The player, examples, and site are private and are not versioned or published.

Before preparing a release, inspect the pending changes with `pnpm changeset status`.
Run `pnpm release:version` to update package versions, generate changelogs, and
refresh the lockfile. Review and commit those changes, then run `pnpm check`.

Versioning does not publish packages, create Git tags, or commit changes automatically.
GitHub Actions manages release PRs and publication after CI passes. See
[release setup](../.github/RELEASING.md) for the one-time configuration.

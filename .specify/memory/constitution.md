# Portfolio Constitution

## Core Principles

### I. Sole Authorship

Every commit author and committer MUST be Bogdan Shcherbinin
`<blessed-bless@users.noreply.github.com>`. The repository git identity MUST be
set to that name and email before the first commit of a change. Trailers such
as `Co-authored-by`, and any credit to an assistant, generator, or tool, are
forbidden in commits, tags, pull requests, license headers, and README.

Rationale: the public git history is the owner's work. Extra authors change
who GitHub lists as a contributor.

### II. No Assistant Attribution

Source, comments, commit messages, pull request title and body, and docs MUST
NOT name AI products, coding agents, or assistants. Existing case copy that
describes the owner's own products stays as written.

Rationale: attribution leaks into the published site and the review record.

### III. Branch and Review Discipline

Feature work for this redesign MUST live on `feat/portfolio-redesign` and open
as a pull request into `cursor/portfolio-hero-and-home`. Commits MUST use the
imperative mood and stay focused. Merging, pushing to `main`, pushing to the
default branch, and force-pushing shared branches are forbidden.

Rationale: the live site tracks the default branch. A reviewable PR is the
only delivery path.

### IV. Secrets Stay Out

Agents MUST NOT read, create, or modify `.env*` files or any secret material.
Keys and tokens stay in the environment. Logs MUST NOT print secrets.

Rationale: this repository is public portfolio source.

### V. Small Surface, Strict Types

New dependencies MUST be minimal and justified in the pull request. Prefer the
libraries already in the project. Functions and components MUST stay small and
do one thing. TypeScript MUST stay strict, with no `any`. Dead code and unused
files MUST be removed in the same change that makes them unused.

Rationale: a portfolio that cannot be explained in a file review will rot.

## Quality Gates

`npm run build`, `npm run check`, and `astro check` MUST pass before a pull
request is opened. UI changes MUST be verified in a browser, including wheel
scrolling, reduced motion, both locales, and both themes. The pull request
MUST state what changed, why, how to check it, risks, and any owner decision
still open. Prices on the order page MUST NOT be edited; current values are
listed for the owner.

## Repository Discipline

Russian and English copy MUST stay in parity for every new string. English
pages MUST NOT contain Cyrillic. Existing case URLs, Open Graph images,
structured data, sitemap, robots, and the Yandex verification file MUST keep
working. Analytics loads only after consent and is removed when consent is
revoked. The order page structure and its current prices stay unless the
owner changes them.

## Governance

This constitution overrides conflicting local habits for this repository.
Amendments require a version bump, a dated note in this file, and a commit
that changes only governance text when the amendment is the whole change.
MAJOR bumps remove or redefine a principle. MINOR bumps add a principle or
expand a rule. PATCH bumps clarify wording.

Every pull request is checked against these principles before it is opened.
Complexity that is not required by the spec is rejected. Runtime guidance for
contributors lives in `AGENTS.md` and this file.

**Version**: 1.0.0 | **Ratified**: 2026-11-27 | **Last Amended**: 2026-11-27

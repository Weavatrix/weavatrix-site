# weavatrix.com

[![Deploy](https://github.com/Weavatrix/weavatrix-site/actions/workflows/deploy-site.yml/badge.svg)](https://github.com/Weavatrix/weavatrix-site/actions/workflows/deploy-site.yml)
[![Website](https://img.shields.io/website?url=https%3A%2F%2Fweavatrix.com)](https://weavatrix.com)
[![MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Static public surface for the [Weavatrix organization](https://github.com/Weavatrix): its vision,
open-source ecosystem, Core, Refactor, Online, research direction, and reproducible evidence.
Plain HTML/CSS/JS, no build step, no framework, no dependencies.

The production copy tracks the current public family:

| Product | Release | License | Boundary |
| --- | --- | --- | --- |
| `weavatrix` | 1.9.2, Rust engine 2.7.4 | MIT | 43 read-only, network-free MCP tools via Cargo or npm |
| `weavatrix-rust` | 2.7.4 | MIT | protocol-independent repository-intelligence engine and library |
| `weavatrix-refactor` | 1.0.11 | MIT | hash-bound local source edits and drift-checked rollback |
| `weavatrix-online` | 0.3.2 | MIT | seven explicit source-free network methods; Core and Refactor remain separate |

The engine recognizes 24 code, contract, configuration, document, and UI-source
surfaces. The published basic release proof (engine 2.0.2, Core 1.1.2) covers a real 192-file repository
with 1,531 nodes and 7,287 typed edges, a short 1,000-call engine load,
architecture gates, and 87.71% Rust line coverage (80.57% functions and 85.30%
regions). The packed and isolated-installed Core 1.1.2 boundary also completed
1,000 native MCP calls at 136.83 calls/s with zero failures.

Extracted from the main repository (`Weavatrix/weavatrix`) so the engine repo stays focused on
the engine; this repo owns everything the site needs, including its deploy config.

## Layout

- `site/` — the pages and assets served at weavatrix.com (overview, ecosystem, blog, Refactor,
  security, privacy, licenses, favicons, OG images, and deterministic graph animation)
- `wrangler.jsonc` — Cloudflare static-assets Worker config (`weavatrix.com` + `www` custom domains)
- `.github/workflows/deploy-site.yml` — deploys on every push to `main` that touches the site

## Deploy

Automatic: push to `main`. Requires a `CLOUDFLARE_API_TOKEN` repository secret (Workers Scripts:
Edit permission; add `CLOUDFLARE_ACCOUNT_ID` too if the token sees more than one account). Without
the secret the workflow skips gracefully.

Manual: `npm run deploy` (after `npx wrangler login` once). Verify the returned
production deployment and `https://weavatrix.com` after every release-copy update.

## Checks

```sh
npm test
```

Keeps versioned asset references in `index.html` unstale, keeps the hero animation deterministic
(no `Math.random`), and holds every source file to the same 300-line budget the engine repo uses.

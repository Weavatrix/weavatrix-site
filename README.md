# weavatrix.com

Static landing site for [Weavatrix](https://github.com/sergii-ziborov/weavatrix) Core, Refactor and
Online. Plain HTML/CSS/JS, no build step, no framework, no dependencies.

The production copy tracks the current public family:

| Product | Release | License | Boundary |
| --- | --- | --- | --- |
| `weavatrix` | 1.1.0, Rust engine 2.0.0 | MIT | 39 read-only, network-free MCP tools via Cargo or npm |
| `weavatrix-rust` | 2.0.0 | MIT | protocol-independent repository-intelligence engine and library |
| `weavatrix-refactor` | 0.1.5 | MIT | reviewed local source edits and rollback |
| `weavatrix-online` | 0.3.1 | MIT | explicit source-free network workflows |

The engine recognizes 24 code, contract, configuration, document, and UI-source
surfaces. The current basic release proof covers a real 185-file repository, a
short 1,000-call engine load, architecture gates, and 87.81% Rust line coverage.
The packed and isolated-installed Core 1.1.0 boundary also completed 1,000
native MCP calls at 172.97 calls/s with zero failures.

Extracted from the main repository (`sergii-ziborov/weavatrix`) so the engine repo stays focused on
the engine; this repo owns everything the site needs, including its deploy config.

## Layout

- `site/` — the pages and assets served at weavatrix.com (index, security, privacy, license,
  favicons, OG images, the deterministic hero-graph animation)
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

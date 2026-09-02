// Ported from the engine repo's file-size-budget test when site/ moved here: versioned asset
// references must not go stale, the hero animation stays deterministic, and source files keep
// the same 300-line owner-module budget the engine holds itself to.
import test from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {existsSync, readFileSync, readdirSync} from 'node:fs'
import {extname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url))
const CODE_EXTENSIONS = new Set(['.js', '.css', '.html'])
const MAX_LINES = 300

function physicalLineCount(text) {
    if (text === '') return 0
    const lines = text.split(/\r?\n/)
    if (lines.at(-1) === '') lines.pop()
    return lines.length
}

test('site assets stay within the 300-line budget', () => {
    const oversized = []
    for (const entry of readdirSync(join(REPO_ROOT, 'site'), {withFileTypes: true})) {
        if (!entry.isFile() || !CODE_EXTENSIONS.has(extname(entry.name).toLowerCase())) continue
        const lines = physicalLineCount(readFileSync(join(REPO_ROOT, 'site', entry.name), 'utf8'))
        if (lines > MAX_LINES) oversized.push(`site/${entry.name}: ${lines}`)
    }
    assert.deepEqual(oversized, [], `Split oversized concerns:\n${oversized.join('\n')}`)
})

test('versioned asset references are current and the hero animation stays deterministic', () => {
    const index = readFileSync(join(REPO_ROOT, 'site/index.html'), 'utf8')
    assert.ok(index.includes('href="/styles.css?v=0.5.2-seo-term"'), 'the page loads the current navigation stylesheet without a stale asset')
    const styles = readFileSync(join(REPO_ROOT, 'site/styles.css'), 'utf8')
    assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.hero-graph \{ display: none; \}/)
    assert.doesNotMatch(styles, /@media \(max-width: 760px\)[\s\S]*#hero-field \{ display: none; \}/)
    assert.ok(index.includes('src="/graph-animation.js?v=0.3.9-hero-graph-6"'), 'the page loads the deterministic hero graph without a stale asset')
    assert.ok(index.includes('src="/hero-field.js?v=0.3.9-hero-field-1"'), 'the page loads the ambient hero field without a stale asset')
    assert.match(index, /https:\/\/weavatrix\.com\/og-image-v4\.png/)
    assert.doesNotMatch(index, /og-image-v[123]\.png/)
    const refactor = readFileSync(join(REPO_ROOT, 'site/refactor.html'), 'utf8')
    assert.match(refactor, /https:\/\/weavatrix\.com\/og-image-v4\.png/)
    const seo = readFileSync(join(REPO_ROOT, 'site/seo.html'), 'utf8')
    assert.match(seo, /https:\/\/weavatrix\.com\/og-image-v4\.png/)
    assert.match(seo, /seo_audit/)
    assert.match(seo, /weavatrix-seo mcp/)
    for (const tool of [
        'seo_audit', 'seo_inventory', 'seo_opportunities', 'seo_plan', 'seo_gate',
        'seo_compare', 'seo_query', 'seo_retrieve', 'seo_chunks', 'seo_similar',
        'seo_explain', 'seo_diff', 'seo_links', 'seo_vectors', 'seo_observations',
    ]) {
        assert.ok(seo.includes(`<code>${tool}</code>`), `${tool} is documented on the product page`)
    }
    const animation = readFileSync(join(REPO_ROOT, 'site/graph-animation.js'), 'utf8')
    assert.doesNotThrow(() => new Function(animation), 'the extracted browser script parses')
    assert.doesNotMatch(animation, /Math\.random/, 'the hero graph layout stays deterministic')
    const field = readFileSync(join(REPO_ROOT, 'site/hero-field.js'), 'utf8')
    assert.doesNotThrow(() => new Function(field), 'the ambient hero field script parses')
    assert.doesNotMatch(field, /Math\.random/, 'the ambient hero field stays deterministic')
    assert.equal(createHash('sha256').update(animation).digest('hex'), '403bfc05b46f8bd7659f2097a5271e3024d1f9d7b62ed42cd742dc90b50c8dd7', 'the complex hero graph implementation is unchanged')
    assert.equal(createHash('sha256').update(field).digest('hex'), '2e480c2776eae2b24a4c16ab1ccd75d894a5efa459d1bf774b301c1f21d7f665', 'the ambient graph field implementation is unchanged')
})

test('ecosystem page maps the public stack and keeps benchmark claims scoped', () => {
    const ecosystem = readFileSync(join(REPO_ROOT, 'site/ecosystem.html'), 'utf8')
    for (const project of ['weavatrix', 'weavatrix-rust', 'weavatrix-refactor', 'weavatrix-online', 'weavatrix-quality', 'weavatrix-seo', 'weavatrix-graph', 'weavatrix-parse', 'weavatrix-scan', 'weavatrix-search', 'weavatrix-search-vector', 'weavatrix-semantic', 'weavatrix-memory', 'weavatrix-git', 'weavatrix-clone', 'weavatrix-lsp', 'weavatrix-edit', 'weavatrix-refactor-plan', 'weavatrix-worktree', 'weavatrix-rust-refactor', 'weavatrix-loom', 'weavatrix-js', 'weavatrix-refactor-js', 'weavatrix-site', 'weavatrix-hosted', 'weavatrix-blocks', 'weavatrix-hosted-enterprise', 'weavatrix-hetero']) {
        assert.match(ecosystem, new RegExp(`\\b${project}\\b`), `${project} is represented`)
    }
    assert.match(ecosystem, /not universal rankings/i)
    assert.match(ecosystem, /ripgrep was 1\.35x faster/i)
    assert.match(ecosystem, /private research track/i)
    assert.match(ecosystem, /Ollama F16 prefill by 5\.31% at 512 tokens and 6\.22% at 2,048 tokens/i)
    assert.ok(ecosystem.includes('href="/hetero"'), 'the Hetero research summary links to its evidence page')
})

test('Hetero publishes hardware evidence, quality classes, and negative results without exposing the private repository', () => {
    const hetero = readFileSync(join(REPO_ROOT, 'site/hetero.html'), 'utf8')
    for (const claim of ['26 / 26', '−6.22%', '18 exact-prompt pairs', '−22.03%', '23/28', '89.1%', '+18%', '2/4 exact']) {
        assert.ok(hetero.includes(claim), `${claim} is documented on the Hetero page`)
    }
    assert.match(hetero, /Performance PASS ≠ quality PASS/)
    assert.match(hetero, /NO-GO/)
    assert.match(hetero, /hardwareEvidence: false/)
    assert.match(hetero, /Apple hardware conclusions come only from the committed macOS evidence bundles/i)
    assert.doesNotMatch(hetero, /github\.com\/Weavatrix\/weavatrix-hetero/i)
})

test('the engineering journal publishes Hetero as a scoped research article', () => {
    const blog = readFileSync(join(REPO_ROOT, 'site/blog.html'), 'utf8')
    for (const claim of ['26/26', '18 exact-prompt pairs', '5.31%', '6.22%', '36.34%', '22.03%', '2/4', '1.6×', '+18%']) {
        assert.ok(blog.includes(claim), `${claim} is retained in the Hetero article`)
    }
    assert.match(blog, /Performance PASS is not quality PASS/)
    assert.match(blog, /approximate and off by default/)
    assert.ok(blog.includes('href="/hetero"'), 'the article links to the complete evidence page')
    assert.ok(blog.includes('href="/blog.css?v=0.2.2-wrap"'), 'the article layout uses its current stylesheet')
    assert.doesNotMatch(blog, /github\.com\/Weavatrix\/weavatrix-hetero/i)
})

test('the journal matches the site wrap and publishes a scoped MCP catalog article', () => {
    const blog = readFileSync(join(REPO_ROOT, 'site/blog.html'), 'utf8')
    const css = readFileSync(join(REPO_ROOT, 'site/blog.css'), 'utf8')
    assert.match(blog, /class="blog-page"/)
    assert.ok(blog.includes('id="catalog-is-not-context"'), 'the catalog article is addressable')
    assert.ok(blog.includes('src="/hero-field.js?v=0.3.9-hero-field-1"'), 'the journal uses the ambient field')
    for (const claim of ['9,331 to 485', 'o200k_base', '94.8%', '12/12', 'token_budget', 'Tool Search']) {
        assert.ok(blog.includes(claim), `${claim} is retained in the catalog article`)
    }
    assert.ok(blog.includes('A smaller catalog is not a permission grant'))
    assert.ok(blog.includes('None of this is a claim that every Weavatrix session costs 485 tokens'))
    assert.doesNotMatch(css, /\.blog-page \.wrap \{[^}]*max-width:\s*none/, 'the journal uses the same 1240px wrap as every other page')
    assert.match(css, /--blog-gutter:\s*0/)
    assert.match(blog, /Independent agent write-ups measured 141k tokens/)
    assert.ok(blog.includes('id="search-evidence-graph"'), 'the SEO article is addressable')
    assert.match(blog, /Weavatrix SEO/)
    assert.match(blog, /Search Evidence Graph/)
})

const PAGES = ['index.html', 'ecosystem.html', 'blog.html', 'refactor.html', 'hetero.html',
    'settings.html', 'privacy.html', 'security.html', 'license.html', 'seo.html']

function relativeLuminance(hex) {
    const channels = [1, 3, 5].map(at => parseInt(hex.slice(at, at + 2), 16) / 255)
        .map(value => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function contrast(foreground, background) {
    const light = Math.max(relativeLuminance(foreground), relativeLuminance(background))
    const dark = Math.min(relativeLuminance(foreground), relativeLuminance(background))
    return (light + 0.05) / (dark + 0.05)
}

test('every page resolves its appearance before the first paint', () => {
    for (const name of PAGES) {
        const html = readFileSync(join(REPO_ROOT, 'site', name), 'utf8')
        assert.match(html, /href="\/theme\.css\?v=/, `${name} loads the appearance stylesheet`)
        assert.match(html, /src="\/theme\.js\?v=/, `${name} loads the appearance controller`)
        // The stamp has to be inline in the head: an external file would paint
        // the wrong theme first and correct it after, which is the flash the
        // whole arrangement exists to avoid.
        const head = html.slice(0, html.indexOf('</head>'))
        assert.match(head, /data-theme-resolved/, `${name} stamps the resolved theme in its head`)
        assert.match(html, /data-theme-choice="auto"/, `${name} offers the control`)
        assert.match(html, /data-theme-choice="light"/, `${name} offers light`)
        assert.match(html, /data-theme-choice="dark"/, `${name} offers dark`)
    }
})

test('the appearance defaults to auto and the choice stays in the browser', () => {
    const controller = readFileSync(join(REPO_ROOT, 'site/theme.js'), 'utf8')
    assert.match(controller, /CHOICES = \['auto', 'light', 'dark'\]/)
    assert.match(controller, /return CHOICES\.indexOf\(value\) === -1 \? 'auto' : value/,
        'an absent or unrecognised stored value falls back to auto')
    assert.match(controller, /prefers-color-scheme: light/, 'auto reads the system preference')
    assert.match(controller, /media\.addEventListener\('change'/,
        'a system change while on auto repaints without a reload')
    assert.doesNotMatch(controller, /document\.cookie|fetch\(|XMLHttpRequest/,
        'the choice is never sent anywhere')

    const settings = readFileSync(join(REPO_ROOT, 'site/settings.html'), 'utf8')
    assert.match(settings, /aria-pressed="true"[^>]*>Auto|data-theme-choice="auto" aria-pressed="true"/,
        'auto is the pressed option on a first visit')
    assert.match(settings, /weavatrix-theme/, 'the page names the key it writes')
})

test('the light palette clears WCAG AA for body text', () => {
    const css = readFileSync(join(REPO_ROOT, 'site/theme.css'), 'utf8')
    const block = css.slice(css.indexOf(':root[data-theme-resolved="light"] {'))
    const token = name => {
        const found = block.match(new RegExp(`--${name}: (#[0-9a-f]{6})`))
        assert.ok(found, `the light palette declares --${name}`)
        return found[1]
    }
    const background = token('bg')
    // Every colour that carries words on the page background, including both
    // accents: the dark theme's #8b7cff and #37d7be reach 1.9 and 2.0 here,
    // which is why the light theme darkens them rather than reusing them.
    for (const name of ['text', 'muted', 'accent', 'accent2', 'warn']) {
        const ratio = contrast(token(name), background)
        assert.ok(ratio >= 4.5,
            `--${name} (${token(name)}) reaches only ${ratio.toFixed(2)}:1 on ${background}`)
    }
})

test('terminal syntax stays light on a dark block in both themes', () => {
    const styles = readFileSync(join(REPO_ROOT, 'site/styles.css'), 'utf8')
    const theme = readFileSync(join(REPO_ROOT, 'site/theme.css'), 'utf8')
    assert.match(styles, /--term-fg: #e8eaf6/)
    assert.match(styles, /--term-prompt: #3ee0c4/)
    assert.match(styles, /\.term pre \{[^}]*color: var\(--term-fg\)/)
    assert.match(styles, /\.g \{ color: var\(--term-prompt\)/)
    assert.match(styles, /\.scenario \.result \{ color: var\(--term-prompt\)/)
    assert.doesNotMatch(styles, /\.g \{ color: var\(--accent2\)/)
    assert.doesNotMatch(theme, /--term-fg:/, 'light theme must not rebind terminal foreground')
    assert.doesNotMatch(theme, /--term-prompt:/, 'light theme must not rebind the prompt colour')
})

test('the Refactor chip has a colour to use', () => {
    // `--warn` shipped in the Refactor chip and its gradient without ever being
    // declared, so the chip rendered inherited near-white text inside an amber
    // border.
    const theme = readFileSync(join(REPO_ROOT, 'site/theme.css'), 'utf8')
    const styles = readFileSync(join(REPO_ROOT, 'site/styles.css'), 'utf8')
    assert.match(styles, /var\(--warn\)/, 'the chip still uses the token')
    assert.match(theme, /^\s*--warn: #[0-9a-f]{6};/m, 'and the token is declared')
})

test('the featured journal entry collapses to one column on a narrow screen', () => {
    const css = readFileSync(join(REPO_ROOT, 'site/blog.css'), 'utf8')
    // The featured entry is styled by a three-class selector, and a media query
    // adds no specificity, so a collapse written as `.blog-feature` alone loses
    // to it and the article body is clipped off the side of a phone screen.
    const narrow = css.slice(css.indexOf('@media (max-width: 900px)'))
    assert.match(
        narrow,
        /\.blog-page \.blog-feature\.journal-entry \{ grid-template-columns: 1fr;/,
        'the narrow-screen collapse must match the desktop selector it overrides'
    )
    const phone = css.slice(css.indexOf('@media (max-width: 760px)'))
    assert.match(
        phone,
        /\.blog-page \.blog-feature\.journal-entry \{ padding:/,
        'the narrow-screen padding must match the desktop selector it overrides'
    )
})

test('primary navigation exposes the ecosystem, blog, and SEO on every product surface', () => {
    const pages = ['index.html', 'ecosystem.html', 'refactor.html', 'blog.html', 'hetero.html', 'seo.html']
        .map(name => readFileSync(join(REPO_ROOT, 'site', name), 'utf8'))
    for (const html of pages) {
        assert.match(html, /<nav[^>]*aria-label="Primary"/)
        assert.match(html, /href="\/ecosystem"/)
        assert.match(html, /href="\/blog"/)
        assert.match(html, /href="\/seo"/)
    }
    const index = pages[0]
    assert.match(index, /class="portal-strip"/)
    assert.match(index, /See the whole stack/)
    assert.match(index, /Read the field notes/)
    const styles = readFileSync(join(REPO_ROOT, 'site/styles.css'), 'utf8')
    assert.doesNotMatch(styles, /nav\s*\{\s*display:\s*none/)
})

test('Refactor is a first-class product surface with the complete tool catalog', () => {
    const index = readFileSync(join(REPO_ROOT, 'site/index.html'), 'utf8')
    const refactor = readFileSync(join(REPO_ROOT, 'site/refactor.html'), 'utf8')
    const privacy = readFileSync(join(REPO_ROOT, 'site/privacy.html'), 'utf8')
    const security = readFileSync(join(REPO_ROOT, 'site/security.html'), 'utf8')
    assert.ok(index.includes('href="/refactor"'), 'the landing page links to the Refactor product page')
    const methods = [
        'rename_symbol', 'rename_related_symbols', 'apply_edit_plan', 'rollback_last_apply',
        'change_signature', 'edit_symbol', 'bulk_replace', 'organize_imports',
        'move_file', 'move_symbol', 'delete_readiness',
    ]
    for (const method of methods) assert.ok(refactor.includes(`<code>${method}</code>`), `${method} is documented`)
    assert.match(refactor, /same method owns preview and apply/i)
    assert.match(refactor, /same method/i)
    assert.match(refactor, /--profile=rename/)
    assert.match(refactor, /crash-recoverable/i)
    assert.match(refactor, /rollback/i)
    assert.doesNotMatch(refactor, /apply atomically|atomic multi-file|ATOMIC WRITE/i)
    assert.doesNotMatch(refactor, /EXACT_LSP|bundled language server|language-server session/i)
    assert.doesNotMatch(refactor, /outside the worktree|external[^.]*rollback/i)
    assert.match(refactor, /\.weavatrix\/worktree/)
    assert.doesNotMatch(privacy, /~\/\.weavatrix-refactor|current Refactor and Online packages/i)
    assert.match(privacy, /\.weavatrix\/worktree/)
    assert.doesNotMatch(security, /external[^.]*rollback/i)
    assert.match(refactor, /485/)
    assert.match(refactor, /48,389/)
    assert.match(refactor, /108,155/)
})

test('published product versions, MIT licenses, and native benchmark stay current', () => {
    const index = readFileSync(join(REPO_ROOT, 'site/index.html'), 'utf8')
    const license = readFileSync(join(REPO_ROOT, 'site/license.html'), 'utf8')
    const security = readFileSync(join(REPO_ROOT, 'site/security.html'), 'utf8')
    const refactor = readFileSync(join(REPO_ROOT, 'site/refactor.html'), 'utf8')
    const readme = readFileSync(join(REPO_ROOT, 'README.md'), 'utf8')
    for (const release of ['Core <small>1.10.0', 'Weavatrix SEO <small>0.6.2', 'Refactor <small>1.0.11', 'Online <small>0.3.2']) {
        assert.ok(index.includes(release), `${release} is shown on the product grid`)
    }
    assert.match(index, /Search Evidence Graph/)
    assert.match(index, /weavatrix-seo mcp/)
    assert.match(license, /weavatrix-seo/)
    assert.match(index, /weavatrix-rust <small>2\.9\.0/)
    assert.match(index, /typed analyzers, deterministic snapshots, evidence graphs/)
    assert.match(index, /It does not implement an MCP server/)
    assert.match(index, /cargo install weavatrix/)
    assert.doesNotMatch(index, /cargo install weavatrix-rust/)
    assert.match(index, /weavatrix-graph<\/code> 0\.6\.3/)
    assert.match(index, /Duplicate results keep families, members and pair IDs coherent after filtering/)
    assert.match(index, /192 files became 1,531 nodes and 7,287 typed edges/)
    assert.match(index, /73\.21 ms/)
    assert.match(index, /7\.436 ms/)
    assert.match(index, /5\.504 ms/)
    assert.match(index, /0\.661 ms/)
    assert.match(index, /1,000 hot calls/)
    assert.match(index, /405\.770 ms/)
    assert.match(index, /0\.790 ms/)
    assert.match(index, /54\.880 ms/)
    assert.match(index, /136\.83 calls\/s/)
    assert.match(index, /p50 7\.610 \/ p95 10\.180 \/ p99 12\.230 \/ max 48\.360 ms/)
    assert.match(index, /87\.71% lines \/ 80\.57% functions \/ 85\.30% regions/)
    assert.match(index, /not a claim about every repository, machine, or workload/)
    const releaseCopy = [index, security, refactor, readme].join('\n')
    assert.doesNotMatch(releaseCopy, /Core <small>1\.1\.1|weavatrix-rust <small>2\.0\.1|weavatrix 1\.1\.1/)
    assert.doesNotMatch(releaseCopy, /Refactor <small>0\.1\.5|REFACTOR 0\.1\.5|Install 0\.1\.5/)
    assert.doesNotMatch(releaseCopy, /Core <small>1\.1\.0|weavatrix-rust <small>2\.0\.0|weavatrix 1\.1\.0/)
    assert.doesNotMatch(releaseCopy, /Core <small>1\.0\.0|REFACTOR 0\.1\.3|Online <small>0\.3\.0/)
    assert.doesNotMatch(releaseCopy, /weavatrix-rust <small>1\.0\.[0-9]+|Rust engine: 1\.0\.[0-9]+/)
    assert.doesNotMatch(releaseCopy, /MCP is an optional stdio adapter/)
    assert.doesNotMatch(index, /APACHE-2\.0|SOURCE-AVAILABLE|Online Source License/)
    assert.match(license, /weavatrix-refactor/)
    assert.match(license, /weavatrix-online/)
    assert.doesNotMatch(license, /Apache License|commercial license/)
})

test('homepage publishes the complete native language and repository-surface matrix', () => {
    const index = readFileSync(join(REPO_ROOT, 'site/index.html'), 'utf8')
    const requiredSurfaces = [
        'Rust',
        'JavaScript / JSX',
        'TypeScript / TSX',
        'Python',
        'Go',
        'Java',
        'C#',
        'C',
        'C++',
        'SQL',
        'Bash / Zsh',
        'Swift',
        'Solidity',
        'GraphQL',
        'Protobuf / gRPC',
        'JSON / JSONC syntax',
        'Kubernetes YAML',
        'Terraform / HCL',
        'XML',
        'HTML / Vue / Svelte',
        'CSS / SCSS / Sass / Less',
        'Markdown / MDX',
        'reStructuredText',
        'AsciiDoc',
    ]

    for (const surface of requiredSurfaces) {
        assert.ok(index.includes(`<span>${surface}</span>`), `${surface} is listed on the homepage`)
    }
    assert.equal(requiredSurfaces.length, 24)
    assert.match(index, /24 supported languages and repository surfaces/)
    assert.match(index, /without\s+pretending that CSS and Rust have the same semantic depth/)
    assert.doesNotMatch(index, /<span>JavaScript<\/span><span>TypeScript<\/span><span>TSX<\/span>/)
})

test('release metadata and every local page reference resolve', () => {
    const index = readFileSync(join(REPO_ROOT, 'site/index.html'), 'utf8')
    const jsonLd = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    assert.ok(jsonLd, 'the homepage carries structured software metadata')
    const metadata = JSON.parse(jsonLd[1])
    assert.equal(metadata.softwareVersion, '1.10.0')
    assert.match(metadata.description, /evidence infrastructure for AI software agents/)

    const pages = readdirSync(join(REPO_ROOT, 'site')).filter(name => extname(name) === '.html')
    for (const page of pages) {
        const html = readFileSync(join(REPO_ROOT, 'site', page), 'utf8')
        for (const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
            const requestPath = match[1]
            const asset = requestPath === '/'
                ? 'index.html'
                : extname(requestPath) === '' ? `${requestPath.slice(1)}.html` : requestPath.slice(1)
            assert.ok(existsSync(join(REPO_ROOT, 'site', asset)), `${page} references missing ${requestPath}`)
        }
    }
})

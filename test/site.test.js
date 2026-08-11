// Ported from the engine repo's file-size-budget test when site/ moved here: versioned asset
// references must not go stale, the hero animation stays deterministic, and source files keep
// the same 300-line owner-module budget the engine holds itself to.
import test from 'node:test'
import assert from 'node:assert/strict'
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
    assert.ok(index.includes('href="/styles.css?v=0.3.11-products-1"'), 'the page loads the current product stylesheet without a stale asset')
    assert.ok(index.includes('src="/graph-animation.js?v=0.3.9-hero-graph-6"'), 'the page loads the deterministic hero graph without a stale asset')
    assert.ok(index.includes('src="/hero-field.js?v=0.3.9-hero-field-1"'), 'the page loads the ambient hero field without a stale asset')
    assert.match(index, /https:\/\/weavatrix\.com\/og-image-v4\.png/)
    assert.doesNotMatch(index, /og-image-v[123]\.png/)
    const refactor = readFileSync(join(REPO_ROOT, 'site/refactor.html'), 'utf8')
    assert.match(refactor, /https:\/\/weavatrix\.com\/og-image-v4\.png/)
    const animation = readFileSync(join(REPO_ROOT, 'site/graph-animation.js'), 'utf8')
    assert.doesNotThrow(() => new Function(animation), 'the extracted browser script parses')
    assert.doesNotMatch(animation, /Math\.random/, 'the hero graph layout stays deterministic')
    const field = readFileSync(join(REPO_ROOT, 'site/hero-field.js'), 'utf8')
    assert.doesNotThrow(() => new Function(field), 'the ambient hero field script parses')
    assert.doesNotMatch(field, /Math\.random/, 'the ambient hero field stays deterministic')
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
    for (const release of ['Core <small>1.1.2', 'Refactor <small>1.0.6', 'Online <small>0.3.1']) {
        assert.ok(index.includes(release), `${release} is shown on the product grid`)
    }
    assert.match(index, /weavatrix-rust <small>2\.0\.2/)
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
    assert.equal(metadata.softwareVersion, '1.1.2')
    assert.match(metadata.description, /protocol-independent Rust evidence engine/)

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

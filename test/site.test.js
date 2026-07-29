// Ported from the engine repo's file-size-budget test when site/ moved here: versioned asset
// references must not go stale, the hero animation stays deterministic, and source files keep
// the same 300-line owner-module budget the engine holds itself to.
import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync, readdirSync} from 'node:fs'
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
    assert.ok(index.includes('href="/refactor"'), 'the landing page links to the Refactor product page')
    const methods = [
        'rename_symbol', 'rename_related_symbols', 'apply_edit_plan', 'rollback_last_apply',
        'change_signature', 'edit_symbol', 'bulk_replace', 'organize_imports',
        'move_file', 'move_symbol', 'delete_readiness',
    ]
    for (const method of methods) assert.ok(refactor.includes(`<code>${method}</code>`), `${method} is documented`)
    assert.match(refactor, /Rename is complete, not PLANNED/)
    assert.match(refactor, /same method/i)
    assert.match(refactor, /atomic/i)
    assert.match(refactor, /rollback/i)
})

test('published product versions, MIT licenses, and native benchmark stay current', () => {
    const index = readFileSync(join(REPO_ROOT, 'site/index.html'), 'utf8')
    const license = readFileSync(join(REPO_ROOT, 'site/license.html'), 'utf8')
    for (const release of ['Core <small>1.0.0', 'Refactor <small>0.1.3', 'Online <small>0.3.0']) {
        assert.ok(index.includes(release), `${release} is shown on the product grid`)
    }
    assert.match(index, /Weavatrix Rust <small>1\.0\.2/)
    assert.match(index, /30\.34x/)
    assert.match(index, /156\.10x/)
    assert.match(index, /26\.19/)
    assert.match(index, /84\.68/)
    assert.match(index, /24\.82/)
    assert.match(index, /78B48CD828BBB91C6054771E7B35B27DA0687550D3E820DA2650AFE0E53AF068/)
    assert.match(index, /8224CACEA4F10B6B09BB525FCC1E4FFA0A7AF1292CD1C4EC63515A2CF99D7F5A/)
    assert.doesNotMatch(index, /APACHE-2\.0|SOURCE-AVAILABLE|Online Source License/)
    assert.match(license, /weavatrix-refactor/)
    assert.match(license, /weavatrix-online/)
    assert.doesNotMatch(license, /Apache License|commercial license/)
})

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const Module = require('node:module');

const library = fs.readFileSync(path.join(__dirname, '..', 'node_modules', 'markdown-it', 'dist', 'browser', 'markdown-it.umd.min.js'), 'utf8');
const preview = fs.readFileSync(path.join(__dirname, '..', 'media', 'webview', 'markdownPreview.js'), 'utf8');
const context = { atob };
vm.runInNewContext(`${library}\n${preview}\nthis.render = renderMarkdown;`, context);

test('renders fenced code in the shared preview and escapes untrusted HTML', () => {
  const html = context.render('```js\nconst answer = 42;\n```\n\n<script>alert(1)</script>');

  assert.match(html, /<pre><code class="language-js">const answer = 42;\n<\/code><\/pre>/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.equal(context.render(''), '<span class="muted">Nothing to preview yet.</span>');
});

test('webview HTML embeds valid scripts for every artifact', async () => {
  const originalLoad = Module._load;
  let getArtifactEditorHtml;
  try {
    Module._load = function (request, parent, isMain) {
      return request === 'vscode' ? {} : originalLoad.call(this, request, parent, isMain);
    };
    ({ getArtifactEditorHtml } = require('../src/editors/artifactEditor'));
  } finally {
    Module._load = originalLoad;
  }

  for (const kind of ['agent', 'prompt', 'skill']) {
    const state = { body: '```js\nconst answer = "$& $\'";\n```', fields: {} };
    const artifact = {
      key: kind,
      title: kind,
      description: kind,
      rendererPath: path.join('media', 'artifacts', kind, 'editor.js')
    };
    const html = await getArtifactEditorHtml({ extensionPath: path.join(__dirname, '..') }, {}, artifact, state, state.body);
    const script = html.match(/<script nonce="[^"]+">([\s\S]*?)<\/script>/)?.[1];

    assert.ok(script, `${kind} webview script exists`);
    assert.doesNotMatch(script, /\{\{SCRIPT\}\}/);
    assert.doesNotThrow(() => new vm.Script(script), `${kind} webview script parses`);
    assert.equal(JSON.parse(html.match(/<script type="application\/json" id="initial-state">([^<]+)<\/script>/)[1]).state.body, state.body);
  }
});
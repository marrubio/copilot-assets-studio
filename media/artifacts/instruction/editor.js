const root = document.getElementById('artifactRoot');
const status = document.getElementById('status');
const state = initial.state;
const docs = {
  repository: 'https://github.com/marrubio/copilot-assets-studio',
  vscode: 'https://code.visualstudio.com/docs/agent-customization/custom-instructions'
};

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function setStatus(text, error) {
  status.textContent = text;
  status.classList.toggle('error', Boolean(error));
}

function updateTitle(name) {
  const fallbackTitle = document.body.dataset.fallbackTitle || document.title;
  const title = name.trim() || fallbackTitle;
  document.title = title;
  document.querySelector('h1').textContent = title;
}

function fieldCard(title, content, description) {
  return '<section class="form-section"><div class="section-heading"><h2>' + title + '</h2>' + (description ? '<div class="muted">' + description + '</div>' : '') + '</div>' + content + '</section>';
}

function render() {
  const f = state.fields;
  const cards = [
    fieldCard('name', '<input id="name" value="' + escapeHtml(f.name.value) + '">', 'Optional display name. The file name is used when omitted.'),
    fieldCard('description', '<textarea id="description">' + escapeHtml(f.description.value) + '</textarea>', 'Optional description used for on-demand discovery.'),
    fieldCard('applyTo', '<input id="applyTo" value="' + escapeHtml(f.applyTo.value) + '" placeholder="**/*.js">', 'Optional workspace-relative glob for automatically applying these instructions.'),
    fieldCard('extra properties', '<textarea data-yaml="extra">' + escapeHtml(state.extraPropertiesYaml) + '</textarea>', 'Unknown keys are preserved.'),
    '<section class="form-section full-width"><div class="body-grid"><div><label for="body">Instructions (Markdown)</label><textarea id="body">' + escapeHtml(state.body) + '</textarea></div><div><label>Rendered preview</label><div id="bodyPreview" class="markdown-preview"></div></div></div></section>'
  ];
  root.innerHTML = '<div class="grid">' + cards.join('') + '</div><section class="related-links"><h2>Related links</h2><div class="link-list"><button class="secondary" data-doc="vscode">VS Code docs</button><button class="secondary" data-doc="repository">Source repository</button></div></section>';
  bind();
  document.getElementById('bodyPreview').innerHTML = renderMarkdown(state.body || '');
}

function bind() {
  for (const key of ['name', 'description', 'applyTo']) {
    document.getElementById(key).oninput = (event) => {
      state.fields[key].enabled = true;
      state.fields[key].value = event.target.value;
      if (key === 'name') updateTitle(event.target.value);
      setStatus('Modified');
    };
  }
  document.querySelector('[data-yaml="extra"]').oninput = (event) => { state.extraPropertiesYaml = event.target.value; setStatus('Modified'); };
  document.querySelectorAll('[data-doc]').forEach((button) => button.addEventListener('click', (event) => vscode.postMessage({ type: 'openDoc', url: docs[event.target.dataset.doc] })));
  document.getElementById('body').oninput = (event) => { state.body = event.target.value; document.getElementById('bodyPreview').innerHTML = renderMarkdown(state.body); setStatus('Modified'); };
}

document.getElementById('saveButton').addEventListener('click', () => { state.body = document.getElementById('body').value; vscode.postMessage({ type: 'save', state }); setStatus('Saving...'); });
render();

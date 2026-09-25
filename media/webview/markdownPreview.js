const markdownRenderer = markdownit({ html: false });

function renderMarkdown(markdown) {
  return markdownRenderer.render(markdown).trim() || '<span class="muted">Nothing to preview yet.</span>';
}
const content = document.getElementById('content');

function getSlugFromHash() {
  return window.location.hash ? window.location.hash.slice(1) : null;
}

function slugToFile(slug) {
  if (!slug) return null;
  return `${slug}.md`;
}


async function loadMarkdown(slug) {
  if (!slug) {
    content.innerHTML = `<p style="color:red;">No hash provided in URL</p>`;
    return;
  }

  const file = slugToFile(slug);

  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const mdText = await res.text();
    const html = marked.parse(mdText);

    content.innerHTML = html;
    wrapImageBlocks();
  } catch (err) {
    content.innerHTML = `<p style="color:red;">Failed to load ${file}: ${err.message}</p>`;
    console.error(err);
  }
}

let slug = getSlugFromHash();
loadMarkdown(slug);

window.addEventListener('hashchange', () => {
  slug = getSlugFromHash();
  loadMarkdown(slug);
});

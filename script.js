const content = document.getElementById('content');

function pad(n, width=2){ return String(n).padStart(width,'0'); }

function getSlugFromHash() {
  return window.location.hash ? window.location.hash.slice(1) : null;
}

async function loadMarkdown(slug) {
  const file = slugToFile(slug);
  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error('Not found');
    const md = await res.text();
    content.innerHTML = marked.parse(md);
    // small DOM tweaks (optional): wrap images in figures if needed
    wrapImageBlocks();
  } catch (e) {
    // fallback: show message and offer link to captain
    content.innerHTML = `<h2>Not found</h2><p>Could not load <code>${file}</code>.</p><p><a href="#captain">Go to Captain</a></p>`;
  }
}

function wrapImageBlocks(){
  // simple: find standalone images and wrap with figure for nicer layout
  const imgs = content.querySelectorAll('p > img, img');
  imgs.forEach(img => {
    const p = img.closest('p');
    if (p) {
      const fig = document.createElement('figure');
      fig.appendChild(img.cloneNode(true));
      p.replaceWith(fig);
    }
  });
}

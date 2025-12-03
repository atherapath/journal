const content = document.getElementById('content');

function getSlugFromHash() {
  return window.location.hash ? window.location.hash.slice(1) : null;
}

function slugToFile(slug) {
  if (!slug) return null;
  return `${slug}.md`;
}

function wrapImageBlocks() {
  const detailsList = document.querySelectorAll('details');
  detailsList.forEach(details => {
    const children = Array.from(details.children);
    for (let i = 0; i < children.length; i++) {
      if (children[i].tagName === 'IMG') {
        const blockElements = [children[i]];
        let j = i + 1;
        while (j < children.length && children[j].tagName !== 'IMG') {
          blockElements.push(children[j]);
          j++;
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'md-block';
        blockElements.forEach(el => wrapper.appendChild(el));
        details.insertBefore(wrapper, blockElements[0]);
        blockElements.forEach(el => {
          if (el !== wrapper) el.remove();
        });
        i = j - 1;
      }
    }
  });
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
    
document.querySelectorAll("details").forEach(detail => {
  detail.addEventListener("toggle", function () {
    if (this.open) {
      // Close all other sections
      document.querySelectorAll("details").forEach(other => {
        if (other !== this) {
          other.removeAttribute("open");
        }
      });
      // Scroll the current section to the top of the viewport
      this.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

  } catch (err) {
    content.innerHTML = `<p style="color:red;">Failed to load ${file}: ${err.message}</p>`;
    console.error(err);
  }
}

// --- Initial load and listener ---
let slug = getSlugFromHash();
loadMarkdown(slug);

window.addEventListener('hashchange', () => {
  slug = getSlugFromHash();
  loadMarkdown(slug);
});

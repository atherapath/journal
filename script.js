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
  } catch (err) {
    content.innerHTML = `<p style="color:red;">Failed to load ${file}: ${err.message}</p>`;
    console.error(err);
  }
}

// 🔑 New helper functions
function getWeekFromSlug(slug) {
  const match = slug.match(/(\d{4})_w(\d{1,2})/);
  if (!match) return null;
  return { year: parseInt(match[1]), week: parseInt(match[2]) };
}

function updateWeekNavigation(slug) {
  const nav = getWeekFromSlug(slug);
  if (!nav) return;

  const prevWeek = nav.week - 1;
  const nextWeek = nav.week + 1;

  document.getElementById('prev-week').onclick = () => {
    window.location.hash = `${nav.year}_w${prevWeek}_log`;
  };

  document.getElementById('next-week').onclick = () => {
    window.location.hash = `${nav.year}_w${nextWeek}_log`;
  };
}

let slug = getSlugFromHash();
loadMarkdown(slug);
updateWeekNavigation(slug); // 🔑 initial button setup

window.addEventListener('hashchange', () => {
  slug = getSlugFromHash();
  loadMarkdown(slug);
  updateWeekNavigation(slug); // 🔑 refresh buttons on change
});

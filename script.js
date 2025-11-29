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

// --- Week navigation helper ---
function updateWeekButtons(slug) {
  const prevBtn = document.getElementById('prev-week');
  const currentBtn = document.getElementById('current-week');

  // Helper: get numeric slug or today's date as slug
  function getTodaySlug() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(2);
    const mm = String(now.getMonth() + 1).padStart(2, '0'); // month
    const dd = String(now.getDate()).padStart(2, '0');      // day
    return `${mm}${dd}${yy}`;
  }

  if (prevBtn) {
    prevBtn.onclick = () => {
      let newSlug;
      if (slug && /^\d+$/.test(slug)) {
        // Numeric slug: subtract 7 days
        const week = parseInt(slug.slice(0, 2), 10);
        const day = parseInt(slug.slice(2, 4), 10);
        const year = slug.slice(4);

        const prevDate = new Date(`20${year}`, week - 1, day);
        prevDate.setDate(prevDate.getDate() - 7);

        const newWeek = String(prevDate.getMonth() + 1).padStart(2, '0');
        const newDay = String(prevDate.getDate()).padStart(2, '0');
        const newYear = String(prevDate.getFullYear()).slice(2);

        newSlug = `${newWeek}${newDay}${newYear}`;
      } else {
        // Non-numeric slug: just 7 days back from today
        const prevDate = new Date();
        prevDate.setDate(prevDate.getDate() - 7);

        const newWeek = String(prevDate.getMonth() + 1).padStart(2, '0');
        const newDay = String(prevDate.getDate()).padStart(2, '0');
        const newYear = String(prevDate.getFullYear()).slice(2);

        newSlug = `${newWeek}${newDay}${newYear}`;
      }

      window.location.hash = `#${newSlug}`;
    };
  }

  if (currentBtn) {
    currentBtn.onclick = () => {
      window.location.hash = `#${getTodaySlug()}`;
    };
  }
}

// --- Initial load and listener ---
let slug = getSlugFromHash();
loadMarkdown(slug);
updateWeekButtons(slug);

window.addEventListener('hashchange', () => {
  slug = getSlugFromHash();
  loadMarkdown(slug);
  updateWeekButtons(slug);
});

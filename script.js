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

// --- Slug helpers ---
function isWeeklySlug(slug) {
  return /^\d{6}$/.test(slug) && slug.length === 6 && slug[0] !== '0';
}

function isDailySlug(slug) {
  return /^\d{6}$/.test(slug);
}

function dailyToWeeklySlug(dailySlug) {
  const day = parseInt(dailySlug.slice(0,2), 10);
  const month = parseInt(dailySlug.slice(2,4), 10) - 1; // JS months 0–11
  const yy = parseInt(dailySlug.slice(4), 10);
  const year = 2000 + yy;

  const date = new Date(year, month, day);

  // ISO week calculation
  const temp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = temp.getUTCDay() || 7;
  temp.setUTCDate(temp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(temp.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((temp - yearStart) / 86400000) + 1)/7);

  const ww = String(weekNo).padStart(2,'0');
  const dd = String(day).padStart(2,'0');
  const yyStr = String(year % 100).padStart(2,'0');

  return `${ww}${dd}${yyStr}`;
}

async function loadMarkdown(slug) {
  let weeklySlug = slug;
  let dailySlug = null;

  if (isDailySlug(slug)) {
    weeklySlug = dailyToWeeklySlug(slug);
    dailySlug = slug;
  }

  const file = `${weeklySlug}.md`;

  try {
    const res = await fetch(file);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const mdText = await res.text();
    const html = marked.parse(mdText);

    content.innerHTML = html;
    wrapImageBlocks();

    // If daily slug, auto-open the section
    if (dailySlug) {
      const day = dailySlug.slice(0,2);
      const summaries = Array.from(document.querySelectorAll('details > summary'));
      const target = summaries.find(s => s.textContent.trim().startsWith(day));
      if (target) {
        target.parentElement.open = true;
        target.scrollIntoView({behavior:"smooth"});
      }
    }
  } catch (err) {
    content.innerHTML = `<p style="color:red;">Failed to load ${file}: ${err.message}</p>`;
    console.error(err);
  }
}

// --- Week navigation helper ---
function updateWeekButtons(slug) {
  const prevBtn = document.getElementById('prev-week');
  const nextBtn = document.getElementById('next-week');
  if (!slug) return;

  const week = parseInt(slug.slice(0, 2), 10);
  const day = parseInt(slug.slice(2, 4), 10);
  const year = slug.slice(4); // YY stays as-is

  if (prevBtn) {
    prevBtn.onclick = () => {
      const newWeek = String(week - 1).padStart(2, '0');
      const newDay = String(day - 7).padStart(2, '0');
      window.location.hash = `${newWeek}${newDay}${year}`;
    };
  }

  if (nextBtn) {
    nextBtn.onclick = () => {
      const newWeek = String(week + 1).padStart(2, '0');
      const newDay = String(day + 7).padStart(2, '0');
      window.location.hash = `${newWeek}${newDay}${year}`;
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

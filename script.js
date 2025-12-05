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
    
// Scroll to top and close all ***bosh*** <details>
  document.getElementById("back-to-top").addEventListener("click", function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    document.querySelectorAll("details").forEach(d => d.removeAttribute("open"));
  });

  } catch (err) {
    content.innerHTML = `<p style="color:red;">Failed to load ${file}: ${err.message}</p>`;
    console.error(err);
  }
}

// --- NEW FUNCTION: The core logic for Waddy form (wwddyy) ---
/**
 * Generates the correct wwddyy slug based on ISO 8601 (dd is Monday's day of month).
 * @param {Date} date The date to base the slug on.
 * @returns {string} The slug (e.g., '490125').
 */
function generateWeekSlug(date) {
    // --- 1. Calculate the Monday of the current ISO week ---
    let day = date.getDay();
    day = day === 0 ? 7 : day; // Normalize day to 1=Monday, 7=Sunday
    const mondayOffset = day - 1;
    const monday = new Date(date);
    monday.setDate(date.getDate() - mondayOffset);

    // --- 2. Calculate the ISO Week Number (ww) ---
    const thursday = new Date(monday);
    thursday.setDate(monday.getDate() + 3);
    const yearStart = new Date(thursday.getFullYear(), 0, 4);
    const diffTime = thursday.getTime() - yearStart.getTime();
    const weekNumber = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)) + 1;

    // --- 3. Format Components (wwddyy) ---
    const ww = String(weekNumber).padStart(2, '0');
    const yy = String(thursday.getFullYear()).slice(-2);
    
    // --- 4. USE STANDARD 'dd' ---
    const dd = String(monday.getDate()).padStart(2, '0');

    return `${ww}${dd}${yy}`;
}

// --- Initial load and listener ---
let slug = getSlugFromHash();
loadMarkdown(slug);

// --- NEW LISTENER FOR PRESENT MOMENT TEST ---
document.getElementById('present-moment-link').addEventListener('click', (e) => {
    e.preventDefault(); // Stop the link from acting like a regular hash link
    
    // 1. Calculate the correct slug for today's date using the new function.
    const currentSlug = generateWeekSlug(new Date()); 
    
    // 2. Set the hash, which triggers the existing hashchange listener.
    window.location.hash = `#${currentSlug}`;
});

window.addEventListener('hashchange', () => {
  slug = getSlugFromHash();
  loadMarkdown(slug);
});

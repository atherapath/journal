const content = document.getElementById('content');

function pad(n, width=2){ return String(n).padStart(width,'0'); }

function getSlugFromHash() {
  return window.location.hash ? window.location.hash.slice(1) : null;
}

function slugToFile(slug) {
  if (!slug) return 'captain.md';
  // if slug looks like a numeric week code (e.g. 481125) we assume WWMMDD format
  if (/^\d{6}$/.test(slug)) return `${slug}.md`;
  return `${slug}.md`;
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

// --- Week / date helpers ---
// Return Date for given year, month(1-12), day
function makeDate(y,m,d){ return new Date(y,m-1,d); }

// ISO week number and year
function getISOWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Thursday in current week decides the year.
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay()||7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
  return { week: weekNo, year: date.getUTCFullYear() };
}

// Format slug as WWMMDD where WW is ISO week (2 digits), MM month, DD day
function formatSlugFromDate(d){
  const { week } = getISOWeek(d);
  const mm = d.getMonth()+1;
  const dd = d.getDate();
  return `${pad(week,2)}${pad(mm,2)}${pad(dd,2)}`;
}

// Parse a slug of form WWMMDD into a Date (uses current year)
function dateFromWeekSlug(slug){
  if(!/^[0-9]{6}$/.test(slug)) return null;
  const ww = parseInt(slug.slice(0,2),10);
  const mm = parseInt(slug.slice(2,4),10);
  const dd = parseInt(slug.slice(4,6),10);
  const year = (new Date()).getFullYear();
  // create date from mm/dd/year; fallback to today if invalid
  const d = makeDate(year,mm,dd);
  if (isNaN(d)) return null;
  return d;
}

// Move date by days
function shiftDays(d, days){
  const copy = new Date(d.getTime());
  copy.setDate(copy.getDate() + days);
  return copy;
}

// Compute "previous week" target slug
function previousWeekSlug(currentSlug){
  let baseDate;
  if (currentSlug && /^[0-9]{6}$/.test(currentSlug)) {
    baseDate = dateFromWeekSlug(currentSlug) || new Date();
  } else {
    baseDate = new Date();
  }
  const prev = shiftDays(baseDate, -7);
  return formatSlugFromDate(prev);
}

// Compute "current week" slug (based on today's date)
function currentWeekSlug(){
  return formatSlugFromDate(new Date());
}

// --- Week button behavior ---
const prevBtn = document.getElementById('prev-week');
const nextBtn = document.getElementById('next-week');

function updateWeekButtons(slug){
  // Show both buttons; could hide next if already on current week
  if (!prevBtn || !nextBtn) return;
  prevBtn.disabled = false;
  nextBtn.disabled = false;
  // If on current week, disable Next (which acts as "Go to current")
  const curSlug = currentWeekSlug();
  if (slug === curSlug) nextBtn.disabled = true;
  else nextBtn.disabled = false;
}

if (prevBtn) prevBtn.addEventListener('click', ()=>{
  const slug = getSlugFromHash();
  const target = previousWeekSlug(slug);
  window.location.hash = `#${target}`;
});

if (nextBtn) nextBtn.addEventListener('click', ()=>{
  const target = currentWeekSlug();
  window.location.hash = `#${target}`;
});

// --- Initial load and listener ---
let slug = getSlugFromHash();
loadMarkdown(slug);
updateWeekButtons(slug);

window.addEventListener('hashchange', () => {
  slug = getSlugFromHash();
  loadMarkdown(slug);
  updateWeekButtons(slug);
});

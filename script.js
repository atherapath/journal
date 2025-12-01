/* script.js */
(function(){
  // Utility: ISO week number (Mon-based)
  function getISOWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7; // Sunday -> 7
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
    return {week: weekNo, year: date.getUTCFullYear()};
  }

  // Find earliest and latest week numbers present in DOM
  function availableWeeks() {
    const nodes = Array.from(document.querySelectorAll('.week[data-week]'));
    const nums = nodes.map(n=>Number(n.dataset.week)).filter(n=>!isNaN(n));
    return nums.length ? {min: Math.min(...nums), max: Math.max(...nums), list: nums} : {min: null, max: null, list: []};
  }

  // Render a week by showing/hiding week blocks (simple example)
  function showWeek(n) {
    const all = document.querySelectorAll('.week');
    all.forEach(el=> el.classList.toggle('hidden', Number(el.dataset.week) !== Number(n)));
    const available = availableWeeks();
    if (available.list.indexOf(Number(n)) === -1) {
      // not found -> show modal with options
      showErrorModal(n);
      return false;
    }
    currentWeek = Number(n);
    return true;
  }

  function showErrorModal(requestedWeek) {
    const modal = document.getElementById('errorModal');
    const msg = document.getElementById('errorMessage');
    msg.textContent = `Requested week ${requestedWeek} doesn't exist.`;
    modal.classList.remove('hidden');
  }

  function hideErrorModal(){
    document.getElementById('errorModal').classList.add('hidden');
  }

  // Navigation handlers
  let currentWeek = null;
  const avail = availableWeeks();

  function goToPresentWeek(){
    const now = new Date();
    const wk = getISOWeekNumber(now).week;
    const ok = showWeek(wk);
    if (!ok) {
      // if present week doesn't exist, still set currentWeek to closest available
      const a = availableWeeks();
      if (a.min !== null) {
        showWeek(a.min);
      }
    }
    hideErrorModal();
  }

  function goPrev(){
    if (currentWeek == null) {
      // if not set, choose the highest available
      const a = availableWeeks();
      if (a.max !== null) { showWeek(a.max); return; }
    }
    showWeek(currentWeek - 1);
  }

  function goNext(){
    if (currentWeek == null) {
      const a = availableWeeks();
      if (a.min !== null) { showWeek(a.min); return; }
    }
    showWeek(currentWeek + 1);
  }

  // Wire buttons
  document.addEventListener('DOMContentLoaded', ()=>{
    document.getElementById('prevBtn').addEventListener('click', ()=>{ goPrev(); });
    document.getElementById('nextBtn').addEventListener('click', ()=>{ goNext(); });
    document.getElementById('presentBtn').addEventListener('click', ()=>{ goToPresentWeek(); });

    // Modal buttons
    document.getElementById('goCaptain').addEventListener('click', ()=>{
      // If you have a captain page (captain.md), redirect or fetch it.
      // For this demo we'll open captain.md in a new tab if it exists.
      window.open('captain.md', '_self');
    });
    document.getElementById('goPresent').addEventListener('click', ()=>{
      goToPresentWeek();
    });
    document.getElementById('dismiss').addEventListener('click', hideErrorModal);

    // Initial: try present week
    goToPresentWeek();
  });

})();

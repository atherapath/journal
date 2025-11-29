/**
 * Captain's Weekly Navigation JS
 * Handles Previous Week and Current Week buttons
 * Works with numeric weekly slugs (wwddyy)
 */

// Utility: get today's week number in wwddyy format
function getCurrentWeekSlug() {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = String(today.getFullYear()).slice(-2);
    // wwddyy: week number + day + year
    const weekNumber = getWeekNumber(today);
    return `${weekNumber}${day}${year}`;
}

// Calculate ISO week number
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    return String(weekNum).padStart(2, '0');
}

// Extract numeric slug from URL hash
function getCurrentSlug() {
    const hash = window.location.hash.substring(1); // remove #
    if (/^\d+$/.test(hash)) return hash; // numeric slug
    return null; // non-numeric
}

// Navigate to a given numeric weekly slug
function goToSlug(slug) {
    if (!slug) return;
    // Here you can implement logic to fetch/load the corresponding MD content
    // For example, assuming sections are already on the page and using IDs
    const target = document.querySelector(`#${slug}`);
    if (target) {
        target.scrollIntoView({behavior: 'smooth'});
        // Optionally update URL hash
        window.location.hash = slug;
    } else {
        console.warn(`Slug #${slug} not found on page.`);
    }
}

// Previous Week button logic
function previousWeek() {
    const currentSlug = getCurrentSlug();
    if (currentSlug) {
        // numeric: subtract 1 from week part
        let week = parseInt(currentSlug.slice(0,2),10);
        let day = currentSlug.slice(2,4);
        let year = currentSlug.slice(4,6);
        if (week > 1) week--;
        else week = 52; // wrap-around if needed
        const prevSlug = `${String(week).padStart(2,'0')}${day}${year}`;
        goToSlug(prevSlug);
    } else {
        // non-numeric: calculate previous week based on today
        const today = new Date();
        today.setDate(today.getDate() - 7); // subtract 7 days
        const prevSlug = getCurrentWeekSlugForDate(today);
        goToSlug(prevSlug);
    }
}

// Current Week button logic
function currentWeek() {
    const slug = getCurrentWeekSlug();
    goToSlug(slug);
}

// Generate week slug for arbitrary date
function getCurrentWeekSlugForDate(date) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const weekNumber = getWeekNumber(date);
    return `${weekNumber}${day}${year}`;
}

// Attach buttons (assuming buttons have IDs 'prevWeekBtn' and 'currWeekBtn')
document.addEventListener('DOMContentLoaded', () => {
    const prevBtn = document.getElementById('prevWeekBtn');
    const currBtn = document.getElementById('currWeekBtn');

    if (prevBtn) prevBtn.addEventListener('click', previousWeek);
    if (currBtn) currBtn.addEventListener('click', currentWeek);
});

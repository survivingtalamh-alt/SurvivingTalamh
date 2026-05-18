/* ==========================================================
   SURVIVING TALAMH — Main script
   - Initialises Supabase client (used by fanzone.js)
   - Renders the doomsday-clock countdown
   - Footer year
   ========================================================== */

(function () {
  // ---- Supabase client (shared globally for fanzone.js) ----
  const cfg = window.ST_CONFIG || {};
  const hasCreds =
    cfg.SUPABASE_URL &&
    cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.startsWith("REPLACE") &&
    !cfg.SUPABASE_ANON_KEY.startsWith("REPLACE");

  if (hasCreds && window.supabase) {
    window.stSupabase = window.supabase.createClient(
      cfg.SUPABASE_URL,
      cfg.SUPABASE_ANON_KEY
    );
  } else {
    window.stSupabase = null;
    console.warn(
      "[Surviving Talamh] Supabase not configured. Edit js/config.js with your project credentials."
    );
  }

  // ---- Countdown ----
  const RELEASE = new Date(cfg.RELEASE_DATE || "2027-02-01T00:00:00+00:00").getTime();
  const els = {
    days: document.querySelector('[data-unit="days"]'),
    hours: document.querySelector('[data-unit="hours"]'),
    minutes: document.querySelector('[data-unit="minutes"]'),
    seconds: document.querySelector('[data-unit="seconds"]')
  };

  function pad(n) { return String(Math.max(0, n)).padStart(2, "0"); }

  function tick() {
    const now = Date.now();
    let diff = Math.max(0, RELEASE - now);

    const day = 1000 * 60 * 60 * 24;
    const hour = 1000 * 60 * 60;
    const minute = 1000 * 60;

    const d = Math.floor(diff / day);
    diff -= d * day;
    const h = Math.floor(diff / hour);
    diff -= h * hour;
    const m = Math.floor(diff / minute);
    diff -= m * minute;
    const s = Math.floor(diff / 1000);

    if (els.days) els.days.textContent = String(d).padStart(3, "0");
    if (els.hours) els.hours.textContent = pad(h);
    if (els.minutes) els.minutes.textContent = pad(m);
    if (els.seconds) els.seconds.textContent = pad(s);

    if (RELEASE - now <= 0) {
      // Release moment reached — swap message in
      const label = document.querySelector(".countdown-label");
      if (label) label.textContent = "The veil has lifted.";
    }
  }

  if (els.days) {
    tick();
    setInterval(tick, 1000);
  }

  // ---- Footer year ----
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();

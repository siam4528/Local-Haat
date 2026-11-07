// LocalHaat runs on Bangladesh time, whatever time zone the phone is set to: a shop opens at 9 in Dhaka,
// "today" is Dhaka's today, and a month in the report is a Dhaka month. Bangladesh is UTC+6 all year (no daylight saving).
window.LHTime = (function () {
  'use strict';
  const TZ = 'Asia/Dhaka';
  const OFFSET = 6 * 36e5;
  const pad = (n) => String(n).padStart(2, '0');
  const ms = (at) => (at === undefined ? Date.now() : +new Date(at));
  // a moment as a clock and a calendar in Dhaka show it: year, month 1-12, day, weekday (0 is Sunday), hours, minutes
  function parts(at) {
    const d = new Date(ms(at) + OFFSET);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate(), wd: d.getUTCDay(), hh: d.getUTCHours(), mm: d.getUTCMinutes() };
  }
  // "YYYY-MM-DD" and "HH:MM" in Dhaka; with no moment, now
  const ymd = (at) => { const p = parts(at); return p.y + '-' + pad(p.m) + '-' + pad(p.d); };
  const hhmm = (at) => { const p = parts(at); return pad(p.hh) + ':' + pad(p.mm); };
  const month = (at) => ymd(at).slice(0, 7);
  // the moment a date and a time written in Dhaka stand for
  function at(day, time) {
    const [y, m, d] = String(day).split('-').map(Number);
    const [h, mi] = String(time || '00:00').split(':').map(Number);
    return new Date(Date.UTC(y, m - 1, d, h || 0, mi || 0) - OFFSET);
  }
  // "YYYY-MM-DD HH:MM" or "YYYY-MM-DDTHH:MM", as the app writes a time for later
  const parse = (when) => { const [day, time] = String(when).split(/[ T]/); return at(day, time); };
  const addDays = (day, n) => ymd(+at(day, '12:00') + n * 864e5);
  const weekday = (day) => parts(at(day, '12:00')).wd;
  // "YYYY-MM" n months later (or earlier, when n is negative), and how many days a month has
  const monthAdd = (ym, n) => { const [y, m] = ym.split('-').map(Number); const t = (y * 12 + m - 1) + n; return Math.floor(t / 12) + '-' + pad((t % 12) + 1); };
  const daysIn = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(Date.UTC(y, m, 0)).getUTCDate(); };
  // shown in the page's language, on Dhaka's clock
  const show = (when, opts, lang) => new Date(when).toLocaleString(lang === 'en' ? 'en-GB' : 'bn-BD', Object.assign({ timeZone: TZ }, opts));
  return { TZ, parts, ymd, hhmm, month, at, parse, addDays, weekday, monthAdd, daysIn, show };
})();

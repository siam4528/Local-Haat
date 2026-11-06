// The team's view of the country: 8 divisions, their 64 districts, and each district's upazilas, with Dhaka city's thanas.
// One choice narrows every list and report of the team's panel and stays while the team moves between its pages.
// Anything placed is an object with a district (zila) and an upazila or thana (area).
window.LHArea = (function () {
  'use strict';
  const Store = window.LHStore;
  let U;
  const pick = { div: '', zila: '', upa: '' };
  const byBn = (a, b) => a.localeCompare(b, 'bn');
  const DIVS = () => Object.keys(window.LH_DIV).sort(byBn);
  function divOf(zila) {
    return DIVS().find((d) => window.LH_DIV[d].includes(zila)) || '';
  }
  // A division's staff see only their own division: the choice starts there and cannot leave it.
  // Another person logging in starts from the whole country again.
  let who = '';
  const lock = () => { const m = Store.teamMe(); return m && m.role === 'division' ? m.division : ''; };
  function sync() {
    const m = Store.teamMe();
    const id = m ? m.id : '';
    if (id !== who) { who = id; pick.div = ''; pick.zila = ''; pick.upa = ''; }
    const d = lock();
    if (d && pick.div !== d) { pick.div = d; pick.zila = ''; pick.upa = ''; }
  }
  const inPick = (x) => { sync(); return !!x && (!pick.div || divOf(x.zila) === pick.div) && (!pick.zila || x.zila === pick.zila) && (!pick.upa || x.area === pick.upa); };
  const isOn = () => { sync(); return !!(pick.div || pick.zila || pick.upa); };
  // where an order, a ticket or a request is: its shop's place, or the delivery man's
  const ofShop = (shopId) => Store.shopById(shopId) || null;
  function ofTicket(t) {
    const a = t.accountId && Store.data.accounts.find((x) => x.id === t.accountId);
    if (a && a.role === 'owner') return ofShop(a.shopId);
    if (a && a.role === 'delivery') return a;
    const o = t.orderCode && Store.data.orders.find((x) => x.code === t.orderCode);
    return o ? ofShop(o.shopId) : null;
  }

  // The three choices with how many items each holds. All 8 divisions and 64 districts are always listed.
  function filterHtml(items) {
    sync();
    const locked = !!lock();
    const n = (f) => U.bn(items.filter((x) => x && f(x)).length);
    const zilas = (pick.div ? window.LH_DIV[pick.div] : DIVS().flatMap((d) => window.LH_DIV[d])).slice().sort(byBn);
    const thanas = (window.LH_CITY_THANA || {})[pick.zila] || [];
    const upas = pick.zila ? (window.LH_GEO[pick.zila] || []).filter((u) => !thanas.includes(u)) : [];
    // a place typed in by hand that is not on the list still shows
    const other = pick.zila ? [...new Set(items.filter((x) => x && x.zila === pick.zila && x.area && !upas.includes(x.area) && !thanas.includes(x.area)).map((x) => x.area))].sort(byBn) : [];
    const opt = (v, cur, label, f) => `<option value="${U.esc(v)}" ${cur === v ? 'selected' : ''}>${label} (${n(f)})</option>`;
    const upaOpts = (list) => list.map((u) => opt(u, pick.upa, U.geo(u), (x) => x.zila === pick.zila && x.area === u)).join('');
    return `<div class="area-pick" role="group" aria-label="এলাকা বেছে নিন">
      <label class="field"><span>বিভাগ</span><select data-area-pick="div" ${locked ? 'disabled' : ''}>${locked ? '' : `<option value="">সব বিভাগ (${n(() => true)})</option>`}${(locked ? [pick.div] : DIVS()).map((d) => opt(d, pick.div, U.geo(d), (x) => divOf(x.zila) === d)).join('')}</select></label>
      <label class="field"><span>জেলা</span><select data-area-pick="zila"><option value="">সব জেলা (${n((x) => !pick.div || divOf(x.zila) === pick.div)})</option>${zilas.map((z) => opt(z, pick.zila, U.geo(z), (x) => x.zila === z)).join('')}</select></label>
      <label class="field"><span>উপজেলা / থানা</span><select data-area-pick="upa" ${pick.zila ? '' : 'disabled'}><option value="">সব উপজেলা${pick.zila ? ` (${n((x) => x.zila === pick.zila)})` : ''}</option>${pick.zila ? `<optgroup label="উপজেলা">${upaOpts(upas)}</optgroup>${thanas.length ? `<optgroup label="সিটি কর্পোরেশনের থানা">${upaOpts(thanas)}</optgroup>` : ''}${other.length ? `<optgroup label="তালিকার বাইরে">${upaOpts(other)}</optgroup>` : ''}` : ''}</select></label>
    </div>`;
  }
  // a list under division, district and upazila headings
  function grouped(list, row) {
    const count = (k) => `<small>${U.bn(k)}</small>`;
    const unknown = list.filter((x) => !divOf(x.zila));
    const html = DIVS().map((d) => {
      const inDiv = list.filter((x) => divOf(x.zila) === d);
      if (!inDiv.length) return '';
      return `<section class="ad-div"><h2><span>${U.geo(d)}</span> <span>বিভাগ</span> ${count(inDiv.length)}</h2>
        ${[...new Set(inDiv.map((x) => x.zila))].sort(byBn).map((z) => {
          const inZila = inDiv.filter((x) => x.zila === z);
          return `<section class="ad-zila"><h3><span>${U.geo(z)}</span> <span>জেলা</span> ${count(inZila.length)}</h3>
            ${[...new Set(inZila.map((x) => x.area || ''))].sort(byBn).map((u) => {
              const rows = inZila.filter((x) => (x.area || '') === u);
              return `<h4 class="ad-upa">${u ? U.geo(u) : 'এলাকা জানা নেই'} ${count(rows.length)}</h4><div class="stack">${rows.map(row).join('')}</div>`;
            }).join('')}</section>`;
        }).join('')}</section>`;
    }).join('');
    return html + (unknown.length ? `<section class="ad-div"><h2>এলাকা জানা নেই ${count(unknown.length)}</h2><div class="stack">${unknown.map(row).join('')}</div></section>` : '');
  }
  // The next level down for a report: the 8 divisions, a division's districts, or a district's upazilas, each a row the team can open.
  function levels() {
    sync();
    if (pick.zila) {
      const thanas = (window.LH_CITY_THANA || {})[pick.zila] || [];
      return { word: 'উপজেলা / থানা', set: 'upa', rows: (window.LH_GEO[pick.zila] || []).filter((u) => !thanas.includes(u)).concat(thanas).map((u) => ({ key: u, label: U.geo(u), has: (x) => x.zila === pick.zila && x.area === u })) };
    }
    if (pick.div) return { word: 'জেলা', set: 'zila', rows: window.LH_DIV[pick.div].slice().sort(byBn).map((z) => ({ key: z, label: U.geo(z), has: (x) => x.zila === z })) };
    return { word: 'বিভাগ', set: 'div', rows: DIVS().map((d) => ({ key: d, label: U.geo(d), has: (x) => divOf(x.zila) === d })) };
  }
  // what the team has chosen, in words, with a way back to the whole country
  function crumbs() {
    if (!isOn()) return '';
    const locked = lock();
    const parts = [pick.div && `<span>${U.geo(pick.div)}</span> <span>বিভাগ</span>`, pick.zila && `<span>${U.geo(pick.zila)}</span> <span>জেলা</span>`, pick.upa && U.geo(pick.upa)].filter(Boolean);
    const back = !locked ? '<button type="button" class="inline" data-area-set="all">সারা দেশ</button>' : pick.zila ? '<button type="button" class="inline" data-area-set="all">পুরো বিভাগ</button>' : '';
    return `<p class="meta area-crumbs">📍 ${parts.join(' › ')} ${back}</p>`;
  }
  function set(level, value) {
    const locked = lock();
    if (level === 'all') { pick.div = locked; pick.zila = ''; pick.upa = ''; return; }
    if (level === 'div') { if (locked) return; pick.div = value; pick.zila = ''; pick.upa = ''; }
    if (level === 'zila') { if (locked && value && divOf(value) !== locked) return; pick.zila = value; pick.upa = ''; if (value) pick.div = divOf(value); }
    if (level === 'upa') pick.upa = value;
  }
  function init(ui) {
    U = ui;
    document.addEventListener('change', (e) => {
      const level = e.target.dataset && e.target.dataset.areaPick;
      if (!level) return;
      set(level, e.target.value);
      U.route(true);
    });
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-area-set]');
      if (!b) return;
      set(b.dataset.areaSet, b.dataset.value || '');
      U.route(true);
    });
  }
  return { init, pick, divOf, inPick, isOn, ofShop, ofTicket, filterHtml, grouped, levels, crumbs, set };
})();

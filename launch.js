// Launch tickets. The user searches trips, picks cabins on a map of each floor or a number of deck places, pays online
// and gets a ticket with a code and a QR code. The launch counter sets up its launches, routes, fares and trips, sells for
// cash and holds cabins for callers at the counter, and boards passengers, with or without a network.
// The app and the counter sell from one list, so a cabin is never sold twice.
window.LHLaunch = (function () {
  'use strict';
  const Store = window.LHStore;
  let U;
  const $ = (id) => document.getElementById(id);
  const DIGITS = '০১২৩৪৫৬৭৮৯';
  const ascii = (s) => String(s === undefined || s === null ? '' : s).replace(/[০-৯]/g, (c) => DIGITS.indexOf(c));
  const num = (v) => { const t = ascii(v).trim(); return t === '' ? NaN : Number(t); };
  const customer = () => window.LHAuth.current('customer');
  const owner = () => window.LHAuth.current('owner');
  const ownShop = () => { const m = owner(); return m && Store.shopById(m.shopId); };
  const locale = () => (window.LHI18n.lang === 'en' ? 'en-GB' : 'bn-BD');
  const clock = (d) => d.toLocaleTimeString(locale(), { hour: 'numeric', minute: '2-digit' });
  const dayText = (d) => d.toLocaleDateString(locale(), { weekday: 'short', day: 'numeric', month: 'short' });
  const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const addDays = (day, n) => { const d = new Date(day + 'T12:00'); d.setDate(d.getDate() + n); return ymd(d); };
  const KINDS = ['single', 'double', 'family', 'vip'];
  const SHORT = { single: 'সিঙ্গেল', double: 'ডাবল', family: 'ফ্যামিলি', vip: 'ভিআইপি' };
  const ICON = { single: '🛏️', double: '🛏️', family: '👨‍👩‍👧', vip: '⭐', deck: '🧍' };
  const classWord = (k) => (k === 'deck' ? 'ডেক' : Store.CABIN[k]);
  const STATUS = { on: ['ok-soft', '✓ চলবে'], late: ['warn', '⏰ দেরি'], off: ['bad', '🚫 বাতিল'], gone: ['', '⛴️ ছেড়ে গেছে'] };
  const statusTag = (t) => `<span class="tag ${STATUS[t.status][0]}">${STATUS[t.status][1]}</span>`;
  const sellable = (t) => (t.status === 'on' || t.status === 'late') && t.dep > new Date();
  const minutesText = (min) => `${U.bn(Math.floor(min / 60))} <span>ঘণ্টা</span>${min % 60 ? ` ${U.bn(min % 60)} <span>মিনিট</span>` : ''}`;
  // when it leaves and when it reaches; a night launch reaches the next morning
  function whenHtml(dep, arr) {
    const next = arr.toDateString() !== dep.toDateString();
    return `<span>ছাড়বে</span> ${dayText(dep)}, ${clock(dep)} · <span>পৌঁছাবে</span> ${clock(arr)}${next ? ' <span>(পরের দিন)</span>' : ''}`;
  }
  function tripNote(t) {
    if (t.status === 'late') return `<p class="note ln-late">⏰ <span>লঞ্চ দেরিতে ছাড়বে। আগের সময় ছিল</span> ${clock(t.dep0)}${t.note ? ' · ' + U.ud(t.note) : ''}</p>`;
    if (t.status === 'off') return `<p class="note ln-off">🚫 <span>এই ট্রিপ বাতিল হয়েছে</span>${t.note ? ': ' + U.ud(t.note) : ''}</p>`;
    return '';
  }
  // which classes this trip sells: a cabin kind the launch has and the route has a fare for, and the deck
  const classesOf = (t) => ['single', 'double', 'family', 'vip', 'deck'].filter((k) => t.route.fares[k] > 0 && (k === 'deck' ? t.boat.deck > 0 : t.boat.cabins.some((c) => c.type === k && !c.off)));
  function classesHtml(t, free) {
    return `<ul class="ln-classes">${classesOf(t).map((k) => `<li><span>${ICON[k]} ${classWord(k)}</span><b>${U.tk(t.route.fares[k])}</b><small>${free ? (k === 'deck' ? `<span>${U.bn(free.deck)}</span> <span>জনের জায়গা</span>` : `<span>${U.bn(free[k])}</span><span>টি খালি</span>`) : ''}</small></li>`).join('')}</ul>`;
  }
  // the agent's give-back rule in words
  function refundRule(l) {
    const tiers = l.refund || [];
    const parts = tiers.map((t) => `${U.bn(t.hours)} <span>ঘণ্টা বা তার বেশি আগে</span> ${U.bn(t.pct)}%`);
    return parts.concat('<span>তার পরে কিছু ফেরত নেই</span>').join(' · ');
  }
  // a QR code drawn as SVG from the vendored generator; it holds the ticket number and its code
  function qrSvg(text) {
    if (typeof window.qrcode !== 'function') return '';
    const q = window.qrcode(0, 'M');
    q.addData(text);
    q.make();
    const n = q.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
    return `<svg class="qr" viewBox="0 0 ${n + 8} ${n + 8}" role="img" aria-label="টিকেটের QR কোড" shape-rendering="crispEdges"><rect width="${n + 8}" height="${n + 8}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
  }
  const qrText = (o) => `LHL:${o.code}:${o.pin}`;

  /* ---------- the cabin map: each floor, cabins on both sides of the corridor ---------- */
  const STATE = { free: ['', 'খালি'], pick: ['✓', 'বাছাই করা'], held: ['⏳', 'রাখা আছে'], phone: ['📞', 'ফোনে রাখা'], sold: ['✕', 'বিক্রি হয়েছে'], off: ['🚫', 'বন্ধ'] };
  function cabinState(t, used, chosen, c, side) {
    if (c.off || !(t.route.fares[c.type] > 0)) return 'off';
    if (chosen.includes(c.no)) return 'pick';
    const u = used.cabins[c.no];
    if (!u) return 'free';
    return side === 'user' && u === 'phone' ? 'held' : u;
  }
  // side: 'user' picks free cabins, 'counter' also opens a phone hold, 'edit' opens any cabin to change it
  function cabinMap(t, used, chosen, side, floor) {
    const cabins = t.boat.cabins.filter((c) => c.floor === floor);
    if (!cabins.length) return '<p class="meta">এই তলায় কোনো কেবিন নেই।</p>';
    const half = Math.ceil(cabins.length / 2);
    const left = cabins.slice(0, half);
    const right = cabins.slice(half);
    const rows = Math.max(Math.ceil(left.length / 2), Math.ceil(right.length / 2));
    const cell = (c) => {
      if (!c) return '<span class="cab cab-none" aria-hidden="true"></span>';
      const st = side === 'edit' ? (c.off ? 'off' : 'free') : cabinState(t, used, chosen, c, side);
      const can = side === 'edit' || st === 'free' || st === 'pick' || (side === 'counter' && st === 'phone');
      return `<button type="button" class="cab cab-${st} t-${c.type}" data-ln="cab" data-no="${U.esc(c.no)}" ${st === 'pick' ? 'aria-pressed="true"' : side === 'edit' ? '' : 'aria-pressed="false"'} ${can ? '' : 'disabled'}
        aria-label="কেবিন ${U.bn(c.no)}, ${Store.CABIN[c.type]}, ${STATE[st][1]}"><b translate="no">${U.bn(c.no)}</b><small>${SHORT[c.type]}</small>${STATE[st][0] ? `<i aria-hidden="true">${STATE[st][0]}</i>` : ''}</button>`;
    };
    let grid = '';
    for (let r = 0; r < rows; r++) grid += cell(left[2 * r]) + cell(left[2 * r + 1]) + '<span class="aisle" aria-hidden="true"></span>' + cell(right[2 * r]) + cell(right[2 * r + 1]);
    return `<div class="deckplan"><div class="bow" aria-hidden="true">▲ <span>সামনে</span></div><div class="cab-grid">${grid}</div></div>`;
  }
  function legendHtml(side) {
    const keys = side === 'edit' ? ['free', 'off'] : side === 'user' ? ['free', 'pick', 'held', 'sold'] : ['free', 'pick', 'phone', 'held', 'sold', 'off'];
    return `<ul class="cab-legend">${keys.map((k) => `<li><span class="cab-dot cab-${k}" aria-hidden="true">${STATE[k][0]}</span>${STATE[k][1]}</li>`).join('')}</ul>`;
  }
  function floorTabs(t, floor, side) {
    if (t.boat.floors.length < 2) return '';
    return `<div class="chips" role="group" aria-label="তলা">${t.boat.floors.map((f, i) => `<button type="button" class="chip ${i === floor ? 'on' : ''}" aria-pressed="${i === floor}" data-ln="floor" data-side="${side}" data-i="${i}">${U.ud(f.name)}</button>`).join('')}</div>`;
  }
  const stepper = (n, max, side) => `<div class="stepper" role="group" aria-label="ডেকে কতজন">
      <button type="button" class="btn ghost" data-ln="deck" data-side="${side}" data-by="-1" aria-label="একজন কম" ${n <= 0 ? 'disabled' : ''}>−</button>
      <b id="ln-deck-n">${U.bn(n)}</b>
      <button type="button" class="btn ghost" data-ln="deck" data-side="${side}" data-by="1" aria-label="একজন বেশি" ${n >= Math.min(20, max) ? 'disabled' : ''}>+</button></div>`;
  // what the picked cabins and deck places cost
  function billOf(t, cabins, deck) {
    const rows = [];
    KINDS.forEach((k) => {
      const list = cabins.filter((no) => (t.boat.cabins.find((c) => c.no === no) || {}).type === k);
      if (list.length) rows.push([`${classWord(k)} <span>কেবিন</span> <small translate="no">(${list.map((x) => U.bn(x)).join(', ')})</small>`, list.length, t.route.fares[k]]);
    });
    if (deck) rows.push(['ডেক', deck, t.route.fares.deck]);
    return { rows, total: rows.reduce((a, r) => a + r[1] * r[2], 0) };
  }
  const billHtml = (b) => `${b.rows.length ? b.rows.map(([name, n, fare]) => `<div class="sum"><span>${U.bn(n)} × ${name}</span><b>${U.tk(n * fare)}</b></div>`).join('') : '<p class="meta">কেবিন বা ডেকের টিকেট বাছুন।</p>'}
      <div class="sum total"><span>মোট</span><b id="ln-total">${U.tk(b.total)}</b></div>`;

  /* ---------- the user: search ---------- */
  let lq = { from: '', to: '', date: '' };
  function resultCard(r) {
    const { shop, trip } = r;
    const free = Store.lnFree(shop, trip);
    return `<article class="panel ln-trip ${sellable(trip) ? '' : 'off'}">
      <div class="route-head"><span class="thumb" aria-hidden="true">🛳️</span><div class="item-txt"><b>${U.ud(trip.boat.name)}</b><small><a class="inline-link" href="#/shop/${shop.id}">${U.ud(shop.name)}</a></small></div>${statusTag(trip)}</div>
      <p class="bus-leg">⚓ ${U.ud(trip.route.from.name)} <span aria-hidden="true">→</span> 🏁 ${U.ud(trip.route.to.name)}</p>
      <p class="meta">${whenHtml(trip.dep, trip.arr)}</p>
      ${tripNote(trip)}
      ${classesHtml(trip, free)}
      ${sellable(trip) ? `<a class="btn sm book-btn" href="#/launch/${shop.id}/${trip.id}">🎫 কেবিন বাছুন ও টিকেট কাটুন</a>` : '<small class="closed-txt">এই ট্রিপের টিকেট আর পাওয়া যাবে না</small>'}
    </article>`;
  }
  function searchPage() {
    const today = Store.today();
    const days = Array.from({ length: Store.LAUNCH_DAYS }, (_, i) => addDays(today, i));
    const date = days.includes(lq.date) ? lq.date : today;
    const list = Store.lnFind(lq.from, lq.to, date);
    const dayLabel = (d, i) => (i === 0 ? 'আজ' : i === 1 ? 'কাল' : dayText(new Date(d + 'T12:00')));
    return `<a class="back" href="#/">‹ হোম</a>
      <h1 class="page-h">লঞ্চের টিকেট</h1>
      <p class="meta gap">কেবিন ম্যাপে বেছে নিন, ডেকের টিকেট সংখ্যা দিয়ে। অনলাইনে টাকা দিন, ঘাটে কোড বা QR দেখিয়ে উঠুন।</p>
      <form id="ln-find" class="panel" role="search" novalidate>
        <div class="row2">
          <label class="field"><span>কোথা থেকে</span><input id="lf-from" type="text" list="lf-ghats" maxlength="60" autocomplete="off" placeholder="যেমন: সদরঘাট" value="${U.esc(lq.from)}"></label>
          <label class="field"><span>কোথায় যাবেন</span><input id="lf-to" type="text" list="lf-ghats" maxlength="60" autocomplete="off" placeholder="যেমন: বরিশাল" value="${U.esc(lq.to)}"></label>
        </div>
        <datalist id="lf-ghats">${Store.lnGhats().map((x) => `<option value="${U.esc(x)}"></option>`).join('')}</datalist>
        <button type="submit" class="btn block">লঞ্চ খুঁজুন</button>
      </form>
      <div class="chips gap-t" role="group" aria-label="কোন দিন">${days.map((d, i) => `<button type="button" class="chip ${d === date ? 'on' : ''}" aria-pressed="${d === date}" data-ln="day" data-day="${d}">${dayLabel(d, i)}</button>`).join('')}</div>
      <h2><span>${U.bn(list.length)}</span><span>টি ট্রিপ</span> · ${dayText(new Date(date + 'T12:00'))}</h2>
      ${list.length ? `<div class="stack">${list.map(resultCard).join('')}</div>` : '<div class="empty"><span aria-hidden="true">🛳️</span><h3>এই দিনে এই পথে কোনো লঞ্চ পাওয়া যায়নি</h3><p>ঘাটের নাম তালিকা থেকে বেছে নিন, অন্য দিন দেখুন, অথবা একটি ঘর খালি রাখুন।</p></div>'}
      <p class="meta gap-t">ডেমো: লঞ্চ, ভাড়া ও সময় নমুনা তথ্য।</p>`;
  }

  /* ---------- the user: one trip, its cabin map, and paying ---------- */
  let pk = { key: '' };
  function freshPick(key) {
    const me = U.viewing() ? null : customer();
    pk = { key, cabins: [], deck: 0, floor: 0, name: me ? me.name : '', phone: me && /^01[3-9]\d{8}$/.test(me.contact || '') ? me.contact : '', pay: 'bkash' };
  }
  const PAY = [['bkash', '📱', 'বিকাশ'], ['nagad', '📱', 'নগদ'], ['card', '💳', 'ডেবিট বা ক্রেডিট কার্ড']];
  function tripPage(shopId, tripId) {
    const s = Store.shopById(shopId);
    if (!s || !Store.shopLive(s) || !s.launch) return null;
    const t = Store.lnTrip(s, tripId);
    if (!t) return null;
    const key = s.id + '/' + t.id;
    if (pk.key !== key) freshPick(key);
    const used = Store.lnUsed(s, t.id);
    // a cabin picked a moment ago that someone else has taken since is let go
    pk.cabins = pk.cabins.filter((no) => !used.cabins[no]);
    const free = Store.lnFree(s, t);
    const open = sellable(t);
    const floor = Math.min(pk.floor, Math.max(0, t.boat.floors.length - 1));
    const b = billOf(t, pk.cabins, pk.deck);
    return `<a class="back" href="#/launch">‹ লঞ্চ খুঁজুন</a>
      <h1 class="page-h">${U.ud(t.boat.name)}</h1>
      <form id="ln-buy" class="two" data-shop="${s.id}" data-trip="${t.id}" novalidate>
        <div class="stack">
          <section class="panel">
            <p class="bus-leg">⚓ ${U.ud(t.route.from.name)} <span aria-hidden="true">→</span> 🏁 ${U.ud(t.route.to.name)} ${statusTag(t)}</p>
            <p class="meta">${whenHtml(t.dep, t.arr)} · <span>নদীপথে</span> ${minutesText(t.route.min)}</p>
            <p class="meta"><a class="inline-link" href="#/shop/${s.id}">${U.ud(s.name)}</a> · <span>ঘাটের কাউন্টার</span> <a href="tel:${U.esc(t.route.from.phone)}">${U.bn(t.route.from.phone)}</a></p>
            ${tripNote(t)}
            ${classesHtml(t, free)}
          </section>
          ${open ? `<section class="panel">
            <h2 class="tight">কেবিন বাছুন</h2>
            <p class="meta">খালি কেবিনে চাপ দিন, আবার চাপলে বাদ যাবে। একবারে ৬টি পর্যন্ত।</p>
            ${floorTabs(t, floor, 'user')}
            ${cabinMap(t, used, pk.cabins, 'user', floor)}
            ${legendHtml('user')}
          </section>
          ${classesOf(t).includes('deck') ? `<section class="panel">
            <h2 class="tight">ডেকের টিকেট</h2>
            <p class="meta">ডেকে সিট নম্বর নেই, জায়গা আগে এলে আগে পাবেন। <span>খালি</span>: <span>${U.bn(free.deck)}</span> <span>জনের জায়গা</span></p>
            ${stepper(pk.deck, free.deck, 'user')}
          </section>` : ''}
          <section class="panel">
            <h2 class="tight">যাত্রীর তথ্য</h2>
            <label class="field"><span>নাম</span><input id="ln-name" data-lp="name" type="text" maxlength="60" autocomplete="name" value="${U.esc(pk.name)}"></label>
            <label class="field"><span>মোবাইল নম্বর</span><input id="ln-phone" data-lp="phone" type="tel" inputmode="numeric" placeholder="01XXXXXXXXX" autocomplete="tel" value="${U.esc(pk.phone)}"><small>দেরি বা বাতিল হলে এই নম্বরে SMS যাবে।</small></label>
          </section>
          <section class="panel pay-pick">
            <h2 class="tight" id="ln-pay-h">কিভাবে টাকা দেবেন?</h2>
            <p class="meta">অ্যাপে কাটা টিকেটের টাকা অনলাইনেই দিতে হয়। পেমেন্টের সময় কেবিন ${U.bn(Store.PAY_HOLD_MIN)} মিনিট আপনার জন্য রাখা থাকবে।</p>
            <div role="radiogroup" aria-labelledby="ln-pay-h">${PAY.map(([v, icon, word]) => `<label class="pay"><input type="radio" name="ln-pay" data-lp="pay" value="${v}" ${pk.pay === v ? 'checked' : ''}><span><b>${icon} ${word}</b></span></label>`).join('')}</div>
          </section>` : ''}
          <section class="panel"><h2 class="tight">নদীপথ</h2><div class="mini-map route-map" data-river="${s.id}/${t.route.id}" aria-label="নদীপথের ম্যাপ: ছাড়ার ও পৌঁছানোর ঘাট"></div></section>
        </div>
        ${open ? `<aside class="panel bill">
          <h2 class="tight">হিসাব</h2>
          <div id="ln-bill">${billHtml(b)}</div>
          <small class="err" id="ln-err" role="alert"></small>
          ${U.viewing() ? '<p class="note">👁 দেখার মোড: এখান থেকে টিকেট কাটা যাবে না।</p>' : ''}
          <button type="submit" class="btn block">টিকেট কাটুন</button>
          <p class="meta">বাতিলের নিয়ম: ${refundRule(s.launch)}</p>
        </aside>` : ''}
      </form>`;
  }
  function submitBuy(form) {
    const err = $('ln-err');
    err.textContent = '';
    if (U.viewing()) { U.toast('দেখার মোডে টিকেট কাটা যায় না'); return; }
    const me = customer();
    if (!me || !me.verified) {
      U.setAfter(location.hash);
      location.hash = me ? '#/auth/verify/customer' : '#/auth/customer/login';
      return;
    }
    const s = Store.shopById(form.dataset.shop);
    const p = { shopId: s.id, trip: form.dataset.trip, cabins: pk.cabins.slice(), deck: pk.deck, name: pk.name, phone: ascii(pk.phone).replace(/[\s-]/g, ''), pay: pk.pay, customerId: me.id };
    let h;
    try { h = Store.lnHold(p); } catch (ex) { err.textContent = ex.message; return; }
    U.payOnline(p.pay, h.total, (payment) => {
      try {
        const o = Store.lnBuy(p, h.hold, payment);
        pk = { key: '' };
        location.hash = '#/track/' + o.code;
      } catch (ex) {
        Store.lnRelease(s.id, h.hold);
        U.toast(ex.message);
        U.route(true);
      }
    }, () => { Store.lnRelease(s.id, h.hold); U.route(true); });
  }

  /* ---------- the ticket, on the order page and at the counter ---------- */
  function ticketBody(o) {
    const L = o.launch;
    const dep = new Date(L.dep);
    const arr = new Date(L.arr);
    return `<div class="ln-tk-head"><b>🛳️ ${U.ud(L.boatName)}</b><span>${U.ud(L.from)} → ${U.ud(L.to)}</span></div>
      <ul class="mini job">
        <li><span>🕗 <span>ছাড়বে</span></span><b>${dayText(dep)}, ${clock(dep)}</b></li>
        <li><span>🏁 <span>পৌঁছাবে</span></span><b>${clock(arr)}${arr.toDateString() !== dep.toDateString() ? ' <span>(পরের দিন)</span>' : ''}</b></li>
        ${L.cabins.map((c) => `<li><span>🛏️ <span>কেবিন</span> <b translate="no">${U.bn(c.no)}</b></span><b>${Store.CABIN[c.type]} · ${U.ud(c.floor)}</b></li>`).join('')}
        ${L.deck ? `<li><span>🧍 <span>ডেক</span></span><b><span>${U.bn(L.deck)}</span> <span>জন</span></b></li>` : ''}
        <li><span>👤 <span>যাত্রী</span></span><b>${U.ud(o.recipient.name)}</b></li>
      </ul>`;
  }
  function codeBlock(o) {
    return `<div class="ln-code"><div><span class="flabel">টিকেটের কোড</span><p class="pin-code" translate="no">${U.bn(o.pin)}</p><small>টিকেট নম্বর <span translate="no">#${U.bn(o.code)}</span></small></div>${qrSvg(qrText(o))}</div>`;
  }
  // the order page: the ticket while it can be used, what happened to the trip, and giving it back
  function ticketPanel(o, mine) {
    const L = o.launch;
    const s = Store.shopById(o.shopId);
    const t = s && s.launch ? Store.lnTrip(s, L.trip) : null;
    const open = o.status === 'confirmed' && !L.boarded && new Date(L.dep) > new Date();
    return `<section class="panel ln-ticket" id="ln-ticket">
      <h2 class="tight">লঞ্চের টিকেট</h2>
      ${ticketBody(o)}
      ${t && o.status !== 'cancelled' ? tripNote(t) : ''}
      ${o.status === 'confirmed' ? `${codeBlock(o)}<p class="meta">ঘাটে বা লঞ্চে উঠার সময় এই কোড বা QR দেখান। অন্যের জন্য কাটলে তাঁকে কোডটি জানিয়ে দিন।</p>` : ''}
      ${o.status === 'cancelled' ? `<p class="note">${o.paid ? (o.refund ? `↩️ <span>ফেরত যাবে</span> ${U.tk(o.refund.amount)} <span>(অনলাইনে যেভাবে দিয়েছিলেন)</span>` : '<span>এই সময়ে বাতিলে কিছু ফেরত নেই</span>') : `↩️ <span>কাউন্টারে নগদ ফেরত</span> ${U.tk(o.cashBack || 0)}`}${o.keep ? ` · <span>কেটে রাখা</span> ${U.tk(o.keep)}` : ''}</p>` : ''}
      ${mine && open ? `<button type="button" class="btn ghost block" data-ln="cancel-ask" data-code="${o.code}">টিকেট বাতিল করুন</button>` : ''}
    </section>`;
  }
  function cancelSheet(code) {
    const o = Store.data.orders.find((x) => x.code === code);
    if (!o) return;
    const q = Store.lnRefund(o);
    U.openSheet(`<h2 id="sheet-h">টিকেট বাতিল করবেন?</h2>
      <p>${q.back ? `<span>এখন বাতিল করলে ফেরত পাবেন</span> <b>${U.tk(q.back)}</b> (${U.bn(q.pct)}%)` : '<span>এখন বাতিল করলে কিছু ফেরত পাবেন না।</span>'}${q.keep ? ` · <span>কেটে রাখা হবে</span> ${U.tk(q.keep)}` : ''}</p>
      <p class="meta">বাতিলের নিয়ম: ${refundRule(Store.shopById(o.shopId).launch)}</p>
      <button type="button" class="btn block" data-ln="cancel-yes" data-code="${code}">হ্যাঁ, বাতিল করুন</button>
      <button type="button" class="link" data-action="close-sheet">না, থাক</button>`);
  }

  /* ---------- a launch counter's page for users: its routes on the river, launches, and the next trips ---------- */
  function shopHtml(s) {
    const l = s.launch;
    const today = Store.today();
    const next = Store.lnTrips(s, today, 3).filter((t) => t.dep > new Date() || t.status === 'late');
    return `<h2>রুট ও ভাড়া</h2>
      ${l.routes.length ? `<div class="stack">${l.routes.map((r) => `<article class="panel route">
        <p class="bus-leg">⚓ ${U.ud(r.from.name)} <span aria-hidden="true">→</span> 🏁 ${U.ud(r.to.name)}</p>
        <p class="meta"><span>নদীপথে</span> ${minutesText(r.min)} · <span>কাউন্টার</span> <a href="tel:${U.esc(r.from.phone)}">${U.bn(r.from.phone)}</a>${r.to.phone ? ` · ${U.ud(r.to.name)} <a href="tel:${U.esc(r.to.phone)}">${U.bn(r.to.phone)}</a>` : ''}</p>
        <div class="mini-map route-map" data-river="${s.id}/${r.id}" aria-label="নদীপথের ম্যাপ: ছাড়ার ও পৌঁছানোর ঘাট"></div>
        <ul class="ln-classes">${['single', 'double', 'family', 'vip', 'deck'].filter((k) => r.fares[k] > 0).map((k) => `<li><span>${ICON[k]} ${classWord(k)}</span><b>${U.tk(r.fares[k])}</b></li>`).join('')}</ul>
      </article>`).join('')}</div>` : '<p class="meta">এই কাউন্টার এখনো কোনো রুট দেয়নি।</p>'}
      <h2 class="gap-t">লঞ্চ</h2>
      <ul class="items">${l.boats.map((b) => `<li class="item"><span class="thumb" aria-hidden="true">🛳️</span><div class="item-txt"><b>${U.ud(b.name)}</b><small>${boatSummary(b)}</small></div></li>`).join('')}</ul>
      <h2 class="gap-t">সামনের ট্রিপ</h2>
      ${next.length ? `<div class="stack">${next.map((t) => `<a class="panel ln-next" href="#/launch/${s.id}/${t.id}"><span><b>${U.ud(t.boat.name)}</b><small>${U.ud(t.route.from.name)} → ${U.ud(t.route.to.name)}</small><small>${whenHtml(t.dep, t.arr)}</small></span>${statusTag(t)}</a>`).join('')}</div>` : '<p class="meta">সামনের তিন দিনে কোনো ট্রিপ নেই।</p>'}
      <a class="promise gap-t" href="#/launch"><span class="promise-ico" aria-hidden="true">🔎</span><span><b>সব লঞ্চ খুঁজুন</b> কোথা থেকে কোথায় যাবেন, কোন দিন</span><span class="promise-go" aria-hidden="true">›</span></a>
      <p class="meta gap-t">ডেমো: লঞ্চ, ভাড়া ও সময় নমুনা তথ্য।</p>`;
  }
  function boatSummary(b) {
    const n = {};
    b.cabins.forEach((c) => { n[c.type] = (n[c.type] || 0) + 1; });
    const parts = KINDS.filter((k) => n[k]).map((k) => `<span>${SHORT[k]}</span> ${U.bn(n[k])}`);
    return `<span>${U.bn(b.cabins.length)}</span><span>টি কেবিন</span>${parts.length ? ' (' + parts.join(', ') + ')' : ''} · <span>ডেকে</span> ${U.bn(b.deck)} <span>জন</span> · <span>${U.bn(b.floors.length)}</span><span>টি তলা</span>`;
  }

  /* ---------- the agent panel ---------- */
  function ownerTabs(link, h) {
    return link('#/owner/counter', '🎫', 'কাউন্টার', h.startsWith('#/owner/counter')) +
      link('#/owner/items', '🛳️', 'লঞ্চ', h.startsWith('#/owner/items') || h.startsWith('#/owner/boat') || h.startsWith('#/owner/lroute'));
  }
  function ownerPage(s, parts) {
    const tab = parts[0];
    if (tab === 'items') return setupPage(s, parts[1] || 'boats');
    if (tab === 'boat') return boatPage(s, parts[1]);
    if (tab === 'lroute') return routePage(s, parts[1]);
    if (tab === 'counter') return parts[1] ? counterTrip(s, parts[1], parts[2] || 'sell') : counterHome(s);
    return null;
  }
  const SETUP = [['boats', 'লঞ্চ'], ['routes', 'রুট ও ভাড়া'], ['trips', 'ট্রিপের সূচি'], ['rules', 'নিয়ম']];
  function setupPage(s, sub) {
    const seg = `<nav class="seg four" aria-label="লঞ্চের সেটআপ">${SETUP.map(([k, w]) => `<a class="${k === sub ? 'on' : ''}" href="#/owner/items${k === 'boats' ? '' : '/' + k}" ${k === sub ? 'aria-current="page"' : ''}>${w}</a>`).join('')}</nav>`;
    const body = sub === 'boats' ? boatsTab(s) : sub === 'routes' ? routesTab(s) : sub === 'trips' ? tripsTab(s) : sub === 'rules' ? rulesTab(s) : null;
    return body === null ? null : seg + body;
  }
  function boatsTab(s) {
    const l = s.launch;
    return `<div class="page-row"><h1 class="page-h">লঞ্চ</h1><a class="btn" href="#/owner/boat/new">+ নতুন লঞ্চ</a></div>
      <p class="meta gap">প্রতিটি লঞ্চে কোন তলায় কোন কেবিন কয়টি আর ডেকে কতজন, তা দিন। নম্বর নিজে থেকে বসবে, পরে যেকোনো কেবিন বদলাতে পারবেন।</p>
      ${l.boats.length ? `<ul class="items">${l.boats.map((b) => `<li class="item own-item"><span class="thumb" aria-hidden="true">🛳️</span>
        <div class="item-txt"><b>${U.ud(b.name)}</b><small>${boatSummary(b)}</small></div>
        <div class="own-acts"><a class="btn ghost sm" href="#/owner/boat/${b.id}">এডিট</a><button type="button" class="btn danger sm" data-ln="boat-del" data-id="${b.id}" aria-label="মুছুন: ${U.ud(b.name)}">মুছুন</button></div></li>`).join('')}</ul>`
    : '<div class="empty"><span aria-hidden="true">🛳️</span><h3>এখনো কোনো লঞ্চ নেই</h3><p>প্রথম লঞ্চ দিন, তারপর রুট ও ট্রিপ।</p></div>'}`;
  }
  // the launch being written, kept while the page is drawn again
  let bd = null;
  let bdKey = '';
  const blankFloor = (i) => ({ name: ['দোতলা', 'তিনতলা', 'চারতলা', 'পাঁচতলা', 'ছয়তলা'][i] || '', start: String((i + 2) * 100 + 1), single: '', double: '', family: '', vip: '' });
  function boatSum() {
    const n = (v) => Number(ascii(v)) || 0;
    const t = { single: 0, double: 0, family: 0, vip: 0 };
    bd.floors.forEach((f) => KINDS.forEach((k) => { t[k] += n(f[k]); }));
    const all = KINDS.reduce((a, k) => a + t[k], 0);
    return `<span>মোট</span> <b>${U.bn(all)}</b><span>টি কেবিন</span>: ${KINDS.map((k) => `<span>${SHORT[k]}</span> ${U.bn(t[k])}`).join(', ')} · <span>ডেকে</span> ${U.bn(n(bd.deck))} <span>জন</span>`;
  }
  let editFloor = 0;
  function boatPage(s, id) {
    const b = id && id !== 'new' ? s.launch.boats.find((x) => x.id === id) : null;
    if (id !== 'new' && !b) return null;
    const key = s.id + '/' + id;
    if (bdKey !== key) {
      bd = b ? { name: b.name, deck: String(b.deck), floors: b.floors.map((f) => ({ name: f.name, start: String(f.start), single: String(f.counts.single || ''), double: String(f.counts.double || ''), family: String(f.counts.family || ''), vip: String(f.counts.vip || '') })) }
        : { name: '', deck: '', floors: [blankFloor(0)] };
      bdKey = key;
      editFloor = 0;
    }
    const cnt = (f, i, k) => `<label class="ln-n"><span>${SHORT[k]}</span><input type="text" inputmode="numeric" maxlength="2" data-lf="${k}" data-i="${i}" value="${U.esc(f[k] === '' ? '' : U.bn(f[k]))}" aria-label="${U.ud(f.name || '')} · ${Store.CABIN[k]}"></label>`;
    const t = b ? { boat: b, route: { fares: { single: 1, double: 1, family: 1, vip: 1, deck: 1 } } } : null;
    return `<a class="back" href="#/owner/items">‹ সব লঞ্চ</a>
      <h1 class="page-h">${b ? 'লঞ্চ এডিট করুন' : 'নতুন লঞ্চ'}</h1>
      <form id="boat-form" class="stack" novalidate>
        <section class="panel">
          <div class="row2">
            <label class="field"><span>লঞ্চের নাম</span><input id="lb-name" data-lb="name" type="text" maxlength="60" placeholder="যেমন: এমভি সোনার তরী" value="${U.esc(bd.name)}"></label>
            <label class="field"><span>ডেকে কতজন যাত্রী</span><input id="lb-deck" data-lb="deck" type="text" inputmode="numeric" maxlength="4" value="${U.esc(bd.deck === '' ? '' : U.bn(bd.deck))}"><small>ডেকে নম্বর নেই, এই সংখ্যা পর্যন্ত টিকেট বিক্রি হবে।</small></label>
          </div>
        </section>
        <section class="panel">
          <h2 class="tight">তলা ও কেবিন</h2>
          <p class="meta">প্রতিটি তলায় কোন ধরনের কেবিন কয়টি। প্রথম নম্বর থেকে গুনে নম্বর বসবে: আগে সিঙ্গেল, তারপর ডাবল, ফ্যামিলি, ভিআইপি।</p>
          <ol class="ln-floors">${bd.floors.map((f, i) => `<li class="ln-floor">
            <div class="row2"><label class="field"><span>তলার নাম</span><input type="text" maxlength="30" data-lf="name" data-i="${i}" value="${U.esc(f.name)}"></label>
              <label class="field"><span>প্রথম কেবিনের নম্বর</span><input type="text" inputmode="numeric" maxlength="4" data-lf="start" data-i="${i}" value="${U.esc(f.start === '' ? '' : U.bn(f.start))}"></label></div>
            <div class="ln-counts">${KINDS.map((k) => cnt(f, i, k)).join('')}</div>
            ${bd.floors.length > 1 ? `<button type="button" class="inline danger-txt" data-ln="floor-del" data-i="${i}">✕ এই তলা বাদ দিন</button>` : ''}</li>`).join('')}</ol>
          ${bd.floors.length < 5 ? '<button type="button" class="btn ghost sm" data-ln="floor-add">+ তলা যোগ করুন</button>' : ''}
          <p class="meta gap-t" id="lb-sum" role="status">${boatSum()}</p>
        </section>
        <small class="err" id="lb-err" role="alert"></small>
        <button type="submit" class="btn block">সংরক্ষণ করুন</button>
      </form>
      ${b ? `<section class="panel gap-t">
        <h2 class="tight">কেবিনের নকশা</h2>
        <p class="meta">কোনো কেবিনে চাপ দিয়ে তার নম্বর বা ধরন বদলান, মেরামতে থাকলে বন্ধ রাখুন। তলার সংখ্যা বদলালে ওই তলার নম্বর আবার গোনা হবে।</p>
        ${floorTabs(t, Math.min(editFloor, b.floors.length - 1), 'edit')}
        ${cabinMap(t, { cabins: {}, deck: 0 }, [], 'edit', Math.min(editFloor, b.floors.length - 1))}
        ${legendHtml('edit')}
      </section>` : ''}`;
  }
  function boatSave(s) {
    const id = bdKey.split('/')[1];
    const n = (v) => { const x = ascii(v).trim(); return x === '' ? 0 : Number(x); };
    try {
      const b = Store.lnSaveBoat(s.id, id === 'new' ? null : id, {
        name: bd.name, deck: n(bd.deck),
        floors: bd.floors.map((f) => ({ name: f.name, start: n(f.start), counts: { single: n(f.single), double: n(f.double), family: n(f.family), vip: n(f.vip) } }))
      });
      bdKey = '';
      U.toast('লঞ্চ সংরক্ষিত');
      if (id === 'new') location.hash = '#/owner/boat/' + b.id; else U.route(true);
    } catch (ex) { $('lb-err').textContent = ex.message; }
  }
  function cabinSheet(s, boatId, no) {
    const b = s.launch.boats.find((x) => x.id === boatId);
    const c = b && b.cabins.find((x) => x.no === no);
    if (!c) return;
    U.openSheet(`<h2 id="sheet-h"><span>কেবিন</span> <span translate="no">${U.bn(c.no)}</span></h2>
      <form id="cabin-form" data-boat="${boatId}" data-no="${U.esc(no)}" novalidate>
        <label class="field"><span>কেবিন নম্বর</span><input id="cb-no" type="text" maxlength="5" value="${U.esc(c.no)}"></label>
        <fieldset class="field fs"><legend>ধরন</legend><div class="vehicles">${KINDS.map((k) => `<label class="radio-pill"><input type="radio" name="cb-type" value="${k}" ${c.type === k ? 'checked' : ''}><span>${Store.CABIN[k]}</span></label>`).join('')}</div></fieldset>
        <label class="switch"><input type="checkbox" id="cb-off" ${c.off ? 'checked' : ''}><span>বন্ধ রাখুন (মেরামত চলছে, বিক্রি হবে না)</span></label>
        <small class="err" id="cb-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }

  function routesTab(s) {
    const l = s.launch;
    return `<div class="page-row"><h1 class="page-h">রুট ও ভাড়া</h1><a class="btn" href="#/owner/lroute/new">+ নতুন রুট</a></div>
      <p class="meta gap">কোন ঘাট থেকে ছেড়ে কোন ঘাটে যায়, নদীপথে কত সময়, আর প্রতিটি কেবিন ও ডেকের ভাড়া। যাত্রী শুরুর ঘাটে ওঠেন, শেষ ঘাটে নামেন।</p>
      ${l.routes.length ? `<div class="stack">${l.routes.map((r) => `<article class="panel">
        <div class="o-head"><div><b>${U.ud(r.from.name)} → ${U.ud(r.to.name)}</b><small><span>নদীপথে</span> ${minutesText(r.min)}</small></div>
          <div class="own-acts"><a class="btn ghost sm" href="#/owner/lroute/${r.id}">এডিট</a><button type="button" class="btn danger sm" data-ln="route-del" data-id="${r.id}" aria-label="মুছুন: ${U.ud(r.from.name)} → ${U.ud(r.to.name)}">মুছুন</button></div></div>
        <ul class="ln-classes">${['single', 'double', 'family', 'vip', 'deck'].map((k) => `<li><span>${ICON[k]} ${classWord(k)}</span><b>${r.fares[k] > 0 ? U.tk(r.fares[k]) : '<span>নেই</span>'}</b></li>`).join('')}</ul></article>`).join('')}</div>`
    : '<div class="empty"><span aria-hidden="true">🗺️</span><h3>এখনো কোনো রুট নেই</h3><p>ছাড়ার ও পৌঁছানোর ঘাট আর ভাড়া দিন।</p></div>'}`;
  }
  let rd = null;
  let rdKey = '';
  let rdMap = null;
  const routeEnds = () => [rd.from, rd.to].map((e) => ({ lat: e.lat, lng: e.lng, counter: !!e.phone }));
  const activeGhat = () => (rd.active ? '📍 পৌঁছানোর ঘাট বাছা আছে। ম্যাপে চাপলে তার জায়গা বসবে।' : '📍 ছাড়ার ঘাট বাছা আছে। ম্যাপে চাপলে তার জায়গা বসবে।');
  function routePage(s, id) {
    const r = id && id !== 'new' ? s.launch.routes.find((x) => x.id === id) : null;
    if (id !== 'new' && !r) return null;
    const key = s.id + '/' + id;
    if (rdKey !== key) {
      const copy = (e) => ({ name: e.name, lat: e.lat, lng: e.lng, phone: e.phone || '' });
      rd = r ? { from: copy(r.from), to: copy(r.to), h: String(Math.floor(r.min / 60)), m: String(r.min % 60), fares: Object.fromEntries(Object.entries(r.fares).map(([k, v]) => [k, v ? String(v) : ''])), active: 0 }
        : { from: { name: s.market || '', lat: s.lat, lng: s.lng, phone: s.phone || '' }, to: { name: '', phone: '' }, h: '', m: '', fares: { single: '', double: '', family: '', vip: '', deck: '' }, active: 1 };
      rdKey = key;
    }
    const v = (x) => U.esc(x === undefined || x === null || x === '' ? '' : U.bn(x));
    const end = (k, i, word, hint) => `<fieldset class="panel ln-end ${rd.active === i ? 'on' : ''}" id="lr-end-${i}"><legend>${word}</legend>
        <label class="field"><span>ঘাটের নাম</span><input type="text" maxlength="60" data-lr="${k}.name" value="${U.esc(rd[k].name || '')}"></label>
        <label class="field"><span>কাউন্টারের ফোন${hint}</span><input type="tel" inputmode="numeric" maxlength="14" data-lr="${k}.phone" value="${U.esc(rd[k].phone || '')}"></label>
        <button type="button" class="inline" data-ln="lr-pin" data-i="${i}">${Number.isFinite(rd[k].lat) ? '✓ ম্যাপে আছে, বদলাতে চাপুন' : '📍 ম্যাপে বসান'}</button></fieldset>`;
    return `<a class="back" href="#/owner/items/routes">‹ সব রুট</a>
      <h1 class="page-h">${r ? 'রুট এডিট করুন' : 'নতুন রুট'}</h1>
      <form id="lroute-form" class="stack" novalidate>
        <div class="row2">${end('from', 0, '⚓ ছাড়ার ঘাট', '')}${end('to', 1, '🏁 পৌঁছানোর ঘাট', ' <i>(ঐচ্ছিক)</i>')}</div>
        <section class="panel">
          <div id="lr-map" class="mini-map rt-map" aria-label="ঘাটের জায়গা বাছার ম্যাপ"></div>
          <p class="meta" id="lr-active" role="status">${activeGhat()}</p>
        </section>
        <section class="panel">
          <h2 class="tight">নদীপথে কত সময়</h2>
          <div class="row2"><label class="field"><span>ঘণ্টা</span><input type="text" inputmode="numeric" maxlength="2" data-lr="h" value="${v(rd.h)}"></label>
            <label class="field"><span>মিনিট</span><input type="text" inputmode="numeric" maxlength="2" data-lr="m" value="${v(rd.m)}"></label></div>
        </section>
        <section class="panel">
          <h2 class="tight">ভাড়া (৳)</h2>
          <p class="meta">যে ধরন নেই, খালি রাখুন। জনপ্রতি বা কেবিনপ্রতি পুরো পথের ভাড়া।</p>
          <div class="ln-fares">${['single', 'double', 'family', 'vip', 'deck'].map((k) => `<label class="field"><span>${ICON[k]} ${classWord(k)}</span><input type="text" inputmode="numeric" maxlength="6" data-lr="fares.${k}" value="${v(rd.fares[k])}"></label>`).join('')}</div>
        </section>
        <small class="err" id="lr-err" role="alert"></small>
        <button type="submit" class="btn block">সংরক্ষণ করুন</button>
      </form>`;
  }
  function routeSave(s) {
    const id = rdKey.split('/')[1];
    const n = (x) => { const t = ascii(x).trim(); return t === '' ? 0 : Number(t); };
    const end = (e) => ({ name: e.name, lat: e.lat, lng: e.lng, phone: ascii(e.phone || '').replace(/[\s-]/g, '') });
    try {
      Store.lnSaveRoute(s.id, id === 'new' ? null : id, { from: end(rd.from), to: end(rd.to), min: n(rd.h) * 60 + n(rd.m), fares: Object.fromEntries(Object.entries(rd.fares).map(([k, x]) => [k, n(x)])) });
      rdKey = '';
      U.toast('রুট সংরক্ষিত');
      location.hash = '#/owner/items/routes';
    } catch (ex) { $('lr-err').textContent = ex.message; }
  }

  // the repeat rules, and a week of trips with the step for each
  const DAYS_WORD = { daily: 'প্রতিদিন', odd: 'বিজোড় তারিখে', even: 'জোড় তারিখে' };
  const WEEK = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহস্পতি', 'শুক্র', 'শনি'];
  const daysText = (d) => (DAYS_WORD[d] || d.map((x) => WEEK[x]).join(', '));
  let ruleDraft = { days: 'daily', week: [] };
  function soldText(s, t) {
    const used = Store.lnUsed(s, t.id);
    const sold = Object.values(used.cabins).filter((x) => x === 'sold').length;
    const all = t.boat.cabins.filter((c) => !c.off).length;
    return `<span>কেবিন বিক্রি</span> ${U.bn(sold)}/${U.bn(all)} · <span>ডেক বিক্রি</span> ${U.bn(used.deck)}/${U.bn(t.boat.deck)}`;
  }
  function tripsTab(s) {
    const l = s.launch;
    const trips = Store.lnTrips(s, Store.today(), Store.LAUNCH_DAYS);
    const boatName = (id) => (l.boats.find((b) => b.id === id) || {}).name || '';
    const routeName = (id) => { const r = l.routes.find((x) => x.id === id); return r ? r.from.name + ' → ' + r.to.name : ''; };
    const byDay = {};
    trips.forEach((t) => { (byDay[t.date] = byDay[t.date] || []).push(t); });
    const myCodes = new Set(Store.data.orders.filter((o) => o.shopId === s.id).map((o) => o.code));
    const texts = Store.data.sms.filter((x) => myCodes.has(x.code)).slice(0, 5);
    return `<h1 class="page-h">ট্রিপের সূচি</h1>
      <p class="meta gap">নিয়ম দিলে সামনের ${U.bn(Store.LAUNCH_DAYS)} দিনের ট্রিপ নিজে থেকে তৈরি হয়। কোনো একটি ট্রিপ দেরি, বাতিল বা ছেড়ে গেছে বলে দিতে পারবেন।</p>
      <section class="panel">
        <h2 class="tight">ট্রিপের নিয়ম</h2>
        ${l.rules.length ? `<ul class="mini ln-rules">${l.rules.map((r) => `<li><span><b>${U.ud(boatName(r.boat))}</b> · ${U.ud(routeName(r.route))}<br><small>🕗 ${clock(new Date('2000-01-01T' + r.time))} · ${daysText(r.days)}</small></span>
          <button type="button" class="btn danger sm" data-ln="rule-del" data-id="${r.id}" aria-label="নিয়ম মুছুন">মুছুন</button></li>`).join('')}</ul>` : '<p class="meta">এখনো কোনো নিয়ম নেই।</p>'}
        ${l.boats.length && l.routes.length ? `<form id="rule-form" class="gap-t" novalidate>
          <h3>+ নতুন নিয়ম</h3>
          <div class="row2">
            <label class="field"><span>লঞ্চ</span><select id="ru-boat">${l.boats.map((b) => `<option value="${b.id}">${U.ud(b.name)}</option>`).join('')}</select></label>
            <label class="field"><span>রুট</span><select id="ru-route">${l.routes.map((r) => `<option value="${r.id}">${U.ud(r.from.name)} → ${U.ud(r.to.name)}</option>`).join('')}</select></label>
          </div>
          <div class="row2">
            <label class="field"><span>ছাড়ার সময়</span><input id="ru-time" type="time" value="20:00"></label>
            <label class="field"><span>কোন দিন চলবে</span><select id="ru-days" data-ln-days>${['daily', 'odd', 'even'].map((d) => `<option value="${d}" ${ruleDraft.days === d ? 'selected' : ''}>${DAYS_WORD[d]}</option>`).join('')}<option value="week" ${ruleDraft.days === 'week' ? 'selected' : ''}>সপ্তাহের নির্দিষ্ট দিনে</option></select></label>
          </div>
          ${ruleDraft.days === 'week' ? `<div class="vehicles ln-week">${[6, 0, 1, 2, 3, 4, 5].map((d) => `<label class="radio-pill"><input type="checkbox" data-ln-week value="${d}" ${ruleDraft.week.includes(d) ? 'checked' : ''}><span>${WEEK[d]}</span></label>`).join('')}</div>` : ''}
          <small class="err" id="ru-err" role="alert"></small>
          <button type="submit" class="btn ghost block">নিয়ম যোগ করুন</button>
        </form>` : '<p class="note gap-t">নিয়ম দিতে আগে লঞ্চ ও রুট দিন।</p>'}
      </section>
      ${Object.keys(byDay).map((d) => `<h2 class="gap-t">${dayText(new Date(d + 'T12:00'))}</h2><div class="stack">${byDay[d].map((t) => `<article class="panel ln-trow">
        <div class="o-head"><div><b>🕗 ${clock(t.dep)} · ${U.ud(t.boat.name)}</b><small>${U.ud(t.route.from.name)} → ${U.ud(t.route.to.name)}</small></div>${statusTag(t)}</div>
        <p class="meta">${soldText(s, t)}</p>
        ${tripNote(t)}
        <div class="o-acts"><a class="btn sm" href="#/owner/counter/${t.id}">🎫 কাউন্টার</a>
          ${t.status === 'off' ? '' : `${t.status === 'late' ? `<button type="button" class="btn ghost sm" data-ln="trip-on" data-id="${t.id}">✓ সময়মতো</button>` : ''}
          ${t.status !== 'gone' ? `<button type="button" class="btn ghost sm" data-ln="trip-late" data-id="${t.id}">⏰ দেরি</button><button type="button" class="btn ghost sm" data-ln="trip-gone" data-id="${t.id}">⛴️ ছেড়ে গেছে</button>` : ''}
          <button type="button" class="btn ghost sm danger-txt" data-ln="trip-off" data-id="${t.id}">🚫 বাতিল</button>`}</div>
      </article>`).join('')}</div>`).join('') || '<div class="empty gap-t"><span aria-hidden="true">📅</span><h3>সামনে কোনো ট্রিপ নেই</h3></div>'}
      ${texts.length ? `<section class="panel gap-t"><h2 class="tight">📩 যাত্রীদের পাঠানো SMS (ডেমো)</h2><ul class="mini">${texts.map((x) => `<li><span><span translate="no">${U.bn(x.to)}</span><br><small>${U.ud(x.text)}</small></span><b>${U.fmtTime(x.at)}</b></li>`).join('')}</ul><p class="meta">প্রোটোটাইপে আসল SMS যায় না, এখানে লেখা থাকে।</p></section>` : ''}`;
  }
  function lateSheet(id) {
    const s = ownShop();
    const t = Store.lnTrip(s, id);
    const at = new Date(t.dep.getTime() + 60 * 6e4);
    const local = ymd(at) + 'T' + String(at.getHours()).padStart(2, '0') + ':' + String(at.getMinutes()).padStart(2, '0');
    U.openSheet(`<h2 id="sheet-h">ট্রিপ দেরিতে ছাড়বে</h2>
      <p class="meta">${U.ud(t.boat.name)} · ${U.ud(t.route.from.name)} → ${U.ud(t.route.to.name)} · <span>আগের সময়</span> ${clock(t.dep0)}</p>
      <form id="late-form" data-id="${id}" novalidate>
        <label class="field"><span>নতুন ছাড়ার সময়</span><input id="lt-at" type="datetime-local" value="${local}"></label>
        <label class="field"><span>কারণ <i>(ঐচ্ছিক)</i></span><input id="lt-why" type="text" maxlength="120" placeholder="যেমন: কুয়াশা"></label>
        <p class="meta">টিকেট আছে এমন সব যাত্রী নোটিফিকেশন ও SMS পাবেন।</p>
        <small class="err" id="lt-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">সবাইকে জানিয়ে দিন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">না, থাক</button>`);
  }
  function offSheet(id) {
    const s = ownShop();
    const t = Store.lnTrip(s, id);
    const n = Store.lnTickets(s, id).filter((o) => o.status === 'confirmed').length;
    U.openSheet(`<h2 id="sheet-h">ট্রিপ বাতিল করবেন?</h2>
      <p>${U.ud(t.boat.name)} · ${dayText(t.dep0)}, ${clock(t.dep0)}</p>
      <p><span>যত টিকেট বাতিল হবে</span>: <b>${U.bn(n)}</b></p>
      <p class="note">সবাই পুরো টাকা ফেরত পাবেন। অনলাইনের টাকা লোকালহাট ফেরত দেবে, কাউন্টারের নগদ আপনি ফেরত দেবেন।</p>
      <form id="off-form" data-id="${id}" novalidate>
        <label class="field"><span>বাতিলের কারণ (যাত্রীরা দেখবেন)</span><input id="off-why" type="text" maxlength="120" placeholder="যেমন: আবহাওয়া খারাপ, ৩ নম্বর সংকেত"></label>
        <small class="err" id="off-err" role="alert"></small>
        <button type="submit" class="btn block danger-fill">ট্রিপ বাতিল করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">না, থাক</button>`);
  }
  function rulesTab(s) {
    const l = s.launch;
    const t = l.refund;
    const v = (x) => U.esc(U.bn(x));
    return `<h1 class="page-h">নিয়ম</h1>
      <form id="lset-form" class="stack" novalidate>
        <section class="panel">
          <h2 class="tight">📞 ফোনে হোল্ড</h2>
          <p class="meta">কেউ ফোনে কেবিন রাখতে বললে কতক্ষণ রাখবেন। কাউন্টারে নগদ দিলে টিকেট হবে, না দিলে সময় শেষে কেবিন আবার খালি।</p>
          <div class="row2">
            <label class="field"><span>কত ঘণ্টা রাখবেন</span><input id="ls-hours" type="text" inputmode="numeric" maxlength="2" value="${v(l.hold.hours)}"></label>
            <label class="field"><span>ছাড়ার কত মিনিট আগে শেষ</span><input id="ls-before" type="text" inputmode="numeric" maxlength="3" value="${v(l.hold.before)}"></label>
          </div>
        </section>
        <section class="panel">
          <h2 class="tight">↩️ টিকেট ফেরত দিলে কত টাকা ফেরত</h2>
          <div class="row2"><label class="field"><span>ছাড়ার কত ঘণ্টা বা তার বেশি আগে</span><input id="ls-h1" type="text" inputmode="numeric" maxlength="3" value="${v(t[0] ? t[0].hours : 24)}"></label>
            <label class="field"><span>কত শতাংশ ফেরত</span><input id="ls-p1" type="text" inputmode="numeric" maxlength="3" value="${v(t[0] ? t[0].pct : 90)}"></label></div>
          <div class="row2"><label class="field"><span>তার পরে, ছাড়ার কত ঘণ্টা বা তার বেশি আগে</span><input id="ls-h2" type="text" inputmode="numeric" maxlength="3" value="${v(t[1] ? t[1].hours : 6)}"></label>
            <label class="field"><span>কত শতাংশ ফেরত</span><input id="ls-p2" type="text" inputmode="numeric" maxlength="3" value="${v(t[1] ? t[1].pct : 50)}"></label></div>
          <p class="meta">তার পরে কিছু ফেরত নেই। লঞ্চ কর্তৃপক্ষ ট্রিপ বাতিল করলে সবাই পুরো টাকা পান। কেটে রাখা টাকা আপনার, তার ${U.bn(Store.KEEP_SHARE)}% লোকালহাটের।</p>
        </section>
        <small class="err" id="ls-err" role="alert"></small>
        <button type="submit" class="btn block">সংরক্ষণ করুন</button>
      </form>`;
  }

  /* ---------- the counter: today's trips, a cash sale, a phone hold, and boarding ---------- */
  let ck = { key: '', cabins: [], deck: 0, floor: 0, name: '', phone: '' };
  function counterHome(s) {
    const today = Store.today();
    const now = new Date();
    // yesterday's night launch is still on the river this morning
    const trips = Store.lnTrips(s, addDays(today, -1), Store.LAUNCH_DAYS + 1).filter((t) => t.date >= today || t.arr > now);
    const mine = Store.data.orders.filter((o) => o.book === 'launch' && o.shopId === s.id && o.status !== 'cancelled' && ymd(new Date(o.createdAt)) === today);
    const cash = mine.filter((o) => o.launch.channel !== 'app');
    const app = mine.filter((o) => o.launch.channel === 'app');
    return `<h1 class="page-h">কাউন্টার</h1>
      <div class="stats">
        <div><b>${U.bn(cash.length)}</b><span>আজ কাউন্টারে টিকেট</span></div>
        <div><b>${U.tk(cash.reduce((a, o) => a + o.total, 0))}</b><span>আজকের নগদ</span></div>
        <div><b>${U.bn(app.length)}</b><span>আজ অ্যাপে টিকেট</span></div>
      </div>
      ${netLine()}
      <p class="meta gap">ট্রিপ বেছে নিন: কেবিন বিক্রি, ফোনে হোল্ড, বা যাত্রী ওঠানো।</p>
      ${trips.length ? `<div class="stack">${trips.map((t) => `<a class="panel ln-next" href="#/owner/counter/${t.id}"><span><b>${dayText(t.dep)}, ${clock(t.dep)} · ${U.ud(t.boat.name)}</b><small>${U.ud(t.route.from.name)} → ${U.ud(t.route.to.name)}</small><small>${soldText(s, t)}</small></span>${statusTag(t)}</a>`).join('')}</div>`
    : '<div class="empty"><span aria-hidden="true">📅</span><h3>সামনে কোনো ট্রিপ নেই</h3><p>লঞ্চ ট্যাবে লঞ্চ, রুট ও ট্রিপের নিয়ম দিন।</p></div>'}`;
  }
  const queued = () => Store.data.boardQueue.length;
  const netLine = () => `<p class="net-line ${navigator.onLine ? 'on' : 'off'}" role="status">${navigator.onLine ? '🟢 নেট আছে' : '🔴 নেট নেই: যাত্রী ওঠানো চলবে, নেট ফিরলে পাঠানো হবে'}${queued() ? ` · <span>পাঠানো বাকি</span> <b>${U.bn(queued())}</b> <button type="button" class="btn ghost sm" data-ln="sync">🔄 সিঙ্ক করুন</button>` : ''}</p>`;
  function counterTrip(s, tripId, view) {
    const t = Store.lnTrip(s, tripId);
    if (!t) return null;
    if (ck.key !== t.id) ck = { key: t.id, cabins: [], deck: 0, floor: 0, name: '', phone: '' };
    const seg = `<nav class="seg" aria-label="কাউন্টার"><a class="${view === 'sell' ? 'on' : ''}" href="#/owner/counter/${t.id}">💵 বিক্রি</a><a class="${view === 'pass' ? 'on' : ''}" href="#/owner/counter/${t.id}/pass">🧾 যাত্রী</a></nav>`;
    const head = `<a class="back" href="#/owner/counter">‹ সব ট্রিপ</a>
      <h1 class="page-h">${U.ud(t.boat.name)}</h1>
      <p class="meta">${U.ud(t.route.from.name)} → ${U.ud(t.route.to.name)} · ${whenHtml(t.dep, t.arr)} ${statusTag(t)}</p>
      ${tripNote(t)}${seg}`;
    return head + (view === 'pass' ? passPage(s, t) : view === 'sell' ? sellPage(s, t) : '');
  }
  function sellPage(s, t) {
    if (!sellable(t)) return '<div class="empty"><span aria-hidden="true">🛳️</span><h3>এই ট্রিপে আর টিকেট বিক্রি হবে না</h3><p>যাত্রী ট্যাবে যাত্রীদের দেখুন।</p></div>';
    const used = Store.lnUsed(s, t.id);
    ck.cabins = ck.cabins.filter((no) => !used.cabins[no]);
    const free = Store.lnFree(s, t);
    const floor = Math.min(ck.floor, Math.max(0, t.boat.floors.length - 1));
    const holds = Store.lnHolds(s, t.id).filter((h) => h.kind === 'phone');
    const b = billOf(t, ck.cabins, ck.deck);
    return `<form id="sell-form" class="two" data-trip="${t.id}" novalidate>
        <div class="stack">
          <section class="panel">${classesHtml(t, free)}</section>
          <section class="panel">
            <h2 class="tight">কেবিন</h2>
            ${floorTabs(t, floor, 'counter')}
            ${cabinMap(t, used, ck.cabins, 'counter', floor)}
            ${legendHtml('counter')}
          </section>
          ${classesOf(t).includes('deck') ? `<section class="panel"><h2 class="tight">ডেক</h2><p class="meta"><span>খালি</span>: <span>${U.bn(free.deck)}</span> <span>জনের জায়গা</span></p>${stepper(ck.deck, free.deck, 'counter')}</section>` : ''}
          ${holds.length ? `<section class="panel"><h2 class="tight">📞 ফোনে রাখা</h2><div class="stack">${holds.map(holdRow).join('')}</div></section>` : ''}
        </div>
        <aside class="panel bill">
          <h2 class="tight">যাত্রী <i>(ঐচ্ছিক)</i></h2>
          <label class="field"><span>নাম</span><input id="ck-name" data-ck="name" type="text" maxlength="60" value="${U.esc(ck.name)}"></label>
          <label class="field"><span>মোবাইল নম্বর</span><input id="ck-phone" data-ck="phone" type="tel" inputmode="numeric" placeholder="01XXXXXXXXX" value="${U.esc(ck.phone)}"><small>ফোনে হোল্ডের জন্য নাম ও নম্বর লাগবে।</small></label>
          <div id="ln-bill">${billHtml(b)}</div>
          <small class="err" id="ck-err" role="alert"></small>
          <button type="button" class="btn block big-btn" data-ln="sell">💵 নগদ বিক্রি</button>
          <button type="button" class="btn ghost block big-btn" data-ln="phone-hold">📞 ফোনে হোল্ড</button>
          <p class="meta"><span>ফোনে হোল্ড</span>: ${U.bn(s.launch.hold.hours)} <span>ঘণ্টা</span> · <span>লঞ্চ ছাড়ার</span> ${U.bn(s.launch.hold.before)} <span>মিনিট আগে শেষ</span></p>
        </aside>
      </form>`;
  }
  const holdRow = (h) => `<div class="ln-hold" id="hold-${h.id}"><span><b>${U.ud(h.name)}</b> · <a href="tel:${U.esc(h.phone)}">${U.bn(h.phone)}</a><br><small>${h.cabins.length ? `<span>কেবিন</span> <span translate="no">${h.cabins.map((x) => U.bn(x)).join(', ')}</span>` : ''}${h.deck ? `${h.cabins.length ? ' · ' : ''}<span>ডেক</span> ${U.bn(h.deck)} <span>জন</span>` : ''} · <span>হোল্ড শেষ</span> ${clock(new Date(h.until))}</small></span>
      <span class="o-acts"><button type="button" class="btn sm" data-ln="hold-sell" data-id="${h.id}">💵 নগদ নিয়ে বিক্রি</button><button type="button" class="btn ghost sm" data-ln="hold-drop" data-id="${h.id}">✕ ছেড়ে দিন</button></span></div>`;
  function soldSheet(o) {
    U.openSheet(`<h2 id="sheet-h">✓ টিকেট বিক্রি হয়েছে</h2>
      <div class="ln-print">${ticketBody(o)}${codeBlock(o)}<div class="sum total"><span>নগদ নেওয়া হয়েছে</span><b>${U.tk(o.total)}</b></div></div>
      <button type="button" class="btn block sheet-go" data-ln="print">🖨️ প্রিন্ট করুন</button>
      <button type="button" class="link" data-action="close-sheet">পরের বিক্রি</button>`);
  }
  const CHANNEL = { app: '📱 অ্যাপ', counter: '💵 কাউন্টার', phone: '📞 ফোন হোল্ড' };
  function passRow(o) {
    const L = o.launch;
    const waiting = L.boarded && o.status === 'confirmed';
    const what = [L.cabins.length ? `<span>কেবিন</span> <b translate="no">${L.cabins.map((c) => U.bn(c.no)).join(', ')}</b>` : '', L.deck ? `<span>ডেক</span> <b>${U.bn(L.deck)}</b> <span>জন</span>` : ''].filter(Boolean).join(' · ');
    return `<div class="pass ln-pass ${o.status}" id="ps-${o.code}">
      <span>${what}<br><small>${U.ud(o.recipient.name)}${o.recipient.phone ? ` · <a href="tel:${U.esc(o.recipient.phone)}">${U.bn(o.recipient.phone)}</a>` : ''} · <span>${CHANNEL[L.channel] || ''}</span> · ${o.paid ? '<span>অনলাইনে দেওয়া</span>' : '<span>নগদ দেওয়া</span>'}</small></span>
      ${o.status === 'cancelled' ? '<span class="tag bad">বাতিল হয়েছে</span>' : o.status === 'completed' ? '<span class="tag ok">✓ উঠেছেন</span>' : waiting ? '<span class="tag warn">✓ উঠেছেন · পাঠানো বাকি</span>'
    : `<span class="o-acts"><button type="button" class="btn sm" data-ln="board" data-code="${o.code}">উঠেছেন</button>${new Date(L.dep) > new Date() ? `<button type="button" class="btn ghost sm" data-ln="return-ask" data-code="${o.code}">↩️ ফেরত</button>` : ''}</span>`}</div>`;
  }
  function passPage(s, t) {
    const list = Store.data.orders.filter((o) => o.book === 'launch' && o.shopId === s.id && o.launch.trip === t.id);
    const live = list.filter((o) => o.status !== 'cancelled');
    const on = live.filter((o) => o.status === 'completed' || o.launch.boarded);
    const order = (o) => (o.status === 'cancelled' ? 3 : o.status === 'completed' || o.launch.boarded ? 2 : 1);
    return `${netLine()}
      <form id="board-form" class="panel" data-trip="${t.id}" novalidate>
        <h2 class="tight">যাত্রী ওঠান</h2>
        <div class="board-row"><input id="bd-code" type="text" inputmode="numeric" maxlength="40" autocomplete="off" aria-label="টিকেটের ৪ সংখ্যার কোড" placeholder="টিকেটের কোড"><button type="submit" class="btn">উঠেছেন</button></div>
        <button type="button" class="btn ghost block" data-ln="scan">📷 QR স্ক্যান করুন</button>
        <small class="err" id="bd-err" role="alert"></small>
        <div id="bd-pick"></div>
      </form>
      <p class="meta gap-t"><span>উঠেছেন</span> ${U.bn(on.length)}/${U.bn(live.length)} <span>টি টিকেট</span></p>
      ${list.length ? `<div class="panel">${list.slice().sort((a, b) => order(a) - order(b)).map(passRow).join('')}</div>` : '<div class="empty"><span aria-hidden="true">🧾</span><h3>এই ট্রিপে এখনো কোনো টিকেট নেই</h3></div>'}`;
  }
  // a typed code or a QR code: one ticket boards at once; two tickets with the same code ask which
  function boardBy(s, tripId, text) {
    const err = $('bd-err');
    if (err) err.textContent = '';
    const list = Store.lnFindTicket(s.id, tripId, ascii(text));
    if (!list.length) { if (err) err.textContent = 'এই কোডে এই ট্রিপের কোনো টিকেট নেই'; else U.toast('এই কোডে এই ট্রিপের কোনো টিকেট নেই'); return; }
    if (list.length > 1) {
      $('bd-pick').innerHTML = `<p class="meta">একই কোডে ${U.bn(list.length)}টি টিকেট, যাত্রীর নাম মিলিয়ে বাছুন:</p>${list.map(passRow).join('')}`;
      return;
    }
    board(s, list[0].code);
  }
  function board(s, code) {
    const offline = !navigator.onLine;
    try {
      Store.lnBoard(s.id, code, offline);
      U.toast(offline ? 'উঠেছেন। নেট ফিরলে পাঠানো হবে।' : 'যাত্রী উঠেছেন');
      U.route(true);
    } catch (ex) {
      const err = $('bd-err');
      if (err) err.textContent = ex.message; else U.toast(ex.message);
    }
  }
  function returnSheet(code) {
    const o = Store.data.orders.find((x) => x.code === code);
    const q = Store.lnRefund(o);
    U.openSheet(`<h2 id="sheet-h">টিকেট ফেরত নেবেন?</h2>
      <p>${U.ud(o.recipient.name)} · ${U.tk(o.total)}</p>
      <p class="note">${o.paid ? `<span>অনলাইনে দেওয়া টাকা লোকালহাট ফেরত দেবে</span>: <b>${U.tk(q.back)}</b>` : `<span>যাত্রীকে নগদ ফেরত দিন</span>: <b>${U.tk(q.back)}</b>`} (${U.bn(q.pct)}%)${q.keep ? ` · <span>কেটে রাখা</span> ${U.tk(q.keep)}` : ''}</p>
      <button type="button" class="btn block" data-ln="return-yes" data-code="${code}">হ্যাঁ, ফেরত নিন</button>
      <button type="button" class="link" data-action="close-sheet">না, থাক</button>`);
  }
  // Camera scanning with the browser's own barcode reader, where the browser has one. Typing the code always works.
  let scan = null;
  function stopScan() {
    if (!scan) return;
    clearInterval(scan.timer);
    if (scan.stream) scan.stream.getTracks().forEach((x) => x.stop());
    scan = null;
  }
  async function startScan(s, tripId) {
    stopScan();
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices) {
      U.toast('এই ব্রাউজারে ক্যামেরা দিয়ে স্ক্যান হয় না, কোড টাইপ করুন');
      return;
    }
    U.openSheet(`<h2 id="sheet-h">QR স্ক্যান</h2><video id="scan-video" class="scan-video" playsinline muted></video><p class="meta" id="scan-msg" role="status">ক্যামেরা চালু হচ্ছে…</p>
      <button type="button" class="link" data-action="close-sheet">বন্ধ করুন</button>`);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = $('scan-video');
      if (!video) { stream.getTracks().forEach((x) => x.stop()); return; }
      video.srcObject = stream;
      await video.play();
      const reader = new window.BarcodeDetector({ formats: ['qr_code'] });
      scan = { stream, timer: 0 };
      $('scan-msg').textContent = 'টিকেটের QR কোড ক্যামেরার সামনে ধরুন';
      scan.timer = setInterval(async () => {
        const v = $('scan-video');
        if (!v) { stopScan(); return; }
        try {
          const found = await reader.detect(v);
          if (found.length) {
            stopScan();
            document.querySelector('[data-action=close-sheet]').click();
            boardBy(s, tripId, found[0].rawValue);
          }
        } catch (e) { /* a frame that cannot be read yet */ }
      }, 300);
    } catch (e) {
      const m = $('scan-msg');
      if (m) m.textContent = 'ক্যামেরা চালু করা যায়নি। অনুমতি দিন বা কোড টাইপ করুন।';
    }
  }

  /* ---------- the team and the reports ---------- */
  // the trips launch counters cancelled, newest first, with how many tickets were paid back
  function adminTrips() {
    const rows = [];
    Store.data.shops.filter((s) => s.launch && window.LHArea.inPick(s)).forEach((s) => Object.entries(s.launch.trips).forEach(([id, set]) => {
      if (set.status !== 'off') return;
      const t = Store.lnTrip(s, id);
      const n = Store.data.orders.filter((o) => o.book === 'launch' && o.shopId === s.id && o.launch.trip === id && o.status === 'cancelled').length;
      rows.push({ s, t, set, n });
    }));
    if (!rows.length) return '';
    rows.sort((a, b) => b.set.at.localeCompare(a.set.at));
    return `<h2 class="gap-t">🚫 বাতিল হওয়া লঞ্চ ট্রিপ</h2><div class="stack">${rows.map((r) => `<article class="panel ad-row">
      <div class="o-head"><div><b>${U.ud(r.s.name)}</b><small>${r.t ? `${U.ud(r.t.boat.name)} · ${U.ud(r.t.route.from.name)} → ${U.ud(r.t.route.to.name)} · ${dayText(r.t.dep0)}, ${clock(r.t.dep0)}` : ''}</small></div><span class="tag bad">বাতিল হয়েছে</span></div>
      <p class="meta"><span>কারণ</span>: ${U.ud(r.set.note)} · <span>${U.bn(r.n)}</span><span>টি টিকেটে পুরো টাকা ফেরত</span></p></article>`).join('')}</div>`;
  }
  // an agent's month of tickets by how they were sold
  function channelHtml(shopId, month) {
    const c = Store.lnChannels(shopId, month);
    return `<section class="panel gap-t"><h2 class="tight">🎫 টিকেট কোথায় বিক্রি হয়েছে</h2>
      ${['app', 'counter', 'phone'].map((k) => `<div class="sum"><span><span>${CHANNEL[k]}</span> · <span>${U.bn(c[k].n)}</span><span>টি টিকেট</span></span><b>${U.tk(c[k].tk)}</b></div>`).join('')}
      <p class="meta">অ্যাপের টাকা লোকালহাটের কাছে আসে, কাউন্টারের নগদ আপনার কাছে থাকে। টিকেট গোনা হয় লঞ্চ ছাড়ার দিনে।</p></section>`;
  }

  /* ---------- events ---------- */
  function onClick(e) {
    const el = e.target.closest('[data-ln]');
    if (!el) return;
    const d = el.dataset;
    const s = ownShop();
    try {
      switch (d.ln) {
        case 'day': lq.date = d.day; U.route(true); break;
        case 'floor':
          if (d.side === 'user') pk.floor = Number(d.i); else if (d.side === 'edit') editFloor = Number(d.i); else ck.floor = Number(d.i);
          U.route(true);
          break;
        case 'cab': {
          const no = d.no;
          if (location.hash.startsWith('#/owner/boat/')) { cabinSheet(s, location.hash.split('/')[3], no); break; }
          const st = el.className.match(/cab-(\w+)/)[1];
          const box = location.hash.startsWith('#/launch/') ? pk : ck;
          if (st === 'phone') { const h = document.querySelector(`.ln-hold [data-ln=hold-sell]`); if (h) h.closest('.ln-hold').scrollIntoView({ block: 'center' }); U.toast('এই কেবিন ফোনে রাখা আছে, নিচে হোল্ড দেখুন'); break; }
          if (box.cabins.includes(no)) box.cabins = box.cabins.filter((x) => x !== no);
          else if (box.cabins.length >= 6) { U.toast('একবারে ৬টির বেশি কেবিন নেওয়া যাবে না'); break; } else box.cabins.push(no);
          U.route(true);
          break;
        }
        case 'deck': { const box = d.side === 'user' ? pk : ck; box.deck = Math.max(0, Math.min(20, box.deck + Number(d.by))); U.route(true); break; }
        case 'cancel-ask': cancelSheet(d.code); break;
        case 'cancel-yes': Store.cancel(d.code, 'customer', 'গ্রাহক টিকেট বাতিল করেছেন'); U.closeSheet(); U.toast('টিকেট বাতিল হয়েছে'); U.route(true); break;
        case 'boat-del': Store.lnDeleteBoat(s.id, d.id); U.toast('লঞ্চ মুছে ফেলা হয়েছে'); U.route(true); break;
        case 'route-del': Store.lnDeleteRoute(s.id, d.id); U.toast('রুট মুছে ফেলা হয়েছে'); U.route(true); break;
        case 'rule-del': Store.lnDeleteRule(s.id, d.id); U.toast('নিয়ম মুছে ফেলা হয়েছে'); U.route(true); break;
        case 'floor-add': bd.floors.push(blankFloor(bd.floors.length)); U.route(true); break;
        case 'floor-del': bd.floors.splice(Number(d.i), 1); U.route(true); break;
        case 'lr-pin':
          rd.active = Number(d.i);
          document.querySelectorAll('.ln-end').forEach((x, i) => x.classList.toggle('on', i === rd.active));
          $('lr-active').textContent = activeGhat();
          if (rdMap) rdMap.draw(routeEnds(), rd.active);
          break;
        case 'trip-late': lateSheet(d.id); break;
        case 'trip-off': offSheet(d.id); break;
        case 'trip-on': Store.lnSetTrip(s.id, d.id, 'on'); U.toast('ট্রিপ সময়মতো ছাড়বে'); U.route(true); break;
        case 'trip-gone': Store.lnSetTrip(s.id, d.id, 'gone'); U.toast('লঞ্চ ছেড়ে গেছে'); U.route(true); break;
        case 'sell': {
          const o = Store.lnSell(s.id, { trip: ck.key, cabins: ck.cabins, deck: ck.deck, name: ck.name, phone: ascii(ck.phone) });
          ck = { key: ck.key, cabins: [], deck: 0, floor: ck.floor, name: '', phone: '' };
          U.route(true);
          soldSheet(o);
          break;
        }
        case 'phone-hold':
          Store.lnPhoneHold(s.id, { trip: ck.key, cabins: ck.cabins, deck: ck.deck, name: ck.name, phone: ascii(ck.phone) });
          ck = { key: ck.key, cabins: [], deck: 0, floor: ck.floor, name: '', phone: '' };
          U.toast('ফোনে হোল্ড রাখা হলো');
          U.route(true);
          break;
        case 'hold-sell': { const o = Store.lnSell(s.id, { trip: ck.key, hold: d.id }); U.route(true); soldSheet(o); break; }
        case 'hold-drop': Store.lnHoldDrop(s.id, d.id); U.toast('হোল্ড ছেড়ে দেওয়া হলো'); U.route(true); break;
        case 'print': window.print(); break;
        case 'board': board(s, d.code); break;
        case 'scan': startScan(s, location.hash.split('/')[3]); break;
        case 'sync': { const n = Store.lnSync(); U.toast(`${U.bn(n)}টি ওঠানো পাঠানো হলো`); U.route(true); break; }
        case 'return-ask': returnSheet(d.code); break;
        case 'return-yes': Store.lnReturn(s.id, d.code); U.closeSheet(); U.toast('টিকেট ফেরত নেওয়া হয়েছে'); U.route(true); break;
      }
    } catch (ex) {
      const box = ['sell', 'phone-hold', 'hold-sell'].includes(d.ln) ? $('ck-err') : null;
      if (box) box.textContent = ex.message; else U.toast(ex.message);
    }
  }
  function onInput(e) {
    const t = e.target;
    const dt = t.dataset || {};
    if (dt.lp) { pk[dt.lp] = t.value; return; }
    if (dt.ck) { ck[dt.ck] = t.value; return; }
    if (dt.lb && bd) { bd[dt.lb] = t.value; const x = $('lb-sum'); if (x) x.innerHTML = boatSum(); return; }
    if (dt.lf && bd) { bd.floors[Number(dt.i)][dt.lf] = t.value; const x = $('lb-sum'); if (x) x.innerHTML = boatSum(); return; }
    if (dt.lr && rd) {
      const [a, b] = dt.lr.split('.');
      if (b) rd[a][b] = t.value; else rd[a] = t.value;
      if (b === 'phone' && rdMap) rdMap.draw(routeEnds(), rd.active);
    }
  }
  function onChange(e) {
    const t = e.target;
    if (t.matches('[data-ln-days]')) { ruleDraft.days = t.value; U.route(true); return; }
    if (t.matches('[data-ln-week]')) { const d = Number(t.value); ruleDraft.week = t.checked ? ruleDraft.week.concat(d) : ruleDraft.week.filter((x) => x !== d); }
  }
  function onSubmit(e) {
    const f = e.target;
    const s = ownShop();
    const err = (id, ex) => { const b = $(id); if (b) b.textContent = ex.message; };
    if (f.id === 'ln-find') { e.preventDefault(); lq.from = $('lf-from').value; lq.to = $('lf-to').value; U.route(true); return; }
    if (f.id === 'ln-buy') { e.preventDefault(); submitBuy(f); return; }
    if (f.id === 'boat-form') { e.preventDefault(); boatSave(s); return; }
    if (f.id === 'lroute-form') { e.preventDefault(); routeSave(s); return; }
    if (f.id === 'board-form') { e.preventDefault(); boardBy(s, f.dataset.trip, $('bd-code').value); return; }
    if (f.id === 'cabin-form') {
      e.preventDefault();
      try {
        const type = (f.querySelector('input[name=cb-type]:checked') || {}).value;
        Store.lnSaveCabin(s.id, f.dataset.boat, f.dataset.no, { no: ascii($('cb-no').value), type, off: $('cb-off').checked });
        U.closeSheet();
        U.toast('কেবিন সংরক্ষিত');
        U.route(true);
      } catch (ex) { err('cb-err', ex); }
      return;
    }
    if (f.id === 'rule-form') {
      e.preventDefault();
      try {
        Store.lnSaveRule(s.id, { boat: $('ru-boat').value, route: $('ru-route').value, time: ascii($('ru-time').value), days: ruleDraft.days === 'week' ? ruleDraft.week : ruleDraft.days });
        ruleDraft = { days: 'daily', week: [] };
        U.toast('নিয়ম যোগ হয়েছে, ট্রিপ তৈরি হয়েছে');
        U.route(true);
      } catch (ex) { err('ru-err', ex); }
      return;
    }
    if (f.id === 'late-form') {
      e.preventDefault();
      try {
        const n = Store.lnSetTrip(s.id, f.dataset.id, 'late', $('lt-at').value, $('lt-why').value);
        U.closeSheet();
        U.toast(`${U.bn(n)} জন যাত্রীকে জানানো হয়েছে`);
        U.route(true);
      } catch (ex) { err('lt-err', ex); }
      return;
    }
    if (f.id === 'off-form') {
      e.preventDefault();
      try {
        const n = Store.lnSetTrip(s.id, f.dataset.id, 'off', null, $('off-why').value);
        U.closeSheet();
        U.toast(`ট্রিপ বাতিল, ${U.bn(n)}টি টিকেটে টাকা ফেরত যাবে`);
        U.route(true);
      } catch (ex) { err('off-err', ex); }
      return;
    }
    if (f.id === 'lset-form') {
      e.preventDefault();
      const n = (id) => num($(id).value);
      try {
        Store.lnSettings(s.id, { hours: n('ls-hours'), before: n('ls-before'), refund: [{ hours: n('ls-h1'), pct: n('ls-p1') }, { hours: n('ls-h2'), pct: n('ls-p2') }] });
        U.toast('নিয়ম সংরক্ষিত');
        U.route(true);
      } catch (ex) { err('ls-err', ex); }
    }
  }
  function mount() {
    if (!document.getElementById('scan-video')) stopScan();
    document.querySelectorAll('[data-river]').forEach((el) => {
      const [sid, rid] = el.dataset.river.split('/');
      const s = Store.shopById(sid);
      const r = s && s.launch && s.launch.routes.find((x) => x.id === rid);
      if (r) window.LHMap.river(el, r);
    });
    const el = $('lr-map');
    rdMap = null;
    if (!el || !rd) return;
    rdMap = window.LHMap.routeEdit(el, (lat, lng) => {
      const e = rd.active ? rd.to : rd.from;
      e.lat = lat; e.lng = lng;
      const b = document.querySelector(`#lr-end-${rd.active} [data-ln=lr-pin]`);
      if (b) b.textContent = '✓ ম্যাপে আছে, বদলাতে চাপুন';
      rdMap.draw(routeEnds(), rd.active);
    });
    rdMap.draw(routeEnds(), rd.active);
  }
  function init(ui) {
    U = ui;
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    document.addEventListener('submit', onSubmit);
    // the network is back: the boardings made without it go now
    window.addEventListener('online', () => {
      if (!Store.data.boardQueue.length) return;
      const n = Store.lnSync();
      U.toast(`নেট ফিরেছে, ${U.bn(n)}টি ওঠানো পাঠানো হলো`);
      if (location.hash.startsWith('#/owner/counter')) U.route(true);
    });
    window.addEventListener('offline', () => { if (location.hash.startsWith('#/owner/counter')) U.route(true); });
    window.addEventListener('hashchange', stopScan);
  }
  return { init, mount, searchPage, tripPage, ticketPanel, shopHtml, ownerTabs, ownerPage, adminTrips, channelHtml, qrSvg };
})();

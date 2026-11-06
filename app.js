(function () {
  'use strict';
  const Store = window.LHStore;
  const Map_ = window.LHMap;
  const { cats } = window.LH;
  window.LH_TITLE = 'লোকালহাট - আপনার এলাকার দোকান, অনলাইনে';
  const $ = (id) => document.getElementById(id);
  const DIGITS = '০১২৩৪৫৬৭৮৯';
  const bn = (n) => String(n).replace(/\d/g, (d) => DIGITS[d]);
  const tk = (n) => '৳' + bn(n);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const NEAR_KM = 25;
  const Book = window.LHBook;
  const Rate = window.LHRate;
  const Care = window.LHCare;
  const keep = (s) => window.LHI18n.keep(s);
  // what shops and customers wrote; the translator leaves it alone
  const ud = (s) => keep(esc(s));
  // district, upazila and thana names follow the language; a name the list does not know stays as written
  const geo = (n) => keep(esc(window.LHI18n.geoText(n)));
  // an area picked in the search is named by the app; a saved address is the user's own words
  const placeName = (p) => (p.custom && p.label === p.area ? geo(p.area) : ud(p.label));
  const placeLine = (p) => (p.custom && p.line === p.area + ', ' + p.zila ? geo(p.area) + ', ' + geo(p.zila) : ud(p.line));

  // Screen state that does not need saving
  const S = { q: '', cat: null, sub: null, filter: 'all', mapCat: null, mapSub: null, mapSel: null, mapView: 'map', gps: null, co: {}, after: null };
  // "View as customer" from the agent or admin panel: the customer's pages, nothing personal, and a way back. Kept for this tab only.
  const VIEW_KEY = 'lh-view-as';
  try { S.viewAs = JSON.parse(sessionStorage.getItem(VIEW_KEY) || 'null'); } catch (e) { S.viewAs = null; }
  function setView(v) {
    S.viewAs = v;
    try { if (v) sessionStorage.setItem(VIEW_KEY, JSON.stringify(v)); else sessionStorage.removeItem(VIEW_KEY); } catch (e) { /* private mode */ }
  }
  // a customer's own pages, which only viewing has nothing to show for
  const PRIVATE = /^#\/(cart|checkout|orders|track|chat|auth|account|support)(\/|$)/;

  const D = () => Store.data;
  // the saved addresses and the areas found in the location search
  const allPlaces = () => window.LH.places.concat(D().extraPlaces);
  const place = () => allPlaces().find((p) => p.id === D().place) || window.LH.places[0];
  const catById = (id) => cats.find((c) => c.id === id) || cats[cats.length - 1];
  const liveShops = () => D().shops.filter(Store.shopLive);
  // while only viewing, the cart is empty and nothing is saved to it
  const cart = () => (S.viewAs ? { groups: {} } : D().cart);
  // the cart holds one group per shop; each group has its own address and way of getting the items
  const groups = () => Object.entries(cart().groups).map(([id, g]) => ({ id, g, shop: Store.shopById(id) })).filter((x) => x.shop);
  const inCartOf = (s) => (cart().groups[s.id] ? cart().groups[s.id].lines : {});
  const itemById = (shop, id) => shop.items.find((x) => x.id === id);
  const groupCount = (x) => Object.values(x.g.lines).reduce((a, q) => a + q, 0);
  const cartCount = () => groups().reduce((a, x) => a + groupCount(x), 0);
  const groupSub = (x) => Object.entries(x.g.lines).reduce((sum, [id, q]) => { const it = itemById(x.shop, id); return sum + (it ? it.price * q : 0); }, 0);
  const cartSubtotal = () => groups().reduce((a, x) => a + groupSub(x), 0);
  const placeOfGroup = (g) => allPlaces().find((p) => p.id === g.place) || window.LH.places[0];
  // two upazilas in different districts can share a name
  const sameArea = (s, p) => s.area === p.area && (!s.zila || !p.zila || s.zila === p.zila);
  // null when only service shops are in the cart: a delivery charge does not apply to them at all
  function feeTotal() {
    if (groups().every((x) => x.shop.kind === 'service')) return null;
    return Object.values(Store.deliveryFees()).reduce((a, b) => a + b, 0);
  }
  // shop edits can remove an item or take it off sale while it sits in a cart
  function pruneCart() {
    let changed = false;
    Object.entries(cart().groups).forEach(([id, g]) => {
      const shop = Store.shopById(id);
      if (!shop || !Store.shopLive(shop)) { delete cart().groups[id]; changed = true; return; }
      Object.keys(g.lines).forEach((itemId) => {
        const it = itemById(shop, itemId);
        if (!it || !it.available) { delete g.lines[itemId]; changed = true; }
      });
      if (!Object.keys(g.lines).length) delete cart().groups[id];
    });
    if (changed) { Store.save(); toast('দোকানের দাম বা আইটেম বদলেছে, কার্ট আপডেট করা হয়েছে'); }
  }

  // Search looks in the Bangla text and its English translation. Latin words match from the start of a word, so "rice" does not find "price".
  const hayCache = new Map();
  function hay(text) {
    let h = hayCache.get(text);
    if (h === undefined) {
      h = ' ' + (text + ' ' + window.LHI18n.en(text)).toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ') + ' ';
      hayCache.set(text, h);
    }
    return h;
  }
  function termIn(h, t) {
    if (/[ঀ-৿]/.test(t)) return h.includes(t);
    return h.includes(' ' + t) || (Object.hasOwn(window.LH.searchWords, t) ? window.LH.searchWords[t] : []).some((w) => h.includes(w));
  }
  function hits(text, q) {
    const h = hay(text);
    return q.toLowerCase().split(/[\s,]+/).filter(Boolean).every((t) => termIn(h, t));
  }
  const itemText = (it) => it.name + ' ' + (it.sub || '') + ' ' + (it.speciality || '');
  const matchItems = (shop, q) => (q ? shop.items.filter((it) => it.available && hits(itemText(it), q)) : []);
  function matchShop(s, q) {
    if (!q) return true;
    // the shop's own category and the ones the team added
    const words = Store.catsOf(s).map(catById).flatMap((c) => [c.label, c.short]);
    return hits([s.name, s.market, s.about, ...words, ...s.items.filter((it) => it.available).map(itemText)].join(' , '), q);
  }

  function visibleShops() {
    const q = S.q.trim();
    return liveShops().filter((s) => {
      if (!sameArea(s, place())) return false;
      if (S.cat && !Store.inCat(s, S.cat)) return false;
      if (S.filter === 'shop' && s.kind !== 'shop') return false;
      if (S.filter === 'service' && s.kind !== 'service') return false;
      if (S.filter === 'verified' && !s.verified) return false;
      if (S.cat && S.sub && !s.items.some((it) => it.available && it.sub === S.sub)) return false;
      return matchShop(s, q);
    });
  }

  /* ---------- shared pieces ---------- */
  const SIDES = [['customer', '#/', 'ইউজার'], ['owner', '#/owner', 'এজেন্ট'], ['delivery', '#/rider', 'ডেলিভারি'], ['admin', '#/admin', 'অ্যাডমিন']];
  const homeOfSide = (side) => SIDES.find((x) => x[0] === side)[1];
  // A shop profile, an order or a delivery man's profile opened from a panel stays inside that panel.
  const SHARED = /^#\/(shop|track|profile)\//;
  const sideOf = () => {
    const side = routeSide();
    return side === 'customer' && S.panel && !S.viewAs && SHARED.test(location.hash) ? S.panel : side;
  };
  function routeSide() {
    const h = location.hash || '#/';
    const auth = h.match(/^#\/(?:auth|account|support)\/(?:verify\/)?(customer|owner|delivery)/);
    if (auth) return auth[1];
    if (h.startsWith('#/owner')) return 'owner';
    if (h.startsWith('#/rider')) return 'delivery';
    if (h.startsWith('#/admin')) return 'admin';
    return 'customer';
  }
  function renderStrip() {
    const side = sideOf();
    $('strip').innerHTML = `<span class="side-pick" role="group" aria-label="কোন দিক দেখবেন">
        ${SIDES.map((s) => `<a href="${s[1]}" class="${side === s[0] ? 'on' : ''}" ${side === s[0] ? 'aria-current="true"' : ''}>${s[2]}</a>`).join('')}
      </span>
      <span class="strip-r">
        <button type="button" class="lang-btn" data-action="lang" lang="${window.LHI18n.lang === 'bn' ? 'en' : 'bn'}">🌐 <span translate="no">${window.LHI18n.lang === 'bn' ? 'English' : 'বাংলা'}</span></button>
        <button type="button" class="gear" data-action="open-settings" aria-label="প্রোটোটাইপের সেটিংস">⚙</button>
      </span>`;
  }
  const viewBar = () => '<div class="view-bar"><span>👁 গ্রাহক যেভাবে দেখবেন · শুধু দেখার জন্য</span><button type="button" class="view-exit" data-action="view-exit">✕ বের হন</button></div>';
  // the bell of a signed-in user or agent; a delivery man's messages are on his job list
  function bellHtml(acct) {
    if (!acct || (acct.role !== 'customer' && acct.role !== 'owner')) return '';
    const n = Store.notesUnseen(acct.id);
    return `<button type="button" class="bell" data-action="open-notes" aria-label="নোটিফিকেশন${n ? `, ${bn(n)}টি নতুন` : ''}"><span aria-hidden="true">🔔</span>${n ? `<span class="pill">${bn(n)}</span>` : ''}</button>`;
  }
  function renderTop() {
    const side = sideOf();
    const acct = S.viewAs ? null : window.LHAuth.current(side);
    if (side !== 'customer') {
      $('top').innerHTML = `<div class="top-in top-plain">
        <a class="brand brand-on" href="${homeOfSide(side)}" data-action="go-home" aria-label="লোকালহাট হোম"><span class="mark" aria-hidden="true">হ</span><span class="brand-name">লোকালহাট</span></a>
        <span class="side-title">${side === 'owner' ? 'এজেন্ট প্যানেল' : side === 'admin' ? 'অ্যাডমিন প্যানেল' : 'ডেলিভারি প্যানেল'}</span>
        ${side === 'owner' ? bellHtml(acct) : ''}
      </div>`;
      return;
    }
    const p = place();
    const n = cartCount();
    const h = location.hash || '#/';
    const showSearch = h === '#/' || h === '#/map';
    $('top').innerHTML = `${S.viewAs ? viewBar() : ''}
      <div class="top-in">
        <a class="brand" href="#/" data-action="go-home" aria-label="লোকালহাট হোম"><span class="mark" aria-hidden="true">হ</span><span class="brand-name">লোকালহাট</span></a>
        <button type="button" class="loc" data-action="open-places" aria-label="ডেলিভারির ঠিকানা বদলান, এখন ${placeName(p)}">
          <span class="loc-ico" aria-hidden="true">${p.icon}</span>
          <span class="loc-txt"><small>পাঠানো হবে</small><b>${placeName(p)}, ${geo(p.custom ? p.zila : p.area)}</b></span>
          <span class="chev" aria-hidden="true">⌄</span>
        </button>
        <label class="search ${showSearch ? '' : 'search-desk'}">
          <span class="sr">দোকান বা পণ্য খুঁজুন</span>
          <span aria-hidden="true" class="s-ico">⌕</span>
          <input id="q" type="search" placeholder="চাল, ওষুধ, দোকানের নাম খুঁজুন" value="${esc(S.q)}" autocomplete="off">
        </label>
        <div class="top-acts">
          ${bellHtml(acct)}
          <a class="acct-link" href="${acct ? '#/account/customer' : '#/auth'}">${acct ? ud(acct.first) : 'লগইন'}</a>
          <a class="cart-link" href="#/cart" aria-label="কার্ট, ${bn(n)}টি আইটেম">
            <span aria-hidden="true">🛍️</span><span class="cart-word">কার্ট</span>${n ? `<span class="pill">${bn(n)}</span>` : ''}
          </a>
        </div>
      </div>`;
  }
  const tabLink = (href, icon, label, on, badge) => `<a href="${href}" class="${on ? 'on' : ''}" ${on ? 'aria-current="page"' : ''}><span class="tab-ico" aria-hidden="true">${icon}${badge ? `<i>${bn(badge)}</i>` : ''}</span>${label}</a>`;
  function renderTabs() {
    const side = sideOf();
    let html;
    if (side === 'owner') html = window.LHOwner.tabs(tabLink);
    else if (side === 'delivery') html = window.LHRider.tabs(tabLink);
    else if (side === 'admin') html = window.LHAdmin.tabs(tabLink);
    else {
      const h = location.hash || '#/';
      const me = S.viewAs ? null : window.LHAuth.current('customer');
      const active = me ? D().orders.filter((o) => o.customerId === me.id && !Store.isFinal(o)).length : 0;
      const unread = me ? Store.unreadTotal({ customerId: me.id }, 'customer') : 0;
      html = tabLink('#/', '🏠', 'হোম', h === '#/' || h.startsWith('#/shop')) +
        tabLink('#/map', '🗺️', 'ম্যাপ', h.startsWith('#/map')) +
        tabLink('#/orders', '📦', 'অর্ডার', h.startsWith('#/orders') || h.startsWith('#/track'), active) +
        tabLink('#/chat', '💬', 'চ্যাট', h.startsWith('#/chat'), unread) +
        tabLink('#/cart', '🛍️', 'কার্ট', h.startsWith('#/cart') || h.startsWith('#/checkout'), cartCount()) +
        tabLink(me ? '#/account/customer' : '#/auth', '👤', me ? 'একাউন্ট' : 'লগইন', h.startsWith('#/auth') || h.startsWith('#/account') || h.startsWith('#/support'), me ? Care.unreadFor(me.id) : 0);
    }
    $('tabs').innerHTML = html;
    $('tabs').dataset.count = (html.match(/<a /g) || []).length;
  }

  const logoHtml = (s, cls) => (s.logo ? `<img class="logo ${cls || ''}" src="${s.logo}" alt="">` : `<span class="logo ${cls || ''}" aria-hidden="true">${s.icon}</span>`);
  const coverHtml = (s) => (s.cover ? `<img class="cover-img" src="${s.cover}" alt="">` : `<span class="cover-ico" aria-hidden="true">${s.icon}</span>`);
  const thumbHtml = (it) => (it.image ? `<span class="thumb"><img src="${it.image}" alt=""></span>` : `<span class="thumb" aria-hidden="true">${it.icon}</span>`);

  function shopCard(s) {
    const c = catById(s.cat);
    const hits = matchItems(s, S.q.trim());
    return `<a class="shop" href="#/shop/${s.id}">
      <div class="cover" style="--tint:${c.tint}">${coverHtml(s)}
        ${s.verified ? '<em class="tick">✓ যাচাইকৃত</em>' : ''}${Store.openNow(s) ? '' : '<em class="closed">বন্ধ</em>'}
      </div>
      ${s.logo ? logoHtml(s, 'card-logo') : ''}
      <div class="shop-body">
        <h3>${ud(s.name)}</h3>
        <p class="meta">${esc(c.short)} · ${ud(s.market)}</p>
        ${hits.length ? `<p class="hit">পাওয়া গেছে: ${hits.slice(0, 2).map((i) => ud(i.name) + (i.price ? ' ' + tk(i.price) : '')).join(', ')}</p>` : ''}
        <p class="facts"><span>${Store.isEmergency(s) ? '🚑 ২৪ ঘণ্টা জরুরি সেবা' : s.kind === 'service' ? '🗓️ সেবা বুকিং' : '🛵 হোম ডেলিভারি'}</span><span class="new">${Rate.badge('shop', s.id, 'নতুন')}</span></p>
      </div>
    </a>`;
  }
  function listHtml() {
    const list = visibleShops();
    if (!list.length && S.cat && !S.q.trim()) {
      return `<div class="empty"><span aria-hidden="true">${catById(S.cat).icon}</span><h3>${geo(place().area)} এ এখনো ${esc(catById(S.cat).short)} বিভাগে কেউ নেই</h3>
        <p>নতুন দোকান ও সেবা যোগ হলে এখানে দেখা যাবে।</p>
        <button type="button" class="btn ghost" data-action="clear">সব দোকান দেখুন</button></div>`;
    }
    if (!list.length) {
      const q = S.q.trim();
      const others = q ? allPlaces().filter((p) => p.area !== place().area && liveShops().some((s) => sameArea(s, p) && matchShop(s, q))) : [];
      return `<div class="empty"><span aria-hidden="true">🔍</span><h3>এখানে কিছু পাওয়া যায়নি</h3>
        ${others.length ? `<p>অন্য এলাকায় পাওয়া গেছে:</p><div class="empty-places">${others.map((p) => `<button type="button" class="btn sm" data-action="pick-place" data-id="${p.id}" data-keepq="1">${p.icon} ${geo(p.area)}</button>`).join('')}</div>` : '<p>অন্য শব্দ দিয়ে খুঁজুন, অথবা ফিল্টার মুছে দিন।</p>'}
        <button type="button" class="btn ghost" data-action="clear">সব দোকান দেখুন</button></div>`;
    }
    return `<div class="grid">${list.map(shopCard).join('')}</div>`;
  }

  /* ---------- category products ---------- */
  // A long list of sub-categories comes in groups. "g:" and a group's name picks the whole group.
  const groupOf = (c, sub) => (c && c.groups && sub ? c.groups.find((g) => (sub.startsWith('g:') ? g.name === sub.slice(2) : g.subs.includes(sub))) || null : null);
  const subHas = (c, sub, it) => !sub || (sub.startsWith('g:') ? !!groupOf(c, sub) && groupOf(c, sub).subs.includes(it.sub) : it.sub === sub);
  const subName = (sub) => (sub && sub.startsWith('g:') ? sub.slice(2) : sub);
  // available products of the chosen category in this area; the shop filter chips below do not apply here
  function catProducts(sub) {
    const q = S.q.trim();
    const out = [];
    const c = catById(S.cat);
    liveShops().filter((s) => sameArea(s, place()) && Store.inCat(s, S.cat)).forEach((s) => {
      s.items.forEach((it) => {
        if (!it.available || !Store.itemInCat(s, it, S.cat) || !subHas(c, sub, it)) return;
        // the shop's name brings its whole list only when none of its products match
        if (q && !hits(itemText(it), q) && (matchItems(s, q).length || !hits(s.name, q))) return;
        out.push({ s, it });
      });
    });
    return out;
  }
  const subChip = (id, label, n, on) => `<button type="button" class="chip ${on ? 'on' : ''}" aria-pressed="${on}" data-action="sub" data-id="${esc(id)}">${esc(label)} (${bn(n)})</button>`;
  function subChipsHtml() {
    const c = catById(S.cat);
    const now = S.sub || '';
    const all = subChip('', 'সব', catProducts(null).length, !now);
    if (c.groups) return all + c.groups.map((g) => subChip('g:' + g.name, `${g.icon} ${g.name}`, catProducts('g:' + g.name).length, groupOf(c, now) === g)).join('');
    return all + c.examples.map((x) => subChip(x, x, catProducts(x).length, now === x)).join('');
  }
  // the sub-categories of the open group, under the group chips
  function subChips2Html() {
    const g = groupOf(catById(S.cat), S.sub);
    return g ? g.subs.map((x) => subChip(x, x, catProducts(x).length, S.sub === x)).join('') : '';
  }
  function catProductsHtml() {
    const rows = catProducts(S.sub);
    if (rows.length) return `<ul class="pgrid">${rows.map((r) => productCard(r.s, r.it, inCartOf(r.s), true)).join('')}</ul>`;
    const q = S.q.trim();
    const msg = q ? 'এই খোঁজে কিছু পাওয়া যায়নি' : S.sub ? `${geo(place().area)} এ এখনো ${esc(subName(S.sub))} বিভাগে কিছু নেই` : `${geo(place().area)} এ এখনো ${esc(catById(S.cat).short)} বিভাগে কেউ নেই`;
    return `<div class="empty"><span aria-hidden="true">${catById(S.cat).icon}</span><h3>${msg}</h3>
      <p>নতুন দোকান ও সেবা যোগ হলে এখানে দেখা যাবে।</p>
      ${S.sub ? '<button type="button" class="btn ghost" data-action="sub" data-id="">এই ক্যাটাগরির সব দেখুন</button>' : '<button type="button" class="btn ghost" data-action="clear">সব দোকান দেখুন</button>'}</div>`;
  }
  function catSectionHtml() {
    if (!S.cat) return '';
    return `<section id="cat-sec" aria-labelledby="cat-sec-h">
      <div class="sec-head"><h2 id="cat-sec-h">${esc(subName(S.sub) || catById(S.cat).label)}</h2></div>
      ${S.cat === 'travel' ? '<a class="promise bus-link" href="#/bus"><span class="promise-ico" aria-hidden="true">🚌</span><span><b>বাসের টিকেট</b> যেকোনো স্টপ থেকে উঠুন, দূরত্ব অনুযায়ী ভাড়া</span><span class="promise-go" aria-hidden="true">›</span></a><a class="promise bus-link" href="#/launch"><span class="promise-ico" aria-hidden="true">🛳️</span><span><b>লঞ্চের টিকেট</b> কেবিন ম্যাপে বাছুন, ডেকের টিকেটও</span><span class="promise-go" aria-hidden="true">›</span></a>' : ''}
      <div class="chips sub-chips" id="sub-chips" role="group" aria-label="সাব-ক্যাটাগরি">${subChipsHtml()}</div>
      <div class="chips sub-chips sub-chips2" id="sub-chips2" role="group" aria-label="এই ভাগের সাব-ক্যাটাগরি" ${groupOf(catById(S.cat), S.sub) ? '' : 'hidden'}>${subChips2Html()}</div>
      <div id="cat-products">${catProductsHtml()}</div>
    </section>`;
  }

  /* ---------- search results on home ---------- */
  function foundHtml() {
    const q = S.q.trim();
    if (!q || S.cat) return '';
    const rows = [];
    visibleShops().forEach((s) => matchItems(s, q).forEach((it) => rows.push({ s, it })));
    if (!rows.length) return '';
    return `<div class="sec-head"><h2>পণ্য ও সেবা</h2></div>
      <ul class="pgrid">${rows.map((r) => productCard(r.s, r.it, inCartOf(r.s), true)).join('')}</ul>`;
  }
  // updates the page in place while typing, so the search box keeps focus
  function refreshSearch() {
    const on = !!S.q.trim();
    if (document.body.classList.contains('searching') !== on) window.scrollTo(0, 0);
    document.body.classList.toggle('searching', on);
    if ($('found')) $('found').innerHTML = foundHtml();
    if ($('list')) $('list').innerHTML = listHtml();
    if ($('shops')) $('shops').hidden = !!S.cat && !visibleShops().length;
    if ($('cat-products')) { $('cat-products').innerHTML = catProductsHtml(); $('sub-chips').innerHTML = subChipsHtml(); $('sub-chips2').innerHTML = subChips2Html(); }
  }

  /* ---------- home ---------- */
  const offerOff = (of) => (of.kind === 'percent' ? `${bn(of.value)}% ছাড়` : `${tk(of.value)} ছাড়`);
  function promosHtml() {
    const live = D().offers.filter(Store.offerLive);
    if (!live.length) return '';
    return `<section class="promos" aria-label="চলমান অফার">${live.map((of) => `<div class="promo"><span aria-hidden="true">🎁</span><span><b>${ud(of.title)}</b><small>${offerOff(of)} · কোড <b translate="no">${esc(of.code)}</b>${of.minOrder ? ` · কমপক্ষে ${tk(of.minOrder)} এর পণ্য` : ''}</small></span></div>`).join('')}</section>`;
  }
  /* ---------- home: ads the LocalHaat team runs, and who sells most in the area ---------- */
  let adTimer = null;
  // the ads of shops in this address's area, in the order the team set them
  const adsHere = (p) => (D().ads || []).filter((ad) => Store.adLive(ad) && sameArea(Store.shopById(ad.shopId), p));
  function adSlide(ad) {
    const s = Store.shopById(ad.shopId);
    const it = Store.adItem(ad);
    const c = catById(s.cat);
    const href = it && it.book ? `#/book/${s.id}/${it.id}` : `#/shop/${s.id}`;
    const img = it ? it.image : s.cover || s.logo;
    return `<a class="adv" href="${href}">
      <span class="adv-pic" style="--tint:${c.tint}">${img ? `<img src="${img}" alt="">` : `<span aria-hidden="true">${it ? it.icon : s.icon}</span>`}</span>
      <span class="adv-txt">
        <em class="adv-tag">বিজ্ঞাপন</em>
        <b>${ud(it ? it.name : s.name)}</b>
        ${ad.text ? `<small class="adv-line">${ud(ad.text)}</small>` : ''}
        <small class="adv-meta">${it ? `${Book.priceHtml(it)} · 🏪 ${ud(s.name)}` : `${esc(c.short)} · ${geo(s.area)}`}</small>
        <span class="adv-go">${it ? (it.book ? 'বুক করুন ›' : 'দেখুন ও কিনুন ›') : s.kind === 'service' ? 'সেবা দেখুন ›' : 'দোকান দেখুন ›'}</span>
      </span>
    </a>`;
  }
  function adsHtml(ads) {
    return `<div class="advs-box" role="region" aria-roledescription="carousel" aria-label="বিজ্ঞাপন">
      <div class="advs" id="ads">${ads.map(adSlide).join('')}</div>
      ${ads.length > 1 ? `<div class="adv-dots">${ads.map((_, i) => `<button type="button" class="${i ? '' : 'on'}" data-action="ad-go" data-i="${i}" aria-label="বিজ্ঞাপন ${bn(i + 1)}"></button>`).join('')}</div>` : ''}
    </div>`;
  }
  // The ads move on by themselves every few seconds, and wait while a finger or the mouse is on them.
  function adsStart() {
    clearInterval(adTimer);
    adTimer = null;
    const box = $('ads');
    if (!box) return;
    const n = box.children.length;
    const at = () => Math.round(box.scrollLeft / Math.max(1, box.clientWidth));
    box.addEventListener('scroll', () => { const i = at(); document.querySelectorAll('.adv-dots button').forEach((b, j) => b.classList.toggle('on', j === i)); }, { passive: true });
    if (n < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let held = false;
    ['pointerenter', 'focusin', 'touchstart'].forEach((ev) => box.addEventListener(ev, () => { held = true; }, { passive: true }));
    ['pointerleave', 'focusout', 'touchend'].forEach((ev) => box.addEventListener(ev, () => { held = false; }, { passive: true }));
    adTimer = setInterval(() => {
      if (!box.isConnected) { clearInterval(adTimer); return; }
      if (held || document.hidden) return;
      box.scrollTo({ left: ((at() + 1) % n) * box.clientWidth, behavior: 'smooth' });
    }, 4000);
  }
  // Shops that sell most through LocalHaat in this area: finished orders of the last 30 days, not the money.
  function topHtml(p) {
    const list = Store.areaRanks(p.zila, p.area).slice(0, 5);
    if (!list.length) return '';
    return `<section class="bests" aria-labelledby="top-h">
      <div class="rail-head"><h2 id="top-h">🏆 এই এলাকায় বেশি বিক্রি</h2><small class="meta">গত ৩০ দিনে লোকালহাটে</small></div>
      <div class="rail best-rail">${list.map((x) => `<a class="best" href="#/shop/${x.shop.id}"><span class="best-n">#${bn(x.rank)}</span>${logoHtml(x.shop, 'best-logo')}
        <span class="best-txt"><b>${ud(x.shop.name)}</b><small>${bn(x.orders)}টি অর্ডার সম্পন্ন</small></span></a>`).join('')}</div>
    </section>`;
  }
  function pageHome() {
    const p = place();
    const inArea = liveShops().filter((s) => sameArea(s, p));
    const nShop = inArea.filter((s) => s.kind === 'shop').length;
    const nSvc = inArea.length - nShop;
    const away = p.id !== 'home' && !p.custom;
    const ads = adsHere(p);
    const chip = (id, label) => `<button type="button" class="chip ${S.filter === id ? 'on' : ''}" aria-pressed="${S.filter === id}" data-action="filter" data-id="${id}">${label}</button>`;
    return `
      <section class="hero">
        <div class="hero-txt">
          <h1>${away ? `দূরে থেকেও ${ud(p.person)}র বাজার হোক এলাকার চেনা দোকান থেকে` : 'আপনার এলাকার চেনা দোকান, এখন হাতের মুঠোয়'}</h1>
          <p>${geo(p.area)} এলাকার ${bn(inArea.length)}টি দোকান ও সেবা। ক্যাশ অন ডেলিভারি, ফোন বা চ্যাটে সরাসরি কথা।</p>
        </div>
        ${ads.length ? adsHtml(ads) : `<div class="bento">
          <button type="button" class="tile tile-a" data-action="filter" data-id="shop"><b>দোকান থেকে অর্ডার</b><small>${bn(nShop)}টি দোকান</small><span aria-hidden="true">🧺</span></button>
          <button type="button" class="tile tile-b" data-action="filter" data-id="service"><b>সেবা বুক করুন</b><small>${bn(nSvc)}টি সেবা</small><span aria-hidden="true">🧰</span></button>
          <a class="tile tile-c" href="#/map"><b>ম্যাপে দেখুন কোথায় কী আছে</b><small>কাছের দোকান, পণ্য ও দূরত্ব</small><span aria-hidden="true">🗺️</span></a>
        </div>`}
      </section>
      <section aria-labelledby="cat-h" class="rail-wrap">
        <div class="rail-head"><h2 id="cat-h">ক্যাটাগরি</h2><button type="button" class="inline" data-action="open-cats">সব ${bn(cats.length)}টি দেখুন</button></div>
        <div class="rail">
          ${cats.map((c) => `<button type="button" class="cat ${S.cat === c.id ? 'on' : ''}" aria-pressed="${S.cat === c.id}" data-action="cat" data-id="${c.id}">
            <span class="cat-ico" style="--tint:${c.tint}" aria-hidden="true">${c.icon}</span>${c.short}</button>`).join('')}
        </div>
      </section>
      ${S.cat ? '' : topHtml(p)}
      ${catSectionHtml()}
      ${S.cat ? '' : promosHtml()}
      ${S.cat ? '' : `<button type="button" class="promise" data-action="open-places">
        <span class="promise-ico" aria-hidden="true">🏡</span>
        <span><b>বাবা-মা অন্য জেলায়?</b> তাঁদের ঠিকানা সেভ করুন, এক চাপে তাঁদের এলাকার দোকান দেখুন।</span>
        <span class="promise-go" aria-hidden="true">›</span>
      </button>`}
      <section id="found">${foundHtml()}</section>
      <section id="shops" ${S.cat && !visibleShops().length ? 'hidden' : ''}>
        <div class="sec-head"><h2>${S.cat ? 'এই ক্যাটাগরির দোকান' : `${geo(p.area)} এর দোকান ও সেবা`}</h2></div>
        <div class="chips" role="group" aria-label="ফিল্টার">${chip('all', 'সব')}${chip('shop', 'দোকান')}${chip('service', 'সেবা')}${chip('verified', '✓ যাচাইকৃত')}</div>
        <div id="list">${listHtml()}</div>
      </section>`;
  }

  /* ---------- map ---------- */
  const mapRef = () => (S.mapAt ? S.mapAt : S.gps ? { lat: S.gps.lat, lng: S.gps.lng, icon: '📍', label: 'আমার অবস্থান' } : { lat: place().lat, lng: place().lng, icon: place().icon, label: keep(place().label) });
  // each shop's place in its own area by finished orders of the last 30 days
  function areaRankMap(list) {
    const rows = Store.salesRows();
    const out = {};
    new Set(list.map((s) => s.zila + '|' + s.area)).forEach((k) => { const [z, a] = k.split('|'); Store.areaRanks(z, a, rows).forEach((x) => { out[x.shop.id] = x; }); });
    return out;
  }
  function mapRows() {
    const q = S.q.trim();
    const ref = mapRef();
    const near = liveShops().filter((s) => Map_.km(ref, s) <= NEAR_KM);
    const ranks = areaRankMap(near);
    const sold = (s) => (ranks[s.id] ? ranks[s.id].orders : 0);
    return near
      .map((s) => ({ s, km: Map_.km(ref, s), top: ranks[s.id] || null }))
      .filter((r) => (!S.mapCat || Store.inCat(r.s, S.mapCat)) && (!S.mapSub || r.s.items.some((it) => it.available && subHas(catById(S.mapCat), S.mapSub, it))) && matchShop(r.s, q))
      .sort((a, b) => (S.mapSort === 'sales' ? sold(b.s) - sold(a.s) || a.km - b.km : a.km - b.km))
      .map((r, i) => Object.assign(r, { n: i + 1 }));
  }
  const kmText = (k) => (k < 1 ? bn(Math.round(k * 1000)) + ' মিটার' : bn(k.toFixed(1)) + ' কিমি');
  function mapCard(r) {
    const { s } = r;
    const c = catById(s.cat);
    const q = S.q.trim();
    const mc = catById(S.mapCat);
    const hits = q ? matchItems(s, q).filter((it) => subHas(mc, S.mapSub, it)) : S.mapSub ? s.items.filter((it) => it.available && subHas(mc, S.mapSub, it)) : [];
    const inCart = inCartOf(s);
    return `<article class="mcard ${S.mapSel === s.id ? 'on' : ''}" id="mc-${s.id}" data-action="map-pick" data-id="${s.id}">
      <div class="mcard-top">
        <span class="mnum" aria-hidden="true">${bn(r.n)}</span>
        ${s.logo ? logoHtml(s, 'mcard-logo') : ''}
        <div class="mcard-txt">
          <h3>${ud(s.name)}</h3>
          <p class="meta">${esc(c.short)} · ${kmText(r.km)} দূরে${s.verified ? ' · ✓ যাচাইকৃত' : ''}</p>
          ${r.top ? `<p class="mtop">🏆 এলাকায় বিক্রিতে #${bn(r.top.rank)} · গত ৩০ দিনে ${bn(r.top.orders)}টি অর্ডার</p>` : ''}
          <p class="meta">${Book.hoursStatus(s).text} · ${s.kind === 'service' ? 'সেবা' : 'হোম ডেলিভারি'}${Store.ratingSummary('shop', s.id).n ? ' · ' + Rate.badge('shop', s.id, '') : ''}</p>
        </div>
      </div>
      ${hits.slice(0, 3).map((it) => `<div class="mhit"><span>${it.icon} ${ud(it.name)} <small>${ud(it.unit)}</small> <b>${Book.priceHtml(it)}</b></span>
        ${it.book ? Book.bookBtn(s, it) : Store.canBook(s) ? `<button type="button" class="add sm" data-action="add" data-shop="${s.id}" data-item="${it.id}" aria-label="${ud(it.name)} কার্টে যোগ করুন">${inCart[it.id] ? bn(inCart[it.id]) : '+'}</button>` : ''}</div>`).join('')}
      <div class="mcard-acts">
        <a class="btn sm" href="#/shop/${s.id}">${s.kind === 'service' ? 'সেবা দেখুন' : 'পণ্য দেখুন'}</a>
        <a class="btn ghost sm" href="${Map_.directions(s.lat, s.lng)}" target="_blank" rel="noopener">🧭 পথ দেখুন</a>
      </div>
    </article>`;
  }
  function pageMap() {
    return `<div class="mp is-${S.mapView}" id="mp">
      <div class="mp-side">
        <div class="mp-head">
          <div class="mp-chips" role="group" aria-label="ক্যাটাগরি ফিল্টার">
            <button type="button" class="chip ${S.mapCat ? '' : 'on'}" aria-pressed="${!S.mapCat}" data-action="map-cat" data-id="">সব</button>
            ${cats.map((c) => `<button type="button" class="chip ${S.mapCat === c.id ? 'on' : ''}" aria-pressed="${S.mapCat === c.id}" data-action="map-cat" data-id="${c.id}">${c.icon} ${c.short}</button>`).join('')}
          </div>
          <div class="mp-chips mp-subs" id="map-subs" role="group" aria-label="সাব-ক্যাটাগরি"></div>
        </div>
        <p class="mp-count" id="mp-count" role="status"></p>
        <div class="mp-sort seg two-seg" role="group" aria-label="কোনটি আগে দেখাবে">
          <button type="button" class="${S.mapSort === 'sales' ? '' : 'on'}" aria-pressed="${S.mapSort !== 'sales'}" data-action="map-sort" data-id="near">📍 কাছের আগে</button>
          <button type="button" class="${S.mapSort === 'sales' ? 'on' : ''}" aria-pressed="${S.mapSort === 'sales'}" data-action="map-sort" data-id="sales">🏆 বেশি বিক্রি আগে</button>
        </div>
        <div class="mp-list" id="mp-list"></div>
      </div>
      <div class="mp-mapwrap">
        <div id="map" aria-label="দোকানের ম্যাপ"></div>
        <form id="map-search" class="mp-search" role="search" autocomplete="off" novalidate>
          <span aria-hidden="true" class="s-ico">⌕</span>
          <input id="map-q" type="text" maxlength="100" aria-label="ম্যাপে জায়গা খুঁজুন" placeholder="ম্যাপে জায়গা খুঁজুন" value="${esc(S.mapQ || '')}">
          <button type="button" class="mp-search-x" id="map-q-x" data-action="map-at-clear" aria-label="মুছুন" ${S.mapQ ? '' : 'hidden'}>✕</button>
          <button type="submit" class="mp-search-go">খুঁজুন</button>
          <div class="mp-found" id="map-found" hidden></div>
        </form>
        <div class="mp-tools">
          <button type="button" class="tool" data-action="gps">📍 আমার অবস্থান</button>
          <button type="button" class="tool" data-action="open-places">${place().icon} ঠিকানা বদলান</button>
        </div>
      </div>
      <button type="button" class="mp-toggle" data-action="map-view">${S.mapView === 'map' ? '☰ তালিকা দেখুন' : '🗺️ ম্যাপ দেখুন'}</button>
    </div>`;
  }
  function refreshMap(fit) {
    const list = $('mp-list');
    if (!list) return;
    const subs = $('map-subs');
    const left = subs.scrollLeft;
    // a grouped category shows its groups, and the open group's sub-categories after them
    const mc = S.mapCat && catById(S.mapCat);
    const open = mc && groupOf(mc, S.mapSub);
    const subList = !mc ? [] : mc.groups
      ? [['', 'সব', !S.mapSub], ...mc.groups.map((g) => ['g:' + g.name, `${g.icon} ${g.name}`, open === g]), ...(open ? open.subs.map((x) => [x, x, S.mapSub === x, true]) : [])]
      : [['', 'সব', !S.mapSub], ...mc.examples.map((x) => [x, x, S.mapSub === x])];
    subs.innerHTML = subList.map(([id, label, on, inner]) => `<button type="button" class="chip ${on ? 'on' : ''} ${inner ? 'chip-in' : ''}" aria-pressed="${!!on}" data-action="map-sub" data-id="${esc(id)}">${esc(label)}</button>`).join('');
    subs.scrollLeft = left;
    $('mp').classList.toggle('has-subs', !!S.mapCat);
    const rows = mapRows();
    const ref = mapRef();
    if (S.mapSel && !rows.some((r) => r.s.id === S.mapSel)) S.mapSel = null;
    $('mp-count').textContent = rows.length ? `${ref.label} থেকে কাছের ${bn(rows.length)}টি জায়গা` : '';
    list.innerHTML = rows.length ? rows.map(mapCard).join('') : `<div class="empty"><span aria-hidden="true">🗺️</span><h3>এই এলাকায় কিছু পাওয়া যায়নি</h3><p>অন্য শব্দ বা ক্যাটাগরি দেখুন, অথবা ঠিকানা বদলান।</p><button type="button" class="btn ghost" data-action="map-clear">ফিল্টার মুছুন</button></div>`;
    Map_.setPins(rows.map((r) => ({ id: r.s.id, lat: r.s.lat, lng: r.s.lng, n: bn(r.n), title: keep(r.s.name) })), ref, S.mapSel, fit);
  }
  function pickOnMap(id, scroll) {
    S.mapSel = id;
    refreshMap(false);
    const s = Store.shopById(id);
    if (s) Map_.focus(s.lat, s.lng);
    if (scroll) { const c = $('mc-' + id); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' }); }
  }
  /* ---------- finding a place on the map ---------- */
  let mapAsk = 0;
  let mapHits = [];
  function mapFound(html) {
    const box = $('map-found');
    if (!box) return;
    box.innerHTML = html;
    box.hidden = !html;
  }
  // suggestions are in the language of the page; what the user typed in the box stays as typed
  const foundRow = (attrs, title, line) => `<button type="button" class="addr" ${attrs}><span aria-hidden="true">📍</span><span><b>${title}</b><small>${line}</small></span></button>`;
  // the country's districts and upazilas are in the page, so these need no request
  function mapNearby(q) {
    const t = q.normalize('NFC').trim().toLowerCase();
    return t ? areaHits(t, []).slice(0, 6).map((r) => foundRow(`data-action="map-area" data-zila="${esc(r.zila)}" data-area="${esc(r.area)}"`, geo(r.area), geo(r.zila))).join('') : '';
  }
  function mapSuggest(q) {
    const rows = mapNearby(q);
    mapFound(q.trim() ? `${rows}<p class="meta place-none">অন্য জায়গা হলে "খুঁজুন" চাপুন।</p>` : '');
  }
  // label is ready markup; the search box keeps the words the user typed
  function setMapAt(lat, lng, label) {
    S.mapAt = { lat, lng, icon: '📍', label };
    S.gps = null;
    S.mapSel = null;
    mapFound('');
    if ($('map-q')) $('map-q-x').hidden = !$('map-q').value;
    refreshMap(true);
  }
  function clearMapAt() {
    S.mapAt = null;
    S.mapQ = '';
    mapFound('');
    if ($('map-q')) { $('map-q').value = ''; $('map-q-x').hidden = true; }
  }
  async function mapSearch(q) {
    const ask = ++mapAsk;
    mapFound('<p class="meta place-none">খোঁজা হচ্ছে…</p>');
    try {
      mapHits = await Map_.geocode(q);
      if (ask !== mapAsk) return;
      const rows = mapHits.map((r, i) => foundRow(`data-action="map-hit" data-i="${i}"`, ud(r.name), ud(r.line))).join('');
      mapFound(rows || `<p class="meta place-none">এই নামে কোনো জায়গা পাওয়া যায়নি।</p>${mapNearby(q)}`);
    } catch (ex) {
      if (ask === mapAsk) mapFound(`<p class="meta place-none">খোঁজা গেল না, ইন্টারনেট দেখুন।</p>${mapNearby(q)}`);
    }
  }
  // the list has no positions of its own: ask for the exact place, or fall back to a shop there or the district
  async function mapGoToArea(zila, area) {
    const ask = ++mapAsk;
    mapFound('<p class="meta place-none">খোঁজা হচ্ছে…</p>');
    let hit = null;
    try { [hit] = await Map_.geocode(area + ', ' + zila); } catch (ex) { /* the fallback below still moves the map */ }
    if (ask !== mapAsk) return;
    const shop = liveShops().find((x) => sameArea(x, { zila, area }));
    const pos = hit || shop || { lat: window.LH_GEO_POS[zila][0], lng: window.LH_GEO_POS[zila][1] };
    setMapAt(pos.lat, pos.lng, geo(area));
  }
  function mountMap() {
    const head = document.querySelector('.top').getBoundingClientRect().bottom;
    document.documentElement.style.setProperty('--map-top', Math.max(0, Math.round(head)) + 'px');
    Map_.mountExplorer($('map'), (id) => pickOnMap(id, true));
    refreshMap(true);
    Map_.resize();
  }

  /* ---------- shop ---------- */
  const backLink = (href, label) => (S.panel && !S.viewAs ? `<a class="back" href="${homeOfSide(S.panel)}" data-rate-back>‹ ফিরে যান</a>` : `<a class="back" href="${href}">${label}</a>`);
  function stepper(shopId, id, q) {
    return `<div class="stepper">
      <button type="button" data-action="dec" data-shop="${shopId}" data-item="${id}" aria-label="একটি কমান">−</button>
      <output>${bn(q)}</output>
      <button type="button" data-action="inc" data-shop="${shopId}" data-item="${id}" aria-label="একটি বাড়ান">+</button>
    </div>`;
  }
  function cartPanel(s) {
    if (!cartCount()) return '<div class="side-empty"><span aria-hidden="true">🛍️</span><p>কার্ট খালি। পণ্যের পাশে + চাপুন।</p></div>';
    const lines = Object.entries(inCartOf(s));
    return `<h3>আপনার কার্ট</h3>
      ${lines.length ? `<p class="meta">${ud(s.name)}</p><ul class="mini">${lines.map(([id, q]) => { const it = itemById(s, id); return it ? `<li><span>${bn(q)} × ${ud(it.name)}</span><b>${it.price ? tk(it.price * q) : 'দাম পরে'}</b></li>` : ''; }).join('')}</ul>` : ''}
      <div class="sum"><span>${bn(groups().length)}টি দোকান, পণ্যের দাম</span><b>${tk(cartSubtotal())}</b></div>
      ${feeTotal() === null ? '' : '<p class="meta">ডেলিভারি চার্জ কার্টে হিসাব হবে।</p>'}
      <a class="btn block" href="#/cart">কার্ট দেখুন</a>`;
  }
  function buyHtml(s, it, inCart) {
    if (!it.available) return '';
    if (it.book) return s.open ? Book.bookBtn(s, it) : '';
    // a shop closed by the clock still takes orders for later: picked up or delivered when it is open
    if (!Store.canBook(s)) return '';
    return inCart[it.id] ? stepper(s.id, it.id, inCart[it.id]) : `<button type="button" class="add" data-action="add" data-shop="${s.id}" data-item="${it.id}" aria-label="${ud(it.name)} কার্টে যোগ করুন">+</button>`;
  }
  function productCard(s, it, inCart, showShop) {
    return `<li class="pcard ${it.available ? '' : 'off'}">
      <div class="pcard-pic">${it.image ? `<img src="${it.image}" alt="${ud(it.name)}">` : `<span aria-hidden="true">${it.icon}</span>`}${it.available ? '' : '<em class="closed">স্টক নেই</em>'}</div>
      <div class="pcard-body">
        <b>${ud(it.name)}</b><small>${ud(it.unit)}</small>
        ${it.big ? '<small class="big-tag">🚚 বড় জিনিস, ভ্যানে যাবে</small>' : ''}
        ${showShop ? `<a class="pcard-shop" href="#/shop/${s.id}">🏪 ${ud(s.name)}${Store.openNow(s) ? '' : ' · বন্ধ'}</a>` : ''}
        ${Book.bookNote(it)}
        <div class="pcard-row">${Book.priceHtml(it)}
          ${buyHtml(s, it, inCart)}</div>
      </div></li>`;
  }
  /* ---------- a clinic: doctors and tests ---------- */
  const availFirst = (list) => list.filter((x) => x.available).concat(list.filter((x) => !x.available));
  const clinicCount = (s) => { const n = (r) => s.items.filter((it) => it.role === r && it.available).length; return `${bn(n('doctor'))} জন ডাক্তার · ${bn(n('test'))}টি টেস্ট`; };
  function docCard(s, it) {
    return `<li class="doc ${it.available ? '' : 'off'}">
      <span class="doc-pic">${it.image ? `<img src="${it.image}" alt="">` : `<span aria-hidden="true">${it.icon}</span>`}</span>
      <div class="doc-txt">
        <b>${ud(it.name)}</b>
        ${it.degree ? `<small>${ud(it.degree)}</small>` : ''}
        ${it.speciality ? `<span class="doc-spec">${ud(it.speciality)}</span>` : ''}
        <small>🗓️ ${Book.daysText(it.days)} · ${Book.slotsText(it)}</small>
        <div class="doc-fee"><span>নতুন রোগী <b>${tk(it.price)}</b></span>${it.oldFee !== undefined ? `<span>পুরাতন রোগী <b>${tk(it.oldFee)}</b></span>` : ''}</div>
        ${it.available ? buyHtml(s, it, {}) : '<small class="closed-txt">এখন সিরিয়াল নেওয়া হচ্ছে না</small>'}
      </div></li>`;
  }
  function testRow(s, it) {
    const off = Store.offerOn(it) ? Book.offerText(it) : '';
    return `<li class="item ${it.available ? '' : 'off'}">${thumbHtml(it)}
      <div class="item-txt"><b>${ud(it.name)}</b>${it.note ? `<small>${ud(it.note)}</small>` : ''}${Book.priceHtml(it)}${off ? `<small class="off-until">${off}</small>` : ''}</div>
      ${it.available ? buyHtml(s, it, {}) : '<small class="closed-txt">এখন হচ্ছে না</small>'}</li>`;
  }
  function clinicHtml(s) {
    const docs = availFirst(s.items.filter((it) => it.role === 'doctor'));
    const tests = availFirst(s.items.filter((it) => it.role === 'test'));
    const rest = availFirst(s.items.filter((it) => !it.role));
    return `<h2>ডাক্তার</h2>
      ${docs.length ? `<ul class="docs">${docs.map((it) => docCard(s, it)).join('')}</ul>` : '<p class="meta">এখনো কোনো ডাক্তারের তথ্য দেওয়া হয়নি।</p>'}
      <h2 class="gap-t">টেস্ট ও দাম</h2>
      ${tests.length ? `<ul class="items">${tests.map((it) => testRow(s, it)).join('')}</ul>` : '<p class="meta">এখনো কোনো টেস্টের তথ্য দেওয়া হয়নি।</p>'}
      ${rest.length ? `<h2 class="gap-t">অন্যান্য সেবা</h2><ul class="pgrid">${rest.map((it) => productCard(s, it, inCartOf(s))).join('')}</ul>` : ''}`;
  }
  // "view as customer" of a shop customers cannot see right now
  function viewHidden(s) {
    return `<div class="empty big"><span aria-hidden="true">🙈</span><h1>গ্রাহকরা এখন এই দোকান দেখতে পাচ্ছেন না</h1><p>${s.suspended ? 'দোকানটি স্থগিত আছে।' : 'এজেন্ট এখনো একাউন্ট ভেরিফাই করেননি।'}</p><button type="button" class="btn" data-action="view-exit">দেখা শেষ করুন</button></div>`;
  }
  function pageViewOnly() {
    return `<div class="empty big"><span aria-hidden="true">👁</span><h1>এটি গ্রাহকের নিজের পাতা</h1><p>গ্রাহক যেভাবে দেখবেন, সেই মোডে কার্ট, অর্ডার, চ্যাট ও একাউন্ট খোলা যায় না।</p>
      <div class="empty-acts"><a class="btn ghost" href="#/" data-rate-back>‹ ফিরে যান</a><button type="button" class="btn" data-action="view-exit">দেখা শেষ করুন</button></div></div>`;
  }
  function pageShop(id) {
    const s = Store.shopById(id);
    const me = window.LHAuth.current('owner');
    const mine = !S.viewAs && me && me.shopId === id;
    if (s && !Store.shopLive(s) && S.viewAs) return viewHidden(s);
    if (!s || (!Store.shopLive(s) && !mine && !Store.isAdmin())) return pageMissing();
    const c = catById(s.cat);
    const inCart = inCartOf(s);
    const n = cartCount();
    const avail = s.items.filter((x) => x.available);
    const word = s.kind === 'service' ? 'সেবা' : 'পণ্য';
    const clinic = Store.setupOf(s) === 'clinic';
    const info = (label, val) => (val ? `<div><dt>${label}</dt><dd>${val}</dd></div>` : '');
    const rank = Store.shopRank(s.id);
    const top = rank && rank.rank ? rank : null;
    const later = s.kind !== 'service' && Store.canBook(s) && !Store.openNow(s);
    return `
      ${backLink('#/', '‹ সব দোকান')}
      <section class="profile">
        <div class="profile-cover" style="--tint:${c.tint}">${coverHtml(s)}</div>
        <div class="profile-body">
          ${logoHtml(s, 'profile-logo')}
          <div class="profile-head">
            <h1>${ud(s.name)}</h1>
            <p class="profile-sub">${esc(c.label)}</p>
            <p class="meta"><a class="inline-link" href="#shop-info" data-action="to-info">📍 ${ud(s.market)}, ${geo(s.area)}</a> · ${clinic ? clinicCount(s) : `${bn(avail.length)}টি ${word} আছে`}</p>
          </div>
          ${s.about ? `<p class="profile-about">${ud(s.about)}</p>` : ''}
          <div class="tags">
            ${s.verified ? '<span class="tag ok">✓ ট্রেড লাইসেন্স যাচাইকৃত</span>' : '<span class="tag">যাচাই বাকি</span>'}
            <span class="tag ${Book.hoursStatus(s).open ? 'ok-soft' : 'bad'}">${Book.hoursStatus(s).text}</span>
            ${s.kind === 'service' ? '' : '<span class="tag">🛵 হোম ডেলিভারি</span><span class="tag">🏪 দোকান থেকেও নেওয়া যায়</span>'}
            ${Store.isEmergency(s) ? '<span class="tag sos-tag">🚑 ২৪ ঘণ্টা জরুরি সেবা</span>' : ''}
            ${top ? `<span class="tag best-tag">🏆 এলাকায় বিক্রিতে #${bn(top.rank)}</span>` : ''}
            <span class="tag">${Rate.badge('shop', s.id, 'নতুন, এখনো রেটিং নেই')}</span>
          </div>
          ${Store.isEmergency(s) ? '<p class="sos-note">জরুরি হলে বুকিং না করে এখনই কল করুন।</p>' : ''}
          <div class="contact three">
            <a class="btn ${Store.isEmergency(s) ? 'sos' : ''}" href="tel:${esc(s.phone)}">${Store.isEmergency(s) ? '📞 জরুরি কল' : '📞 কল করুন'}</a>
            <a class="btn ghost" href="#/chat/${s.id}">💬 চ্যাট করুন</a>
            <a class="btn ghost" href="${Map_.directions(s.lat, s.lng)}" target="_blank" rel="noopener">🧭 পথ দেখুন</a>
          </div>
          ${later ? '<p class="note gap-t">🕒 দোকান এখন বন্ধ। এখনই অর্ডার দিয়ে রাখুন: খোলার সময়ে দোকান থেকে নিন, অথবা ডেলিভারি নিন।</p>' : ''}
          ${mine ? '<a class="own-edit" href="#/owner/shop">✏️ আপনার দোকান: প্রোফাইল এডিট করুন</a>' : ''}
        </div>
      </section>
      <div class="shop-layout">
        <section>
          ${clinic ? clinicHtml(s) : Store.setupOf(s) === 'bus' ? Book.busShop(s) : Store.setupOf(s) === 'launch' ? window.LHLaunch.shopHtml(s) : `<h2>${s.kind === 'service' ? 'সেবা ও দাম' : 'পণ্য ও দাম'}</h2>
          ${s.items.length ? `<ul class="pgrid">${avail.concat(s.items.filter((x) => !x.available)).map((it) => productCard(s, it, inCart)).join('')}</ul>` : '<p class="meta">এই দোকান এখনো কিছু যোগ করেনি।</p>'}`}
          <h2 class="gap-t" id="ratings">রেটিং ও মতামত</h2>
          ${Rate.listHtml('shop', s.id)}
        </section>
        <aside class="side-col">
          <div class="side">${cartPanel(s)}</div>
          <section class="panel" id="shop-info">
            <h2 class="tight">দোকানের তথ্য</h2>
            <dl class="acct-list info-list">
              ${info('ঠিকানা', ud(s.address))}
              ${info('বাজার', ud(s.market))}
              ${info('ফোন', `<a href="tel:${esc(s.phone)}">${bn(esc(s.phone))}</a>`)}
              ${info('ধরন', s.kind === 'service' ? 'সেবা প্রদানকারী' : 'দোকান / ব্যবসা')}
            </dl>
            <h3 class="loc-h">সাপ্তাহিক সময়</h3>
            ${Book.hoursTable(s)}
            <h3 class="loc-h">লোকেশন</h3>
            <div class="mini-map" id="shop-map" data-shop="${s.id}" aria-label="দোকানের লোকেশন ম্যাপ"></div>
          </section>
        </aside>
      </div>
      ${n ? `<a class="cart-bar" href="#/cart"><span class="pill">${bn(n)}</span><span>কার্ট দেখুন</span><b>${tk(cartSubtotal())}</b></a>` : ''}`;
  }

  /* ---------- cart + checkout ---------- */
  // fee null: a service shop, where a delivery charge does not apply at all
  function summary(sub, fee, hasAsk, cta, off) {
    return `<aside class="panel bill">
      <h2 class="tight">হিসাব</h2>
      <div class="sum"><span>${fee === null ? 'দাম' : 'পণ্যের দাম'}</span><b>${tk(sub)}</b></div>
      ${fee === null ? '' : `<div class="sum"><span>ডেলিভারি চার্জ</span><b>${fee ? tk(fee) : 'নেই'}</b></div>`}
      ${off ? `<div class="sum"><span>অফার ছাড়</span><b>−${tk(off)}</b></div>` : ''}
      <div class="sum total"><span>মোট</span><b>${tk(sub + (fee || 0) - (off || 0))}</b></div>
      ${hasAsk ? '<p class="note">কিছু সেবার দাম দোকান ফোনে জানাবে, তাই মোট বদলাতে পারে।</p>' : ''}
      ${cta}
    </aside>`;
  }
  const hasAskPrice = () => groups().some((x) => Object.keys(x.g.lines).some((id) => { const it = itemById(x.shop, id); return it && !it.price; }));
  const byPlace = () => allPlaces().map((p) => ({ p, rows: groups().filter((x) => placeOfGroup(x.g).id === p.id) })).filter((r) => r.rows.length);
  const placeHead = (p) => `<h2 class="tight"><span aria-hidden="true">${p.icon}</span> ${placeName(p)}</h2><p class="meta">${placeLine(p)}</p>`;
  // Home delivery, or picking the items up at the shop. Both can be booked for later when the shop is closed now.
  // q: the delivery charge of the shop, with the distance and whether a big item needs a van
  function modePick(s, g, q) {
    const pickup = g.mode === 'pickup';
    const cost = pickup ? '' : ` · ${q.km ? kmText(q.km) + ' · ' : ''}${q.fee ? tk(q.fee) : 'চার্জ নেই'}`;
    return `<label class="pay"><input type="radio" name="mode-${s.id}" data-cart-mode="${s.id}" value="delivery" ${pickup ? '' : 'checked'}><span><b>${q.big ? '🚚' : '🛵'} বাসায় ডেলিভারি</b><small>${q.big ? 'ভ্যান বা পিকআপে পৌঁছে দেবেন' : 'ডেলিভারি ম্যান পৌঁছে দেবেন'}${cost}</small></span></label>
        <label class="pay"><input type="radio" name="mode-${s.id}" data-cart-mode="${s.id}" value="pickup" ${pickup ? 'checked' : ''}><span><b>🏪 দোকান থেকে নেব</b><small>${ud(s.address)} · ডেলিভারি চার্জ নেই</small></span></label>
        ${q.big && !pickup ? '<p class="note">🚚 বড় জিনিস আছে, তাই বাইকে নয়, ভ্যান বা পিকআপে যাবে। চার্জ দূরত্ব দেখে।</p>' : ''}`;
  }
  function cartShopHtml(x, fee) {
    const s = x.shop;
    const service = s.kind === 'service';
    return `<div class="cart-shop">
      <div class="cart-shop-head"><b>${ud(s.name)}</b><small>${ud(s.market)}</small></div>
      <ul class="items flat">${Object.entries(x.g.lines).map(([id, q]) => {
        const it = itemById(s, id);
        return `<li class="item">${thumbHtml(it)}
          <div class="item-txt"><b>${ud(it.name)}</b><small>${ud(it.unit)}</small><span class="price">${it.price ? tk(it.price * q) : 'দাম জেনে নিন'}</span></div>
          ${stepper(s.id, id, q)}</li>`;
      }).join('')}</ul>
      <label class="field"><span>${service ? 'কোথায় সেবা নেবেন' : 'কোথায় পাঠাবো'}</span><select data-cart-place="${s.id}">${allPlaces().map((p) => `<option value="${p.id}" ${placeOfGroup(x.g).id === p.id ? 'selected' : ''}>${placeName(p)}</option>`).join('')}</select></label>
      ${service ? '' : `<fieldset class="fs gap-t"><legend>কিভাবে নেবেন?</legend>${modePick(s, x.g, fee)}</fieldset>`}
      ${Store.canBook(s) && !Store.openNow(s) ? '<p class="note gap-t">🕒 দোকান এখন বন্ধ। চেকআউটে কখন চান সেই সময় দিন।</p>' : ''}
      <a class="more" href="#/shop/${s.id}">+ আরও যোগ করুন</a>
    </div>`;
  }
  function pageCart() {
    pruneCart();
    if (!cartCount()) {
      return `<div class="empty big"><span aria-hidden="true">🛍️</span><h1>কার্ট এখনো খালি</h1><p>এলাকার দোকান থেকে কিছু বেছে নিন।</p><a class="btn" href="#/">দোকান দেখুন</a></div>`;
    }
    const fees = Store.deliveryQuote();
    return `
      <h1 class="page-h">আপনার কার্ট</h1>
      <div class="two">
        <div class="stack">${byPlace().map(({ p, rows }) => `<section class="panel">${placeHead(p)}${rows.map((x) => cartShopHtml(x, fees[x.id])).join('')}</section>`).join('')}</div>
        ${summary(cartSubtotal(), feeTotal(), hasAskPrice(), '<a class="btn block" href="#/checkout">চেকআউটে যান</a>')}
      </div>`;
  }
  function coShopHtml(x, fee, p) {
    const co = S.co;
    const s = x.shop;
    const service = s.kind === 'service';
    const pickup = !service && x.g.mode === 'pickup';
    const closed = !Store.openNow(s);
    const dateTime = `<div class="row2">
          <label class="field"><span>তারিখ</span><input id="c-date-${s.id}" data-co="date:${s.id}" type="date" min="${Store.today()}" value="${esc(co.date[s.id] || '')}"></label>
          <label class="field"><span>সময়</span><input id="c-time-${s.id}" data-co="time:${s.id}" type="time" value="${esc(co.time[s.id] || '')}"></label>
        </div><small id="c-when-err-${s.id}" class="err"></small>`;
    return `<div class="cart-shop">
      <div class="cart-shop-head"><b>${ud(s.name)}</b><small>${bn(groupCount(x))}টি আইটেম · ${tk(groupSub(x))}</small></div>
      ${Store.canBook(s) ? '' : '<p class="warn">এই দোকান এখন বন্ধ রাখা হয়েছে, অর্ডার হবে না।</p>'}
      ${!Store.canBook(s) ? '' : service ? dateTime
    : `${modePick(s, x.g, fee)}
        <fieldset class="fs when-pick"><legend>${pickup ? 'কখন নিতে আসবেন?' : 'কখন পৌঁছাবে?'}</legend>
          ${closed ? '<p class="note">🕒 দোকান এখন বন্ধ। খোলার সময়ের মধ্যে একটি সময় দিন, দোকান খুলে অর্ডার দেখবে।</p>' : '<small>খালি রাখলে আজই, যত তাড়াতাড়ি সম্ভব।</small>'}
          ${dateTime}</fieldset>`}
      ${!service && !pickup && !sameArea(s, p) ? `<p class="warn">এই দোকান ${geo(s.area)} এলাকায়, ঠিকানাটি ${geo(p.area)} এ। ঠিকানা মিলিয়ে নিন।</p>` : ''}
      <label class="field"><span>দোকানের জন্য নোট (ঐচ্ছিক)</span><textarea id="c-note-${s.id}" data-co="note:${s.id}" rows="2" maxlength="300" placeholder="যেমন: গেটের পাশে দিয়ে আম্মুকে ফোন দেবেন">${esc(co.note[s.id] || '')}</textarea></label>
    </div>`;
  }
  // an area found in the search says where, not which door; someone has to come to the door unless every shop there is a pickup
  const needsLine = (p, rows) => !!p.custom && rows.some((x) => x.shop.kind === 'service' || x.g.mode !== 'pickup');
  function coPlaceHtml(p, rows, fees, me) {
    const co = S.co;
    if (co.name[p.id] === undefined) co.name[p.id] = p.id === 'home' || p.custom ? me.name : p.person;
    // the customer's own address gets the customer's own number; a family member's number is theirs to give
    if (co.phone[p.id] === undefined) co.phone[p.id] = (p.id === 'home' || p.custom) && /^01[3-9]\d{8}$/.test(me.contact || '') ? me.contact : '';
    return `<section class="panel">${placeHead(p)}
      <label class="field"><span>যিনি নেবেন তাঁর নাম</span><input id="c-name-${p.id}" data-co="name:${p.id}" type="text" value="${esc(co.name[p.id])}" autocomplete="name" maxlength="60"><small id="c-name-err-${p.id}" class="err"></small></label>
      <label class="field"><span>তাঁর মোবাইল নম্বর</span><input id="c-phone-${p.id}" data-co="phone:${p.id}" type="tel" inputmode="numeric" value="${esc(co.phone[p.id] || '')}" placeholder="01XXXXXXXXX" autocomplete="tel"><small id="c-phone-err-${p.id}" class="err"></small></label>
      ${needsLine(p, rows) ? `<label class="field"><span>পুরো ঠিকানা</span><input id="c-line-${p.id}" data-co="line:${p.id}" type="text" value="${esc(co.line[p.id] || '')}" autocomplete="street-address" maxlength="150" placeholder="বাড়ি, রোড, গ্রাম বা মহল্লা"><small id="c-line-err-${p.id}" class="err"></small></label>` : ''}
      ${rows.map((x) => coShopHtml(x, fees[x.id], p)).join('')}
    </section>`;
  }
  function pageCheckout() {
    pruneCart();
    if (!cartCount()) { location.hash = '#/cart'; return ''; }
    const me = window.LHAuth.current('customer');
    if (!me || !me.verified) {
      S.after = '#/checkout';
      return `<a class="back" href="#/cart">‹ কার্টে ফিরুন</a>
        <div class="empty big"><span aria-hidden="true">🔐</span>
        <h1>${me ? 'আগে একাউন্ট ভেরিফাই করুন' : 'অর্ডার দিতে লগইন করুন'}</h1>
        <p>${me ? 'ভেরিফাই না করলে অর্ডার দেওয়া যাবে না।' : 'আপনার কার্ট সেভ থাকবে।'}</p>
        <a class="btn" href="${me ? '#/auth/verify/customer' : '#/auth/customer/login'}">${me ? 'ভেরিফাই করুন' : 'লগইন করুন'}</a></div>`;
    }
    const co = S.co;
    ['name', 'phone', 'line', 'date', 'time', 'note'].forEach((k) => { if (!co[k]) co[k] = {}; });
    let off = 0;
    if (co.offer) {
      try { off = Store.offerQuote(co.offer, me.id, cartSubtotal()).off; } catch (ex) { co.offerErr = ex.message; co.offer = ''; }
    }
    const fees = Store.deliveryQuote();
    return `
      <a class="back" href="#/cart">‹ কার্টে ফিরুন</a>
      <h1 class="page-h">চেকআউট</h1>
      <form id="checkout" class="two" novalidate>
        <div class="stack">
          ${byPlace().map(({ p, rows }) => coPlaceHtml(p, rows, fees, me)).join('')}
          ${payPick(co)}
          ${offerBox(co, off)}
        </div>
        ${summary(cartSubtotal(), feeTotal(), hasAskPrice(), '<button type="submit" class="btn block">অর্ডার দিন</button>', off)}
      </form>`;
  }

  // Cash on delivery or at the shop, or paying online before the order goes. Online needs a bill known now.
  const payOnlineOk = () => !groups().some((x) => x.shop.kind === 'service') && !hasAskPrice();
  const PAY_PICK = [['bkash', '📱', 'বিকাশ', 'অর্ডারের আগে বিকাশে টাকা দিন'], ['nagad', '📱', 'নগদ', 'অর্ডারের আগে নগদে টাকা দিন'], ['card', '💳', 'ডেবিট বা ক্রেডিট কার্ড', 'ভিসা, মাস্টারকার্ড বা অ্যামেক্স']];
  function payPick(co) {
    const delivers = groups().some((x) => x.shop.kind !== 'service' && x.g.mode !== 'pickup');
    const atShop = groups().filter((x) => x.shop.kind === 'service' || x.g.mode === 'pickup');
    const online = payOnlineOk();
    if (!online || !co.pay) co.pay = online && co.pay ? co.pay : 'cash';
    const cashWord = delivers && atShop.length ? 'ক্যাশ অন ডেলিভারি ও দোকানে পেমেন্ট' : delivers ? 'ক্যাশ অন ডেলিভারি' : 'দোকানে পেমেন্ট';
    const cashSub = delivers && atShop.length ? 'বাসায় এলে হাতে পেয়ে, দোকান থেকে নিলে দোকানে টাকা দিন' : delivers ? 'জিনিস হাতে পেয়ে টাকা দিন' : atShop.every((x) => x.shop.kind === 'service') ? 'সেবা শেষে টাকা দিন' : 'দোকানে গিয়ে টাকা দিন';
    const radio = (v, icon, word, sub) => `<label class="pay ${online || v === 'cash' ? '' : 'off'}"><input type="radio" name="pay" data-co="pay" value="${v}" ${co.pay === v ? 'checked' : ''} ${online || v === 'cash' ? '' : 'disabled'}><span><b>${icon} ${word}</b><small>${sub}</small></span></label>`;
    return `<section class="panel pay-pick">
      <h2 class="tight" id="pay-h">কিভাবে টাকা দেবেন?</h2>
      <div role="radiogroup" aria-labelledby="pay-h">${radio('cash', '💵', cashWord, cashSub)}${PAY_PICK.map((x) => radio(...x)).join('')}</div>
      ${online ? '' : '<p class="meta">সেবা বা পরে দাম ঠিক হবে এমন জিনিস থাকলে অনলাইনে টাকা দেওয়া যাবে না।</p>'}
    </section>`;
  }
  // The payment company's own page opens here on the real site. LocalHaat never asks for a PIN, an OTP or a card number.
  const PAY_GATE = {
    bkash: ['বিকাশে টাকা দিন', 'আসল সাইটে এখানে বিকাশের নিজের পাতা খুলবে। নম্বর, কোড ও পিন সেখানেই দেবেন।'],
    nagad: ['নগদে টাকা দিন', 'আসল সাইটে এখানে নগদের নিজের পাতা খুলবে। নম্বর, কোড ও পিন সেখানেই দেবেন।'],
    card: ['কার্ডে টাকা দিন', 'আসল সাইটে এখানে ব্যাংকের নিরাপদ পেমেন্ট পাতা খুলবে। কার্ডের নম্বর সেখানেই দেবেন।']
  };
  function paySheet() {
    const p = S.paying;
    openSheet(`<h2 id="sheet-h">${PAY_GATE[p.method][0]}</h2>
      <p class="pay-amt">${tk(p.amount)}</p>
      <p class="note">${PAY_GATE[p.method][1]}</p>
      <p class="meta">লোকালহাট কখনো আপনার পিন, ওটিপি বা কার্ডের নম্বর চায় না। এটি ডেমো, আসল টাকা কাটা হবে না।</p>
      <button type="button" class="btn block sheet-go" data-action="pay-ok">✓ পেমেন্ট সফল (ডেমো)</button>
      <button type="button" class="btn ghost block" data-action="pay-fail">✕ পেমেন্ট হয়নি (ডেমো)</button>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }
  const trxId = () => Array.from({ length: 10 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
  function afterPlaced(made) {
    S.co = {};
    if (made.length > 1) toast(`${bn(made.length)}টি দোকানে অর্ডার হয়েছে`);
    location.hash = made.length === 1 ? '#/track/' + made[0].code : '#/orders';
  }
  const PAY_DONE = { bkash: '✓ বিকাশে টাকা দেওয়া হয়েছে', nagad: '✓ নগদে টাকা দেওয়া হয়েছে', card: '✓ কার্ডে টাকা দেওয়া হয়েছে' };
  // how the order is paid, for the customer, the agent and the team
  const payText = (o) => (o.paid ? PAY_DONE[o.paid.method] : o.pay === 'cod' ? '💵 ক্যাশ অন ডেলিভারি' : o.pay === 'bus' ? '💵 বাসে নগদ' : o.pay === 'counter' ? '💵 কাউন্টারে নগদ' : '💵 দোকানে পেমেন্ট');
  // another page's online payment, such as a bus ticket: done gets { method, trx } once the payment went through,
  // failed runs when it did not or the page was closed
  function payOnline(method, amount, done, failed) {
    S.paying = { method, amount, done, failed };
    paySheet();
  }

  function offerBox(co, off) {
    const live = D().offers.filter(Store.offerLive);
    if (!live.length && !co.offer) return '';
    return `<section class="panel">
      <h2 class="tight">অফার কোড</h2>
      ${co.offer ? `<p class="good" role="status">✓ <span translate="no">${esc(co.offer)}</span> · ${tk(off)} ছাড় <button type="button" class="inline" data-action="offer-clear">সরান</button></p>`
    : `<div class="offer-row"><input id="c-offer" data-co="offerInput" type="text" maxlength="15" autocapitalize="characters" autocomplete="off" spellcheck="false" aria-label="অফার কোড" placeholder="অফার কোড লিখুন" value="${esc(co.offerInput || '')}"><button type="button" class="btn ghost" data-action="offer-apply">প্রয়োগ করুন</button></div>
      ${co.offerErr ? `<small class="err" role="alert">${esc(co.offerErr)}</small>` : ''}
      <div class="offer-picks">${live.map((of) => `<button type="button" class="chip" data-action="offer-pick" data-code="${esc(of.code)}"><span translate="no">${esc(of.code)}</span> · ${offerOff(of)}</button>`).join('')}</div>`}
    </section>`;
  }
  function applyOffer(code) {
    const me = window.LHAuth.current('customer');
    const co = S.co;
    co.offerErr = '';
    co.offer = '';
    try { co.offer = Store.offerQuote(code, me.id, cartSubtotal()).code; } catch (ex) { co.offerErr = ex.message; }
    route(true);
  }

  /* ---------- orders + tracking ---------- */
  const fmtWhen = (when) => fmtTime(when.replace(' ', 'T'));
  const fmtTime = (at) => new Date(at).toLocaleString(window.LHI18n.lang === 'en' ? 'en-GB' : 'bn-BD', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  function timeline(o) {
    const f = Store.flow(o);
    if (o.status === 'cancelled') {
      const h = o.history[o.history.length - 1];
      return `<p class="cancel-box" role="status"><b>অর্ডার বাতিল হয়েছে</b>${h.note ? `<br>${h.by === 'shop' ? ud(h.note) : esc(h.note)}` : ''}<br><small>${fmtTime(h.at)}</small></p>`;
    }
    const now = f.indexOf(o.status);
    return `<ol class="steps">${f.map((st, i) => {
      const h = o.history.find((x) => x.status === st);
      return `<li class="${i < now || Store.isFinal(o) ? 'done' : i === now ? 'now' : ''}" ${i === now ? 'aria-current="step"' : ''}>
        <span class="dot" aria-hidden="true">${i < now || Store.isFinal(o) ? '✓' : bn(i + 1)}</span>
        <div><b>${Store.label(o, st)}</b><small>${h ? fmtTime(h.at) : 'অপেক্ষায়'}</small></div></li>`;
    }).join('')}</ol>`;
  }
  // Where the delivery man is: his phone's position if it came in the last two minutes. Without one, this demo
  // guesses a point along the way from the time he left, at an easy town speed, and says so.
  const TRIP_KMH = 15;
  const sinceMs = (at) => Date.now() - new Date(at).getTime();
  function riderAt(o) {
    if (o.live && sinceMs(o.live.at) < 120000) return { lat: o.live.lat, lng: o.live.lng, live: true, at: o.live.at };
    const shop = Store.shopById(o.shopId);
    const to = o.recipient;
    const left = o.history.find((h) => h.status === 'out_for_delivery');
    const minutes = Math.max(5, (Map_.km(shop, to) / TRIP_KMH) * 60);
    const f = Math.min(0.95, Math.max(0, sinceMs(left ? left.at : o.createdAt) / (minutes * 60000)));
    return { lat: shop.lat + (to.lat - shop.lat) * f, lng: shop.lng + (to.lng - shop.lng) * f, live: false };
  }
  function liveCap(o, pos) {
    const mins = Math.max(1, Math.ceil((Map_.km(pos, o.recipient) / TRIP_KMH) * 60));
    const head = pos.live ? `<b>🛵 লাইভ অবস্থান</b> · <span>${bn(Math.max(0, Math.round(sinceMs(pos.at) / 1000)))}</span> <span>সেকেন্ড আগে</span>`
      : '<b>🛵 ডেমো: আনুমানিক অবস্থান</b><br><span>ডেলিভারি ম্যানের ফোন লোকেশন দিলে আসল অবস্থান দেখাবে।</span>';
    return `${head}<br><span>প্রায়</span> <b>${bn(mins)}</b> <span>মিনিটে পৌঁছাবে</span>`;
  }
  // moves the delivery man on the tracking map without drawing the page again
  function liveTick() {
    const el = $('track-map');
    const o = el && D().orders.find((x) => x.code === el.dataset.code);
    if (!o || o.status !== 'out_for_delivery' || !S.riderMark) { clearInterval(S.liveTimer); S.liveTimer = null; return; }
    const pos = riderAt(o);
    S.riderMark.setLatLng([pos.lat, pos.lng]);
    if ($('live-cap')) $('live-cap').innerHTML = liveCap(o, pos);
  }
  // what decides how the tracking page looks; a new position alone does not change it
  const trackSig = (o) => (o ? [o.status, o.delivery ? o.delivery.phone : '', o.refund ? o.refund.status : '', D().ratings.filter((r) => r.orderCode === o.code).length].join('|') : '');
  function pageTrack(code) {
    const o = D().orders.find((x) => x.code === code);
    if (!o) return pageMissing();
    S.trackSig = trackSig(o);
    const shop = Store.shopById(o.shopId);
    const onWay = o.mode === 'delivery' && !Store.isFinal(o);
    const me = window.LHAuth.current('customer');
    const mine = !!me && me.id === o.customerId;
    // a bus ticket: the code shown on the bus, given back until the bus reaches the passenger's stop
    const bus = o.book === 'bus' && o.bus;
    const busOpen = bus && o.status === 'confirmed' && new Date(o.bus.board) > new Date();
    const busItem = bus && shop && shop.items.find((x) => x.id === o.lines[0].itemId);
    const launch = o.book === 'launch' && o.launch;
    return `
      ${backLink('#/orders', '‹ সব অর্ডার')}
      <section class="track-hero">
        <p>অর্ডার নম্বর</p><h1 translate="no">${bn(o.code)}</h1>
        <p>${ud(o.shopName)} · ${launch ? 'লঞ্চের টিকেট' : bus ? 'বাসের টিকেট' : o.book ? 'বুকিং' : o.mode === 'pickup' ? 'দোকান থেকে নেবেন' : o.mode === 'service' ? 'সেবা' : geo(o.placeLabel)}</p>
        <p class="track-now" role="status">${Store.label(o, o.status)}</p>
      </section>
      <div class="two">
        <div class="stack">
          ${launch ? window.LHLaunch.ticketPanel(o, mine) : ''}
          ${busOpen ? `<section class="panel pin-card">
            <h2 class="tight">টিকেটের কোড</h2>
            <p class="pin-code" translate="no">${bn(o.pin)}</p>
            <p class="meta">বাসে ওঠার সময় সুপারভাইজারকে এই কোড দিন। অন্যের জন্য কাটলে তাঁকে কোডটি জানিয়ে দিন।</p>
          </section>` : ''}
          <section class="panel">
            <h2 class="tight">${bus || launch ? 'টিকেট এখন কোথায়' : 'অর্ডার এখন কোথায়'}</h2>
            ${timeline(o)}
            ${o.status === 'placed' || busOpen ? `<button type="button" class="btn ghost block" data-action="cancel-order" data-code="${o.code}">${bus ? 'টিকেট বাতিল করুন' : 'অর্ডার বাতিল করুন'}</button>` : ''}
          </section>
          ${busItem ? `<section class="panel"><h2 class="tight">রুটের ম্যাপ</h2><div class="mini-map route-map" data-route="${shop.id}/${busItem.id}" data-from="${o.bus.from}" data-to="${o.bus.to}"></div>
            <details class="stops-box"><summary>স্টপ ও কাউন্টার দেখুন</summary>${Book.stopsHtml(busItem, { from: o.bus.from, to: o.bus.to })}</details></section>` : ''}
          ${o.mode === 'service' ? '' : `<section class="panel"><h2 class="tight">ম্যাপ</h2><div class="mini-map" id="track-map" data-shop="${o.shopId}" data-code="${o.code}" data-lat="${o.recipient.lat}" data-lng="${o.recipient.lng}" data-mode="${o.mode}"></div>
          ${o.status === 'out_for_delivery' ? `<p class="meta map-cap live-cap" id="live-cap" role="status">${liveCap(o, riderAt(o))}</p>` : onWay ? '<p class="meta map-cap">ডেলিভারি ম্যান রওনা হলে ম্যাপে তাঁর অবস্থান দেখা যাবে।</p>' : ''}</section>`}
        </div>
        <aside class="stack bill">
          ${onWay ? `<section class="panel pin-card">
            <h2 class="tight">ডেলিভারি কোড</h2>
            <p class="pin-code" translate="no">${bn(o.pin)}</p>
            <p class="meta">পণ্য বুঝে নিয়ে ডেলিভারি ম্যানকে এই কোড দিন। অন্যের জন্য অর্ডার করলে তাঁকে কোডটি জানিয়ে দিন।</p>
          </section>` : ''}
          ${o.delivery && !Store.isFinal(o) ? `<section class="panel"><h2 class="tight">ডেলিভারি ম্যান</h2><p>🛵 ${ud(o.delivery.name)} · <a class="inline-link" href="#/profile/rider/${Store.hash(o.delivery.phone)}">${Rate.badge('rider', o.delivery.phone, 'নতুন')}</a></p><a class="btn ghost block" href="tel:${esc(o.delivery.phone)}">📞 কল করুন</a></section>` : ''}
          ${o.mode === 'delivery' && !o.delivery && !Store.isFinal(o) && o.status !== 'placed' ? '<section class="panel"><h2 class="tight">ডেলিভারি ম্যান</h2><p>🛵 ডেলিভারি ম্যান খোঁজা হচ্ছে।</p></section>' : ''}
          <section class="panel">
            <h2 class="tight">অর্ডারের বিবরণ</h2>
            ${o.book ? Book.billHtml(o) : `<ul class="mini">${o.lines.map((l) => `<li><span>${bn(l.qty)} × ${ud(l.name)}</span><b>${l.price ? tk(l.price * l.qty) : 'দাম পরে'}</b></li>`).join('')}</ul>
            ${o.when ? `<p class="meta">সময়: ${fmtWhen(o.when)}</p>` : ''}
            ${o.mode === 'service' && !o.fee ? '' : `<div class="sum"><span>ডেলিভারি চার্জ</span><b>${o.fee ? tk(o.fee) : 'নেই'}</b></div>`}
            ${o.discount ? `<div class="sum"><span>অফার ছাড়</span><b>−${tk(o.discount)}</b></div>` : ''}
            <div class="sum total"><span>মোট</span><b>${tk(o.total)}</b></div>`}
            ${o.paid ? `<p class="good">${PAY_DONE[o.paid.method]}</p><p class="meta">ট্রানজেকশন আইডি: <span translate="no">${esc(o.paid.trx)}</span></p>` : `<p class="note">${o.pay === 'cod' ? 'জিনিস হাতে পেয়ে টাকা দিন।' : o.pay === 'bus' ? 'বাসে উঠে সুপারভাইজারকে ভাড়া দিন।' : o.pay === 'counter' ? 'কাউন্টারে নগদ দেওয়া হয়েছে।' : 'দোকানে টাকা দিন।'}</p>`}
            ${shop ? `<div class="contact"><a class="btn ghost" href="tel:${esc(shop.phone)}">📞 দোকানে কল</a><a class="btn ghost" href="#/chat/${shop.id}">💬 চ্যাট</a></div>` : ''}
          </section>
          ${mine ? Rate.panel(o) : ''}
          ${mine ? Care.refundPanel(o) : ''}
          ${mine ? `<a class="more" href="#/support/customer/new/${o.code}">🛟 সমস্যা হলে সাপোর্টে জানান</a>` : ''}
          ${mine && D().helpline.phone ? `<a class="more" href="tel:${esc(D().helpline.phone)}">📞 লোকালহাট হেল্পলাইন, ২৪ ঘণ্টা</a>` : ''}
        </aside>
      </div>`;
  }
  function pageOrders() {
    const me = window.LHAuth.current('customer');
    if (!me) {
      return `<div class="empty big"><span aria-hidden="true">📦</span><h1>অর্ডার দেখতে লগইন করুন</h1><a class="btn" href="#/auth/customer/login">লগইন করুন</a></div>`;
    }
    const mine = D().orders.filter((o) => o.customerId === me.id);
    if (!mine.length) {
      return `<div class="empty big"><span aria-hidden="true">📦</span><h1>এখনো কোনো অর্ডার নেই</h1><p>অর্ডার দিলে এখানে নম্বরসহ দেখা যাবে।</p><a class="btn" href="#/">দোকান দেখুন</a></div>`;
    }
    return `<h1 class="page-h">আপনার অর্ডার</h1><div class="stack">
      ${mine.map((o) => `<a class="panel order" href="#/track/${o.code}"><span><b>${ud(o.shopName)}</b><small><span translate="no">${bn(o.code)}</span> · ${tk(o.total)}</small></span><span class="order-tags"><span class="tag ${Store.isFinal(o) ? '' : 'ok'}">${Store.label(o, o.status)}</span>${Rate.unrated(o) ? '<span class="tag rate-ask">⭐ রেটিং দিন</span>' : ''}</span></a>`).join('')}
    </div>`;
  }
  function pageMissing() {
    return `<div class="empty big"><span aria-hidden="true">🧭</span><h1>পাতাটি পাওয়া যায়নি</h1><a class="btn" href="#/">হোমে ফিরুন</a></div>`;
  }

  /* ---------- sheets + toast ---------- */
  let sheetReturn = null;
  function openSheet(html) {
    sheetReturn = document.activeElement;
    $('sheet').innerHTML = `<div class="scrim" data-action="close-sheet"></div>
      <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-h" tabindex="-1">${html}</div>`;
    document.querySelector('.sheet').focus();
  }
  function closeSheet() {
    $('sheet').innerHTML = '';
    if (sheetReturn && sheetReturn.isConnected) sheetReturn.focus();
  }
  // Bangla is found anywhere in a name, Latin letters through the English names. A district brings all its upazilas.
  function areaHits(t, saved) {
    const shops = liveShops();
    // a place renamed to the national portal's spelling is still found by its older one
    const old = Object.entries(window.LH_GEO_OLD || {});
    const has = (name) => name.includes(t) || (window.LH_GEO_EN[name] || '').toLowerCase().includes(t) || old.some(([was, now]) => now === name && was.includes(t));
    const rows = [];
    Object.entries(window.LH_GEO).forEach(([zila, list]) => {
      const inZila = has(zila);
      list.forEach((area) => {
        if (!inZila && !has(area)) return;
        if (saved.some((p) => p.zila === zila && p.area === area)) return;
        rows.push({ zila, area, near: has(area) ? 0 : 1, n: shops.filter((x) => sameArea(x, { zila, area })).length });
      });
    });
    return rows.sort((x, y) => x.near - y.near || y.n - x.n || x.area.localeCompare(y.area, 'bn'));
  }
  function placeRows(q) {
    const t = q.normalize('NFC').trim().toLowerCase();
    const saved = allPlaces();
    const words = (p) => [p.label, p.line, p.area, p.zila, window.LH_GEO_EN[p.area] || '', window.LH_GEO_EN[p.zila] || ''].join(' ').normalize('NFC').toLowerCase();
    const mine = t ? saved.filter((p) => words(p).includes(t)) : saved;
    const found = t ? areaHits(t, saved) : [];
    if (!mine.length && !found.length) return '<p class="meta place-none">এই নামে কোনো এলাকা পাওয়া যায়নি।</p>';
    return mine.map((p) => `<button type="button" class="addr ${p.id === D().place ? 'on' : ''}" aria-pressed="${p.id === D().place}" data-action="pick-place" data-id="${p.id}">
        <span aria-hidden="true">${p.icon}</span><span><b>${placeName(p)}</b><small>${placeLine(p)}</small></span>${p.id === D().place ? '<em>✓</em>' : ''}</button>`).join('') +
      found.slice(0, 30).map((r) => `<button type="button" class="addr" data-action="pick-area" data-zila="${esc(r.zila)}" data-area="${esc(r.area)}">
        <span aria-hidden="true">📍</span><span><b>${geo(r.area)}</b><small>${geo(r.zila)} · ${r.n ? `${bn(r.n)}টি দোকান ও সেবা` : 'এখনো কোনো দোকান নেই'}</small></span></button>`).join('') +
      (found.length > 30 ? '<p class="meta place-none">আরও নির্দিষ্ট করে লিখুন।</p>' : '');
  }
  function placesSheet() {
    openSheet(`<h2 id="sheet-h">কার ঠিকানায় পাঠাবেন?</h2>
      <p class="meta">ঠিকানা বদলালে সেই এলাকার দোকান দেখাবে।</p>
      <label class="place-search"><span class="sr">এলাকা খুঁজুন</span><span aria-hidden="true" class="s-ico">⌕</span><input id="place-q" type="search" maxlength="60" autocomplete="off" placeholder="জেলা, উপজেলা বা থানা খুঁজুন"></label>
      <div id="place-results" aria-live="polite">${placeRows('')}</div>
      <button type="button" class="btn ghost block" data-action="demo" data-msg="আসল অ্যাপে নতুন ঠিকানা যোগ করা যাবে">+ নতুন ঠিকানা</button>
      <button type="button" class="link" data-action="close-sheet">বন্ধ করুন</button>`);
  }
  function catsSheet() {
    openSheet(`<h2 id="sheet-h">সব ক্যাটাগরি</h2>
      <p class="meta">আপনার এলাকায় যা খুঁজছেন, বেছে নিন।</p>
      <div class="cat-list">
        ${cats.map((c) => `<button type="button" class="cat-row ${S.cat === c.id ? 'on' : ''}" aria-pressed="${S.cat === c.id}" data-action="pick-cat" data-id="${c.id}">
          <span class="cat-ico" style="--tint:${c.tint}" aria-hidden="true">${c.icon}</span>
          <span><b>${esc(c.label)}</b><small>${(c.groups ? c.groups.map((g) => g.name) : c.examples).map(esc).join(', ')}</small></span></button>`).join('')}
      </div>
      <button type="button" class="link" data-action="close-sheet">বন্ধ করুন</button>`);
  }
  function settingsSheet() {
    const theme = document.documentElement.dataset.theme;
    openSheet(`<h2 id="sheet-h">প্রোটোটাইপের সেটিংস</h2>
      <p class="meta">এটি প্রোটোটাইপ। সব তথ্য শুধু এই ব্রাউজারে থাকে। আসল পাসওয়ার্ড দেবেন না। আসল এসএমএস বা পেমেন্ট নেই।</p>
      <div class="seg two-seg" role="group" aria-label="রঙের থিম">
        <button type="button" class="${theme === 'morich' ? 'on' : ''}" data-action="theme" data-theme-id="morich">মরিচ</button>
        <button type="button" class="${theme === 'navy' ? 'on' : ''}" data-action="theme" data-theme-id="navy">নেভি</button>
      </div>
      <button type="button" class="btn ghost block" data-action="reset-ask">ডেমো তথ্য নতুন করে শুরু করুন</button>
      <button type="button" class="link" data-action="close-sheet">বন্ধ করুন</button>`);
  }
  let toastTimer;
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- router ---------- */
  function route(keepScroll) {
    const nowIn = routeSide();
    if (S.viewAs && nowIn !== 'customer') setView(null);
    if (nowIn !== 'customer') S.panel = nowIn;
    else if (!SHARED.test(location.hash)) S.panel = null;
    const parts = (location.hash || '#/').slice(2).split('/');
    const page = parts[0];
    clearInterval(S.liveTimer);
    S.liveTimer = null;
    S.riderMark = null;
    Map_.destroy();
    // re-rendering must not jump sideways rails back to the start
    const keep = keepScroll ? ['.rail', '#sub-chips', '#sub-chips2'].map((sel) => { const el = document.querySelector(sel); return [sel, el ? el.scrollLeft : 0]; }) : [];
    let html;
    if (S.viewAs && PRIVATE.test(location.hash)) html = pageViewOnly();
    else if (!page) html = pageHome();
    else if (page === 'map') html = pageMap();
    else if (page === 'shop') html = pageShop(parts[1]);
    else if (page === 'cart') html = pageCart();
    else if (page === 'checkout') html = pageCheckout();
    else if (page === 'track') html = pageTrack(parts[1]);
    else if (page === 'orders') html = pageOrders();
    else if (page === 'auth') html = window.LHAuth.page(parts.slice(1));
    else if (page === 'account') html = window.LHAuth.account(parts[1] || 'customer');
    else if (page === 'owner') html = window.LHOwner.page(parts.slice(1));
    else if (page === 'rider') html = window.LHRider.page(parts.slice(1));
    else if (page === 'admin') html = window.LHAdmin.page(parts.slice(1));
    else if (page === 'support') html = Care.page(parts.slice(1));
    else if (page === 'profile') html = parts[1] === 'rider' ? Rate.riderProfile(parts[2]) : null;
    else if (page === 'book') html = Book.bookPage(parts[1], parts[2], parts[3], parts[4]);
    else if (page === 'bus') html = parts[1] ? null : Book.busPage();
    else if (page === 'launch') html = parts[1] ? window.LHLaunch.tripPage(parts[1], parts[2]) : window.LHLaunch.searchPage();
    else if (page === 'chat') html = Book.customerChat(parts[1]);
    else html = pageMissing();
    if (html === null) html = pageMissing();
    $('main').innerHTML = html;
    document.body.dataset.page = page || 'home';
    document.body.dataset.side = sideOf();
    document.body.classList.toggle('viewing', !!S.viewAs);
    document.body.classList.toggle('searching', !page && !!S.q.trim());
    keep.forEach(([sel, left]) => { const el = document.querySelector(sel); if (el) el.scrollLeft = left; });
    renderStrip();
    renderTop();
    renderTabs();
    if (S.focusQ && $('q')) { $('q').focus(); $('q').setSelectionRange(S.q.length, S.q.length); }
    S.focusQ = false;
    if (page === 'map') mountMap();
    adsStart();
    const sm = $('shop-map');
    if (sm) { const s = Store.shopById(sm.dataset.shop); Map_.mini(sm, [{ lat: s.lat, lng: s.lng, icon: s.icon }]); }
    const tm = $('track-map');
    if (tm) {
      const s = Store.shopById(tm.dataset.shop);
      const pts = [{ lat: s.lat, lng: s.lng, icon: s.icon }];
      if (tm.dataset.mode === 'delivery') pts.push({ lat: +tm.dataset.lat, lng: +tm.dataset.lng, icon: '🏠' });
      const map = Map_.mini(tm, pts);
      const o = D().orders.find((x) => x.code === tm.dataset.code);
      if (o && o.status === 'out_for_delivery') {
        S.riderMark = Map_.mover(map, Object.assign(riderAt(o), { icon: o.big ? '🚚' : '🛵' }));
        S.liveTimer = setInterval(liveTick, 5000);
      }
    }
    window.LHAuth.mount();
    window.LHRider.mount();
    window.LHOwner.mount();
    Book.mount();
    window.LHLaunch.mount();
    Care.mount();
    if (window.LHI18n.lang === 'en') window.LHI18n.apply();
    if (!keepScroll) window.scrollTo(0, 0);
    tellNew();
  }

  function setTheme(id) {
    document.documentElement.dataset.theme = id;
    document.querySelector('meta[name=theme-color]').content = id === 'navy' ? '#1E2761' : '#D63A22';
    document.querySelectorAll('[data-theme-id]').forEach((b) => b.classList.toggle('on', b.dataset.themeId === id));
    try { localStorage.setItem('lh-preview-theme', id); } catch (e) { /* private mode */ }
  }
  function addLine(shopId, itemId) {
    const groupsOf = cart().groups;
    if (!groupsOf[shopId]) groupsOf[shopId] = { lines: {}, place: D().place, mode: 'delivery' };
    groupsOf[shopId].lines[itemId] = (groupsOf[shopId].lines[itemId] || 0) + 1;
    Store.save();
  }
  function afterCart() {
    if (document.body.dataset.page === 'map') { refreshMap(false); renderTop(); renderTabs(); } else route(true);
  }
  function goToPlace(id, keepQ) {
    D().place = id; Store.save();
    S.cat = null; S.sub = null; S.mapSub = null; S.filter = 'all'; if (!keepQ) S.q = ''; S.gps = null; S.mapSel = null; S.mapAt = null; S.mapQ = '';
    closeSheet(); route(); toast(keep(place().label) + ' এলাকার দোকান দেখাচ্ছে');
  }
  function goToShops() {
    if (location.hash && location.hash !== '#/') { location.hash = '#/'; return; }
    route(true);
    const el = $('shops');
    if (el) el.scrollIntoView({ block: 'start' });
  }

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const d = el.dataset;
    // links and buttons inside a map card keep their own action
    if (d.action === 'map-pick' && e.target.closest('a, button')) return;
    switch (d.action) {
      case 'go-home':
        // the home of the side it was pressed on, with nothing selected, also when already there (the hash does not change then)
        S.cat = null; S.sub = null; S.filter = 'all'; S.q = ''; S.mapCat = null; S.mapSub = null; S.mapSel = null;
        if ((location.hash || '#/') === homeOfSide(sideOf())) { e.preventDefault(); route(); }
        break;
      case 'view-as':
        // the link opens the shop page as customers see it; "exit" comes back to this panel page
        setView({ back: location.hash || '#/' });
        break;
      case 'view-exit': {
        e.preventDefault();
        const back = S.viewAs ? S.viewAs.back : '#/';
        setView(null);
        if (location.hash === back) route(); else location.hash = back;
        break;
      }
      case 'lang':
        window.LHI18n.set(window.LHI18n.lang === 'bn' ? 'en' : 'bn');
        route(true);
        break;
      case 'theme': setTheme(d.themeId); break;
      case 'open-settings': settingsSheet(); break;
      case 'reset-ask':
        openSheet(`<h2 id="sheet-h">সব ডেমো তথ্য মুছবেন?</h2><p>অর্ডার, নতুন একাউন্ট ও পণ্যের বদল মুছে যাবে।</p>
          <button type="button" class="btn block" data-action="reset">হ্যাঁ, নতুন করে শুরু করুন</button>
          <button type="button" class="link" data-action="close-sheet">থাক</button>`);
        break;
      case 'reset': Store.reset(); S.co = {}; closeSheet(); location.hash = '#/'; route(); toast('ডেমো তথ্য নতুন করে শুরু হয়েছে'); break;
      case 'open-places': placesSheet(); break;
      case 'open-cats': catsSheet(); break;
      case 'close-sheet': { const p = S.paying; S.paying = null; closeSheet(); if (p && p.failed) p.failed(); break; }
      case 'ad-go': { const box = $('ads'); if (box) box.scrollTo({ left: Number(d.i) * box.clientWidth, behavior: 'smooth' }); break; }
      case 'offer-apply': applyOffer(S.co.offerInput || ''); break;
      case 'offer-pick': S.co.offerInput = d.code; applyOffer(d.code); break;
      case 'offer-clear': S.co.offer = ''; S.co.offerInput = ''; S.co.offerErr = ''; route(true); break;
      case 'pick-area':
        try { goToPlace(Store.addAreaPlace(d.zila, d.area).id); } catch (ex) { toast(ex.message); }
        break;
      case 'pick-place': goToPlace(d.id, d.keepq); break;
      case 'filter':
        S.filter = S.filter === d.id && d.id !== 'all' ? 'all' : d.id;
        if (el.classList.contains('tile')) goToShops(); else route(true);
        break;
      case 'cat':
        S.cat = S.cat === d.id ? null : d.id;
        S.sub = null;
        route(true);
        if ($('sub-chips')) $('sub-chips').scrollLeft = 0;
        break;
      case 'sub':
        S.sub = d.id || null;
        route(true);
        break;
      case 'pick-cat': {
        S.cat = d.id;
        S.sub = null;
        closeSheet();
        route(true);
        const on = document.querySelector('.cat.on');
        if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
        $('cat-sec').scrollIntoView({ block: 'start' });
        break;
      }
      case 'clear': S.cat = null; S.sub = null; S.filter = 'all'; S.q = ''; route(true); break;
      case 'map-cat': {
        const left = el.parentNode.scrollLeft;
        S.mapCat = d.id || null;
        S.mapSub = null;
        $('map-subs').scrollLeft = 0;
        el.parentNode.querySelectorAll('.chip').forEach((c) => { const on = (c.dataset.id || null) === S.mapCat; c.classList.toggle('on', on); c.setAttribute('aria-pressed', on); });
        el.parentNode.scrollLeft = left;
        refreshMap(true);
        break;
      }
      case 'map-sub':
        S.mapSub = d.id || null;
        refreshMap(true);
        break;
      case 'map-clear':
        S.mapCat = null; S.mapSub = null; S.q = ''; route(true);
        break;
      case 'map-pick': pickOnMap(d.id, false); break;
      case 'map-sort':
        S.mapSort = d.id;
        document.querySelectorAll('[data-action=map-sort]').forEach((b) => { b.classList.toggle('on', b === el); b.setAttribute('aria-pressed', b === el); });
        refreshMap(false);
        break;
      case 'map-area': mapGoToArea(d.zila, d.area); break;
      case 'map-hit': { const r = mapHits[d.i]; if (r) setMapAt(r.lat, r.lng, ud(r.name)); break; }
      case 'map-at-clear': clearMapAt(); refreshMap(true); $('map-q').focus(); break;
      case 'map-view':
        S.mapView = S.mapView === 'map' ? 'list' : 'map';
        $('mp').className = 'mp is-' + S.mapView + (S.mapCat ? ' has-subs' : '');
        el.textContent = S.mapView === 'map' ? '☰ তালিকা দেখুন' : '🗺️ ম্যাপ দেখুন';
        Map_.resize();
        break;
      case 'gps':
        if (!navigator.geolocation) { toast('এই ব্রাউজারে GPS নেই'); break; }
        toast('আপনার অবস্থান খোঁজা হচ্ছে');
        navigator.geolocation.getCurrentPosition((p) => {
          clearMapAt();
          S.gps = { lat: p.coords.latitude, lng: p.coords.longitude };
          refreshMap(true);
        }, () => toast('অবস্থান পাওয়া যায়নি। ব্রাউজারে অনুমতি দিন।'), { timeout: 10000 });
        break;
      case 'add': {
        if (S.viewAs) { toast('দেখার মোডে কার্টে যোগ করা যায় না'); break; }
        const shop = Store.shopById(d.shop);
        const it = shop && itemById(shop, d.item);
        if (!it || it.book || !it.available || !Store.canBook(shop)) { toast('এই পণ্য এখন পাওয়া যাচ্ছে না'); break; }
        addLine(d.shop, d.item);
        if (['map', 'chat'].includes(document.body.dataset.page)) toast(keep(it.name) + ' কার্টে যোগ হয়েছে');
        afterCart();
        break;
      }
      case 'inc': cart().groups[d.shop].lines[d.item]++; Store.save(); route(true); break;
      case 'dec': {
        const g = cart().groups[d.shop];
        if (--g.lines[d.item] <= 0) delete g.lines[d.item];
        if (!Object.keys(g.lines).length) delete cart().groups[d.shop];
        Store.save();
        route(true);
        break;
      }
      case 'cancel-order':
        openSheet(`<h2 id="sheet-h">অর্ডার বাতিল করবেন?</h2><p>দোকান এখনো গ্রহণ করেনি, তাই এখন বাতিল করা যাবে।</p>
          <button type="button" class="btn block" data-action="cancel-yes" data-code="${d.code}">হ্যাঁ, বাতিল করুন</button>
          <button type="button" class="link" data-action="close-sheet">না, থাক</button>`);
        break;
      case 'cancel-yes':
        try { Store.cancel(d.code, 'customer', 'গ্রাহক বাতিল করেছেন'); toast('অর্ডার বাতিল হয়েছে'); } catch (ex) { toast(ex.message); }
        closeSheet(); route(true);
        break;
      case 'to-info':
        e.preventDefault();
        $('shop-info').scrollIntoView({ behavior: 'smooth', block: 'start' });
        break;
      case 'demo': toast(d.msg); break;
      case 'pay-ok': {
        const p = S.paying;
        S.paying = null;
        closeSheet();
        if (!p) break;
        if (p.done) { p.done({ method: p.method, trx: trxId() }); break; }
        try { afterPlaced(Store.placeOrders(window.LHAuth.current('customer').id, p.details, p.offer, { method: p.method, trx: trxId() })); } catch (ex) { toast(ex.message); route(true); }
        break;
      }
      case 'pay-fail': { const p = S.paying; S.paying = null; closeSheet(); if (p && p.failed) p.failed(); } toast('পেমেন্ট হয়নি, কোনো টাকা কাটা হয়নি। আবার চেষ্টা করুন বা হাতে টাকা দিন।'); break;
      case 'open-notes': notesSheet(); break;
      case 'push-on':
        if ('Notification' in window) Notification.requestPermission().then(() => notesSheet(), () => notesSheet());
        break;
    }
  });

  document.addEventListener('change', (e) => {
    const d = e.target.dataset || {};
    const g = cart().groups[d.cartPlace || d.cartMode];
    if (!g) return;
    if (d.cartPlace) g.place = e.target.value; else g.mode = e.target.value;
    Store.save();
    route(true);
  });
  document.addEventListener('input', (e) => {
    if (e.target.id === 'map-q') { S.mapQ = e.target.value; $('map-q-x').hidden = !S.mapQ; mapAsk += 1; mapSuggest(S.mapQ); return; }
    if (e.target.id === 'place-q') { $('place-results').innerHTML = placeRows(e.target.value); return; }
    const k = e.target.dataset && e.target.dataset.co;
    if (k) {
      const [key, part] = k.split(':');
      if (part) { if (!S.co[key]) S.co[key] = {}; S.co[key][part] = e.target.value; } else S.co[key] = e.target.value;
      const err = e.target.parentElement.querySelector('.err');
      if (err) err.textContent = '';
      if ($('c-when-err-' + part)) $('c-when-err-' + part).textContent = '';
      return;
    }
    if (e.target.id !== 'q') return;
    S.q = e.target.value;
    if (document.body.dataset.page === 'map') { S.mapSel = null; refreshMap(true); return; }
    if (document.body.dataset.page === 'home') { refreshSearch(); return; }
    // typing on another page opens the results on home
    if (S.q.trim()) { S.focusQ = true; location.hash = '#/'; }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && $('sheet').innerHTML) closeSheet();
    if (e.key === 'Escape' && e.target.id === 'map-q') mapFound('');
    if (e.key === 'Enter' && e.target.id === 'place-q') { const first = document.querySelector('#place-results button'); if (first) first.click(); return; }
    if (e.key === 'Enter' && e.target.id === 'c-offer') { e.preventDefault(); applyOffer(S.co.offerInput || ''); return; }
    if (e.key === 'Enter' && e.target.id === 'q') {
      if (document.body.dataset.page === 'map') return;
      e.target.blur();
      window.scrollTo(0, 0);
    }
  });
  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'checkout') return;
    e.preventDefault();
    const co = S.co;
    let first = null;
    const bad = (id, msg, focus) => { $(id).textContent = msg; if (!first) first = $(focus); };
    const phoneOf = (v) => (v || '').trim().replace(/[০-৯]/g, (c) => DIGITS.indexOf(c)).replace(/[\s-]/g, '');
    byPlace().forEach(({ p, rows }) => {
      if (needsLine(p, rows) && (co.line[p.id] || '').trim().length < 5) bad('c-line-err-' + p.id, 'পুরো ঠিকানা লিখুন', 'c-line-' + p.id);
      if (!(co.name[p.id] || '').trim()) bad('c-name-err-' + p.id, 'যিনি নেবেন তাঁর নাম লিখুন।', 'c-name-' + p.id);
      if (!/^01[3-9]\d{8}$/.test(phoneOf(co.phone[p.id]))) bad('c-phone-err-' + p.id, '১১ সংখ্যার মোবাইল নম্বর লিখুন, যেমন 017XXXXXXXX।', 'c-phone-' + p.id);
    });
    const details = {};
    groups().forEach((x) => {
      const p = placeOfGroup(x.g);
      let when = '';
      const date = co.date[x.id];
      const time = co.time[x.id];
      // a service always needs a time; goods need one only for later, or when the shop is closed now
      // a shop the agent closed for now is refused by the store below, with the reason
      if (Store.canBook(x.shop) && (x.shop.kind === 'service' || date || time || !Store.openNow(x.shop))) {
        if (!date || !time) bad('c-when-err-' + x.id, 'তারিখ ও সময় দিন।', 'c-date-' + x.id);
        else if (new Date(date + 'T' + time) < new Date()) bad('c-when-err-' + x.id, 'এই সময় পার হয়ে গেছে, পরের কোনো সময় দিন', 'c-date-' + x.id);
        else if (!Store.openAt(x.shop, new Date(date + 'T' + time))) bad('c-when-err-' + x.id, 'ওই সময় দোকান বন্ধ থাকে, খোলার সময়ের মধ্যে দিন', 'c-date-' + x.id);
        else when = date + ' ' + time;
      }
      details[x.id] = { placeLabel: p.label, when, note: (co.note[x.id] || '').trim(), recipient: { name: (co.name[p.id] || '').trim(), phone: phoneOf(co.phone[p.id]), line: p.custom && (co.line[p.id] || '').trim() ? co.line[p.id].trim() + ', ' + p.line : p.line, lat: p.lat, lng: p.lng } };
    });
    if (first) { first.focus(); return; }
    const who = window.LHAuth.current('customer').id;
    const method = co.pay && co.pay !== 'cash' ? co.pay : '';
    try {
      // paying online: everything is checked before the payment page opens, the orders go once it is paid
      if (method) {
        S.paying = { details, offer: co.offer || '', method, amount: Store.checkOrders(who, details, co.offer || '', method) };
        paySheet();
        return;
      }
      afterPlaced(Store.placeOrders(who, details, co.offer || ''));
    } catch (ex) { toast(ex.message); route(true); }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id !== 'map-search') return;
    e.preventDefault();
    const q = $('map-q').value.trim();
    if (q.length >= 2) mapSearch(q);
  });
  document.addEventListener('click', (e) => {
    if ($('map-found') && !e.target.closest('#map-search')) mapFound('');
  });

  /* ---------- rows of chips ---------- */
  // Touch scrolls them already. They hide their scrollbar, so a mouse also gets the wheel and a drag.
  const ROWS = '.mp-chips, .chips, .rail';
  const canScroll = (row) => row.scrollWidth > row.clientWidth + 1;
  document.addEventListener('wheel', (e) => {
    const row = e.target.closest && e.target.closest(ROWS);
    if (!row || !canScroll(row) || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const end = row.scrollWidth - row.clientWidth;
    if ((e.deltaY < 0 && row.scrollLeft <= 0) || (e.deltaY > 0 && row.scrollLeft >= end - 1)) return;
    row.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });
  let rowDrag = null;
  document.addEventListener('pointerdown', (e) => {
    const row = e.pointerType === 'mouse' && e.button === 0 && e.target.closest && e.target.closest(ROWS);
    if (row && canScroll(row)) rowDrag = { row, x: e.clientX, left: row.scrollLeft, moved: false };
  });
  document.addEventListener('pointermove', (e) => {
    if (!rowDrag) return;
    const dx = e.clientX - rowDrag.x;
    if (Math.abs(dx) > 4) rowDrag.moved = true;
    if (rowDrag.moved) { rowDrag.row.scrollLeft = rowDrag.left - dx; rowDrag.row.classList.add('dragging'); }
  });
  document.addEventListener('pointerup', () => {
    if (!rowDrag) return;
    rowDrag.row.classList.remove('dragging');
    // the release after a drag must not press the chip under the pointer
    if (rowDrag.moved) {
      const stop = (ev) => { ev.stopPropagation(); ev.preventDefault(); };
      document.addEventListener('click', stop, { capture: true, once: true });
      setTimeout(() => document.removeEventListener('click', stop, { capture: true }), 50);
    }
    rowDrag = null;
  });

  // a side chip leaves "view as customer", the customer chip too
  document.addEventListener('click', (e) => {
    const a = S.viewAs && e.target.closest('.side-pick a');
    if (!a) return;
    setView(null);
    if (a.getAttribute('href') === (location.hash || '#/')) { e.preventDefault(); route(); }
  }, true);
  window.addEventListener('hashchange', () => { $('sheet').innerHTML = ''; route(); });
  /* ---------- notifications ---------- */
  const NOTE_TEXT = {
    confirmed: '✅ দোকান অর্ডার গ্রহণ করেছে', ready: '📦 পণ্য প্রস্তুত, দোকান থেকে নিয়ে নিন', onway: '🛵 ডেলিভারি ম্যান পণ্য নিয়ে রওনা হয়েছেন',
    done: '🎉 অর্ডার সম্পন্ন হয়েছে', 'trip-late': '⏰ লঞ্চ দেরিতে ছাড়বে', 'cat-ok': '🏷️ নতুন ক্যাটাগরি অনুমোদন হয়েছে', 'cat-no': '🏷️ ক্যাটাগরির অনুরোধ হয়নি', cancelled: '🚫 অর্ডার বাতিল হয়েছে', refund: '↩️ রিফান্ডের সিদ্ধান্ত হয়েছে', support: '🛟 লোকালহাট টিম উত্তর দিয়েছে',
    new: '🔔 নতুন অর্ডার এসেছে', booked: '🔔 নতুন বুকিং এসেছে', rated: '⭐ নতুন রেটিং পেয়েছেন'
  };
  function noteInfo(n, side) {
    if (n.kind === 'support') return { title: NOTE_TEXT.support, sub: '', href: `#/support/${side}/t/${n.code}` };
    if (n.kind === 'cat-ok' || n.kind === 'cat-no') { const a = D().catAsks.find((x) => x.id === n.code); return { title: NOTE_TEXT[n.kind], sub: a ? esc(a.sub) : '', href: '#/owner/shop' }; }
    const o = D().orders.find((x) => x.code === n.code);
    const title = side === 'owner' && n.kind === 'cancelled' ? '🚫 গ্রাহক অর্ডার বাতিল করেছেন' : o && o.book && n.kind === 'confirmed' ? '✅ বুকিং নিশ্চিত হয়েছে' : NOTE_TEXT[n.kind] || '🔔';
    const sub = o ? `${side === 'owner' ? ud(o.recipient.name) : ud(o.shopName)} · <span translate="no">#${bn(o.code)}</span>` : '';
    return { title, sub, href: side === 'owner' ? '#/owner' : '#/track/' + n.code };
  }
  function pushBox() {
    if (!('Notification' in window)) return '<p class="meta">এই ব্রাউজারে ফোনের নোটিফিকেশন নেই।</p>';
    if (Notification.permission === 'granted') return '<p class="good">✓ ফোনে নোটিফিকেশন চালু আছে</p>';
    if (Notification.permission === 'denied') return '<p class="meta">ব্রাউজারে নোটিফিকেশন বন্ধ করা আছে, ব্রাউজারের সেটিংস থেকে চালু করুন।</p>';
    return '<button type="button" class="btn ghost block" data-action="push-on">🔔 ফোনে নোটিফিকেশন চালু করুন</button>';
  }
  function notesSheet() {
    const side = sideOf();
    const me = window.LHAuth.current(side);
    if (!me) return;
    const list = Store.notesFor(me.id).slice(0, 30);
    const fresh = new Set(list.filter((n) => !n.seen).map((n) => n.id));
    Store.notesSeen(me.id);
    openSheet(`<h2 id="sheet-h">নোটিফিকেশন</h2>
      ${pushBox()}
      <p class="meta gap-b">প্রোটোটাইপে পাতা খোলা থাকলে আসে। আসল সাইটে অ্যাপ বন্ধ থাকলেও ফোনে আসবে, জরুরি খবর এসএমএসেও।</p>
      ${list.length ? `<ul class="notes">${list.map((n) => { const x = noteInfo(n, side); return `<li class="${fresh.has(n.id) ? 'new' : ''}"><a href="${x.href}"><b>${x.title}</b><small>${x.sub ? x.sub + ' · ' : ''}${fmtTime(n.at)}</small></a></li>`; }).join('')}</ul>` : '<p class="meta">এখনো কোনো নোটিফিকেশন নেই।</p>'}
      <button type="button" class="link" data-action="close-sheet">বন্ধ করুন</button>`);
    renderTop();
  }
  // Something new for the person in this tab, from another tab: the phone's own notification when the page is
  // hidden and the browser allows it, else a toast. The real app sends a push from the server instead.
  let told = null;
  function tellNew() {
    const side = sideOf();
    const me = S.viewAs ? null : window.LHAuth.current(side);
    let now = [];
    if (me && (side === 'customer' || side === 'owner')) now = Store.notesFor(me.id).filter((n) => !n.seen).map((n) => ({ id: n.id, title: noteInfo(n, side).title }));
    else if (me && side === 'delivery') now = Store.riderNotes(me.contact).map((n) => ({ id: n.id, title: window.LHRider.noteTitle(n.kind) }));
    const who = me ? side + me.id : '';
    if (!told || told.who !== who) { told = { who, ids: new Set(now.map((x) => x.id)) }; return; }
    const add = now.filter((x) => !told.ids.has(x.id));
    add.forEach((x) => told.ids.add(x.id));
    if (!add.length) return;
    const word = (s) => (window.LHI18n.lang === 'en' ? window.LHI18n.tr(s) : s);
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      add.forEach((x) => { try { new Notification(word(x.title), { body: word('লোকালহাট'), tag: x.id }); } catch (ex) { /* some phones allow it only from a service worker */ } });
    } else toast(add[0].title);
  }

  // another tab changed the data: an order moved on the owner or delivery side
  window.addEventListener('storage', (e) => {
    if (e.key !== Store.KEY) return;
    Store.reload();
    tellNew();
    // the delivery man's phone sent a new position: move him, keep the page
    if (document.body.dataset.page === 'track') {
      const el = $('track-map');
      const o = el && D().orders.find((x) => x.code === el.dataset.code);
      if (o && trackSig(o) === S.trackSig) {
        liveTick();
        if (!$('top').contains(document.activeElement)) renderTop();
        renderTabs();
        return;
      }
    }
    if (Book.refresh() || Care.refresh()) { renderTabs(); return; }
    const a = document.activeElement;
    const typing = a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName);
    if (typing || $('sheet').innerHTML || document.body.dataset.page === 'map') { renderTabs(); return; }
    route(true);
  });
  window.addEventListener('resize', () => Map_.resize());
  window.addEventListener('lh-save-failed', () => toast('ব্রাউজারের জায়গা শেষ। কিছু ছবি মুছে আবার চেষ্টা করুন।'));

  window.LHUI = { viewing: () => !!S.viewAs, offerOff, payOnline, matchItems, sameArea, zilaOptions: (sel) => Object.keys(window.LH_GEO).map((z) => `<option value="${z}" ${sel === z ? 'selected' : ''}>${geo(z)}</option>`).join(''), upazilaOptions: (z) => (Object.hasOwn(window.LH_GEO, z || '') ? window.LH_GEO[z] : []).map((u) => `<option value="${esc(window.LHI18n.geoText(u))}"></option>`).join(''), geo, placeName, placeLine, payText, kmText, buyFor: (s, it) => buyHtml(s, it, inCartOf(s)), fmtWhen, place, setAfter: (h) => { S.after = h; }, logoHtml, coverHtml, thumbHtml, esc, ud, keep, bn, tk, toast, route, openSheet, closeSheet, fmtTime, timeline, catById, after: () => { const a = S.after; S.after = null; return a; } };
  window.LHAuth.init(window.LHUI);
  window.LHOwner.init(window.LHUI);
  window.LHRider.init(window.LHUI);
  window.LHAdmin.init(window.LHUI);
  Rate.init(window.LHUI);
  Care.init(window.LHUI);
  Book.init(window.LHUI);
  window.LHLaunch.init(window.LHUI);
  window.LHCats.init(window.LHUI);
  window.LHArea.init(window.LHUI);
  window.LHTeam.init(window.LHUI);

  let saved = 'morich';
  try { saved = localStorage.getItem('lh-preview-theme') || saved; } catch (e) { /* private mode */ }
  setTheme(saved === 'navy' ? 'navy' : 'morich');
  route();
})();

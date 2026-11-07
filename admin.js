// The LocalHaat team's panel: agents (shops and services), delivery men, offers, refunds, support and the settings.
// Each person logs in with their own account and a code (team.js), and sees only the pages and buttons their role allows;
// the store checks the same before any change. Like everything in localStorage this is a demo; the real app checks on the server.
window.LHAdmin = (function () {
  'use strict';
  const Store = window.LHStore;
  let U;
  let shopTab = 'all';
  let refundTab = 'open';
  let ticketTab = 'open';
  let offerDraft = null;
  let adDraft = null;
  const $ = (id) => document.getElementById(id);
  const digits = (s) => String(s).replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c));
  const intOf = (id) => { const raw = digits($(id).value).trim(); return /^\d+$/.test(raw) ? Number(raw) : NaN; };
  const D = () => Store.data;
  const openRefunds = () => D().orders.filter((o) => o.refund && o.refund.status === 'open');
  const waitingTickets = () => D().support.filter((t) => Store.ticketUnread(t, 'team') || (t.callback && !t.callback.done));
  const papersWaiting = () => D().accounts.filter((a) => a.role === 'delivery' && a.kyc && a.kyc.status === 'pending');
  const can = (perm, place) => Store.can(perm, place);
  const chip = (action, id, on, label) => `<button type="button" class="chip ${on ? 'on' : ''}" aria-pressed="${on}" data-admin="${action}" data-id="${id}">${label}</button>`;

  function tabs(link) {
    if (!Store.isAdmin()) return link('#/admin', '🛡️', 'প্যানেল', true);
    const h = location.hash;
    // only the pages this person's role allows, with what waits on each in their own area
    const mineShop = (o) => can('dash', Store.shopById(o.shopId));
    return link('#/admin', '✅', 'কাজ', h === '#/admin' || h.startsWith('#/admin/team') || h.startsWith('#/admin/audit') || h.startsWith('#/admin/order')) +
      (can('shops') ? link('#/admin/shops', '🏪', 'এজেন্ট', h.startsWith('#/admin/shops'), can('cats') ? window.LHCats.openAll().length : 0) : '') +
      (can('riders') ? link('#/admin/riders', '🛵', 'ডেলিভারি ম্যান', h.startsWith('#/admin/riders'), (can('assign') ? D().orders.filter((o) => o.needsRider && !Store.isFinal(o) && can('assign', Store.shopById(o.shopId))).length : 0) + (can('rider.papers') ? papersWaiting().length : 0)) : '') +
      (can('report') ? link('#/admin/report', '📊', 'রিপোর্ট', h.startsWith('#/admin/report')) : '') +
      (can('ads') ? link('#/admin/offers', '📣', 'বিজ্ঞাপন ও অফার', h.startsWith('#/admin/offers')) : '') +
      (can('refunds') ? link('#/admin/refunds', '↩️', 'রিফান্ড', h.startsWith('#/admin/refunds'), openRefunds().filter(mineShop).length) : '') +
      (can('support') ? link('#/admin/support', '🛟', 'সাপোর্ট', h.startsWith('#/admin/support'), waitingTickets().filter((t) => can('support', Store.placeOfTicket(t))).length) : '') +
      (can('settings') ? link('#/admin/fee', '⚙️', 'সেটিং', h.startsWith('#/admin/fee')) : '');
  }

  /* ---------- by division, district and upazila (area.js) ---------- */
  const inPick = (x) => window.LHArea.inPick(x);
  const areaFilter = (all) => window.LHArea.filterHtml(all);
  const byArea = (list, row) => window.LHArea.grouped(list, row);
  function areaSheet(kind, id) {
    const x = kind === 'shop' ? Store.shopById(id) : D().accounts.find((a) => a.id === id);
    U.openSheet(`<h2 id="sheet-h">এলাকা ঠিক করুন</h2><p class="meta">${U.ud(x.name)}</p>
      <form id="ad-area" data-kind="${kind}" data-id="${U.esc(id)}" novalidate>
        <label class="field"><span>জেলা</span><select id="ar-zila"><option value="">বেছে নিন</option>${U.zilaOptions(x.zila)}</select></label>
        <label class="field"><span>উপজেলা / থানা</span><input id="ar-upazila" type="text" maxlength="60" list="ar-list" autocomplete="off" value="${U.esc(window.LHI18n.geoText(x.area || ''))}"><datalist id="ar-list">${U.upazilaOptions(x.zila)}</datalist></label>
        ${kind === 'rider' ? `<label class="field"><span>পুরো ঠিকানা</span><input id="ar-addr" type="text" maxlength="150" autocomplete="off" value="${U.esc(x.addr || '')}"></label>
          <label class="field"><span>কোন বাজারের আন্ডারে</span><input id="ar-market" type="text" maxlength="60" autocomplete="off" value="${U.esc(x.market || '')}"></label>
          <label class="field"><span>পিন থেকে কত দূর পর্যন্ত যাবেন</span><select id="ar-km">${Store.RIDER_KM.map((k) => `<option value="${k}" ${(x.km || 3) === k ? 'selected' : ''}>${U.bn(k)} কিমি</option>`).join('')}</select></label>
          <p class="meta">উপজেলা বদলালে ম্যাপের পিন মুছে যাবে। ডেলিভারি ম্যান নিজের প্যানেল থেকে নতুন পিন দেবেন, ততদিন পুরো উপজেলার কাজ পাবেন।</p>` : ''}
        <small class="err" id="ar-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }

  /* ---------- a shop the team adds ---------- */
  let nsPin = null;
  let nsMap = null;
  // every sub-category a shop can open in, under its category; the ones with their own panel are left out
  const subOptions = (sel) => window.LH.cats.map((c) => {
    const list = c.examples.filter((x) => !Store.ownPanel(x));
    return list.length ? `<optgroup label="${U.esc(c.icon + ' ' + c.label)}">${list.map((x) => `<option value="${U.esc(x)}" ${sel === x ? 'selected' : ''}>${U.esc(x)}</option>`).join('')}</optgroup>` : '';
  }).join('');
  const itemRow = () => `<div class="ns-item"><input data-ns="name" maxlength="80" aria-label="পণ্য বা সেবার নাম" placeholder="নাম, যেমন: মিনিকেট চাল"><input data-ns="unit" maxlength="30" aria-label="একক" placeholder="একক, যেমন: ১ কেজি"><input data-ns="price" inputmode="numeric" maxlength="7" aria-label="দাম (৳)" placeholder="দাম ৳"></div>`;
  const ADDED_WORD = { pending: '🆕 যাচাই বাকি', ok: '✓ অনুমোদিত', no: 'বাতিল হয়েছে' };
  function newShopPage() {
    const me = Store.teamMe();
    const zilas = me.role === 'division' ? (window.LH_DIV[me.division] || []) : Object.keys(window.LH_GEO);
    const mine = D().shops.filter((x) => x.added && x.added.by === me.id).slice(-8).reverse();
    return `<a class="back" href="#/admin">‹ কাজের তালিকা</a><h1 class="page-h">নতুন দোকান বা সেবা</h1>
      <p class="meta gap"><span>মালিক এখনো লোকালহাটে নেই এমন দোকান যোগ করুন।</span> ${me.role === 'super' || me.role === 'verify' ? '<span>আপনার যোগ করা দোকান সরাসরি দেখাবে।</span>' : '<span>ভেরিফিকেশন টিম অনুমোদন করলে ব্যবহারকারীরা দেখবেন।</span>'} <span>মালিক নিজের মোবাইল নম্বরে কোড দিয়ে দোকান নিজের করে না নেওয়া পর্যন্ত অনলাইনে অর্ডার নেবে না।</span></p>
      <form id="new-shop" class="panel" novalidate>
        <h2 class="tight">মালিক</h2>
        <div class="row2"><label class="field"><span>মালিকের নাম</span><input id="ns-owner" type="text" maxlength="60" autocomplete="off"></label>
          <label class="field"><span>মালিকের মোবাইল নম্বর</span><input id="ns-phone" type="tel" inputmode="numeric" maxlength="14" placeholder="01XXXXXXXXX"><small>এই নম্বরে কোড দিয়ে মালিক দোকান নেবেন।</small></label></div>
        <h2 class="tight gap-t">দোকান বা সেবা</h2>
        <label class="field"><span>নাম</span><input id="ns-name" type="text" maxlength="80" autocomplete="off"></label>
        <label class="field"><span>ক্যাটাগরি ও সাব-ক্যাটাগরি</span><select id="ns-sub"><option value="">বেছে নিন</option>${subOptions('')}</select></label>
        <div class="row2"><label class="field"><span>জেলা</span><select id="ns-zila"><option value="">বেছে নিন</option>${zilas.map((z) => `<option value="${U.esc(z)}">${U.geo(z)}</option>`).join('')}</select></label>
          <label class="field"><span>উপজেলা / থানা</span><input id="ns-area" type="text" maxlength="60" list="ns-areas" autocomplete="off"><datalist id="ns-areas"></datalist></label></div>
        <label class="field"><span>বাজার (ঐচ্ছিক)</span><input id="ns-market" type="text" maxlength="60" autocomplete="off"></label>
        <label class="field"><span>পুরো ঠিকানা</span><input id="ns-address" type="text" maxlength="150" autocomplete="off" placeholder="বাড়ি, রোড, বাজার"></label>
        <div class="field"><span class="flabel">ম্যাপে দোকানের জায়গা</span><div id="ns-map" class="mini-map" aria-label="ম্যাপে দোকানের জায়গা"></div><small id="ns-pin-note">ম্যাপে চাপ দিয়ে দোকানের জায়গায় পিন দিন।</small></div>
        ${window.LHBook.weekEditor({ week: null })}
        <h2 class="tight gap-t">পণ্য বা সেবা</h2>
        <p class="meta">দাম ০ দিলে "দাম পরে" দেখাবে।</p>
        <div id="ns-items">${itemRow()}${itemRow()}</div>
        <button type="button" class="btn ghost sm gap-t" data-admin="ns-more">+ আরেকটি</button>
        <small class="err" id="ns-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">দোকান যোগ করুন</button>
      </form>
      ${mine.length ? `<h2 class="gap-t">আপনার যোগ করা</h2><div class="stack">${mine.map((x) => `<article class="panel ad-row"><div class="o-head"><div><b>${U.ud(x.name)}</b><small>${U.esc(x.sub)} · ${U.geo(x.area)}, ${U.geo(x.zila)}</small></div><span class="tag ${x.added.status === 'ok' ? 'ok' : x.added.status === 'no' ? 'bad' : ''}">${ADDED_WORD[x.added.status]}</span></div>${x.added.reason ? `<p class="warn"><span>কারণ</span>: ${U.ud(x.added.reason)}</p>` : ''}${x.listing ? '' : '<p class="meta">✓ মালিক দোকান নিয়েছেন</p>'}</article>`).join('')}</div>` : ''}`;
  }
  // verification's list of shops other members added
  function addedAsks() {
    const list = D().shops.filter((x) => x.added && x.added.status === 'pending' && can('shop.verify', x) && inPick(x));
    if (!list.length) return '';
    return `<section class="gap-b" id="added-asks"><h2>🆕 টিমের যোগ করা দোকান, যাচাই বাকি <small>${U.bn(list.length)}</small></h2><div class="stack">${list.map((x) => `<article class="panel ad-row added-row" id="ad-a-${x.id}">
      <div class="o-head"><div><b>${U.ud(x.name)}</b><small>${U.esc(x.sub)} · ${U.geo(x.area)}, ${U.geo(x.zila)}</small></div></div>
      <p class="meta"><span>মালিক</span>: ${U.ud(x.ownerName)} · <span translate="no">${U.bn(x.ownerPhone)}</span></p>
      <p class="meta">📍 ${U.ud(x.address)} · ${x.items.length ? `${U.bn(x.items.length)} <span>টি পণ্য বা সেবা</span>` : ''}</p>
      <p class="meta"><span>যোগ করেছেন</span>: ${U.ud(x.added.byName)} · ${U.fmtTime(x.added.at)}</p>
      <div class="o-acts"><button type="button" class="btn sm" data-admin="added-ok" data-id="${x.id}">✓ অনুমোদন</button><button type="button" class="btn ghost sm" data-admin="added-no" data-id="${x.id}">বাতিল</button><a class="btn ghost sm" href="#/shop/${x.id}" data-action="view-as">👁 দেখুন</a></div>
    </article>`).join('')}</div></section>`;
  }
  function mainCatSheet(id) {
    const x = Store.shopById(id);
    U.openSheet(`<h2 id="sheet-h">মূল ক্যাটাগরি বদলান</h2><p class="meta">${U.ud(x.name)}</p>
      <form id="main-cat" data-id="${id}" novalidate>
        <label class="field"><span>ক্যাটাগরি ও সাব-ক্যাটাগরি</span><select id="mc-sub">${subOptions(x.sub)}</select></label>
        <small class="err" id="mc-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }
  // the map on the form: a pin where the shop is, the map moved to the district chosen
  function mount() {
    const el = $('ns-map');
    if (!el || el.dataset.on) return;
    el.dataset.on = '1';
    nsPin = null;
    nsMap = window.LHMap.picker(el, null, (lat, lng) => { nsPin = { lat, lng }; $('ns-pin-note').textContent = '✓ পিন দেওয়া হয়েছে'; }, { icon: '🏪' });
  }

  /* ---------- shops and services ---------- */
  function shopRow(s) {
    const owner = D().accounts.find((a) => a.role === 'owner' && a.shopId === s.id);
    const orders = D().orders.filter((o) => o.shopId === s.id).length;
    const rated = Store.ratingsOf('shop', s.id, true).length;
    return `<article class="panel ad-row" id="ad-s-${s.id}">
      <div class="ad-head">${U.logoHtml(s, 'chat-logo')}<div class="ad-txt"><b>${U.ud(s.name)}</b><small>${U.esc(U.catById(s.cat).short)} · ${s.kind === 'service' ? 'সেবা' : 'দোকান'}</small></div></div>
      <div class="tags">
        <span class="tag ${s.verified ? 'ok' : ''}">${s.verified ? '✓ যাচাইকৃত' : 'যাচাই বাকি'}</span>
        ${s.added ? `<span class="tag ${s.added.status === 'no' ? 'bad' : ''}">${ADDED_WORD[s.added.status]}</span>` : ''}${s.listing ? '<span class="tag">📋 মালিক এখনো নেননি</span>' : ''}
        ${s.suspended ? '<span class="tag bad">স্থগিত</span>' : ''}${s.hidden ? '<span class="tag">এজেন্ট ভেরিফাই করেননি</span>' : ''}
        <span class="tag">${window.LHRate.badge('shop', s.id, 'রেটিং নেই')}</span>
        <span class="tag">${U.bn(orders)}টি অর্ডার</span>
      </div>
      <p class="meta gap-t">${owner ? `এজেন্ট: ${U.ud(owner.name)} · ` : ''}ফোন: ${U.bn(U.esc(s.phone))}</p>
      ${window.LHCats.adminLine(s)}
      ${s.suspended ? `<p class="warn">স্থগিতের কারণ: ${U.ud(s.suspended.reason)}</p>` : ''}
      <div class="o-acts">
        ${can('shop.verify', s) ? `<button type="button" class="btn ghost sm" data-admin="shop-verify" data-id="${s.id}">${s.verified ? 'যাচাই তুলে নিন' : '✓ যাচাই করুন'}</button>` : ''}
        ${!can('shop.suspend', s) ? '' : s.suspended ? `<button type="button" class="btn sm" data-admin="shop-resume" data-id="${s.id}">আবার চালু করুন</button>` : `<button type="button" class="btn danger sm" data-admin="shop-suspend" data-id="${s.id}">স্থগিত করুন</button>`}
        <a class="btn ghost sm" href="#/shop/${s.id}" data-action="view-as">👁 গ্রাহক যেভাবে দেখবেন</a>
        ${can('shop.area', s) ? `<button type="button" class="btn ghost sm" data-admin="area-edit" data-kind="shop" data-id="${s.id}">এলাকা বদলান</button>` : ''}
        ${s.listing && can('shop.add', s) ? `<button type="button" class="btn ghost sm" data-admin="main-cat" data-id="${s.id}">মূল ক্যাটাগরি বদলান</button>` : ''}
        ${rated && can('ratings') ? `<button type="button" class="btn ghost sm" data-admin="ratings" data-about="shop" data-id="${s.id}">রেটিং (${U.bn(rated)})</button>` : ''}
      </div>
    </article>`;
  }
  function shopsPage() {
    const everyone = D().shops;
    const all = everyone.filter(inPick);
    const groups = { all, pending: all.filter((s) => !s.verified), suspended: all.filter((s) => s.suspended) };
    return `<h1 class="page-h">এজেন্ট (দোকান ও সেবা)</h1>
      ${addedAsks()}
      ${can('cats') ? window.LHCats.adminAsks() : ''}
      ${areaFilter(everyone)}
      <div class="chips" role="group" aria-label="ফিল্টার">${chip('shop-tab', 'all', shopTab === 'all', `সব (${U.bn(all.length)})`)}${chip('shop-tab', 'pending', shopTab === 'pending', `যাচাই বাকি (${U.bn(groups.pending.length)})`)}${chip('shop-tab', 'suspended', shopTab === 'suspended', `স্থগিত (${U.bn(groups.suspended.length)})`)}</div>
      ${groups[shopTab].length ? byArea(groups[shopTab], shopRow) : '<div class="empty"><span aria-hidden="true">🏪</span><h3>এখানে কেউ নেই</h3></div>'}`;
  }
  function reasonSheet(title, note, action, id, go, extra) {
    U.openSheet(`<h2 id="sheet-h">${title}</h2><p>${note}</p>
      <form id="ad-reason" data-kind="${action}" data-id="${U.esc(id)}" ${extra || ''} novalidate>
        <label class="field"><span>কারণ</span><textarea id="ad-why" rows="3" maxlength="300"></textarea><small class="err" id="ad-why-err" role="alert"></small></label>
        <button type="submit" class="btn block danger-fill sheet-go">${go || 'স্থগিত করুন'}</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">না, থাক</button>`);
  }

  /* ---------- delivery men ---------- */
  // the papers a delivery man sent: waiting for the team, sent back, or not sent yet
  const PAPER_TAG = { pending: ['📄 কাগজ দেখা বাকি', ''], rejected: ['কাগজ ফেরত দেওয়া হয়েছে', 'bad'], none: ['কাগজ জমা দেননি', ''] };
  const paperState = (a) => (!a ? '' : a.kyc ? (a.kyc.status === 'ok' ? '' : a.kyc.status) : a.approved === false ? 'none' : '');
  function riderRow(r) {
    const rated = Store.ratingsOf('rider', r.phone, true).length;
    const a = r.account;
    const papers = paperState(a);
    return `<article class="panel ad-row">
      <div class="ad-head"><span class="auth-ico small" aria-hidden="true">${a && Store.BIG_VEHICLES.includes(a.vehicle) ? '🚚' : '🛵'}</span><div class="ad-txt"><b>${U.ud(r.name)}</b><small>${U.bn(r.phone)}${a && a.vehicle ? ` · ${U.esc(a.vehicle)}` : ''}</small></div></div>
      <div class="tags">
        <span class="tag ${r.blocked ? 'bad' : r.free ? 'ok' : ''}">${r.blocked ? 'স্থগিত' : !a ? 'একাউন্ট নেই' : a.approved === false ? 'অনুমোদন বাকি' : a.verified ? 'চালু' : 'ভেরিফাই বাকি'}</span>
        ${papers ? `<span class="tag ${PAPER_TAG[papers][1]}">${PAPER_TAG[papers][0]}</span>` : ''}
        <span class="tag">${window.LHRate.badge('rider', r.phone, 'রেটিং নেই')}</span>
        <span class="tag">${U.bn(r.active)}টি চলমান</span>
        <span class="tag">${U.bn(r.delivered)}টি ডেলিভারি সম্পন্ন</span>
      </div>
      ${a ? `<p class="meta gap-t">📍 ${a.addr ? `${U.ud(a.addr)} · ` : ''}${a.market ? `<span>বাজার</span>: ${U.ud(a.market)} · ` : ''}${a.lat ? `<span>${U.bn(a.km || 3)} কিমি</span>` : '<span>ম্যাপে পিন নেই, পুরো উপজেলার কাজ পান</span>'}</p>` : ''}
      ${r.blocked ? `<p class="warn">স্থগিতের কারণ: ${U.ud(r.blocked.reason)}</p>` : ''}
      ${papers === 'rejected' ? `<p class="meta">ফেরতের কারণ: ${U.ud(a.kyc.reason)}</p>` : ''}
      <div class="o-acts">
        ${papers === 'pending' && can('rider.papers', r) ? `<button type="button" class="btn sm" data-admin="rider-papers" data-id="${a.id}">📄 কাগজ দেখুন</button>` : ''}
        ${!can('rider.suspend', r) ? '' : r.blocked ? `<button type="button" class="btn sm" data-admin="rider-resume" data-id="${r.phone}">আবার চালু করুন</button>` : `<button type="button" class="btn danger sm" data-admin="rider-suspend" data-id="${r.phone}">স্থগিত করুন</button>`}
        <a class="btn ghost sm" href="#/profile/rider/${r.key}">প্রোফাইল</a>
        ${a && can('rider.area', r) ? `<button type="button" class="btn ghost sm" data-admin="area-edit" data-kind="rider" data-id="${a.id}">এলাকা বদলান</button>` : ''}
        ${rated && can('ratings') ? `<button type="button" class="btn ghost sm" data-admin="ratings" data-about="rider" data-id="${r.phone}">রেটিং (${U.bn(rated)})</button>` : ''}
      </div>
    </article>`;
  }
  // deliveries in progress: the team steps in when nobody was free, someone must be replaced, or a code is lost
  function deliveryRow(o) {
    const shop = Store.shopById(o.shopId);
    // a big item goes only with someone who has a van or a pickup
    // the shop's own upazila first, then those whose distance reaches the shop, nearest first; the team can still pick anyone
    const reach = (r) => Number(r.area === shop.area) * 2 + Number(Store.inReach(r.account, shop));
    const dist = (r) => { const k = Store.riderKm(r.account, shop); return k === null ? 999 : k; };
    const free = Store.riders().filter((r) => r.free && (!o.big || Store.BIG_VEHICLES.includes(r.account.vehicle))).sort((x, y) => reach(y) - reach(x) || dist(x) - dist(y));
    const howFar = (r) => { const k = Store.riderKm(r.account, shop); return k === null ? '' : ` · ${U.kmText(k)}${Store.inReach(r.account, shop) ? '' : ' (দূরত্বের বাইরে)'}`; };
    return `<article class="panel ad-row" id="ad-d-${o.code}">
      <div class="o-head"><div><b>${U.ud(o.shopName)}</b><small><a href="#/admin/order/${o.code}" translate="no">#${U.bn(o.code)}</a> · ${U.geo(shop.area)} · ${Store.label(o, o.status)}</small></div>
        <span class="tag ${o.delivery ? 'ok' : 'bad'}">${o.delivery ? U.ud(o.delivery.name) : 'ডেলিভারি ম্যান নেই'}</span></div>
      ${o.big ? '<p class="meta">🚚 বড় জিনিস: শুধু ভ্যান বা পিকআপ আছে এমন কাউকে পাঠানো যাবে।</p>' : ''}
      ${o.status === 'out_for_delivery' ? `<div class="o-acts"><button type="button" class="btn ghost sm" data-admin="team-deliver" data-id="${o.code}">কোড ছাড়া ডেলিভারি নিশ্চিত করুন</button></div>`
    : free.length ? `<label class="field"><span>${o.delivery ? 'অন্য কাউকে দিন' : 'কাকে পাঠাবেন'}</span><select id="as-${o.code}">${free.map((r) => `<option value="${r.account.id}" ${o.delivery && o.delivery.id === r.account.id ? 'selected' : ''}>${U.ud(r.name)} · ${U.geo(r.area)}${howFar(r)}</option>`).join('')}</select></label>
        <div class="o-acts"><button type="button" class="btn sm" data-admin="assign" data-id="${o.code}">পাঠান</button></div>`
      : '<p class="meta o-wait">এখন কেউ কাজ নিতে পারবেন না।</p>'}
    </article>`;
  }
  // The team checks a new delivery man's papers. The NID number shows in full only here.
  function papersSheet(id) {
    const a = D().accounts.find((x) => x.id === id);
    if (!a || !a.kyc) return;
    Store.teamSeeDocs('nid', Store.placeOfRider(a.contact));
    const k = a.kyc;
    const img = (src, alt) => (src ? `<img class="paper-big" src="${src}" alt="${alt}">` : '');
    U.openSheet(`<h2 id="sheet-h">কাগজ যাচাই</h2><p class="meta">${U.ud(a.name)} · ${U.bn(a.contact)} · ${U.esc(a.vehicle || '')}</p>
      <dl class="acct-list info-list">
        <div><dt>এনআইডি নম্বর</dt><dd translate="no">${U.bn(U.esc(k.nid))}</dd></div>
        ${k.licence ? `<div><dt>ড্রাইভিং লাইসেন্স</dt><dd translate="no">${U.ud(k.licence)}</dd></div><div><dt>নম্বর প্লেট</dt><dd>${U.ud(k.plate)}</dd></div>` : ''}
        <div><dt>জমা দিয়েছেন</dt><dd>${U.fmtTime(k.at)}</dd></div>
      </dl>
      <div class="paper-row">${img(k.front, 'এনআইডির সামনের ছবি')}${img(k.back, 'এনআইডির পেছনের ছবি')}${img(k.licencePic, 'ড্রাইভিং লাইসেন্সের ছবি')}</div>
      <p class="meta">নাম ও ছবি মিলিয়ে দেখুন। দরকার হলে ফোন করে কথা বলুন।</p>
      <button type="button" class="btn block" data-admin="rider-approve" data-id="${a.id}">✓ অনুমোদন করুন</button>
      <button type="button" class="btn ghost block danger" data-admin="rider-reject" data-id="${a.id}">কাগজ ফেরত দিন</button>
      <button type="button" class="link" data-action="close-sheet">পরে দেখব</button>`);
  }
  function ridersPage() {
    const list = Store.riders();
    const moving = can('assign') ? D().orders.filter((o) => o.mode === 'delivery' && !Store.isFinal(o) && o.status !== 'placed' && inPick(Store.shopById(o.shopId)) && can('assign', Store.shopById(o.shopId))) : [];
    moving.sort((x, y) => Number(!!x.delivery) - Number(!!y.delivery));
    const shown = list.filter(inPick);
    return `<h1 class="page-h">ডেলিভারি ম্যান</h1>
      <p class="meta gap">দোকান অর্ডার গ্রহণ করলে সেই উপজেলার কাজ নিতে পারেন এমন ডেলিভারি ম্যানের কাছে অটোমেটিক যায়: যাঁর দূরত্বের গোল দাগের ভেতরে দোকান, আগে সেই বাজারের জন, তারপর কাছের জন। কেউ না থাকলে এখানে থাকবে, টিম পাঠাবে। স্থগিত হলে তিনি নতুন কাজ পাবেন না, তাঁর হাতে না নেওয়া কাজ অন্যের কাছে যাবে।</p>
      ${areaFilter(list)}
      ${moving.length ? `<h2 class="gap-t">চলমান ডেলিভারি (${U.bn(moving.length)})</h2><div class="stack">${moving.map(deliveryRow).join('')}</div>` : ''}
      <h2 class="gap-t">সব ডেলিভারি ম্যান</h2>
      ${shown.length ? byArea(shown, riderRow) : '<div class="empty"><span aria-hidden="true">🛵</span><h3>এখনো কেউ নেই</h3></div>'}`;
  }
  function ratingsSheet(about, id) {
    const list = Store.ratingsOf(about, id, true);
    U.openSheet(`<h2 id="sheet-h">রেটিং</h2>
      <ul class="rate-list">${list.map((r) => `<li class="${r.hidden ? 'off' : ''}">${window.LHRate.stars(r.stars)}${r.text ? `<p>${U.ud(r.text)}</p>` : ''}<small>${U.ud(r.by)} · ${U.fmtTime(r.at)}${r.hidden ? ' · লুকানো' : ''}</small>
        <button type="button" class="inline" data-admin="rating-toggle" data-id="${r.id}" data-about="${about}" data-target="${U.esc(id)}" data-hide="${r.hidden ? '' : '1'}">${r.hidden ? 'আবার দেখান' : 'লুকান'}</button></li>`).join('')}</ul>
      <button type="button" class="link" data-action="close-sheet">বন্ধ করুন</button>`);
  }

  /* ---------- offers ---------- */
  function offerRow(of) {
    const live = Store.offerLive(of);
    return `<article class="panel ad-row">
      <div class="ad-head"><span class="auth-ico small" aria-hidden="true">🎁</span><div class="ad-txt"><b>${U.ud(of.title)}</b><small><span translate="no">${U.esc(of.code)}</span> · ${U.offerOff(of)}${of.minOrder ? ` · কমপক্ষে ${U.tk(of.minOrder)}` : ''}${of.until ? ` · শেষ ${U.bn(of.until)}` : ''}</small></div></div>
      <div class="tags"><span class="tag ${live ? 'ok' : ''}">${live ? 'চলছে' : of.active ? 'মেয়াদ শেষ' : 'বন্ধ'}</span><span class="tag">${U.bn(Store.offerUses(of.code))} বার ব্যবহার</span></div>
      <div class="own-acts gap-t">
        <label class="switch"><input type="checkbox" data-admin-offer="${of.id}" ${of.active ? 'checked' : ''}><span>${of.active ? 'চালু' : 'বন্ধ'}</span></label>
        <button type="button" class="btn ghost sm" data-admin="offer-edit" data-id="${of.id}">এডিট</button>
        <button type="button" class="btn danger sm" data-admin="offer-del" data-id="${of.id}">মুছুন</button>
      </div>
    </article>`;
  }
  /* ---------- home page ads ---------- */
  function adRow(ad, i) {
    const s = Store.shopById(ad.shopId);
    const it = Store.adItem(ad);
    const live = Store.adLive(ad);
    return `<article class="panel ad-row">
      <div class="ad-head"><span class="auth-ico small" aria-hidden="true">${it ? it.icon : s ? s.icon : '📣'}</span><div class="ad-txt"><b>${it ? U.ud(it.name) : s ? U.ud(s.name) : 'দোকান পাওয়া যায়নি'}</b><small>${it ? `পণ্য বা সেবা · ${U.ud(s.name)}` : s && s.kind === 'service' ? 'সেবা প্রদানকারী' : 'দোকান'}${s ? ` · ${U.geo(s.area)}` : ''}</small>${ad.text ? `<small>"${U.ud(ad.text)}"</small>` : ''}</div></div>
      <div class="tags"><span class="tag ${live ? 'ok' : ''}">${live ? 'দেখানো হচ্ছে' : ad.active ? 'দেখানো যাচ্ছে না' : 'বন্ধ'}</span></div>
      ${ad.active && !live ? '<p class="meta">দোকান বন্ধ বা পণ্যের স্টক নেই, তাই এখন দেখানো হচ্ছে না।</p>' : ''}
      <div class="own-acts gap-t">
        <label class="switch"><input type="checkbox" data-admin-ad="${ad.id}" ${ad.active ? 'checked' : ''}><span>${ad.active ? 'চালু' : 'বন্ধ'}</span></label>
        <button type="button" class="btn ghost sm" data-admin="ad-up" data-id="${ad.id}" ${i ? '' : 'disabled'} aria-label="আগে দেখান">▲</button>
        <button type="button" class="btn ghost sm" data-admin="ad-down" data-id="${ad.id}" ${i < D().ads.length - 1 ? '' : 'disabled'} aria-label="পরে দেখান">▼</button>
        <button type="button" class="btn ghost sm" data-admin="ad-edit" data-id="${ad.id}">এডিট</button>
        <button type="button" class="btn danger sm" data-admin="ad-del" data-id="${ad.id}">মুছুন</button>
      </div>
    </article>`;
  }
  // every live shop with its area; for a product ad, the chosen shop's products
  const shopOptions = (sel) => D().shops.filter(Store.shopLive).map((s) => `<option value="${s.id}" ${sel === s.id ? 'selected' : ''}>${U.ud(s.name)} · ${U.geo(s.area)}</option>`).join('');
  const itemOptions = (shopId, sel) => { const s = Store.shopById(shopId); return s ? s.items.map((it) => `<option value="${it.id}" ${sel === it.id ? 'selected' : ''}>${U.ud(it.name)}${it.price ? ' · ' + U.tk(it.price) : ''}${it.available ? '' : ' (স্টক নেই)'}</option>`).join('') : ''; };
  function adSheet(id) {
    const ad = id ? D().ads.find((x) => x.id === id) : null;
    adDraft = id || null;
    const kind = ad ? ad.kind : 'item';
    const shopId = ad ? ad.shopId : '';
    U.openSheet(`<h2 id="sheet-h">${ad ? 'বিজ্ঞাপন এডিট করুন' : 'নতুন বিজ্ঞাপন'}</h2>
      <form id="ad-form" novalidate>
        <fieldset class="field fs"><legend>কী দেখাবেন?</legend>
          <label class="pay"><input type="radio" name="adf-kind" value="item" ${kind === 'item' ? 'checked' : ''}><span><b>একটি পণ্য বা সেবা</b><small>দাম ও দোকানের নাম সহ</small></span></label>
          <label class="pay"><input type="radio" name="adf-kind" value="shop" ${kind === 'shop' ? 'checked' : ''}><span><b>পুরো দোকান বা সেবা প্রদানকারী</b><small>দোকানের পাতায় নিয়ে যাবে</small></span></label>
        </fieldset>
        <label class="field"><span>দোকান বা সেবা</span><select id="adf-shop"><option value="">বেছে নিন</option>${shopOptions(shopId)}</select></label>
        <label class="field" id="adf-item-row" ${kind === 'item' ? '' : 'hidden'}><span>পণ্য বা সেবা</span><select id="adf-item"><option value="">বেছে নিন</option>${itemOptions(shopId, ad ? ad.itemId : '')}</select></label>
        <label class="field"><span>ছোট লেখা (ঐচ্ছিক)</span><input id="adf-text" type="text" maxlength="60" value="${U.esc(ad ? ad.text : '')}" placeholder="যেমন: নতুন চালান এসেছে"></label>
        <p class="meta">বিজ্ঞাপন শুধু ওই দোকানের নিজের এলাকার ইউজাররা হোম পেজে দেখবেন।</p>
        <small class="err" id="adf-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }
  const offersPage = () => `<div class="page-row"><h1 class="page-h">হোম পেজের বিজ্ঞাপন</h1><button type="button" class="btn" data-admin="ad-new">+ নতুন বিজ্ঞাপন</button></div>
    <p class="meta gap">ইউজারের হোম পেজের উপরে বিজ্ঞাপনগুলো একটির পর একটি ঘুরে আসে। যেকোনো দোকানের পণ্য, অথবা পুরো দোকান বা সেবা দেখানো যায়। উপরেরটি আগে দেখাবে।</p>
    ${areaFilter(D().ads.map((ad) => Store.shopById(ad.shopId)))}
    ${D().ads.length ? `<div class="stack">${D().ads.map((ad, i) => [ad, i]).filter(([ad]) => inPick(Store.shopById(ad.shopId))).map(([ad, i]) => adRow(ad, i)).join('')}</div>` : '<div class="empty"><span aria-hidden="true">📣</span><h3>এখনো কোনো বিজ্ঞাপন নেই</h3><p>বিজ্ঞাপন না থাকলে হোম পেজে আগের মতো দোকান, সেবা ও ম্যাপের বোতাম দেখাবে।</p></div>'}
    <div class="page-row gap-t"><h2 class="page-h">অফার কোড</h2><button type="button" class="btn" data-admin="offer-new">+ নতুন অফার</button></div>
    <p class="meta gap">গ্রাহক চেকআউটে কোড দিলে পণ্যের দামে ছাড় পাবেন, ডেলিভারি চার্জে নয়। একজন গ্রাহক একটি অফার একবারই পাবেন। সেবা বুকিংয়ে অফার নেই।</p>
    ${D().offers.length ? `<div class="stack">${D().offers.map(offerRow).join('')}</div>` : '<div class="empty"><span aria-hidden="true">🎁</span><h3>এখনো কোনো অফার নেই</h3></div>'}`;
  function offerSheet(id) {
    const of = id ? D().offers.find((x) => x.id === id) : null;
    offerDraft = id || null;
    const kind = of ? of.kind : 'flat';
    U.openSheet(`<h2 id="sheet-h">${of ? 'অফার এডিট করুন' : 'নতুন অফার'}</h2>
      <form id="promo-form" novalidate>
        <label class="field"><span>অফারের নাম</span><input id="pr-title" type="text" maxlength="60" value="${U.esc(of ? of.title : '')}" placeholder="যেমন: ঈদের ছাড়"></label>
        <label class="field"><span>কোড</span><input id="pr-code" type="text" maxlength="15" autocapitalize="characters" spellcheck="false" value="${U.esc(of ? of.code : '')}" placeholder="EID100"></label>
        <fieldset class="field fs"><legend>ছাড়ের ধরন</legend>
          <label class="pay"><input type="radio" name="pr-kind" value="flat" ${kind === 'flat' ? 'checked' : ''}><span><b>টাকায়</b><small>যেমন ৳৫০ ছাড়</small></span></label>
          <label class="pay"><input type="radio" name="pr-kind" value="percent" ${kind === 'percent' ? 'checked' : ''}><span><b>শতাংশে</b><small>যেমন ১০% ছাড়</small></span></label>
        </fieldset>
        <div class="row2">
          <label class="field"><span>ছাড়ের পরিমাণ</span><input id="pr-value" type="text" inputmode="numeric" value="${of ? U.bn(of.value) : ''}"></label>
          <label class="field"><span>কমপক্ষে কত টাকার পণ্য</span><input id="pr-min" type="text" inputmode="numeric" value="${of ? U.bn(of.minOrder) : '০'}"></label>
        </div>
        <label class="field"><span>শেষ তারিখ (ঐচ্ছিক)</span><input id="pr-until" type="date" value="${U.esc(of ? of.until : '')}"></label>
        <small class="err" id="pr-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }

  /* ---------- refunds ---------- */
  function refundRow(o) {
    const r = o.refund;
    const who = D().accounts.find((a) => a.id === o.customerId);
    const two = r.amount > Store.refundLimit();
    const late = r.status === 'open' && Date.now() - new Date(r.at).getTime() > 48 * 36e5;
    return `<article class="panel ad-row ${late ? 'late' : ''}" id="ad-r-${o.code}">
      <div class="o-head"><div><b>${U.ud(o.shopName)}</b><small><a href="#/admin/order/${o.code}" translate="no">#${U.bn(o.code)}</a> · ${U.fmtTime(r.at)}</small></div>
        <span class="tag ${r.status === 'paid' ? 'ok' : r.status === 'rejected' ? 'bad' : r.step1 ? 'warn' : ''}">${r.status === 'paid' ? 'ফেরত দেওয়া হয়েছে' : r.status === 'rejected' ? 'বাতিল' : r.step1 ? 'দ্বিতীয় অনুমোদনের অপেক্ষায়' : 'অপেক্ষায়'}</span></div>
      ${late ? '<p class="warn">⏰ ৪৮ ঘণ্টা পেরিয়ে গেছে</p>' : ''}
      <div class="sum"><span>চাওয়া হয়েছে</span><b>${U.tk(r.amount)}</b></div>
      <div class="sum"><span>অর্ডারের মোট</span><b>${U.tk(o.total)}</b></div>
      ${r.status === 'paid' ? `<div class="sum"><span>ফেরত দেওয়া হয়েছে</span><b>${U.tk(r.paid)}</b></div>` : ''}
      ${r.auto ? `<p class="note gap-t">অর্ডার বাতিল হয়েছে, অনলাইনে দেওয়া টাকা একই পথে ফেরত দিন।</p>
      <p class="meta">গ্রাহক: ${who ? U.ud(who.name) : ''} · ${o.paid ? `<span>${Store.PAID_WORD[o.paid.method]}</span> · <span translate="no">${U.esc(o.paid.trx)}</span>` : ''}</p>`
    : `<p class="note gap-t">${U.ud(r.reason)}</p>
      <p class="meta">গ্রাহক: ${who ? U.ud(who.name) : ''} · টাকা নেওয়ার নম্বর: ${U.bn(r.phone)}</p>`}
      ${r.note ? `<p class="meta">টিমের নোট: ${U.ud(r.note)}</p>` : ''}
      ${r.by ? `<p class="meta"><span>সিদ্ধান্ত</span>: ${U.ud(r.by)}${r.checkedBy ? ` · <span>অনুমোদন</span>: ${U.ud(r.checkedBy)}` : ''}</p>` : ''}
      ${r.status === 'open' && two ? '<p class="meta">⚖️ <span>সীমার উপরে, দুজনের সিদ্ধান্ত লাগবে</span></p>' : ''}
      ${r.sentBack ? `<p class="note"><span>ফেরত পাঠিয়েছেন</span>: ${U.ud(r.sentBack.by)} · ${U.ud(r.sentBack.note)}</p>` : ''}
      ${r.status === 'open' && r.step1 ? `<div class="step1"><p><b><span>প্রথম সিদ্ধান্ত</span>: ${r.step1.status === 'paid' ? `${U.tk(r.step1.amount)} <span>ফেরত দেওয়া হবে</span>` : '<span>রিফান্ড বাতিল</span>'}</b></p>
        <p class="meta">${U.ud(r.step1.byName)} · ${U.fmtTime(r.step1.at)} · ${U.ud(r.step1.note)}</p>
        ${r.step1.by === Store.teamMe().id ? '<p class="note">আরেকজন ফাইন্যান্স বা সুপার অ্যাডমিনের অনুমোদনের অপেক্ষায়। নিজের সিদ্ধান্ত নিজে অনুমোদন করা যায় না।</p>'
    : `<div class="o-acts"><button type="button" class="btn sm" data-admin="refund-ok" data-id="${o.code}">✓ অনুমোদন করুন</button><button type="button" class="btn ghost sm" data-admin="refund-back" data-id="${o.code}">ফেরত পাঠান</button></div>`}</div>`
    : r.status === 'open' ? `<div class="o-acts"><button type="button" class="btn sm" data-admin="refund-pay" data-id="${o.code}">✓ টাকা ফেরত দিন</button><button type="button" class="btn ghost sm" data-admin="refund-no" data-id="${o.code}">বাতিল করুন</button></div>` : ''}
    </article>`;
  }
  function refundsPage() {
    const every = D().orders.filter((o) => o.refund).sort((a, b) => b.refund.at.localeCompare(a.refund.at));
    const all = every.filter((o) => inPick(Store.shopById(o.shopId)));
    const open = all.filter((o) => o.refund.status === 'open');
    const done = all.filter((o) => o.refund.status !== 'open');
    const list = refundTab === 'open' ? open : done;
    return `<h1 class="page-h">রিফান্ড</h1>
      <p class="meta gap"><span>গ্রাহক দোকানে গিয়ে সেদিনই টাকা ফেরত নিতে পারেন, অথবা এখানে আবেদন করেন। আবেদনের ৪৮ ঘণ্টার মধ্যে সিদ্ধান্ত দিন।</span> <span>রিফান্ডের সীমা</span>: ${U.tk(Store.refundLimit())}<span>, এর বেশি হলে দুজনের সিদ্ধান্ত লাগে।</span> <span>প্রোটোটাইপে আসল টাকা যায় না।</span></p>
      ${areaFilter(every.map((o) => Store.shopById(o.shopId)))}
      <div class="chips" role="group" aria-label="ফিল্টার">${chip('refund-tab', 'open', refundTab === 'open', `অপেক্ষায় (${U.bn(open.length)})`)}${chip('refund-tab', 'done', refundTab === 'done', `শেষ (${U.bn(done.length)})`)}</div>
      ${list.length ? `<div class="stack">${list.map(refundRow).join('')}</div>` : '<div class="empty"><span aria-hidden="true">↩️</span><h3>এখানে কোনো রিফান্ড নেই</h3></div>'}
      ${window.LHLaunch.adminTrips()}`;
  }
  function refundSheet(code, pay) {
    const o = D().orders.find((x) => x.code === code);
    const two = o.refund.amount > Store.refundLimit();
    U.openSheet(`<h2 id="sheet-h">${pay ? 'টাকা ফেরত দেবেন?' : 'রিফান্ড বাতিল করবেন?'}</h2>
      ${two ? '<p class="note">⚖️ সীমার উপরে: আপনার সিদ্ধান্তের পর আরেকজন ফাইন্যান্স বা সুপার অ্যাডমিন অনুমোদন করলে তবেই শেষ হবে।</p>' : ''}
      <form id="refund-decide" data-code="${code}" data-pay="${pay ? '1' : ''}" novalidate>
        ${pay ? `<label class="field"><span>কত টাকা ফেরত (৳)</span><input id="rd-amount" type="text" inputmode="numeric" value="${U.bn(o.refund.amount)}"></label>` : ''}
        <label class="field"><span>${pay ? 'নোট: কীভাবে, কোন নম্বরে ফেরত' : 'বাতিলের কারণ'}</span><textarea id="rd-note" rows="2" maxlength="300"></textarea><small>গ্রাহক এই লেখা দেখবেন।</small></label>
        <small class="err" id="rd-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">${pay ? 'সংরক্ষণ করুন' : 'বাতিল করুন'}</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">না, থাক</button>`);
  }

  /* ---------- support ---------- */
  const ROLE_WORD = { customer: 'ইউজার', owner: 'এজেন্ট', delivery: 'ডেলিভারি ম্যান' };
  const minutesAgo = (at) => Math.max(0, Math.round((Date.now() - new Date(at).getTime()) / 60000));
  // people who asked to be called, the longest wait first
  function callbacksHtml() {
    const list = Store.callbacksWaiting().filter((t) => can('support', Store.placeOfTicket(t)) && (!window.LHArea.isOn() || inPick(window.LHArea.ofTicket(t)))).sort((a, b) => a.callback.at.localeCompare(b.callback.at));
    if (!list.length) return '';
    return `<h2 class="gap-t"><span>📞 কল ব্যাক চান</span> <small>(${U.bn(list.length)})</small></h2><div class="stack">${list.map((t) => `<article class="panel ad-row callback">
      <div class="o-head"><div><b>${U.ud(t.name)}</b><small>${ROLE_WORD[t.role]} · <span>${U.bn(minutesAgo(t.callback.at))}</span> <span>মিনিট ধরে অপেক্ষায়</span>${t.orderCode ? ` · <a href="#/admin/order/${t.orderCode}" translate="no">#${U.bn(t.orderCode)}</a>` : ''}</small></div></div>
      <div class="o-acts">${t.role === 'customer' ? window.LHTeam.callHtml(t.callback.phone, 't' + t.id, { kind: 'ticket', id: t.id }) : `<a class="btn sm" href="tel:${U.esc(t.callback.phone)}">📞 ${U.bn(t.callback.phone)}</a>`}<button type="button" class="btn ghost sm" data-admin="callback-done" data-id="${t.id}">✓ কল করেছি</button><a class="btn ghost sm" href="#/admin/support/${t.id}">লিখে উত্তর দিন</a></div>
    </article>`).join('')}</div>`;
  }
  const helplineHtml = () => `<form id="help-form" class="panel help-set" novalidate>
      <h2 class="tight">📞 হেল্পলাইন, ২৪ ঘণ্টা</h2>
      <label class="field"><span>হেল্পলাইন নম্বর</span><input id="hl-phone" type="tel" inputmode="numeric" maxlength="14" value="${U.esc(D().helpline.phone)}" placeholder="16XXX বা 09XXXXXXXXX"><small>দিলে ইউজার, এজেন্ট ও ডেলিভারি ম্যানের সাপোর্ট পাতায় কল বোতাম দেখাবে। খালি রাখলে শুধু কল ব্যাক ও লিখে জানানো।</small></label>
      <small class="err" id="hl-err" role="alert"></small>
      <button type="submit" class="btn ghost block">সংরক্ষণ করুন</button>
    </form>`;
  const subjectOf = (t) => (t.callback ? '📞 কল ব্যাক চাই' : U.ud(t.subject));
  function supportPage(id) {
    if (id) {
      const t = Store.ticketById(id);
      if (!t) return null;
      if (!can('support', Store.placeOfTicket(t))) return window.LHTeam.noPerm();
      Store.ticketSeen(t, 'team');
      return `<a class="back" href="#/admin/support">‹ সব অনুরোধ</a>
        ${window.LHCare.threadHtml(t, 'team', `<div><b>${subjectOf(t)}</b><small>${ROLE_WORD[t.role]} · ${U.ud(t.name)} · ${t.role === 'customer' ? window.LHTeam.phoneHtml(t.contact, 't' + t.id, { kind: 'ticket', id: t.id }) : U.bn(U.esc(t.contact))}${t.orderCode ? ` · <a href="#/admin/order/${t.orderCode}" translate="no">#${U.bn(t.orderCode)}</a>` : ''}</small></div>
          <button type="button" class="btn ghost sm" data-admin="ticket-status" data-id="${t.id}" data-to="${t.status === 'open' ? 'closed' : 'open'}">${t.status === 'open' ? 'বন্ধ করুন' : 'আবার খুলুন'}</button>`)}`;
    }
    const all = D().support.filter((t) => can('support', Store.placeOfTicket(t)) && (!window.LHArea.isOn() || inPick(window.LHArea.ofTicket(t))));
    const open = all.filter((t) => t.status === 'open');
    const closed = all.filter((t) => t.status === 'closed');
    const list = ticketTab === 'open' ? open : closed;
    return `<h1 class="page-h">সাপোর্ট</h1>
      ${areaFilter(D().support.map(window.LHArea.ofTicket))}
      ${callbacksHtml()}
      <h2 class="gap-t">লিখে জানানো</h2>
      <div class="chips" role="group" aria-label="ফিল্টার">${chip('ticket-tab', 'open', ticketTab === 'open', `খোলা (${U.bn(open.length)})`)}${chip('ticket-tab', 'closed', ticketTab === 'closed', `বন্ধ (${U.bn(closed.length)})`)}</div>
      ${list.length ? `<div class="stack">${list.map((t) => {
        const n = Store.ticketUnread(t, 'team');
        return `<a class="panel chat-row" href="#/admin/support/${t.id}"><span><b>${subjectOf(t)}</b><small>${ROLE_WORD[t.role]} · ${U.ud(t.name)}</small></span>${n ? `<span class="pill">${U.bn(n)}</span>` : ''}</a>`;
      }).join('')}</div>` : '<div class="empty"><span aria-hidden="true">🛟</span><h3>এখানে কোনো অনুরোধ নেই</h3></div>'}`;
  }

  /* ---------- delivery charge ---------- */
  // A worked example under the form: what one order would cost with the saved values.
  function chargeExample() {
    const r = D().feeRules;
    const km = r.freeKm + 2;
    const fee = Store.deliveryFee() + 2 * r.perKm;
    const big = r.bigFee + 2 * r.bigPerKm;
    const c = Store.money(1000, D().commission, 0).commission;
    return `<ul class="mini fee-eg">
      <li><span>🛵 <span>${U.bn(km)}</span> <span>কিমি দূরে বাসায় ডেলিভারি</span></span><b>${U.tk(fee)}</b></li>
      <li><span>🚚 <span>${U.bn(km)}</span> <span>কিমি দূরে বড় জিনিস</span></span><b>${U.tk(big)}</b></li>
      <li><span>📊 <span>${U.tk(1000)}</span> <span>বিক্রিতে লোকালহাটের কমিশন</span></span><b>${U.tk(c)}</b></li>
    </ul>`;
  }
  const feePage = () => {
    const shown = (n) => (window.LHI18n.lang === 'en' ? n : U.bn(n));
    const r = D().feeRules;
    const num = (id, label, value, max) => `<label class="field"><span>${label}</span><input id="${id}" type="text" inputmode="numeric" maxlength="${max || 4}" value="${shown(value)}"></label>`;
    return `<h1 class="page-h">সেটিং</h1>
    <form id="admin-fee" class="panel" novalidate>
      <h2 class="tight">🛵 ডেলিভারি চার্জ</h2>
      ${num('ad-fee', 'একটি ঠিকানায় প্রথম দোকানের চার্জ (৳)', Store.deliveryFee())}
      ${num('ad-fee-next', 'একই ঠিকানায় পরের প্রতি দোকানের চার্জ (৳)', Store.deliveryFeeNext())}
      <div class="row2">${num('ad-free-km', 'এই চার্জে কত কিমি পর্যন্ত', r.freeKm, 2)}${num('ad-per-km', 'এর পরে প্রতি কিমি (৳)', r.perKm, 3)}</div>
      <h2 class="tight gap-t">🚚 বড় জিনিস (ভ্যান বা পিকআপ)</h2>
      <div class="row2">${num('ad-big', 'প্রথম কিমিগুলোর চার্জ (৳)', r.bigFee)}${num('ad-big-km', 'এর পরে প্রতি কিমি (৳)', r.bigPerKm, 3)}</div>
      <h2 class="tight gap-t">📊 লোকালহাটের কমিশন</h2>
      ${num('ad-rate', 'পণ্যের দাম বা সেবার বিলের উপর (%)', D().commission, 2)}
      <small class="err" id="ad-fee-err" role="alert"></small>
      <p class="note gap-t">দূরত্ব দোকান থেকে ঠিকানা পর্যন্ত সোজা হিসাবে। দোকান থেকে নিলে এবং সেবা বা বুকিংয়ে ডেলিভারি চার্জ নেই। ডেলিভারি চার্জ লোকালহাটের, অফারের ছাড়ও লোকালহাট দেয়। আগের অর্ডারের চার্জ ও কমিশন বদলাবে না।</p>
      <h3 class="loc-h">এখনকার হিসাবে উদাহরণ</h3>
      ${chargeExample()}
      <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
    </form>
    <form id="admin-limit" class="panel gap-t" novalidate>
      <h2 class="tight">⚖️ রিফান্ডের সীমা</h2>
      ${num('ad-limit', 'এর বেশি টাকার রিফান্ডে দুজনের সিদ্ধান্ত লাগবে (৳)', Store.refundLimit(), 7)}
      <small class="err" id="ad-limit-err" role="alert"></small>
      <button type="submit" class="btn ghost block">সংরক্ষণ করুন</button>
    </form>
    ${helplineHtml()}
    ${window.LHTeam.settingHistory()}`;
  };

  const T = () => window.LHTeam;
  const reportOf = (id) => { if (!id) return window.LHReport.allPage(); const s = Store.shopById(id); return !s ? null : can('report', s) ? window.LHReport.shopPage(id, true) : T().noPerm(); };
  const PAGES = {
    '': ['dash', () => T().dashPage()], shops: ['shops', shopsPage], riders: ['riders', ridersPage], report: ['report', reportOf], offers: ['ads', offersPage], refunds: ['refunds', refundsPage],
    support: ['support', supportPage], fee: ['settings', feePage], 'new-shop': ['shop.add', newShopPage], visit: ['visit', (id) => window.LHCats.visitPage(id)], team: ['team', () => T().teamPage()], audit: ['audit', () => T().auditPage()], order: ['orders', (code) => T().orderPage(code)]
  };
  const DEEP = ['support', 'report', 'order', 'visit'];
  function page(parts) {
    if (!Store.isAdmin()) {
      if (parts[0]) { location.hash = '#/admin'; return ''; }
      return T().loginPage();
    }
    const tab = parts[0] || '';
    if (!Object.hasOwn(PAGES, tab) || (parts[1] && !DEEP.includes(tab))) return null;
    const [perm, fn] = PAGES[tab];
    const body = can(perm) ? fn(parts[1]) : T().noPerm();
    return body === null ? null : `<div class="panel-page">${body}<button type="button" class="link" data-team="logout">লগ আউট</button></div>`;
  }

  /* ---------- events ---------- */
  function onClick(e) {
    const el = e.target.closest('[data-admin]');
    if (!el) return;
    const d = el.dataset;
    try {
      switch (d.admin) {
        case 'shop-tab': shopTab = d.id; U.route(true); break;
        case 'shop-verify': { const s = Store.shopById(d.id); Store.setShopVerified(d.id, !s.verified); U.route(true); break; }
        case 'shop-suspend': reasonSheet('এজেন্ট স্থগিত করবেন?', 'গ্রাহকরা এই দোকান দেখতে বা অর্ডার দিতে পারবেন না। এজেন্ট কারণ দেখতে পাবেন।', 'shop', d.id); break;
        case 'shop-resume': Store.unsuspendShop(d.id); U.toast('আবার চালু হয়েছে'); U.route(true); break;
        case 'rider-suspend': reasonSheet('ডেলিভারি ম্যান স্থগিত করবেন?', 'দোকান তাঁকে নতুন অর্ডার পাঠাতে পারবে না। তিনি কারণ দেখতে পাবেন।', 'rider', d.id); break;
        case 'rider-resume': Store.unblockRider(d.id); U.toast('আবার চালু হয়েছে'); U.route(true); break;
        case 'rider-approve': Store.approveRider(d.id); U.closeSheet(); U.toast('অনুমোদন হয়েছে'); U.route(true); break;
        case 'rider-papers': papersSheet(d.id); break;
        case 'rider-reject': reasonSheet('কাগজ ফেরত দেবেন?', 'ডেলিভারি ম্যান কারণ দেখবেন এবং আবার জমা দিতে পারবেন।', 'papers', d.id, 'ফেরত দিন'); break;
        case 'callback-done': Store.callbackDone(d.id); U.toast('কল ব্যাক শেষ হয়েছে'); U.route(true); break;
        case 'assign': Store.assignRider(d.id, $('as-' + d.id).value); U.toast('ডেলিভারি ম্যানকে পাঠানো হয়েছে'); U.route(true); break;
        case 'team-deliver': Store.teamDeliver(d.id); U.toast('ডেলিভারি সম্পন্ন হয়েছে'); U.route(true); break;
        case 'area-edit': areaSheet(d.kind, d.id); break;
        case 'ns-more': if (document.querySelectorAll('.ns-item').length < 30) $('ns-items').insertAdjacentHTML('beforeend', itemRow()); break;
        case 'added-ok': Store.teamCheckShop(d.id, true); U.toast('অনুমোদন হয়েছে, এখন ব্যবহারকারীরা দেখবেন'); U.route(true); break;
        case 'added-no': reasonSheet('যোগ করা দোকান বাতিল করবেন?', 'যিনি যোগ করেছেন তিনি কারণ দেখবেন। দোকানটি ব্যবহারকারীরা দেখবেন না।', 'added-no', d.id, 'বাতিল করুন'); break;
        case 'main-cat': mainCatSheet(d.id); break;
        case 'ratings': ratingsSheet(d.about, d.id); break;
        case 'rating-toggle':
          if (d.hide) { reasonSheet('রেটিং লুকাবেন?', 'গ্রাহকরা এই রেটিং আর দেখবেন না। কারণ লগে থাকবে।', 'rating', d.id, 'লুকান', `data-about="${U.esc(d.about)}" data-target="${U.esc(d.target)}"`); break; }
          Store.setRatingHidden(d.id, false); ratingsSheet(d.about, d.target); U.route(true);
          break;
        case 'offer-new': offerSheet(null); break;
        case 'offer-edit': offerSheet(d.id); break;
        case 'offer-del': reasonSheet('অফার মুছবেন?', 'আগের অর্ডারের ছাড় বদলাবে না। কারণ লগে থাকবে।', 'offer-del', d.id, 'মুছুন'); break;
        case 'ad-new': adSheet(null); break;
        case 'ad-edit': adSheet(d.id); break;
        case 'ad-up': Store.moveAd(d.id, -1); U.route(true); break;
        case 'ad-down': Store.moveAd(d.id, 1); U.route(true); break;
        case 'ad-del': reasonSheet('বিজ্ঞাপন মুছবেন?', 'হোম পেজে এটি আর দেখাবে না। কারণ লগে থাকবে।', 'ad-del', d.id, 'মুছুন'); break;
        case 'refund-tab': refundTab = d.id; U.route(true); break;
        case 'refund-pay': refundSheet(d.id, true); break;
        case 'refund-no': refundSheet(d.id, false); break;
        case 'refund-ok': Store.refundCheck(d.id, true); U.toast('অনুমোদন হয়েছে, রিফান্ড শেষ'); U.route(true); break;
        case 'refund-back': reasonSheet('সিদ্ধান্ত ফেরত পাঠাবেন?', 'রিফান্ড আবার খোলা হবে, আবার কাউকে সিদ্ধান্ত দিতে হবে।', 'refund-back', d.id, 'ফেরত পাঠান'); break;
        case 'ticket-tab': ticketTab = d.id; U.route(true); break;
        case 'ticket-status': Store.ticketSetStatus(d.id, d.to); U.toast(d.to === 'closed' ? 'অনুরোধ বন্ধ হয়েছে' : 'অনুরোধ আবার খোলা হয়েছে'); location.hash = '#/admin/support'; break;
      }
    } catch (ex) { U.toast(ex.message); U.route(true); }
  }
  function onChange(e) {
    if (e.target.id === 'ar-zila') { $('ar-list').innerHTML = U.upazilaOptions(e.target.value); return; }
    if (e.target.id === 'ns-zila') {
      $('ns-areas').innerHTML = U.upazilaOptions(e.target.value);
      const pos = window.LH_GEO_POS[e.target.value];
      if (pos && nsMap && !nsPin) nsMap.map.setView(pos, 12);
      return;
    }
    // the ad form: a product ad lists the chosen shop's products
    if (e.target.id === 'adf-shop') { $('adf-item').innerHTML = `<option value="">বেছে নিন</option>${itemOptions(e.target.value, '')}`; return; }
    if (e.target.name === 'adf-kind') { $('adf-item-row').hidden = e.target.value !== 'item'; return; }
    const adId = e.target.dataset && e.target.dataset.adminAd;
    if (adId) { Store.setAdActive(adId, e.target.checked); U.route(true); return; }
    const id = e.target.dataset && e.target.dataset.adminOffer;
    if (!id) return;
    Store.setOfferActive(id, e.target.checked);
    U.route(true);
  }
  function onSubmit(e) {
    const f = e.target;
    if (f.id === 'new-shop') {
      e.preventDefault();
      const week = window.LHBook.readWeek();
      if (!week) return;
      const num = (v) => { const t = digits(String(v || '')).trim(); return t === '' ? 0 : /^\d+$/.test(t) ? Number(t) : NaN; };
      const items = [...document.querySelectorAll('.ns-item')].map((r) => ({ name: r.querySelector('[data-ns=name]').value, unit: r.querySelector('[data-ns=unit]').value, price: num(r.querySelector('[data-ns=price]').value) }));
      const zila = $('ns-zila').value;
      try {
        const x = Store.teamAddShop({
          ownerName: $('ns-owner').value, ownerPhone: digits($('ns-phone').value), name: $('ns-name').value, sub: $('ns-sub').value,
          zila, area: zila ? window.LHI18n.areaKey(zila, $('ns-area').value) : $('ns-area').value, market: $('ns-market').value, address: $('ns-address').value,
          lat: nsPin ? nsPin.lat : NaN, lng: nsPin ? nsPin.lng : NaN, week, items
        });
        U.toast(x.added.status === 'ok' ? 'দোকান যোগ হয়েছে, এখন ব্যবহারকারীরা দেখবেন' : 'দোকান যোগ হয়েছে, ভেরিফিকেশনের অনুমোদনের অপেক্ষায়');
        U.route();
      } catch (ex) { $('ns-err').textContent = ex.message; }
      return;
    }
    if (f.id === 'main-cat') {
      e.preventDefault();
      try { Store.teamSetMainCat(f.dataset.id, $('mc-sub').value); U.closeSheet(); U.toast('সংরক্ষিত'); U.route(true); } catch (ex) { $('mc-err').textContent = ex.message; }
      return;
    }
    if (f.id === 'admin-limit') {
      e.preventDefault();
      try { Store.setRefundLimit(intOf('ad-limit')); U.toast('সংরক্ষিত'); U.route(true); } catch (ex) { $('ad-limit-err').textContent = ex.message; }
    }
    if (f.id === 'help-form') {
      e.preventDefault();
      try {
        Store.setHelpline(digits($('hl-phone').value));
        U.toast('সংরক্ষিত');
        U.route(true);
      } catch (ex) { $('hl-err').textContent = ex.message; $('hl-phone').focus(); }
    }
    if (f.id === 'admin-fee') {
      e.preventDefault();
      try {
        Store.setCharges({ first: intOf('ad-fee'), next: intOf('ad-fee-next'), freeKm: intOf('ad-free-km'), perKm: intOf('ad-per-km'), bigFee: intOf('ad-big'), bigPerKm: intOf('ad-big-km'), rate: intOf('ad-rate') });
        U.toast('সংরক্ষিত');
        U.route(true);
      } catch (ex) {
        $('ad-fee-err').textContent = ex.message;
        $('ad-fee').focus();
      }
    }
    if (f.id === 'ad-reason') {
      e.preventDefault();
      try {
        const k = f.dataset.kind;
        const why = $('ad-why').value;
        if (k === 'shop') Store.suspendShop(f.dataset.id, why);
        else if (k === 'papers') Store.rejectRider(f.dataset.id, why);
        else if (k === 'offer-del') Store.deleteOffer(f.dataset.id, why);
        else if (k === 'ad-del') Store.deleteAd(f.dataset.id, why);
        else if (k === 'refund-back') Store.refundCheck(f.dataset.id, false, why);
        else if (k === 'rating') Store.setRatingHidden(f.dataset.id, true, why);
        else if (k === 'added-no') Store.teamCheckShop(f.dataset.id, false, why);
        else Store.blockRider(f.dataset.id, why);
        U.closeSheet();
        U.toast({ papers: 'কাগজ ফেরত দেওয়া হয়েছে', 'offer-del': 'মুছে ফেলা হয়েছে', 'ad-del': 'মুছে ফেলা হয়েছে', 'refund-back': 'ফেরত পাঠানো হয়েছে', rating: 'রেটিং লুকানো হয়েছে' }[k] || 'স্থগিত হয়েছে');
        if (k === 'rating') ratingsSheet(f.dataset.about, f.dataset.target);
        U.route(true);
      } catch (ex) { $('ad-why-err').textContent = ex.message; }
    }
    if (f.id === 'ad-area') {
      e.preventDefault();
      try {
        // an upazila typed in English is kept by its Bangla name, so it matches the users' addresses
        const area = window.LHI18n.areaKey($('ar-zila').value, $('ar-upazila').value);
        if (f.dataset.kind === 'shop') Store.setShopArea(f.dataset.id, $('ar-zila').value, area);
        else Store.setRiderArea(f.dataset.id, $('ar-zila').value, area, { addr: $('ar-addr').value, market: $('ar-market').value, km: Number($('ar-km').value) });
        U.closeSheet();
        U.toast('সংরক্ষিত');
        U.route(true);
      } catch (ex) { $('ar-err').textContent = ex.message; }
    }
    if (f.id === 'ad-form') {
      e.preventDefault();
      try {
        Store.saveAd(adDraft, { kind: f.elements['adf-kind'].value, shopId: $('adf-shop').value, itemId: $('adf-item').value, text: $('adf-text').value });
        U.closeSheet();
        U.toast('সংরক্ষিত');
        U.route(true);
      } catch (ex) { $('adf-err').textContent = ex.message; }
    }
    if (f.id === 'promo-form') {
      e.preventDefault();
      try {
        Store.saveOffer(offerDraft, { title: $('pr-title').value, code: $('pr-code').value, kind: f.elements['pr-kind'].value, value: intOf('pr-value'), minOrder: intOf('pr-min'), until: $('pr-until').value });
        U.closeSheet();
        U.toast('সংরক্ষিত');
        U.route(true);
      } catch (ex) { $('pr-err').textContent = ex.message; }
    }
    if (f.id === 'refund-decide') {
      e.preventDefault();
      try {
        const pay = !!f.dataset.pay;
        const step = Store.refundDecide(f.dataset.code, pay ? 'paid' : 'rejected', pay ? intOf('rd-amount') : 0, $('rd-note').value);
        U.closeSheet();
        U.toast(step === 'check' ? 'সংরক্ষিত, এখন আরেকজনের অনুমোদন লাগবে' : 'সংরক্ষিত');
        U.route(true);
      } catch (ex) { $('rd-err').textContent = ex.message; }
    }
  }
  function init(ui) {
    U = ui;
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('submit', onSubmit);
  }
  return { init, tabs, page, mount };
})();

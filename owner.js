// Agent panel. Each shop or service provider is a LocalHaat agent, like a bKash or Nagad agent; the code still calls this side "owner".
window.LHOwner = (function () {
  'use strict';
  const Store = window.LHStore;
  let U;
  let orderTab = 'new';
  let cameBack = true;
  let itemDraft = null;
  let itemImage; // undefined: unchanged, empty string: removed, data URL: new picture
  const ICONS = ['📦', '🛒', '🍚', '🥚', '🐟', '🍗', '🥕', '🍎', '🧂', '🫗', '💊', '👕', '👗', '📱', '🔌', '🔧', '✂️', '📚', '🧹', '🎁'];

  const me = () => window.LHAuth.current('owner');
  const shop = () => { const m = me(); return m && Store.shopById(m.shopId); };
  const orders = () => { const s = shop(); return s ? Store.data.orders.filter((o) => o.shopId === s.id) : []; };
  const newCount = () => orders().filter((o) => o.status === 'placed').length;
  const unread = () => { const s = shop(); return s ? Store.unreadTotal({ shopId: s.id }, 'shop') : 0; };
  const digits = (s) => String(s).replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c));

  function tabs(link) {
    const h = location.hash;
    if (!me()) return link('#/owner', '🏪', 'প্যানেল', true) + link('#/account/owner', '👤', 'একাউন্ট', false);
    const service = shop() && shop().kind === 'service';
    const clinic = Store.setupOf(shop()) === 'clinic';
    const bus = Store.setupOf(shop()) === 'bus';
    const launch = Store.setupOf(shop()) === 'launch';
    return link('#/owner', '📥', 'অর্ডার', h === '#/owner' || h.startsWith('#/owner/orders') || h.startsWith('#/owner/report'), newCount()) +
      link('#/owner/chat', '💬', 'চ্যাট', h.startsWith('#/owner/chat'), unread()) +
      (bus ? link('#/owner/trips', '🧾', 'যাত্রী', h.startsWith('#/owner/trips')) : '') +
      (launch ? window.LHLaunch.ownerTabs(link, h) : clinic ? link('#/owner/items', '🩺', 'ডাক্তার ও টেস্ট', h.startsWith('#/owner/items'))
        : bus ? link('#/owner/items', '🚌', 'রুট', h.startsWith('#/owner/items') || h.startsWith('#/owner/route'))
          : link('#/owner/items', '📦', service ? 'সেবা' : 'পণ্য', h.startsWith('#/owner/items'))) +
      link('#/owner/shop', '🏪', 'দোকান', h.startsWith('#/owner/shop')) +
      link('#/account/owner', '👤', 'একাউন্ট', h.startsWith('#/account') || h.startsWith('#/support'), window.LHCare.unreadFor(me().id));
  }

  function page(parts) {
    if (!me()) { location.hash = '#/auth/owner/login'; return ''; }
    const s = shop();
    if (!s) return null;
    const banner = (s.suspended ? `<a class="warn-link" href="#/support/owner">⛔ লোকালহাট টিম আপনার দোকান স্থগিত করেছে, গ্রাহক দেখতে পাচ্ছেন না। কারণ: ${U.ud(s.suspended.reason)}। সাপোর্টে জানান ›</a>` : '') +
      (s.hidden ? '<a class="warn-link" href="#/auth/verify/owner">⚠️ একাউন্ট ভেরিফাই না করা পর্যন্ত আপনার দোকান গ্রাহকদের কাছে দেখা যাবে না। এখনই ভেরিফাই করুন ›</a>' : '') +
      (s.week ? '' : '<a class="warn-link" href="#/owner/shop">🕒 সাপ্তাহিক খোলার সময় ঠিক করুন, গ্রাহক এখনো দেখতে পাচ্ছেন না ›</a>');
    const tab = parts[0] || 'orders';
    let body = null;
    // a launch counter's launches, routes, trips and the counter itself
    if (Store.setupOf(s) === 'launch' && ['items', 'boat', 'lroute', 'counter'].includes(tab)) body = window.LHLaunch.ownerPage(s, parts);
    else if (tab === 'orders') body = ordersPage(s);
    else if (tab === 'items') body = itemsPage(s);
    else if (tab === 'shop') body = shopPage(s);
    else if (tab === 'chat') body = window.LHBook.ownerChat(s, parts[1]);
    else if (tab === 'route' && Store.setupOf(s) === 'bus') body = routePage(s, parts[1]);
    else if (tab === 'trips' && !parts[1] && Store.setupOf(s) === 'bus') body = tripsPage(s);
    else if (tab === 'report' && !parts[1]) body = window.LHReport.shopPage(s.id, false);
    return body === null ? null : `<div class="panel-page">${banner}${body}</div>`;
  }

  /* ---------- orders ---------- */
  function ordersPage(s) {
    const all = orders();
    const groups = {
      new: all.filter((o) => o.status === 'placed'),
      active: all.filter((o) => o.status !== 'placed' && !Store.isFinal(o)),
      done: all.filter((o) => Store.isFinal(o))
    };
    // coming back to the panel: new orders must be the first thing the owner sees
    if (cameBack && groups.new.length) orderTab = 'new';
    cameBack = false;
    const today = new Date().toDateString();
    const doneToday = all.filter((o) => ['delivered', 'completed'].includes(o.status) && new Date(o.createdAt).toDateString() === today);
    const chip = (id, label) => `<button type="button" class="chip ${orderTab === id ? 'on' : ''}" aria-pressed="${orderTab === id}" data-own="order-tab" data-id="${id}">${label} (${U.bn(groups[id].length)})</button>`;
    const list = groups[orderTab];
    return `<h1 class="page-h">${U.ud(s.name)}</h1>
      <p class="meta gap">${window.LHRate.badge('shop', s.id, 'এখনো রেটিং নেই')}</p>
      <div class="stats">
        <div><b>${U.bn(groups.new.length)}</b><span>নতুন অর্ডার</span></div>
        <div><b>${U.bn(groups.active.length)}</b><span>চলমান</span></div>
        <div><b>${U.tk(doneToday.reduce((a, o) => a + o.total, 0))}</b><span>আজকের বিক্রি</span></div>
      </div>
      <a class="promise rep-link" href="#/owner/report"><span class="promise-ico" aria-hidden="true">📊</span><span><b>মাসিক বিক্রির রিপোর্ট</b> প্রতি মাসের বিক্রি, বেশি বিক্রি হওয়া পণ্য ও এলাকায় আপনার অবস্থান</span><span class="promise-go" aria-hidden="true">›</span></a>
      <div class="chips" role="group" aria-label="অর্ডারের ধরন">${chip('new', 'নতুন')}${chip('active', 'চলমান')}${chip('done', 'শেষ')}</div>
      <div class="stack">${list.length ? list.map((o) => orderCard(o, s)).join('') : '<div class="empty"><span aria-hidden="true">📭</span><h3>এখানে কোনো অর্ডার নেই</h3><p>নতুন অর্ডার এলে এখানে দেখা যাবে।</p></div>'}</div>`;
  }
  // the company's delivery man comes by himself; the shop only sees who
  const riderLine = (o) => (o.delivery
    ? `<p class="meta o-wait">🛵 ${U.ud(o.delivery.name)} পণ্য নিতে আসবেন · <a href="tel:${U.esc(o.delivery.phone)}">কল করুন</a></p>`
    : '<p class="meta o-wait">🛵 ডেলিভারি ম্যান খোঁজা হচ্ছে, লোকালহাট টিম দেখছে।</p>');
  function bookingActions(o, cancel) {
    const chat = o.book === 'quote' ? `<a class="btn ghost" href="#/owner/chat/${o.customerId}">💬 চ্যাট</a>` : '';
    const offer = o.book === 'quote' ? `<button type="button" class="btn ghost" data-own="offer" data-code="${o.code}">💰 বিল প্রস্তাব</button>` : '';
    const wait = o.offer ? `<p class="meta o-wait">💰 প্রস্তাব ${U.tk(o.offer.amount)}, গ্রাহকের সম্মতির অপেক্ষায়।</p>` : '';
    const deal = o.contract ? `<p class="meta o-wait">🤝 চুক্তি ${U.tk(o.contract.amount)}${o.contract.terms ? ' · ' + U.ud(o.contract.terms) : ''}</p>` : '';
    if (o.status === 'placed') return `${wait}<div class="o-acts"><button type="button" class="btn" data-own="accept" data-code="${o.code}">✓ বুকিং নিশ্চিত করুন</button>${offer}${chat}${cancel}</div>`;
    if (o.status === 'confirmed') return `${deal}${wait}<div class="o-acts">${o.offer ? '' : `<button type="button" class="btn" data-own="complete" data-code="${o.code}">✓ সেবা সম্পন্ন</button>`}${offer}${chat}${cancel}</div>`;
    return deal;
  }
  function orderActions(o, s) {
    const cancel = `<button type="button" class="btn ghost" data-own="cancel" data-code="${o.code}">বাতিল</button>`;
    // a bus ticket is sold at once; the passenger is taken on board from the list of the day's trips
    if (o.book === 'bus') return o.status === 'confirmed' ? `<div class="o-acts"><a class="btn" href="#/owner/trips">🧾 যাত্রীর তালিকায় ওঠান</a>${cancel}</div>` : '';
    // a launch ticket: boarded from the trip's list; cancelling it here pays it all back
    if (o.book === 'launch') return o.status === 'confirmed' ? `<div class="o-acts"><a class="btn" href="#/owner/counter/${o.launch.trip}/pass">🧾 যাত্রীর তালিকা</a>${cancel}</div>` : '';
    if (o.book) return bookingActions(o, cancel);
    if (o.status === 'placed') {
      return `${o.mode === 'delivery' ? '<p class="meta o-wait">গ্রহণ করলে লোকালহাটের ডেলিভারি ম্যান অটোমেটিক খবর পাবেন।</p>' : ''}<div class="o-acts"><button type="button" class="btn" data-own="accept" data-code="${o.code}">✓ অর্ডার গ্রহণ করুন</button>${cancel}</div>`;
    }
    if (o.status === 'confirmed' && o.mode !== 'service') {
      return `${o.mode === 'delivery' ? riderLine(o) : ''}<div class="o-acts"><button type="button" class="btn" data-own="pack" data-code="${o.code}">📦 পণ্য প্রস্তুত</button>${cancel}</div>`;
    }
    if (o.status === 'confirmed') return `<div class="o-acts"><button type="button" class="btn" data-own="complete" data-code="${o.code}">✓ সেবা সম্পন্ন</button>${cancel}</div>`;
    if (o.status === 'packed' && o.mode === 'pickup') return `<div class="o-acts"><button type="button" class="btn" data-own="complete" data-code="${o.code}">✓ গ্রাহক পণ্য নিয়েছেন</button>${cancel}</div>`;
    if (o.status === 'packed') return `${riderLine(o)}<div class="o-acts">${cancel}</div>`;
    if (o.status === 'out_for_delivery') return `<p class="meta o-wait">🛵 ${U.ud(o.delivery.name)} পণ্য নিয়ে রওনা হয়েছেন।</p>`;
    return '';
  }
  // LocalHaat's share of a finished order, and what the agent keeps
  function commissionLine(o) {
    const m = Store.orderMoney(o);
    const rate = o.rate === undefined ? Store.data.commission : o.rate;
    return `<p class="meta">📊 <span>লোকালহাট কমিশন</span> <span>${U.bn(rate)}%</span>: ${U.tk(m.commission)} · <span>আপনার আয়</span> ${U.tk((o.mode === 'service' ? o.total : o.sub) - m.commission)}</p>`;
  }
  function orderCard(o, s) {
    const modeTxt = o.book === 'launch' ? '🛳️ লঞ্চের টিকেট' : o.trip ? '🚚 ট্রিপ বুকিং' : o.book ? '🗓️ বুকিং' : o.mode === 'pickup' ? '🏪 দোকান থেকে নেবেন' : o.mode === 'service' ? '🗓️ সেবা' : '🛵 বাসায় ডেলিভারি';
    return `<article class="panel o-card" id="o-${o.code}">
      <div class="o-head"><div><b translate="no">#${U.bn(o.code)}</b><small>${U.fmtTime(o.createdAt)} · ${modeTxt}</small></div><span class="tag ${Store.isFinal(o) ? '' : 'ok'}">${Store.label(o, o.status)}</span></div>
      <ul class="mini">${o.lines.map((l) => `<li><span>${l.icon} ${U.bn(l.qty)} × ${U.ud(l.name)}</span><b>${l.price ? U.tk(l.price * l.qty) : 'দাম পরে'}</b></li>`).join('')}</ul>
      ${Store.isFinal(o) ? '' : window.LHBook.jobHtml(o)}
      ${o.discount ? `<div class="sum"><span>অফার ছাড়</span><b>−${U.tk(o.discount)}</b></div>` : ''}
      <div class="sum total"><span>মোট</span><b>${U.tk(o.total)}</b></div>
      <p class="meta"><span>${U.payText(o)}</span>${o.big ? ' · <span>🚚 বড় জিনিস, ভ্যান বা পিকআপ আসবে</span>' : ''}</p>
      ${Store.isFinished(o) ? commissionLine(o) : ''}
      ${o.refund ? `<p class="meta o-wait">↩️ ${window.LHCare.refundText(o.refund)}</p>` : ''}
      ${Store.isFinal(o) ? '' : `<p class="o-who">👤 ${U.ud(o.recipient.name)}${o.recipient.phone ? ` · <a href="tel:${U.esc(o.recipient.phone)}">${U.bn(o.recipient.phone)}</a>` : ''}${o.mode === 'delivery' || o.book === 'quote' ? `<br>📍 ${U.ud(o.recipient.line)}` : ''}${o.when ? `<br>🗓️ ${U.fmtWhen(o.when)}` : ''}${o.serial ? `<br>🎫 সিরিয়াল ${U.bn(o.serial)}` : ''}${o.patient ? `<br>🩺 ${Store.PATIENT[o.patient]}` : ''}</p>`}
      ${o.note && !Store.isFinal(o) ? `<p class="note">${U.ud(o.note)}</p>` : ''}
      ${orderActions(o, s)}
    </article>`;
  }

  /* ---------- items ---------- */
  // one row of the list; the switch says what "available" means for it. editHref: a page of its own instead of the sheet.
  function ownRow(it, sub, on, off, editHref) {
    return `<li class="item own-item ${it.available ? '' : 'off'}">
        ${U.thumbHtml(it)}
        <div class="item-txt"><b>${U.ud(it.name)}</b><small>${sub}</small>${window.LHBook.priceHtml(it)}</div>
        <div class="own-acts">
          <label class="switch"><input type="checkbox" data-own-toggle="${it.id}" ${it.available ? 'checked' : ''}><span>${it.available ? on : off}</span></label>
          ${editHref ? `<a class="btn ghost sm" href="${editHref}">এডিট</a>` : `<button type="button" class="btn ghost sm" data-own="item-edit" data-id="${it.id}">এডিট</button>`}
          <button type="button" class="btn danger sm" data-own="item-del" data-id="${it.id}" aria-label="মুছুন: ${U.ud(it.name)}">মুছুন</button>
        </div></li>`;
  }
  function itemsPage(s) {
    if (Store.setupOf(s) === 'clinic') return clinicPage(s);
    if (Store.setupOf(s) === 'bus') return routesPage(s);
    const word = s.kind === 'service' ? 'সেবা' : 'পণ্য';
    const waiting = s.waiting || [];
    const asked = Store.openAsks(s.id).map((a) => a.sub);
    const waitTag = (it) => (waiting.includes(it) ? (asked.includes(it.sub) ? ' · <span class="tag warn">⏳ অনুমোদনের অপেক্ষায়</span>' : ' · <span class="tag bad">বিভাগ অনুমোদন নেই</span>') : '');
    const all = s.items.concat(waiting);
    return `<div class="page-row"><h1 class="page-h">${word}র তালিকা</h1><button type="button" class="btn" data-own="item-new">+ নতুন ${word}</button></div>
      ${waiting.length ? `<a class="warn-link" href="#/owner/shop">⏳ ${U.bn(waiting.length)} <span>টি পণ্য বা সেবা অনুমোদনের অপেক্ষায়, গ্রাহক এখনো দেখছেন না।</span> ›</a>` : ''}
      ${all.length ? `<ul class="items">${all.map((it) => ownRow(it, `${U.ud(it.unit)}${it.sub ? ' · ' + U.esc(it.sub) : ''}${waitTag(it)}${it.trip ? ' · ট্রিপ বুকিং' : it.book === 'quote' ? ' · সেবা বুকিং' : it.book === 'fixed' ? ' · নির্দিষ্ট দামে বুকিং' : ''}${it.vehicle ? ' · <span>🚗 গাড়ির তথ্য চাওয়া হয়</span>' : ''}${it.big ? ' · <span>🚚 বড় জিনিস</span>' : ''}`, 'আছে', 'স্টক নেই')).join('')}</ul>` : `<div class="empty"><span aria-hidden="true">📦</span><h3>এখনো কিছু যোগ করা হয়নি</h3><p>প্রথম ${word} যোগ করলে গ্রাহক দেখতে পাবেন।</p></div>`}`;
  }
  // A clinic lists its doctors and its tests. The sub-category chosen at sign up decides this.
  function clinicPage(s) {
    const B = window.LHBook;
    const docs = s.items.filter((it) => it.role === 'doctor');
    const tests = s.items.filter((it) => it.role === 'test');
    const rest = s.items.filter((it) => !it.role);
    return `<div class="page-row"><h1 class="page-h">ডাক্তার</h1><button type="button" class="btn" data-own="doc-new">+ নতুন ডাক্তার</button></div>
      ${docs.length ? `<ul class="items">${docs.map((it) => ownRow(it, `${U.ud(it.degree || '')}${it.speciality ? ' · ' + U.ud(it.speciality) : ''}<br>🗓️ ${B.daysText(it.days)} · ${B.slotsText(it)}`, 'বসছেন', 'ছুটিতে')).join('')}</ul>` : '<div class="empty"><span aria-hidden="true">🩺</span><h3>এখনো কোনো ডাক্তার যোগ করা হয়নি</h3><p>ডাক্তারের তথ্য, চেম্বারের সময় ও ফি দিলে রোগী সিরিয়াল নিতে পারবেন।</p></div>'}
      <div class="page-row gap-t"><h2 class="page-h">টেস্ট ও দাম</h2><button type="button" class="btn" data-own="test-new">+ নতুন টেস্ট</button></div>
      ${tests.length ? `<ul class="items">${tests.map((it) => ownRow(it, [it.note ? U.ud(it.note) : '', B.offerText(it)].filter(Boolean).join(' · ') || U.ud(it.unit), 'হচ্ছে', 'বন্ধ')).join('')}</ul>` : '<div class="empty"><span aria-hidden="true">🧪</span><h3>এখনো কোনো টেস্ট যোগ করা হয়নি</h3><p>টেস্টের নাম, দাম ও অফার দিন।</p></div>'}
      ${rest.length ? `<h2 class="page-h gap-t">অন্যান্য সেবা</h2><ul class="items">${rest.map((it) => ownRow(it, U.ud(it.unit), 'আছে', 'স্টক নেই')).join('')}</ul>` : ''}`;
  }
  const photoField = (it, label) => `<div class="field"><span class="flabel">${label}</span>
          <div class="it-upload">
            <div class="it-preview" id="it-preview">${it && it.image ? `<img src="${it.image}" alt="">` : '<span aria-hidden="true">📷</span>'}</div>
            <div class="it-upload-acts">
              <label class="btn ghost sm upload"><input type="file" class="sr" accept="image/jpeg,image/png,image/webp" data-img="item">ছবি বাছুন</label>
              <button type="button" class="inline" id="it-img-del" data-own="it-img-del" ${it && it.image ? '' : 'hidden'}>ছবি মুছুন</button>
              <small>JPG, PNG বা WebP। বর্গাকারে কাটা হবে।</small>
            </div>
          </div><small class="err" id="it-img-err"></small></div>`;
  // a sub-category is a shop's or a service's kind of business, whatever its category
  const kindOfSub = (sub) => window.LH.subKind[sub] || (Store.catOfSub(sub) || U.catById(shop().cat)).kind;
  const SUB_STATE = { main: '', ok: '', wait: ' (অনুমোদনের অপেক্ষায়)', none: ' (অনুমোদন নেই)' };
  // The shop's own sub-category is the default. Only a shop with more categories picks one, from its own approved and asked ones.
  function subField(s, it) {
    const subs = Store.subChoices(s);
    if (it && it.sub && !subs.some((x) => x.sub === it.sub)) subs.push({ sub: it.sub, state: 'none' });
    const cur = it && it.sub ? it.sub : subs[0] ? subs[0].sub : '';
    const wait = (subs.find((x) => x.sub === cur) || {}).state;
    if (subs.length < 2) return { cur, html: `<input type="hidden" id="it-sub" value="${U.esc(cur)}"><p class="meta it-cat">🏷️ <span>সাব-ক্যাটাগরি</span>: ${window.LHCats.subLabel(cur)}</p>` };
    return { cur, html: `<label class="field"><span>সাব-ক্যাটাগরি</span><select id="it-sub" data-own-sub>${subs.map((x) => `<option value="${U.esc(x.sub)}" data-kind="${kindOfSub(x.sub)}" data-wait="${x.state === 'wait' || x.state === 'none' ? '1' : ''}" ${x.sub === cur ? 'selected' : ''}>${U.esc(x.sub)}${SUB_STATE[x.state]}</option>`).join('')}</select>
        <small id="it-sub-wait" ${wait === 'wait' || wait === 'none' ? '' : 'hidden'}>এই বিভাগ অনুমোদন হলে গ্রাহক এটি দেখতে পাবেন।</small></label>` };
  }
  function itemSheet(id) {
    const s = shop();
    const it = id ? Store.findItem(s, id) : null;
    const word = s.kind === 'service' ? 'সেবা' : 'পণ্য';
    itemDraft = id || null;
    itemImage = undefined;
    const sf = subField(s, it);
    const service = kindOfSub(sf.cur) === 'service';
    const bookNow = it ? (it.trip ? 'trip' : it.book || '') : (service ? 'quote' : '');
    const ways = [['', '🛒 পণ্য', 'কার্টে যোগ করে কিনবেন'], ['quote', '🗓️ সেবা বুকিং', 'চার্জ দিন, বাকি বিল চ্যাটে ঠিক হবে'], ['fixed', '🎫 নির্দিষ্ট দামে বুকিং', 'বাসের সিট, ডাক্তারের সিরিয়াল, ক্লাস, কার ওয়াশ']]
      .concat(s.kind === 'service' ? [['trip', '🚚 ট্রিপ / গাড়ি ভাড়া', 'কোথা থেকে কোথায়, কবে; ভাড়া চ্যাটে ঠিক হবে']] : []);
    U.openSheet(`<h2 id="sheet-h">${it ? word + ' এডিট করুন' : 'নতুন ' + word}</h2>
      <form id="item-form" novalidate>
        ${photoField(it, word + 'র ছবি')}
        <label class="field"><span>${word}র নাম</span><input id="it-name" type="text" maxlength="80" value="${U.esc(it ? it.name : '')}"><small class="err" id="it-name-err"></small></label>
        ${sf.html}
        <fieldset class="field fs" id="it-ways" ${service ? '' : 'hidden'}><legend>গ্রাহক কিভাবে নেবেন?</legend>
          ${ways.map(([v, t, sub]) => `<label class="pay"><input type="radio" name="it-book" value="${v}" ${bookNow === v ? 'checked' : ''}><span><b>${t}</b><small>${sub}</small></span></label>`).join('')}
        </fieldset>
        <div id="it-trip" ${bookNow === 'trip' ? '' : 'hidden'}>
          <label class="field"><span>কী নেওয়া হবে</span><select id="it-trip-kind">${[['goods', 'মালামাল'], ['people', 'যাত্রী'], ['patient', 'রোগী (অ্যাম্বুলেন্স)']].map(([v, t]) => `<option value="${v}" ${it && it.trip === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        </div>
        ${s.kind === 'service' ? `<label class="switch gap-b" id="it-veh-wrap" ${service && (bookNow === 'quote' || bookNow === 'fixed') ? '' : 'hidden'}><input type="checkbox" id="it-vehicle" ${it && it.vehicle ? 'checked' : ''}><span>🚗 গ্রাহকের গাড়ির তথ্য চাইবেন (গাড়ি মেরামত, ওয়াশ বা সার্ভিসিং)</span></label>` : ''}
        <div class="row2">
          <label class="field"><span id="it-price-label">${priceLabel(bookNow)}</span><input id="it-price" type="text" inputmode="numeric" value="${it ? U.bn(it.price) : ''}" placeholder="০"><small id="it-price-hint">${priceHint(bookNow)}</small><small class="err" id="it-price-err"></small></label>
          <label class="field"><span>একক</span><input id="it-unit" type="text" maxlength="30" value="${U.esc(it ? it.unit : '')}" placeholder="যেমন ১ কেজি"></label>
        </div>
        ${s.kind === 'shop' || !service ? `<label class="switch gap-b" id="it-big-wrap" ${service ? 'hidden' : ''}><input type="checkbox" id="it-big" ${it && it.big ? 'checked' : ''}><span>🚚 বড় জিনিস: বাইকে যাবে না, ভ্যান বা পিকআপে যাবে (ডেলিভারি চার্জ বেশি)</span></label>` : ''}
        <div id="it-fixed" ${bookNow === 'fixed' ? '' : 'hidden'}>
          <label class="field"><span>সময়গুলো (কমা দিয়ে, ২৪ ঘণ্টার হিসাবে)</span><input id="it-slots" type="text" inputmode="numeric" value="${U.esc(it && it.slots ? it.slots.join(', ') : '')}" placeholder="যেমন: 10:00, 17:30"><small class="err" id="it-slots-err"></small></label>
          <label class="field"><span>প্রতি সময়ে কতজন / কয়টি সিট</span><input id="it-cap" type="text" inputmode="numeric" value="${it && it.cap ? U.bn(it.cap) : ''}"><small class="err" id="it-cap-err"></small></label>
          <label class="switch"><input type="checkbox" id="it-multi" ${it && it.multi ? 'checked' : ''}><span>একজন একাধিক নিতে পারবেন (যেমন বাসের সিট)</span></label>
        </div>
        <fieldset class="field fs"><legend>আইকন</legend><div class="icon-pick">${(it && !ICONS.includes(it.icon) ? [it.icon] : []).concat(ICONS).map((ic, i) => `<label><input type="radio" name="it-icon" value="${ic}" ${(it ? it.icon === ic : i === 0) ? 'checked' : ''}><span>${ic}</span></label>`).join('')}</div></fieldset>
        <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }

  /* ---------- a clinic's doctors and tests ---------- */
  const DAY_NAMES = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const WEEK = [6, 0, 1, 2, 3, 4, 5];
  function doctorSheet(id) {
    const s = shop();
    const it = id ? s.items.find((x) => x.id === id) : null;
    itemDraft = id || null;
    itemImage = undefined;
    // a new doctor sits on the days the clinic is open
    const days = it && it.days ? it.days : WEEK.filter((d) => !s.week || !s.week[d].off);
    U.openSheet(`<h2 id="sheet-h">${it ? 'ডাক্তারের তথ্য এডিট করুন' : 'নতুন ডাক্তার'}</h2>
      <form id="doc-form" novalidate>
        ${photoField(it, 'ডাক্তারের ছবি')}
        <label class="field"><span>ডাক্তারের নাম</span><input id="it-name" type="text" maxlength="80" value="${U.esc(it ? it.name : '')}" placeholder="যেমন: ডা. রফিকুল ইসলাম"><small class="err" id="it-name-err"></small></label>
        <label class="field"><span>ডিগ্রি</span><input id="doc-degree" type="text" maxlength="100" value="${U.esc(it ? it.degree || '' : '')}" placeholder="যেমন: এমবিবিএস, এফসিপিএস (মেডিসিন)"><small class="err" id="doc-degree-err"></small></label>
        <label class="field"><span>কোন বিষয়ের বিশেষজ্ঞ</span><input id="doc-spec" type="text" maxlength="60" value="${U.esc(it ? it.speciality || '' : '')}" placeholder="যেমন: মেডিসিন, শিশু, গাইনি"><small class="err" id="doc-spec-err"></small></label>
        <fieldset class="field fs"><legend>কোন কোন দিন বসেন</legend><div class="day-pick">${WEEK.map((d) => `<label><input type="checkbox" id="doc-day-${d}" data-doc-day="${d}" ${days.includes(d) ? 'checked' : ''}><span>${DAY_NAMES[d]}</span></label>`).join('')}</div><small class="err" id="doc-days-err"></small></fieldset>
        <label class="field"><span>চেম্বারের সময় (কমা দিয়ে, ২৪ ঘণ্টার হিসাবে)</span><input id="it-slots" type="text" inputmode="numeric" value="${U.esc(it && it.slots ? it.slots.join(', ') : '')}" placeholder="যেমন: 10:00, 17:30"><small class="err" id="it-slots-err"></small></label>
        <label class="field"><span>প্রতি সময়ে কতজন রোগী</span><input id="it-cap" type="text" inputmode="numeric" value="${it && it.cap ? U.bn(it.cap) : ''}"><small class="err" id="it-cap-err"></small></label>
        <div class="row2">
          <label class="field"><span>নতুন রোগীর ফি (৳)</span><input id="doc-new" type="text" inputmode="numeric" value="${it ? U.bn(it.price) : ''}" placeholder="০"><small class="err" id="doc-new-err"></small></label>
          <label class="field"><span>পুরাতন রোগীর ফি (৳)</span><input id="doc-old" type="text" inputmode="numeric" value="${it && it.oldFee !== undefined ? U.bn(it.oldFee) : ''}" placeholder="০"><small class="err" id="doc-old-err"></small></label>
        </div>
        <label class="field"><span>পুরাতন রোগী কারা (ঐচ্ছিক)</span><input id="doc-rule" type="text" maxlength="120" value="${U.esc(it ? it.oldRule || '' : '')}" placeholder="যেমন: ৩০ দিনের মধ্যে আবার এলে, আগের প্রেসক্রিপশন সাথে আনুন"></label>
        <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }
  function testSheet(id) {
    const s = shop();
    const it = id ? s.items.find((x) => x.id === id) : null;
    const of = it && it.offer;
    itemDraft = id || null;
    itemImage = undefined;
    U.openSheet(`<h2 id="sheet-h">${it ? 'টেস্ট এডিট করুন' : 'নতুন টেস্ট'}</h2>
      <form id="test-form" novalidate>
        <label class="field"><span>টেস্টের নাম</span><input id="it-name" type="text" maxlength="80" value="${U.esc(it ? it.name : '')}" placeholder="যেমন: সিবিসি, ইসিজি"><small class="err" id="it-name-err"></small></label>
        <div class="row2">
          <label class="field"><span>দাম (৳)</span><input id="it-price" type="text" inputmode="numeric" value="${it ? U.bn(it.price) : ''}" placeholder="০"><small class="err" id="it-price-err"></small></label>
          <label class="field"><span>অফারে দাম (৳, ঐচ্ছিক)</span><input id="test-offer" type="text" inputmode="numeric" value="${of ? U.bn(of.price) : ''}" placeholder="অফার না থাকলে খালি"><small class="err" id="test-offer-err"></small></label>
        </div>
        <label class="field"><span>অফার চলবে যেদিন পর্যন্ত (ঐচ্ছিক)</span><input id="test-until" type="date" value="${of && of.until ? of.until : ''}"><small>খালি রাখলে অফার তুলে না দেওয়া পর্যন্ত চলবে।</small><small class="err" id="test-until-err"></small></label>
        <label class="field"><span>রোগীর জন্য নোট (ঐচ্ছিক)</span><input id="test-note" type="text" maxlength="120" value="${U.esc(it ? it.note || '' : '')}" placeholder="যেমন: খালি পেটে আসুন · রিপোর্ট পরদিন"></label>
        <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }
  function saveClinicItem(form, s) {
    const v = (x) => document.getElementById(x).value.trim();
    const old = itemDraft ? s.items.find((x) => x.id === itemDraft) : null;
    const name = v('it-name');
    if (name.length < 2) return show('it-name-err', 'নাম লিখুন (কমপক্ষে ২ অক্ষর)', 'it-name');
    let values;
    if (form.id === 'doc-form') {
      if (v('doc-degree').length < 2) return show('doc-degree-err', 'ডিগ্রি লিখুন', 'doc-degree');
      if (v('doc-spec').length < 2) return show('doc-spec-err', 'কোন বিষয়ের ডাক্তার, লিখুন', 'doc-spec');
      const days = [...form.querySelectorAll('[data-doc-day]:checked')].map((x) => Number(x.dataset.docDay)).sort((a, b) => a - b);
      if (!days.length) return show('doc-days-err', 'অন্তত একটি দিন বেছে নিন', 'doc-day-6');
      const slots = digits(v('it-slots')).split(/[,\s]+/).filter(Boolean);
      if (!slots.length || !slots.every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) return show('it-slots-err', 'সময় লিখুন, যেমন 10:00, 17:30', 'it-slots');
      const cap = digits(v('it-cap'));
      if (!/^\d{1,3}$/.test(cap) || +cap < 1) return show('it-cap-err', 'সংখ্যা লিখুন', 'it-cap');
      const fee = digits(v('doc-new'));
      if (!/^\d{1,6}$/.test(fee)) return show('doc-new-err', 'ফি সংখ্যায় লিখুন', 'doc-new');
      const oldFee = digits(v('doc-old'));
      if (!/^\d{1,6}$/.test(oldFee)) return show('doc-old-err', 'ফি সংখ্যায় লিখুন', 'doc-old');
      values = { role: 'doctor', book: 'fixed', degree: v('doc-degree'), speciality: v('doc-spec'), days, slots, cap: +cap, multi: false, price: +fee, oldFee: +oldFee, oldRule: v('doc-rule'), unit: 'প্রতি ভিজিট', icon: (old && old.icon) || '🩺' };
      if (itemImage !== undefined) values.image = itemImage;
    } else {
      const price = digits(v('it-price'));
      if (!/^\d{1,6}$/.test(price)) return show('it-price-err', 'দাম সংখ্যায় লিখুন', 'it-price');
      const offer = digits(v('test-offer'));
      if (offer && (!/^\d{1,6}$/.test(offer) || +offer >= +price)) return show('test-offer-err', 'অফারের দাম আসল দামের চেয়ে কম দিন', 'test-offer');
      const until = v('test-until');
      if (offer && until && until < Store.today()) return show('test-until-err', 'আজ বা পরের কোনো দিন দিন', 'test-until');
      values = { role: 'test', book: 'test', price: +price, offer: offer ? { price: +offer, until } : undefined, note: v('test-note'), unit: 'প্রতি টেস্ট', icon: (old && old.icon) || '🧪' };
    }
    try { Store.saveItem(s.id, itemDraft, Object.assign({ name, sub: s.sub }, values)); } catch (ex) { return show('it-name-err', ex.message, 'it-name'); }
    U.closeSheet();
    U.toast('সংরক্ষিত');
    U.route(true);
  }

  const priceLabel = (b) => (b === 'trip' ? 'শুরুর ভাড়া (৳)' : b === 'quote' ? 'সার্ভিস চার্জ (৳)' : 'দাম (৳)');
  const priceHint = (b) => (b === 'trip' ? 'দূরত্ব ও মাল দেখে আসল ভাড়া চ্যাটে ঠিক হবে' : b === 'quote' ? 'বাকি বিল গ্রাহকের সাথে কথা বলে ঠিক হবে' : b === 'fixed' ? 'ফ্রি হলে ০ দিন' : 'আলোচনা সাপেক্ষে হলে ০ দিন');

  /* ---------- a bus counter: its routes, each stop and counter on the map, and the day's passengers ---------- */
  const clockOf = (t) => window.LHBook.slotsText({ slots: [t] });
  function routesPage(s) {
    const routes = s.items.filter((it) => it.book === 'bus');
    const others = s.items.filter((it) => it.book !== 'bus');
    return `<div class="page-row"><h1 class="page-h">রুট</h1><a class="btn" href="#/owner/route/new">+ নতুন রুট</a></div>
      <p class="meta gap">প্রতিটি রুটে স্টপগুলো ক্রমানুসারে দিন: শুরু থেকে কত কিমি, কত মিনিট। যেখানে আপনার কাউন্টার আছে, ম্যাপে তার জায়গা ও ফোন দিন। অ্যাপে টিকেট কাটা যাত্রী যেকোনো স্টপ থেকে উঠবেন, ভাড়া হবে দূরত্ব অনুযায়ী।</p>
      ${routes.length ? `<ul class="items">${routes.map((it) => ownRow(it, `<span>${U.esc(it.coach)}</span> · <span>${U.bn(it.stops.length)}টি স্টপ</span> · <span>${U.bn(it.stops.filter((x) => x.counter).length)}টি কাউন্টার</span><br>🕒 ${window.LHBook.slotsText({ slots: it.times })}`, 'চালু', 'বন্ধ', `#/owner/route/${it.id}`)).join('')}</ul>`
    : '<div class="empty"><span aria-hidden="true">🚌</span><h3>এখনো কোনো রুট নেই</h3><p>প্রথম রুট দিলে যাত্রী টিকেট কাটতে পারবেন।</p></div>'}
      ${others.length ? `<h2 class="page-h gap-t">অন্যান্য</h2><ul class="items">${others.map((it) => ownRow(it, U.ud(it.unit), 'আছে', 'স্টক নেই')).join('')}</ul>` : ''}`;
  }
  // the route being written, kept while the page is drawn again
  let rd = null;
  let rdKey = '';
  let rdMap = null;
  const blankStop = () => ({ name: '', km: '', min: '', counter: false, phone: '' });
  const routeFare = () => {
    const n = (v) => Number(digits(String(v || '')).trim());
    const last = rd.stops[rd.stops.length - 1];
    const it = { rate: n(rd.rate), minFare: n(rd.minFare), stops: [{ km: 0 }, { km: n(last.km) }] };
    return it.rate > 0 && it.stops[1].km > 0 ? `পুরো রুটের ভাড়া ${U.tk(Store.busFare(it, 0, 1))}` : '';
  };
  const activeText = () => `📍 স্টপ ${U.bn(rd.active + 1)} বাছা আছে। ম্যাপে চাপলে তার জায়গা বসবে।`;
  function stopRow(st, i) {
    const val = (v) => U.esc(v === undefined || v === null ? '' : U.bn(v));
    return `<li class="rt-stop ${i === rd.active ? 'on' : ''}" id="rt-stop-${i}">
      <div class="rt-row"><span class="st-n" aria-hidden="true">${U.bn(i + 1)}</span>
        <input type="text" aria-label="স্টপের নাম: ${U.bn(i + 1)}" data-rs="name" data-i="${i}" maxlength="60" placeholder="স্টপের নাম" value="${U.esc(st.name || '')}">
        <input type="text" aria-label="শুরু থেকে কিমি" data-rs="km" data-i="${i}" inputmode="decimal" placeholder="কিমি" value="${val(st.km)}" ${i ? '' : 'readonly'}>
        <input type="text" aria-label="শুরু থেকে মিনিট" data-rs="min" data-i="${i}" inputmode="numeric" placeholder="মিনিট" value="${val(st.min)}" ${i ? '' : 'readonly'}></div>
      <div class="rt-row2">
        <label class="chk"><input type="checkbox" data-rs="counter" data-i="${i}" ${st.counter ? 'checked' : ''}><span>কাউন্টার আছে</span></label>
        ${st.counter ? `<input type="tel" aria-label="কাউন্টারের ফোন" data-rs="phone" data-i="${i}" inputmode="numeric" placeholder="কাউন্টারের ফোন" value="${U.esc(st.phone || '')}">` : ''}
        <button type="button" class="inline" data-own="rt-pin" data-i="${i}">${Number.isFinite(st.lat) ? '✓ ম্যাপে আছে' : '📍 ম্যাপে দিন'}</button>
        ${i ? `<button type="button" class="inline danger-txt" data-own="rt-del" data-i="${i}" aria-label="স্টপ মুছুন: ${U.bn(i + 1)}">✕ মুছুন</button>` : ''}
      </div></li>`;
  }
  function routePage(s, id) {
    const it = id && id !== 'new' ? s.items.find((x) => x.id === id && x.book === 'bus') : null;
    if (id !== 'new' && !it) return null;
    const key = s.id + '/' + id;
    if (rdKey !== key) {
      rd = it ? { coach: it.coach, seats: it.seats, rate: it.rate, minFare: it.minFare, times: it.times.join(', '), via: it.via !== undefined ? it.via : ((it.name.match(/\((.+) হয়ে\)$/) || [])[1] || ''),
        stops: it.stops.map((x) => Object.assign({}, x)), active: 0 }
        : { coach: Store.BUS_COACH[0], seats: 40, rate: '', minFare: '', times: '', via: '', stops: [Object.assign(blankStop(), { name: s.market || '', km: 0, min: 0, counter: true, phone: s.phone, lat: s.lat, lng: s.lng }), blankStop()], active: 1 };
      rdKey = key;
    }
    const field = (k, label, o) => `<label class="field"><span>${label}</span><input id="rt-${k}" data-rt="${k}" type="text" ${o.mode ? `inputmode="${o.mode}"` : ''} maxlength="${o.max || 10}" ${o.ph ? `placeholder="${o.ph}"` : ''} value="${U.esc(o.raw ? rd[k] : rd[k] === '' ? '' : U.bn(rd[k]))}">${o.hint ? `<small>${o.hint}</small>` : ''}</label>`;
    return `<a class="back" href="#/owner/items">‹ সব রুট</a>
      <h1 class="page-h">${it ? 'রুট এডিট করুন' : 'নতুন রুট'}</h1>
      <form id="route-form" class="stack" novalidate>
        <section class="panel">
          <h2 class="tight">বাস ও ভাড়া</h2>
          <fieldset class="field fs"><legend>কোচ</legend><div class="vehicles">${Store.BUS_COACH.map((c) => `<label class="radio-pill"><input type="radio" name="rt-coach" data-rt="coach" value="${c}" ${rd.coach === c ? 'checked' : ''}><span>${c}</span></label>`).join('')}</div></fieldset>
          <div class="row2">${field('seats', 'প্রতি ট্রিপে সিট', { mode: 'numeric', max: 3 })}${field('rate', 'কিমি প্রতি ভাড়া (৳)', { mode: 'decimal', max: 6, ph: 'যেমন: ২.৫', hint: 'বিআরটিএর হার মেনে দিন।' })}</div>
          <div class="row2">${field('minFare', 'সবচেয়ে কম ভাড়া (৳)', { mode: 'numeric', max: 5 })}${field('times', 'ছাড়ার সময় (কমা দিয়ে, ২৪ ঘণ্টার হিসাবে)', { mode: 'numeric', max: 120, ph: 'যেমন: 07:00, 15:30', raw: true })}</div>
          ${field('via', 'কোন পথে <i>(ঐচ্ছিক)</i>', { max: 40, ph: 'যেমন: গাজীপুর', hint: 'রুটের নামে দেখাবে: শুরু – শেষ (… হয়ে)', raw: true })}
        </section>
        <section class="panel">
          <h2 class="tight">স্টপ ও কাউন্টার</h2>
          <p class="meta">ক্রমানুসারে দিন, প্রথম স্টপে আপনার কাউন্টার। কিমি ও মিনিট শুরু থেকে গুনে লিখুন। 📍 চেপে স্টপ বাছুন, তারপর ম্যাপে চেপে তার জায়গা দিন।</p>
          <ol class="rt-stops" id="rt-stops">${rd.stops.map(stopRow).join('')}</ol>
          <button type="button" class="btn ghost sm" data-own="rt-add">+ স্টপ যোগ করুন</button>
          <div id="rt-map" class="mini-map rt-map" aria-label="স্টপের জায়গা বাছার ম্যাপ"></div>
          <p class="meta" id="rt-active" role="status">${activeText()}</p>
        </section>
        <p class="meta" id="rt-fare" role="status">${routeFare()}</p>
        <small class="err" id="rt-err" role="alert"></small>
        <button type="submit" class="btn block">সংরক্ষণ করুন</button>
      </form>`;
  }
  function routeSave(s) {
    const n = (v) => { const t = digits(String(v === undefined || v === null ? '' : v)).trim(); return t === '' ? NaN : Number(t); };
    const match = rdKey.match(/\/(.+)$/);
    const id = match && match[1] !== 'new' ? match[1] : null;
    try {
      Store.saveRoute(s.id, id, {
        coach: rd.coach, seats: n(rd.seats), rate: n(rd.rate), minFare: n(rd.minFare), via: rd.via,
        times: digits(rd.times).split(/[,\s]+/).filter(Boolean),
        stops: rd.stops.map((x) => ({ name: x.name, km: n(x.km), min: n(x.min), lat: x.lat, lng: x.lng, counter: !!x.counter, phone: digits(x.phone || '').replace(/[\s-]/g, '') }))
      });
    } catch (ex) { document.getElementById('rt-err').textContent = ex.message; return; }
    rd = null; rdKey = '';
    U.toast('রুট সংরক্ষিত');
    location.hash = '#/owner/items';
  }
  // passengers by trip and stop: who gets on where, paid or paying on the bus, and the code to check
  let tripDay = '';
  function passenger(o) {
    const l = o.lines[0];
    return `<div class="pass" id="ps-${o.code}"><span>🟢 ${U.ud(o.recipient.name)} · <a href="tel:${U.esc(o.recipient.phone)}">${U.bn(o.recipient.phone)}</a> · <span>${U.bn(l.qty)}টি সিট</span> · 🏁 <span>নামবেন</span> ${U.ud(o.bus.toName)} · ${o.paid ? '<span>অনলাইনে দেওয়া</span>' : `<span>বাসে নেবেন</span> ${U.tk(o.total)}`}</span>
      ${o.status === 'completed' ? '<span class="tag ok">✓ উঠেছেন</span>' : `<span class="pass-board"><input id="pin-${o.code}" type="text" inputmode="numeric" maxlength="4" aria-label="যাত্রীর টিকেটের কোড" placeholder="কোড"><button type="button" class="btn sm" data-own="bus-board" data-code="${o.code}">উঠেছেন</button></span>`}</div>`;
  }
  function tripsPage(s) {
    const day = tripDay || Store.today();
    const list = Store.busList(s.id, day).filter((r) => r.trips.length);
    const seats = (orders) => orders.reduce((a, o) => a + o.lines[0].qty, 0);
    return `<h1 class="page-h">যাত্রীর তালিকা</h1>
      <p class="meta gap">অ্যাপে টিকেট কাটা যাত্রী কোন স্টপ থেকে উঠবেন। যাত্রীর টিকেটের ৪ সংখ্যার কোড মিলিয়ে ওঠান।</p>
      <label class="field"><span>তারিখ</span><input id="trip-day" type="date" value="${day}"></label>
      ${list.length ? list.map((r) => `<section class="panel"><h2 class="tight">${U.ud(r.it.name)}</h2>
        ${r.trips.map((t) => `<div class="trip"><h3>🕒 ${clockOf(t.time)} <span>ট্রিপ</span> · <span>${U.bn(seats(t.list))}টি সিট বিক্রি</span></h3>
          <ol class="stops">${t.stops.filter((x) => x.on.length || x.off.length).map((x) => `<li class="${x.stop.counter ? 'counter' : ''}"><span class="st-n" aria-hidden="true">${x.stop.counter ? '🏪' : U.bn(x.i + 1)}</span>
            <span class="st-txt"><b>${U.ud(x.stop.name)}</b>${x.off.length ? `<small>🏁 <span>নামবেন</span>: <span>${U.bn(seats(x.off))} জন</span></small>` : ''}${x.on.map(passenger).join('')}</span></li>`).join('')}</ol></div>`).join('')}</section>`).join('')
    : '<div class="empty"><span aria-hidden="true">🧾</span><h3>এই দিনে অ্যাপে কাটা কোনো টিকেট নেই</h3></div>'}`;
  }
  function mount() {
    const el = document.getElementById('rt-map');
    rdMap = null;
    if (!el || !rd) return;
    rdMap = window.LHMap.routeEdit(el, (lat, lng) => {
      const st = rd.stops[rd.active];
      if (!st) return;
      st.lat = lat; st.lng = lng;
      const b = document.querySelector(`#rt-stop-${rd.active} [data-own=rt-pin]`);
      if (b) b.textContent = '✓ ম্যাপে আছে';
      rdMap.draw(rd.stops, rd.active);
    });
    rdMap.draw(rd.stops, rd.active);
  }

  /* ---------- shop settings ---------- */
  function shopPage(s) {
    return `<div class="page-row"><h1 class="page-h">দোকানের প্রোফাইল</h1>${s.hidden ? '' : `<a class="btn ghost sm" href="#/shop/${s.id}" data-action="view-as">👁 গ্রাহক যেভাবে দেখবেন</a>`}</div>
      <section class="profile edit">
        <div class="profile-cover" style="--tint:${U.catById(s.cat).tint}">${U.coverHtml(s)}
          <button type="button" class="pic-btn cover-btn" data-own="pic" data-key="cover" aria-label="কভার ছবি: আপলোড, বদল বা মুছুন"><span class="pic-chip"><span aria-hidden="true">📷</span> ${s.cover ? 'কভার বদলান' : 'কভার দিন'}</span></button></div>
        <div class="profile-body">
          <button type="button" class="pic-btn logo-btn" data-own="pic" data-key="logo" aria-label="প্রোফাইল ছবি: আপলোড, বদল বা মুছুন">${U.logoHtml(s, 'profile-logo')}<span class="pic-cam" aria-hidden="true">📷</span></button>
          <p class="meta pic-hint">প্রোফাইল বা কভার ছবিতে চাপ দিন: আপলোড, বদল বা মুছে ফেলা যাবে।</p>
        </div>
      </section>
      ${window.LHCats.ownerSection(s)}
      <form id="shop-form" class="panel shop-form" novalidate>
        <label class="switch big"><input type="checkbox" id="sh-open" ${s.open ? 'checked' : ''}><span>${s.open ? 'দোকান চালু আছে (সাপ্তাহিক সময় অনুযায়ী খোলা)' : 'দোকান সাময়িকভাবে বন্ধ'}</span></label>
        <label class="field"><span>দোকান / সেবার নাম</span><input id="sh-name" type="text" maxlength="80" value="${U.esc(s.name)}"><small class="err" id="sh-name-err"></small></label>
        ${s.kind === 'service' ? '' : '<p class="note">🛵 ডেলিভারি ম্যান ও ডেলিভারি চার্জ লোকালহাট ঠিক করে। অর্ডার গ্রহণ করলে এলাকার ডেলিভারি ম্যান অটোমেটিক খবর পাবেন।</p>'}
        ${window.LHBook.weekEditor(s)}
        <label class="field"><span>পরিচিতি (ঐচ্ছিক)</span><textarea id="sh-about" rows="2" maxlength="300">${U.esc(s.about || '')}</textarea></label>
        <p class="meta gap-t">${s.verified ? '✓ ট্রেড লাইসেন্স যাচাইকৃত। নাম বদলালে ব্যাজ চলে যাবে, আবার যাচাই করতে হবে।' : 'ট্রেড লাইসেন্স জমা দিলে যাচাইকৃত ব্যাজ পাবেন।'}</p>
        <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
      </form>`;
  }

  // Pressing the profile or cover picture, as on Facebook: see it, upload or change it, or remove it.
  function picSheet(key) {
    const s = shop();
    const has = !!s[key];
    const logo = key === 'logo';
    U.openSheet(`<h2 id="sheet-h">${logo ? 'প্রোফাইল ছবি' : 'কভার ছবি'}</h2>
      <p class="meta">${logo ? 'লোগো বা দোকানের ছবি, বর্গাকারে কাটা হবে।' : 'চওড়া ছবি, ৩:১ অনুপাতে কাটা হবে।'}</p>
      <div class="pic-menu">
        ${has ? `<button type="button" data-own="pic-see" data-key="${key}"><span aria-hidden="true">👁</span>ছবি দেখুন</button>` : ''}
        <label><input type="file" class="sr" accept="image/jpeg,image/png,image/webp" data-img="${key}"><span aria-hidden="true">${has ? '🔄' : '📤'}</span>${has ? 'ছবি বদলান' : 'ছবি আপলোড করুন'}</label>
        ${has ? `<button type="button" class="danger-txt" data-own="pic-del-ask" data-key="${key}"><span aria-hidden="true">🗑️</span>ছবি মুছুন</button>` : ''}
      </div>
      <small class="err" id="pic-err" role="alert"></small>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }

  /* ---------- events ---------- */
  function confirmDelete(title, msg, action, id) {
    U.openSheet(`<h2 id="sheet-h">${title}</h2><p>${msg}</p>
      <button type="button" class="btn block danger-fill" data-own="${action}" data-id="${id}">হ্যাঁ, মুছুন</button>
      <button type="button" class="link" data-action="close-sheet">না, থাক</button>`);
  }
  function onClick(e) {
    const el = e.target.closest('[data-own]');
    if (!el) return;
    const d = el.dataset;
    const s = shop();
    try {
      switch (d.own) {
        case 'order-tab': orderTab = d.id; U.route(true); break;
        case 'rt-pin':
          rd.active = Number(d.i);
          document.querySelectorAll('.rt-stop').forEach((li, i) => li.classList.toggle('on', i === rd.active));
          document.getElementById('rt-active').textContent = activeText();
          if (rdMap) rdMap.draw(rd.stops, rd.active);
          break;
        case 'rt-add': rd.stops.push(blankStop()); rd.active = rd.stops.length - 1; U.route(true); break;
        case 'rt-del': rd.stops.splice(Number(d.i), 1); rd.active = Math.min(rd.active, rd.stops.length - 1); U.route(true); break;
        case 'bus-board': {
          const box = document.getElementById('pin-' + d.code);
          Store.busBoard(d.code, digits(box ? box.value : ''));
          U.toast('যাত্রী উঠেছেন');
          U.route(true);
          break;
        }
        case 'accept': Store.accept(d.code); U.toast('অর্ডার গ্রহণ করা হয়েছে'); orderTab = 'active'; U.route(true); break;
        case 'pack': Store.pack(d.code); U.toast('পণ্য প্রস্তুত, ডেলিভারি ম্যান জানতে পারবেন'); U.route(true); break;
        case 'complete': Store.shopComplete(d.code); orderTab = 'done'; U.route(true); break;
        case 'cancel':
          U.openSheet(`<h2 id="sheet-h">অর্ডার বাতিল করবেন?</h2>
            <form id="cancel-form" data-code="${d.code}" novalidate><label class="field"><span>কারণ (গ্রাহক দেখবেন)</span><input id="cancel-why" type="text" maxlength="120" placeholder="যেমন: পণ্য শেষ হয়ে গেছে"><small class="err" id="cancel-err"></small></label>
            <button type="submit" class="btn block sheet-go">অর্ডার বাতিল করুন</button></form>
            <button type="button" class="link" data-action="close-sheet">না, থাক</button>`);
          break;
        case 'img-del': Store.setShopImage(s.id, d.key, ''); U.closeSheet(); U.toast('ছবি মুছে ফেলা হয়েছে'); U.route(true); break;
        case 'pic': picSheet(d.key); break;
        case 'pic-see':
          U.openSheet(`<h2 id="sheet-h" class="sr">${d.key === 'logo' ? 'প্রোফাইল ছবি' : 'কভার ছবি'}</h2><img class="photo-big" src="${s[d.key]}" alt="${d.key === 'logo' ? 'প্রোফাইল ছবি' : 'কভার ছবি'}"><button type="button" class="link" data-own="pic" data-key="${d.key}">‹ ফিরে যান</button>`);
          break;
        case 'pic-del-ask':
          U.openSheet(`<h2 id="sheet-h">${d.key === 'logo' ? 'প্রোফাইল ছবি মুছবেন?' : 'কভার ছবি মুছবেন?'}</h2><p>গ্রাহক এর জায়গায় দোকানের আইকন দেখবেন।</p>
            <button type="button" class="btn block danger-fill" data-own="img-del" data-key="${d.key}">হ্যাঁ, মুছুন</button>
            <button type="button" class="link" data-own="pic" data-key="${d.key}">না, থাক</button>`);
          break;
        case 'it-img-del':
          itemImage = '';
          document.getElementById('it-preview').innerHTML = '<span aria-hidden="true">📷</span>';
          el.hidden = true;
          break;
        case 'offer': {
          const o = Store.data.orders.find((x) => x.code === d.code);
          U.openSheet(`<h2 id="sheet-h">বিল প্রস্তাব</h2><p class="meta">সার্ভিস চার্জ ${U.tk(o.sub)}। সমস্যা দেখে মোট বিল লিখুন। গ্রাহক রাজি হলে চুক্তি হবে।</p>
            <form id="offer-form" data-code="${o.code}" novalidate>
              <label class="field"><span>মোট বিল (৳)</span><input id="of-amount" type="text" inputmode="numeric" value="${U.bn(o.offer ? o.offer.amount : o.total)}"><small class="err" id="of-amount-err"></small></label>
              <label class="field"><span>কী কী কাজ, শর্ত (ঐচ্ছিক)</span><textarea id="of-terms" rows="3" maxlength="300" placeholder="যেমন: কয়েল বদল, ৩০ দিনের ওয়ারেন্টি"></textarea></label>
              <button type="submit" class="btn block sheet-go">গ্রাহককে পাঠান</button>
            </form>
            <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
          break;
        }
        case 'item-new': itemSheet(null); break;
        case 'doc-new': doctorSheet(null); break;
        case 'test-new': testSheet(null); break;
        case 'item-edit': {
          const it = Store.findItem(s, d.id);
          if (it && it.role === 'doctor') doctorSheet(d.id); else if (it && it.role === 'test') testSheet(d.id); else itemSheet(d.id);
          break;
        }
        case 'item-del': {
          const it = Store.findItem(s, d.id);
          confirmDelete(`"${U.ud(it.name)}" মুছবেন?`, 'আগের অর্ডারে এটি থেকে যাবে, নতুন গ্রাহক আর দেখবেন না।', 'item-del-yes', d.id);
          break;
        }
        case 'item-del-yes': Store.deleteItem(s.id, d.id); U.closeSheet(); U.toast('মুছে ফেলা হয়েছে'); U.route(true); break;
      }
    } catch (ex) {
      if (document.querySelector('.sheet')) U.closeSheet();
      U.toast(ex.message);
    }
  }
  const show = (id, msg, focus) => { document.getElementById(id).textContent = msg; document.getElementById(focus).focus(); };
  function onSubmit(e) {
    const s = shop();
    const id = e.target.id;
    if (!['item-form', 'shop-form', 'cancel-form', 'offer-form', 'doc-form', 'test-form', 'route-form'].includes(id)) return;
    e.preventDefault();
    if (id === 'route-form') { routeSave(s); return; }
    if (id === 'doc-form' || id === 'test-form') { saveClinicItem(e.target, s); return; }
    if (id === 'offer-form') {
      const amount = digits(document.getElementById('of-amount').value).trim();
      if (!/^\d{1,7}$/.test(amount)) return show('of-amount-err', 'বিল সংখ্যায় লিখুন', 'of-amount');
      try { Store.offer(e.target.dataset.code, +amount, document.getElementById('of-terms').value.trim()); } catch (ex) { return show('of-amount-err', ex.message, 'of-amount'); }
      U.closeSheet();
      U.toast('প্রস্তাব পাঠানো হয়েছে');
      U.route(true);
      return;
    }
    if (id === 'cancel-form') {
      const why = document.getElementById('cancel-why').value.trim();
      if (why.length < 3) return show('cancel-err', 'বাতিলের কারণ লিখুন', 'cancel-why');
      try { Store.cancel(e.target.dataset.code, 'shop', why); U.toast('অর্ডার বাতিল হয়েছে'); orderTab = 'done'; } catch (ex) { U.toast(ex.message); }
      U.closeSheet();
      U.route(true);
    } else if (id === 'item-form') {
      const name = document.getElementById('it-name').value.trim();
      const price = digits(document.getElementById('it-price').value).trim() || '0';
      if (name.length < 2) return show('it-name-err', 'নাম লিখুন (কমপক্ষে ২ অক্ষর)', 'it-name');
      const sub = document.getElementById('it-sub').value;
      const old = itemDraft ? Store.findItem(s, itemDraft) : null;
      if (!Store.subChoices(s).some((x) => x.sub === sub) && !(old && old.sub === sub)) return U.toast('বিভাগ বেছে নিন');
      if (!/^\d{1,7}$/.test(price)) return show('it-price-err', 'দাম সংখ্যায় লিখুন', 'it-price');
      // a product of a shop's kind of business goes to the cart; only a service is booked
      const waysBox = document.getElementById('it-ways');
      const way = waysBox && !waysBox.hidden ? e.target.elements['it-book'].value || undefined : undefined;
      // a trip is a booking whose bill is agreed in the chat, with a start and an end
      const book = way === 'trip' ? 'quote' : way;
      const trip = way === 'trip' ? document.getElementById('it-trip-kind').value : undefined;
      if (way === 'trip' && +price < 1) return show('it-price-err', 'শুরুর ভাড়া দিন', 'it-price');
      if (book === 'quote' && +price < 1) return show('it-price-err', 'সার্ভিস চার্জ দিন', 'it-price');
      const vehBox = document.getElementById('it-vehicle');
      const vehicle = !trip && book && vehBox && vehBox.checked ? (old && old.vehicle) || 'all' : undefined;
      let fixed = { slots: undefined, cap: undefined, multi: undefined };
      if (book === 'fixed') {
        const slots = digits(document.getElementById('it-slots').value).split(/[,\s]+/).filter(Boolean);
        if (!slots.length || !slots.every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) return show('it-slots-err', 'সময় লিখুন, যেমন 10:00, 17:30', 'it-slots');
        const cap = digits(document.getElementById('it-cap').value).trim();
        if (!/^\d{1,3}$/.test(cap) || +cap < 1) return show('it-cap-err', 'সংখ্যা লিখুন', 'it-cap');
        fixed = { slots, cap: +cap, multi: document.getElementById('it-multi').checked };
      }
      // a big item goes by van or pickup; only a shop's products are delivered at all
      const bigBox = document.getElementById('it-big');
      const big = !!(bigBox && !document.getElementById('it-big-wrap').hidden && bigBox.checked && !book) || undefined;
      try { Store.saveItem(s.id, itemDraft, { name, sub, book, trip, vehicle, big, ...fixed, price: +price, unit: document.getElementById('it-unit').value.trim() || (kindOfSub(sub) === 'service' ? 'প্রতি সেবা' : '১ পিস'), icon: e.target.elements['it-icon'].value, ...(itemImage === undefined ? {} : { image: itemImage }) }); } catch (ex) { return show('it-img-err', ex.message, 'it-name'); }
      U.closeSheet();
      U.toast(Store.subChoices(s).some((x) => x.sub === sub && x.state === 'wait') ? 'সংরক্ষিত। বিভাগ অনুমোদন হলে গ্রাহক দেখতে পাবেন।' : 'সংরক্ষিত');
      U.route(true);
    } else {
      const name = document.getElementById('sh-name').value.trim();
      if (name.length < 2) return show('sh-name-err', 'দোকানের নাম দিন', 'sh-name');
      const week = window.LHBook.readWeek();
      if (!week) return;
      if (name !== s.name) s.verified = false; // the badge was given to the old name, as in server.js
      Object.assign(s, { name, about: document.getElementById('sh-about').value.trim(), week, open: document.getElementById('sh-open').checked });
      Store.save();
      U.toast('সংরক্ষিত');
      U.route(true);
    }
  }
  async function onPicture(input) {
    const kind = input.dataset.img;
    const file = input.files[0];
    input.value = '';
    const errId = kind === 'item' ? 'it-img-err' : 'pic-err';
    const err = document.getElementById(errId);
    if (err) err.textContent = '';
    try {
      const url = await window.LHImage.read(file, kind);
      if (kind === 'item') {
        itemImage = url;
        const prev = document.getElementById('it-preview');
        if (prev) {
          const img = document.createElement('img');
          img.src = url;
          img.alt = '';
          prev.replaceChildren(img);
          document.getElementById('it-img-del').hidden = false;
        }
      } else {
        Store.setShopImage(shop().id, kind, url);
        U.closeSheet();
        U.toast('ছবি সংরক্ষিত');
        U.route(true);
      }
    } catch (ex) {
      const box = document.getElementById(errId);
      if (box) box.textContent = ex.message; else U.toast(ex.message);
    }
  }
  // what the counter types into the route form stays in the draft; a counter switched on or off draws the stop again
  function onRouteInput(e) {
    const t = e.target;
    if (!rd || !t.dataset) return false;
    if (t.dataset.rt) { rd[t.dataset.rt] = t.value; const f = document.getElementById('rt-fare'); if (f) f.textContent = routeFare(); return true; }
    const k = t.dataset.rs;
    if (!k) return false;
    const st = rd.stops[Number(t.dataset.i)];
    if (k === 'counter') { st.counter = t.checked; if (e.type === 'change') U.route(true); return true; }
    st[k] = t.value;
    const f = document.getElementById('rt-fare');
    if (f && k === 'km') f.textContent = routeFare();
    return true;
  }
  function onChange(e) {
    if (e.target.id === 'trip-day') { tripDay = e.target.value; U.route(true); return; }
    // another sub-category: a service shows the ways to book, a product the big item switch
    if (e.target.matches('[data-own-sub]')) {
      const opt = e.target.selectedOptions[0];
      const service = opt.dataset.kind === 'service';
      document.getElementById('it-ways').hidden = !service;
      const big = document.getElementById('it-big-wrap');
      if (big) big.hidden = service;
      if (!service) { const p = e.target.form.querySelector('input[name=it-book][value=""]'); if (p) p.checked = true; }
      const veh = document.getElementById('it-veh-wrap');
      if (veh) veh.hidden = !service || !['quote', 'fixed'].includes((e.target.form.querySelector('input[name=it-book]:checked') || {}).value);
      document.getElementById('it-sub-wait').hidden = !opt.dataset.wait;
      return;
    }
    if (onRouteInput(e)) return;
    if (e.target.name === 'it-book') {
      const b = e.target.value;
      document.getElementById('it-fixed').hidden = b !== 'fixed';
      document.getElementById('it-trip').hidden = b !== 'trip';
      const veh = document.getElementById('it-veh-wrap');
      if (veh) veh.hidden = b !== 'quote' && b !== 'fixed';
      document.getElementById('it-price-label').textContent = priceLabel(b);
      document.getElementById('it-price-hint').textContent = priceHint(b);
    }
    if (e.target.dataset && e.target.dataset.img) { onPicture(e.target); return; }
    const id = e.target.dataset && e.target.dataset.ownToggle;
    if (!id) return;
    const it = Store.findItem(shop(), id);
    if (it) { it.available = e.target.checked; Store.save(); U.route(true); }
  }
  function init(ui) {
    U = ui;
    window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/owner')) cameBack = true; });
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('change', onChange);
    document.addEventListener('input', (e) => { if (e.target.dataset && (e.target.dataset.rt || (e.target.dataset.rs && e.target.dataset.rs !== 'counter'))) onRouteInput(e); });
  }
  return { init, page, tabs, mount };
})();

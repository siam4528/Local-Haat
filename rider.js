// Delivery man side: one clear step at a time, big buttons, call and directions one tap away.
window.LHRider = (function () {
  'use strict';
  const Store = window.LHStore;
  let U;
  const me = () => window.LHAuth.current('delivery');
  const mine = () => { const m = me(); return m ? Store.data.orders.filter((o) => o.delivery && o.delivery.phone === m.contact) : []; };
  const active = () => mine().filter((o) => !Store.isFinal(o));

  function tabs(link) {
    const h = location.hash;
    if (!me()) return link('#/rider', '🛵', 'প্যানেল', true) + link('#/account/delivery', '👤', 'একাউন্ট', false);
    return link('#/rider', '🛵', 'কাজ', h === '#/rider' || h.startsWith('#/rider/o') || h.startsWith('#/rider/papers') || h.startsWith('#/rider/area'), active().length) +
      link('#/rider/done', '✅', 'শেষ হওয়া', h.startsWith('#/rider/done')) +
      link('#/account/delivery', '👤', 'একাউন্ট', h.startsWith('#/account') || h.startsWith('#/support'), window.LHCare.unreadFor(me().id));
  }

  const STEP = {
    confirmed: ['দোকান পণ্য গোছাচ্ছে', 'প্রস্তুত হলে এখানে জানানো হবে।'],
    packed: ['দোকানে গিয়ে পণ্য নিন', 'পণ্য মিলিয়ে নিয়ে নিচের বোতাম চাপুন।'],
    out_for_delivery: ['গ্রাহকের কাছে পৌঁছে দিন', 'পণ্য দিয়ে গ্রাহকের ৪ সংখ্যার কোড নিন।']
  };

  const NOTE = {
    assigned: ['🔔 নতুন ডেলিভারি', 'দোকান অর্ডার গ্রহণ করেছে। পণ্য প্রস্তুত হলে জানানো হবে।'],
    ready: ['🔔 পণ্য প্রস্তুত', 'দোকান থেকে পণ্য নিয়ে গ্রাহকের কাছে পৌঁছে দিন।'],
    cancelled: ['🔔 অর্ডার বাতিল হয়েছে', 'এই ডেলিভারি আর করতে হবে না।'],
    removed: ['🔔 কাজটি সরানো হয়েছে', 'এই ডেলিভারি অন্য কেউ করবেন।']
  };
  function notesHtml(m) {
    const list = Store.riderNotes(m.contact);
    if (!list.length) return '';
    return `<ul class="r-msgs" aria-label="বার্তা">${list.map((n) => {
      const o = Store.data.orders.find((x) => x.code === n.code);
      const opens = n.kind === 'assigned' || n.kind === 'ready';
      const text = `<b>${NOTE[n.kind][0]}</b><small>${o ? U.ud(o.shopName) : ''} · <span translate="no">#${U.bn(n.code)}</span></small><span>${NOTE[n.kind][1]}</span>`;
      return `<li class="r-msg">${opens ? `<a href="#/rider/o/${n.code}">${text}</a>` : `<div>${text}</div>`}<button type="button" class="inline" data-rider="note-done" data-id="${n.id}">ঠিক আছে</button></li>`;
    }).join('')}</ul>`;
  }

  function page(parts) {
    if (!me()) { location.hash = '#/auth/delivery/login'; return ''; }
    if (parts[0] === 'o') return detail(parts[1]);
    if (parts[0] === 'done') return donePage();
    if (parts[0] === 'papers' && !parts[1]) return papersPage();
    if (parts[0] === 'area' && !parts[1]) return areaPage();
    if (parts[0]) return null;
    return listPage();
  }
  // what a new delivery man must still do before jobs come: send his papers, wait for the team, or send them again
  function papersBanner(m) {
    const k = m.kyc;
    if (k && k.status === 'ok') return '';
    if (k && k.status === 'pending') return '<p class="warn-link">⏳ আপনার কাগজ লোকালহাট টিম দেখছে। অনুমোদন হলে কাজ আসবে।</p>';
    if (k && k.status === 'rejected') return `<a class="warn-link" href="#/rider/papers">⚠️ আপনার কাগজ ফেরত এসেছে। কারণ: ${U.ud(k.reason)}। আবার জমা দিন ›</a>`;
    return m.approved === false ? '<a class="warn-link" href="#/rider/papers">📄 এনআইডি ও কাগজ জমা দিন, লোকালহাট টিম যাচাই করলে কাজ আসবে ›</a>' : '';
  }
  function listPage() {
    const list = active();
    const m = me();
    const cash = list.filter((o) => o.status === 'out_for_delivery' && o.pay === 'cod').reduce((a, o) => a + o.total, 0);
    const block = Store.riderBlock(m.contact);
    const banner = (block ? `<a class="warn-link" href="#/support/delivery">⛔ লোকালহাট টিম আপনাকে স্থগিত করেছে, নতুন ডেলিভারি নেওয়া যাবে না। কারণ: ${U.ud(block.reason)}। সাপোর্টে জানান ›</a>` : '') +
      (m.verified ? '' : '<a class="warn-link" href="#/auth/verify/delivery">⚠️ একাউন্ট ভেরিফাই করুন, তাহলে কাজ আসবে ›</a>') +
      papersBanner(m) +
      (m.lat ? '' : '<a class="warn-link" href="#/rider/area">📍 ম্যাপে আপনার কাজের জায়গা, বাজার ও দূরত্ব দিন, তাহলে কাছের দোকানের অর্ডার আসবে ›</a>');
    return `<div class="panel-page">${banner}
      <h1 class="page-h">আজকের কাজ</h1>
      ${m.lat ? `<p class="meta gap"><a class="inline-link" href="#/rider/area">📍 <span>কাজের এলাকা</span>: ${m.market ? `${U.ud(m.market)} · ` : ''}<span>${U.bn(m.km || 3)} কিমি</span> · <span>বদলান</span></a></p>` : ''}
      ${notesHtml(m)}
      <div class="stats two-stats">
        <div><b>${U.bn(list.length)}</b><span>চলমান ডেলিভারি</span></div>
        <div><b>${U.tk(cash)}</b><span>সংগ্রহ করতে হবে</span></div>
      </div>
      <div class="stack">${list.length ? list.map(card).join('') : `<div class="empty"><span aria-hidden="true">🛵</span><h3>এখন কোনো ডেলিভারি নেই</h3><p>${m.area ? `${U.geo(m.area)} এর ` : ''}দোকান অর্ডার গ্রহণ করলে কাজ অটোমেটিক এখানে আসবে।</p></div>`}</div>
    </div>`;
  }
  function card(o) {
    return `<a class="panel r-card" href="#/rider/o/${o.code}">
      <div class="o-head"><div><b>${U.ud(o.shopName)}</b><small translate="no">#${U.bn(o.code)}</small></div><span class="tag ok">${STEP[o.status][0]}</span></div>
      <p class="o-who">📍 ${U.ud(o.recipient.line)}</p>
      ${o.when ? `<p class="o-who">🗓️ গ্রাহক চান: ${U.fmtWhen(o.when)}</p>` : ''}
      ${o.big ? '<p class="o-who">🚚 বড় জিনিস, ভ্যান বা পিকআপ লাগবে</p>' : ''}
      <div class="sum"><span>${o.pay === 'cod' ? 'টাকা নিতে হবে' : 'টাকা নিতে হবে না'}</span><b>${o.pay === 'cod' ? U.tk(o.total) : ''}</b></div>
    </a>`;
  }
  function detail(code) {
    const o = mine().find((x) => x.code === code);
    if (!o) return null;
    Store.riderNotesSeen(me().contact, code);
    const shop = Store.shopById(o.shopId);
    if (Store.isFinal(o)) {
      // address and phone stay private once the job is over
      return `<div class="panel-page"><a class="back" href="#/rider/done">‹ শেষ হওয়া কাজ</a>
        <div class="empty big"><span aria-hidden="true">${o.status === 'cancelled' ? '🚫' : '✅'}</span><h1>${Store.label(o, o.status)}</h1><p>${U.ud(o.shopName)} · <span translate="no">#${U.bn(o.code)}</span></p>
        <a class="btn" href="#/rider">আজকের কাজে ফিরুন</a></div></div>`;
    }
    const st = STEP[o.status];
    return `<div class="panel-page">
      <a class="back" href="#/rider">‹ আজকের কাজ</a>
      <section class="r-step"><small translate="no">#${U.bn(o.code)}</small><h1>${st[0]}</h1><p>${st[1]}</p></section>
      ${o.status === 'packed' ? `<button type="button" class="btn huge block" data-rider="pickup" data-code="${o.code}">📦 দোকান থেকে পণ্য নিয়েছি</button>
        <p class="meta">পণ্য নেওয়ার পর গ্রাহক ম্যাপে আপনার অবস্থান দেখবেন, ডেলিভারি শেষ হলে বন্ধ হবে।</p>` : ''}
      ${o.status === 'out_for_delivery' ? `<section class="panel r-live" id="r-live" data-code="${o.code}"><b>📍 লাইভ লোকেশন</b><p id="r-live-st" role="status">ফোনের লোকেশন চাওয়া হচ্ছে…</p></section>` : ''}
      ${o.status === 'out_for_delivery' ? `<form id="r-deliver" class="panel r-pin" data-code="${o.code}" novalidate>
        <label class="field"><span>গ্রাহকের ৪ সংখ্যার কোড</span><input id="r-pin" type="text" inputmode="numeric" maxlength="4" autocomplete="off" class="code-in"><small class="err" id="r-pin-err"></small></label>
        <div class="field proof-field"><span class="flabel">📷 হাতে দেওয়ার ছবি</span>
          <label class="btn ghost block proof-take"><input type="file" id="r-proof" accept="image/*" capture="environment" hidden><span id="r-proof-label">${proofShot.code === o.code ? '✓ ছবি তোলা হয়েছে, আবার তুলতে চাপুন' : '📷 জিনিস বা দরজার ছবি তুলুন'}</span></label>
          <div id="r-proof-prev" class="proof-prev">${proofShot.code === o.code ? `<img src="${proofShot.pic}" alt="ডেলিভারির ছবি">` : ''}</div>
          <small>জিনিস বা দরজা দেখা গেলেই হবে, কারো মুখের ছবি লাগবে না।</small>
          <button type="button" class="link" data-rider="no-cam">ক্যামেরা কাজ করছে না?</button>
          <label class="field" id="r-nocam" hidden><span>ছবি না তোলার কারণ</span><textarea id="r-nocam-why" rows="2" maxlength="200" placeholder="যেমন: ফোনের ক্যামেরা নষ্ট"></textarea><small>লোকালহাট টিম এটি দেখবে।</small></label></div>
        <button type="submit" class="btn huge block">✅ ডেলিভারি সম্পন্ন</button>
        <p class="meta">কোড না পেলে গ্রাহককে কল করুন, অথবা <a href="#/support/delivery">লোকালহাট টিমকে জানান</a>। টিম নিশ্চিত করতে পারবে।</p>
      </form>` : ''}
      <div class="r-stops">
        <section class="panel r-stop ${o.status === 'out_for_delivery' ? 'past' : ''}">
          <h2 class="tight">${o.status === 'out_for_delivery' ? '✓ ' : ''}🏪 দোকান</h2>
          <p><b>${U.ud(o.shopName)}</b><br>${U.ud(shop.address)}</p>
          <div class="contact"><a class="btn ghost" href="tel:${U.esc(shop.phone)}">📞 কল</a><a class="btn ghost" href="${window.LHMap.directions(shop.lat, shop.lng)}" target="_blank" rel="noopener">🧭 পথ দেখুন</a></div>
        </section>
        <section class="panel r-stop">
          <h2 class="tight">🏠 গ্রাহক</h2>
          <p><b>${U.ud(o.recipient.name)}</b><br>${U.ud(o.recipient.line)}${o.when ? `<br>🗓️ গ্রাহক চান: ${U.fmtWhen(o.when)}` : ''}</p>
          <div class="contact"><a class="btn ghost" href="tel:${U.esc(o.recipient.phone)}">📞 কল</a><a class="btn ghost" href="${window.LHMap.directions(o.recipient.lat, o.recipient.lng)}" target="_blank" rel="noopener">🧭 পথ দেখুন</a></div>
          ${o.note ? `<p class="note r-note">${U.ud(o.note)}</p>` : ''}
        </section>
      </div>
      <section class="panel">
        <h2 class="tight">যা নিতে হবে</h2>
        <ul class="mini">${o.lines.map((l) => `<li><span>${l.icon} ${U.bn(l.qty)} × ${U.ud(l.name)} <small>${U.ud(l.unit)}</small></span></li>`).join('')}</ul>
        <div class="sum total"><span>${o.pay === 'cod' ? 'গ্রাহকের কাছ থেকে নিন' : 'টাকা নিতে হবে না'}</span><b>${o.pay === 'cod' ? U.tk(o.total) : ''}</b></div>
      </section>
      <section class="panel"><h2 class="tight">ম্যাপ</h2><div class="mini-map" id="rider-map" data-code="${o.code}"></div></section>
      ${o.status !== 'out_for_delivery' ? `<button type="button" class="link" data-rider="decline" data-code="${o.code}">এই ডেলিভারি নিতে পারব না</button>` : ''}
    </div>`;
  }
  function donePage() {
    const list = mine().filter(Store.isFinal);
    const delivered = list.filter((o) => o.status === 'delivered');
    return `<div class="panel-page"><h1 class="page-h">শেষ হওয়া কাজ</h1>
      <div class="stats"><div><b>${U.bn(delivered.length)}</b><span>ডেলিভারি সম্পন্ন</span></div>
      <div><b>${U.tk(delivered.filter((o) => o.pay === 'cod').reduce((a, o) => a + o.total, 0))}</b><span>মোট সংগ্রহ</span></div>
      <div><b>${window.LHRate.badge('rider', me().contact, '-')}</b><span>রেটিং</span></div></div>
      <div class="stack">${list.length ? list.map((o) => `<article class="panel order"><span><b>${U.ud(o.shopName)}</b><small><span translate="no">#${U.bn(o.code)}</span> · ${U.fmtTime(o.history[o.history.length - 1].at)}</small></span><span class="tag">${Store.label(o, o.status)}</span></article>`).join('') : '<div class="empty"><span aria-hidden="true">📋</span><h3>এখনো কিছু শেষ হয়নি</h3></div>'}</div>
    </div>`;
  }
  /* ---------- papers: NID, and a licence and number plate for a motorcycle or a pickup ---------- */
  let pics = {};
  function papersPage() {
    const m = me();
    const lic = Store.needsLicence(m);
    if (m.kyc && m.kyc.status === 'ok') return `<div class="panel-page"><a class="back" href="#/rider">‹ আজকের কাজ</a><div class="empty big"><span aria-hidden="true">✅</span><h1>আপনার কাগজ যাচাই হয়েছে</h1><a class="btn" href="#/rider">আজকের কাজ দেখুন</a></div></div>`;
    const pic = (key, label) => `<div class="field"><span class="flabel">${label}</span>
        <div class="it-upload"><div class="it-preview paper-pic" id="pp-${key}">${pics[key] ? `<img src="${pics[key]}" alt="">` : '<span aria-hidden="true">📷</span>'}</div>
        <div class="it-upload-acts"><label class="btn ghost sm upload"><input type="file" class="sr" accept="image/jpeg,image/png,image/webp" data-paper="${key}">ছবি বাছুন</label><small>পুরো কার্ড যেন পড়া যায়।</small></div></div></div>`;
    return `<div class="panel-page"><a class="back" href="#/rider">‹ আজকের কাজ</a>
      <h1 class="page-h">কাগজ জমা দিন</h1>
      <p class="meta gap">লোকালহাট টিম যাচাই করে অনুমোদন দিলে কাজ আসবে। গ্রাহক বা দোকান এসব দেখতে পায় না।</p>
      <p class="warn">প্রোটোটাইপ: ছবি শুধু এই ব্রাউজারে থাকে। আসল এনআইডি বা লাইসেন্সের ছবি দেবেন না, যেকোনো ছবি দিয়ে দেখুন।</p>
      <form id="r-papers" class="panel" novalidate>
        <label class="field"><span>এনআইডি নম্বর</span><input id="pp-nid" type="text" inputmode="numeric" maxlength="20" autocomplete="off"><small>১০, ১৩ বা ১৭ সংখ্যা</small></label>
        ${pic('front', 'এনআইডির সামনের ছবি')}${pic('back', 'এনআইডির পেছনের ছবি')}
        ${lic ? `<label class="field"><span>ড্রাইভিং লাইসেন্স নম্বর</span><input id="pp-licence" type="text" maxlength="30" autocomplete="off"></label>
          ${pic('licencePic', 'ড্রাইভিং লাইসেন্সের ছবি')}
          <label class="field"><span>গাড়ির নম্বর প্লেট</span><input id="pp-plate" type="text" maxlength="30" autocomplete="off" placeholder="যেমন: বাগেরহাট হ ১১-২২৩৩"></label>` : `<p class="meta"><span>${U.esc(m.vehicle || '')}</span> <span>চালাতে লাইসেন্স লাগে না, শুধু এনআইডি দিন।</span></p>`}
        <small class="err" id="pp-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">জমা দিন</button>
      </form></div>`;
  }
  // the picture at handing over, kept until the delivery is done
  let proofShot = { code: '', pic: '' };
  async function onProof(input) {
    const f = input.files[0];
    input.value = '';
    if (!f) return;
    const form = document.getElementById('r-deliver');
    try {
      proofShot = { code: form.dataset.code, pic: (await window.LHImage.readWhole(f)).image };
      document.getElementById('r-proof-prev').innerHTML = `<img src="${proofShot.pic}" alt="ডেলিভারির ছবি">`;
      document.getElementById('r-proof-label').textContent = '✓ ছবি তোলা হয়েছে, আবার তুলতে চাপুন';
      document.getElementById('r-pin-err').textContent = '';
    } catch (ex) { document.getElementById('r-pin-err').textContent = ex.message; }
  }
  async function onPaper(input) {
    const key = input.dataset.paper;
    try {
      pics[key] = (await window.LHImage.readWhole(input.files[0])).image;
      document.getElementById('pp-' + key).innerHTML = `<img src="${pics[key]}" alt="">`;
      document.getElementById('pp-err').textContent = '';
    } catch (ex) { document.getElementById('pp-err').textContent = ex.message; }
    input.value = '';
  }

  /* ---------- where he works: district, upazila, full address, his bazar, his point on the map and how far he goes ---------- */
  let area = null; // the form as typed so far
  let areaPick = null;
  const areaKey = () => window.LHI18n.areaKey(area.zila, area.area);
  function bazars() {
    return area.zila && area.area ? Store.bazarsOf(area.zila, areaKey()).map((b) => `<option value="${U.esc(b)}"></option>`).join('') : '';
  }
  // how many shops of his upazila are inside his circle now
  function reachText() {
    if (!area.lat) return '';
    const key = areaKey();
    const n = Store.data.shops.filter((s) => s.kind === 'shop' && Store.shopLive(s) && s.zila === area.zila && s.area === key && Store.inReach(area, s)).length;
    return `${U.bn(n)}টি দোকান আপনার দূরত্বের ভেতরে`;
  }
  function areaPage() {
    const m = me();
    if (!area || area.id !== m.id) area = { id: m.id, zila: m.zila || '', area: window.LHI18n.geoText(m.area || ''), addr: m.addr || '', market: m.market || '', lat: m.lat, lng: m.lng, km: m.km || 3 };
    return `<div class="panel-page"><a class="back" href="#/rider">‹ আজকের কাজ</a>
      <h1 class="page-h">কাজের এলাকা</h1>
      <p class="meta gap">ম্যাপের গোল দাগের ভেতরের দোকানের অর্ডার আপনার কাছে আসবে। আপনার বাজারের দোকানের অর্ডার আগে পাবেন।</p>
      <form id="r-area" class="panel" novalidate>
        <div class="row2">
          <label class="field"><span>জেলা</span><select id="ra-zila" data-ra="zila"><option value="">বেছে নিন</option>${U.zilaOptions(area.zila)}</select></label>
          <label class="field"><span>উপজেলা / থানা</span><input id="ra-area" data-ra="area" type="text" maxlength="60" list="ra-upa" autocomplete="off" value="${U.esc(area.area)}"></label>
        </div><datalist id="ra-upa">${U.upazilaOptions(area.zila)}</datalist>
        <label class="field"><span>পুরো ঠিকানা</span><input id="ra-addr" data-ra="addr" type="text" maxlength="150" autocomplete="street-address" placeholder="বাড়ি, রোড, গ্রাম বা মহল্লা" value="${U.esc(area.addr)}"><small>শুধু লোকালহাট টিম দেখবে। গ্রাহক বা দোকান দেখবে না।</small></label>
        <label class="field"><span>কোন বাজারের আন্ডারে কাজ করবেন</span><input id="ra-market" data-ra="market" type="text" maxlength="60" list="ra-bazar" autocomplete="off" placeholder="যেমন: পুরাতন বাজার" value="${U.esc(area.market)}"></label>
        <datalist id="ra-bazar">${bazars()}</datalist>
        <div class="field"><span class="flabel">ম্যাপে আপনার জায়গা</span>
          <button type="button" class="btn ghost block" data-rider="area-gps">📍 GPS দিয়ে নিন</button>
          <small>অথবা ম্যাপে চেপে বাজার বা বাসার জায়গায় পিন দিন।</small>
          <div id="ra-map" class="mini-map" aria-label="ডেলিভারি এলাকা বাছার ম্যাপ"></div>
          <p class="good" id="ra-loc" role="status">${area.lat ? '✓ লোকেশন নেওয়া হয়েছে' : ''}</p></div>
        <fieldset class="field fs"><legend>পিন থেকে কত দূর পর্যন্ত যাবেন</legend>
          <div class="vehicles">${Store.RIDER_KM.map((k) => `<label class="radio-pill"><input type="radio" name="ra-km" value="${k}" ${area.km === k ? 'checked' : ''}><span>${U.bn(k)} কিমি</span></label>`).join('')}</div></fieldset>
        <p class="meta" id="ra-count" role="status">${reachText()}</p>
        <small class="err" id="ra-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
      </form></div>`;
  }
  const areaSay = () => { const el = document.getElementById('ra-count'); if (el) el.textContent = reachText(); };
  function areaPin(lat, lng) {
    area.lat = lat; area.lng = lng;
    document.getElementById('ra-loc').textContent = '✓ লোকেশন নেওয়া হয়েছে';
    document.getElementById('ra-err').textContent = '';
    areaSay();
  }
  function onAreaInput(e) {
    const k = e.target.dataset && e.target.dataset.ra;
    if (k) {
      area[k] = e.target.value;
      if (k === 'zila') {
        document.getElementById('ra-upa').innerHTML = U.upazilaOptions(area.zila);
        const pos = window.LH_GEO_POS[area.zila];
        if (areaPick && pos && !area.lat) areaPick.map.setView(pos, 12, { animate: false });
      }
      if (k === 'zila' || k === 'area') { document.getElementById('ra-bazar').innerHTML = bazars(); areaSay(); }
      return;
    }
    if (e.target.name === 'ra-km') { area.km = Number(e.target.value); if (areaPick) areaPick.setKm(area.km); areaSay(); }
  }

  /* ---------- live location, while the goods are on the way ---------- */
  let watch = null;
  let lastSent = 0;
  function stopShare() {
    if (watch !== null && navigator.geolocation) navigator.geolocation.clearWatch(watch);
    watch = null;
  }
  const liveSay = (t) => { const el = document.getElementById('r-live-st'); if (el) el.textContent = t; };
  function share(code) {
    if (watch !== null) return;
    if (!navigator.geolocation) { liveSay('এই ফোনে লোকেশন নেই। গ্রাহক শুধু ধাপ দেখবেন।'); return; }
    lastSent = 0;
    watch = navigator.geolocation.watchPosition((p) => {
      // a new position at most every ten seconds is enough for the map and kind to the battery
      if (Date.now() - lastSent < 10000) return;
      lastSent = Date.now();
      if (!Store.riderLive(code, me() ? me().contact : '', p.coords.latitude, p.coords.longitude)) { stopShare(); return; }
      liveSay('✓ গ্রাহক ম্যাপে আপনার অবস্থান দেখছেন। ডেলিভারি শেষ হলে বন্ধ হবে।');
    }, () => liveSay('লোকেশন পাওয়া যায়নি। ফোনের লোকেশন চালু করে অনুমতি দিন।'), { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
  }
  function mount() {
    const live = document.getElementById('r-live');
    if (live) share(live.dataset.code); else stopShare();
    const box = document.getElementById('ra-map');
    areaPick = box ? window.LHMap.picker(box, area.lat ? { lat: area.lat, lng: area.lng } : null, areaPin, { icon: '🛵', km: area.km, around: window.LH_GEO_POS[area.zila] }) : null;
    const el = document.getElementById('rider-map');
    if (!el) return;
    const o = mine().find((x) => x.code === el.dataset.code);
    const s = Store.shopById(o.shopId);
    window.LHMap.mini(el, [{ lat: s.lat, lng: s.lng, icon: s.icon }, { lat: o.recipient.lat, lng: o.recipient.lng, icon: '🏠' }]);
  }
  function onClick(e) {
    const el = e.target.closest('[data-rider]');
    if (!el) return;
    const d = el.dataset;
    const m = me();
    try {
      if (d.rider === 'pickup') { Store.riderPickup(d.code, m.contact); U.toast('গ্রাহক জানতে পারবেন পণ্য রওনা হয়েছে'); U.route(); }
      if (d.rider === 'decline') {
        U.openSheet(`<h2 id="sheet-h">ডেলিভারি নিতে পারবেন না?</h2><p>এই ডেলিভারি এলাকার অন্য ডেলিভারি ম্যানের কাছে চলে যাবে।</p>
          <button type="button" class="btn block" data-rider="decline-yes" data-code="${d.code}">হ্যাঁ, ফেরত দিন</button>
          <button type="button" class="link" data-action="close-sheet">না, আমিই নেব</button>`);
      }
      if (d.rider === 'note-done') { Store.riderNoteDone(d.id); U.route(true); }
      if (d.rider === 'area-gps') {
        if (!navigator.geolocation) { document.getElementById('ra-err').textContent = 'এই ব্রাউজারে GPS নেই, ম্যাপে পিন দিন'; return; }
        navigator.geolocation.getCurrentPosition((p) => {
          if (!areaPick) return;
          areaPick.setPin(p.coords.latitude, p.coords.longitude);
          areaPin(p.coords.latitude, p.coords.longitude);
        }, () => { const err = document.getElementById('ra-err'); if (err) err.textContent = 'লোকেশন পাওয়া যায়নি। অনুমতি দিন, অথবা ম্যাপে পিন দিন।'; }, { timeout: 10000 });
      }
      if (d.rider === 'decline-yes') { Store.riderDecline(d.code, m.contact); U.closeSheet(); U.toast('অন্য ডেলিভারি ম্যানের কাছে পাঠানো হয়েছে'); location.hash = '#/rider'; }
    } catch (ex) { if (document.querySelector('.sheet')) U.closeSheet(); U.toast(ex.message); U.route(true); }
  }
  function onSubmit(e) {
    if (e.target.id === 'r-area') {
      e.preventDefault();
      try {
        Store.setRiderBase(me().id, { zila: area.zila, area: areaKey(), addr: area.addr, market: area.market, lat: area.lat, lng: area.lng, km: area.km });
        area = null;
        U.toast('কাজের এলাকা সংরক্ষিত');
        location.hash = '#/rider';
      } catch (ex) { document.getElementById('ra-err').textContent = ex.message; }
      return;
    }
    if (e.target.id === 'r-papers') {
      e.preventDefault();
      const val = (id) => { const el = document.getElementById(id); return el ? el.value.replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c)).trim() : ''; };
      try {
        Store.riderPapers(me().id, { nid: val('pp-nid'), front: pics.front, back: pics.back, licence: val('pp-licence'), licencePic: pics.licencePic, plate: val('pp-plate') });
        pics = {};
        U.toast('কাগজ জমা হয়েছে, লোকালহাট টিম দেখবে');
        location.hash = '#/rider';
      } catch (ex) { document.getElementById('pp-err').textContent = ex.message; }
      return;
    }
    if (e.target.id !== 'r-deliver') return;
    e.preventDefault();
    const pin = document.getElementById('r-pin').value.replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c));
    const code = e.target.dataset.code;
    const why = document.getElementById('r-nocam-why');
    const proof = proofShot.code === code ? { pic: proofShot.pic } : { reason: why ? why.value : '' };
    try {
      Store.riderDeliver(code, me().contact, pin, proof);
      proofShot = { code: '', pic: '' };
      U.toast('ডেলিভারি সম্পন্ন হয়েছে');
      location.hash = '#/rider/done';
    } catch (ex) {
      document.getElementById('r-pin-err').textContent = ex.message;
      document.getElementById('r-pin').focus();
    }
  }
  function init(ui) {
    U = ui;
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('change', (e) => { if (e.target.dataset && e.target.dataset.paper) onPaper(e.target); if (e.target.id === 'r-proof') onProof(e.target); });
    document.addEventListener('click', (e) => { const b = e.target.closest('[data-rider="no-cam"]'); if (!b) return; const box = document.getElementById('r-nocam'); box.hidden = !box.hidden; if (!box.hidden) document.getElementById('r-nocam-why').focus(); });
    document.addEventListener('input', (e) => { if (area && e.target.closest && e.target.closest('#r-area')) onAreaInput(e); });
  }
  return { init, page, tabs, mount, noteTitle: (kind) => (NOTE[kind] ? NOTE[kind][0] : '🔔') };
})();

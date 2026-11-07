// Bookings, customer-shop chat and weekly hours.
// Service booking: the provider sets a charge, the rest of the bill is agreed in chat as an offer the customer accepts.
// Fixed booking (bus seat, doctor's serial): the provider sets the price, the times and how many fit in each time.
window.LHBook = (function () {
  'use strict';
  const Store = window.LHStore;
  let U;
  const $ = (id) => document.getElementById(id);
  const DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  const WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];
  const DIGITS = '০১২৩৪৫৬৭৮৯';
  const ascii = (s) => String(s).replace(/[০-৯]/g, (c) => DIGITS.indexOf(c));
  let bd = {};
  let bdKey = '';
  let draft = '';
  let draftKey = '';
  // "/" words in the chat box that narrow the list to one kind
  const PRODUCT_WORDS = new Set(['পণ্য', 'product', 'products', 'ponno']);
  const SERVICE_WORDS = new Set(['সেবা', 'service', 'services', 'seba', 'sheba', 'বুকিং', 'booking']);
  let slash = null;
  let slashOff = -1;
  let keepTop = null;

  const customer = () => window.LHAuth.current('customer');
  const owner = () => window.LHAuth.current('owner');

  /* ---------- weekly hours ---------- */
  const clock = (t) => {
    const [h, m] = t.split(':').map(Number);
    return new Date(2000, 0, 1, h, m).toLocaleTimeString(window.LHI18n.lang === 'en' ? 'en-GB' : 'bn-BD', { hour: 'numeric', minute: '2-digit' });
  };
  const allDay = (w) => w.o === '00:00' && w.e === '23:59';
  // a doctor's days at the chamber, Saturday first
  function daysText(days) {
    if (!days || days.length === 7) return 'প্রতিদিন';
    if (days.length === 6) {
      const off = DAYS[[0, 1, 2, 3, 4, 5, 6].find((d) => !days.includes(d))];
      return window.LHI18n.lang === 'en' ? 'Every day except ' + window.LHI18n.en(off) : off + ' ছাড়া প্রতিদিন';
    }
    return WEEK_ORDER.filter((d) => days.includes(d)).map((d) => DAYS[d]).join(', ');
  }
  const slotsText = (it) => (it.slots || []).map(clock).join(', ');
  const dateText = (ymd) => window.LHTime.show(window.LHTime.at(ymd, '12:00'), { day: 'numeric', month: 'long' }, window.LHI18n.lang);
  // how long a test's offer runs, or that it has ended
  function offerText(it) {
    if (!it.offer) return '';
    if (!Store.offerOn(it)) return 'অফার শেষ হয়েছে';
    return it.offer.until ? `অফার শেষ: ${dateText(it.offer.until)}` : 'অফার চলছে';
  }
  function hoursStatus(s) {
    if (s.suspended) return { open: false, text: 'স্থগিত' };
    if (!s.open) return { open: false, text: 'সাময়িকভাবে বন্ধ' };
    if (!s.week) return { open: true, text: 'খোলা আছে' };
    const now = new Date();
    const p = window.LHTime.parts(now);
    const hhmm = window.LHTime.hhmm(now);
    if (Store.openNow(s, now)) {
      const today = s.week[p.wd];
      if (today && !today.off && today.o <= hhmm && allDay(today)) return { open: true, text: 'খোলা আছে · ২৪ ঘণ্টা' };
      const end = today && !today.off && today.o <= hhmm ? today.e : s.week[(p.wd + 6) % 7].e;
      return { open: true, text: `খোলা আছে · বন্ধ হবে ${clock(end)}` };
    }
    for (let i = 0; i < 8; i++) {
      const day = (p.wd + i) % 7;
      const w = s.week[day];
      if (w && !w.off && (i > 0 || w.o > hhmm)) return { open: false, text: `এখন বন্ধ · খুলবে ${i === 0 ? 'আজ' : DAYS[day]} ${clock(w.o)}` };
    }
    return { open: false, text: 'এখন বন্ধ' };
  }
  function hoursTable(s) {
    if (!s.week) return '<p class="meta">এই দোকান এখনো সাপ্তাহিক সময় জানায়নি।</p>';
    const today = window.LHTime.parts().wd;
    return `<ul class="hours">${WEEK_ORDER.map((d) => {
      const w = s.week[d];
      return `<li class="${d === today ? 'today' : ''}"><span>${DAYS[d]}</span><b class="${w.off ? 'off' : ''}">${w.off ? 'বন্ধ' : allDay(w) ? '২৪ ঘণ্টা' : `${clock(w.o)} - ${clock(w.e)}`}</b></li>`;
    }).join('')}</ul>`;
  }
  function weekEditor(s) {
    return `<fieldset class="field fs week-edit" id="hours"><legend>সাপ্তাহিক সময়</legend>
      <small>গ্রাহক প্রতিটি দিনের খোলা ও বন্ধের সময় দেখবেন। বন্ধের দিনের টিক তুলে দিন।</small>
      ${WEEK_ORDER.map((d) => {
        const w = (s.week && s.week[d]) || { o: '09:00', e: '21:00' };
        return `<div class="wk-row"><label class="wk-day"><input type="checkbox" id="wk-on-${d}" data-wk-on="${d}" ${w.off ? '' : 'checked'}><span>${DAYS[d]}</span></label>
          <input type="time" id="wk-o-${d}" value="${w.o || '09:00'}" aria-label="${DAYS[d]} খোলার সময়" ${w.off ? 'disabled' : ''}>
          <input type="time" id="wk-e-${d}" value="${w.e || '21:00'}" aria-label="${DAYS[d]} বন্ধের সময়" ${w.off ? 'disabled' : ''}></div>`;
      }).join('')}
      <button type="button" class="inline" data-book="week-copy">প্রথম দিনের সময় সব দিনে দিন</button>
      <small class="err" id="wk-err"></small></fieldset>`;
  }
  // null when a row is wrong; the message is already on screen
  function readWeek() {
    const week = [];
    for (let d = 0; d < 7; d++) {
      if (!$('wk-on-' + d).checked) { week[d] = { off: true }; continue; }
      const o = $('wk-o-' + d).value;
      const e = $('wk-e-' + d).value;
      if (!o || !e || o === e) { $('wk-err').textContent = `${DAYS[d]}: খোলা ও বন্ধের সময় ঠিক করে দিন`; $('wk-o-' + d).focus(); return null; }
      week[d] = { o, e };
    }
    $('wk-err').textContent = '';
    return week;
  }

  /* ---------- how an item is priced and bought ---------- */
  // the cheapest stretch of a route and the whole of it
  const busLow = (it) => Math.min(...it.stops.slice(1).map((_, i) => Store.busFare(it, i, i + 1)));
  function priceHtml(it) {
    if (it.book === 'bus') return `<span class="price"><span>দূরত্ব অনুযায়ী</span> ${U.tk(busLow(it))} – ${U.tk(it.price)}</span>`;
    if (it.role === 'doctor') return `<span class="price">নতুন রোগী ${U.tk(it.price)}${it.oldFee !== undefined ? ` · পুরাতন ${U.tk(it.oldFee)}` : ''}</span>`;
    if (it.book === 'test' && Store.offerOn(it)) return `<span class="price"><s>${U.tk(it.price)}</s> ${U.tk(it.offer.price)} <em class="off-pct">${U.bn(Math.round(100 - (it.offer.price * 100) / it.price))}% ছাড়</em></span>`;
    if (it.trip) return `<span class="price"><span>ভাড়া শুরু</span> ${U.tk(it.price)}</span>`;
    if (it.book === 'quote') return `<span class="price">চার্জ ${U.tk(it.price)}</span>`;
    if (it.book === 'fixed') return `<span class="price">${it.price ? U.tk(it.price) : 'ফ্রি'}</span>`;
    return `<span class="price">${it.price ? U.tk(it.price) : 'দাম জেনে নিন'}</span>`;
  }
  const bookNote = (it) => (it.book === 'bus' ? '<small class="bk-note">অ্যাপে টিকেট কাটলে পথের যেকোনো স্টপ থেকে উঠতে পারবেন</small>' : it.trip ? '<small class="bk-note">দূরত্ব, মাল ও সময় দেখে ভাড়া আলোচনায় ঠিক হবে</small>' : it.book === 'quote' ? '<small class="bk-note">বাকি বিল সমস্যা দেখে, আলোচনায় ঠিক হবে</small>' : it.book === 'test' && it.note ? `<small class="bk-note">${U.ud(it.note)}</small>` : '');
  const bookBtn = (s, it, cls) => `<a class="btn sm book-btn ${cls || ''}" href="#/book/${s.id}/${it.id}">${it.role === 'doctor' ? '🎫 সিরিয়াল নিন' : it.book === 'bus' ? '🎫 টিকেট কাটুন' : it.trip ? '🚚 বুক করুন' : it.book === 'test' ? '🧪 বুক করুন' : it.book === 'fixed' ? '🎫 বুক করুন' : '🗓️ বুক করুন'}</a>`;

  /* ---------- a trip, and a vehicle at a garage or a car wash ---------- */
  const LOAD_ASK = {
    goods: ['কী মাল, কতটা?', 'যেমন: ২ রুমের ফার্নিচার, ফ্রিজ ও খাট'],
    people: ['কতজন যাবেন, কী কাজে?', 'যেমন: ৬ জন, ঢাকার বাইরে বিয়েতে, ৩টা ব্যাগ'],
    patient: ['রোগীর অবস্থা', 'যেমন: বয়স্ক রোগী, অক্সিজেন লাগবে, সাথে ২ জন']
  };
  const WHERE_WORD = { shop: 'গ্যারেজে নিয়ে আসব', home: 'বাসায় বা রাস্তায় এসে দেখবেন', tow: 'গাড়ি চলছে না, টো করে নিতে হবে' };
  // the trip's end: the pin, or the middle of the district when there is no pin
  function tripEnd() {
    if (bd.toLat) return { lat: bd.toLat, lng: bd.toLng, rough: false };
    const pos = window.LH_GEO_POS[bd.toZila || ''];
    return pos ? { lat: pos[0], lng: pos[1], rough: true } : null;
  }
  function kmLine() {
    const end = tripEnd();
    const p = U.place();
    if (!end) return '';
    const km = window.LHMap.km(p, end);
    return `📏 <span>দূরত্ব</span>: ${end.rough ? '<span>প্রায়</span> ' : ''}${U.kmText(km)}${end.rough ? ' <span>(জেলার মাঝখান পর্যন্ত, পিন দিলে ঠিক হবে)</span>' : ''}`;
  }
  // what the customer told about the trip or the vehicle, for the customer, the agent and the chat
  function jobHtml(o) {
    const rows = [];
    const b = o.bus;
    if (b) {
      rows.push(`<li><span>🟢 <span>উঠবেন</span></span><b>${U.ud(b.fromName)} · ${boardText(b)}</b></li>`);
      rows.push(`<li><span>🏁 <span>নামবেন</span></span><b>${U.ud(b.toName)}</b></li>`);
      rows.push(`<li><span>📏 <span>দূরত্ব</span></span><b>${U.bn(b.km)} কিমি</b></li>`);
      rows.push(`<li><span>🚌 <span>বাস</span></span><b><span>${U.esc(b.coach)}</span> · <span>ছাড়ার সময়</span> ${clock(b.time)}</b></li>`);
    }
    const t = o.trip;
    if (t) {
      rows.push(`<li><span>🟢 <span>কোথা থেকে</span></span><b>${U.ud(o.recipient.line)}</b></li>`);
      rows.push(`<li><span>🏁 <span>কোথায়</span></span><b>${U.ud(t.to)}, ${U.geo(t.toZila)}</b></li>`);
      if (t.km) rows.push(`<li><span>📏 <span>দূরত্ব</span></span><b>${t.rough ? '<span>প্রায়</span> ' : ''}${U.kmText(t.km)}</b></li>`);
      rows.push(`<li><span>${t.kind === 'goods' ? '📦 <span>মাল</span>' : t.kind === 'patient' ? '🩺 <span>রোগী</span>' : '👥 <span>যাত্রী</span>'}</span><b>${U.ud(t.load)}</b></li>`);
      if (t.back) rows.push('<li><span>↩️</span><b>ফেরত আসতে হবে (আপ-ডাউন)</b></li>');
      if (t.help) rows.push('<li><span>🙋</span><b>মাল ওঠানো-নামানোর লোক লাগবে</b></li>');
    }
    const v = o.vehicle;
    if (v) {
      rows.push(`<li><span>🚗 <span>গাড়ি</span></span><b><span>${U.esc(v.type)}</span>${v.model ? ' · ' + U.ud(v.model) : ''}${v.plate ? ' · ' + U.ud(v.plate) : ''}</b></li>`);
      if (v.where) rows.push(`<li><span>📍 <span>কোথায় কাজ</span></span><b>${WHERE_WORD[v.where]}</b></li>`);
    }
    return rows.length ? `<ul class="mini job">${rows.join('')}</ul>` : '';
  }
  function tripFields(it, p) {
    const ask = LOAD_ASK[it.trip] || LOAD_ASK.people;
    return `<h2 class="tight">কোথা থেকে, কোথায়?</h2>
      <span class="flabel">🟢 কোথা থেকে</span>
      <button type="button" class="addr" data-action="open-places"><span aria-hidden="true">${p.icon}</span><span><b>${U.placeName(p)}</b><small>${U.placeLine(p)}</small></span><em>বদলান</em></button>
      ${p.custom ? `<label class="field"><span>পুরো ঠিকানা</span><input id="b-line" data-bk="line" type="text" maxlength="150" autocomplete="street-address" placeholder="বাড়ি, রোড, গ্রাম বা মহল্লা" value="${U.esc(bd.line || '')}"><small class="err" id="b-line-err"></small></label>` : ''}
      <span class="flabel gap-t">🏁 কোথায় যাবেন</span>
      <div class="row2">
        <label class="field"><span>জেলা</span><select id="b-tozila" data-bk="toZila"><option value="">বেছে নিন</option>${U.zilaOptions(bd.toZila)}</select><small class="err" id="b-tozila-err"></small></label>
        <label class="field"><span>ঠিকানা</span><input id="b-to" data-bk="to" type="text" maxlength="150" placeholder="এলাকা, রোড বা বাজারের নাম" value="${U.esc(bd.to || '')}"><small class="err" id="b-to-err"></small></label>
      </div>
      <div class="field"><span class="flabel">ম্যাপে নামানোর জায়গা <i>(ঐচ্ছিক)</i></span>
        <div id="b-tomap" class="mini-map" aria-label="নামানোর জায়গা বাছার ম্যাপ"></div>
        <small>ম্যাপে চেপে পিন দিলে দূরত্ব ঠিক দেখাবে।</small></div>
      <p class="meta" id="b-km" role="status">${kmLine()}</p>
      <label class="field"><span>${ask[0]}</span><textarea id="b-load" data-bk="load" rows="2" maxlength="300" placeholder="${ask[1]}">${U.esc(bd.load || '')}</textarea><small class="err" id="b-load-err"></small></label>
      <label class="chk"><input type="checkbox" data-bk="back" ${bd.back ? 'checked' : ''}><span>ফেরত আসতে হবে (আপ-ডাউন)</span></label>
      ${it.trip === 'goods' ? `<label class="chk"><input type="checkbox" data-bk="help" ${bd.help ? 'checked' : ''}><span>মাল ওঠানো-নামানোর লোক লাগবে</span></label>` : ''}`;
  }
  function vehicleFields(it) {
    const set = Store.vehicleSet(it);
    const where = Store.whereOf(it);
    return `<div class="row2">
        <label class="field"><span>কোন গাড়ি</span><select id="b-vtype" data-bk="vtype">${set.length > 1 ? '<option value="">বেছে নিন</option>' : ''}${set.map((v) => `<option value="${U.esc(v)}" ${bd.vtype === v ? 'selected' : ''}>${U.esc(v)}</option>`).join('')}</select><small class="err" id="b-vtype-err"></small></label>
        <label class="field"><span>নম্বর প্লেট <i>(ঐচ্ছিক)</i></span><input id="b-plate" data-bk="plate" type="text" maxlength="30" autocomplete="off" placeholder="যেমন: ঢাকা মেট্রো গ ১২-৩৪৫৬" value="${U.esc(bd.plate || '')}"></label>
      </div>
      <label class="field"><span>কোম্পানি ও মডেল <i>(ঐচ্ছিক)</i></span><input id="b-model" data-bk="model" type="text" maxlength="60" autocomplete="off" placeholder="যেমন: টয়োটা এক্সিও ২০১৪" value="${U.esc(bd.model || '')}"></label>
      ${where.length ? `<fieldset class="fs"><legend>কাজটি কোথায় হবে</legend>
        ${where.map((w) => `<label class="pay"><input type="radio" name="b-where" value="${w}" data-bk="where" ${bd.where === w || where.length === 1 ? 'checked' : ''}><span><b>${WHERE_WORD[w]}</b></span></label>`).join('')}
        <small class="err" id="b-where-err"></small></fieldset>` : ''}`;
  }
  // a picture of the problem goes into the chat with the booking
  const photoField = () => `<div class="field"><span class="flabel">সমস্যার ছবি <i>(ঐচ্ছিক)</i></span>
      <div class="it-upload"><div class="it-preview" id="b-photo-prev">${bd.photo ? `<img src="${bd.photo.image}" alt="">` : '<span aria-hidden="true">📷</span>'}</div>
      <div class="it-upload-acts"><label class="btn ghost sm upload"><input type="file" class="sr" id="b-photo" accept="image/jpeg,image/png,image/webp">ছবি বাছুন</label><small>এজেন্ট চ্যাটে ছবিটি দেখবেন।</small></div></div>
      <small class="err" id="b-photo-err"></small></div>`;

  /* ---------- bus tickets: by route, from any stop, the fare by distance ---------- */
  const hhmm = (d) => window.LHTime.hhmm(d);
  // the time at the passenger's stop; a night coach reaches it the next day
  function boardText(b) {
    const at = new Date(b.board);
    return `${clock(hhmm(at))}${window.LHTime.ymd(at) !== b.date ? ' <span>(পরদিন)</span>' : ''}, ${dateText(b.date)}`;
  }
  // the stops in order: the counters marked, with their phone, and the passenger's two stops when there are any
  function stopsHtml(it, mark) {
    return `<ol class="stops">${it.stops.map((st, i) => {
      const on = mark && (i === mark.from || i === mark.to);
      return `<li class="${st.counter ? 'counter' : ''} ${on ? 'on' : ''}"><span class="st-n" aria-hidden="true">${st.counter ? '🏪' : U.bn(i + 1)}</span>
        <span class="st-txt"><b>${U.ud(st.name)}</b><small>${i ? `${U.bn(st.km)} কিমি · +${U.bn(Math.floor(st.min / 60))}:${U.bn(String(st.min % 60).padStart(2, '0'))} <span>ঘণ্টা</span>` : '<span>শুরু</span>'}${st.counter ? ` · <span>কাউন্টার</span> <a href="tel:${U.esc(st.phone)}">${U.bn(U.esc(st.phone))}</a>` : ''}</small></span></li>`;
    }).join('')}</ol>`;
  }
  const busTimes = (it) => it.times.map(clock).join(', ');
  // A bus counter's page lists its routes, each with its map of stops and counters.
  function busShop(s) {
    const routes = s.items.filter((it) => it.book === 'bus');
    const others = s.items.filter((it) => it.book !== 'bus');
    return `<h2>রুট ও কাউন্টার</h2>
      <p class="meta gap">অ্যাপে টিকেট কাটলে পথের যেকোনো স্টপ থেকে উঠতে পারবেন। ভাড়া হবে যতটুকু যাবেন ততটুকুর।</p>
      ${routes.length ? `<div class="stack">${routes.map((it) => `<article class="panel route ${it.available ? '' : 'off'}" id="rt-${it.id}">
        <div class="route-head"><span class="thumb" aria-hidden="true">${it.icon}</span><div class="item-txt"><b>${U.ud(it.name)}</b>
          <small><span>${U.esc(it.coach)}</span> · <span>${U.bn(it.seats)}টি সিট</span> · <span>${U.bn(it.stops.length)}টি স্টপ</span> · <span>${U.bn(it.stops.filter((x) => x.counter).length)}টি কাউন্টার</span></small>${priceHtml(it)}</div></div>
        <p class="meta">🕒 <span>ছাড়ার সময়</span>: ${busTimes(it)}</p>
        <div class="mini-map route-map" data-route="${s.id}/${it.id}" aria-label="রুটের ম্যাপ: স্টপ ও কাউন্টার"></div>
        <details class="stops-box"><summary>স্টপ ও কাউন্টার দেখুন</summary>${stopsHtml(it)}</details>
        ${it.available ? bookBtn(s, it) : '<small class="closed-txt">এখন টিকেট দেওয়া হচ্ছে না</small>'}
      </article>`).join('')}</div>` : '<p class="meta">এই কাউন্টার এখনো কোনো রুট দেয়নি।</p>'}
      ${others.length ? `<h2 class="gap-t">অন্যান্য</h2><ul class="pgrid">${others.map((it) => `<li class="pcard"><div class="pcard-body"><b>${U.ud(it.name)}</b><small>${U.ud(it.unit)}</small><div class="pcard-row">${priceHtml(it)}${it.available && it.book ? bookBtn(s, it) : ''}</div></div></li>`).join('')}</ul>` : ''}
      <a class="promise gap-t" href="#/bus"><span class="promise-ico" aria-hidden="true">🔎</span><span><b>অন্য রুট খুঁজুন</b> যেকোনো স্টপ থেকে কোথায় যাবেন লিখুন</span><span class="promise-go" aria-hidden="true">›</span></a>`;
  }
  // Search by stop over every counter's routes, wherever the customer's address is.
  let busQ = { from: '', to: '' };
  function busResult(r) {
    const { shop, it, from, to } = r;
    const fare = Store.busFare(it, from, to);
    return `<article class="panel route">
      <div class="route-head"><span class="thumb" aria-hidden="true">${it.icon}</span><div class="item-txt"><b>${U.ud(it.name)}</b><small><a class="inline-link" href="#/shop/${shop.id}">${U.ud(shop.name)}</a> · <span>${U.esc(it.coach)}</span></small></div></div>
      <p class="bus-leg">🟢 ${U.ud(it.stops[from].name)} <span aria-hidden="true">→</span> 🏁 ${U.ud(it.stops[to].name)}</p>
      <p class="meta"><span>${U.bn(Store.busKm(it, from, to))} কিমি</span> · <span>সিটপ্রতি</span> ${U.tk(fare)} · <span>এই স্টপে বাস আসে</span>: ${it.times.map((t) => clock(hhmm(new Date(new Date('2000-01-01T' + t).getTime() + it.stops[from].min * 6e4)))).join(', ')}</p>
      <a class="btn sm book-btn" href="#/book/${shop.id}/${it.id}/${from}/${to}">🎫 টিকেট কাটুন</a>
    </article>`;
  }
  function busPage() {
    const q = busQ.from.trim() || busQ.to.trim();
    const list = Store.busFind(busQ.from, busQ.to);
    return `<a class="back" href="#/">‹ হোম</a>
      <h1 class="page-h">বাসের টিকেট</h1>
      <p class="meta gap">যেকোনো স্টপ থেকে উঠুন, যতটুকু যাবেন ততটুকুর ভাড়া দিন। কাউন্টারে যেতে হবে না।</p>
      <form id="bus-find" class="panel" role="search" novalidate>
        <div class="row2">
          <label class="field"><span>কোথা থেকে উঠবেন</span><input id="bf-from" type="text" list="bf-stops" maxlength="60" autocomplete="off" placeholder="যেমন: টঙ্গী" value="${U.esc(busQ.from)}"></label>
          <label class="field"><span>কোথায় নামবেন</span><input id="bf-to" type="text" list="bf-stops" maxlength="60" autocomplete="off" placeholder="যেমন: কাপাসিয়া" value="${U.esc(busQ.to)}"></label>
        </div>
        <datalist id="bf-stops">${Store.busStops().map((x) => `<option value="${U.esc(x)}"></option>`).join('')}</datalist>
        <button type="submit" class="btn block">বাস খুঁজুন</button>
      </form>
      <h2 class="gap-t">${q ? `<span>${U.bn(list.length)}</span><span>টি রুট পাওয়া গেছে</span>` : 'সব রুট'}</h2>
      ${list.length ? `<div class="stack">${list.map(busResult).join('')}</div>` : '<div class="empty"><span aria-hidden="true">🚌</span><h3>এই দুই স্টপের মধ্যে কোনো বাস পাওয়া যায়নি</h3><p>স্টপের নাম তালিকা থেকে বেছে নিন, অথবা একটি ঘর খালি রাখুন।</p></div>'}`;
  }
  // Seats are counted for the passenger's own stretch; a time that has passed the passenger's stop cannot be picked.
  function busTimeOptions(it) {
    return it.times.map((t) => {
      const at = Store.busAt(it, bd.date || Store.today(), t, bd.from);
      const left = bd.date ? Store.busSeatsLeft(it, bd.date, t, bd.from, bd.to) : it.seats;
      const past = !!bd.date && at < new Date();
      const no = past || left <= 0;
      return `<option value="${t}" ${bd.time === t && !no ? 'selected' : ''} ${no ? 'disabled' : ''}>${clock(t)} ছাড়ে · আপনার স্টপে ${clock(hhmm(at))} (${past ? 'চলে গেছে' : left > 0 ? `${U.bn(left)}টি খালি` : 'ভর্তি'})</option>`;
    }).join('');
  }
  const BUS_PAY = [['cash', '💵', 'বাসে নগদ', 'উঠে সুপারভাইজারকে ভাড়া দিন'], ['bkash', '📱', 'বিকাশ', 'এখনই বিকাশে টাকা দিন'], ['nagad', '📱', 'নগদ', 'এখনই নগদে টাকা দিন'], ['card', '💳', 'ডেবিট বা ক্রেডিট কার্ড', 'ভিসা, মাস্টারকার্ড বা অ্যামেক্স']];
  function busBookPage(s, it, fromArg, toArg) {
    const back = `<a class="back" href="#/shop/${s.id}">‹ ${U.ud(s.name)}</a>`;
    const blocked = gate(`#/book/${s.id}/${it.id}`, 'টিকেট কাটতে লগইন করুন');
    if (blocked) return back + blocked;
    const me = U.viewing() ? null : customer();
    const key = s.id + '/' + it.id;
    const last = it.stops.length - 1;
    if (bdKey !== key) {
      const f = Number.isInteger(+fromArg) && +fromArg >= 0 && +fromArg < last ? +fromArg : 0;
      const t = Number.isInteger(+toArg) && +toArg > f && +toArg <= last ? +toArg : last;
      bd = { name: me ? me.name : '', phone: me && /^01[3-9]\d{8}$/.test(me.contact || '') ? me.contact : '', qty: 1, from: f, to: t, date: Store.today(), pay: 'cash' };
      bdKey = key;
    }
    const fare = Store.busFare(it, bd.from, bd.to);
    const qty = Math.max(1, Math.min(10, Number(ascii(bd.qty)) || 1));
    return `${back}
      <h1 class="page-h">বাসের টিকেট</h1>
      <form id="bus-form" class="two" data-shop="${s.id}" data-item="${it.id}" novalidate>
        <div class="stack">
          <section class="panel">
            <div class="bk-item">${U.thumbHtml(it)}<div class="item-txt"><b>${U.ud(it.name)}</b><small>${U.ud(s.name)} · <span>${U.esc(it.coach)}</span></small></div></div>
            <p class="note gap-t">অ্যাপে কাটা টিকেটে পথের যেকোনো স্টপ থেকে উঠতে পারবেন। ভাড়া হবে যতটুকু যাবেন ততটুকুর।</p>
          </section>
          <section class="panel">
            <h2 class="tight">কোথা থেকে, কোথায়?</h2>
            <div class="row2">
              <label class="field"><span>🟢 কোথা থেকে উঠবেন</span><select id="bus-from" data-bus="from">${it.stops.slice(0, last).map((st, i) => `<option value="${i}" ${bd.from === i ? 'selected' : ''}>${U.ud(st.name)}${st.counter ? ' (কাউন্টার)' : ''}</option>`).join('')}</select></label>
              <label class="field"><span>🏁 কোথায় নামবেন</span><select id="bus-to" data-bus="to">${it.stops.map((st, i) => (i > bd.from ? `<option value="${i}" ${bd.to === i ? 'selected' : ''}>${U.ud(st.name)}</option>` : '')).join('')}</select></label>
            </div>
            <p class="meta" id="bus-km">📏 <span>দূরত্ব</span>: <span>${U.bn(Store.busKm(it, bd.from, bd.to))} কিমি</span> · <span>সিটপ্রতি ভাড়া</span> ${U.tk(fare)}</p>
            <div class="mini-map route-map" data-route="${s.id}/${it.id}" data-from="${bd.from}" data-to="${bd.to}" aria-label="রুটের ম্যাপ: স্টপ ও কাউন্টার"></div>
            <details class="stops-box"><summary>স্টপ ও কাউন্টার দেখুন</summary>${stopsHtml(it, { from: bd.from, to: bd.to })}</details>
          </section>
          <section class="panel">
            <h2 class="tight">কবে, কোন বাসে?</h2>
            <div class="row2">
              <label class="field"><span>তারিখ</span><input id="bus-date" data-bus="date" type="date" min="${Store.today()}" value="${U.esc(bd.date || '')}"></label>
              <label class="field"><span>বাস</span><select id="bus-time" data-bus="time"><option value="">বেছে নিন</option>${busTimeOptions(it)}</select></label>
            </div>
            <label class="field"><span>কয়টি সিট</span><input id="bus-qty" data-bk="qty" type="number" min="1" max="10" value="${U.esc(bd.qty)}"></label>
            <small class="err" id="bus-when-err" role="alert"></small>
          </section>
          <section class="panel">
            <h2 class="tight">যাত্রীর তথ্য</h2>
            <label class="field"><span>নাম</span><input id="bus-name" data-bk="name" type="text" maxlength="60" autocomplete="name" value="${U.esc(bd.name || '')}"><small class="err" id="bus-name-err"></small></label>
            <label class="field"><span>মোবাইল নম্বর</span><input id="bus-phone" data-bk="phone" type="tel" inputmode="numeric" placeholder="01XXXXXXXXX" autocomplete="tel" value="${U.esc(bd.phone || '')}"><small class="err" id="bus-phone-err"></small></label>
          </section>
          <section class="panel pay-pick">
            <h2 class="tight" id="bus-pay-h">কিভাবে টাকা দেবেন?</h2>
            <div role="radiogroup" aria-labelledby="bus-pay-h">${BUS_PAY.map(([v, icon, word, sub]) => `<label class="pay"><input type="radio" name="bus-pay" data-bk="pay" value="${v}" ${bd.pay === v ? 'checked' : ''}><span><b>${icon} ${word}</b><small>${sub}</small></span></label>`).join('')}</div>
          </section>
        </div>
        <aside class="panel bill">
          <h2 class="tight">হিসাব</h2>
          <div class="sum"><span>${U.ud(it.stops[bd.from].name)} → ${U.ud(it.stops[bd.to].name)}</span><b>${U.tk(fare)}</b></div>
          <div class="sum"><span>সিট</span><b>× ${U.bn(qty)}</b></div>
          <div class="sum total"><span>মোট</span><b id="bus-total">${U.tk(fare * qty)}</b></div>
          ${U.viewing() ? '<p class="note">👁 দেখার মোড: এখান থেকে টিকেট কাটা যাবে না।</p>' : ''}
          <button type="submit" class="btn block">টিকেট কাটুন</button>
        </aside>
      </form>`;
  }
  function submitBus(form) {
    const show = (id, msg, focus) => { $(id).textContent = msg; if (focus && $(focus)) $(focus).focus(); };
    ['bus-when-err', 'bus-name-err', 'bus-phone-err'].forEach((id) => { $(id).textContent = ''; });
    if (U.viewing()) { U.toast('দেখার মোডে টিকেট কাটা যায় না'); return; }
    if (!bd.date || !bd.time) return show('bus-when-err', 'তারিখ ও বাস বেছে নিন।', 'bus-time');
    const qty = Number(ascii(bd.qty));
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) return show('bus-when-err', '১ থেকে ১০টি সিট নিতে পারবেন', 'bus-qty');
    if (!(bd.name || '').trim()) return show('bus-name-err', 'নাম লিখুন', 'bus-name');
    const phone = ascii(bd.phone || '').trim().replace(/[\s-]/g, '');
    if (!/^01[3-9]\d{8}$/.test(phone)) return show('bus-phone-err', '১১ সংখ্যার মোবাইল নম্বর লিখুন, যেমন 017XXXXXXXX।', 'bus-phone');
    const s = Store.shopById(form.dataset.shop);
    const it = s.items.find((x) => x.id === form.dataset.item);
    const stop = it.stops[bd.from];
    const p = { shopId: s.id, itemId: it.id, customerId: customer().id, from: bd.from, to: bd.to, date: bd.date, time: bd.time, qty, placeLabel: stop.name, recipient: { name: bd.name.trim(), phone, line: stop.name, lat: stop.lat, lng: stop.lng } };
    const finish = (payment) => {
      try {
        const o = Store.busBook(p, payment);
        bd = {}; bdKey = '';
        location.hash = '#/track/' + o.code;
      } catch (ex) {
        if ($('bus-when-err')) show('bus-when-err', ex.message, 'bus-time'); else U.toast(ex.message);
      }
    };
    // the same checks first, so the payment page opens only for a ticket that will go through
    try { Store.busBook(Object.assign({}, p, { dry: true }), null, true); } catch (ex) { return show('bus-when-err', ex.message, 'bus-time'); }
    if (bd.pay === 'cash' || !bd.pay) finish(null);
    else U.payOnline(bd.pay, Store.busFare(it, bd.from, bd.to) * qty, finish);
  }

  /* ---------- booking page ---------- */
  function gate(after, title) {
    // "view as customer" shows the page itself; sending is blocked there
    if (U.viewing()) return '';
    const me = customer();
    if (me && me.verified) return '';
    U.setAfter(after);
    return `<div class="empty big"><span aria-hidden="true">🔐</span><h1>${me ? 'আগে একাউন্ট ভেরিফাই করুন' : title}</h1>
      <a class="btn" href="${me ? '#/auth/verify/customer' : '#/auth/customer/login'}">${me ? 'ভেরিফাই করুন' : 'লগইন করুন'}</a></div>`;
  }
  // a time that has passed, a day the shop is closed and a day the doctor does not sit cannot be picked
  function slotOptions(s, it) {
    const day = bd.date ? window.LHTime.weekday(bd.date) : -1;
    const shut = day >= 0 && s.week && s.week[day] && s.week[day].off;
    const away = day >= 0 && it.days && !it.days.includes(day);
    return it.slots.map((t) => {
      const left = bd.date ? Store.seatsLeft(it, bd.date, t) : it.cap;
      const past = !!bd.date && window.LHTime.at(bd.date, t) < new Date();
      const why = shut ? 'বন্ধের দিন' : away ? 'ডাক্তার বসেন না' : past ? 'সময় পার হয়েছে' : left > 0 ? `${U.bn(left)}টি খালি` : 'ভর্তি';
      const no = shut || away || past || left <= 0;
      return `<option value="${t}" ${bd.slot === t && !no ? 'selected' : ''} ${no ? 'disabled' : ''}>${clock(t)} (${why})</option>`;
    }).join('');
  }
  const PATIENT_WORD = Store.PATIENT;
  // a doctor's serial: a new patient and an old one pay the fee the clinic set for each
  function patientPick(it) {
    const kinds = it.oldFee === undefined ? ['new'] : ['new', 'old'];
    return `<fieldset class="fs"><legend>রোগী</legend>
      ${kinds.map((k) => `<label class="pay"><input type="radio" name="b-patient" value="${k}" data-bk="patient" ${bd.patient === k ? 'checked' : ''}><span><b>${PATIENT_WORD[k]}</b><small>ফি ${U.tk(k === 'old' ? it.oldFee : it.price)}${k === 'old' && it.oldRule ? ' · ' + U.ud(it.oldRule) : ''}</small></span></label>`).join('')}
    </fieldset>`;
  }
  function bookPage(shopId, itemId, from, to) {
    const s = Store.shopById(shopId);
    const it = s && s.items.find((x) => x.id === itemId);
    if (!s || !Store.shopLive(s) || !it || !it.book || !it.available) return null;
    if (it.book === 'bus') return busBookPage(s, it, from, to);
    const blocked = gate(`#/book/${shopId}/${itemId}`, 'বুকিং করতে লগইন করুন');
    const back = `<a class="back" href="#/shop/${s.id}">‹ ${U.ud(s.name)}</a>`;
    if (blocked) return back + blocked;
    const me = U.viewing() ? null : customer();
    const p = U.place();
    const key = shopId + '/' + itemId;
    // the customer's own name and mobile number are filled in; an account made with an email has no number to fill
    if (bdKey !== key) {
      const set = it.vehicle ? Store.vehicleSet(it) : [];
      bd = { name: me ? me.name : '', phone: me && /^01[3-9]\d{8}$/.test(me.contact || '') ? me.contact : '', qty: 1, patient: 'new', more: [], toZila: p.zila || '', vtype: set.length === 1 ? set[0] : '' };
      bdKey = key;
    }
    const quote = it.book === 'quote';
    const fixed = it.book === 'fixed';
    const doctor = it.role === 'doctor';
    const test = it.book === 'test';
    const trip = !!it.trip;
    const sos = Store.isEmergency(s);
    const wrongArea = quote && !U.sameArea(s, p);
    const lines = Store.bookLines(s, it, { patient: bd.patient, more: bd.more, qty: 1 });
    const total = lines.reduce((a, l) => a + l.price * l.qty, 0);
    const full = (l) => s.items.find((x) => x.id === l.itemId).price;
    const saved = test ? lines.reduce((a, l) => a + full(l) - l.price, 0) : 0;
    const others = test ? s.items.filter((x) => x.id !== it.id && x.book === 'test' && x.available) : [];
    let bill;
    if (trip) bill = `<div class="sum"><span>ভাড়া শুরু</span><b>${U.tk(it.price)}</b></div><div class="sum"><span>মোট ভাড়া</span><b>আলোচনায় ঠিক হবে</b></div>`;
    else if (quote) bill = `<div class="sum"><span>সার্ভিস চার্জ</span><b>${it.price ? U.tk(it.price) : 'ফ্রি'}</b></div><div class="sum"><span>বাকি বিল</span><b>আলোচনায় ঠিক হবে</b></div>`;
    else if (doctor) bill = `<div class="sum"><span>ফি (${lines[0].unit})</span><b>${total ? U.tk(total) : 'ফ্রি'}</b></div>`;
    else if (test) {
      bill = `${lines.map((l) => `<div class="sum"><span>${U.ud(l.name)}</span><b>${l.price < full(l) ? `<s>${U.tk(full(l))}</s> ` : ''}${l.price ? U.tk(l.price) : 'ফ্রি'}</b></div>`).join('')}
        <div class="sum total"><span>মোট</span><b>${total ? U.tk(total) : 'ফ্রি'}</b></div>
        ${saved ? `<div class="sum good"><span>অফারে বাঁচলেন</span><b>${U.tk(saved)}</b></div>` : ''}`;
    } else bill = `<div class="sum"><span>দাম</span><b>${it.price ? U.tk(it.price) : 'ফ্রি'}</b></div>`;
    return `${back}
      <h1 class="page-h">${doctor ? 'সিরিয়াল নিন' : test ? 'টেস্ট বুক করুন' : trip ? 'গাড়ি বুক করুন' : fixed ? 'বুকিং করুন' : 'সেবা বুক করুন'}</h1>
      <form id="book-form" class="two" data-shop="${s.id}" data-item="${it.id}" novalidate>
        <div class="stack">
          <section class="panel">
            <div class="bk-item">${U.thumbHtml(it)}<div class="item-txt"><b>${U.ud(it.name)}</b>${doctor ? `<small>${U.ud(it.degree || '')}${it.speciality ? ' · ' + U.ud(it.speciality) : ''}</small><small>🗓️ ${daysText(it.days)} · ${slotsText(it)}</small>` : `<small>${U.ud(s.name)} · ${U.ud(it.unit)}</small>`}</div></div>
            ${sos ? `<p class="sos-note gap-t">জরুরি হলে বুকিং না করে এখনই কল করুন: <a href="tel:${U.esc(s.phone)}">📞 ${U.bn(U.esc(s.phone))}</a></p>` : ''}
            ${trip ? `<p class="note gap-t"><span>ভাড়া শুরু</span> ${U.tk(it.price)}। <span>দূরত্ব, মাল ও সময় দেখে এজেন্ট চ্যাটে ভাড়া পাঠাবেন, আপনি রাজি হলে তবেই চুক্তি হবে।</span></p>`
    : quote ? `<p class="note gap-t">এই সেবার চার্জ ${U.tk(it.price)}। বাকি বিল সমস্যার উপর নির্ভর করে। বুকিংয়ের পর চ্যাটে কথা বলে দাম ঠিক করুন, আপনি রাজি হলে তবেই চুক্তি হবে।</p>` : ''}
            ${test && it.note ? `<p class="note gap-t">${U.ud(it.note)}</p>` : ''}
            ${doctor ? patientPick(it) : ''}
          </section>
          ${others.length ? `<section class="panel"><h2 class="tight">একসাথে আরও টেস্ট করাবেন?</h2>
            ${others.map((x) => `<label class="pay"><input type="checkbox" data-more="${x.id}" ${bd.more.includes(x.id) ? 'checked' : ''}><span><b>${U.ud(x.name)}</b>${priceHtml(x)}</span></label>`).join('')}</section>` : ''}
          ${trip ? `<section class="panel">${tripFields(it, p)}${wrongArea ? `<p class="warn">এই দোকান ${U.geo(s.area)} এলাকায়, ঠিকানাটি ${U.geo(p.area)} এ। ঠিকানা মিলিয়ে নিন।</p>` : ''}</section>` : ''}
          ${it.vehicle ? `<section class="panel"><h2 class="tight">গাড়ির তথ্য</h2>${vehicleFields(it)}</section>` : ''}
          <section class="panel">
            <h2 class="tight">${trip ? 'কবে, কখন?' : quote ? 'কী সমস্যা, কবে আসবেন?' : 'কবে, কোন সময়ে?'}</h2>
            ${quote && !trip ? `<label class="field"><span>সমস্যাটি লিখুন</span><textarea id="b-problem" data-bk="problem" rows="3" maxlength="500" placeholder="${it.vehicle ? 'যেমন: স্টার্ট নিচ্ছে না, ব্রেকে শব্দ হচ্ছে' : 'যেমন: ফ্যান ঘুরছে না, শব্দ হচ্ছে'}">${U.esc(bd.problem || '')}</textarea><small class="err" id="b-problem-err"></small></label>${photoField()}` : ''}
            <div class="row2">
              <label class="field"><span>তারিখ</span><input id="b-date" data-bk="date" type="date" min="${Store.today()}" value="${U.esc(bd.date || '')}"></label>
              ${fixed ? `<label class="field"><span>সময়</span><select id="b-slot" data-bk="slot"><option value="">বেছে নিন</option>${slotOptions(s, it)}</select></label>` : `<label class="field"><span>সময়</span><input id="b-time" data-bk="time" type="time" value="${U.esc(bd.time || '')}"></label>`}
            </div>
            <small class="err" id="b-when-err" role="alert"></small>
            ${fixed && it.multi ? `<label class="field"><span>কয়টি</span><input id="b-qty" data-bk="qty" type="number" min="1" max="10" value="${U.esc(bd.qty)}"><small class="err" id="b-qty-err"></small></label>` : ''}
          </section>
          <section class="panel">
            <h2 class="tight">${trip ? 'কার নামে বুকিং?' : quote ? 'কোথায়, কার জন্য?' : doctor || test ? 'রোগীর তথ্য' : 'কার জন্য?'}</h2>
            ${quote && !trip ? `<button type="button" class="addr" data-action="open-places"><span aria-hidden="true">${p.icon}</span><span><b>${U.placeName(p)}</b><small>${U.placeLine(p)}</small></span><em>বদলান</em></button>` : ''}
            ${quote && !trip && p.custom ? `<label class="field"><span>পুরো ঠিকানা</span><input id="b-line" data-bk="line" type="text" maxlength="150" autocomplete="street-address" placeholder="বাড়ি, রোড, গ্রাম বা মহল্লা" value="${U.esc(bd.line || '')}"><small class="err" id="b-line-err"></small></label>` : ''}
            ${wrongArea && !trip ? `<p class="warn">এই দোকান ${U.geo(s.area)} এলাকায়, ঠিকানাটি ${U.geo(p.area)} এ। ঠিকানা মিলিয়ে নিন।</p>` : ''}
            <label class="field"><span>${doctor || test ? 'রোগীর নাম' : 'নাম'}</span><input id="b-name" data-bk="name" type="text" maxlength="60" autocomplete="name" value="${U.esc(bd.name || '')}"><small class="err" id="b-name-err"></small></label>
            <label class="field"><span>মোবাইল নম্বর</span><input id="b-phone" data-bk="phone" type="tel" inputmode="numeric" placeholder="01XXXXXXXXX" autocomplete="tel" value="${U.esc(bd.phone || '')}"><small class="err" id="b-phone-err"></small></label>
            ${quote ? '' : `<label class="field"><span>নোট (ঐচ্ছিক)</span><textarea data-bk="note" rows="2" maxlength="300">${U.esc(bd.note || '')}</textarea></label>`}
          </section>
        </div>
        <aside class="panel bill">
          <h2 class="tight">হিসাব</h2>
          ${bill}
          <p class="note">${doctor || test ? 'টাকা ক্লিনিকে সরাসরি দিন।' : trip ? 'ভাড়া এজেন্ট বা চালককে সরাসরি দিন।' : `টাকা ${quote ? 'সেবা শেষে' : 'দোকানে বা কাউন্টারে'} সরাসরি দিন।`}</p>
          ${U.viewing() ? '<p class="note">👁 দেখার মোড: এখান থেকে বুকিং পাঠানো যাবে না।</p>' : ''}
          <button type="submit" class="btn block">${quote ? 'বুকিং পাঠান ও চ্যাট শুরু করুন' : doctor ? 'সিরিয়াল নিন' : 'বুকিং পাঠান'}</button>
        </aside>
      </form>`;
  }
  function submitBooking(form) {
    const show = (id, msg, focus) => { $(id).textContent = msg; if (focus && $(focus)) $(focus).focus(); };
    ['b-problem-err', 'b-when-err', 'b-line-err', 'b-name-err', 'b-phone-err', 'b-qty-err', 'b-tozila-err', 'b-to-err', 'b-load-err', 'b-vtype-err', 'b-where-err'].forEach((id) => { if ($(id)) $(id).textContent = ''; });
    if (U.viewing()) { U.toast('দেখার মোডে বুকিং পাঠানো যায় না'); return; }
    const s = Store.shopById(form.dataset.shop);
    const it = s.items.find((x) => x.id === form.dataset.item);
    const quote = it.book === 'quote';
    const fixed = it.book === 'fixed';
    const trip = !!it.trip;
    if (trip) {
      if (U.place().custom && (bd.line || '').trim().length < 5) return show('b-line-err', 'পুরো ঠিকানা লিখুন', 'b-line');
      if (!bd.toZila) return show('b-tozila-err', 'জেলা বেছে নিন', 'b-tozila');
      if ((bd.to || '').trim().length < 3) return show('b-to-err', 'কোথায় যাবেন, লিখুন', 'b-to');
      if ((bd.load || '').trim().length < 2) return show('b-load-err', 'একটু লিখুন', 'b-load');
    }
    if (it.vehicle) {
      if (!bd.vtype) return show('b-vtype-err', 'কোন গাড়ি, বেছে নিন', 'b-vtype');
      const where = Store.whereOf(it);
      if (where.length === 1) bd.where = where[0];
      if (where.length && !where.includes(bd.where)) return show('b-where-err', 'কাজটি কোথায় হবে, বেছে নিন', 'b-vtype');
    }
    if (quote && !trip && (bd.problem || '').trim().length < 5) return show('b-problem-err', 'সমস্যাটি একটু লিখুন', 'b-problem');
    const time = fixed ? bd.slot : bd.time;
    if (!bd.date || !time) return show('b-when-err', 'তারিখ ও সময় দিন।', 'b-date');
    const qty = fixed && it.multi ? Number(ascii(bd.qty)) : 1;
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) return show('b-qty-err', '১ থেকে ১০ এর মধ্যে দিন', 'b-qty');
    if (quote && U.place().custom && (bd.line || '').trim().length < 5) return show('b-line-err', 'পুরো ঠিকানা লিখুন', 'b-line');
    if (!(bd.name || '').trim()) return show('b-name-err', 'নাম লিখুন', 'b-name');
    const phone = ascii(bd.phone || '').trim().replace(/[\s-]/g, '');
    if (!/^01[3-9]\d{8}$/.test(phone)) return show('b-phone-err', '১১ সংখ্যার মোবাইল নম্বর লিখুন, যেমন 017XXXXXXXX।', 'b-phone');
    const p = U.place();
    try {
      const o = Store.book({
        shopId: s.id, itemId: it.id, customerId: customer().id, qty, date: bd.date, time, patient: bd.patient, more: bd.more,
        problem: (trip ? bd.load || '' : bd.problem || '').trim(), note: (bd.note || '').trim(), placeLabel: p.label,
        recipient: { name: bd.name.trim(), phone, line: quote ? (p.custom ? bd.line.trim() + ', ' + p.line : p.line) : '', lat: p.lat, lng: p.lng },
        trip: trip ? { toZila: bd.toZila, to: bd.to, toLat: bd.toLat, toLng: bd.toLng, load: bd.load, back: bd.back, help: bd.help } : undefined,
        vehicle: it.vehicle ? { type: bd.vtype, model: bd.model, plate: bd.plate, where: bd.where } : undefined,
        photo: quote && !trip ? bd.photo : undefined
      });
      bd = {}; bdKey = '';
      location.hash = quote ? '#/chat/' + s.id : '#/track/' + o.code;
    } catch (ex) {
      show('b-when-err', ex.message, 'b-date');
    }
  }

  /* ---------- offer shown to the customer ---------- */
  function offerCard(o) {
    if (!o.offer) return '';
    return `<div class="offer"><b>বিল প্রস্তাব: ${U.tk(o.offer.amount)}</b>
      ${o.offer.terms ? `<p>${U.ud(o.offer.terms)}</p>` : ''}
      <div class="o-acts"><button type="button" class="btn sm" data-book="agree" data-code="${o.code}">✓ রাজি, চুক্তি করুন</button><button type="button" class="btn ghost sm" data-book="reject" data-code="${o.code}">রাজি নই</button></div></div>`;
  }
  // bill lines for a booking, used on the tracking page
  function billHtml(o) {
    return `<ul class="mini">${o.lines.map((l) => `<li><span>${U.bn(l.qty)} × ${U.ud(l.name)}</span><b>${l.price ? U.tk(l.price * l.qty) : 'ফ্রি'}</b></li>`).join('')}</ul>
      ${jobHtml(o)}
      ${o.patient ? `<div class="sum"><span>রোগী</span><b>${PATIENT_WORD[o.patient]}</b></div>` : ''}
      ${o.serial ? `<div class="sum"><span>সিরিয়াল</span><b>${U.bn(o.serial)}</b></div>` : ''}
      ${o.when ? `<p class="meta">সময়: ${U.fmtWhen(o.when)}</p>` : ''}
      ${o.note ? `<p class="meta">${U.ud(o.note)}</p>` : ''}
      ${o.contract ? `<div class="sum"><span>চুক্তির বিল</span><b>${U.tk(o.contract.amount)}</b></div>${o.contract.terms ? `<p class="meta">${U.ud(o.contract.terms)}</p>` : ''}` : o.book === 'quote' ? '<div class="sum"><span>বাকি বিল</span><b>আলোচনায় ঠিক হবে</b></div>' : ''}
      <div class="sum total"><span>${o.book === 'quote' && !o.contract ? 'এখন পর্যন্ত' : 'মোট'}</span><b>${o.total ? U.tk(o.total) : 'ফ্রি'}</b></div>
      ${offerCard(o)}`;
  }

  /* ---------- chat ---------- */
  // the time under a message, and for its sender the way to take it back
  const stamp = (m, viewer, i) => `<small>${U.fmtTime(m.at)}${m.by === viewer ? `<button type="button" class="unsend" data-book="unsend" data-i="${i}">আনসেন্ড</button>` : ''}</small>`;
  // a product or service shown in the chat; the price and the button are always today's
  function shareHtml(m, viewer, c, i) {
    const s = Store.shopById(c.shopId);
    const it = s && s.items.find((x) => x.id === m.itemId);
    const on = it && it.available;
    return `<li class="msg share ${m.by === viewer ? 'mine' : ''}">
      <div class="share-card">${it ? U.thumbHtml(it) : '<span class="thumb" aria-hidden="true">📦</span>'}
        <div class="item-txt"><b>${U.ud(it ? it.name : m.name)}</b>${it ? `<small>${U.ud(it.unit)}</small>` : ''}${on ? priceHtml(it) + bookNote(it) : '<small class="share-off">এখন পাওয়া যাচ্ছে না</small>'}</div>
        ${on && viewer === 'customer' ? U.buyFor(s, it) : ''}</div>
      ${stamp(m, viewer, i)}</li>`;
  }
  function msgHtml(m, viewer, c, i) {
    const mine = m.by === viewer ? 'mine' : '';
    if (m.kind === 'text') return `<li class="msg ${mine}"><p>${U.ud(m.text)}</p>${stamp(m, viewer, i)}</li>`;
    if (m.kind === 'item') return shareHtml(m, viewer, c, i);
    if (m.kind === 'image') {
      return `<li class="msg photo ${mine}"><button type="button" class="photo-open" data-book="photo" data-i="${i}" aria-label="ছবিটি বড় করে দেখুন"><img src="${m.image}" width="${m.w}" height="${m.h}" alt="চ্যাটে পাঠানো ছবি"></button>${stamp(m, viewer, i)}</li>`;
    }
    if (m.kind === 'unsent') {
      return `<li class="msg unsent ${mine}"><p>🚫 ${mine ? 'আপনি বার্তাটি আনসেন্ড করেছেন' : 'বার্তাটি আনসেন্ড করা হয়েছে'}</p><small>${U.fmtTime(m.at)}</small></li>`;
    }
    const o = Store.data.orders.find((x) => x.code === m.code);
    const l = o && o.lines[0];
    let body = '';
    if (m.kind === 'booked') body = `🗓️ বুকিং অনুরোধ: ${l ? U.ud(l.name) : ''}${o && o.when ? ` · ${U.fmtWhen(o.when)}` : ''}${o ? jobHtml(o) : ''}`;
    if (m.kind === 'offer') {
      const live = o && o.offer && o.offer.at === m.at;
      body = `💰 বিল প্রস্তাব: ${U.tk(m.amount)}${m.terms ? `<br>${U.ud(m.terms)}` : ''}${live ? (viewer === 'customer' ? `<div class="o-acts"><button type="button" class="btn sm" data-book="agree" data-code="${m.code}">✓ রাজি, চুক্তি করুন</button><button type="button" class="btn ghost sm" data-book="reject" data-code="${m.code}">রাজি নই</button></div>` : '<br><small>গ্রাহকের সম্মতির অপেক্ষায়</small>') : ''}`;
    }
    if (m.kind === 'agreed') body = `🤝 চুক্তি হয়েছে: মোট ${U.tk(m.amount)}`;
    if (m.kind === 'rejected') body = 'গ্রাহক এই বিলে রাজি নন';
    if (m.kind === 'confirmed') body = '✓ বুকিং নিশ্চিত হয়েছে';
    if (m.kind === 'completed') body = '✓ সেবা সম্পন্ন';
    if (m.kind === 'cancelled') body = '🚫 বুকিং বাতিল হয়েছে';
    const link = o ? (viewer === 'customer' ? `#/track/${o.code}` : `#/owner#o-${o.code}`) : '';
    return `<li class="msg-sys ${m.kind}"><div>${body}</div>${viewer === 'customer' && link ? `<a href="${link}">বিস্তারিত দেখুন ›</a>` : ''}<small>${U.fmtTime(m.at)}</small></li>`;
  }
  const msgsHtml = (c, viewer) => (c && c.msgs.length ? c.msgs.map((m, i) => msgHtml(m, viewer, c, i)).join('') : '<li class="chat-empty">এখনো কোনো কথা হয়নি। প্রথম বার্তা পাঠান।</li>');
  function threadHtml(c, viewer, head, side) {
    // a half-written message belongs to this conversation only
    const t = currentThread();
    const key = t.shopId + '/' + t.customerId;
    if (key !== draftKey) { draft = ''; draftKey = key; }
    slash = null;
    slashOff = -1;
    // sharing products and services from the chat box belongs to the shop and service side
    const sharing = viewer === 'shop';
    return `<div class="chat">
      <header class="chat-head">${head}</header>
      ${side || ''}
      <ul class="chat-msgs" id="chat-msgs" aria-live="polite">${msgsHtml(c, viewer)}</ul>
      <form id="chat-form" class="chat-send" autocomplete="off" novalidate>
        ${sharing ? `<div class="slash" id="slash" hidden>
          <p class="slash-h"><b>শেয়ার করতে বেছে নিন</b><small>নাম লিখে খুঁজুন, অথবা /পণ্য ও /সেবা</small></p>
          <ul id="slash-list" role="listbox" aria-label="পণ্য ও সেবা"></ul>
        </div>
        <button type="button" class="chat-tool" data-book="slash" aria-label="পণ্য বা সেবা শেয়ার করুন" title="পণ্য বা সেবা শেয়ার করুন">/</button>` : ''}
        <label class="chat-tool" title="ছবি পাঠান"><input id="chat-photo" type="file" class="sr" accept="image/jpeg,image/png,image/webp" aria-label="ছবি পাঠান"><span aria-hidden="true">📷</span></label>
        <input id="chat-in" type="text" maxlength="1000" placeholder="${sharing ? 'বার্তা লিখুন বা / দিন' : 'বার্তা লিখুন'}" aria-label="বার্তা লিখুন" ${sharing ? 'role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="slash-list"' : ''} value="${U.esc(draft)}">
        <button type="submit" class="btn" aria-label="পাঠান">পাঠান</button>
      </form>
    </div>`;
  }
  function customerChat(shopId) {
    const blocked = gate(shopId ? '#/chat/' + shopId : '#/chat', 'চ্যাট করতে লগইন করুন');
    if (blocked) return blocked;
    const me = customer();
    if (!shopId) {
      const list = Store.chatsOf({ customerId: me.id });
      return `<h1 class="page-h">চ্যাট</h1>${list.length ? `<div class="stack">${list.map((c) => {
        const s = Store.shopById(c.shopId);
        const n = Store.unreadIn(c, 'customer');
        return `<a class="panel chat-row" href="#/chat/${c.shopId}">${s ? U.logoHtml(s, 'chat-logo') : ''}<span><b>${s ? U.ud(s.name) : ''}</b><small>${lastLine(c)}</small></span>${n ? `<span class="pill">${U.bn(n)}</span>` : ''}</a>`;
      }).join('')}</div>` : '<div class="empty big"><span aria-hidden="true">💬</span><h1>এখনো কোনো চ্যাট নেই</h1><p>দোকানের পাতায় "চ্যাট করুন" চাপলে এখানে দেখা যাবে।</p><a class="btn" href="#/">দোকান দেখুন</a></div>'}`;
    }
    const s = Store.shopById(shopId);
    if (!s || s.hidden) return null;
    const c = Store.chatOf(shopId, me.id);
    if (c) Store.chatSeen(c, 'customer');
    return `<a class="back" href="#/chat">‹ সব চ্যাট</a>
      ${threadHtml(c, 'customer', `${U.logoHtml(s, 'chat-logo')}<div><a href="#/shop/${s.id}"><b>${U.ud(s.name)}</b></a><small>${hoursStatus(s).text}</small></div><a class="btn ghost sm" href="tel:${U.esc(s.phone)}" aria-label="কল করুন">📞</a>`)}`;
  }
  function lastLine(c) {
    const m = c.msgs[c.msgs.length - 1];
    if (!m) return '';
    if (m.kind === 'image') return '📷 ছবি';
    if (m.kind === 'unsent') return 'বার্তাটি আনসেন্ড করা হয়েছে';
    return m.kind === 'text' ? U.ud(m.text.slice(0, 60)) : m.kind === 'item' ? `📦 ${U.ud(m.name)}` : m.kind === 'offer' ? `💰 বিল প্রস্তাব: ${U.tk(m.amount)}` : m.kind === 'agreed' ? '🤝 চুক্তি হয়েছে' : '🗓️ বুকিং';
  }
  const customerName = (id) => { const a = Store.data.accounts.find((x) => x.id === id); return a ? a.name : 'গ্রাহক'; };
  function ownerChat(s, customerId) {
    if (!customerId) {
      const list = Store.chatsOf({ shopId: s.id });
      return `<h1 class="page-h">চ্যাট</h1>${list.length ? `<div class="stack">${list.map((c) => {
        const n = Store.unreadIn(c, 'shop');
        return `<a class="panel chat-row" href="#/owner/chat/${c.customerId}"><span class="auth-ico small" aria-hidden="true">👤</span><span><b>${U.ud(customerName(c.customerId))}</b><small>${lastLine(c)}</small></span>${n ? `<span class="pill">${U.bn(n)}</span>` : ''}</a>`;
      }).join('')}</div>` : '<div class="empty"><span aria-hidden="true">💬</span><h3>এখনো কোনো চ্যাট নেই</h3><p>গ্রাহক বার্তা পাঠালে এখানে দেখা যাবে।</p></div>'}`;
    }
    const c = Store.chatOf(s.id, customerId);
    if (!c) return null;
    Store.chatSeen(c, 'shop');
    const open = Store.data.orders.filter((o) => o.shopId === s.id && o.customerId === customerId && o.book === 'quote' && !Store.isFinal(o));
    const side = open.map((o) => `<div class="chat-deal"><span>${U.ud(o.lines[0].name)} · ${o.contract ? `চুক্তি ${U.tk(o.contract.amount)}` : o.offer ? `প্রস্তাব ${U.tk(o.offer.amount)}, সম্মতির অপেক্ষায়` : `চার্জ ${U.tk(o.lines[0].price)}`}</span><button type="button" class="btn sm" data-own="offer" data-code="${o.code}">💰 বিল প্রস্তাব</button></div>`).join('');
    return `<a class="back" href="#/owner/chat">‹ সব চ্যাট</a>${threadHtml(c, 'shop', `<span class="auth-ico small" aria-hidden="true">👤</span><div><b>${U.ud(customerName(customerId))}</b></div>`, side)}`;
  }
  function mount() {
    const box = $('chat-msgs');
    if (box) box.scrollTop = keepTop === null ? box.scrollHeight : keepTop;
    keepTop = null;
    // each route's map: its road through the stops, the counters, and the passenger's two stops
    document.querySelectorAll('[data-route]').forEach((el) => {
      const [sid, iid] = el.dataset.route.split('/');
      const s = Store.shopById(sid);
      const it = s && s.items.find((x) => x.id === iid);
      if (it) window.LHMap.route(el, it.stops, el.dataset.from === undefined ? null : { from: +el.dataset.from, to: +el.dataset.to });
    });
    const end = $('b-tomap');
    if (end) {
      const pos = window.LH_GEO_POS[bd.toZila || ''];
      const p = U.place();
      // the same district as the pickup opens near the pickup
      const around = bd.toZila && bd.toZila === p.zila ? [p.lat, p.lng] : pos || [p.lat, p.lng];
      window.LHMap.picker(end, bd.toLat ? { lat: bd.toLat, lng: bd.toLng } : null, (lat, lng) => {
        bd.toLat = lat; bd.toLng = lng;
        $('b-km').innerHTML = kmLine();
      }, { icon: '🏁', around });
    }
  }
  function currentThread() {
    const h = location.hash;
    let m = h.match(/^#\/chat\/([^/]+)/);
    if (m) return { by: 'customer', shopId: m[1], customerId: customer() && customer().id };
    m = h.match(/^#\/owner\/chat\/([^/]+)/);
    const me = owner();
    if (m && me) return { by: 'shop', shopId: me.shopId, customerId: m[1] };
    return null;
  }
  // new messages from another tab; the half-written message stays in the box
  function refresh(stay) {
    const t = currentThread();
    const box = $('chat-msgs');
    if (!t || !box) return false;
    const c = Store.chatOf(t.shopId, t.customerId);
    if (c) Store.chatSeen(c, t.by);
    const top = box.scrollTop;
    box.innerHTML = msgsHtml(c, t.by);
    box.scrollTop = stay ? top : box.scrollHeight;
    return true;
  }
  async function sendPhoto(input) {
    const file = input.files[0];
    const t = currentThread();
    input.value = '';
    if (!file || !t) return;
    U.toast('ছবি পাঠানো হচ্ছে');
    try {
      Store.chatImage(t.shopId, t.customerId, t.by, await window.LHImage.readWhole(file));
      $('toast').classList.remove('show');
      refresh();
    } catch (ex) { U.toast(ex.message); }
  }

  /* ---------- "/" in the chat box: this shop's products and services, ready to share ---------- */
  // Only a "/" at the start or after a space opens the list, so "12/3" or a link stays plain text.
  function slashToken(box) {
    const before = box.value.slice(0, box.selectionStart);
    const at = before.lastIndexOf('/');
    if (at < 0 || (at > 0 && !/\s/.test(before[at - 1]))) return null;
    return { at, q: before.slice(at + 1) };
  }
  function slashItems(s, q) {
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const kind = PRODUCT_WORDS.has(words[0]) ? 'product' : SERVICE_WORDS.has(words[0]) ? 'service' : '';
    const rest = (kind ? words.slice(1) : words).join(' ');
    const list = rest ? U.matchItems(s, rest) : s.items.filter((it) => it.available);
    return kind ? list.filter((it) => Boolean(it.book) === (kind === 'service')) : list;
  }
  const slashRow = (it, i) => `<li role="option" id="slash-${i}" class="${i === slash.active ? 'on' : ''}" aria-selected="${i === slash.active}" data-slash="${it.id}">${U.thumbHtml(it)}<span class="item-txt"><b>${U.ud(it.name)}</b><small>${U.ud(it.unit)}</small></span>${priceHtml(it)}</li>`;
  function slashPaint(box) {
    $('slash-list').innerHTML = slash.items.length ? slash.items.map(slashRow).join('')
      : `<li class="slash-none" role="option" aria-selected="false" aria-disabled="true">${slash.q.trim() ? 'এই খোঁজে কিছু পাওয়া যায়নি' : 'এখন শেয়ার করার মতো কিছু নেই'}</li>`;
    $('slash').hidden = false;
    box.setAttribute('aria-expanded', 'true');
    if (slash.items.length) box.setAttribute('aria-activedescendant', 'slash-0'); else box.removeAttribute('aria-activedescendant');
  }
  function slashClose() {
    slash = null;
    const list = $('slash');
    if (!list) return;
    list.hidden = true;
    const box = $('chat-in');
    box.setAttribute('aria-expanded', 'false');
    box.removeAttribute('aria-activedescendant');
  }
  function slashUpdate(box) {
    if (!$('slash')) return;
    const tok = slashToken(box);
    if (!tok || tok.at !== slashOff) slashOff = -1;
    if (!tok || tok.at === slashOff || /^\s/.test(tok.q)) { slashClose(); return; }
    if (slash && slash.at === tok.at && slash.q === tok.q) return;
    const t = currentThread();
    const s = t && Store.shopById(t.shopId);
    if (!s) { slashClose(); return; }
    const items = slashItems(s, tok.q);
    // a sentence that only began with "/" is plain text
    if (!items.length && /\s/.test(tok.q)) { slashClose(); return; }
    slash = { at: tok.at, q: tok.q, items, active: 0 };
    slashPaint(box);
  }
  function slashMove(step) {
    const n = slash.items.length;
    if (!n) return;
    slash.active = (slash.active + step + n) % n;
    $('slash-list').querySelectorAll('[role=option]').forEach((el, i) => {
      el.classList.toggle('on', i === slash.active);
      el.setAttribute('aria-selected', String(i === slash.active));
    });
    const el = $('slash-' + slash.active);
    el.scrollIntoView({ block: 'nearest' });
    $('chat-in').setAttribute('aria-activedescendant', el.id);
  }
  // takes the "/word" back out of the box
  function slashCut(box) {
    const at = slash.at;
    box.value = box.value.slice(0, at) + box.value.slice(box.selectionStart);
    box.setSelectionRange(at, at);
    draft = box.value;
    slashClose();
  }
  function slashShare(itemId) {
    const t = currentThread();
    const box = $('chat-in');
    if (!t || !slash) return;
    try {
      Store.chatShare(t.shopId, t.customerId, t.by, itemId);
      slashCut(box);
      refresh();
    } catch (ex) { slashClose(); U.toast(ex.message); }
    box.focus();
  }
  function slashToggle() {
    const box = $('chat-in');
    box.focus();
    if (slash) { slashCut(box); return; }
    box.setSelectionRange(box.value.length, box.value.length);
    if (!slashToken(box)) box.value += /\S$/.test(box.value) ? ' /' : '/';
    draft = box.value;
    slashOff = -1;
    slashUpdate(box);
  }

  /* ---------- events ---------- */
  function onClick(e) {
    const row = e.target.closest('[data-slash]');
    if (row) { slashShare(row.dataset.slash); return; }
    const el = e.target.closest('[data-book]');
    if (!el) return;
    const d = el.dataset;
    try {
      if (d.book === 'slash') slashToggle();
      if (d.book === 'photo') {
        const t = currentThread();
        const m = t && Store.chatOf(t.shopId, t.customerId).msgs[d.i];
        if (m && m.image) U.openSheet(`<h2 id="sheet-h" class="sr">ছবি</h2><img class="photo-big" src="${m.image}" alt="চ্যাটে পাঠানো ছবি"><button type="button" class="link" data-action="close-sheet">বন্ধ করুন</button>`);
      }
      if (d.book === 'unsend') {
        U.openSheet(`<h2 id="sheet-h">আনসেন্ড করবেন?</h2><p>এটি দুই পক্ষের চ্যাট থেকেই মুছে যাবে, ফেরানো যাবে না।</p>
          <button type="button" class="btn block danger-fill" data-book="unsend-yes" data-i="${d.i}">হ্যাঁ, আনসেন্ড করুন</button>
          <button type="button" class="link" data-action="close-sheet">না, থাক</button>`);
      }
      if (d.book === 'unsend-yes') {
        const t = currentThread();
        U.closeSheet();
        Store.chatUnsend(t.shopId, t.customerId, t.by, Number(d.i));
        refresh(true);
      }
      if (d.book === 'agree') { Store.agree(d.code); U.toast('চুক্তি হয়েছে'); U.route(true); }
      if (d.book === 'reject') { Store.rejectOffer(d.code); U.route(true); }
      if (d.book === 'week-copy') {
        const f = WEEK_ORDER[0];
        for (let i = 0; i < 7; i++) {
          $('wk-on-' + i).checked = $('wk-on-' + f).checked;
          $('wk-o-' + i).value = $('wk-o-' + f).value;
          $('wk-e-' + i).value = $('wk-e-' + f).value;
          $('wk-o-' + i).disabled = !$('wk-on-' + i).checked;
          $('wk-e-' + i).disabled = !$('wk-on-' + i).checked;
        }
      }
    } catch (ex) { U.toast(ex.message); U.route(true); }
  }
  function onInput(e) {
    const k = e.target.dataset && e.target.dataset.bk;
    if (k) { bd[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; return; }
    if (e.target.id === 'chat-in') { draft = e.target.value; slashUpdate(e.target); }
  }
  function onKey(e) {
    if (e.target.id !== 'chat-in' || !slash) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); slashMove(e.key === 'ArrowDown' ? 1 : -1); }
    if (e.key === 'Escape') { slashOff = slash.at; slashClose(); }
  }
  // keeps focus in the box, so pressing these does not close the list first
  function onPress(e) {
    if (e.target.closest('#slash, .chat-send button')) e.preventDefault();
  }
  async function bookPhoto(input) {
    const file = input.files[0];
    input.value = '';
    if (!file) return;
    try {
      bd.photo = await window.LHImage.readWhole(file);
      $('b-photo-prev').innerHTML = `<img src="${bd.photo.image}" alt="">`;
      $('b-photo-err').textContent = '';
    } catch (ex) { $('b-photo-err').textContent = ex.message; }
  }
  function onChange(e) {
    if (e.target.id === 'chat-photo') { sendPhoto(e.target); return; }
    if (e.target.id === 'b-photo') { bookPhoto(e.target); return; }
    // another district: the pin of the old one no longer fits, the map opens on the new one
    if (e.target.id === 'b-tozila') { bd.toZila = e.target.value; bd.toLat = null; bd.toLng = null; U.route(true); return; }
    // a bus ticket: another stop, day or number of seats changes the fare, the times and the seats left
    const bus = e.target.dataset && e.target.dataset.bus;
    if (bus) {
      const f = $('bus-form');
      const it = Store.shopById(f.dataset.shop).items.find((x) => x.id === f.dataset.item);
      if (bus === 'from') { bd.from = Number(e.target.value); if (bd.to <= bd.from) bd.to = it.stops.length - 1; }
      if (bus === 'to') bd.to = Number(e.target.value);
      if (bus === 'date') bd.date = e.target.value;
      if (bus === 'time') { bd.time = e.target.value; return; }
      U.route(true);
      return;
    }
    if (e.target.id === 'bus-qty') { U.route(true); return; }
    // the bill follows the patient type and the tests picked
    if (e.target.name === 'b-patient') { U.route(true); return; }
    const more = e.target.dataset && e.target.dataset.more;
    if (more) { bd.more = e.target.checked ? bd.more.concat(more) : bd.more.filter((x) => x !== more); U.route(true); return; }
    const on = e.target.dataset && e.target.dataset.wkOn;
    if (on !== undefined) {
      $('wk-o-' + on).disabled = !e.target.checked;
      $('wk-e-' + on).disabled = !e.target.checked;
    }
    if (e.target.id === 'b-date' && $('b-slot')) {
      const f = $('book-form');
      const s = Store.shopById(f.dataset.shop);
      const it = s.items.find((x) => x.id === f.dataset.item);
      $('b-slot').innerHTML = `<option value="">বেছে নিন</option>${slotOptions(s, it)}`;
      // a time that cannot be picked on the new day is no longer chosen
      bd.slot = $('b-slot').value;
    }
  }
  function onSubmit(e) {
    if (e.target.id === 'book-form') { e.preventDefault(); submitBooking(e.target); return; }
    if (e.target.id === 'bus-form') { e.preventDefault(); submitBus(e.target); return; }
    if (e.target.id === 'bus-find') { e.preventDefault(); busQ = { from: $('bf-from').value, to: $('bf-to').value }; U.route(true); return; }
    if (e.target.id !== 'chat-form') return;
    e.preventDefault();
    if (slash && slash.items.length) { slashShare(slash.items[slash.active].id); return; }
    const t = currentThread();
    const box = $('chat-in');
    const text = box.value.trim();
    if (!t || !text) return;
    try {
      Store.chatSend(t.shopId, t.customerId, t.by, text);
      draft = '';
      box.value = '';
      slashClose();
      refresh();
      box.focus();
    } catch (ex) { U.toast(ex.message); }
  }
  function init(ui) {
    U = ui;
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput);
    document.addEventListener('change', onChange);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPress);
    document.addEventListener('focusout', (e) => { if (e.target.id === 'chat-in') slashClose(); });
    document.addEventListener('focusin', (e) => { if (e.target.id === 'chat-in') slashUpdate(e.target); });
    document.addEventListener('selectionchange', () => { const a = document.activeElement; if (a && a.id === 'chat-in') slashUpdate(a); });
    // a cart button on a shared card re-renders the page; the conversation stays where it was
    document.addEventListener('click', (e) => { if (e.target.closest('#chat-msgs [data-action]')) keepTop = $('chat-msgs').scrollTop; }, true);
  }
  return { init, mount, refresh, daysText, slotsText, offerText, hoursStatus, hoursTable, weekEditor, readWeek, priceHtml, bookNote, bookBtn, bookPage, customerChat, ownerChat, billHtml, offerCard, jobHtml, busShop, busPage, stopsHtml };
})();

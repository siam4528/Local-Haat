// The LocalHaat team's own side of the panel: each person's login with a code, the work list, the team itself, the audit log,
// an order's page, and the customer details the support role sees only in part.
window.LHTeam = (function () {
  'use strict';
  const Store = window.LHStore;
  let U;
  const $ = (id) => document.getElementById(id);
  const D = () => Store.data;
  // the customer details opened in full on this page, by order or ticket
  const shown = new Set();
  const aud = { by: '', action: '', from: '', to: '', limit: 100 };

  const ACTION = {
    login: 'লগইন', 'login-fail': 'ভুল পাসওয়ার্ড', logout: 'লগ আউট',
    'shop-verify': 'এজেন্ট যাচাই', 'shop-unverify': 'যাচাই তুলে নেওয়া', 'shop-suspend': 'এজেন্ট স্থগিত', 'shop-resume': 'এজেন্ট আবার চালু', 'shop-area': 'এজেন্টের এলাকা বদল',
    'rider-approve': 'এনআইডি অনুমোদন', 'rider-reject': 'এনআইডি ফেরত', 'rider-suspend': 'ডেলিভারি ম্যান স্থগিত', 'rider-resume': 'ডেলিভারি ম্যান আবার চালু', 'rider-area': 'ডেলিভারি ম্যানের এলাকা বদল',
    assign: 'ডেলিভারি ম্যান পাঠানো', 'team-deliver': 'কোড ছাড়া ডেলিভারি নিশ্চিত',
    'rating-hide': 'রেটিং লুকানো', 'rating-show': 'রেটিং আবার দেখানো',
    'offer-add': 'অফার যোগ', 'offer-edit': 'অফার এডিট', 'offer-on': 'অফার চালু', 'offer-off': 'অফার বন্ধ', 'offer-delete': 'অফার মোছা',
    'ad-add': 'বিজ্ঞাপন যোগ', 'ad-edit': 'বিজ্ঞাপন এডিট', 'ad-on': 'বিজ্ঞাপন চালু', 'ad-off': 'বিজ্ঞাপন বন্ধ', 'ad-delete': 'বিজ্ঞাপন মোছা',
    'refund-step1': 'রিফান্ড: প্রথম সিদ্ধান্ত', 'refund-approve': 'রিফান্ড: দ্বিতীয় অনুমোদন', 'refund-send-back': 'রিফান্ড ফেরত পাঠানো', 'refund-paid': 'রিফান্ড দেওয়া', 'refund-rejected': 'রিফান্ড বাতিল',
    'ticket-reply': 'সাপোর্টের উত্তর', 'ticket-close': 'অনুরোধ বন্ধ', 'ticket-open': 'অনুরোধ আবার খোলা', 'callback-done': 'কল ব্যাক শেষ',
    'cat-approve': 'ক্যাটাগরি অনুমোদন', 'cat-refuse': 'ক্যাটাগরির অনুরোধ বাতিল', 'cat-grant': 'ক্যাটাগরি সরাসরি যোগ', 'cat-remove': 'ক্যাটাগরি বাদ',
    setting: 'সেটিং বদল', 'team-add': 'সদস্য যোগ', 'team-role': 'দায়িত্ব বদল', 'team-off': 'একাউন্ট বন্ধ', 'team-on': 'একাউন্ট চালু',
    'shop-add': 'নতুন দোকান যোগ', 'shop-approve': 'যোগ করা দোকান অনুমোদন', 'shop-refuse': 'যোগ করা দোকান বাতিল', 'shop-cat': 'মূল ক্যাটাগরি বদল', 'shop-claim': 'মালিক দোকান নিয়েছেন',
    'proof-seen': 'ছবি ছাড়া ডেলিভারি দেখা',
    'visit-plan': 'পরিদর্শন ঠিক করা', 'visit-done': 'পরিদর্শনের ফলাফল',
    'see-phone': 'ফোন নম্বর দেখা', 'see-address': 'ঠিকানা দেখা', 'see-nid': 'এনআইডির ছবি দেখা', 'see-licence': 'ট্রেড লাইসেন্সের ছবি দেখা'
  };
  const KIND = { shop: 'এজেন্ট', rider: 'ডেলিভারি ম্যান', order: 'অর্ডার', ticket: 'সাপোর্ট', team: 'টিম', setting: 'সেটিং', offer: 'অফার', ad: 'বিজ্ঞাপন', rating: 'রেটিং' };
  const roleText = (m) => `<span>${Store.ROLES[m.role]}</span>${m.division ? ` · ${U.geo(m.division)} <span>বিভাগ</span>` : ''}`;
  const noPerm = () => '<div class="empty big"><span aria-hidden="true">🔒</span><h1>এই পাতা দেখার অনুমতি আপনার নেই</h1><a class="btn" href="#/admin">কাজের তালিকায় ফিরুন</a></div>';

  /* ---------- login: the password, then a six-digit code ---------- */
  const DEMO = [['01700000001', 'super'], ['01700000002', 'support'], ['01700000003', 'verify'], ['01700000004', 'finance'], ['01700000005', 'division']];
  function loginPage() {
    const p = D().sessions.teamPending;
    if (p) {
      return `<div class="panel-page">
        <h1 class="page-h">দুই ধাপের যাচাই</h1>
        <form id="team-code" class="panel" novalidate>
          <p class="meta">আপনার ফোনে পাঠানো ৬ সংখ্যার কোড দিন। কোড ৫ মিনিট কাজ করবে।</p>
          <div class="demo-code" role="status"><b><span>ডেমো কোড</span>: <span translate="no">${U.bn(p.code)}</span></b><small>এটি ডেমো। আসল অ্যাপে কোড এসএমএস বা অথেন্টিকেটর অ্যাপে আসবে, পর্দায় দেখাবে না।</small></div>
          <label class="field"><span>কোড</span><input id="tc-code" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code"><small class="err" id="tc-err" role="alert"></small></label>
          <button type="submit" class="btn block">যাচাই করুন</button>
          <button type="button" class="link" data-team="restart">আবার শুরু করুন</button>
        </form></div>`;
    }
    return `<div class="panel-page">
      <h1 class="page-h">লোকালহাট টিম</h1>
      <form id="team-login" class="panel" novalidate>
        <label class="field"><span>মোবাইল নম্বর বা ইমেইল</span><input id="tl-contact" type="text" autocomplete="username" maxlength="80"></label>
        <label class="field"><span>পাসওয়ার্ড</span><input id="tl-pw" type="password" autocomplete="current-password" maxlength="100"></label>
        <small class="err" id="tl-err" role="alert"></small>
        <button type="submit" class="btn block">পরের ধাপ</button>
        <div class="demo-box team-demo"><span>প্রিভিউ ডেমো: প্রতিটি দায়িত্বের একটি করে লগইন, পাসওয়ার্ড demo1234। আসল পাসওয়ার্ড দেবেন না।</span>
          <ul>${DEMO.map(([c, role]) => `<li><span><span>${Store.ROLES[role]}</span>${role === 'division' ? ` (<span>${U.geo('ঢাকা')}</span> <span>বিভাগ</span>)` : ''}</span> <b translate="no">${c}</b> <button type="button" class="inline" data-team="fill" data-c="${c}">পূরণ করুন</button></li>`).join('')}</ul></div>
      </form></div>`;
  }

  /* ---------- the work list: what is waiting, the most urgent kind first, the oldest first ---------- */
  const MIN = 6e4;
  const HOUR = 36e5;
  function ago(at) {
    const m = Math.max(0, Math.round((Date.now() - new Date(at).getTime()) / MIN));
    if (m < 60) return `<span>${U.bn(m)}</span> <span>মিনিট আগে</span>`;
    if (m < 60 * 48) return `<span>${U.bn(Math.round(m / 60))}</span> <span>ঘণ্টা আগে</span>`;
    return `<span>${U.bn(Math.round(m / 1440))}</span> <span>দিন আগে</span>`;
  }
  const lastAt = (o, list) => { const h = o.history.filter((x) => list.includes(x.status)).pop(); return h ? h.at : o.createdAt; };
  function work() {
    const out = [];
    const add = (key, icon, title, href, rule, items) => out.push({ key, icon, title, href, rule, items: items.sort((a, b) => String(a.at || '9').localeCompare(String(b.at || '9'))) });
    const can = Store.can;
    if (can('assign')) {
      add('rider', '🛵', 'ডেলিভারি ম্যান নেই এমন অর্ডার', '#/admin/riders', '১৫ মিনিট', D().orders.filter((o) => o.needsRider && !Store.isFinal(o) && can('assign', Store.shopById(o.shopId))).map((o) => {
        const at = lastAt(o, ['confirmed', 'packed']);
        return { at, due: new Date(new Date(at).getTime() + 15 * MIN), title: U.ud(o.shopName), sub: `<span translate="no">#${U.bn(o.code)}</span> · ${U.geo(Store.shopById(o.shopId).area)}`, href: '#/admin/order/' + o.code };
      }));
    }
    // deliveries handed over without a picture, for the team to look at
    if (can('assign')) {
      add('noshot', '📷', 'ছবি ছাড়া ডেলিভারি', '#/admin', '২৪ ঘণ্টা', D().orders.filter((o) => o.proof && !o.proof.pic && !o.proof.seen && can('assign', Store.shopById(o.shopId))).map((o) => ({
        at: o.proof.at, due: new Date(new Date(o.proof.at).getTime() + 24 * HOUR), title: U.ud(o.shopName), sub: `<span translate="no">#${U.bn(o.code)}</span> · ${U.ud(o.proof.reason)}`, href: '#/admin/order/' + o.code
      })));
    }
    if (can('support')) {
      const mine = D().support.filter((t) => can('support', Store.placeOfTicket(t)));
      add('callback', '📞', 'কল ব্যাক', '#/admin/support', '৩০ মিনিট', mine.filter((t) => t.callback && !t.callback.done).map((t) => ({ at: t.callback.at, due: new Date(new Date(t.callback.at).getTime() + 30 * MIN), title: U.ud(t.name), sub: '📞 কল ব্যাক চাই', href: '#/admin/support/' + t.id })));
      add('ticket', '🛟', 'সাপোর্টের অনুরোধ', '#/admin/support', '৪ ঘণ্টা', mine.filter((t) => t.status === 'open' && !t.callback && t.msgs.length && t.msgs[t.msgs.length - 1].by === 'user').map((t) => {
        const at = t.msgs[t.msgs.length - 1].at;
        return { at, due: new Date(new Date(at).getTime() + 4 * HOUR), title: U.ud(t.subject), sub: U.ud(t.name), href: '#/admin/support/' + t.id };
      }));
    }
    if (can('refunds')) {
      add('refund', '↩️', 'রিফান্ড', '#/admin/refunds', '৪৮ ঘণ্টা', D().orders.filter((o) => o.refund && o.refund.status === 'open' && can('refunds', Store.shopById(o.shopId))).map((o) => ({
        at: o.refund.at, due: new Date(new Date(o.refund.at).getTime() + 48 * HOUR), title: U.ud(o.shopName),
        sub: `${U.tk(o.refund.amount)}${o.refund.step1 ? ' · <span>দ্বিতীয় অনুমোদন বাকি</span>' : ''}`, href: '#/admin/refunds'
      })));
    }
    if (can('rider.papers')) {
      add('papers', '🪪', 'ডেলিভারি ম্যানের এনআইডি', '#/admin/riders', '২ কর্মদিবস', D().accounts.filter((a) => a.role === 'delivery' && a.kyc && a.kyc.status === 'pending' && can('rider.papers', a)).map((a) => ({
        at: a.kyc.at, due: Store.addWorkDays(a.kyc.at, 2), title: U.ud(a.name), sub: `${U.geo(a.area || '')}`, href: '#/admin/riders'
      })));
    }
    if (can('cats')) {
      add('cats', '🏷️', 'ক্যাটাগরির অনুরোধ', '#/admin/shops', '২৪ ঘণ্টা / ৭ কর্মদিবস', D().catAsks.filter((a) => a.status === 'open' && can('cats', Store.shopById(a.shopId))).map((a) => ({
        at: a.at, due: new Date(a.due), title: U.ud(Store.shopById(a.shopId).name), sub: `<span>${U.esc(a.sub)}</span> · ${a.onLicence ? '<span>লাইসেন্সে আছে</span>' : '<span>৫–৭ কর্মদিবস</span>'}`, href: '#/admin/shops'
      })));
    }
    if (can('shop.verify')) {
      add('added', '🆕', 'টিমের যোগ করা দোকান যাচাই', '#/admin/shops', '২ কর্মদিবস', D().shops.filter((s) => s.added && s.added.status === 'pending' && can('shop.verify', s)).map((s) => ({
        at: s.added.at, due: Store.addWorkDays(s.added.at, 2), title: U.ud(s.name), sub: `<span>${U.esc(s.sub)}</span> · ${U.ud(s.added.byName)}`, href: '#/admin/shops'
      })));
    }
    // visits planned for this person
    if (can('visit')) {
      const me = Store.teamMe();
      add('visits', '🏠', 'দোকান পরিদর্শন', '#/admin', 'নির্ধারিত দিনে', D().catAsks.filter((a) => a.status === 'open' && a.visit && a.visit.status === 'planned' && a.visit.who === me.id).map((a) => ({
        at: a.visit.at, due: window.LHTime.at(a.visit.date, '23:59'), title: U.ud(Store.shopById(a.shopId).name), sub: `<span>${U.esc(a.sub)}</span> · ${window.LHTime.show(window.LHTime.at(a.visit.date, '12:00'), { day: 'numeric', month: 'short' }, window.LHI18n.lang)}`, href: '#/admin/visit/' + a.id
      })));
    }
    if (can('shop.verify')) {
      add('shops', '🏪', 'নতুন এজেন্ট যাচাই', '#/admin/shops', '৩ কর্মদিবস', D().shops.filter((s) => !s.verified && can('shop.verify', s)).map((s) => ({
        at: s.createdAt || '', due: s.createdAt ? Store.addWorkDays(s.createdAt, 3) : null, title: U.ud(s.name), sub: `${U.geo(s.area)}, ${U.geo(s.zila)}`, href: '#/admin/shops'
      })));
    }
    return out;
  }
  function dashPage() {
    const me = Store.teamMe();
    const now = new Date();
    const lists = work();
    const total = lists.reduce((a, l) => a + l.items.length, 0);
    return `<div class="page-row"><h1 class="page-h">কাজের তালিকা</h1></div>
      <section class="panel team-me"><span><b>👤 ${U.ud(me.name)}</b><small>${roleText(me)}</small></span>
        <span class="team-links">${Store.can('team') ? '<a class="btn ghost sm" href="#/admin/team">👥 টিম</a>' : ''}${Store.can('audit') ? '<a class="btn ghost sm" href="#/admin/audit">📜 অডিট লগ</a>' : ''}<button type="button" class="btn ghost sm" data-team="logout">লগ আউট</button></span></section>
      ${Store.can('shop.add') ? '<a class="btn block gap-t" href="#/admin/new-shop">+ নতুন দোকান বা সেবা যোগ করুন</a>' : ''}
      ${Store.can('orders') ? `<form id="team-order" class="panel order-find" role="search" novalidate><label class="field"><span>🔎 অর্ডার খুঁজুন</span><input id="to-code" type="text" inputmode="numeric" maxlength="12" placeholder="অর্ডার নম্বর"></label><button type="submit" class="btn">খুঁজুন</button><small class="err" id="to-err" role="alert"></small></form>` : ''}
      <p class="meta gap gap-t">${total ? '<span>সবচেয়ে জরুরি কাজ আগে, প্রতিটি তালিকায় সবচেয়ে পুরনোটি আগে।</span>' : '<span>এখন কোনো কাজ বাকি নেই।</span>'} <span>শুক্র ও শনিবার কর্মদিবস নয়।</span></p>
      <div class="stack">${lists.map((l) => {
        const late = l.items.filter((x) => x.due && x.due < now).length;
        return `<section class="panel work ${late ? 'late' : ''}" id="work-${l.key}">
          <div class="o-head"><div><b><span aria-hidden="true">${l.icon}</span> <span>${l.title}</span></b><small><span>সময়সীমা</span>: <span>${l.rule}</span></small></div>
            <span class="work-n"><span class="tag">${U.bn(l.items.length)} <span>টি বাকি</span></span>${late ? `<span class="tag bad">${U.bn(late)} <span>টি সময় পেরিয়েছে</span></span>` : ''}</span></div>
          ${l.items.length ? `<ol class="work-list">${l.items.slice(0, 5).map((x) => `<li class="${x.due && x.due < now ? 'late' : ''}"><a href="${x.href}"><span><b>${x.title}</b><small>${x.sub}</small></span>
            <span class="work-when"><small>${x.at ? ago(x.at) : '<span>সময় জানা নেই</span>'}</small>${x.due ? `<small>${x.due < now ? '<b class="danger-txt">সময় পেরিয়েছে</b>' : `<span>শেষ সময়</span> ${U.fmtTime(x.due)}`}</small>` : ''}</span></a></li>`).join('')}</ol>
            ${l.items.length > 5 ? `<a class="more" href="${l.href}"><span>সব দেখুন</span> (${U.bn(l.items.length)}) ›</a>` : ''}` : '<p class="meta">কিছু বাকি নেই ✓</p>'}
        </section>`;
      }).join('')}</div>`;
  }

  /* ---------- a customer's phone and address, in part for the support role ---------- */
  function phoneHtml(phone, key, target) {
    if (!Store.hidesCustomer() || shown.has(key + ':phone')) return `<a href="tel:${U.esc(phone)}" translate="no">${U.bn(U.esc(phone))}</a>`;
    return `<span translate="no">${U.bn(U.esc(Store.maskPhone(phone)))}</span> <button type="button" class="inline" data-team="reveal" data-field="phone" data-key="${U.esc(key)}" data-kind="${target.kind}" data-id="${U.esc(target.id)}">দেখুন</button>`;
  }
  function lineHtml(line, key, target) {
    if (!Store.hidesCustomer() || shown.has(key + ':address')) return U.ud(line);
    return `${U.ud(Store.maskLine(line))} <button type="button" class="inline" data-team="reveal" data-field="address" data-key="${U.esc(key)}" data-kind="${target.kind}" data-id="${U.esc(target.id)}">দেখুন</button>`;
  }
  // a call-back's call button needs the number shown first
  const callHtml = (phone, key, target) => (!Store.hidesCustomer() || shown.has(key + ':phone')
    ? `<a class="btn sm" href="tel:${U.esc(phone)}">📞 ${U.bn(U.esc(phone))}</a>`
    : `<button type="button" class="btn sm" data-team="reveal" data-field="phone" data-key="${U.esc(key)}" data-kind="${target.kind}" data-id="${U.esc(target.id)}">📞 <span translate="no">${U.bn(U.esc(Store.maskPhone(phone)))}</span> · <span>নম্বর দেখুন</span></button>`);

  /* ---------- an order, for support, finance and the division's staff ---------- */
  function orderPage(code) {
    if (!code) {
      return `<a class="back" href="#/admin">‹ কাজের তালিকা</a><h1 class="page-h">অর্ডার খুঁজুন</h1>
        <form id="team-order" class="panel order-find" role="search" novalidate><label class="field"><span>অর্ডার নম্বর</span><input id="to-code" type="text" inputmode="numeric" maxlength="12"></label><button type="submit" class="btn">খুঁজুন</button><small class="err" id="to-err" role="alert"></small></form>`;
    }
    const o = D().orders.find((x) => x.code === code);
    if (!o) return '<a class="back" href="#/admin">‹ কাজের তালিকা</a><div class="empty"><span aria-hidden="true">🔎</span><h3>এই নম্বরে কোনো অর্ডার নেই</h3></div>';
    const s = Store.shopById(o.shopId);
    if (!Store.can('orders', s)) return noPerm();
    const t = Store.placeOfOrder(o);
    const customer = !!o.customerId;
    return `<a class="back" href="#/admin">‹ কাজের তালিকা</a>
      <h1 class="page-h"><span>অর্ডার নম্বর</span> <span translate="no">#${U.bn(o.code)}</span></h1>
      <div class="two">
        <div class="stack">
          <section class="panel"><p><b>${U.ud(o.shopName)}</b> · ${U.geo(s ? s.area : '')}, ${U.geo(s ? s.zila : '')}</p><p class="track-now">${Store.label(o, o.status)}</p>${U.timeline(o)}</section>
          <section class="panel"><h2 class="tight">গ্রাহক</h2>
            <p>👤 ${U.ud(o.recipient.name)}</p>
            ${o.recipient.phone ? `<p>📞 ${customer ? phoneHtml(o.recipient.phone, 'o' + o.code, t) : `<span translate="no">${U.bn(U.esc(o.recipient.phone))}</span>`}</p>` : ''}
            ${o.recipient.line ? `<p>📍 ${customer ? lineHtml(o.recipient.line, 'o' + o.code, t) : U.ud(o.recipient.line)}</p>` : ''}
            ${o.delivery ? `<p>🛵 ${U.ud(o.delivery.name)} · <span translate="no">${U.bn(o.delivery.phone)}</span></p>` : ''}</section>
          ${o.proof ? `<section class="panel proof"><h2 class="tight">📷 ডেলিভারির প্রমাণ</h2>${o.proof.pic ? `<img class="proof-pic" src="${o.proof.pic}" alt="ডেলিভারির সময় তোলা ছবি">` : `<p class="warn"><span>ছবি ছাড়া ডেলিভারি</span>: ${U.ud(o.proof.reason)}</p>${o.proof.seen ? `<p class="meta">✓ <span>দেখেছেন</span>: ${U.ud(o.proof.seen.by)} · ${U.fmtTime(o.proof.seen.at)}</p>` : Store.can('assign', t) ? `<button type="button" class="btn sm" data-team="proof-seen" data-id="${o.code}">✓ দেখেছি</button>` : ''}`}<p class="meta">${U.fmtTime(o.proof.at)}</p></section>` : ''}
        </div>
        <aside class="panel bill"><h2 class="tight">অর্ডারের বিবরণ</h2>
          <ul class="mini">${o.lines.map((l) => `<li><span>${U.bn(l.qty)} × ${U.ud(l.name)}</span><b>${l.price ? U.tk(l.price * l.qty) : 'দাম পরে'}</b></li>`).join('')}</ul>
          ${o.fee ? `<div class="sum"><span>ডেলিভারি চার্জ</span><b>${U.tk(o.fee)}</b></div>` : ''}
          <div class="sum total"><span>মোট</span><b>${U.tk(o.total)}</b></div>
          <p class="meta">${U.payText(o)}</p>
          ${o.refund ? `<p class="note">↩️ ${window.LHCare.refundText(o.refund)}</p>` : ''}
        </aside>
      </div>`;
  }

  /* ---------- the team: people, their role, open or closed ---------- */
  const roleOptions = (sel) => Object.keys(Store.ROLES).map((r) => `<option value="${r}" ${sel === r ? 'selected' : ''}>${Store.ROLES[r]}</option>`).join('');
  const divOptions = (sel) => `<option value="">বিভাগ (শুধু বিভাগীয় স্টাফ)</option>${Object.keys(window.LH_DIV).sort((a, b) => a.localeCompare(b, 'bn')).map((d) => `<option value="${U.esc(d)}" ${sel === d ? 'selected' : ''}>${U.geo(d)}</option>`).join('')}`;
  function teamPage() {
    const me = Store.teamMe();
    return `<a class="back" href="#/admin">‹ কাজের তালিকা</a><h1 class="page-h">টিম</h1>
      <p class="meta gap">প্রত্যেকে নিজের মোবাইল বা ইমেইল ও পাসওয়ার্ড দিয়ে, তারপর কোড দিয়ে ঢোকেন। বন্ধ একাউন্টে লগইন হয় না।</p>
      <div class="stack">${D().team.map((m) => `<article class="panel ad-row team-row ${m.active ? '' : 'off'}" id="tm-${m.id}">
        <div class="o-head"><div><b>${U.ud(m.name)}</b><small><span translate="no">${U.esc(m.contact)}</span> · ${roleText(m)}</small></div><span class="tag ${m.active ? 'ok' : 'bad'}">${m.active ? 'চালু' : 'বন্ধ'}</span></div>
        <p class="meta">${m.last ? `<span>শেষ লগইন</span> ${U.fmtTime(m.last)}` : '<span>এখনো লগইন করেননি</span>'}</p>
        ${m.id === me.id ? '<p class="meta">এটি আপনার নিজের একাউন্ট।</p>' : `<div class="o-acts"><button type="button" class="btn ghost sm" data-team="role" data-id="${m.id}">দায়িত্ব বদলান</button>${m.active ? `<button type="button" class="btn danger sm" data-team="off" data-id="${m.id}">একাউন্ট বন্ধ করুন</button>` : `<button type="button" class="btn sm" data-team="on" data-id="${m.id}">আবার চালু করুন</button>`}</div>`}
      </article>`).join('')}</div>
      <form id="team-add" class="panel gap-t" novalidate>
        <h2 class="tight">+ নতুন সদস্য</h2>
        <label class="field"><span>নাম</span><input id="ta-name" type="text" maxlength="60"></label>
        <label class="field"><span>মোবাইল নম্বর বা ইমেইল</span><input id="ta-contact" type="text" maxlength="80"></label>
        <div class="row2"><label class="field"><span>দায়িত্ব</span><select id="ta-role">${roleOptions('support')}</select></label>
          <label class="field"><span>বিভাগ</span><select id="ta-div">${divOptions('')}</select></label></div>
        <label class="field"><span>প্রথম পাসওয়ার্ড</span><input id="ta-pw" type="text" maxlength="60" autocomplete="off"><small>কমপক্ষে ৮ অক্ষর। নতুন সদস্যকে আলাদাভাবে জানিয়ে দিন।</small></label>
        <small class="err" id="ta-err" role="alert"></small>
        <button type="submit" class="btn block">সদস্য যোগ করুন</button>
      </form>`;
  }
  function roleSheet(id) {
    const m = D().team.find((x) => x.id === id);
    U.openSheet(`<h2 id="sheet-h">দায়িত্ব বদলান</h2><p class="meta">${U.ud(m.name)}</p>
      <form id="team-role" data-id="${id}" novalidate>
        <label class="field"><span>দায়িত্ব</span><select id="tr-role">${roleOptions(m.role)}</select></label>
        <label class="field"><span>বিভাগ</span><select id="tr-div">${divOptions(m.division)}</select></label>
        <small class="err" id="tr-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }
  function offSheet(id, on) {
    const m = D().team.find((x) => x.id === id);
    U.openSheet(`<h2 id="sheet-h">${on ? 'একাউন্ট আবার চালু করবেন?' : 'একাউন্ট বন্ধ করবেন?'}</h2><p class="meta">${U.ud(m.name)}</p>
      <form id="team-active" data-id="${id}" data-on="${on ? '1' : ''}" novalidate>
        <label class="field"><span>${on ? 'নোট (ঐচ্ছিক)' : 'কারণ'}</span><textarea id="tx-why" rows="2" maxlength="300"></textarea></label>
        <small class="err" id="tx-err" role="alert"></small>
        <button type="submit" class="btn block ${on ? '' : 'danger-fill'}">${on ? 'চালু করুন' : 'বন্ধ করুন'}</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">না, থাক</button>`);
  }

  /* ---------- the audit log: read only, filtered by person, action, date and area ---------- */
  const dayOf = (at) => window.LHTime.ymd(at);
  // a value before or after a change, in the page's own digits
  const val = (v) => U.ud(window.LHI18n.lang === 'en' ? String(v) : U.bn(String(v)));
  const changeText = (c) => (c ? `<span class="aud-change">${c.before !== undefined && c.before !== '' ? `<span translate="no">${val(c.before)}</span> → ` : ''}<span translate="no">${val(c.after === undefined ? '' : c.after)}</span></span>` : '');
  function auditRows(list) {
    return list.map((a) => `<li class="aud-row"><div><b>${ACTION[a.action] || U.esc(a.action)}</b><small>${U.fmtTime(a.at)}</small></div>
      <p class="meta"><span>👤</span> ${a.byName ? U.ud(a.byName) : '<span>অজানা</span>'}${a.role ? ` · <span>${Store.ROLES[a.role]}</span>` : ''}${a.kind ? ` · <span>${KIND[a.kind] || ''}</span>: ${a.kind === 'setting' ? `<span>${U.esc(a.name)}</span>` : U.ud(a.name || a.target)}` : ''}${a.zila ? ` · ${U.geo(a.area)}, ${U.geo(a.zila)}` : ''}</p>
      ${a.change ? `<p class="meta">${changeText(a.change)}</p>` : ''}
      ${a.reason ? `<p class="note"><span>কারণ</span>: ${U.ud(a.reason)}</p>` : ''}</li>`).join('');
  }
  function auditPage() {
    const all = D().audit;
    const A = window.LHArea;
    const list = all.filter((a) => (!aud.by || a.by === aud.by) && (!aud.action || a.action === aud.action) && (!aud.from || dayOf(a.at) >= aud.from) && (!aud.to || dayOf(a.at) <= aud.to) && (!A.isOn() || A.inPick(a)));
    return `<a class="back" href="#/admin">‹ কাজের তালিকা</a><h1 class="page-h">অডিট লগ</h1>
      <p class="meta gap">টিমের প্রতিটি কাজ এখানে থাকে। লগ বদলানো বা মোছা যায় না।</p>
      <div class="row2 aud-filter">
        <label class="field"><span>কে</span><select data-aud="by"><option value="">সবাই</option>${D().team.map((m) => `<option value="${m.id}" ${aud.by === m.id ? 'selected' : ''}>${U.ud(m.name)}</option>`).join('')}</select></label>
        <label class="field"><span>কী কাজ</span><select data-aud="action"><option value="">সব কাজ</option>${Object.keys(ACTION).map((k) => `<option value="${k}" ${aud.action === k ? 'selected' : ''}>${ACTION[k]}</option>`).join('')}</select></label>
        <label class="field"><span>তারিখ থেকে</span><input type="date" data-aud="from" value="${aud.from}"></label>
        <label class="field"><span>তারিখ পর্যন্ত</span><input type="date" data-aud="to" value="${aud.to}"></label>
      </div>
      ${A.filterHtml(all.filter((a) => a.zila))}
      <p class="meta"><span>${U.bn(list.length)}</span> <span>টি কাজ</span></p>
      ${list.length ? `<ol class="aud-list">${auditRows(list.slice(0, aud.limit))}</ol>${list.length > aud.limit ? '<button type="button" class="btn ghost block" data-team="more">আরো দেখুন</button>' : ''}` : '<div class="empty"><span aria-hidden="true">📜</span><h3>এই খোঁজে কিছু নেই</h3></div>'}`;
  }
  // a setting's history: who changed what, when, from and to
  function settingHistory() {
    const list = D().audit.filter((a) => a.action === 'setting');
    return `<section class="panel gap-t"><h2 class="tight">পরিবর্তনের ইতিহাস</h2>
      ${list.length ? `<div class="table-wrap"><table class="rep-area set-hist"><thead><tr><th scope="col">কখন</th><th scope="col">কে</th><th scope="col">কী</th><th scope="col">আগে</th><th scope="col">পরে</th></tr></thead>
        <tbody>${list.map((a) => `<tr><td>${U.fmtTime(a.at)}</td><td>${U.ud(a.byName)}</td><td>${U.esc(a.name)}</td><td translate="no">${val(a.change.before)}</td><td translate="no">${val(a.change.after)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="meta">এখনো কিছু বদলানো হয়নি।</p>'}
    </section>`;
  }

  /* ---------- events ---------- */
  function onClick(e) {
    const el = e.target.closest('[data-team]');
    if (!el) return;
    const d = el.dataset;
    try {
      switch (d.team) {
        case 'fill': $('tl-contact').value = d.c; $('tl-pw').value = 'demo1234'; break;
        case 'restart': delete D().sessions.teamPending; Store.save(); U.route(); break;
        case 'logout': Store.teamLogout(); shown.clear(); U.toast('লগ আউট হয়েছে'); location.hash = '#/admin'; U.route(); break;
        case 'reveal': {
          const o = d.kind === 'order' ? D().orders.find((x) => x.code === d.id) : null;
          const t = d.kind === 'ticket' ? Store.data.support.find((x) => x.id === d.id) : null;
          Store.teamReveal(d.field, o ? Store.placeOfOrder(o) : t ? Store.placeOfTicket(t) : { kind: d.kind, id: d.id });
          shown.add(d.key + ':' + d.field);
          U.route(true);
          break;
        }
        case 'role': roleSheet(d.id); break;
        case 'off': offSheet(d.id, false); break;
        case 'on': offSheet(d.id, true); break;
        case 'more': aud.limit += 100; U.route(true); break;
        case 'proof-seen': Store.teamProofSeen(d.id, ''); U.toast('দেখা হয়েছে'); U.route(true); break;
      }
    } catch (ex) { U.toast(ex.message); }
  }
  function onChange(e) {
    const k = e.target.dataset && e.target.dataset.aud;
    if (!k) return;
    aud[k] = e.target.value;
    aud.limit = 100;
    U.route(true);
  }
  function onSubmit(e) {
    const f = e.target;
    const err = (id, ex) => { const b = $(id); if (b) b.textContent = ex.message; };
    if (f.id === 'team-login') {
      e.preventDefault();
      try { Store.teamLogin($('tl-contact').value, $('tl-pw').value); U.route(); } catch (ex) { err('tl-err', ex); }
      return;
    }
    if (f.id === 'team-code') {
      e.preventDefault();
      const digits = String($('tc-code').value).replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c));
      try { Store.teamVerify(digits); window.LHArea.set('all'); U.route(); } catch (ex) { if (D().sessions.teamPending) err('tc-err', ex); else { U.toast(ex.message); U.route(); } }
      return;
    }
    if (f.id === 'team-order') {
      e.preventDefault();
      const code = String($('to-code').value).replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c)).replace(/\D/g, '');
      if (!D().orders.some((o) => o.code === code)) { $('to-err').textContent = 'এই নম্বরে কোনো অর্ডার নেই'; return; }
      location.hash = '#/admin/order/' + code;
      return;
    }
    if (f.id === 'team-add') {
      e.preventDefault();
      try {
        Store.teamAdd({ name: $('ta-name').value, contact: $('ta-contact').value, role: $('ta-role').value, division: $('ta-div').value, pw: $('ta-pw').value });
        U.toast('সদস্য যোগ হয়েছে');
        U.route(true);
      } catch (ex) { err('ta-err', ex); }
      return;
    }
    if (f.id === 'team-role') {
      e.preventDefault();
      try { Store.teamSetRole(f.dataset.id, $('tr-role').value, $('tr-div').value); U.closeSheet(); U.toast('সংরক্ষিত'); U.route(true); } catch (ex) { err('tr-err', ex); }
      return;
    }
    if (f.id === 'team-active') {
      e.preventDefault();
      try { Store.teamSetActive(f.dataset.id, !!f.dataset.on, $('tx-why').value); U.closeSheet(); U.toast(f.dataset.on ? 'একাউন্ট চালু হয়েছে' : 'একাউন্ট বন্ধ হয়েছে'); U.route(true); } catch (ex) { err('tx-err', ex); }
    }
  }
  function init(ui) {
    U = ui;
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('submit', onSubmit);
    // a detail opened in full stays open only on the page it was opened on
    window.addEventListener('hashchange', () => shown.clear());
  }
  return { init, loginPage, dashPage, orderPage, teamPage, auditPage, settingHistory, phoneHtml, callHtml, noPerm, ACTION };
})();

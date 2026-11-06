// Refund requests and support conversations with the LocalHaat team. The admin panel answers both.
// No money moves in the prototype: the team pays by hand and records it here.
window.LHCare = (function () {
  'use strict';
  const Store = window.LHStore;
  let U;
  const $ = (id) => document.getElementById(id);
  const digits = (s) => String(s).replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c));

  /* ---------- refund ---------- */
  function refundText(r) {
    if (r.status === 'paid') return `✓ ${U.tk(r.paid)} ফেরত দেওয়া হয়েছে`;
    if (r.status === 'rejected') return 'রিফান্ড বাতিল হয়েছে';
    // a cancelled order paid online goes back the way it came, without anyone asking
    if (r.auto) return `⏳ <span>${U.tk(r.amount)}</span> <span>অনলাইনে দেওয়া টাকা একই পথে ফেরত যাবে</span>`;
    return `⏳ ${U.tk(r.amount)} <span>রিফান্ডের আবেদন, লোকালহাট টিম ৪৮ ঘণ্টার মধ্যে দেখবে</span>`;
  }
  // on the tracking page, for the customer who placed the order
  function refundPanel(o) {
    const auto = !!(o.refund && o.refund.auto);
    if (!auto && (!Store.isFinished(o) || !o.total)) return '';
    if (!o.refund) return `<button type="button" class="btn ghost block" data-care="refund" data-code="${o.code}">↩️ রিফান্ড চাই</button>`;
    const r = o.refund;
    return `<section class="panel"><h2 class="tight">রিফান্ড</h2>
      <p class="${r.status === 'paid' ? 'good' : r.status === 'rejected' ? 'warn' : 'note'}" role="status">${refundText(r)}</p>
      ${auto ? '' : `<p class="meta gap-t">কারণ: ${U.ud(r.reason)}</p>`}
      ${r.note ? `<p class="meta">লোকালহাট টিম: ${U.ud(r.note)}</p>` : ''}
    </section>`;
  }
  function refundSheet(code) {
    const o = Store.data.orders.find((x) => x.code === code);
    if (!o) return;
    U.openSheet(`<h2 id="sheet-h">রিফান্ড চাই</h2>
      <p class="meta">দোকানে গিয়ে পণ্য ফেরত দিয়ে সেদিনই টাকা নিতে পারেন, অথবা এখানে আবেদন করলে লোকালহাট টিম ৪৮ ঘণ্টার মধ্যে ফেরত দেবে। প্রোটোটাইপে আসল টাকা ফেরত যায় না।</p>
      <form id="refund-form" data-code="${code}" novalidate>
        <label class="field"><span>কত টাকা ফেরত চান (৳)</span><input id="rf-amount" type="text" inputmode="numeric" value="${U.bn(o.total)}"><small>অর্ডারের মোট ${U.tk(o.total)}</small></label>
        <label class="field"><span>কারণ</span><textarea id="rf-reason" rows="3" maxlength="500" placeholder="যেমন: পণ্য নষ্ট ছিল"></textarea></label>
        <label class="field"><span>টাকা নেওয়ার মোবাইল নম্বর (বিকাশ / নগদ)</span><input id="rf-phone" type="tel" inputmode="numeric" value="${U.esc(o.recipient.phone)}" placeholder="01XXXXXXXXX"></label>
        <small class="err" id="rf-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">আবেদন পাঠান</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">না, থাক</button>`);
  }

  /* ---------- support ---------- */
  const ROLES = ['customer', 'owner', 'delivery'];
  const STATUS = { open: 'খোলা', closed: 'বন্ধ' };
  const ticketsOf = (accountId) => Store.data.support.filter((t) => t.accountId === accountId);
  const unreadFor = (accountId) => ticketsOf(accountId).reduce((a, t) => a + Store.ticketUnread(t, 'user'), 0);
  // a "call me back" request and the team's call are the app's own words; the rest is what people wrote
  const msgText = (m) => (m.kind === 'call-ask' ? `📞 আমাকে কল করুন: <span translate="no">${U.bn(U.esc(m.text))}</span>` : m.kind === 'call-done' ? '📞 লোকালহাট টিম আপনাকে কল করেছে।' : U.ud(m.text));
  const subjectOf = (t) => (t.callback ? '📞 কল ব্যাক চাই' : U.ud(t.subject));
  const msgsHtml = (t, viewer) => t.msgs.map((m) => `<li class="msg ${m.by === viewer ? 'mine' : ''}"><p>${msgText(m)}</p><small>${m.by === 'team' && viewer !== 'team' ? 'লোকালহাট টিম · ' : ''}${U.fmtTime(m.at)}</small></li>`).join('');
  // the helpline, when the team has set one, and a "call me back" that works without it
  function callHtml(role, me, orderCode) {
    const hl = Store.data.helpline.phone;
    const waiting = Store.callbacksWaiting().some((t) => t.accountId === me.id);
    const phone = /^01[3-9]\d{8}$/.test(me.contact || '') ? me.contact : '';
    return `<section class="panel help-call">
      <h2 class="tight">📞 কথা বলুন, ২৪ ঘণ্টা</h2>
      ${hl ? `<a class="btn block" href="tel:${U.esc(hl)}"><span>📞 হেল্পলাইনে কল করুন</span> · <span translate="no">${U.bn(U.esc(hl))}</span></a>` : ''}
      ${waiting ? '<p class="note gap-t" role="status">⏳ আপনার কল ব্যাকের অনুরোধ পাঠানো হয়েছে, লোকালহাট টিম কল করবে।</p>'
    : `<form id="callback-form" class="gap-t" data-role="${role}" data-order="${U.esc(orderCode || '')}" novalidate>
        <label class="field"><span>${hl ? 'অথবা টিম আপনাকে কল করবে, এই নম্বরে' : 'লোকালহাট টিম আপনাকে কল করবে, এই নম্বরে'}</span><input id="cb-phone" type="tel" inputmode="numeric" maxlength="14" value="${U.esc(phone)}" placeholder="01XXXXXXXXX"></label>
        <small class="err" id="cb-err" role="alert"></small>
        <button type="submit" class="btn ghost block">📞 আমাকে কল করুন</button>
      </form>`}
    </section>`;
  }
  // the conversation, for the person who asked and for the team
  function threadHtml(t, viewer, head) {
    return `<div class="chat">
      <header class="chat-head">${head}</header>
      <ul class="chat-msgs" id="ticket-msgs" aria-live="polite" data-ticket="${t.id}" data-viewer="${viewer}">${msgsHtml(t, viewer)}</ul>
      <form id="ticket-reply" class="chat-send" data-id="${t.id}" data-by="${viewer}" autocomplete="off" novalidate>
        <input id="ticket-in" type="text" maxlength="1000" placeholder="বার্তা লিখুন" aria-label="বার্তা লিখুন">
        <button type="submit" class="btn" aria-label="পাঠান">পাঠান</button>
      </form>
    </div>`;
  }
  function listPage(role, me, orderCode) {
    const mine = ticketsOf(me.id);
    const orders = role === 'customer' ? Store.data.orders.filter((o) => o.customerId === me.id) : [];
    return `<div class="panel-page">
      <h1 class="page-h">সাপোর্ট</h1>
      ${callHtml(role, me, orderCode)}
      <form id="ticket-new" class="panel" data-role="${role}" novalidate>
        <h2 class="tight">লোকালহাট টিমকে জানান</h2>
        <label class="field"><span>বিষয়</span><input id="tk-subject" type="text" maxlength="80" placeholder="যেমন: অর্ডার পাইনি"></label>
        ${orders.length ? `<label class="field"><span>কোন অর্ডার (ঐচ্ছিক)</span><select id="tk-order"><option value="">কোনো অর্ডার নয়</option>${orders.map((o) => `<option value="${o.code}" ${o.code === orderCode ? 'selected' : ''}>${U.bn(o.code)} · ${U.ud(o.shopName)}</option>`).join('')}</select></label>` : ''}
        <label class="field"><span>কী সমস্যা</span><textarea id="tk-text" rows="3" maxlength="1000"></textarea></label>
        <small class="err" id="tk-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">পাঠান</button>
      </form>
      <h2 class="gap-t">আপনার অনুরোধ</h2>
      ${mine.length ? `<div class="stack">${mine.map((t) => {
        const n = Store.ticketUnread(t, 'user');
        const last = t.msgs[t.msgs.length - 1];
        return `<a class="panel chat-row" href="#/support/${role}/t/${t.id}"><span><b>${subjectOf(t)}</b><small>${last.kind ? msgText(last) : U.ud(last.text.slice(0, 60))}</small></span>${n ? `<span class="pill">${U.bn(n)}</span>` : `<span class="tag">${STATUS[t.status]}</span>`}</a>`;
      }).join('')}</div>` : '<p class="meta">এখনো কোনো অনুরোধ নেই।</p>'}
    </div>`;
  }
  function page(parts) {
    const role = parts[0];
    if (!ROLES.includes(role)) return null;
    const me = window.LHAuth.current(role);
    if (!me) {
      if (role === 'customer') U.setAfter(location.hash);
      location.hash = '#/auth/' + role + '/login';
      return '';
    }
    if (parts[1] === 't') {
      const t = Store.ticketById(parts[2]);
      if (!t || t.accountId !== me.id) return null;
      Store.ticketSeen(t, 'user');
      return `<a class="back" href="#/support/${role}">‹ সব অনুরোধ</a>
        ${threadHtml(t, 'user', `<div><b>${subjectOf(t)}</b><small>লোকালহাট টিম · ${STATUS[t.status]}${t.orderCode ? ` · <span translate="no">${U.bn(t.orderCode)}</span>` : ''}</small></div>`)}
        ${t.status === 'closed' ? '<p class="meta gap-t">এই অনুরোধ বন্ধ হয়েছে। আবার লিখলে খুলে যাবে।</p>' : ''}`;
    }
    return listPage(role, me, parts[1] === 'new' ? parts[2] : '');
  }
  function mount() {
    const box = $('ticket-msgs');
    if (box) box.scrollTop = box.scrollHeight;
  }
  // new messages from another tab; the half-written message stays in the box
  function refresh() {
    const box = $('ticket-msgs');
    if (!box) return false;
    const t = Store.ticketById(box.dataset.ticket);
    if (!t) return false;
    Store.ticketSeen(t, box.dataset.viewer === 'team' ? 'team' : 'user');
    box.innerHTML = msgsHtml(t, box.dataset.viewer);
    box.scrollTop = box.scrollHeight;
    return true;
  }

  /* ---------- events ---------- */
  function onClick(e) {
    const el = e.target.closest('[data-care]');
    if (!el) return;
    if (el.dataset.care === 'refund') refundSheet(el.dataset.code);
  }
  function onSubmit(e) {
    const f = e.target;
    if (f.id === 'refund-form') {
      e.preventDefault();
      const me = window.LHAuth.current('customer');
      const raw = digits($('rf-amount').value).trim();
      try {
        Store.refundAsk(f.dataset.code, me && me.id, { amount: /^\d+$/.test(raw) ? Number(raw) : NaN, reason: $('rf-reason').value, phone: digits($('rf-phone').value).trim().replace(/[\s-]/g, '') });
        U.closeSheet();
        U.toast('আবেদন পাঠানো হয়েছে');
        U.route(true);
      } catch (ex) { $('rf-err').textContent = ex.message; }
    }
    if (f.id === 'callback-form') {
      e.preventDefault();
      const role = f.dataset.role;
      const me = window.LHAuth.current(role);
      try {
        Store.callbackAsk({ role, accountId: me.id, name: me.name, contact: me.contact, orderCode: f.dataset.order, phone: digits($('cb-phone').value).trim().replace(/[\s-]/g, '') });
        U.toast('অনুরোধ পাঠানো হয়েছে, লোকালহাট টিম কল করবে');
        U.route(true);
      } catch (ex) { $('cb-err').textContent = ex.message; $('cb-phone').focus(); }
    }
    if (f.id === 'ticket-new') {
      e.preventDefault();
      const role = f.dataset.role;
      const me = window.LHAuth.current(role);
      try {
        const t = Store.ticketNew({ role, accountId: me.id, name: me.name, contact: me.contact, subject: $('tk-subject').value, text: $('tk-text').value, orderCode: $('tk-order') ? $('tk-order').value : '' });
        location.hash = `#/support/${role}/t/${t.id}`;
      } catch (ex) { $('tk-err').textContent = ex.message; }
    }
    if (f.id === 'ticket-reply') {
      e.preventDefault();
      const box = $('ticket-in');
      if (!box.value.trim()) return;
      try {
        Store.ticketReply(f.dataset.id, f.dataset.by, box.value);
        U.route(true);
        if ($('ticket-in')) $('ticket-in').focus();
      } catch (ex) { U.toast(ex.message); }
    }
  }
  function init(ui) {
    U = ui;
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
  }
  return { init, page, mount, refresh, refundPanel, refundText, threadHtml, unreadFor, STATUS };
})();

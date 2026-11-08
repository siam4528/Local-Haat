// Companies and their brands. A company signs up and the LocalHaat team approves it; then it lists its products with a
// picture, a group, a quantity and the MRP, and sees its report: sales by product and by division, district and upazila,
// and in how many shops each product is. Never who bought; the shops' names only on the team's view.
// Shops pick brand products by group (those of their sub-category first) and LocalHaat's common list, which they price.
// Only the super admin approves companies; verification sees them and their reports. The divisions' staff and the super
// admin keep the common list.
window.LHCompany = (function () {
  'use strict';
  const Store = window.LHStore;
  let U;
  const $ = (id) => document.getElementById(id);
  const D = () => Store.data;
  const digits = (s) => String(s).replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c));
  const ICONS = ['📦', '🍚', '🌾', '🫗', '🧂', '🌶️', '🍵', '🍪', '🥛', '🧼', '🧴', '🧽', '🧺', '🦷', '💊', '🎨', '✏️'];
  let otp = null; // the sign-up code: { contact, code }
  let draft = null; // the product being edited
  let pic; // undefined: unchanged, '': removed, a data URL: a new picture
  let month = ''; // the report's month; empty for the last three months
  let coTab = 'pending';
  let bpGroup = '';
  const picked = new Set(); // brand products ticked in a shop's picker
  const suPicked = new Set(); // ticked at an agent's sign up
  let cmDraft = null;

  const me = () => Store.companyMe();
  const MONTHS = 3;
  const monthName = (m) => window.LHTime.show(window.LHTime.at(m + '-15', '12:00'), { month: 'long', year: 'numeric' }, window.LHI18n.lang);
  const thumb = (b) => U.thumbHtml({ image: b.pic, icon: b.icon });
  const stat = (value, label) => `<div><b>${value}</b><span>${label}</span></div>`;
  const shopsOf = (id) => D().shops.filter((s) => Store.shopLive(s) && s.items.some((it) => it.brand === id)).length;

  function tabs(link) {
    const h = location.hash;
    const c = me();
    if (!c || c.status !== 'ok') return link('#/company', '🏭', 'প্যানেল', true);
    return link('#/company', '📦', 'পণ্য', h === '#/company' || h === '#/company/') + link('#/company/report', '📊', 'রিপোর্ট', h.startsWith('#/company/report'));
  }

  /* ---------- the company's own side ---------- */
  function page(parts) {
    const c = me();
    const p = parts[0] || '';
    if (p === 'signup' && !parts[1]) { if (c) { location.hash = '#/company'; return ''; } return signupPage(); }
    if (!c) { if (p) { location.hash = '#/company'; return ''; } return loginPage(); }
    if (c.status !== 'ok') { if (p) { location.hash = '#/company'; return ''; } return waitPage(c); }
    if (!p) return productsPage(c);
    if (p === 'report' && !parts[1]) return reportPage();
    return null;
  }
  const logout = () => '<button type="button" class="link" data-co="logout">লগ আউট</button>';
  function loginPage() {
    return `<div class="co-wrap"><section class="panel co-card">
      <h1 class="page-h">🏭 কোম্পানি প্যানেল</h1>
      <p class="meta gap">যেসব কোম্পানি নিজের ব্র্যান্ডের পণ্য বানায় বা আমদানি করে, তারা এখানে পণ্য ও MRP দেয়। দোকান সেই পণ্য MRP-তে বিক্রি করে।</p>
      <form id="co-login" novalidate>
        <label class="field"><span>মোবাইল নম্বর বা ইমেইল</span><input id="col-contact" type="text" autocomplete="username" autocapitalize="none" spellcheck="false"></label>
        <label class="field"><span>পাসওয়ার্ড</span><input id="col-pw" type="password" autocomplete="current-password" maxlength="100"></label>
        <small class="err" id="col-err" role="alert"></small>
        <button type="submit" class="btn block">লগইন</button>
        <div class="demo-box"><span>প্রিভিউ ডেমো: <span translate="no">${U.bn('01611000001')}</span> / demo1234। অনুমোদনের অপেক্ষায়: <span translate="no">${U.bn('01611000003')}</span></span>
          <button type="button" class="inline" data-co="demo-fill">পূরণ করুন</button></div>
      </form>
      <p class="linkrow center"><a href="#/company/signup">নতুন কোম্পানি? একাউন্ট খুলুন ›</a></p>
    </section></div>`;
  }
  function otpHtml() {
    if (!otp) return '<button type="button" class="btn ghost block" data-co="otp-send">কোড পাঠান</button>';
    return `<p class="otp-demo" role="status">প্রিভিউ: আসল এসএমএস বা ইমেইল যায় না। আপনার কোড <b>${U.bn(otp.code)}</b></p>
      <label class="field"><span>৬ সংখ্যার কোড</span><input id="cos-code" type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" class="code-in"></label>
      <button type="button" class="inline" data-co="otp-send">আবার পাঠান</button>`;
  }
  function signupPage() {
    return `<div class="co-wrap"><section class="panel co-card">
      <a class="back" href="#/company">‹ লগইনে ফিরে যান</a>
      <h1 class="page-h">কোম্পানি একাউন্ট খুলুন</h1>
      <p class="meta gap">লোকালহাট টিম যাচাই করে অনুমোদন দিলে প্যানেল খুলবে, সাধারণত ২ কর্মদিবসে।</p>
      <form id="co-signup" novalidate>
        <label class="field"><span>কোম্পানির নাম</span><input id="cos-name" type="text" maxlength="80" autocomplete="organization"></label>
        <label class="field"><span>যোগাযোগের মানুষের নাম</span><input id="cos-person" type="text" maxlength="60" autocomplete="name"></label>
        <label class="field"><span>মোবাইল নম্বর বা ইমেইল</span><input id="cos-contact" type="text" autocomplete="username" autocapitalize="none" spellcheck="false"><small>এটাই লগইন আইডি। এখানে একটি কোড যাবে।</small></label>
        <div class="otp" id="cos-otp">${otpHtml()}</div>
        <label class="field"><span>কী কী পণ্য বানান বা আমদানি করেন <i>(ঐচ্ছিক)</i></span><textarea id="cos-about" rows="2" maxlength="300"></textarea></label>
        <label class="field"><span>পাসওয়ার্ড</span><input id="cos-pw" type="password" autocomplete="new-password" maxlength="100"><small>কমপক্ষে ৬ অক্ষর</small></label>
        <label class="field"><span>পাসওয়ার্ড আবার লিখুন</span><input id="cos-pw2" type="password" autocomplete="new-password" maxlength="100"></label>
        <small class="err" id="cos-err" role="alert"></small>
        <button type="submit" class="btn block">একাউন্ট খুলুন</button>
      </form>
    </section></div>`;
  }
  function waitPage(c) {
    if (c.status === 'no') {
      return `<div class="co-wrap"><section class="panel co-card">
        <h1 class="page-h">❌ আবেদন বাতিল হয়েছে</h1><p><b>${U.ud(c.name)}</b></p>
        <p class="note"><span>লোকালহাট টিমের কারণ</span>: ${U.ud(c.reason)}</p>
        <form id="co-again" novalidate>
          <label class="field"><span>কী ঠিক করেছেন, লিখুন</span><textarea id="coa-about" rows="3" maxlength="300">${U.esc(c.about || '')}</textarea></label>
          <small class="err" id="coa-err" role="alert"></small>
          <button type="submit" class="btn block">আবার আবেদন করুন</button>
        </form>${logout()}</section></div>`;
    }
    return `<div class="co-wrap"><section class="panel co-card co-wait">
      <h1 class="page-h">⏳ যাচাই চলছে</h1><p><b>${U.ud(c.name)}</b></p>
      <p class="meta">লোকালহাট টিম আপনার কোম্পানি যাচাই করছে। অনুমোদন হলে এখানে পণ্য যোগ করতে পারবেন।</p>${logout()}</section></div>`;
  }
  function productsPage(c) {
    const list = Store.brandsOf(c.id);
    return `<div class="page-row"><h1 class="page-h">${U.ud(c.name)}</h1><button type="button" class="btn" data-co="new">+ নতুন পণ্য</button></div>
      <p class="meta gap">দোকান আপনার পণ্য MRP-তে বিক্রি করবে, দাম বদলাতে পারবে না; শুধু স্টকে আছে কিনা জানাবে। MRP বদলালে সব দোকানে সাথে সাথে নতুন দাম।</p>
      ${list.length ? `<ul class="items">${list.map((b) => `<li class="item co-item" id="cb-${b.id}">${thumb(b)}
          <div class="item-txt"><b>${U.ud(b.name)}</b><small>${U.ud(b.unit)} · <span>${U.esc(b.group)}</span> · <span>দোকান</span>: ${U.bn(shopsOf(b.id))}</small><span class="price">MRP ${U.tk(b.mrp)}</span></div>
          <div class="own-acts"><button type="button" class="btn ghost sm" data-co="edit" data-id="${b.id}">এডিট</button></div></li>`).join('')}</ul>`
        : '<div class="empty"><span aria-hidden="true">📦</span><h3>এখনো কোনো পণ্য নেই</h3><p>প্রথম পণ্য যোগ করলে দোকানগুলো বেছে নিতে পারবে।</p></div>'}
      ${logout()}`;
  }
  function productSheet(id) {
    const b = id ? Store.brandsOf(me().id).find((x) => x.id === id) : null;
    draft = id || null;
    pic = undefined;
    const icon = b ? b.icon : ICONS[0];
    U.openSheet(`<h2 id="sheet-h">${b ? 'পণ্য এডিট করুন' : 'নতুন পণ্য'}</h2>
      <form id="co-product" novalidate>
        <div class="field"><span class="flabel">পণ্যের ছবি</span><div class="it-upload">
          <div class="it-preview" id="cp-preview">${b && b.pic ? `<img src="${b.pic}" alt="">` : '<span aria-hidden="true">📷</span>'}</div>
          <div class="it-upload-acts"><label class="btn ghost sm upload"><input type="file" class="sr" accept="image/jpeg,image/png,image/webp" data-co-pic>ছবি বাছুন</label>
            <button type="button" class="inline" id="cp-pic-del" data-co="pic-del" ${b && b.pic ? '' : 'hidden'}>ছবি মুছুন</button><small>JPG, PNG বা WebP। বর্গাকারে কাটা হবে।</small></div></div></div>
        <label class="field"><span>পণ্যের নাম (ব্র্যান্ডসহ)</span><input id="cp-name" type="text" maxlength="80" value="${U.esc(b ? b.name : '')}"></label>
        <label class="field"><span>গ্রুপ</span><select id="cp-group"><option value="">বেছে নিন</option>${Object.keys(Store.BRAND_GROUPS).map((g) => `<option value="${U.esc(g)}" ${b && b.group === g ? 'selected' : ''}>${U.esc(g)}</option>`).join('')}</select></label>
        <div class="row2">
          <label class="field"><span>পরিমাণ</span><input id="cp-unit" type="text" maxlength="30" value="${U.esc(b ? b.unit : '')}" placeholder="যেমন ১ লিটার"></label>
          <label class="field"><span>MRP (৳)</span><input id="cp-mrp" type="text" inputmode="numeric" value="${b ? U.bn(b.mrp) : ''}" placeholder="০"></label>
        </div>
        ${b && b.mrpLog && b.mrpLog.length ? `<p class="meta"><span>আগের MRP</span>: ${b.mrpLog.slice(-3).map((x) => `${U.tk(x.from)} (${U.fmtTime(x.at)})`).join(', ')}</p>` : ''}
        <fieldset class="field fs"><legend>ছবি না থাকলে আইকন</legend><div class="icon-pick">${ICONS.concat(ICONS.includes(icon) ? [] : [icon]).map((ic) => `<label><input type="radio" name="cp-icon" value="${ic}" ${ic === icon ? 'checked' : ''}><span>${ic}</span></label>`).join('')}</div></fieldset>
        <small class="err" id="cp-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }

  /* ---------- the report, for the company and for the team ---------- */
  function monthChips(attr) {
    const chip = (m, label) => `<button type="button" class="chip ${month === m ? 'on' : ''}" aria-pressed="${month === m}" ${attr}="${m}">${label}</button>`;
    return `<div class="chips" role="group" aria-label="সময়">${chip('', 'শেষ ৩ মাস')}${Store.salesMonths(MONTHS).map((m) => chip(m, monthName(m))).join('')}</div>`;
  }
  function placeList(title, rows) {
    const top = Math.max(1, ...rows.map((r) => r.sales));
    return `<section class="panel co-place"><h2 class="tight">${title}</h2>${rows.length ? `<ul class="co-bars">${rows.map((r) => `<li><span class="co-bar-name">${r.label}</span>
        <span class="co-bar"><i style="width:${Math.max(4, Math.round((r.sales * 100) / top))}%"></i></span><b>${U.tk(r.sales)}</b><small><span>বিক্রি হয়েছে</span>: ${U.bn(r.qty)}</small></li>`).join('')}</ul>` : '<p class="meta">এই সময়ে বিক্রি নেই</p>'}</section>`;
  }
  // division, district and upazila, each with its own total
  function places(r) {
    const by = (key, label) => {
      const out = {};
      r.places.forEach((p) => { const k = key(p); const x = out[k] || (out[k] = { label: label(p), qty: 0, sales: 0 }); x.qty += p.qty; x.sales += p.sales; });
      return Object.values(out).sort((a, b) => b.sales - a.sales);
    };
    return placeList('বিভাগ অনুযায়ী', by((p) => p.div, (p) => (p.div ? `${U.geo(p.div)} <span>বিভাগ</span>` : '<span>জানা নেই</span>'))) +
      placeList('জেলা অনুযায়ী', by((p) => p.zila, (p) => (p.zila ? U.geo(p.zila) : '<span>জানা নেই</span>'))) +
      placeList('উপজেলা / থানা অনুযায়ী', by((p) => p.zila + '|' + p.area, (p) => `${U.geo(p.area)}${p.zila ? ', ' + U.geo(p.zila) : ''}`));
  }
  function reportHtml(r, forTeam) {
    return `${monthChips(forTeam ? 'data-co-tmonth' : 'data-co-month')}
      <div class="stats rep-stats">${stat(U.tk(r.sales), 'মোট বিক্রি')}${stat(U.bn(r.qty), 'কয়টি বিক্রি হয়েছে')}${stat(U.bn(r.products.length), 'পণ্য')}${stat(U.bn(r.products.filter((p) => p.shops).length), 'দোকানে আছে এমন পণ্য')}</div>
      ${r.demo ? '<p class="meta">ডেমো: আগের দিনগুলোর বিক্রি প্রোটোটাইপের নমুনা তথ্য, নতুন অর্ডার তার সাথে যোগ হয়।</p>' : ''}
      <p class="meta">🔒 ক্রেতার নাম, ফোন বা ঠিকানা এই রিপোর্টে নেই।${forTeam ? '' : ' দোকানের নাম লোকালহাট টিম দেখে; আপনি দেখবেন কয়টি দোকানে আছে।'}</p>
      <h2 class="page-h gap-t">পণ্য অনুযায়ী</h2>
      ${r.products.length ? `<ul class="items">${r.products.map((p) => `<li class="item co-rep" id="cr-${p.id}">${thumb(p)}
          <div class="item-txt"><b>${U.ud(p.name)}</b><small>${U.ud(p.unit)} · MRP ${U.tk(p.mrp)}</small>
            <small><span>বিক্রি হয়েছে</span>: ${U.bn(p.qty)} · ${U.tk(p.sales)}</small>
            <small><span>দোকান</span>: ${U.bn(p.shops)} · <span>স্টকে আছে</span>: ${U.bn(p.inStock)}</small>
            ${forTeam && p.shopList.length ? `<details class="co-shops"><summary>দোকানগুলো</summary><ul>${p.shopList.map((s) => `<li><a href="#/shop/${s.id}">${U.ud(s.name)}</a> <small>${U.geo(s.area)}, ${U.geo(s.zila)}</small>${s.inStock ? '' : ' <span class="tag bad">স্টক নেই</span>'}</li>`).join('')}</ul></details>` : ''}
          </div></li>`).join('')}</ul>` : '<p class="meta">এখনো কোনো পণ্য নেই</p>'}
      <h2 class="page-h gap-t">এলাকা অনুযায়ী</h2>
      ${places(r)}`;
  }
  function reportPage() {
    const r = Store.companyReport(month);
    return `<h1 class="page-h">📊 বিক্রির রিপোর্ট</h1><p class="meta gap">লোকালহাটে সম্পন্ন অর্ডার থেকে, ফেরত দেওয়া বাদে</p>${reportHtml(r, false)}${logout()}`;
  }

  /* ---------- the team: approving companies, and the common list ---------- */
  const STATUS = { pending: '⏳ অনুমোদনের অপেক্ষায়', ok: '✓ অনুমোদিত', no: 'বাতিল হয়েছে' };
  function adminCompanies(id) {
    if (id) return adminCompany(id);
    const all = D().companies || [];
    const chip = (k) => `<button type="button" class="chip ${coTab === k ? 'on' : ''}" aria-pressed="${coTab === k}" data-co="co-tab" data-id="${k}">${STATUS[k]} (${U.bn(all.filter((c) => c.status === k).length)})</button>`;
    const list = all.filter((c) => c.status === coTab);
    const decide = Store.can('company.decide');
    return `<a class="back" href="#/admin">‹ কাজের তালিকা</a><h1 class="page-h">🏭 কোম্পানি</h1>
      <div class="chips" role="group" aria-label="অবস্থা">${['pending', 'ok', 'no'].map(chip).join('')}</div>
      ${list.length ? `<div class="stack">${list.map((c) => `<article class="panel co-team" id="co-${c.id}">
          <div class="o-head"><div><b>${U.ud(c.name)}</b><small>${U.ud(c.person)} · <span translate="no">${U.bn(U.esc(c.contact))}</span></small></div><span class="tag ${c.status === 'ok' ? 'ok' : c.status === 'no' ? 'bad' : 'warn'}">${STATUS[c.status]}</span></div>
          ${c.about ? `<p class="meta">${U.ud(c.about)}</p>` : ''}
          <p class="meta"><span>আবেদন</span>: ${U.fmtTime(c.at)}${c.decided ? ` · <span>সিদ্ধান্ত</span>: ${U.ud(c.decided.byName)}, ${U.fmtTime(c.decided.at)}` : ''}</p>
          ${c.status === 'no' ? `<p class="note"><span>কারণ</span>: ${U.ud(c.reason)}</p>` : ''}
          <div class="o-acts">${c.status === 'pending' ? (decide ? `<button type="button" class="btn sm" data-co="co-ok" data-id="${c.id}">✓ অনুমোদন দিন</button><button type="button" class="btn ghost sm" data-co="co-no" data-id="${c.id}">বাতিল করুন</button>` : '<p class="meta co-super"><span aria-hidden="true">🔒</span> সুপার অ্যাডমিন অনুমোদন দেবেন</p>') : ''}
            ${c.status === 'ok' ? `<a class="btn ghost sm" href="#/admin/companies/${c.id}">📊 <span>রিপোর্ট ও দোকান</span> (${U.bn(Store.brandsOf(c.id).length)} <span>পণ্য</span>)</a>` : ''}</div>
        </article>`).join('')}</div>` : '<div class="empty"><span aria-hidden="true">🏭</span><h3>এখানে কোনো কোম্পানি নেই</h3></div>'}`;
  }
  function adminCompany(id) {
    const c = Store.companyById(id);
    if (!c) return null;
    const r = Store.teamCompanyReport(id, month);
    return `<a class="back" href="#/admin/companies">‹ সব কোম্পানি</a><h1 class="page-h">📊 ${U.ud(c.name)}</h1>
      <p class="meta gap">শুধু লোকালহাট টিম দোকানের নাম দেখে; কোম্পানি দেখে কয়টি দোকানে আছে।</p>${reportHtml(r, true)}`;
  }
  const allSubs = () => [...new Set(window.LH.cats.flatMap((c) => c.examples))];
  function adminCommon() {
    const list = D().common || [];
    const subs = [...new Set(list.map((x) => x.sub))];
    return `<a class="back" href="#/admin">‹ কাজের তালিকা</a>
      <div class="page-row"><h1 class="page-h">📋 কমন তালিকা</h1><button type="button" class="btn" data-co="cm-new">+ নতুন</button></div>
      <p class="meta gap">সাব-ক্যাটাগরি অনুযায়ী সাধারণ পণ্য ও সেবা। দোকান এখান থেকে বেছে নিজের দাম দেয়। প্রতিটি বদল অডিট লগে থাকে; আগে যোগ করা দোকানের পণ্য বদলায় না।</p>
      ${subs.map((sub) => `<section class="panel cm-group"><h2 class="tight">${U.esc(sub)}</h2><ul class="cm-list">${list.filter((x) => x.sub === sub).map((x) => `<li id="cm-${x.id}"><span aria-hidden="true">${x.icon}</span><span class="cm-name"><b>${U.esc(x.name)}</b><small>${U.esc(x.unit)}</small></span>
          <button type="button" class="btn ghost sm" data-co="cm-edit" data-id="${x.id}">এডিট</button><button type="button" class="btn danger sm" data-co="cm-del" data-id="${x.id}">মুছুন</button></li>`).join('')}</ul></section>`).join('') || '<div class="empty"><span aria-hidden="true">📋</span><h3>তালিকা খালি</h3></div>'}`;
  }
  function commonSheet(id) {
    const x = id ? D().common.find((y) => y.id === id) : null;
    cmDraft = id || null;
    const icon = x ? x.icon : ICONS[0];
    U.openSheet(`<h2 id="sheet-h">${x ? 'কমন তালিকা এডিট' : 'কমন তালিকায় নতুন'}</h2>
      <form id="cm-form" novalidate>
        <label class="field"><span>সাব-ক্যাটাগরি</span><select id="cmf-sub"><option value="">বেছে নিন</option>${allSubs().map((s) => `<option value="${U.esc(s)}" ${x && x.sub === s ? 'selected' : ''}>${U.esc(s)}</option>`).join('')}</select></label>
        <label class="field"><span>নাম</span><input id="cmf-name" type="text" maxlength="60" value="${U.esc(x ? x.name : '')}"></label>
        <label class="field"><span>একক</span><input id="cmf-unit" type="text" maxlength="30" value="${U.esc(x ? x.unit : '')}" placeholder="যেমন ১ কেজি"></label>
        <fieldset class="field fs"><legend>আইকন</legend><div class="icon-pick">${ICONS.concat(ICONS.includes(icon) ? [] : [icon]).map((ic) => `<label><input type="radio" name="cmf-icon" value="${ic}" ${ic === icon ? 'checked' : ''}><span>${ic}</span></label>`).join('')}</div></fieldset>
        <small class="err" id="cmf-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }
  function reasonSheet(kind, id, title, text, go) {
    U.openSheet(`<h2 id="sheet-h">${title}</h2><p class="meta">${text}</p>
      <form id="co-reason" data-kind="${kind}" data-id="${U.esc(id)}" novalidate>
        <label class="field"><span>কারণ (কমপক্ষে ৫ অক্ষর)</span><textarea id="cor-why" rows="3" maxlength="300"></textarea></label>
        <small class="err" id="cor-err" role="alert"></small>
        <button type="submit" class="btn danger block sheet-go">${go}</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }

  /* ---------- a shop's pickers: brand products and the common list ---------- */
  function ownerSeg(s, on) {
    const brand = s.kind === 'shop';
    const common = Store.commonFor(s).length > 0;
    if (!brand && !common) return '';
    const a = (href, key, label) => `<a href="${href}" class="${on === key ? 'on' : ''}" ${on === key ? 'aria-current="page"' : ''}>${label}</a>`;
    return `<nav class="seg ${brand && common ? 'three' : ''} own-seg" aria-label="তালিকা">${a('#/owner/items', '', s.kind === 'service' ? 'নিজের সেবা' : 'নিজের পণ্য')}${brand ? a('#/owner/items/brand', 'brand', '🏷️ ব্র্যান্ডের পণ্য') : ''}${common ? a('#/owner/items/common', 'common', '📋 কমন তালিকা') : ''}</nav>`;
  }
  function brandPage(s) {
    const all = Store.brandChoices(s);
    const recs = all.filter((x) => x.rec);
    const groups = [...new Set(all.map((x) => x.b.group))];
    const g = bpGroup === 'all' || groups.includes(bpGroup) ? bpGroup : recs.length ? 'rec' : 'all';
    const list = all.filter((x) => (g === 'all' ? true : g === 'rec' ? x.rec : x.b.group === g));
    const chip = (k, label) => `<button type="button" class="chip ${g === k ? 'on' : ''}" aria-pressed="${g === k}" data-co="bp-group" data-id="${U.esc(k)}">${label}</button>`;
    return `${ownerSeg(s, 'brand')}<h1 class="page-h">ব্র্যান্ডের পণ্য</h1>
      <p class="meta gap">কোম্পানির দেওয়া MRP-তে বিক্রি হবে, দাম বদলানো যাবে না। আপনি শুধু স্টকে আছে কিনা জানাবেন।</p>
      <label class="field"><span class="sr">ব্র্যান্ড বা পণ্যের নাম খুঁজুন</span><input id="bp-q" type="search" placeholder="ব্র্যান্ড বা পণ্যের নাম খুঁজুন" autocomplete="off"></label>
      <div class="chips" role="group" aria-label="গ্রুপ">${recs.length ? chip('rec', '⭐ আপনার জন্য') : ''}${chip('all', 'সব')}${groups.map((x) => chip(x, U.esc(x))).join('')}</div>
      ${list.length ? `<ul class="items" id="bp-list">${list.map((x) => `<li class="item bp-item" data-name="${U.esc((x.b.name + ' ' + x.company).toLowerCase())}">
          <label class="bp-row">${x.has ? '<span class="tag ok">✓ আছে</span>' : `<input type="checkbox" data-bp="${x.b.id}" ${picked.has(x.b.id) ? 'checked' : ''}>`}
            ${thumb(x.b)}<span class="item-txt"><b>${U.ud(x.b.name)}</b><small>${U.ud(x.b.unit)} · ${U.ud(x.company)}</small><span class="price">MRP ${U.tk(x.b.mrp)}</span></span></label></li>`).join('')}</ul>`
        : '<div class="empty"><span aria-hidden="true">🏷️</span><h3>এই গ্রুপে কোনো পণ্য নেই</h3></div>'}
      <small class="err" id="bp-err" role="alert"></small>
      <button type="button" class="btn block gap-t" data-co="bp-add">বেছে নেওয়া পণ্য যোগ করুন</button>`;
  }
  function commonPage(s) {
    const list = Store.commonFor(s);
    return `${ownerSeg(s, 'common')}<h1 class="page-h">কমন তালিকা</h1>
      <p class="meta gap">লোকালহাটের তালিকা থেকে বেছে নিন, দাম আপনি দেবেন। যোগ করার পর নিজের পণ্যের মতো এডিট করা যাবে।</p>
      ${list.length ? `<ul class="items">${list.map(({ x, has }) => `<li class="item cm-row">
          <label class="bp-row">${has ? '<span class="tag ok">✓ আছে</span>' : `<input type="checkbox" data-cm="${x.id}">`}<span class="thumb" aria-hidden="true">${x.icon}</span>
            <span class="item-txt"><b>${U.esc(x.name)}</b><small>${U.esc(x.unit)} · ${U.esc(x.sub)}</small></span></label>
          ${has ? '' : `<label class="cm-price"><span class="sr">দাম (৳)</span><input id="cm-p-${x.id}" data-cm-price="${x.id}" type="text" inputmode="numeric" placeholder="দাম ৳"></label>`}</li>`).join('')}</ul>`
        : '<div class="empty"><span aria-hidden="true">📋</span><h3>আপনার সাব-ক্যাটাগরির তালিকা এখনো নেই</h3></div>'}
      <small class="err" id="cm-err" role="alert"></small>
      ${list.some((x) => !x.has) ? '<button type="button" class="btn block gap-t" data-co="cm-add">বেছে নেওয়া পণ্য যোগ করুন</button>' : ''}`;
  }
  // the last step of an agent's sign up: the brand products of the chosen sub-category
  function signupPicks(sub, kind) {
    if (kind !== 'shop' || !sub) return '';
    const list = Store.brandChoices(null, sub).filter((x) => x.rec).slice(0, 12);
    if (!list.length) return '';
    return `<fieldset class="field fs su-brands"><legend>🏷️ ব্র্যান্ডের পণ্য বেছে নিন <i>(ঐচ্ছিক)</i></legend>
      <small>আপনার সাব-ক্যাটাগরির জন্য। MRP-তে বিক্রি হবে, পরে প্যানেল থেকে আরও যোগ করা যাবে।</small>
      <ul class="su-list">${list.map((x) => `<li><label class="chk"><input type="checkbox" data-su-brand="${x.b.id}" ${suPicked.has(x.b.id) ? 'checked' : ''}><span><span aria-hidden="true">${x.b.icon}</span> ${U.ud(x.b.name)} <small>${U.ud(x.b.unit)} · MRP ${U.tk(x.b.mrp)}</small></span></label></li>`).join('')}</ul></fieldset>`;
  }
  const signupTaken = () => { const out = [...suPicked]; suPicked.clear(); return out; };

  /* ---------- events ---------- */
  const shop = () => { const m = window.LHAuth.current('owner'); return m && Store.shopById(m.shopId); };
  const normContact = (v) => digits(String(v || '')).trim().toLowerCase();
  const isContact = (c) => /^01[3-9]\d{8}$/.test(c) || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(c);
  function onClick(e) {
    const el = e.target.closest('[data-co]');
    if (!el) return;
    const d = el.dataset;
    try {
      switch (d.co) {
        case 'logout': Store.companyLogout(); location.hash = '#/company'; break;
        case 'demo-fill': $('col-contact').value = '01611000001'; $('col-pw').value = 'demo1234'; break;
        case 'otp-send': {
          const c = normContact($('cos-contact').value);
          if (!isContact(c)) { $('cos-err').textContent = 'মোবাইল নম্বর বা ইমেইল ঠিক করে দিন'; $('cos-contact').focus(); break; }
          otp = { contact: c, code: String(Math.floor(100000 + Math.random() * 900000)) };
          $('cos-err').textContent = '';
          $('cos-otp').innerHTML = otpHtml();
          $('cos-code').focus();
          break;
        }
        case 'new': productSheet(null); break;
        case 'edit': productSheet(d.id); break;
        case 'pic-del': pic = ''; $('cp-preview').innerHTML = '<span aria-hidden="true">📷</span>'; el.hidden = true; break;
        case 'co-tab': coTab = d.id; U.route(true); break;
        case 'co-ok': Store.companyDecide(d.id, true); U.toast('অনুমোদন হয়েছে, কোম্পানির প্যানেল খুলেছে'); U.route(true); break;
        case 'co-no': reasonSheet('co-no', d.id, 'আবেদন বাতিল করবেন?', 'কোম্পানি কারণ দেখবে এবং ঠিক করে আবার আবেদন করতে পারবে।', 'বাতিল করুন'); break;
        case 'cm-new': commonSheet(null); break;
        case 'cm-edit': commonSheet(d.id); break;
        case 'cm-del': reasonSheet('cm-del', d.id, 'তালিকা থেকে মুছবেন?', 'যেসব দোকান আগে যোগ করেছে, তাদের পণ্য থেকে যাবে। কারণ অডিট লগে থাকবে।', 'মুছুন'); break;
        case 'bp-group': bpGroup = d.id; U.route(true); break;
        case 'bp-add': {
          const s = shop();
          const n = Store.addBrands(s.id, [...picked]);
          picked.clear();
          U.toast(`${U.bn(n)} টি পণ্য যোগ হয়েছে`);
          location.hash = '#/owner/items';
          break;
        }
        case 'cm-add': {
          const s = shop();
          const rows = [...document.querySelectorAll('[data-cm]:checked')].map((x) => ({ id: x.dataset.cm, price: Number(digits($('cm-p-' + x.dataset.cm).value).trim() || NaN) }));
          try {
            const n = Store.addCommon(s.id, rows);
            U.toast(`${U.bn(n)} টি পণ্য যোগ হয়েছে`);
            location.hash = '#/owner/items';
          } catch (ex) { $('cm-err').textContent = ex.message; }
          break;
        }
      }
    } catch (ex) {
      const box = d.co === 'bp-add' ? $('bp-err') : null;
      if (box) box.textContent = ex.message; else { if (document.querySelector('.sheet')) U.closeSheet(); U.toast(ex.message); }
    }
  }
  function onChange(e) {
    const t = e.target;
    if (t.dataset.bp) { if (t.checked) picked.add(t.dataset.bp); else picked.delete(t.dataset.bp); return; }
    if (t.dataset.suBrand) { if (t.checked) suPicked.add(t.dataset.suBrand); else suPicked.delete(t.dataset.suBrand); return; }
    if (t.dataset.coPic !== undefined && t.files && t.files[0]) {
      window.LHImage.read(t.files[0], 'item').then((url) => {
        pic = url;
        $('cp-preview').innerHTML = `<img src="${url}" alt="">`;
        $('cp-pic-del').hidden = false;
        $('cp-err').textContent = '';
      }).catch((ex) => { $('cp-err').textContent = ex.message; });
    }
  }
  function onInput(e) {
    const t = e.target;
    if (t.id === 'bp-q') { const q = t.value.trim().toLowerCase(); document.querySelectorAll('#bp-list li').forEach((li) => { li.hidden = !!q && !li.dataset.name.includes(q); }); }
    // a price typed in ticks its row
    if (t.dataset && t.dataset.cmPrice) { const box = document.querySelector(`[data-cm="${t.dataset.cmPrice}"]`); if (box) box.checked = !!t.value.trim(); }
  }
  function onClickMonth(e) {
    const m = e.target.closest('[data-co-month],[data-co-tmonth]');
    if (!m) return;
    month = m.dataset.coMonth !== undefined ? m.dataset.coMonth : m.dataset.coTmonth;
    U.route(true);
  }
  function onSubmit(e) {
    const f = e.target;
    const go = (fn, err) => { e.preventDefault(); try { fn(); } catch (ex) { $(err).textContent = ex.message; } };
    if (f.id === 'co-login') go(() => { Store.companyLogin(normContact($('col-contact').value), $('col-pw').value); U.toast('স্বাগতম'); location.hash = '#/company'; U.route(); }, 'col-err');
    else if (f.id === 'co-signup') {
      go(() => {
        const contact = normContact($('cos-contact').value);
        if (!otp || otp.contact !== contact) throw new Error('আগে কোড পাঠিয়ে যাচাই করুন');
        if (digits($('cos-code').value).trim() !== otp.code) throw new Error('কোড মেলেনি, আবার দেখে লিখুন');
        if ($('cos-pw').value !== $('cos-pw2').value) throw new Error('দুইবারের পাসওয়ার্ড মেলেনি');
        Store.companySignup({ name: $('cos-name').value, person: $('cos-person').value, contact, about: $('cos-about').value, pw: $('cos-pw').value });
        otp = null;
        U.toast('আবেদন জমা হয়েছে, লোকালহাট টিম যাচাই করবে');
        location.hash = '#/company';
        U.route();
      }, 'cos-err');
    } else if (f.id === 'co-again') go(() => { Store.companyAgain($('coa-about').value); U.toast('আবার আবেদন জমা হয়েছে'); U.route(true); }, 'coa-err');
    else if (f.id === 'co-product') {
      go(() => {
        const old = draft ? Store.brandsOf(me().id).find((x) => x.id === draft) : null;
        const was = old ? old.mrp : 0;
        const mrp = Number(digits($('cp-mrp').value).trim() || NaN);
        Store.brandSave(draft, { name: $('cp-name').value, group: $('cp-group').value, unit: $('cp-unit').value, mrp, icon: f.elements['cp-icon'].value, pic: pic === undefined ? (old ? old.pic : '') : pic });
        U.closeSheet();
        U.toast(old && was !== mrp ? 'সংরক্ষিত, সব দোকানে নতুন দাম' : 'সংরক্ষিত');
        U.route(true);
      }, 'cp-err');
    } else if (f.id === 'cm-form') {
      go(() => {
        Store.commonSave(cmDraft, { sub: $('cmf-sub').value, name: $('cmf-name').value, unit: $('cmf-unit').value, icon: f.elements['cmf-icon'].value });
        U.closeSheet();
        U.toast('সংরক্ষিত');
        U.route(true);
      }, 'cmf-err');
    } else if (f.id === 'co-reason') {
      go(() => {
        if (f.dataset.kind === 'co-no') Store.companyDecide(f.dataset.id, false, $('cor-why').value);
        else Store.commonDelete(f.dataset.id, $('cor-why').value);
        U.closeSheet();
        U.toast(f.dataset.kind === 'co-no' ? 'বাতিল হয়েছে' : 'মুছে ফেলা হয়েছে');
        U.route(true);
      }, 'cor-err');
    }
  }
  function init(ui) {
    U = ui;
    document.addEventListener('click', onClick);
    document.addEventListener('click', onClickMonth);
    document.addEventListener('change', onChange);
    document.addEventListener('input', onInput);
    document.addEventListener('submit', onSubmit);
  }
  return { init, page, tabs, adminCompanies, adminCommon, ownerSeg, brandPage, commonPage, signupPicks, signupTaken };
})();

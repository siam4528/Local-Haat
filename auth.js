// Sign in / sign up forms for the preview. Fields and limits mirror server.js (/api/user/*, /api/owner/*).
// Delivery accounts have no server API yet. Nothing leaves this browser: accounts live in localStorage (see store.js).
window.LHAuth = (function () {
  'use strict';
  let H; // helpers from app.js: esc, bn, toast, route
  const $ = (id) => document.getElementById(id);

  const ROLES = {
    customer: { label: 'ইউজার', icon: '🛍️', title: 'ইউজার একাউন্ট', sub: 'বাজার করুন নিজের এবং পরিবারের জন্য',
      points: ['মা-বাবা ও আত্মীয়ের ঠিকানা সেভ করুন', 'অর্ডারের ইতিহাস ও ট্র্যাকিং', 'দোকানের সাথে সরাসরি চ্যাট'] },
    owner: { label: 'এজেন্ট', icon: '🏪', title: 'লোকালহাট এজেন্ট', sub: 'আপনার ব্যবসা আনুন এলাকার মানুষের ফোনে',
      points: ['পণ্য বা সেবার তালিকা নিজেই সাজান', 'অর্ডার এলেই এসএমএস', 'ট্রেড লাইসেন্স দিয়ে যাচাইকৃত ব্যাজ'] },
    delivery: { label: 'ডেলিভারি ম্যান', icon: '🛵', title: 'ডেলিভারি ম্যান', sub: 'এলাকার দোকানের ডেলিভারি করুন',
      points: ['আপনার এলাকার অর্ডার অটোমেটিক আসবে', 'ঠিকানা ও ফোন এসএমএসে পাবেন', 'এক জায়গায় সব ডেলিভারি'] }
  };
  const COUNTRIES = [['BD', '880'], ['IN', '91'], ['PK', '92'], ['NP', '977'], ['AE', '971'], ['SA', '966'], ['QA', '974'], ['KW', '965'], ['OM', '968'], ['MY', '60'], ['SG', '65'], ['GB', '44'], ['US', '1'], ['IT', '39']];
  // a van or a pickup also carries the big items; a motorcycle or a pickup needs a driving licence
  const VEHICLES = ['পায়ে হেঁটে', 'সাইকেল', 'মোটরসাইকেল', 'ভ্যান / রিকশা', 'পিকআপ'];

  const Store = window.LHStore;
  const DEMO_PW = 'demo1234';
  const accounts = () => Store.data.accounts;
  let me = null;
  let d = {}; // draft of the open form
  let errs = {};
  let formKey = '';
  let wizard = 0;
  let otp = null;
  let timer = null;

  const digits = (s) => String(s).replace(/[০-৯]/g, (c) => '০১২৩৪৫৬৭৮৯'.indexOf(c));
  const isEmail = (v) => /^[a-z0-9._%+-]{1,64}@[a-z0-9.-]{1,190}\.[a-z]{2,24}$/i.test(v) && !v.includes('..');
  const looksEmail = (v) => /[@a-zA-Z]/.test(v);
  const bdPhone = (v) => {
    const m = digits(v).replace(/[\s\-()]/g, '').match(/^(?:\+?88)?0?(1[3-9]\d{8})$/);
    return m ? '0' + m[1] : null;
  };
  function normContact(v, cc, bdOnly) {
    const t = digits(v).trim();
    if (!t) return null;
    if (looksEmail(t)) return isEmail(t) ? t.toLowerCase() : null;
    if (bdOnly || !cc || cc === '880') return bdPhone(t);
    const n = t.replace(/[\s\-()+]/g, '').replace(/^0+/, '');
    return /^\d{6,15}$/.test(n) ? '+' + cc + n : null;
  }
  const handleOk = (h) => /^[a-z0-9][a-z0-9._]{2,19}$/.test(h);
  function suggestHandle() {
    const clean = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const parts = [clean(d.first), clean(d.last)].filter(Boolean);
    return parts.length ? parts.join('.').slice(0, 20) : '';
  }

  /* ---------- small builders ---------- */
  function err(k) { return errs[k] ? `<small class="err" id="e-${k}">${H.esc(errs[k])}</small>` : ''; }
  function attrs(k) { return `id="f-${k}" data-f="${k}" ${errs[k] ? `aria-invalid="true" aria-describedby="e-${k}"` : ''}`; }
  function input(k, label, o) {
    o = o || {};
    return `<label class="field ${o.wrap || ''}" ${o.hidden ? 'hidden' : ''}><span>${label}${o.optional ? ' <i>(ঐচ্ছিক)</i>' : ''}</span>
      <input ${attrs(k)} type="${o.type || 'text'}" value="${H.esc(d[k] || '')}" ${o.ph ? `placeholder="${o.ph}"` : ''} ${o.ac ? `autocomplete="${o.ac}"` : ''} ${o.mode ? `inputmode="${o.mode}"` : ''} ${o.max ? `maxlength="${o.max}"` : ''} ${o.raw || ''}>
      ${o.hint ? `<small>${o.hint}</small>` : ''}${err(k)}</label>`;
  }
  function password(k, label, ac, hint) {
    return `<div class="field"><label for="f-${k}"><span>${label}</span></label>
      <div class="pw"><input ${attrs(k)} type="password" value="${H.esc(d[k] || '')}" autocomplete="${ac}" maxlength="100">
      <button type="button" data-auth="pw-toggle" data-for="f-${k}" aria-pressed="false" aria-label="${label} দেখান">দেখান</button></div>
      ${hint ? `<small>${hint}</small>` : ''}${err(k)}</div>`;
  }
  function contactField(role, label, hint, allowHandle) {
    if (role === 'delivery') return input('contact', 'মোবাইল নম্বর', { type: 'tel', mode: 'numeric', ph: '01XXXXXXXXX', ac: 'tel', hint: 'অর্ডারের এসএমএস এই নম্বরে আসবে।' });
    const bdOnly = role === 'owner';
    const v = d.contact || '';
    const showCc = !bdOnly && !allowHandle && !looksEmail(v);
    const cc = bdOnly || allowHandle ? '' : `<select id="f-cc" data-f="cc" aria-label="দেশের কোড" class="cc" ${showCc ? '' : 'hidden'}>
      ${COUNTRIES.map((c) => `<option value="${c[1]}" ${(d.cc || '880') === c[1] ? 'selected' : ''}>${c[0]} +${c[1]}</option>`).join('')}</select>`;
    return `<div class="field"><label for="f-contact"><span>${label}</span></label>
      <div class="phonerow">${cc}<input ${attrs('contact')} type="text" inputmode="email" value="${H.esc(v)}" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="${bdOnly ? '01XXXXXXXXX বা name@gmail.com' : 'মোবাইল নম্বর বা name@gmail.com'}"></div>
      ${hint ? `<small>${hint}</small>` : ''}${err('contact')}</div>`;
  }
  function terms() {
    return `<div class="field terms"><label class="chk"><input ${attrs('terms')} type="checkbox" ${d.terms ? 'checked' : ''}><span>আমি শর্তাবলি ও গোপনীয়তা নীতি পড়েছি এবং মেনে নিচ্ছি।</span></label>
      <p class="legal-links"><button type="button" class="inline" data-action="demo" data-msg="আসল অ্যাপে শর্তাবলির পাতা খুলবে">ব্যবহারের শর্তাবলি</button> · <button type="button" class="inline" data-action="demo" data-msg="আসল অ্যাপে গোপনীয়তা নীতির পাতা খুলবে">গোপনীয়তা নীতি</button></p>${err('terms')}</div>`;
  }
  function otpBox(contact) {
    const sent = otp && otp.code;
    const label = contact.includes('@') ? 'ইমেইলে' : 'ফোনে';
    if (otp && otp.ok) return `<p class="good" role="status">✓ ${contact.includes('@') ? 'ইমেইল' : 'ফোন নম্বর'} যাচাই হয়েছে</p>`;
    return `<div class="otp">
      <button type="button" class="btn ghost block" id="otp-send" data-auth="otp-send">${sent ? 'আবার পাঠান' : `${label} কোড পাঠান`}</button>
      ${err('otpSend')}
      ${sent ? `<p class="otp-demo" role="status">প্রিভিউ: আসল এসএমএস যায় না। আপনার কোড <b>${H.bn(otp.code)}</b></p>
        <label class="field"><span>৬ সংখ্যার কোড</span><input ${attrs('code')} type="text" inputmode="numeric" maxlength="6" autocomplete="one-time-code" value="${H.esc(d.code || '')}" class="code-in">${err('code')}</label>
        <button type="button" class="btn block" data-auth="otp-verify">কোড যাচাই করুন</button>` : ''}
    </div>`;
  }

  const PROVIDERS = { google: 'Google', facebook: 'Facebook' };
  function socialButtons(role) {
    return `<div class="social">
      <button type="button" class="social-btn google" data-auth="social" data-provider="google" data-role="${role}"><span aria-hidden="true">G</span>Google দিয়ে চালিয়ে যান</button>
      <button type="button" class="social-btn facebook" data-auth="social" data-provider="facebook" data-role="${role}"><span aria-hidden="true">f</span>Facebook দিয়ে চালিয়ে যান</button>
    </div><p class="or">অথবা</p>`;
  }
  // what the provider gave is already here; the rest of the form still needs filling
  const socialStart = (role) => (d.social ? `<p class="good" role="status">✓ ${PROVIDERS[d.social.provider]} যুক্ত হয়েছে: ${H.esc(d.social.email)}</p>` : socialButtons(role));
  // The prototype cannot reach Google or Facebook. This stands in for their own page and never asks for their password.
  function socialSheet(provider, role) {
    const name = PROVIDERS[provider];
    H.openSheet(`<h2 id="sheet-h">${name} দিয়ে চালিয়ে যান</h2>
      <p class="note">প্রিভিউ: আসল ${name} এ যায় না, ${name} এর পাসওয়ার্ডও চায় না। আসল অ্যাপে এখানে ${name} এর নিজের পাতা খুলবে, সেখান থেকে নাম ও ইমেইল আসবে।</p>
      <form data-form="social" data-provider="${provider}" data-role="${role}" novalidate>
        <div class="row2">
          <label class="field"><span>নামের প্রথম অংশ</span><input id="sc-first" type="text" maxlength="40" value="ডেমো"></label>
          <label class="field"><span>নামের শেষ অংশ</span><input id="sc-last" type="text" maxlength="40" value="ব্যবহারকারী"></label>
        </div>
        <label class="field"><span>ইমেইল</span><input id="sc-email" type="email" maxlength="190" autocapitalize="none" spellcheck="false" value="demo.${provider}@example.com"></label>
        <label class="chk gap-t"><input id="sc-terms" type="checkbox"><span>আমি শর্তাবলি ও গোপনীয়তা নীতি পড়েছি এবং মেনে নিচ্ছি।</span></label>
        <small class="err" id="sc-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">চালিয়ে যান</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }
  function freeHandle(email) {
    const base = email.split('@')[0].toLowerCase().replace(/[^a-z0-9._]/g, '').replace(/^[._]+/, '').slice(0, 16);
    const start = base.length >= 3 ? base : 'user' + base;
    let h = start;
    for (let i = 2; accounts().some((a) => a.handle === h); i++) h = start + i;
    return h;
  }
  function socialContinue(f) {
    const role = f.dataset.role;
    const provider = f.dataset.provider;
    const first = $('sc-first').value.trim();
    const last = $('sc-last').value.trim();
    const email = $('sc-email').value.trim().toLowerCase();
    const show = (m) => { $('sc-err').textContent = m; };
    if (!first || !last) return show('নাম লিখুন');
    if (!isEmail(email)) return show('সঠিক ইমেইল দিন');
    const known = accounts().find((a) => a.role === role && (a.contact === email || (a.social && Object.values(a.social).includes(email))));
    if (known) {
      known.social = Object.assign({}, known.social, { [provider]: email });
      // the provider has confirmed this email, so an account that logs in with it needs no code
      if (known.contact === email && !known.verified) {
        known.verified = true;
        const shop = known.shopId ? Store.shopById(known.shopId) : null;
        if (shop) shop.hidden = false;
      }
      me = known;
      Store.setSession(role, known);
      d = {}; errs = {};
      H.closeSheet();
      H.toast('স্বাগতম, ' + H.keep(known.first));
      location.hash = (role === 'customer' && H.after()) || homeOf(role);
      return undefined;
    }
    if (!$('sc-terms').checked) return show('শর্তাবলি ও গোপনীয়তা নীতিতে সম্মতি দিন');
    H.closeSheet();
    d = Object.assign(d, { first, last, handle: freeHandle(email), handleTouched: true, terms: true, social: { provider, email }, pw: '', pw2: '' });
    errs = {};
    if (role === 'customer') {
      createAccount('customer', email);
      H.toast('স্বাগতম, ' + H.keep(first));
      return undefined;
    }
    // a shop still needs its details, and a delivery man a mobile number for the orders
    wizard = 0;
    d.contact = role === 'owner' ? email : '';
    H.toast(`${PROVIDERS[provider]} যুক্ত হয়েছে, বাকি তথ্য দিন`);
    if (location.hash === `#/auth/${role}/signup`) H.route(); else location.hash = `#/auth/${role}/signup`;
    return undefined;
  }

  /* ---------- pages ---------- */
  function shell(role, mode, body) {
    const r = ROLES[role];
    const seg = mode === 'login' || mode === 'signup';
    return `<a class="back" href="#/auth">‹ ধরন বদলান</a>
      <div class="auth-wrap auth-${role}">
        <aside class="auth-side">
          <span class="auth-ico" aria-hidden="true">${r.icon}</span>
          <h1>${r.title}</h1><p>${r.sub}</p>
          <ul>${r.points.map((p) => `<li>${p}</li>`).join('')}</ul>
        </aside>
        <section class="panel auth-card">
          ${seg ? `<div class="seg">
            <a href="#/auth/${role}/login" class="${mode === 'login' ? 'on' : ''}" ${mode === 'login' ? 'aria-current="page"' : ''}>লগইন</a>
            <a href="#/auth/${role}/signup" class="${mode === 'signup' ? 'on' : ''}" ${mode === 'signup' ? 'aria-current="page"' : ''}>${role === 'owner' ? 'এজেন্ট হোন' : 'একাউন্ট খুলুন'}</a>
          </div>` : ''}
          ${errs._ ? `<p class="form-err" role="alert">${H.esc(errs._)}</p>` : ''}
          ${body}
        </section>
      </div>`;
  }

  function chooser() {
    return `<div class="choose">
      <h1 class="page-h">আপনি কিভাবে লোকালহাট ব্যবহার করবেন?</h1>
      <div class="role-grid">
        ${Object.entries(ROLES).map(([id, r]) => `<a class="role-card role-${id}" href="#/auth/${id}/login">
          <span class="auth-ico" aria-hidden="true">${r.icon}</span>
          <span class="role-txt"><b>${r.label}</b><small>${r.sub}</small></span><span class="promise-go" aria-hidden="true">›</span>
        </a>`).join('')}
      </div>
    </div>`;
  }

  function login(role) {
    const a = accounts().find((x) => x.role === role);
    return shell(role, 'login', `${socialButtons(role)}<form data-form="login" data-role="${role}" novalidate>
      ${contactField(role, 'ফোন নম্বর অথবা ইমেইল', `ইউজার আইডি (যেমন nafisa.rahman) দিয়েও লগইন করা যায়।${role === 'customer' ? ' বিদেশি নম্বর হলে +দেশের কোড সহ লিখুন।' : ''}`, true)}
      ${password('pw', 'পাসওয়ার্ড', 'current-password')}
      <p class="linkrow"><a href="#/auth/${role}/forgot">পাসওয়ার্ড ভুলে গেছেন?</a></p>
      <button class="btn block" type="submit">লগইন</button>
      <div class="demo-box"><span>প্রিভিউ ডেমো: ${H.bn(a.contact)} / ${DEMO_PW}. আসল পাসওয়ার্ড দেবেন না।${role === 'owner' ? ` সেবা: ${H.bn('01711000012')}, ক্লিনিক: ${H.bn('01711000013')}, বাস কাউন্টার: ${H.bn('01711000014')}, ট্রাক: ${H.bn('01711000015')}, গ্যারেজ: ${H.bn('01711000018')}` : ''}</span>
        <button type="button" class="inline" data-auth="demo-fill" data-role="${role}">পূরণ করুন</button></div>
    </form>`);
  }

  // upazila names are suggested from the list; a shop and a delivery man must match for orders to reach him
  function areaFields(key) {
    return `<div class="row2">
      <label class="field"><span>জেলা</span><select ${attrs('district')}><option value="">বেছে নিন</option>${H.zilaOptions(d.district)}</select>${err('district')}</label>
      ${input(key, 'উপজেলা / থানা', { max: 60, ph: 'লিখুন বা বেছে নিন', raw: 'list="upazila-list" autocomplete="off"' })}
    </div><datalist id="upazila-list">${H.upazilaOptions(d.district)}</datalist>`;
  }
  function nameFields() {
    return `<div class="row2">${input('first', 'নামের প্রথম অংশ', { ac: 'given-name', max: 40 })}${input('last', 'নামের শেষ অংশ', { ac: 'family-name', max: 40 })}</div>`;
  }
  const pwFields = () => (d.social ? '' : `${password('pw', 'পাসওয়ার্ড', 'new-password', 'কমপক্ষে ৬ অক্ষর')}
      ${password('pw2', 'পাসওয়ার্ড আবার লিখুন', 'new-password')}`);
  function accountFields(role) {
    const email = (d.contact || '').includes('@');
    return `${nameFields()}
      ${input('handle', 'ইউজার আইডি', { ac: 'off', max: 20, ph: 'যেমন nafisa.rahman', raw: 'autocapitalize="none" spellcheck="false"', hint: 'ইংরেজি ছোট অক্ষর, সংখ্যা, . বা _ (৩-২০ অক্ষর)। সবার আইডি আলাদা হয়।' })}
      ${contactField(role, 'ফোন নম্বর অথবা ইমেইল', role === 'owner' ? 'ইমেইল বা বাংলাদেশি মোবাইল নম্বর। এটাই আপনার লগইন আইডি।' : 'নম্বর হলে দেশের কোড বেছে নিন। এটাই আপনার লগইন আইডি।')}
      ${role === 'owner' ? input('shopPhone', 'দোকানের ফোন নম্বর', { wrap: 'js-shopphone', hidden: !email, type: 'tel', mode: 'numeric', ph: '01XXXXXXXXX', hint: 'ইমেইল দিয়ে খুললে গ্রাহক কল করার জন্য একটি নম্বর লাগবে।' }) : ''}
      ${pwFields()}`;
  }

  function signupCustomer() {
    return shell('customer', 'signup', `${socialStart('customer')}<form data-form="signup-customer" novalidate>
      ${accountFields('customer')}${terms()}
      <p class="meta">একাউন্ট খোলার পর OTP দিয়ে ভেরিফাই করতে হবে। ভেরিফাই ছাড়া অর্ডার দেওয়া যাবে না।</p>
      <button class="btn block" type="submit">একাউন্ট খুলুন</button>
    </form>`);
  }

  // the bazars of the shops already in that upazila are suggested; a new one can be typed
  function bazarOptions() {
    const area = window.LHI18n.areaKey(d.district || '', d.area || '');
    return d.district && area ? Store.bazarsOf(d.district, area).map((b) => `<option value="${H.esc(b)}"></option>`).join('') : '';
  }
  const riderKm = () => Number(d.rkm || 3);
  // where a delivery man works: his bazar, his point on the map and how far he goes from it
  function riderPlaceFields() {
    const loc = `<p class="good" id="loc-status" role="status">${d.lat ? '✓ লোকেশন নেওয়া হয়েছে' : ''}</p>`;
    return `${input('raddr', 'পুরো ঠিকানা', { max: 150, ac: 'street-address', ph: 'বাড়ি, রোড, গ্রাম বা মহল্লা', hint: 'শুধু লোকালহাট টিম দেখবে। গ্রাহক বা দোকান দেখবে না।' })}
      ${input('rmarket', 'কোন বাজারের আন্ডারে কাজ করবেন', { max: 60, ph: 'যেমন: পুরাতন বাজার', raw: 'list="bazar-list" autocomplete="off"', hint: 'এই বাজারের দোকানের অর্ডার আগে আপনার কাছে আসবে।' })}
      <datalist id="bazar-list">${bazarOptions()}</datalist>
      <div class="field"><span class="flabel">ম্যাপে আপনার জায়গা</span>
        <button type="button" class="btn ghost block" data-auth="gps">📍 GPS দিয়ে নিন</button>
        <small>অথবা ম্যাপে চেপে বাজার বা বাসার জায়গায় পিন দিন।</small>
        <div id="pick-map" class="mini-map" aria-label="ডেলিভারি এলাকা বাছার ম্যাপ"></div>
        ${loc}${err('lat')}</div>
      <fieldset class="field fs"><legend>পিন থেকে কত দূর পর্যন্ত যাবেন</legend>
        <div class="vehicles">${Store.RIDER_KM.map((k) => `<label class="radio-pill"><input type="radio" name="rkm" data-f="rkm" value="${k}" ${riderKm() === k ? 'checked' : ''}><span>${H.bn(k)} কিমি</span></label>`).join('')}</div>
        <small>ম্যাপের গোল দাগের ভেতরের দোকানের অর্ডার আপনার কাছে আসবে।</small>${err('rkm')}</fieldset>`;
  }

  function signupDelivery() {
    return shell('delivery', 'signup', `${socialStart('delivery')}<form data-form="signup-delivery" novalidate>
      ${nameFields()}
      ${contactField('delivery')}
      <p class="flabel gap-t">কোন এলাকায় ডেলিভারি করবেন</p>
      ${areaFields('area')}
      ${riderPlaceFields()}
      <fieldset class="field fs"><legend>কিসে ডেলিভারি করবেন</legend>
        <div class="vehicles">${VEHICLES.map((v) => `<label class="radio-pill"><input type="radio" name="vehicle" data-f="vehicle" value="${v}" ${d.vehicle === v ? 'checked' : ''}><span>${v}</span></label>`).join('')}</div>
        ${err('vehicle')}</fieldset>
      ${pwFields()}
      ${terms()}
      <button class="btn block" type="submit">একাউন্ট খুলুন</button>
    </form>`);
  }

  // the sub-categories of a category that are this kind of business
  const subsOf = (c, kind) => c.examples.filter((x) => (window.LH.subKind[x] || c.kind) === kind);
  // a long list comes under its group headings
  function subPick(c) {
    const chip = (x) => `<button type="button" class="chip ${d.sub === x ? 'on' : ''}" aria-pressed="${d.sub === x}" data-auth="sub" data-id="${H.esc(x)}">${x}</button>`;
    const mine = subsOf(c, d.kind);
    if (!c.groups) return mine.map(chip).join('');
    return c.groups.map((g) => { const list = g.subs.filter((x) => mine.includes(x)); return list.length ? `<p class="sub-group">${g.icon} ${g.name}</p>${list.map(chip).join('')}` : ''; }).join('');
  }
  function signupOwner() {
    const names = ['একাউন্ট', 'ধরন ও ক্যাটাগরি', 'দোকানের তথ্য'];
    const bar = `<ol class="wiz" aria-label="ধাপ ${H.bn(wizard + 1)}, মোট ৩">${names.map((n, i) => `<li class="${i === wizard ? 'on' : i < wizard ? 'done' : ''}" ${i === wizard ? 'aria-current="step"' : ''}><span aria-hidden="true">${i < wizard ? '✓' : H.bn(i + 1)}</span>${n}</li>`).join('')}</ol>`;
    let body;
    if (wizard === 0) {
      body = `${accountFields('owner')}${terms()}
        <p class="meta">একাউন্ট খোলার পর OTP দিয়ে ভেরিফাই না করলে গ্রাহক আপনার দোকান দেখতে পাবে না।</p>
        <button class="btn block" type="submit">পরের ধাপ ›</button>`;
    } else if (wizard === 1) {
      const kind = (id, ic, t, s) => `<button type="button" class="kind ${d.kind === id ? 'on' : ''}" aria-pressed="${d.kind === id}" data-auth="kind" data-id="${id}"><span aria-hidden="true">${ic}</span><b>${t}</b><small>${s}</small></button>`;
      body = `<h2 class="tight">আপনি কী করেন?</h2>
        <div class="kinds">${kind('shop', '🏪', 'দোকান / ব্যবসা', 'পণ্য বিক্রি ও ডেলিভারি')}${kind('service', '🧰', 'সেবা প্রদানকারী', 'বুকিং, ভিজিট বা ইনকোয়ারি')}</div>
        ${err('kind')}
        ${d.kind ? `<h2 class="tight cat-h">ক্যাটাগরি বাছুন</h2>
          <div class="catpick">${window.LH.cats.filter((c) => subsOf(c, d.kind).length).map((c) => `<button type="button" class="${d.category === c.id ? 'on' : ''}" aria-pressed="${d.category === c.id}" data-auth="category" data-id="${c.id}"><span aria-hidden="true">${c.icon}</span><span class="cp-txt"><b>${c.label}</b><small>${(c.groups ? c.groups.map((g) => g.name) : subsOf(c, d.kind)).join(', ')}</small></span></button>`).join('')}</div>
          ${err('category')}
          ${d.category ? `<h2 class="tight cat-h">সাব-ক্যাটাগরি বাছুন</h2>
            <div class="subpick" role="group" aria-label="সাব-ক্যাটাগরি">${subPick(H.catById(d.category))}</div>
            ${err('sub')}
            ${Store.setupOf({ sub: d.sub }) === 'clinic' ? '<p class="note gap-t">🩺 আপনার প্যানেলে ডাক্তার ও টেস্টের তালিকা থাকবে: ডাক্তারের ডিগ্রি, চেম্বারের দিন ও সময়, নতুন ও পুরাতন রোগীর ফি, টেস্টের দাম ও অফার।</p>' : ''}
            ${Store.setupOf({ sub: d.sub }) === 'bus' ? '<p class="note gap-t">🚌 আপনার প্যানেলে রুট থাকবে: স্টপগুলো ক্রমানুসারে, শুরু থেকে কত কিমি, পথের কোথায় কোথায় আপনার কাউন্টার (ম্যাপে জায়গা ও ফোন), ছাড়ার সময়, সিট ও কিমি প্রতি ভাড়া। গ্রাহক ম্যাপে কাউন্টারগুলো দেখবেন, পথের যেকোনো স্টপ থেকে উঠবেন।</p>' : ''}
            ${Store.setupOf({ sub: d.sub }) === 'launch' ? '<p class="note gap-t">🛳️ আপনার প্যানেলে লঞ্চ থাকবে: কোন তলায় কোন কেবিন কয়টি (সিঙ্গেল, ডাবল, ফ্যামিলি, ভিআইপি) আর ডেকে কতজন। রুটে ঘাট, সময় ও প্রতিটি ধরনের ভাড়া; ট্রিপের নিয়ম। কাউন্টারে নগদ বিক্রি, ফোনে হোল্ড আর যাত্রী ওঠানো একই তালিকা থেকে, তাই কোনো কেবিন দুইবার বিক্রি হবে না।</p>' : ''}` : ''}` : ''}
        <div class="wiz-actions"><button type="button" class="btn ghost" data-auth="wiz-back">‹ আগের ধাপ</button><button class="btn" type="submit">পরের ধাপ ›</button></div>`;
    } else {
      const loc = `<p class="good" id="loc-status" role="status">${d.lat ? '✓ লোকেশন নেওয়া হয়েছে' : ''}</p>`;
      body = `<h2 class="tight">${d.kind === 'service' ? 'সেবার তথ্য' : 'দোকানের তথ্য'}</h2>
        ${input('sname', 'দোকান / সেবার নাম', { max: 80 })}
        ${areaFields('sarea')}
        ${input('addr', 'ঠিকানা', { max: 200, ac: 'street-address' })}
        ${input('market', 'বাজার / মার্কেটের নাম', { optional: true, max: 60, ph: 'যেমন: পুরাতন বাজার', hint: 'একই বাজারের দোকানগুলো একসাথে দেখাবে।' })}
        <div class="field"><span class="flabel">দোকানের লোকেশন</span>
          <button type="button" class="btn ghost block" data-auth="gps">📍 GPS দিয়ে নিন</button>
          <small>অথবা নিচের ম্যাপে চেপে দোকানের জায়গায় পিন দিন।</small>
          <div id="pick-map" class="mini-map" aria-label="দোকানের লোকেশন বাছার ম্যাপ"></div>
          ${loc}${err('lat')}</div>
        <label class="field"><span>পরিচিতি <i>(ঐচ্ছিক)</i></span><textarea ${attrs('about')} maxlength="300" rows="2">${H.esc(d.about || '')}</textarea></label>
        ${window.LHCats.signupFields(d.sub, err('cats'))}
        <div class="wiz-actions"><button type="button" class="btn ghost" data-auth="wiz-back">‹ আগের ধাপ</button><button class="btn" type="submit">${d.kind === 'service' ? 'সেবা খুলুন' : 'দোকান খুলুন'}</button></div>`;
    }
    return shell('owner', 'signup', `${wizard === 0 ? socialStart('owner') : ''}${bar}<form data-form="signup-owner" novalidate>${body}</form>`);
  }

  function forgot(role) {
    const norm = normContact(d.contact || '', d.cc, role !== 'customer');
    return shell(role, 'forgot', `<h2 class="tight">পাসওয়ার্ড ভুলে গেছেন?</h2>
      <p class="meta gap">কোড দিয়ে যাচাই করুন, তারপর নতুন পাসওয়ার্ড বানান।</p>
      <form data-form="forgot" data-role="${role}" novalidate>
        ${contactField(role, 'ফোন নম্বর অথবা ইমেইল', 'এই নম্বরে বা ইমেইলে একটি কোড যাবে।')}
        ${otpBox(norm || d.contact || '')}
        ${otp && otp.ok ? `${password('pw', 'নতুন পাসওয়ার্ড', 'new-password', 'কমপক্ষে ৬ অক্ষর')}${password('pw2', 'নতুন পাসওয়ার্ড আবার লিখুন', 'new-password')}<button class="btn block" type="submit">পাসওয়ার্ড বদলান</button>` : ''}
        <p class="linkrow center"><a href="#/auth/${role}/login">‹ লগইনে ফিরে যান</a></p>
      </form>`);
  }

  const homeOf = (role) => (role === 'owner' ? '#/owner' : role === 'delivery' ? '#/rider' : '#/account/customer');
  function verify(role) {
    me = Store.session(role);
    if (!me) { location.hash = '#/auth/' + role + '/login'; return ''; }
    if (me.verified) { location.hash = homeOf(role); return ''; }
    const note = role === 'owner' ? 'ভেরিফাই না করলে গ্রাহক আপনার দোকান দেখতে পাবে না।' : role === 'delivery' ? 'ভেরিফাই না করলে কাজ আসবে না।' : 'ভেরিফাই না করলে অর্ডার দেওয়া যাবে না।';
    return shell(role, 'verify', `<h2 class="tight">একাউন্ট ভেরিফাই করুন</h2>
      <p class="meta gap"><b>${H.bn(H.esc(me.contact))}</b> এ কোড যাবে। ${note}</p>
      ${otpBox(me.contact)}
      <a class="link center-link" href="${homeOf(role)}">পরে করব</a>`);
  }

  function account(role) {
    if (!ROLES[role]) return null;
    me = Store.session(role);
    if (!me) { location.hash = '#/auth/' + role + '/login'; return ''; }
    const r = ROLES[role];
    const shop = me.shopId ? Store.shopById(me.shopId) : null;
    const next = {
      customer: `<a class="btn ghost block gap-b" href="#/favs"><span>❤️ প্রিয় দোকান</span>${(me.favs || []).length ? ` (${H.bn(Store.favsOf(me).length)})` : ''}</a><a class="btn block" href="#/">বাজার শুরু করুন</a>`,
      owner: `<p class="note">${me.verified ? `${shop ? H.ud(shop.name) : 'আপনার দোকান'} এখন গ্রাহকরা দেখতে পাবেন।` : 'ভেরিফাই না করা পর্যন্ত দোকান গ্রাহকদের কাছে লুকানো থাকবে।'}</p><a class="btn block" href="#/owner">প্যানেলে যান</a>`,
      delivery: `<p class="note">আপনার এলাকার দোকান অর্ডার গ্রহণ করলে কাজ অটোমেটিক আসবে।${me.approved === false ? ' আগে এনআইডি ও কাগজ জমা দিন, লোকালহাট টিম যাচাই করে অনুমোদন দেবে।' : ''}</p>
        ${me.approved === false && !(me.kyc && me.kyc.status === 'pending') ? '<a class="btn ghost block gap-b" href="#/rider/papers">📄 কাগজ জমা দিন</a>' : ''}<a class="btn block" href="#/rider">আজকের কাজ দেখুন</a>`
    }[role];
    return `<div class="acct"><h1 class="page-h">আমার একাউন্ট</h1>
      <section class="panel acct-card">
        <div class="acct-head"><span class="auth-ico" aria-hidden="true">${r.icon}</span>
          <div><h2>${H.ud(me.name)}</h2><p class="meta">${r.label}</p></div>
          <span class="tag ${me.verified ? 'ok' : ''}">${me.verified ? '✓ ভেরিফাইড' : 'ভেরিফাই বাকি'}</span></div>
        <dl class="acct-list">
          <div><dt>ইউজার আইডি</dt><dd dir="ltr">@${H.esc(me.handle)}</dd></div>
          <div><dt>আইডি নম্বর</dt><dd>${H.bn(me.memberNo)}</dd></div>
          <div><dt>লগইন</dt><dd>${H.bn(H.esc(me.contact))}</dd></div>
          ${me.vehicle ? `<div><dt>এলাকা ও বাহন</dt><dd>${H.geo(me.area)}${me.zila ? ', ' + H.geo(me.zila) : ''}, ${H.esc(me.vehicle)}</dd></div>` : ''}
          ${role === 'delivery' ? `${me.addr ? `<div><dt>ঠিকানা</dt><dd>${H.ud(me.addr)}</dd></div>` : ''}
            <div><dt>কাজের এলাকা</dt><dd>${me.market ? `<span>${H.ud(me.market)}</span> · ` : ''}${me.lat ? `<span>${H.bn(me.km || 3)} কিমি</span>` : '<span>ম্যাপে পিন দেওয়া হয়নি</span>'} · <a class="inline-link" href="#/rider/area">বদলান</a></dd></div>` : ''}
          ${me.social ? Object.entries(me.social).map(([p, email]) => `<div><dt>যুক্ত একাউন্ট</dt><dd>${PROVIDERS[p]} · ${H.esc(email)}</dd></div>`).join('') : ''}
          ${shop ? `<div><dt>রেটিং</dt><dd><a class="inline-link" href="#/shop/${shop.id}">${window.LHRate.badge('shop', shop.id, 'এখনো রেটিং নেই')}</a></dd></div>` : ''}
          ${role === 'delivery' ? `<div><dt>রেটিং</dt><dd><a class="inline-link" href="#/profile/rider/${Store.hash(me.contact)}">${window.LHRate.badge('rider', me.contact, 'এখনো রেটিং নেই')}</a></dd></div>` : ''}
        </dl>
        ${me.verified ? '' : `<a class="btn ghost block gap-b" href="#/auth/verify/${role}">এখনই ভেরিফাই করুন</a>`}
        ${next}
        <a class="btn ghost block gap-t" href="#/support/${role}">🛟 সাপোর্ট${window.LHCare.unreadFor(me.id) ? ` (${H.bn(window.LHCare.unreadFor(me.id))})` : ''}</a>
        <button type="button" class="link" data-auth="logout" data-role="${role}">লগ আউট</button>
      </section></div>`;
  }

  function page(parts) {
    const key = parts.join('/');
    if (key !== formKey) {
      const sameFlow = key.split('/')[0] === formKey.split('/')[0];
      formKey = key;
      errs = {};
      otp = null;
      stopTimer();
      if (!sameFlow) { d = {}; wizard = 0; } else { d.pw = ''; d.pw2 = ''; d.code = ''; }
    }
    const [role, mode] = parts;
    if (!role) return chooser();
    if (role === 'verify') return ROLES[mode] ? verify(mode) : null;
    if (!ROLES[role]) return null;
    if (mode === 'login') return login(role);
    if (mode === 'forgot') return forgot(role);
    if (mode === 'signup') return role === 'owner' ? signupOwner() : role === 'delivery' ? signupDelivery() : signupCustomer();
    return null;
  }

  /* ---------- validation ---------- */
  function checkPw(out) {
    if ((d.pw || '').length < 6) out.pw = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের দিন';
    else if (d.pw !== d.pw2) out.pw2 = 'দুইবারের পাসওয়ার্ড মেলেনি';
  }
  function checkName(out) {
    if (!(d.first || '').trim()) out.first = 'নামের প্রথম অংশ দিন';
    if (!(d.last || '').trim()) out.last = 'নামের শেষ অংশ দিন';
  }
  function taken(role, contact) {
    return accounts().some((a) => a.role === role && a.contact === contact);
  }
  function checkAccount(role, out) {
    checkName(out);
    if (d.handle && !handleOk(d.handle)) out.handle = 'ইউজার আইডি ৩-২০ অক্ষরের হতে হবে (ইংরেজি ছোট অক্ষর, সংখ্যা, . বা _)';
    else if (d.handle && accounts().some((a) => a.handle === d.handle)) out.handle = 'এই ইউজার আইডি আগেই নেওয়া হয়েছে';
    const c = normContact(d.contact || '', d.cc, role === 'owner');
    if (!c) out.contact = role === 'owner' ? 'ইমেইল বা বাংলাদেশি মোবাইল নম্বর দিন' : 'সঠিক ফোন নম্বর অথবা ইমেইল দিন';
    else if (taken(role, c)) out.contact = c.includes('@') ? 'এই ইমেইলে আগেই একাউন্ট আছে' : 'এই নম্বরে আগেই একাউন্ট আছে';
    if (role === 'owner' && c && c.includes('@') && !bdPhone(d.shopPhone || '')) out.shopPhone = 'দোকানের ফোন নম্বর দিন (গ্রাহক এই নম্বরে কল করবে)';
    if (!d.social) checkPw(out);
    if (!d.terms) out.terms = 'শর্তাবলি ও গোপনীয়তা নীতিতে সম্মতি দিন';
    return c;
  }
  function showErrors(out) {
    errs = out;
    H.route(true);
    const first = Object.keys(out)[0];
    const el = first && (first === '_' ? document.querySelector('.form-err') : $('f-' + first) || $('e-' + first));
    if (el) { if (el.focus && el.tabIndex >= 0) el.focus(); el.scrollIntoView({ block: 'center' }); }
  }
  function createAccount(role, contact, extra) {
    const data = Store.data;
    const no = data.nextNo++;
    const proven = !!d.social && d.social.email === contact;
    me = Object.assign({
      id: 'a' + no, role, first: d.first.trim(), last: d.last.trim(), name: d.first.trim() + ' ' + d.last.trim(),
      handle: d.handle || suggestHandle() || 'user' + String(no).slice(-5),
      memberNo: String(no), contact, pw: d.social ? null : Store.hash(d.pw), verified: proven
    }, d.social ? { social: { [d.social.provider]: d.social.email } } : null, extra);
    data.accounts.push(me);
    Store.setSession(role, me);
    d = {}; errs = {}; wizard = 0;
    location.hash = proven ? (role === 'customer' && H.after()) || homeOf(role) : '#/auth/verify/' + role;
  }
  function createOwner() {
    const cat = H.catById(d.category);
    const contact = normContact(d.contact, '880', true);
    const id = 'n' + Date.now().toString(36);
    Store.data.shops.push({
      id, name: d.sname.trim(), cat: d.category, sub: d.sub, zila: d.district, area: window.LHI18n.areaKey(d.district, d.sarea), market: (d.market || '').trim() || d.sarea.trim(), kind: d.kind,
      verified: false, about: (d.about || '').trim(), icon: Store.setupOf({ sub: d.sub }) === 'clinic' ? '🏥' : Store.setupOf({ sub: d.sub }) === 'bus' ? '🚌' : Store.setupOf({ sub: d.sub }) === 'launch' ? '🛳️' : cat.icon, lat: d.lat, lng: d.lng, address: d.addr.trim(),
      phone: contact.includes('@') ? bdPhone(d.shopPhone) : contact, open: true, hidden: !(d.social && d.social.email === contact), week: null, items: [], createdAt: new Date().toISOString(),
      // a launch counter starts with no launches, routes or trips, and the default hold and give-back rules
      launch: Store.setupOf({ sub: d.sub }) === 'launch' ? Store.lnBlank() : undefined,
      // more categories come by the team's approval; products of one still waiting are kept apart
      extra: [], waiting: []
    });
    window.LHCats.signupDone(id, d.sub);
    createAccount('owner', contact, { shopId: id });
  }

  /* ---------- OTP ---------- */
  function stopTimer() { clearInterval(timer); timer = null; }
  function startCooldown() {
    let left = 30;
    const tick = () => {
      const b = $('otp-send');
      if (!b) return stopTimer();
      if (left <= 0) { stopTimer(); b.disabled = false; b.textContent = 'আবার পাঠান'; return; }
      b.disabled = true;
      b.textContent = `আবার পাঠান (${H.bn(left)} সেকেন্ড)`;
      left -= 1;
    };
    stopTimer();
    tick();
    timer = setInterval(tick, 1000);
  }
  function otpContact() {
    if (me && formKey.startsWith('verify')) return me.contact;
    const role = formKey.split('/')[0];
    return normContact(d.contact || '', d.cc, role !== 'customer');
  }
  function sendOtp() {
    const c = otpContact();
    if (!c) return showErrors({ contact: 'সঠিক ফোন নম্বর অথবা ইমেইল দিন' });
    otp = { code: String(Math.floor(100000 + Math.random() * 900000)), until: Date.now() + 5 * 60000, ok: false };
    d.code = '';
    errs = {};
    H.route(true);
    startCooldown();
    const f = $('f-code');
    if (f) f.focus();
  }
  function checkOtp() {
    const code = digits(d.code || '').trim();
    if (!otp || Date.now() > otp.until) return showErrors({ code: 'কোডের মেয়াদ শেষ, আবার পাঠান' });
    if (code !== otp.code) return showErrors({ code: 'কোড মেলেনি, আবার দেখে লিখুন' });
    stopTimer();
    otp.ok = true;
    errs = {};
    if (formKey.startsWith('verify')) {
      me.verified = true;
      const shop = me.shopId ? Store.shopById(me.shopId) : null;
      if (shop) shop.hidden = false;
      Store.fillWaiting();
      H.toast('একাউন্ট ভেরিফাইড হয়েছে');
      location.hash = (me.role === 'customer' && H.after()) || homeOf(me.role);
    } else {
      H.route(true);
      const p = $('f-pw');
      if (p) p.focus();
    }
  }

  /* ---------- events ---------- */
  function onInput(e) {
    const k = e.target.dataset.f;
    if (!k) return;
    d[k] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (errs[k]) {
      delete errs[k];
      const m = $('e-' + k);
      if (m) m.remove();
      e.target.removeAttribute('aria-invalid');
      e.target.removeAttribute('aria-describedby');
    }
    if (k === 'district') {
      const list = $('upazila-list');
      if (list) list.innerHTML = H.upazilaOptions(d.district);
      const pos = window.LH_GEO_POS[d.district];
      if (pick && pos && !d.lat) pick.map.setView(pos, 12, { animate: false });
    }
    if (k === 'district' || k === 'area') {
      const bz = $('bazar-list');
      if (bz) bz.innerHTML = bazarOptions();
    }
    if (k === 'rkm' && pick) pick.setKm(riderKm());
    if (k === 'contact') {
      const cc = $('f-cc');
      if (cc) cc.hidden = looksEmail(e.target.value);
      const sp = document.querySelector('.js-shopphone');
      if (sp) sp.hidden = !e.target.value.includes('@');
      if (otp && formKey.endsWith('/forgot')) { otp = null; stopTimer(); H.route(true); const f = $('f-contact'); if (f) { f.focus(); f.setSelectionRange(f.value.length, f.value.length); } }
    }
    if ((k === 'first' || k === 'last') && !d.handleTouched) {
      const h = $('f-handle');
      if (h) { d.handle = suggestHandle(); h.value = d.handle; }
    }
    if (k === 'handle') d.handleTouched = true;
  }

  function onClick(e) {
    const el = e.target.closest('[data-auth]');
    if (!el) return;
    const a = el.dataset;
    switch (a.auth) {
      case 'pw-toggle': {
        const inp = $(a.for);
        const show = inp.type === 'password';
        inp.type = show ? 'text' : 'password';
        el.textContent = show ? 'লুকান' : 'দেখান';
        el.setAttribute('aria-pressed', show);
        break;
      }
      case 'demo-fill': {
        const acc = accounts().find((x) => x.role === a.role);
        d.contact = acc.contact; d.pw = DEMO_PW; errs = {};
        H.route(true);
        break;
      }
      case 'kind':
        if (d.kind !== a.id) { d.kind = a.id; d.category = ''; d.sub = ''; }
        delete errs.kind;
        H.route(true);
        break;
      case 'category':
        if (d.category !== a.id) d.sub = '';
        d.category = a.id;
        delete errs.category;
        H.route(true);
        // on a phone the sub-categories open below a long list
        document.querySelector('.subpick').scrollIntoView({ block: 'center' });
        break;
      case 'sub':
        d.sub = a.id;
        delete errs.sub;
        H.route(true);
        break;
      case 'wiz-back': wizard -= 1; errs = {}; H.route(); break;
      case 'gps':
        if (!navigator.geolocation) { showErrors({ lat: 'এই ব্রাউজারে GPS নেই, ম্যাপে পিন দিন' }); break; }
        navigator.geolocation.getCurrentPosition((p) => {
          d.lat = p.coords.latitude; d.lng = p.coords.longitude; delete errs.lat; H.route(true);
        }, () => showErrors({ lat: 'লোকেশন পাওয়া যায়নি। অনুমতি দিন, অথবা ম্যাপে পিন দিন।' }), { timeout: 10000 });
        break;
      case 'social': socialSheet(a.provider, a.role); break;
      case 'otp-send': sendOtp(); break;
      case 'otp-verify': checkOtp(); break;
      case 'logout':
        Store.setSession(a.role, null);
        me = null;
        H.toast('লগ আউট হয়েছে');
        location.hash = a.role === 'customer' ? '#/' : '#/auth/' + a.role + '/login';
        break;
    }
  }

  function onSubmit(e) {
    const form = e.target.dataset.form;
    if (!form) return;
    e.preventDefault();
    if (form === 'social') { socialContinue(e.target); return; }
    const out = {};
    if (form === 'login') {
      const role = e.target.dataset.role;
      const raw = digits(d.contact || '').trim();
      const c = normContact(raw, '880', false);
      const acc = accounts().find((x) => x.role === role && (x.contact === c || x.contact === raw || x.handle === raw.toLowerCase().replace(/^@/, '')));
      if (!raw) out.contact = 'ফোন নম্বর অথবা ইমেইল দিন';
      if (!d.pw) out.pw = 'পাসওয়ার্ড দিন';
      if (Object.keys(out).length) return showErrors(out);
      if (!acc || acc.pw !== Store.hash(d.pw)) { d.pw = ''; return showErrors({ _: 'ফোন নম্বর/ইমেইল বা পাসওয়ার্ড ভুল' }); }
      me = acc;
      Store.setSession(role, acc);
      d = {}; errs = {};
      H.toast('স্বাগতম, ' + H.keep(acc.first));
      location.hash = (role === 'customer' && H.after()) || homeOf(role);
    } else if (form === 'signup-customer') {
      const c = checkAccount('customer', out);
      if (Object.keys(out).length) return showErrors(out);
      createAccount('customer', c);
    } else if (form === 'signup-delivery') {
      checkName(out);
      const c = bdPhone(d.contact || '');
      if (!c) out.contact = 'সঠিক বাংলাদেশি মোবাইল নম্বর দিন';
      else if (taken('delivery', c)) out.contact = 'এই নম্বরে আগেই একাউন্ট আছে';
      if (!Object.hasOwn(window.LH_GEO, d.district || '')) out.district = 'জেলা বেছে নিন';
      if ((d.area || '').trim().length < 2) out.area = 'উপজেলা / থানা দিন';
      if ((d.raddr || '').trim().length < 5) out.raddr = 'পুরো ঠিকানা লিখুন (কমপক্ষে ৫ অক্ষর)';
      if ((d.rmarket || '').trim().length < 2) out.rmarket = 'কোন বাজারের আন্ডারে কাজ করবেন, লিখুন';
      if (!d.lat) out.lat = 'ম্যাপে আপনার জায়গায় পিন দিন, অথবা GPS চাপুন';
      if (!d.vehicle) out.vehicle = 'একটি বেছে নিন';
      if (!d.social) checkPw(out);
      if (!d.terms) out.terms = 'শর্তাবলি ও গোপনীয়তা নীতিতে সম্মতি দিন';
      if (Object.keys(out).length) return showErrors(out);
      let base;
      try {
        base = Store.checkRiderBase({ zila: d.district, area: window.LHI18n.areaKey(d.district, d.area), addr: d.raddr, market: d.rmarket, lat: d.lat, lng: d.lng, km: riderKm() });
      } catch (ex) { return showErrors({ _: ex.message }); }
      createAccount('delivery', c, Object.assign(base, { vehicle: d.vehicle, approved: false }));
    } else if (form === 'signup-owner') {
      if (wizard === 0) {
        checkAccount('owner', out);
      } else if (wizard === 1) {
        if (!d.kind) out.kind = 'ব্যবসার ধরন বেছে নিন';
        else if (!d.category) out.category = 'ক্যাটাগরি বেছে নিন';
        else if (!d.sub) out.sub = 'সাব-ক্যাটাগরি বেছে নিন';
      } else {
        if ((d.sname || '').trim().length < 2) out.sname = 'দোকানের নাম দিন';
        if (!Object.hasOwn(window.LH_GEO, d.district || '')) out.district = 'জেলা বেছে নিন';
        if ((d.sarea || '').trim().length < 2) out.sarea = 'উপজেলা / থানা দিন';
        if ((d.addr || '').trim().length < 5) out.addr = 'ঠিকানা দিন (কমপক্ষে ৫ অক্ষর)';
        if (!d.lat) out.lat = 'দোকানের লোকেশন দিন (GPS বা ম্যাপে পিন)';
        // more categories at sign up need the trade licence
        const cats = window.LHCats.signupCheck();
        if (cats) out.cats = cats;
      }
      if (Object.keys(out).length) return showErrors(out);
      if (wizard < 2) { wizard += 1; errs = {}; return H.route(); }
      createOwner();
    } else if (form === 'forgot') {
      const role = e.target.dataset.role;
      checkPw(out);
      if (Object.keys(out).length) return showErrors(out);
      // same result for known and unknown contacts, like the real reset API
      const c = otpContact();
      const acc = accounts().find((x) => x.role === role && x.contact === c);
      if (acc) { acc.pw = Store.hash(d.pw); Store.save(); }
      d = {}; errs = {}; otp = null;
      H.toast('পাসওয়ার্ড বদলানো হয়েছে, নতুন পাসওয়ার্ড দিয়ে লগইন করুন');
      location.hash = '#/auth/' + role + '/login';
    }
  }

  function init(helpers) {
    H = helpers;
    document.addEventListener('input', onInput);
    document.addEventListener('change', onInput);
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
  }

  let pick = null;
  function mount() {
    const el = $('pick-map');
    pick = null;
    if (!el) return;
    // a delivery man's map opens on his district and shows how far he goes
    const rider = formKey === 'delivery/signup';
    const around = rider && window.LH_GEO_POS[d.district];
    pick = window.LHMap.picker(el, d.lat ? { lat: d.lat, lng: d.lng } : null, (lat, lng) => {
      d.lat = lat; d.lng = lng;
      delete errs.lat;
      const m = $('e-lat');
      if (m) m.remove();
      $('loc-status').textContent = '✓ লোকেশন নেওয়া হয়েছে';
    }, rider ? { icon: '🛵', km: riderKm(), around } : null);
  }

  return { init, page, account, mount, current: (role) => Store.session(role) };
})();

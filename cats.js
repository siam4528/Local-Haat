// An agent's categories. A shop opens in one category and sub-category; more need the LocalHaat team's approval against the
// shop's trade licence: within 24 hours when the business is written on the licence, within 7 working days when it is not.
// Products of a category still waiting can be added already; users see them once it is approved.
window.LHCats = (function () {
  'use strict';
  const Store = window.LHStore;
  let U;
  const $ = (id) => document.getElementById(id);
  const owner = () => window.LHAuth.current('owner');
  const myShop = () => { const m = owner(); return m && Store.shopById(m.shopId); };
  // the licence picture chosen in a sheet, and the sign up's other categories and licence
  let licPic = '';
  const freshSignup = () => ({ open: false, extra: [], no: '', pic: '' });
  let su = freshSignup();

  // "🛒 নিত্যপণ্য › মুদি দোকান"
  function subLabel(sub) {
    const c = Store.catOfSub(sub);
    return `${c ? `<span>${c.icon} ${U.esc(c.short)}</span> › ` : ''}<span>${U.esc(sub)}</span>`;
  }
  // every sub-category that can be asked for, under its category; one with a panel of its own needs its own account
  function subOptions(skip) {
    return window.LH.cats.map((c) => {
      const list = c.examples.filter((x) => !skip.includes(x) && !Store.ownPanel(x));
      return list.length ? `<optgroup label="${U.esc(c.icon + ' ' + c.label)}">${list.map((x) => `<option value="${U.esc(x)}">${U.esc(x)}</option>`).join('')}</optgroup>` : '';
    }).join('');
  }
  const taken = (s) => Store.subChoices(s).map((x) => x.sub);
  const laneText = (a) => (a.onLicence ? '📄 লাইসেন্সে আছে · ২৪ ঘণ্টার মধ্যে' : '৫–৭ কর্মদিবস');
  const licenceFields = (no, pic, prefix) => `
    <label class="field"><span>ট্রেড লাইসেন্স নম্বর</span><input id="${prefix}-lic-no" data-cat-in="${prefix}" type="text" maxlength="40" autocomplete="off" value="${U.esc(no || '')}"></label>
    <div class="field"><span class="flabel">ট্রেড লাইসেন্সের ছবি</span>
      <div class="it-upload"><div class="it-preview" id="${prefix}-lic-prev">${pic ? `<img src="${pic}" alt="">` : '<span aria-hidden="true">📄</span>'}</div>
        <div class="it-upload-acts"><label class="btn ghost sm upload"><input type="file" class="sr" accept="image/jpeg,image/png,image/webp" data-cat-pic="${prefix}">ছবি বাছুন</label><small>পুরো লাইসেন্স পড়া যায় এমন ছবি দিন।</small></div></div>
      <small class="err" id="${prefix}-pic-err"></small></div>`;

  /* ---------- the agent's profile ---------- */
  function ownerSection(s) {
    const asks = Store.asksOf(s.id);
    const open = asks.filter((a) => a.status === 'open');
    const have = taken(s);
    // the latest refusal of a sub-category not since approved or asked again
    const refused = asks.filter((a, i) => a.status === 'no' && !have.includes(a.sub) && asks.findIndex((y) => y.sub === a.sub) === i);
    const waiting = (s.waiting || []).length;
    return `<section class="panel my-cats" id="my-cats">
      <h2 class="tight">🏷️ আপনার ক্যাটাগরি</h2>
      <ul class="cat-list">
        <li><span class="cat-name">${subLabel(s.sub)}</span><small>মূল ক্যাটাগরি</small></li>
        ${(s.extra || []).map((x) => `<li><span class="cat-name">${subLabel(x.sub)}</span><small>✓ অনুমোদিত</small><button type="button" class="inline danger-txt" data-cat="drop" data-sub="${U.esc(x.sub)}">বাদ দিন</button></li>`).join('')}
        ${open.map((a) => `<li class="wait"><span class="cat-name">${subLabel(a.sub)}</span><small>⏳ <span>অপেক্ষায়</span> · <span>${laneText(a)}</span> · <span>শেষ সময়</span> ${U.fmtTime(a.due)}</small><button type="button" class="inline" data-cat="withdraw" data-id="${a.id}">অনুরোধ তুলে নিন</button></li>`).join('')}
        ${refused.map((a) => `<li class="no"><span class="cat-name">${subLabel(a.sub)}</span><small>✕ <span>হয়নি</span>: ${U.ud(a.reason)}</small></li>`).join('')}
      </ul>
      ${waiting ? `<p class="note">⏳ ${U.bn(waiting)} <span>টি পণ্য বা সেবা অনুমোদনের অপেক্ষায়, গ্রাহক এখনো দেখছেন না।</span></p>` : ''}
      <button type="button" class="btn ghost block" data-cat="ask">+ আরেকটি ক্যাটাগরি চান</button>
      <p class="meta licence-row">📄 <span>ট্রেড লাইসেন্স</span>: ${s.licence ? `<span translate="no">${U.ud(s.licence.no)}</span> · <span>দেওয়া আছে</span>` : '<span>এখনো দেননি</span>'} <button type="button" class="inline" data-cat="licence">${s.licence ? 'বদলান' : 'দিন'}</button></p>
      <p class="meta">ট্রেড লাইসেন্সে ব্যবসাটি লেখা থাকলে ২৪ ঘণ্টার মধ্যে, না থাকলে ৫–৭ কর্মদিবসে লোকালহাট টিম সিদ্ধান্ত দেবে। শুক্র ও শনিবার ছুটি। কোনো সমস্যা হলে সাপোর্টে জানান।</p>
    </section>`;
  }
  function askSheet(s) {
    licPic = '';
    U.openSheet(`<h2 id="sheet-h">আরেকটি ক্যাটাগরি চান</h2>
      <form id="cat-ask" novalidate>
        <label class="field"><span>ক্যাটাগরি ও সাব-ক্যাটাগরি</span><select id="ca-sub"><option value="">বেছে নিন</option>${subOptions(taken(s))}</select></label>
        <label class="chk"><input type="checkbox" id="ca-lic"><span>আমার ট্রেড লাইসেন্সে এই ব্যবসার কথা লেখা আছে (২৪ ঘণ্টায় সিদ্ধান্ত)</span></label>
        <label class="field"><span>নোট <i>(ঐচ্ছিক)</i></span><input id="ca-note" type="text" maxlength="200" placeholder="যেমন: দোকানে খাতা-কলমও বিক্রি হয়"></label>
        ${s.licence ? '' : `<p class="note gap-t">অনুরোধের জন্য ট্রেড লাইসেন্স লাগবে।</p>${licenceFields('', '', 'ca')}`}
        <p class="meta">অনুমোদনের আগেও এই বিভাগের পণ্য যোগ করতে পারবেন। গ্রাহক দেখবেন অনুমোদনের পর থেকে, নিজে থেকেই।</p>
        <small class="err" id="ca-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">অনুরোধ পাঠান</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }
  function licenceSheet(s) {
    licPic = '';
    U.openSheet(`<h2 id="sheet-h">ট্রেড লাইসেন্স</h2>
      <form id="cat-lic" novalidate>
        ${licenceFields(s.licence ? s.licence.no : '', s.licence ? s.licence.pic : '', 'lc')}
        <small class="err" id="lc-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">সংরক্ষণ করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }

  /* ---------- the team ---------- */
  // The licence picture opens only for verification and the super admin, one shop at a time, and each look is logged.
  const licSeen = new Set();
  function licBox(s, where) {
    if (!s.licence) return '';
    const no = `<p class="meta">📄 <span>ট্রেড লাইসেন্স</span> <span translate="no">${U.ud(s.licence.no)}</span></p>`;
    if (!Store.can('docs', s)) return `<div class="lic-box">${no}<p class="meta">ছবি শুধু ভেরিফিকেশন টিম দেখতে পারে।</p></div>`;
    if (!licSeen.has(s.id)) return `<div class="lic-box">${no}<button type="button" class="btn ghost sm" data-cat="lic-see" data-shop="${s.id}" data-where="${where}">📄 লাইসেন্সের ছবি দেখুন</button></div>`;
    return `<div class="lic-box">${no}<img class="lic-pic" src="${s.licence.pic}" alt="ট্রেড লাইসেন্সের ছবি"></div>`;
  }
  // a visit for a category the licence does not show: who goes and when, then what they found
  const dayText = (day) => window.LHTime.show(window.LHTime.at(day, '12:00'), { day: 'numeric', month: 'short' }, window.LHI18n.lang);
  function visitHtml(a, s) {
    const v = a.visit;
    if (!v) return a.onLicence || !Store.can('cats', s) ? '' : `<button type="button" class="btn ghost sm" data-cat="visit-plan" data-id="${a.id}">🏠 দোকান পরিদর্শন ঠিক করুন</button>`;
    return `<div class="visit-box"><p><b>🏠 <span>পরিদর্শন</span></b>: ${U.ud(v.whoName)} · ${dayText(v.date)} · <span class="tag ${v.status === 'done' ? 'ok' : ''}">${v.status === 'done' ? 'হয়েছে' : 'বাকি'}</span></p>
      ${v.status === 'done' ? `<p class="note">${U.ud(v.note)}</p>${(v.pics || []).length ? `<div class="visit-pics">${v.pics.map((x) => `<img src="${x}" alt="পরিদর্শনের ছবি">`).join('')}</div>` : ''}<p class="meta">${U.ud(v.doneBy)} · ${U.fmtTime(v.doneAt)}</p>`
    : `<a class="btn ghost sm" href="#/admin/visit/${a.id}">ফলাফল লিখুন</a>`}</div>`;
  }
  function visitSheet(id) {
    const a = Store.data.catAsks.find((x) => x.id === id);
    const s = Store.shopById(a.shopId);
    const div = window.LHArea.divOf(s.zila);
    // those who may visit: the division's own staff first, then verification and the super admin
    const can = (m) => m.active && (m.role === 'super' || m.role === 'verify' || (m.role === 'division' && m.division === div));
    const list = Store.data.team.filter(can).sort((x, y) => Number(y.role === 'division') - Number(x.role === 'division'));
    U.openSheet(`<h2 id="sheet-h">দোকান পরিদর্শন ঠিক করুন</h2><p class="meta">${U.ud(s.name)} · ${subLabel(a.sub)}</p>
      <form id="visit-form" data-id="${id}" novalidate>
        <label class="field"><span>কে যাবেন</span><select id="vf-who">${list.map((m) => `<option value="${m.id}">${U.ud(m.name)} · ${Store.ROLES[m.role]}${m.division ? ' · ' + U.geo(m.division) : ''}</option>`).join('')}</select></label>
        <label class="field"><span>কবে</span><input id="vf-date" type="date" min="${Store.today()}" value="${Store.today()}"></label>
        <small class="err" id="vf-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">ঠিক করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">বাতিল</button>`);
  }
  let visitPics = [];
  let visitFor = '';
  // the page the visitor opens from the work list: where to go, what to look for, and the result with pictures
  function visitPage(id) {
    const a = Store.data.catAsks.find((x) => x.id === id);
    if (!a) return null;
    const s = Store.shopById(a.shopId);
    const me = Store.teamMe();
    const mine = a.visit && a.visit.who === me.id;
    if (!(mine && Store.can('visit', s)) && !Store.can('cats', s)) return window.LHTeam.noPerm();
    if (visitFor !== id) { visitFor = id; visitPics = []; }
    const v = a.visit;
    return `<a class="back" href="#/admin">‹ কাজের তালিকা</a><h1 class="page-h">🏠 দোকান পরিদর্শন</h1>
      <section class="panel">
        <h2 class="tight">${U.ud(s.name)}</h2>
        <p class="meta">📍 ${U.ud(s.address || s.market)} · ${U.geo(s.area)}, ${U.geo(s.zila)}</p>
        <p class="meta">📞 <a href="tel:${U.esc(s.phone)}" translate="no">${U.bn(U.esc(s.phone))}</a> · <a href="${window.LHMap.directions(s.lat, s.lng)}" target="_blank" rel="noopener">🧭 পথ দেখুন</a></p>
        <p><span>যা চাইছেন</span>: <b>${subLabel(a.sub)}</b></p>
        ${a.note ? `<p class="note">${U.ud(a.note)}</p>` : ''}
        <p class="meta">দেখুন: দোকানে এই বিভাগের জিনিস বা সেবা সত্যিই আছে কি না, আর লাইসেন্সে না থাকার কারণ।</p>
        ${s.licence ? licBox(s, 'page') : ''}
      </section>
      ${!v ? '<p class="note gap-t">এখনো পরিদর্শন ঠিক হয়নি।</p>' : v.status === 'done' ? `<section class="panel gap-t">${visitHtml(a, s)}</section>` : `<form id="visit-done" class="panel gap-t" data-id="${id}" novalidate>
        <p class="meta">🏠 ${U.ud(v.whoName)} · ${dayText(v.date)}</p>
        <label class="field"><span>কী দেখলেন</span><textarea id="vd-note" rows="3" maxlength="300"></textarea></label>
        <div class="field"><span class="flabel">ছবি (৩টি পর্যন্ত)</span>
          <label class="btn ghost sm"><input type="file" accept="image/*" capture="environment" data-cat-pic="visit" hidden>📷 ছবি যোগ করুন</label>
          <div class="visit-pics" id="vd-pics">${visitPics.map((x) => `<img src="${x}" alt="পরিদর্শনের ছবি">`).join('')}</div></div>
        <small class="err" id="vd-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">ফলাফল জমা দিন</button>
      </form>`}`;
  }
  function askRow(a) {
    const s = Store.shopById(a.shopId);
    const late = new Date(a.due) < new Date();
    const waited = a.onLicence ? `<span>${U.bn(Math.floor((Date.now() - new Date(a.at).getTime()) / 36e5))}</span> <span>ঘণ্টা ধরে অপেক্ষায়</span>`
      : `<span>${U.bn(Store.workDaysBetween(a.at, new Date()))}</span> <span>কর্মদিবস ধরে অপেক্ষায়</span>`;
    return `<article class="panel ad-row cat-ask ${late ? 'late' : ''}" id="ca-${a.id}">
      <div class="o-head"><div><b>${U.ud(s.name)}</b><small>${U.geo(s.area)}, ${U.geo(s.zila)} · ${U.fmtTime(a.at)}</small></div><span class="tag ${a.onLicence ? 'ok' : ''}">${laneText(a)}</span></div>
      <p><span>চাইছেন</span>: <b>${subLabel(a.sub)}</b></p>
      <p class="meta"><span>এখন আছে</span>: ${Store.subChoices(s).filter((x) => x.state !== 'wait').map((x) => subLabel(x.sub)).join(', ')}</p>
      ${a.note ? `<p class="note">${U.ud(a.note)}</p>` : ''}
      <p class="meta">${waited} · <span>শেষ সময়</span> ${U.fmtTime(a.due)}${late ? ' · <b class="danger-txt">সময় পেরিয়ে গেছে</b>' : ''}</p>
      ${s.licence ? licBox(s, 'page') : '<p class="note">ট্রেড লাইসেন্স নেই</p>'}
      ${visitHtml(a, s)}
      ${Store.can('cats', s) ? `<div class="o-acts"><button type="button" class="btn sm" data-cat="team-ok" data-id="${a.id}">✓ অনুমোদন</button><button type="button" class="btn ghost sm" data-cat="team-no" data-id="${a.id}">বাতিল</button></div>` : ''}
    </article>`;
  }
  const openAll = () => Store.data.catAsks.filter((a) => a.status === 'open');
  function adminAsks() {
    const list = openAll().filter((a) => window.LHArea.inPick(Store.shopById(a.shopId))).sort((a, b) => a.due.localeCompare(b.due));
    if (!list.length) return '';
    return `<section class="gap-b" id="cat-asks"><h2>🏷️ ক্যাটাগরি অনুমোদন <small>${U.bn(list.length)}</small></h2>
      <p class="meta gap">লাইসেন্সে লেখা থাকলে ২৪ ঘণ্টার মধ্যে, না থাকলে ৭ কর্মদিবসের মধ্যে সিদ্ধান্ত দিন। শুক্র ও শনিবার ছুটি।</p>
      <div class="stack">${list.map(askRow).join('')}</div></section>`;
  }
  // a line on each agent's card in the team's list
  function adminLine(s) {
    return `<p class="meta">🏷️ ${Store.subChoices(s).filter((x) => x.state !== 'wait').map((x) => subLabel(x.sub)).join(', ')}${s.licence ? ' · 📄 <span>লাইসেন্স আছে</span>' : ''}
      ${Store.can('cats', s) ? `<button type="button" class="inline" data-cat="team-cats" data-shop="${s.id}">ক্যাটাগরি বদলান</button>` : ''}</p>`;
  }
  function teamCatsSheet(s) {
    U.openSheet(`<h2 id="sheet-h">ক্যাটাগরি: ${U.ud(s.name)}</h2>
      <ul class="cat-list">
        <li><span class="cat-name">${subLabel(s.sub)}</span><small>মূল ক্যাটাগরি</small></li>
        ${(s.extra || []).map((x) => `<li><span class="cat-name">${subLabel(x.sub)}</span><button type="button" class="inline danger-txt" data-cat="team-drop" data-shop="${s.id}" data-sub="${U.esc(x.sub)}">বাদ দিন</button></li>`).join('')}
      </ul>
      <form id="cat-add" data-shop="${s.id}" novalidate>
        <label class="field"><span>সরাসরি যোগ করুন</span><select id="cg-sub"><option value="">বেছে নিন</option>${subOptions(Store.subChoices(s).filter((x) => x.state !== 'wait').map((x) => x.sub))}</select></label>
        <small class="err" id="cg-err" role="alert"></small>
        <button type="submit" class="btn block sheet-go">যোগ করুন</button>
      </form>
      ${s.licence ? `<div class="gap-t">${licBox(s, 'sheet')}</div>` : ''}
      <button type="button" class="link" data-action="close-sheet">বন্ধ করুন</button>`);
  }
  // the team takes a category off a shop only with a reason, which goes in the log
  function dropSheet(s, sub) {
    U.openSheet(`<h2 id="sheet-h">${subLabel(sub)} <span>বাদ দেবেন?</span></h2><p class="meta">${U.ud(s.name)}</p>
      <p>এই বিভাগের পণ্য গ্রাহক আর দেখবেন না। কারণ লগে থাকবে।</p>
      <form id="cat-drop" data-shop="${s.id}" data-sub="${U.esc(sub)}" novalidate>
        <label class="field"><span>কারণ</span><input id="cd-why" type="text" maxlength="200"></label>
        <small class="err" id="cd-err" role="alert"></small>
        <button type="submit" class="btn block danger-fill">বাদ দিন</button>
      </form>
      <button type="button" class="link" data-cat="team-cats" data-shop="${s.id}">না, থাক</button>`);
  }
  function refuseSheet(id) {
    U.openSheet(`<h2 id="sheet-h">অনুরোধ বাতিল করবেন?</h2>
      <form id="cat-no" data-id="${id}" novalidate>
        <label class="field"><span>কারণ (এজেন্ট দেখবেন)</span><input id="cn-why" type="text" maxlength="200" placeholder="যেমন: লাইসেন্সে এই ব্যবসার কথা নেই"></label>
        <small class="err" id="cn-err" role="alert"></small>
        <button type="submit" class="btn block danger-fill">বাতিল করুন</button>
      </form>
      <button type="button" class="link" data-action="close-sheet">না, থাক</button>`);
  }

  /* ---------- sign up: the other categories the shop sells, with its trade licence ---------- */
  function signupFields(mainSub, errHtml) {
    if (!mainSub || Store.ownPanel(mainSub)) return '';
    su.extra = su.extra.filter((x) => x.sub !== mainSub);
    if (!su.open) return `<button type="button" class="btn ghost block gap-t" data-cat="su-open">+ আর কী কী বিক্রি করেন? <i>(ঐচ্ছিক)</i></button>`;
    const skip = [mainSub].concat(su.extra.map((x) => x.sub));
    return `<section class="panel su-cats gap-t" id="su-cats">
      <h2 class="tight">আর কী কী বিক্রি করেন? <i>(ঐচ্ছিক)</i></h2>
      <p class="meta">যেমন মুদি দোকানে খাতা-কলমও থাকলে "স্টেশনারি"। ট্রেড লাইসেন্সে লেখা থাকলে ২৪ ঘণ্টার মধ্যে যোগ হবে, না থাকলে ৫–৭ কর্মদিবসে টিম যাচাই করবে।</p>
      <div class="add-row"><select id="su-sub" aria-label="ক্যাটাগরি ও সাব-ক্যাটাগরি"><option value="">বেছে নিন</option>${subOptions(skip)}</select><button type="button" class="btn ghost" data-cat="su-add">যোগ করুন</button></div>
      ${su.extra.length ? `<ul class="cat-list">${su.extra.map((x, i) => `<li><span class="cat-name">${subLabel(x.sub)}</span><label class="chk"><input type="checkbox" data-cat-on="${i}" ${x.onLicence ? 'checked' : ''}><span>লাইসেন্সে লেখা আছে</span></label><button type="button" class="inline danger-txt" data-cat="su-del" data-i="${i}">বাদ দিন</button></li>`).join('')}</ul>
        ${licenceFields(su.no, su.pic, 'su')}` : ''}
      ${errHtml || ''}
    </section>`;
  }
  // an error for the sign up form, or nothing
  function signupCheck() {
    if (!su.extra.length) return '';
    try { Store.checkLicence({ no: su.no, pic: su.pic }); } catch (ex) { return ex.message; }
    return '';
  }
  function signupDone(shopId, mainSub) {
    const list = su.extra.filter((x) => x.sub !== mainSub);
    if (list.length) Store.signupAsks(shopId, { no: su.no, pic: su.pic }, list);
    su = freshSignup();
  }

  /* ---------- events ---------- */
  async function readPic(input) {
    const file = input.files[0];
    const prefix = input.dataset.catPic;
    input.value = '';
    if (!file) return;
    if (prefix === 'visit') {
      try {
        const shot = (await window.LHImage.readWhole(file)).image;
        if (visitPics.length < 3) visitPics.push(shot);
        $('vd-pics').innerHTML = visitPics.map((x) => `<img src="${x}" alt="পরিদর্শনের ছবি">`).join('');
      } catch (ex) { $('vd-err').textContent = ex.message; }
      return;
    }
    try {
      const pic = (await window.LHImage.readWhole(file)).image;
      if (prefix === 'su') su.pic = pic; else licPic = pic;
      $(prefix + '-lic-prev').innerHTML = `<img src="${pic}" alt="">`;
      $(prefix + '-pic-err').textContent = '';
    } catch (ex) { $(prefix + '-pic-err').textContent = ex.message; }
  }
  function onClick(e) {
    const el = e.target.closest('[data-cat]');
    if (!el) return;
    const d = el.dataset;
    try {
      switch (d.cat) {
        case 'su-open': su.open = true; U.route(true); break;
        case 'su-add': { const sub = $('su-sub').value; if (!sub) { U.toast('ক্যাটাগরি ও সাব-ক্যাটাগরি বেছে নিন'); break; } su.extra.push({ sub, onLicence: false }); U.route(true); break; }
        case 'su-del': su.extra.splice(Number(d.i), 1); U.route(true); break;
        case 'ask': askSheet(myShop()); break;
        case 'licence': licenceSheet(myShop()); break;
        case 'withdraw': Store.catWithdraw(myShop().id, d.id); U.toast('অনুরোধ তুলে নেওয়া হয়েছে'); U.route(true); break;
        case 'drop':
          U.openSheet(`<h2 id="sheet-h">${U.esc(d.sub)} <span>বাদ দেবেন?</span></h2><p>এই বিভাগের পণ্য গ্রাহক আর দেখবেন না। আবার চাইলে অনুরোধ করতে পারবেন, সমস্যা হলে সাপোর্টে জানান।</p>
            <button type="button" class="btn block danger-fill" data-cat="drop-yes" data-sub="${U.esc(d.sub)}">হ্যাঁ, বাদ দিন</button>
            <button type="button" class="link" data-action="close-sheet">না, থাক</button>`);
          break;
        case 'drop-yes': Store.catDrop(myShop().id, d.sub); U.closeSheet(); U.toast('ক্যাটাগরি বাদ দেওয়া হয়েছে'); U.route(true); break;
        case 'team-ok': Store.catDecide(d.id, true); U.toast('অনুমোদন দেওয়া হয়েছে'); U.route(true); break;
        case 'team-no': refuseSheet(d.id); break;
        case 'team-cats': teamCatsSheet(Store.shopById(d.shop)); break;
        case 'team-drop': dropSheet(Store.shopById(d.shop), d.sub); break;
        case 'visit-plan': visitSheet(d.id); break;
        case 'lic-see': {
          const s = Store.shopById(d.shop);
          Store.teamSeeDocs('licence', Store.placeOfShop(s));
          licSeen.add(s.id);
          if (d.where === 'sheet') teamCatsSheet(s); else U.route(true);
          break;
        }
      }
    } catch (ex) { U.toast(ex.message); }
  }
  function onChange(e) {
    const t = e.target;
    if (t.dataset && t.dataset.catPic) { readPic(t); return; }
    if (t.dataset && t.dataset.catOn !== undefined) su.extra[Number(t.dataset.catOn)].onLicence = t.checked;
  }
  function onInput(e) {
    if (e.target.dataset && e.target.dataset.catIn === 'su') su.no = e.target.value;
  }
  function onSubmit(e) {
    const f = e.target;
    const show = (id, ex) => { $(id).textContent = ex.message; };
    if (f.id === 'cat-ask') {
      e.preventDefault();
      const s = myShop();
      const sub = $('ca-sub').value;
      try {
        if (!sub) throw new Error('ক্যাটাগরি ও সাব-ক্যাটাগরি বেছে নিন');
        if (!s.licence) Store.setLicence(s.id, { no: $('ca-lic-no').value, pic: licPic });
        const a = Store.catAsk(s.id, { sub, note: $('ca-note').value, onLicence: $('ca-lic').checked });
        U.closeSheet();
        U.toast(a.onLicence ? 'অনুরোধ পাঠানো হয়েছে, ২৪ ঘণ্টার মধ্যে সিদ্ধান্ত' : 'অনুরোধ পাঠানো হয়েছে, ৫–৭ কর্মদিবসে সিদ্ধান্ত');
        U.route(true);
      } catch (ex) { show('ca-err', ex); }
      return;
    }
    if (f.id === 'cat-lic') {
      e.preventDefault();
      const s = myShop();
      try {
        Store.setLicence(s.id, { no: $('lc-lic-no').value, pic: licPic || (s.licence ? s.licence.pic : '') });
        U.closeSheet();
        U.toast('ট্রেড লাইসেন্স সংরক্ষিত');
        U.route(true);
      } catch (ex) { show('lc-err', ex); }
      return;
    }
    if (f.id === 'cat-no') {
      e.preventDefault();
      try { Store.catDecide(f.dataset.id, false, $('cn-why').value); U.closeSheet(); U.toast('অনুরোধ বাতিল করা হয়েছে'); U.route(true); } catch (ex) { show('cn-err', ex); }
      return;
    }
    if (f.id === 'visit-form') {
      e.preventDefault();
      try { Store.visitPlan(f.dataset.id, $('vf-who').value, $('vf-date').value); U.closeSheet(); U.toast('পরিদর্শন ঠিক হয়েছে'); U.route(true); } catch (ex) { show('vf-err', ex); }
      return;
    }
    if (f.id === 'visit-done') {
      e.preventDefault();
      try { Store.visitDone(f.dataset.id, $('vd-note').value, visitPics); visitPics = []; U.toast('ফলাফল জমা হয়েছে'); location.hash = '#/admin'; } catch (ex) { show('vd-err', ex); }
      return;
    }
    if (f.id === 'cat-drop') {
      e.preventDefault();
      try { Store.catDrop(f.dataset.shop, f.dataset.sub, $('cd-why').value, true); U.toast('ক্যাটাগরি বাদ দেওয়া হয়েছে'); teamCatsSheet(Store.shopById(f.dataset.shop)); U.route(true); } catch (ex) { show('cd-err', ex); }
      return;
    }
    if (f.id === 'cat-add') {
      e.preventDefault();
      try { Store.catGrant(f.dataset.shop, $('cg-sub').value); U.toast('ক্যাটাগরি যোগ হয়েছে'); teamCatsSheet(Store.shopById(f.dataset.shop)); U.route(true); } catch (ex) { show('cg-err', ex); }
    }
  }
  function init(ui) {
    U = ui;
    document.addEventListener('click', onClick);
    document.addEventListener('change', onChange);
    document.addEventListener('input', onInput);
    document.addEventListener('submit', onSubmit);
    window.addEventListener('hashchange', () => licSeen.clear());
  }
  return { init, ownerSection, adminAsks, adminLine, openAll, signupFields, signupCheck, signupDone, subLabel, visitPage };
})();

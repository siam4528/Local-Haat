// Ratings: a customer rates the shop or service provider, and the delivery man, once per finished order.
// Nothing is seeded: a rating only comes from a real finished order, so a profile with none says "new".
window.LHRate = (function () {
  'use strict';
  const Store = window.LHStore;
  let U;

  // what each star means, shown as soon as one is pressed
  const WORDS = ['', 'মোটেও ভালো না', 'তেমন ভালো না', 'ভালো', 'খুব ভালো', 'অসাধারণ'];
  const stars = (n) => `<span class="stars" role="img" aria-label="${U.bn(n)} তারা">${'★'.repeat(n)}<i>${'☆'.repeat(5 - n)}</i></span>`;
  // "⭐ ৪.৫ (১২)", or the given words when nobody has rated yet
  function badge(about, id, none) {
    const r = Store.ratingSummary(about, id);
    return r.n ? `⭐ ${U.bn(r.avg)} (${U.bn(r.n)})` : none;
  }
  function listHtml(about, id) {
    const list = Store.ratingsOf(about, id);
    if (!list.length) return '<p class="meta">এখনো কেউ রেটিং দেননি। অর্ডার সম্পন্ন হওয়ার পর গ্রাহক রেটিং দিতে পারেন।</p>';
    const r = Store.ratingSummary(about, id);
    return `<p class="rate-sum"><b>${U.bn(r.avg)}</b>${stars(Math.round(r.avg))}<small>${U.bn(r.n)}টি রেটিং</small></p>
      <ul class="rate-list">${list.slice(0, 20).map((x) => `<li>${stars(x.stars)}${x.text ? `<p>${U.ud(x.text)}</p>` : ''}<small>${U.ud(x.by)} · ${U.fmtTime(x.at)}</small></li>`).join('')}</ul>`;
  }
  function formHtml(o, about, title) {
    return `<form class="rate-form" data-rate="${about}" data-code="${o.code}" novalidate>
      <fieldset class="rate-stars"><legend>${title}</legend>
        ${[1, 2, 3, 4, 5].map((n) => `<label data-n="${n}"><input type="radio" class="sr" name="rate-${o.code}-${about}" value="${n}"><span aria-hidden="true">★</span><span class="sr">${U.bn(n)} তারা, ${WORDS[n]}</span></label>`).join('')}
      </fieldset>
      <p class="rate-word" aria-hidden="true"></p>
      <label class="field"><span>মতামত (ঐচ্ছিক)</span><textarea rows="2" maxlength="300"></textarea></label>
      <small class="err" role="alert"></small>
      <button type="submit" class="btn block sheet-go">রেটিং দিন</button>
    </form>`;
  }
  const doneHtml = (r, title) => `<div class="rate-done"><b>${title}</b><span>${stars(r.stars)} <span class="rate-word">${WORDS[r.stars]}</span></span>${r.text ? `<p>${U.ud(r.text)}</p>` : ''}${r.hidden ? '<small>লোকালহাট টিম এই রেটিং লুকিয়ে রেখেছে</small>' : ''}</div>`;
  // on the tracking page, for the customer who placed the order
  function panel(o) {
    if (!Store.isFinished(o)) return '';
    const block = (about, title) => { const r = Store.ratingOf(o.code, about); return r ? doneHtml(r, title) : formHtml(o, about, title); };
    return `<section class="panel" id="rate"><h2 class="tight">রেটিং দিন</h2>
      ${block('shop', `${o.mode === 'service' ? '🧰' : '🏪'} ${U.ud(o.shopName)}`)}
      ${o.delivery ? block('rider', `🛵 ${U.ud(o.delivery.name)}`) : ''}
    </section>`;
  }
  const unrated = (o) => Store.isFinished(o) && (!Store.ratingOf(o.code, 'shop') || (o.delivery && !Store.ratingOf(o.code, 'rider')));

  function riderProfile(key) {
    const r = Store.riders().find((x) => x.key === key);
    if (!r) return null;
    const a = r.account;
    return `<a class="back" href="#/" data-rate-back>‹ ফিরে যান</a>
      <section class="panel rider-card">
        <span class="auth-ico" aria-hidden="true">🛵</span>
        <div><h1>${U.ud(r.name)}</h1>${a && a.vehicle ? `<p class="meta">${U.esc(a.vehicle)} · ${U.geo(a.area)}</p>` : '<p class="meta">ডেলিভারি ম্যান</p>'}</div>
        <div class="tags"><span class="tag">${badge('rider', r.phone, 'নতুন, এখনো রেটিং নেই')}</span><span class="tag">${U.bn(r.delivered)}টি ডেলিভারি সম্পন্ন</span></div>
      </section>
      <section class="panel gap-t"><h2 class="tight">রেটিং ও মতামত</h2>${listHtml('rider', r.phone)}</section>`;
  }

  function onChange(e) {
    const box = e.target.closest && e.target.closest('.rate-stars');
    if (!box) return;
    const n = Number(e.target.value);
    box.querySelectorAll('label').forEach((l) => l.classList.toggle('on', Number(l.dataset.n) <= n));
    box.closest('form').querySelector('.rate-word').textContent = WORDS[n];
    const err = box.closest('form').querySelector('.err');
    if (err) err.textContent = '';
  }
  function onSubmit(e) {
    const f = e.target;
    if (!f.dataset || !f.dataset.rate) return;
    e.preventDefault();
    const me = window.LHAuth.current('customer');
    const picked = f.querySelector('input:checked');
    if (!picked) { f.querySelector('.err').textContent = 'তারা বেছে নিন'; return; }
    try {
      Store.rate(f.dataset.code, me && me.id, f.dataset.rate, Number(picked.value), f.querySelector('textarea').value);
      U.toast('ধন্যবাদ, রেটিং জমা হয়েছে');
      U.route(true);
    } catch (ex) { f.querySelector('.err').textContent = ex.message; }
  }
  function onClick(e) {
    if (e.target.closest('[data-rate-back]')) { e.preventDefault(); history.back(); }
  }
  function init(ui) {
    U = ui;
    document.addEventListener('change', onChange);
    document.addEventListener('submit', onSubmit);
    document.addEventListener('click', onClick);
  }
  return { init, WORDS, stars, badge, listHtml, panel, unrated, riderProfile };
})();

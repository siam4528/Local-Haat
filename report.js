// Sales reports: each agent's month for the agent and the LocalHaat team, the team's month across agents,
// and an agent's place in its area. Counted from finished orders through LocalHaat (see Store.salesRows).
window.LHReport = (function () {
  'use strict';
  const Store = window.LHStore;
  const U = () => window.LHUI;
  let month = '';
  const MONTHS = 6;

  const thisMonth = () => Store.salesMonths(1)[0];
  const picked = () => (Store.salesMonths(MONTHS).includes(month) ? month : thisMonth());
  const monthName = (m) => new Date(Number(m.slice(0, 4)), Number(m.slice(5, 7)) - 1, 1)
    .toLocaleDateString(window.LHI18n.lang === 'en' ? 'en-GB' : 'bn-BD', { month: 'long', year: 'numeric' });
  function monthChips() {
    return `<div class="chips" role="group" aria-label="মাস">${Store.salesMonths(MONTHS).map((m) => `<button type="button" class="chip ${m === picked() ? 'on' : ''}" aria-pressed="${m === picked()}" data-report-month="${m}">${monthName(m)}</button>`).join('')}</div>`;
  }
  const stat = (value, label) => `<div><b>${value}</b><span>${label}</span></div>`;
  const demoNote = (r) => (r.demo ? '<p class="meta">ডেমো: আগের দিনগুলোর বিক্রি প্রোটোটাইপের নমুনা তথ্য, নতুন অর্ডার তার সাথে যোগ হয়।</p>' : '');

  // one agent: the month, the last six months, what sold, and the place in the area
  function shopPage(shopId, forTeam) {
    const H = U();
    const s = Store.shopById(shopId);
    if (!s) return null;
    const rows = Store.salesRows();
    const m = picked();
    const r = Store.salesReport(s.id, m, rows);
    const past = Store.salesMonths(MONTHS).map((x) => Store.salesReport(s.id, x, rows));
    const top = Math.max(1, ...past.map((x) => x.sales));
    const rank = Store.shopRank(s.id, rows);
    return `${forTeam ? '<a class="back" href="#/admin/report">‹ সব এজেন্টের রিপোর্ট</a>' : '<a class="back" href="#/owner">‹ অর্ডারে ফিরুন</a>'}
      <h1 class="page-h">📊 ${forTeam ? H.ud(s.name) : 'বিক্রির রিপোর্ট'}</h1>
      <p class="meta gap">${forTeam ? `${H.geo(s.area)}, ${H.geo(s.zila)} · ` : ''}লোকালহাটের মাধ্যমে সম্পন্ন অর্ডার</p>
      ${monthChips()}
      <div class="stats rep-stats">
        ${stat(H.tk(r.sales), 'মোট বিক্রি')}
        ${stat(H.bn(r.orders), 'সম্পন্ন অর্ডার')}
        ${stat(H.bn(r.cancelled), 'বাতিল হয়েছে')}
        ${stat(r.orders ? H.tk(Math.round(r.sales / r.orders)) : '–', 'গড় অর্ডার')}
      </div>
      ${moneyHtml(r, forTeam)}
      ${Store.setupOf(s) === 'launch' ? window.LHLaunch.channelHtml(s.id, m) : ''}
      ${demoNote(r)}
      <div class="two rep-two">
        <section class="panel">
          <h2 class="tight">মাস অনুযায়ী</h2>
          <ul class="rep-months">${past.map((x) => `<li class="${x.month === m ? 'on' : ''}"><span>${monthName(x.month)}</span>
            <span class="rep-bar" aria-hidden="true"><i class="w${Math.round((x.sales / top) * 10)}"></i></span>
            <b>${H.tk(x.sales)}</b><small>${H.bn(x.orders)}টি অর্ডার</small></li>`).join('')}</ul>
        </section>
        <section class="panel">
          <h2 class="tight">${monthName(m)}: বেশি বিক্রি</h2>
          ${r.items.length ? `<ol class="rep-items">${r.items.map(([name, qty]) => `<li><span>${H.ud(name)}</span><b>× ${H.bn(qty)}</b></li>`).join('')}</ol>` : '<p class="meta">এই মাসে এখনো কিছু বিক্রি হয়নি।</p>'}
        </section>
      </div>
      ${rankHtml(s, rank, forTeam)}`;
  }
  // The month's money: LocalHaat's commission, what the agent earned, and who pays whom at the end of it.
  // Cash on delivery and online payments come to LocalHaat; money paid at the shop stays with the agent.
  function moneyHtml(r, forTeam) {
    const H = U();
    const owe = r.balance;
    return `<section class="panel rep-money">
      <div class="sum"><span><span>লোকালহাট কমিশন</span> (${H.bn(Store.data.commission)}%)</span><b>−${H.tk(r.commission)}</b></div>
      ${r.kept ? `<div class="sum"><span><span>বাতিল টিকেটে কেটে রাখা</span> (<span>লোকালহাট পায়</span> ${H.bn(Store.KEEP_SHARE)}%)</span><b>${H.tk(r.kept)}</b></div>` : ''}
      <div class="sum total"><span>${forTeam ? 'এজেন্টের আয়' : 'আপনার আয়'}</span><b>${H.tk(r.sales + (r.kept || 0) - r.commission)}</b></div>
      <p class="${owe >= 0 ? 'good' : 'note'} gap-t">${owe >= 0 ? `${forTeam ? 'লোকালহাট এজেন্টকে দেবে' : 'লোকালহাট আপনাকে দেবে'}: <b>${H.tk(owe)}</b>` : `${forTeam ? 'এজেন্ট লোকালহাটকে দেবেন' : 'আপনি লোকালহাটকে দেবেন'}: <b>${H.tk(-owe)}</b>`}</p>
      <p class="meta">ক্যাশ অন ডেলিভারি ও অনলাইনের টাকা লোকালহাটের কাছে আসে, দোকানে, কাউন্টারে বা বাসে নেওয়া নগদ এজেন্টের কাছে থাকে। কমিশন বাদ দিয়ে হিসাব। ডেলিভারি চার্জ লোকালহাটের, অফারের ছাড় লোকালহাট দেয়।</p>
    </section>`;
  }
  // where the agent stands among the shops of its own area, by finished orders of the last 30 days
  function rankHtml(s, rank, forTeam) {
    const H = U();
    if (!rank) return '';
    return `<section class="panel gap-t">
      <h2 class="tight">🏆 এলাকায় বিক্রিতে অবস্থান: ${H.geo(s.area)}</h2>
      <p>${rank.rank ? `এলাকায় বিক্রিতে #<b>${H.bn(rank.rank)}</b> · এলাকায় মোট ${H.bn(rank.of)}টি দোকান ও সেবা · গত ৩০ দিনের হিসাব` : 'গত ৩০ দিনে এখনো কোনো অর্ডার সম্পন্ন হয়নি।'}</p>
      ${rank.list.length ? `<ol class="rep-items rep-rank">${rank.list.slice(0, 5).map((x) => `<li class="${x.shop.id === s.id ? 'on' : ''}"><span>#${H.bn(x.rank)} ${H.ud(x.shop.name)}</span><b>${H.bn(x.orders)}টি অর্ডার</b></li>`).join('')}</ol>` : ''}
      ${forTeam ? '' : '<p class="meta gap-t">ইউজাররা হোম পেজ ও ম্যাপে এলাকার সবচেয়ে বেশি বিক্রি করা দোকান দেখেন। ছবি দিন, দাম ঠিক রাখুন, খোলার সময় ঠিক রাখুন এবং অর্ডার দ্রুত গ্রহণ করুন, তাহলে অনলাইনে আরও অর্ডার আসবে।</p>'}
    </section>`;
  }

  // The team: one month by area. A table of the 8 divisions, a division's districts or a district's upazilas, each row opening
  // the next level; under it every agent of the chosen area, biggest first.
  function allPage() {
    const H = U();
    const A = window.LHArea;
    const rows = Store.salesRows();
    const m = picked();
    const report = {};
    Store.data.shops.forEach((s) => { report[s.id] = Store.salesReport(s.id, m, rows); });
    const list = Store.data.shops.filter(A.inPick).map((s) => ({ s, r: report[s.id] })).sort((a, b) => b.r.sales - a.r.sales || b.r.orders - a.r.orders);
    const sum = (k) => list.reduce((a, x) => a + x.r[k], 0);
    const lv = A.levels();
    const riders = Store.riders();
    const area = lv.rows.map((row) => {
      const shops = Store.data.shops.filter(row.has);
      const t = (k) => shops.reduce((a, s) => a + report[s.id][k], 0);
      return { row, sales: t('sales'), orders: t('orders'), commission: t('commission'), agents: shops.length, riders: riders.filter(row.has).length };
    });
    return `<h1 class="page-h">📊 মাসিক বিক্রির রিপোর্ট</h1>
      <p class="meta gap">লোকালহাটের মাধ্যমে প্রতিটি এজেন্টের সম্পন্ন অর্ডার, বিভাগ, জেলা ও উপজেলা অনুযায়ী</p>
      ${monthChips()}
      ${A.filterHtml(Store.data.shops)}
      ${A.crumbs()}
      <div class="stats rep-stats">
        ${stat(H.tk(sum('sales')), 'মোট বিক্রি')}
        ${stat(H.bn(sum('orders')), 'সম্পন্ন অর্ডার')}
        ${stat(H.tk(sum('commission')), 'কমিশন আয়')}
        ${stat(H.tk(sum('fees')), 'ডেলিভারি চার্জ')}
        ${stat(H.tk(sum('offs')), 'অফার ছাড়')}
      </div>
      <p class="meta">লোকালহাটের আয়: কমিশন ও ডেলিভারি চার্জ, অফারের ছাড় বাদে <b>${H.tk(sum('commission') + sum('fees') - sum('offs'))}</b></p>
      ${list.some((x) => x.r.demo) ? demoNote({ demo: true }) : ''}
      <section class="panel gap-t">
        <h2 class="tight">${{ div: 'বিভাগ অনুযায়ী', zila: 'জেলা অনুযায়ী', upa: 'উপজেলা ও থানা অনুযায়ী' }[lv.set]}</h2>
        <div class="table-wrap"><table class="rep-area">
          <thead><tr><th scope="col">${lv.word}</th><th scope="col">মোট বিক্রি</th><th scope="col">অর্ডার</th><th scope="col">কমিশন</th><th scope="col">এজেন্ট</th><th scope="col">ডেলিভারি ম্যান</th></tr></thead>
          <tbody>${area.map((x) => `<tr class="${x.agents || x.riders ? '' : 'none'}"><th scope="row"><button type="button" class="inline" data-area-set="${lv.set}" data-value="${H.esc(x.row.key)}">${x.row.label}</button></th>
            <td>${H.tk(x.sales)}</td><td>${H.bn(x.orders)}</td><td>${H.tk(x.commission)}</td><td>${H.bn(x.agents)}</td><td>${H.bn(x.riders)}</td></tr>`).join('')}</tbody>
        </table></div>
      </section>
      <h2 class="gap-t">এজেন্ট <small>${H.bn(list.length)}</small></h2>
      ${list.length ? `<div class="stack">${list.map((x, i) => `<a class="panel rep-row" href="#/admin/report/${x.s.id}">
        <span class="rep-n">${H.bn(i + 1)}</span>
        <span class="rep-who"><b>${H.ud(x.s.name)}</b><small>${H.geo(x.s.area)}, ${H.geo(x.s.zila)} · <span>${H.geo(A.divOf(x.s.zila))}</span> <span>বিভাগ</span></small></span>
        <span class="rep-num"><b>${H.tk(x.r.sales)}</b><small>${H.bn(x.r.orders)}টি অর্ডার${x.r.cancelled ? ` · ${H.bn(x.r.cancelled)}টি বাতিল` : ''}</small><small><span>কমিশন</span> ${H.tk(x.r.commission)}</small></span>
        <span class="promise-go" aria-hidden="true">›</span></a>`).join('')}</div>` : '<div class="empty"><span aria-hidden="true">📊</span><h3>এই এলাকায় এখনো কোনো এজেন্ট নেই</h3></div>'}`;
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-report-month]');
    if (!b) return;
    month = b.dataset.reportMonth;
    U().route(true);
  });

  return { shopPage, allPage, monthName };
})();

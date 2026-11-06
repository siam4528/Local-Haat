// Browser-only data for the prototype. Status names and rules copy FLOWS and the status routes in server.js,
// so the screens can move to the real API later. Nothing here is secure: it is demo data in localStorage.
window.LHStore = (function () {
  'use strict';
  const KEY = 'lh-preview-v1';
  const emptyCart = () => ({ groups: {} });

  const GEO = {
    s1: [22.6528, 89.7852, 'খানজাহান আলী রোড, বাগেরহাট', '01711000001'], s2: [22.6491, 89.7893, 'পুরাতন বাজার, বাগেরহাট', '01711000002'],
    s3: [22.6562, 89.7821, 'সদর হাসপাতাল রোড, বাগেরহাট', '01711000003'], s4: [22.6489, 89.7898, 'পুরাতন বাজার, বাগেরহাট', '01711000010'],
    s5: [22.6495, 89.7889, 'পুরাতন বাজার, বাগেরহাট', '01711000011'], s6: [22.6482, 89.7886, 'পুরাতন বাজার, বাগেরহাট', '01711000012'],
    s7: [23.8069, 90.3686, 'মিরপুর ১০, ঢাকা', '01711000004'], s8: [23.828, 90.365, 'মিরপুর ১২, ঢাকা', '01711000005'],
    s9: [23.7957, 90.3537, 'মিরপুর ১, ঢাকা', '01711000006'], s10: [23.738, 90.376, 'ধানমন্ডি কাঁচাবাজার, ঢাকা', '01711000008'],
    s11: [23.7461, 90.3742, 'ধানমন্ডি ৮/এ, ঢাকা', '01711000007'], s12: [23.7567, 90.3735, 'ধানমন্ডি ২৭, ঢাকা', '01711000009'],
    s13: [22.6556, 89.7829, 'সদর হাসপাতাল রোড, বাগেরহাট', '01711000013'], s14: [22.6578, 89.7905, 'বাস স্ট্যান্ড, বাগেরহাট', '01711000014'],
    s15: [22.6602, 89.7801, 'ট্রাক স্ট্যান্ড, বাগেরহাট', '01711000015'], s16: [22.6559, 89.7818, 'সদর হাসপাতাল রোড, বাগেরহাট', '01711000016'],
    s17: [23.8072, 90.3679, 'মিরপুর ১০, ঢাকা', '01711000017'], s18: [23.8265, 90.3662, 'মিরপুর ১২, ঢাকা', '01711000018'],
    s19: [23.7571, 90.3741, 'ধানমন্ডি ২৭, ঢাকা', '01711000019'], s20: [22.6486, 89.7881, 'পুরাতন বাজার, বাগেরহাট', '01711000020'],
    s21: [23.7787, 90.4006, 'মহাখালী বাস টার্মিনাল, ঢাকা', '01711000021'], s22: [23.7835, 90.3446, 'গাবতলী বাস টার্মিনাল, ঢাকা', '01711000022'],
    s23: [23.7205, 90.426, 'সায়েদাবাদ বাস টার্মিনাল, ঢাকা', '01711000023'],
    s24: [23.7055, 90.4105, 'সদরঘাট লঞ্চ টার্মিনাল, ঢাকা', '01711000024'], s25: [23.7058, 90.4098, 'সদরঘাট লঞ্চ টার্মিনাল, ঢাকা', '01711000025']
  };
  const G = 'মুদি দোকান', V = 'সবজি বিক্রেতা', M = 'মাছ-মাংসের দোকান', P = 'ফার্মেসি', C = 'পোশাকের দোকান', E = 'ইলেকট্রিশিয়ান', T = 'ট্রাভেল এজেন্সি', K = 'কোচিং সেন্টার', B = 'বিউটি পার্লার', H = 'গৃহকর্মী সেবা', R = 'মোবাইল মেরামত';
  const SUB_OF = {
    'চিনি': G, 'সয়াবিন তেল': G, 'মসুর ডাল': G, 'চা পাতা': G, 'কাপড় কাচার সাবান': G, 'ডিম': G, 'মিনিকেট চাল': G, 'মিনিকেট চাল, ২৫ কেজির বস্তা': G, 'নাজিরশাইল চাল': G, 'আটা': G,
    'আপেল': V, 'কমলা': V, 'সাগর কলা': V, 'খেজুর': V, 'মৌসুমি সবজি প্যাক': V, 'কাঁচা মরিচ': V, 'রুই মাছ': M, 'দেশি মুরগি': M,
    'ফেস মাস্ক (১০ পিস)': P, 'ডিজিটাল থার্মোমিটার': P, 'ওআরএস স্যালাইন': P, 'ব্যান্ডেজ': P,
    'পাঞ্জাবি': C, 'থ্রি-পিস': C, 'সুতি শাড়ি': C, 'গেঞ্জি': C,
    'এলইডি বাল্ব': E, 'এক্সটেনশন বোর্ড': E, 'ফ্যান মেরামত': E, 'ফ্রিজ সার্ভিসিং': 'এসি সার্ভিসিং',
    'হেয়ার কাট': B, 'ফেসিয়াল': B, 'ব্রাইডাল মেকআপ': 'মেকআপ আর্টিস্ট',
    'স্ক্রিন প্রটেক্টর': R, 'চার্জার ক্যাবল': R, 'ডিসপ্লে রিপ্লেসমেন্ট': R, 'ব্যাটারি রিপ্লেসমেন্ট': R,
    'বাসা ডিপ ক্লিনিং': H, 'সোফা ক্লিনিং': 'সোফা ক্লিনিং', 'পানির ট্যাংক ক্লিনিং': H,
    'ফ্রি ট্রায়াল ক্লাস': K, 'স্পোকেন ইংলিশ কোর্স': K, 'এইচএসসি আইসিটি ব্যাচ': K,
    'কক্সবাজার ট্যুর ইনকোয়ারি': T, 'এয়ার টিকেট ইনকোয়ারি': T, 'ভিসা সহায়তা ইনকোয়ারি': 'পাসপোর্ট সহায়তা',
    'ডা. ফারহানা ইয়াসমিন (মেডিসিন)': 'ক্লিনিক', 'ডা. মাহমুদুল করিম (শিশু)': 'ক্লিনিক', 'বাগেরহাট থেকে ঢাকা': 'বাস কাউন্টার', 'বাগেরহাট থেকে খুলনা': 'বাস কাউন্টার'
  };
  function fillSubs(d) {
    // the sub-category a demo item names itself, by item id
    const own = {};
    window.LH.shops.forEach((s) => s.items.forEach((it, i) => { if (it[4] && it[4].sub) own[s.id + '-' + i] = it[4].sub; }));
    d.shops.forEach((s) => {
      const cat = window.LH.cats.find((c) => c.id === s.cat);
      s.items.forEach((it) => {
        const sub = SUB_OF[it.name] || own[it.id] || (it.role ? s.sub : '');
        if (!it.sub && sub && cat && cat.examples.includes(sub)) it.sub = sub;
      });
    });
    return shopCats(d);
  }
  function catOfSub(sub) { return window.LH.cats.find((c) => c.examples.includes(sub)) || null; }
  // v13: a shop's own sub-category, and the others its items were already sold under, taken as approved
  function shopCats(d) {
    d.catAsks = d.catAsks || [];
    d.shops.forEach((s) => {
      s.waiting = s.waiting || [];
      if (s.extra) return;
      const used = s.items.map((it) => it.sub).filter((x) => x && catOfSub(x));
      if (!s.sub) {
        const n = {};
        used.forEach((x) => { n[x] = (n[x] || 0) + 1; });
        const cat = window.LH.cats.find((c) => c.id === s.cat);
        s.sub = Object.keys(n).sort((a, b) => n[b] - n[a])[0] || (cat ? cat.examples[0] : '');
      }
      s.extra = [...new Set(used)].filter((x) => x !== s.sub).map((sub) => ({ cat: catOfSub(sub).id, sub, at: '' }));
    });
    return d;
  }
  // Weekly hours by getDay() (0 is Sunday). Demo values; each owner sets their own in the panel.
  const weekOf = (o, e, off) => [0, 1, 2, 3, 4, 5, 6].map((d) => ((off || []).includes(d) ? { off: true } : { o, e }));
  const SEED_WEEK = { s1: ['00:00', '23:59'], s3: ['00:00', '23:59'], s13: ['09:00', '21:00', [5]], s14: ['06:00', '23:30'], s5: ['10:00', '22:00', [5]],
    s15: ['06:00', '22:00'], s16: ['00:00', '23:59'], s17: ['06:00', '23:30'], s19: ['08:00', '21:00'], s20: ['09:00', '21:00', [5]],
    s21: ['05:30', '23:59'], s22: ['05:30', '23:59'], s23: ['05:30', '23:59'], s24: ['08:00', '23:00'], s25: ['08:00', '23:00'] };
  const seedWeek = (id) => { const w = SEED_WEEK[id] || ['08:00', '23:00']; return weekOf(w[0], w[1], w[2]); };
  const OWNERS = { s1: 'a-owner', s8: 'a-service', s6: 'a-repair', s13: 'a-clinic', s14: 'a-bus', s15: 'a-truck', s18: 'a-garage', s21: 'a-mohakhali', s24: 'a-launch', s25: 'a-launch2' };
  const RIDER = { id: 'r1', name: 'কামাল হোসেন', phone: '01911000001' };
  const hash = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };

  const VERSION = 15;
  const SEED_DELIVERY_FEE = 40;
  const SEED_DELIVERY_NEXT = 20;
  // v9: past the free distance each started kilometre costs more; a big item goes by van or pickup at its own rates
  const SEED_RULES = () => ({ freeKm: 2, perKm: 10, bigFee: 150, bigPerKm: 30 });
  // LocalHaat's share of the price of the items or the agreed bill, in percent
  const SEED_COMMISSION = 5;
  // a refund asked above this many taka needs a second person of the team to approve it
  const SEED_REFUND_LIMIT = 1000;
  const BIG_VEHICLES = ['ভ্যান / রিকশা', 'পিকআপ'];
  // these need a driving licence and a number plate
  const PAPER_VEHICLES = ['মোটরসাইকেল', 'পিকআপ'];
  const PAID_WORD = { bkash: 'বিকাশ', nagad: 'নগদ', card: 'কার্ড' };
  const ZILA_OF = { 'বাগেরহাট সদর': 'বাগেরহাট', 'মিরপুর': 'ঢাকা', 'ধানমন্ডি': 'ঢাকা', 'বনানী': 'ঢাকা', 'দারুস সালাম': 'ঢাকা', 'যাত্রাবাড়ী': 'ঢাকা', 'সূত্রাপুর': 'ঢাকা' };
  const ADMIN_PW = hash('admin1234');
  const SEED_OFFERS = () => [{ id: 'of-local50', title: 'বাজারে ৫০ টাকা ছাড়', code: 'LOCAL50', kind: 'flat', value: 50, minOrder: 300, until: '', active: true }];
  // company delivery men, one for each demo area
  const NEW_RIDERS = () => [
    acc('a-rider2', 'delivery', 'সোহেল', 'রানা', 'sohel.rider', '10000008', '01911000002', { vehicle: 'মোটরসাইকেল', zila: 'ঢাকা', area: 'মিরপুর' }),
    acc('a-rider3', 'delivery', 'জুয়েল', 'আহমেদ', 'juel.rider', '10000009', '01911000003', { vehicle: 'সাইকেল', zila: 'ঢাকা', area: 'ধানমন্ডি' }),
    // a van for the big items of the demo area
    acc('a-rider4', 'delivery', 'মোতালেব', 'শেখ', 'motaleb.van', '10000011', '01911000004', { vehicle: 'ভ্যান / রিকশা', zila: 'বাগেরহাট', area: 'বাগেরহাট সদর' })
  ].map((a) => Object.assign(a, { kyc: { status: 'ok', demo: true } }));
  // v10: each delivery man works around his own point, usually near his bazar, out to the distance he chose
  const RIDER_KM = [2, 3, 5, 8];
  const RIDER_BASE = {
    'a-rider': { addr: 'খানজাহান আলী রোড, বাগেরহাট সদর', market: 'পুরাতন বাজার', lat: 22.6505, lng: 89.7872, km: 5 },
    'a-rider2': { addr: 'মিরপুর ১১, ঢাকা', market: 'মিরপুর ১২ বাজার', lat: 23.8195, lng: 90.3655, km: 5 },
    'a-rider3': { addr: 'ধানমন্ডি ১৫, ঢাকা', market: 'ধানমন্ডি কাঁচাবাজার', lat: 23.744, lng: 90.373, km: 3 },
    'a-rider4': { addr: 'পুরাতন বাজার রোড, বাগেরহাট সদর', market: 'পুরাতন বাজার', lat: 22.649, lng: 89.7895, km: 3 }
  };
  // a moved sub-category takes its shops along: bus counters to travel, workshops and car washes to repair, rent-a-car to transport
  const MOVED = { 'টিকেট কাউন্টার': ['travel', 'বাস কাউন্টার'], 'রিকশা গ্যারেজ': ['repair'], 'অটো ওয়ার্কশপ': ['repair'], 'কার ওয়াশ': ['repair'], 'রেন্ট-এ-কার': ['transport'] };
  const NEW_SHOPS_10 = ['s15', 's16', 's17', 's18', 's19', 's20'];
  const NEW_SHOPS_11 = ['s21', 's22', 's23'];
  // two finished orders, so a rating or a refund request can be tried without running a whole order first
  function demoOrders() {
    const p = window.LH.places[0];
    const ago = (days, minutes) => new Date(Date.now() - days * 864e5 + (minutes || 0) * 6e4).toISOString();
    const steps = (list, days, by) => list.map((status, i) => ({ status, at: ago(days, i * 20), by: by[i], note: '' }));
    const recipient = { name: p.person, phone: '01712345678', line: p.line, lat: p.lat, lng: p.lng };
    return [
      { code: '9000000001', shopId: 's1', shopName: 'রহিম জেনারেল স্টোর', shopIcon: '🛒', customerId: 'a-customer', mode: 'delivery', placeLabel: p.label, recipient, note: '', when: '',
        lines: [{ itemId: 's1-1', name: 'সয়াবিন তেল', unit: '১ লিটার', price: 190, icon: '🫗', qty: 2 }], sub: 380, fee: SEED_DELIVERY_FEE, discount: 0, offerCode: '', total: 380 + SEED_DELIVERY_FEE, pay: 'cod', status: 'delivered',
        history: steps(['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered'], 3, ['customer', 'shop', 'shop', 'delivery', 'delivery']),
        delivery: { id: RIDER.id, name: RIDER.name, phone: RIDER.phone }, pin: '4821', createdAt: ago(3) },
      { code: '9000000002', shopId: 's6', shopName: 'আদর্শ ইলেকট্রনিক্স ও মেরামত', shopIcon: '🔌', customerId: 'a-customer', mode: 'service', book: 'quote', placeLabel: p.label, recipient, note: 'ফ্যান ঘুরছে না', when: ago(5).slice(0, 10) + ' 11:00',
        lines: [{ itemId: 's6-2', name: 'ফ্যান মেরামত', unit: 'ভিজিট চার্জ', price: 200, icon: '🌀', qty: 1 }], sub: 200, fee: 0, total: 600, pay: 'shop', serial: 0, status: 'completed',
        history: steps(['placed', 'confirmed', 'completed'], 5, ['customer', 'shop', 'shop']),
        delivery: null, offer: null, contract: { amount: 600, terms: 'কয়েল বদল', at: ago(5, 10) }, pin: '7305', createdAt: ago(5) }
    ];
  }
  const acc = (id, role, first, last, handle, memberNo, contact, extra) => Object.assign({ id, role, first, last, name: first + ' ' + last, handle, memberNo, contact, pw: hash('demo1234'), verified: true }, extra);
  const NEW_OWNERS = () => [
    acc('a-repair', 'owner', 'আদর্শ', 'মিস্ত্রি', 'adarsha.repair', '10000005', '01711000012', { shopId: 's6' }),
    acc('a-clinic', 'owner', 'সদর', 'চেম্বার', 'sadar.chamber', '10000006', '01711000013', { shopId: 's13' }),
    acc('a-bus', 'owner', 'বাস', 'কাউন্টার', 'bus.counter', '10000007', '01711000014', { shopId: 's14' }),
    acc('a-truck', 'owner', 'খানজাহান', 'ট্রাক', 'khanjahan.truck', '10000012', '01711000015', { shopId: 's15' }),
    acc('a-garage', 'owner', 'রহমান', 'গ্যারেজ', 'rahman.garage', '10000013', '01711000018', { shopId: 's18' }),
    acc('a-mohakhali', 'owner', 'মহাখালী', 'কাউন্টার', 'mohakhali.counter', '10000014', '01711000021', { shopId: 's21' }),
    acc('a-launch', 'owner', 'নদীবন্ধু', 'কাউন্টার', 'nodibondhu.launch', '10000015', '01711000024', { shopId: 's24' }),
    acc('a-launch2', 'owner', 'দ্বীপ', 'কাউন্টার', 'dwip.launch', '10000016', '01711000025', { shopId: 's25' })
  ];
  // data saved by an older version of the prototype gets the new shops and fields, and keeps its orders and edits
  function upgrade(d) {
    if (d.v >= VERSION) return d;
    const fresh = seed();
    fresh.shops.forEach((f) => {
      const s = d.shops.find((x) => x.id === f.id);
      if (!s) { d.shops.push(f); return; }
      if (s.week === undefined) s.week = f.week;
      if (OWNERS[s.id]) s.ownerId = OWNERS[s.id];
      f.items.forEach((fi) => {
        const it = s.items.find((x) => x.id === fi.id);
        // a bus route comes whole with its stops (v11, below); an old seat booking is not turned into one
        if (it && fi.book && fi.book !== 'bus') Object.assign(it, { book: fi.book, slots: fi.slots, cap: fi.cap, multi: fi.multi, price: it.price || fi.price, unit: it.price ? it.unit : fi.unit });
      });
      // v7: a shop keeps the sub-category it signed up with; the demo clinic gets its doctors' details and its tests
      if (s.sub === undefined) {
        s.sub = f.sub;
        f.items.filter((fi) => fi.role).forEach((fi) => {
          const it = s.items.find((x) => x.id === fi.id);
          if (!it) s.items.push(fi);
          else if (!it.role) ['role', 'name', 'degree', 'speciality', 'days', 'oldFee', 'oldRule'].forEach((k) => { if (fi[k] !== undefined) it[k] = fi[k]; });
        });
      }
    });
    NEW_OWNERS().forEach((a) => { if (!d.accounts.some((x) => x.id === a.id)) d.accounts.push(a); });
    d.chats = d.chats || [];
    // the company sets the delivery charge now; orders keep the fee they were placed with
    d.shops.forEach((s) => { delete s.fee; delete s.deliverers; if (s.zila === undefined) s.zila = ZILA_OF[s.area] || ''; });
    NEW_RIDERS().forEach((a) => { if (!d.accounts.some((x) => x.id === a.id)) d.accounts.push(a); });
    d.accounts.filter((a) => a.role === 'delivery' && a.zila === undefined).forEach((a) => { a.zila = ZILA_OF[a.area] || ''; });
    if (d.deliveryFeeNext === undefined) d.deliveryFeeNext = SEED_DELIVERY_NEXT;
    d.riderNotes = d.riderNotes || [];
    d.extraPlaces = d.extraPlaces || [];
    // a cart saved when it could hold one shop becomes a cart of one group
    if (!d.cart || !d.cart.groups) {
      const old = d.cart || {};
      d.cart = emptyCart();
      if (old.shopId && old.lines && Object.keys(old.lines).length) d.cart.groups[old.shopId] = { lines: old.lines, place: d.place, mode: 'delivery' };
    }
    if (d.deliveryFee === undefined) d.deliveryFee = SEED_DELIVERY_FEE;
    if (!d.offers) d.offers = SEED_OFFERS();
    // v8: home page ads and the sample sales of past months
    if (!d.ads) d.ads = SEED_ADS();
    if (!d.pastSales) d.pastSales = demoSales(d.shops);
    d.ratings = d.ratings || [];
    d.support = d.support || [];
    d.riderBlocks = d.riderBlocks || {};
    // v9: charges by distance, the commission, the helpline, notifications, and delivery men's papers
    if (!d.feeRules) d.feeRules = SEED_RULES();
    if (d.commission === undefined) d.commission = SEED_COMMISSION;
    if (!d.helpline) d.helpline = { phone: '' };
    d.notes = d.notes || [];
    // someone the team already let work keeps working; anyone still waiting sends papers first
    d.accounts.filter((a) => a.role === 'delivery' && !a.kyc && a.approved !== false).forEach((a) => { a.kyc = { status: 'ok', demo: true }; });
    fresh.shops.forEach((f) => {
      const s = d.shops.find((x) => x.id === f.id);
      if (s) f.items.filter((fi) => fi.big && !s.items.some((x) => x.id === fi.id)).forEach((fi) => s.items.push(fi));
    });
    // v10: the demo shops follow their category; a shop of a moved sub-category moves with it
    fresh.shops.forEach((f) => { const s = d.shops.find((x) => x.id === f.id); if (s) s.cat = f.cat; });
    d.shops.forEach((s) => {
      const to = MOVED[s.sub];
      if (to) { s.cat = to[0]; if (to[1]) s.sub = to[1]; }
      s.items.forEach((it) => { if (it.sub === 'টিকেট কাউন্টার') it.sub = 'বাস কাউন্টার'; });
    });
    // the demo delivery men get their bazar, their point and their distance
    d.accounts.filter((a) => RIDER_BASE[a.id] && a.lat === undefined).forEach((a) => Object.assign(a, RIDER_BASE[a.id]));
    if (!d.pastSales.some((r) => NEW_SHOPS_10.includes(r.s))) d.pastSales = d.pastSales.concat(demoSales(d.shops.filter((s) => NEW_SHOPS_10.includes(s.id))));
    // v11: a bus counter lists routes with stops; the demo counter's old seat bookings become its routes
    fresh.shops.forEach((f) => {
      const s = d.shops.find((x) => x.id === f.id);
      if (!s) return;
      if (!s.sub && f.sub) s.sub = f.sub;
      if (f.items.some((fi) => fi.book === 'bus') && !s.items.some((it) => it.book === 'bus' && it.stops)) s.items = s.items.filter((it) => it.book !== 'fixed' && it.book !== 'bus').concat(f.items.filter((fi) => fi.book === 'bus'));
    });
    if (!d.pastSales.some((r) => NEW_SHOPS_11.includes(r.s))) d.pastSales = d.pastSales.concat(demoSales(d.shops.filter((s) => NEW_SHOPS_11.includes(s.id))));
    // v12: launch counters keep their launches, routes and trips on the shop; the demo SMS log and the boardings made without a network
    fresh.shops.forEach((f) => { const s = d.shops.find((x) => x.id === f.id); if (s && f.launch && !s.launch) s.launch = f.launch; });
    d.shops.forEach((s) => { if (s.sub === 'লঞ্চ কাউন্টার' && !s.launch) s.launch = lnBlank(); });
    d.sms = d.sms || [];
    d.boardQueue = d.boardQueue || [];
    // v14: districts and upazilas follow the national portal's spelling (geo.js); places saved with an older one move with it
    const now = (x) => (x && Object.hasOwn(window.LH_GEO_OLD || {}, x) ? window.LH_GEO_OLD[x] : x);
    d.shops.concat(d.accounts, d.extraPlaces).forEach((x) => { if (x.zila) x.zila = now(x.zila); if (x.area) x.area = now(x.area); });
    // v15: each person of the team logs in with their own account and a code; the shared password is gone
    d.team = d.team || seedTeam();
    d.audit = d.audit || [];
    if (d.refundLimit === undefined) d.refundLimit = SEED_REFUND_LIMIT;
    delete d.sessions.admin;
    demoOrders().forEach((o) => { if (!d.orders.some((x) => x.code === o.code)) d.orders.push(o); });
    d.nextNo = Math.max(d.nextNo, 10000020);
    d.v = VERSION;
    return d;
  }

  // Home page ads the LocalHaat team runs: a product or a whole shop or service, shown to users in that shop's area.
  const SEED_ADS = () => [
    { id: 'ad1', kind: 'item', shopId: 's1', itemId: 's1-1', text: 'বাজারদরে, সঠিক মাপে', active: true },
    { id: 'ad2', kind: 'item', shopId: 's4', itemId: 's4-3', text: 'নতুন চালান এসেছে', active: true },
    { id: 'ad3', kind: 'shop', shopId: 's13', itemId: '', text: 'টেস্টে ২৫% পর্যন্ত ছাড়', active: true },
    { id: 'ad4', kind: 'shop', shopId: 's8', itemId: '', text: 'মেরামতে ৭ দিনের ওয়ারেন্টি', active: true },
    { id: 'ad5', kind: 'shop', shopId: 's9', itemId: '', text: 'বাসা পরিষ্কারের প্রশিক্ষিত টিম', active: true },
    { id: 'ad6', kind: 'item', shopId: 's10', itemId: 's10-0', text: 'প্রতিদিন সকালের তাজা মাছ', active: true }
  ];
  // Sample sales of the past months, so the reports and the area ranking have something to show in the prototype.
  // Made the same way every time from each shop's id and month. Real orders are added to them as they finish.
  const DEMO_PER_MONTH = { s1: 18, s2: 11, s3: 14, s4: 8, s5: 6, s6: 4, s7: 6, s8: 13, s9: 5, s10: 15, s11: 7, s12: 3, s13: 10, s14: 12, s15: 6, s16: 9, s17: 5, s18: 7, s19: 10, s20: 8, s21: 14, s22: 12, s23: 12 };
  function seeded(text) {
    let a = parseInt(hash(text), 36) >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const dayStr = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  function demoSales(shops) {
    const out = [];
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    shops.forEach((s) => {
      const priced = s.items.filter((it) => it.price > 0);
      if (!DEMO_PER_MONTH[s.id] || !priced.length) return;
      for (let back = 5; back >= 0; back--) {
        const first = new Date(now.getFullYear(), now.getMonth() - back, 1);
        const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
        const last = back ? days : yesterday.getMonth() === first.getMonth() ? yesterday.getDate() : 0;
        if (!last) continue;
        const rnd = seeded(s.id + dayStr(first));
        const n = Math.round(DEMO_PER_MONTH[s.id] * (0.6 + rnd() * 0.8) * (last / days));
        for (let i = 0; i < n; i++) {
          const day = new Date(first.getFullYear(), first.getMonth(), 1 + Math.floor(rnd() * last));
          const lines = [];
          const k = 1 + Math.floor(rnd() * Math.min(3, priced.length));
          for (let j = 0; j < k; j++) {
            const it = priced[Math.floor(rnd() * priced.length)];
            const has = lines.find((l) => l[0] === it.name);
            if (has) has[1] += 1; else lines.push([it.name, it.book ? 1 : 1 + Math.floor(rnd() * 2), it.price]);
          }
          const delivered = s.kind === 'shop' && rnd() < 0.7;
          out.push({ s: s.id, d: dayStr(day), t: lines.reduce((a, l) => a + l[1] * l[2], 0), f: delivered ? 40 : 0, x: rnd() < 0.08 ? 1 : 0, l: lines.map((l) => [l[0], l[1]]) });
        }
      }
    });
    return out;
  }

  // A demo route's stops come as short rows; its price is the fare of the whole route.
  // Function declarations only: the seed runs before the rest of this file.
  function busItem(o) {
    if (o.book !== 'bus' || !o.stops || !Array.isArray(o.stops[0])) return o;
    o.stops = o.stops.map(([name, km, min, lat, lng, phone]) => ({ name, km, min, lat, lng, counter: !!phone, phone: phone || '' }));
    o.price = busFare(o, 0, o.stops.length - 1);
    return o;
  }
  // The fare goes by distance: the kilometres between the two stops at the route's rate, rounded up to 5 taka, never below its least fare.
  function busFare(it, from, to) {
    const km = it.stops[to].km - it.stops[from].km;
    return Math.max(it.minFare || 0, Math.ceil((km * it.rate) / 5 - 1e-9) * 5);
  }
  // A demo launch counter's launches, routes and trips come as short rows (see data.js).
  function launchSeed(l) {
    const end = (e) => ({ name: e[0], lat: e[1], lng: e[2], phone: e[3] || '' });
    return {
      boats: l.boats.map((b) => {
        const floors = b.floors.map(([name, start, single, double, family, vip]) => ({ name, start, counts: { single, double, family, vip } }));
        return { id: b.id, name: b.name, deck: b.deck, floors, cabins: makeCabins(floors), on: true };
      }),
      routes: l.routes.map((r) => ({ id: r.id, from: end(r.from), to: end(r.to), min: r.min, fares: { single: r.fares[0], double: r.fares[1], family: r.fares[2], vip: r.fares[3], deck: r.fares[4] }, path: r.path || [] })),
      rules: l.rules.map((r) => Object.assign({}, r)),
      trips: {},
      holds: [],
      hold: { hours: 3, before: 60 },
      refund: [{ hours: 24, pct: 90 }, { hours: 6, pct: 50 }]
    };
  }
  // a new launch counter: nothing set up yet, the default phone hold and give-back rule
  function lnBlank() {
    return { boats: [], routes: [], rules: [], trips: {}, holds: [], hold: { hours: 3, before: 60 }, refund: [{ hours: 24, pct: 90 }, { hours: 6, pct: 50 }] };
  }
  // Each floor's cabins numbered from its first number, singles first, then doubles, family cabins and VIP suites.
  function makeCabins(floors) {
    const out = [];
    floors.forEach((f, fi) => {
      let no = f.start;
      ['single', 'double', 'family', 'vip'].forEach((type) => {
        for (let i = 0; i < (f.counts[type] || 0); i++) out.push({ no: String(no++), type, floor: fi, off: false });
      });
    });
    return out;
  }
  // a demo test offer runs for some days from the day the demo data is made
  function offerDates(it) {
    if (!it.offer || !it.offer.days) return it;
    const d = new Date(Date.now() + it.offer.days * 864e5);
    it.offer = { price: it.offer.price, until: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') };
    return it;
  }
  function seed() {
    const shops = window.LH.shops.map((s) => {
      const g = GEO[s.id];
      return {
        id: s.id, name: s.name, cat: s.cat, sub: s.sub || '', zila: ZILA_OF[s.area] || '', area: s.area, market: s.market, kind: s.kind, verified: s.verified, about: s.about, icon: s.icon,
        lat: g[0], lng: g[1], address: g[2], phone: g[3], open: true, hidden: false, week: seedWeek(s.id),
        ownerId: OWNERS[s.id] || null,
        items: s.items.map((it, i) => busItem(offerDates(Object.assign({ id: s.id + '-' + i, name: it[0], price: it[1], unit: it[2], icon: it[3], available: true }, it[4])))),
        launch: s.launch ? launchSeed(s.launch) : undefined
      };
    });
    return {
      v: VERSION,
      shops,
      chats: [],
      deliveryFee: SEED_DELIVERY_FEE,
      deliveryFeeNext: SEED_DELIVERY_NEXT,
      feeRules: SEED_RULES(),
      commission: SEED_COMMISSION,
      helpline: { phone: '' },
      notes: [],
      riderNotes: [],
      extraPlaces: [],
      offers: SEED_OFFERS(),
      ads: SEED_ADS(),
      pastSales: demoSales(shops),
      ratings: [],
      support: [],
      riderBlocks: {},
      sms: [],
      boardQueue: [],
      team: seedTeam(),
      audit: [],
      refundLimit: SEED_REFUND_LIMIT,
      accounts: [
        acc('a-customer', 'customer', 'নাফিসা', 'রহমান', 'nafisa.rahman', '10000001', '01811000001'),
        acc('a-owner', 'owner', 'রহিম', 'মিয়া', 'rahim.store', '10000002', '01711000001', { shopId: 's1' }),
        acc('a-service', 'owner', 'জসিম', 'উদ্দিন', 'phone.care', '10000004', '01711000005', { shopId: 's8' }),
        acc('a-rider', 'delivery', 'কামাল', 'হোসেন', 'kamal.rider', '10000003', '01911000001', { vehicle: 'মোটরসাইকেল', zila: 'বাগেরহাট', area: 'বাগেরহাট সদর', kyc: { status: 'ok', demo: true } }),
        ...NEW_OWNERS(),
        ...NEW_RIDERS()
      ].map((a) => Object.assign(a, RIDER_BASE[a.id])),
      orders: demoOrders(),
      sessions: {},
      cart: emptyCart(),
      place: window.LH.places[0].id,
      nextNo: 10000020
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return fillSubs(upgrade(JSON.parse(raw)));
    } catch (e) { /* unreadable storage falls through to a fresh seed */ }
    return fillSubs(seed());
  }

  let data = load();
  // false when the browser refuses, usually because pictures filled its storage
  function save(quiet) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch (e) {
      if (!quiet) window.dispatchEvent(new Event('lh-save-failed'));
      return false;
    }
  }
  function minutes(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
  // a close time before the open time runs past midnight
  function openAt(s, date) {
    if (!s.week) return true;
    const now = date.getHours() * 60 + date.getMinutes();
    const today = s.week[date.getDay()];
    if (today && !today.off) {
      const o = minutes(today.o);
      const e = minutes(today.e);
      if (o <= e ? now >= o && now <= e : now >= o) return true;
    }
    const prev = s.week[(date.getDay() + 6) % 7];
    return !!prev && !prev.off && minutes(prev.e) < minutes(prev.o) && now <= minutes(prev.e);
  }
  const openNow = (s, date) => !!s.open && !s.suspended && openAt(s, date || new Date());
  // a shop closed only by the clock still takes orders for a time it is open; one the agent closed for now does not
  const canBook = (s) => !!s.open && !s.suspended && !s.hidden && (!s.week || s.week.some((w) => w && !w.off));
  // the LocalHaat team can suspend a shop; an unverified owner's shop is hidden until the owner verifies
  const shopLive = (s) => !s.hidden && !s.suspended;
  const bnNum = (n) => String(n).replace(/\d/g, (c) => '০১২৩৪৫৬৭৮৯'[c]);
  const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const FULL = 'ব্রাউজারের জায়গা শেষ। কিছু ছবি মুছে আবার চেষ্টা করুন।';
  function commit(undo) {
    if (save(true)) return;
    undo();
    save(true);
    fail(FULL);
  }
  function reset() { data = fillSubs(seed()); save(); }
  function reload() { data = load(); }

  const fail = (m) => { throw new Error(m); };
  const shopById = (id) => data.shops.find((s) => s.id === id);
  const orderBy = (code) => data.orders.find((o) => o.code === code) || fail('অর্ডার পাওয়া যায়নি');
  const FINAL = ['delivered', 'completed', 'cancelled'];
  const isFinal = (o) => FINAL.includes(o.status);

  const FLOWS = {
    delivery: ['placed', 'confirmed', 'packed', 'out_for_delivery', 'delivered'],
    pickup: ['placed', 'confirmed', 'packed', 'completed'],
    service: ['placed', 'confirmed', 'completed']
  };
  const LABELS = {
    placed: 'অর্ডার পাঠানো হয়েছে',
    confirmed: 'দোকান অর্ডার গ্রহণ করেছে',
    packed: 'পণ্য প্রস্তুত, ডেলিভারি ম্যানের অপেক্ষায়',
    out_for_delivery: 'ডেলিভারি ম্যান পণ্য নিয়ে রওনা হয়েছে',
    delivered: 'ডেলিভারি সম্পন্ন',
    completed: 'সম্পন্ন',
    // not plain "বাতিল", which is also the cancel button and reads "Cancel" in English
    cancelled: 'বাতিল হয়েছে'
  };
  function label(o, st) {
    if (o.mode === 'pickup' && st === 'packed') return 'পণ্য প্রস্তুত, দোকান থেকে নিয়ে নিন';
    if (o.book === 'bus' && st === 'placed') return 'টিকেট চাওয়া হয়েছে';
    if (o.book === 'bus' && st === 'confirmed') return 'টিকেট নিশ্চিত';
    if (o.book === 'bus' && st === 'completed') return 'গাড়িতে উঠেছেন';
    if (o.book === 'launch' && st === 'placed') return 'টিকেট চাওয়া হয়েছে';
    if (o.book === 'launch' && st === 'confirmed') return 'টিকেট নিশ্চিত';
    if (o.book === 'launch' && st === 'completed') return 'লঞ্চে উঠেছেন';
    if (o.book && st === 'placed') return 'বুকিং অনুরোধ পাঠানো হয়েছে';
    if (o.book && st === 'confirmed') return 'বুকিং নিশ্চিত হয়েছে';
    if (o.mode === 'service' && st === 'confirmed') return 'সেবা নিশ্চিত হয়েছে';
    return LABELS[st];
  }
  const flow = (o) => FLOWS[o.mode];
  function next(o) {
    const f = flow(o);
    return f[f.indexOf(o.status) + 1] || null;
  }
  // what the customer hears about a step taken by someone else
  const TELL = { confirmed: 'confirmed', out_for_delivery: 'onway', delivered: 'done', completed: 'done', cancelled: 'cancelled' };
  function push(o, st, by, note) {
    o.status = st;
    o.history.push({ status: st, at: new Date().toISOString(), by, note: note || '' });
    // the delivery man's position is shared only while the goods are on the way
    if (FINAL.includes(st)) delete o.live;
    const tell = st === 'packed' && o.mode === 'pickup' ? 'ready' : TELL[st];
    if (tell && by !== 'customer') notify(o.customerId, tell, o.code);
    if (st === 'cancelled' && by === 'customer') notifyShop(o, 'cancelled');
    save();
  }

  /* ---------- delivery charge: by distance; a big item goes by van or pickup ---------- */
  const placeById = (id) => window.LH.places.concat(data.extraPlaces).find((p) => p.id === id) || window.LH.places[0];
  // straight-line distance; the real app can ask a road map for the distance by road
  function kmBetween(a, b) {
    const rad = (x) => (x * Math.PI) / 180;
    const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(h));
  }
  const hasBig = (shop, lines) => Object.keys(lines).some((id) => { const it = shop.items.find((x) => x.id === id); return !!(it && it.big); });
  const canCarry = (a, o) => !o.big || BIG_VEHICLES.includes(a.vehicle);
  // The first shop delivering to an address pays the full charge, each further shop to that address the lower one.
  // Past the free distance each started kilometre adds to it. A shop with a big item sends its own van or pickup.
  // Pickup and service shops pay none. It can only be worked out once the cart and its addresses are known.
  function deliveryQuote() {
    const seen = new Set();
    const r = data.feeRules;
    const out = {};
    Object.entries(data.cart.groups).forEach(([shopId, g]) => {
      const shop = shopById(shopId);
      if (!shop || shop.kind === 'service') { out[shopId] = { fee: 0, km: 0, big: false }; return; }
      const big = hasBig(shop, g.lines);
      if (g.mode === 'pickup') { out[shopId] = { fee: 0, km: 0, big }; return; }
      const km = Math.round(kmBetween(shop, placeById(g.place)) * 10) / 10;
      const extra = Math.max(0, Math.ceil(km - r.freeKm - 1e-9));
      const fee = big ? r.bigFee + extra * r.bigPerKm : (seen.has(g.place) ? data.deliveryFeeNext : data.deliveryFee) + extra * r.perKm;
      if (!big) seen.add(g.place);
      out[shopId] = { fee, km, big };
    });
    return out;
  }
  function deliveryFees() {
    const fees = {};
    Object.entries(deliveryQuote()).forEach(([id, q]) => { fees[id] = q.fee; });
    return fees;
  }
  // Paying online works only when the bill is known now: not for a service, and not for an item whose price the shop gives later.
  function onlineOk(built) {
    if (built.some((x) => x.mode === 'service' || x.lines.some((l) => !l.price))) fail('সেবা বা পরে দাম ঠিক হবে এমন জিনিসে অনলাইনে টাকা দেওয়া যাবে না, হাতে টাকা দিন');
  }
  // The same checks as placing the orders, so the payment page opens only for orders that will go through. Returns the amount to pay.
  function checkOrders(customerId, details, offerCode, method) {
    if (method && !PAID_WORD[method]) fail('কিভাবে টাকা দেবেন, বেছে নিন');
    const { built } = buildOrders(customerId, details, offerCode);
    if (method) onlineOk(built);
    return built.reduce((a, x) => a + x.sub + x.fee - x.discount, 0);
  }
  // One order per shop. Everything is checked first, so one refusal leaves the whole cart as it was.
  // payment: { method, trx } when the customer paid online, before the orders were placed
  function placeOrders(customerId, details, offerCode, payment) {
    if (payment && !PAID_WORD[payment.method]) fail('কিভাবে টাকা দেবেন, বেছে নিন');
    const { built, applied } = buildOrders(customerId, details, offerCode);
    if (payment) onlineOk(built);
    const at = new Date().toISOString();
    const group = 'g' + Date.now().toString(36);
    const made = built.map((x) => {
      const o = {
        code: newCode(), group, shopId: x.shop.id, shopName: x.shop.name, shopIcon: x.shop.icon, customerId, mode: x.mode,
        placeLabel: x.d.placeLabel, recipient: x.d.recipient, note: x.d.note, when: x.d.when || '', lines: x.lines, sub: x.sub, fee: x.fee, discount: x.discount, offerCode: x.discount ? applied.code : '', total: x.sub + x.fee - x.discount,
        pay: payment ? payment.method : x.mode === 'delivery' ? 'cod' : 'shop', km: x.km, big: x.big, rate: data.commission,
        status: 'placed', history: [{ status: 'placed', at, by: 'customer', note: '' }], delivery: null,
        pin: String(Math.floor(1000 + Math.random() * 9000)), createdAt: at
      };
      if (payment) o.paid = { method: payment.method, trx: String(payment.trx || '').slice(0, 20), at };
      data.orders.unshift(o);
      return o;
    });
    const notesBefore = data.notes.length;
    made.forEach((o) => notifyShop(o, 'new'));
    const before = data.cart;
    data.cart = emptyCart();
    commit(() => { data.orders.splice(0, made.length); data.cart = before; data.notes.splice(0, data.notes.length - notesBefore); });
    return made;
  }
  function buildOrders(customerId, details, offerCode) {
    const entries = Object.entries(data.cart.groups);
    if (!entries.length) fail('কার্ট খালি');
    const quote = deliveryQuote();
    const built = entries.map(([shopId, g]) => {
      const shop = shopById(shopId) || fail('দোকান পাওয়া যায়নি');
      const d = details[shopId] || fail('ঠিকানা দিন');
      if (!canBook(shop)) fail('দোকানটি সাময়িকভাবে বন্ধ আছে');
      // an order for later: picked up, delivered or served at a time the shop is open
      if (d.when) {
        const at = new Date(d.when.replace(' ', 'T'));
        if (Number.isNaN(at.getTime()) || at < new Date()) fail('এই সময় পার হয়ে গেছে, পরের কোনো সময় দিন');
        if (!openAt(shop, at)) fail('ওই সময় দোকান বন্ধ থাকে, খোলার সময়ের মধ্যে দিন');
      } else if (!openNow(shop)) fail('দোকান এখন বন্ধ, কখন চান সেই সময় দিন');
      const lines = Object.entries(g.lines).map(([id, qty]) => {
        const it = shop.items.find((x) => x.id === id);
        return it && it.available ? { itemId: id, name: it.name, unit: it.unit, price: it.price, icon: it.icon, qty } : null;
      }).filter(Boolean);
      if (!lines.length) fail('কার্ট খালি');
      const mode = shop.kind === 'service' ? 'service' : g.mode;
      const q = quote[shopId];
      return { shop, lines, mode, fee: q.fee, km: q.km, big: q.big, sub: lines.reduce((a, l) => a + l.price * l.qty, 0), discount: 0, d };
    });
    const applied = offerCode ? offerQuote(offerCode, customerId, built.reduce((a, x) => a + x.sub, 0)) : null;
    let left = applied ? applied.off : 0;
    built.slice().sort((a, b) => b.sub - a.sub).forEach((x) => { x.discount = Math.min(left, x.sub); left -= x.discount; });
    return { built, applied };
  }

  // An area found in the location search, kept like a saved address. Only the newest few stay, unless the cart uses them.
  function addAreaPlace(zila, area) {
    const found = data.extraPlaces.find((p) => p.zila === zila && p.area === area);
    if (found) return found;
    const shop = data.shops.find((x) => x.zila === zila && x.area === area);
    const pos = shop ? [shop.lat, shop.lng] : window.LH_GEO_POS[zila] || fail('জেলা বেছে নিন');
    const p = { id: 'ar' + hash(zila + '|' + area), label: area, icon: '📍', zila, area, line: area + ', ' + zila, person: '', lat: pos[0], lng: pos[1], custom: true };
    const old = data.extraPlaces;
    const used = new Set(Object.values(data.cart.groups).map((g) => g.place).concat(data.place));
    const spare = old.find((x) => !used.has(x.id));
    data.extraPlaces = (old.length >= 5 && spare ? old.filter((x) => x !== spare) : old).concat(p);
    commit(() => { data.extraPlaces = old; });
    return p;
  }

  /* ---------- bookings ---------- */
  const newCode = () => {
    let code;
    do { code = String(Math.floor(1e9 + Math.random() * 9e9)); } while (data.orders.some((o) => o.code === code));
    return code;
  };
  const slotTaken = (itemId, when) => data.orders.filter((o) => o.book === 'fixed' && o.status !== 'cancelled' && o.when === when && o.lines[0].itemId === itemId).reduce((a, o) => a + o.lines[0].qty, 0);
  const seatsLeft = (it, date, slot) => it.cap - slotTaken(it.id, date + ' ' + slot);
  // the agent panel and the shop page follow the sub-category
  const setupOf = (s) => (s && s.sub && Object.keys(window.LH.setups).find((k) => window.LH.setups[k].includes(s.sub))) || '';
  // a test's offer price holds until the end of its last day
  const offerOn = (it) => !!(it.offer && it.offer.price < it.price && (!it.offer.until || it.offer.until >= todayStr()));
  const PATIENT = { new: 'নতুন রোগী', old: 'পুরাতন রোগী' };
  const patientOf = (it, p) => (it.role === 'doctor' ? (p.patient === 'old' && it.oldFee !== undefined ? 'old' : 'new') : '');
  const priceOf = (it, patient) => (patient === 'old' ? it.oldFee : offerOn(it) ? it.offer.price : it.price);
  // A booking's bill: a doctor's fee for a new or an old patient, or a test and any more tests done in the same visit at today's prices.
  function bookLines(shop, it, p) {
    const patient = patientOf(it, p);
    const more = it.book === 'test' ? shop.items.filter((x) => x.id !== it.id && x.book === 'test' && x.available && (p.more || []).includes(x.id)) : [];
    return [it].concat(more).map((x, i) => ({ itemId: x.id, name: x.name, unit: patient ? PATIENT[patient] : x.unit, price: priceOf(x, patient), icon: x.icon, qty: i ? 1 : p.qty || 1 }));
  }
  function book(p) {
    const shop = shopById(p.shopId) || fail('দোকান পাওয়া যায়নি');
    const it = shop.items.find((x) => x.id === p.itemId);
    if (!it || !it.book || !it.available || it.book === 'bus') fail('এই বুকিং এখন নেওয়া হচ্ছে না');
    if (!shop.open || shop.suspended) fail('দোকানটি সাময়িকভাবে বন্ধ আছে');
    const at = new Date(p.date + 'T' + p.time);
    if (Number.isNaN(at.getTime()) || at < new Date()) fail('এই সময় পার হয়ে গেছে, পরের কোনো সময় দিন');
    const day = shop.week && shop.week[at.getDay()];
    if (day && day.off) fail('ওই দিন বন্ধ থাকে, অন্য দিন বেছে নিন');
    if (it.book !== 'fixed' && !openAt(shop, at)) fail('ওই সময় বন্ধ থাকে, খোলার সময়ের মধ্যে দিন');
    if (it.days && !it.days.includes(at.getDay())) fail('এই ডাক্তার ওই দিন বসেন না, অন্য দিন বেছে নিন');
    const when = p.date + ' ' + p.time;
    let serial = 0;
    if (it.book === 'fixed') {
      if (!it.slots.includes(p.time)) fail('এই সময়ে বুকিং নেই');
      const taken = slotTaken(it.id, when);
      if (taken + p.qty > it.cap) fail('এই সময়ে এত জায়গা খালি নেই');
      if (!it.multi) serial = taken + 1;
    }
    const trip = it.trip ? checkTrip(p.trip, it, p.recipient) : undefined;
    const vehicle = it.vehicle ? checkVehicle(p.vehicle, it) : undefined;
    if (p.photo && !/^data:image\/(webp|jpeg);base64,[A-Za-z0-9+/=]+$/.test(p.photo.image)) fail('ছবিটি খোলা যায়নি, অন্য ছবি দিন');
    const now = new Date().toISOString();
    const lines = bookLines(shop, it, p);
    const sub = lines.reduce((a, l) => a + l.price * l.qty, 0);
    const patient = patientOf(it, p) || undefined;
    const o = {
      code: newCode(), shopId: shop.id, shopName: shop.name, shopIcon: shop.icon, customerId: p.customerId, mode: 'service', book: it.book,
      placeLabel: p.placeLabel, recipient: p.recipient, note: p.problem || p.note, when, lines, sub, fee: 0, total: sub, pay: 'shop', serial, patient, trip, vehicle,
      status: 'placed', history: [{ status: 'placed', at: now, by: 'customer', note: '' }], delivery: null, offer: null, contract: null,
      pin: String(Math.floor(1000 + Math.random() * 9000)), createdAt: now
    };
    data.orders.unshift(o);
    let chat = null;
    if (it.book === 'quote') {
      chat = chatFor(shop.id, p.customerId);
      chat.msgs.push({ kind: 'booked', by: 'customer', code: o.code, at: now });
      chat.msgs.push({ kind: 'text', by: 'customer', text: p.problem, at: now });
      if (p.photo) chat.msgs.push({ kind: 'image', by: 'customer', image: p.photo.image, w: p.photo.w, h: p.photo.h, at: now });
    }
    const notesBefore = data.notes.length;
    const sent = chat ? chat.msgs.length : 0;
    notifyShop(o, 'booked');
    commit(() => { data.orders.shift(); data.notes.splice(0, data.notes.length - notesBefore); if (chat) chat.msgs.splice(sent - (p.photo ? 3 : 2)); });
    return o;
  }
  // A trip: picked up at the customer's address, taken to another place. The fare is agreed in the chat like any booking.
  const TRIP_KINDS = ['goods', 'people', 'patient'];
  function checkTrip(t, it, from) {
    t = t || {};
    if (!TRIP_KINDS.includes(it.trip)) fail('এই বুকিং এখন নেওয়া হচ্ছে না');
    if (!Object.hasOwn(window.LH_GEO, t.toZila || '')) fail('কোথায় যাবেন, জেলা বেছে নিন');
    const to = words(t.to);
    if (to.length < 3) fail('কোথায় যাবেন, ঠিকানা লিখুন');
    const load = words(t.load);
    if (load.length < 2) fail(it.trip === 'goods' ? 'কী মাল নেবেন, লিখুন' : it.trip === 'patient' ? 'রোগীর অবস্থা লিখুন' : 'কতজন যাবেন, লিখুন');
    const pin = inBangladesh(t.toLat, t.toLng);
    // no pin: from the district's centre, so only a rough distance
    const end = pin ? { lat: t.toLat, lng: t.toLng } : (window.LH_GEO_POS[t.toZila] ? { lat: window.LH_GEO_POS[t.toZila][0], lng: window.LH_GEO_POS[t.toZila][1] } : null);
    const km = end && from && Number.isFinite(from.lat) ? Math.round(kmBetween(from, end) * 10) / 10 : 0;
    return { kind: it.trip, to: to.slice(0, 150), toZila: t.toZila, toLat: pin ? t.toLat : undefined, toLng: pin ? t.toLng : undefined, km, rough: !pin, back: !!t.back, help: it.trip === 'goods' && !!t.help, load: load.slice(0, 300) };
  }
  // A garage or a car wash asks which vehicle; for a repair, also where the work is done.
  const WHERE = ['shop', 'home', 'tow'];
  const vehicleSet = (it) => window.LH.vehicleSets[it.vehicle] || window.LH.vehicleSets.all;
  const whereOf = (it) => (it.book === 'quote' ? (it.where && it.where.length ? it.where : WHERE) : []);
  function checkVehicle(v, it) {
    v = v || {};
    if (!vehicleSet(it).includes(v.type)) fail('কোন গাড়ি, বেছে নিন');
    const where = whereOf(it);
    if (where.length && !where.includes(v.where)) fail('কাজটি কোথায় হবে, বেছে নিন');
    return { type: v.type, model: words(v.model).slice(0, 60), plate: words(v.plate).slice(0, 30), where: where.length ? v.where : undefined };
  }
  // an ambulance or a hearse answers the phone day and night
  const EMERGENCY_SUBS = ['অ্যাম্বুলেন্স', 'লাশবাহী ফ্রিজার গাড়ি'];
  const isEmergency = (s) => !!s && (!!s.emergency || EMERGENCY_SUBS.includes(s.sub));

  /* ---------- bus tickets: a route's stops, a fare by distance, seats by stretch of road ---------- */
  // A ticket bought in the app can board at any stop of the route, not only at a counter.
  // A trip is a route's departure from its first stop on a day: "date time". A seat is taken only between the two stops of a ticket,
  // so a seat to Tongi is free again from Tongi on.
  const BUS_COACH = ['নন-এসি', 'এসি', 'স্লিপার'];
  const BUS_LIVE = ['placed', 'confirmed', 'completed'];
  const busOrders = (it, trip) => data.orders.filter((o) => o.book === 'bus' && o.bus && o.bus.trip === trip && o.lines[0].itemId === it.id && BUS_LIVE.includes(o.status));
  function busSeatsLeft(it, date, time, from, to) {
    const list = busOrders(it, date + ' ' + time);
    let most = 0;
    for (let i = from; i < to; i++) most = Math.max(most, list.filter((o) => o.bus.from <= i && o.bus.to > i).reduce((a, o) => a + o.lines[0].qty, 0));
    return it.seats - most;
  }
  // when the bus is at a stop: the departure plus that stop's minutes, the next day for a night coach
  function busAt(it, date, time, i) {
    const d = new Date(date + 'T' + time);
    return new Date(d.getTime() + it.stops[i].min * 6e4);
  }
  const busKm = (it, from, to) => it.stops[to].km - it.stops[from].km;
  // the routes that pass both stops in this order, from every live bus counter, wherever the customer is
  const stopName = (t) => String(t || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
  function busFind(fromText, toText) {
    const a = stopName(fromText);
    const b = stopName(toText);
    const hit = (st, q) => !q || stopName(st.name).includes(q);
    const out = [];
    data.shops.filter((s) => shopLive(s) && s.open).forEach((s) => s.items.filter((it) => it.book === 'bus' && it.available).forEach((it) => {
      const from = it.stops.findIndex((st) => hit(st, a));
      if (from < 0) return;
      const to = it.stops.findIndex((st, i) => i > from && hit(st, b));
      if (to < 0) return;
      out.push({ shop: s, it, from, to: b ? to : it.stops.length - 1 });
    }));
    return out;
  }
  const busStops = () => [...new Set(data.shops.filter(shopLive).flatMap((s) => s.items.filter((it) => it.book === 'bus' && it.available).flatMap((it) => it.stops.map((st) => st.name))))];
  // payment: { method, trx } when paid online; otherwise the fare is paid to the supervisor on the bus.
  // dry: only the checks, before the payment page opens
  function busBook(p, payment, dry) {
    const shop = shopById(p.shopId) || fail('কাউন্টার পাওয়া যায়নি');
    const it = shop.items.find((x) => x.id === p.itemId);
    if (!it || it.book !== 'bus' || !it.available) fail('এই রুটে এখন টিকেট নেওয়া হচ্ছে না');
    if (!shop.open || shop.suspended || shop.hidden) fail('কাউন্টারটি সাময়িকভাবে বন্ধ আছে');
    const from = Number(p.from);
    const to = Number(p.to);
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 0 || to >= it.stops.length || from >= to) fail('কোথা থেকে উঠবেন আর কোথায় নামবেন, ঠিক করে দিন');
    if (!it.times.includes(p.time)) fail('এই সময়ে বাস নেই');
    const at = busAt(it, p.date, p.time, from);
    if (Number.isNaN(at.getTime()) || at < new Date()) fail('এই বাস আপনার স্টপ পার হয়ে গেছে, পরের কোনো বাস বেছে নিন');
    const qty = Number(p.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) fail('১ থেকে ১০টি সিট নিতে পারবেন');
    if (busSeatsLeft(it, p.date, p.time, from, to) < qty) fail('এই পথে এত সিট খালি নেই');
    if (payment && !PAID_WORD[payment.method]) fail('কিভাবে টাকা দেবেন, বেছে নিন');
    if (dry) return null;
    const fare = busFare(it, from, to);
    const now = new Date().toISOString();
    const st = (i) => it.stops[i].name;
    const hhmm = String(at.getHours()).padStart(2, '0') + ':' + String(at.getMinutes()).padStart(2, '0');
    const o = {
      code: newCode(), shopId: shop.id, shopName: shop.name, shopIcon: shop.icon, customerId: p.customerId, mode: 'service', book: 'bus',
      placeLabel: p.placeLabel || '', recipient: p.recipient, note: '', when: dayStr(at) + ' ' + hhmm,
      lines: [{ itemId: it.id, name: it.name, unit: st(from) + ' → ' + st(to), price: fare, icon: it.icon, qty }], sub: fare * qty, fee: 0, total: fare * qty,
      pay: payment ? payment.method : 'bus', serial: 0, rate: data.commission,
      bus: { trip: p.date + ' ' + p.time, date: p.date, time: p.time, from, to, fromName: st(from), toName: st(to), km: busKm(it, from, to), coach: it.coach, board: at.toISOString() },
      // the counter sells the seat at once; the supervisor checks the code when the passenger boards
      status: 'confirmed', history: [{ status: 'placed', at: now, by: 'customer', note: '' }, { status: 'confirmed', at: now, by: 'shop', note: '' }],
      delivery: null, offer: null, contract: null, pin: String(Math.floor(1000 + Math.random() * 9000)), createdAt: now
    };
    if (payment) o.paid = { method: payment.method, trx: String(payment.trx || '').slice(0, 20), at: now };
    data.orders.unshift(o);
    const notesBefore = data.notes.length;
    notifyShop(o, 'booked');
    commit(() => { data.orders.shift(); data.notes.splice(0, data.notes.length - notesBefore); });
    return o;
  }
  // The supervisor takes the passenger on board after checking the code on the ticket.
  function busBoard(code, pin) {
    const o = orderBy(code);
    if (o.book !== 'bus' || o.status !== 'confirmed') fail('এই টিকেটে এখন ওঠানো যাবে না');
    if (String(pin || '').trim() !== o.pin) fail('কোড মেলেনি, যাত্রীর টিকেট দেখে আবার লিখুন');
    push(o, 'completed', 'shop');
  }
  // the passengers of a day by route, departure and stop: who gets on where, and who gets off
  function busList(shopId, date) {
    const shop = shopById(shopId);
    return shop.items.filter((it) => it.book === 'bus').map((it) => ({
      it,
      trips: it.times.map((time) => {
        const list = busOrders(it, date + ' ' + time);
        return { time, list, stops: it.stops.map((stop, i) => ({ stop, i, on: list.filter((o) => o.bus.from === i), off: list.filter((o) => o.bus.to === i) })) };
      }).filter((t) => t.list.length)
    }));
  }
  // A route as the counter enters it: stops in order with their distances, the counters among them with a pin and a phone.
  const BD_PHONE = /^(01[3-9]\d{8}|09\d{9})$/;
  function checkRoute(r) {
    if (!BUS_COACH.includes(r.coach)) fail('কোচের ধরন বেছে নিন');
    if (!Number.isInteger(r.seats) || r.seats < 1 || r.seats > 80) fail('সিট ১ থেকে ৮০টির মধ্যে দিন');
    if (!Number.isFinite(r.rate) || r.rate < 0.5 || r.rate > 20) fail('কিমি প্রতি ভাড়া ০.৫ থেকে ২০ টাকার মধ্যে দিন');
    if (!Number.isInteger(r.minFare) || r.minFare < 0 || r.minFare > 5000) fail('সবচেয়ে কম ভাড়া ০ থেকে ৫০০০ টাকার মধ্যে দিন');
    const times = [...new Set(r.times)].sort();
    if (!times.length || !times.every((t) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) fail('ছাড়ার সময় লিখুন, যেমন 07:00, 15:30');
    const stops = r.stops || [];
    if (stops.length < 2) fail('অন্তত দুটি স্টপ দিন');
    if (stops.length > 40) fail('একটি রুটে ৪০টির বেশি স্টপ দেওয়া যাবে না');
    const out = stops.map((s, i) => {
      const name = String(s.name || '').normalize('NFC').trim().replace(/\s+/g, ' ');
      const n = i + 1;
      if (name.length < 2) fail(`স্টপ ${bnNum(n)}: নাম দিন`);
      if (!Number.isFinite(s.km) || s.km < 0 || s.km > 1500) fail(`স্টপ ${bnNum(n)}: দূরত্ব দিন`);
      if (!Number.isInteger(s.min) || s.min < 0 || s.min > 2880) fail(`স্টপ ${bnNum(n)}: সময় (মিনিট) দিন`);
      const pin = inBangladesh(s.lat, s.lng);
      if (s.counter && !pin) fail(`স্টপ ${bnNum(n)}: কাউন্টার আছে, ম্যাপে তার জায়গা দিন`);
      if (s.counter && !BD_PHONE.test(s.phone || '')) fail(`স্টপ ${bnNum(n)}: কাউন্টারের ফোন নম্বর দিন`);
      return { name: name.slice(0, 60), km: Math.round(s.km * 10) / 10, min: s.min, lat: pin ? s.lat : undefined, lng: pin ? s.lng : undefined, counter: !!s.counter, phone: s.counter ? s.phone : '' };
    });
    if (out[0].km !== 0 || out[0].min !== 0) fail('প্রথম স্টপের দূরত্ব ও সময় ০ দিন');
    out.forEach((s, i) => {
      if (i && s.km <= out[i - 1].km) fail(`স্টপ ${bnNum(i + 1)}: দূরত্ব আগের স্টপের চেয়ে বেশি দিন`);
      if (i && s.min < out[i - 1].min) fail(`স্টপ ${bnNum(i + 1)}: সময় আগের স্টপের চেয়ে কম হতে পারে না`);
    });
    if (!out[0].counter) fail('প্রথম স্টপে আপনার কাউন্টার থাকতে হবে');
    return { coach: r.coach, seats: r.seats, rate: r.rate, minFare: r.minFare, times, stops: out };
  }
  // the route's name comes from its ends, and a word on the way when the counter gives one
  function saveRoute(shopId, id, r) {
    const shop = shopById(shopId) || fail('কাউন্টার পাওয়া যায়নি');
    const clean = checkRoute(r);
    const via = String(r.via || '').normalize('NFC').trim().slice(0, 40);
    const name = clean.stops[0].name + ' – ' + clean.stops[clean.stops.length - 1].name + (via ? ` (${via} হয়ে)` : '');
    const it = Object.assign({ book: 'bus', sub: 'বাস কাউন্টার', unit: 'প্রতি সিট', icon: '🚌', name, via }, clean);
    it.price = busFare(it, 0, it.stops.length - 1);
    saveItem(shop.id, id, it);
    return it;
  }
  /* ---------- launch tickets: numbered cabins and the deck by count, one list for the app and the counter ---------- */
  // A trip is one repeat rule's departure on one day, "rule@date". The counter can mark a trip late, cancelled or gone.
  // A ticket goes from the first ghat to the last: nobody gets on or off on the way.
  const CABIN = { single: 'সিঙ্গেল', double: 'ডাবল', family: 'ফ্যামিলি', vip: 'ভিআইপি স্যুট' };
  const CLASSES = ['single', 'double', 'family', 'vip', 'deck'];
  const LAUNCH_LIVE = ['confirmed', 'completed'];
  // tickets are sold for today and the next six days
  const LAUNCH_DAYS = 7;
  const PAY_HOLD_MIN = 10;
  // LocalHaat's share, in percent, of what is kept back when a ticket is given back
  const KEEP_SHARE = 15;
  const TRIP_STATUS = { on: 'চলবে', late: 'দেরি', off: 'বাতিল', gone: 'ছেড়ে গেছে' };
  const DAY_RULES = ['daily', 'odd', 'even'];
  const lnOf = (s) => (s && s.launch) || null;
  const hhmmOf = (d) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  const addDays = (ymd, n) => { const d = new Date(ymd + 'T12:00'); d.setDate(d.getDate() + n); return dayStr(d); };
  // odd and even go by the date, as launch timetables do; a list of week days goes by the day of the week
  function ruleOn(rule, ymd) {
    const d = new Date(ymd + 'T12:00');
    if (rule.days === 'daily') return true;
    if (rule.days === 'odd') return d.getDate() % 2 === 1;
    if (rule.days === 'even') return d.getDate() % 2 === 0;
    return Array.isArray(rule.days) && rule.days.includes(d.getDay());
  }
  function lnTripOf(s, rule, date) {
    const l = lnOf(s);
    const boat = l.boats.find((b) => b.id === rule.boat);
    const route = l.routes.find((r) => r.id === rule.route);
    if (!boat || !route) return null;
    const id = rule.id + '@' + date;
    const set = l.trips[id] || {};
    const dep0 = new Date(date + 'T' + rule.time);
    const dep = set.status === 'late' && set.late ? new Date(set.late) : dep0;
    return { id, shopId: s.id, rule: rule.id, date, time: rule.time, boat, route, status: set.status || 'on', note: set.note || '', dep0, dep, arr: new Date(dep.getTime() + route.min * 6e4) };
  }
  // the trips of some days, by departure
  function lnTrips(s, from, days) {
    const l = lnOf(s);
    if (!l) return [];
    const out = [];
    for (let i = 0; i < days; i++) {
      const date = addDays(from, i);
      l.rules.forEach((r) => { if (ruleOn(r, date)) { const t = lnTripOf(s, r, date); if (t) out.push(t); } });
    }
    return out.sort((a, b) => a.dep0 - b.dep0);
  }
  function lnTrip(s, id) {
    const l = lnOf(s);
    const [rid, date] = String(id || '').split('@');
    const rule = l && l.rules.find((r) => r.id === rid);
    if (!rule || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !ruleOn(rule, date)) return null;
    return lnTripOf(s, rule, date);
  }
  const lnTickets = (s, tripId) => data.orders.filter((o) => o.book === 'launch' && o.shopId === s.id && o.launch.trip === tripId && LAUNCH_LIVE.includes(o.status));
  const holdLive = (h) => new Date(h.until) > new Date();
  const lnHolds = (s, tripId) => lnOf(s).holds.filter((h) => h.trip === tripId && holdLive(h));
  // what is taken on a trip: each cabin sold or held, and the deck places
  function lnUsed(s, tripId, skipHold) {
    const cabins = {};
    let deck = 0;
    lnTickets(s, tripId).forEach((o) => { o.launch.cabins.forEach((c) => { cabins[c.no] = 'sold'; }); deck += o.launch.deck; });
    lnHolds(s, tripId).filter((h) => h.id !== skipHold).forEach((h) => { h.cabins.forEach((no) => { cabins[no] = h.kind === 'phone' ? 'phone' : 'held'; }); deck += h.deck; });
    return { cabins, deck };
  }
  // free places by class; a class without a fare on the route is not sold
  function lnFree(s, trip) {
    const used = lnUsed(s, trip.id);
    const out = { single: 0, double: 0, family: 0, vip: 0, deck: 0 };
    trip.boat.cabins.forEach((c) => { if (!c.off && !used.cabins[c.no] && trip.route.fares[c.type] > 0) out[c.type]++; });
    out.deck = trip.route.fares.deck > 0 ? Math.max(0, trip.boat.deck - used.deck) : 0;
    return out;
  }
  function lnSellable(trip) {
    if (trip.status === 'off') fail('এই ট্রিপ বাতিল হয়েছে');
    if (trip.status === 'gone' || trip.dep <= new Date()) fail('লঞ্চ ছেড়ে গেছে, পরের কোনো ট্রিপ বেছে নিন');
  }
  // the cabins and deck places asked for, against everything sold and held on the trip
  function lnCheckPick(s, trip, cabins, deck, skipHold) {
    const nos = [...new Set((cabins || []).map(String))];
    const n = Number(deck) || 0;
    if (!Number.isInteger(n) || n < 0 || n > 20) fail('ডেকে ০ থেকে ২০ জনের টিকেট নিতে পারবেন');
    if (!nos.length && !n) fail('কেবিন বাছুন বা ডেকের টিকেট নিন');
    if (nos.length > 6) fail('একবারে ৬টির বেশি কেবিন নেওয়া যাবে না');
    const used = lnUsed(s, trip.id, skipHold);
    const picked = nos.map((no) => {
      const c = trip.boat.cabins.find((x) => x.no === no);
      if (!c || c.off || !(trip.route.fares[c.type] > 0)) fail(`কেবিন ${bnNum(no)} বিক্রি হচ্ছে না`);
      if (used.cabins[no]) fail(`কেবিন ${bnNum(no)} আর খালি নেই, অন্য কেবিন বাছুন`);
      return c;
    });
    if (n && !(trip.route.fares.deck > 0)) fail('এই রুটে ডেকের টিকেট নেই');
    if (n && used.deck + n > trip.boat.deck) fail(`ডেকে আর ${bnNum(Math.max(0, trip.boat.deck - used.deck))} জনের জায়গা আছে`);
    return { picked, deck: n };
  }
  function lnLines(trip, picked, deck) {
    const lines = [];
    Object.keys(CABIN).forEach((type) => {
      const list = picked.filter((c) => c.type === type);
      if (list.length) lines.push({ itemId: 'cabin-' + type, name: CABIN[type] + ' কেবিন', unit: list.map((c) => c.no).join(', '), price: trip.route.fares[type], icon: '🛏️', qty: list.length });
    });
    if (deck) lines.push({ itemId: 'deck', name: 'ডেক', unit: 'জনপ্রতি', price: trip.route.fares.deck, icon: '🧍', qty: deck });
    return lines;
  }
  const lnTotal = (trip, picked, deck) => lnLines(trip, picked, deck).reduce((a, l) => a + l.price * l.qty, 0);
  // a name and a phone: needed in the app and for a phone hold, optional for a cash sale at the counter
  function lnPerson(p, need) {
    const name = words(p.name).slice(0, 60);
    const phone = String(p.phone || '').replace(/[\s-]/g, '');
    if (need && name.length < 2) fail('যাত্রীর নাম লিখুন');
    if ((need || phone) && !/^01[3-9]\d{8}$/.test(phone)) fail('১১ সংখ্যার মোবাইল নম্বর লিখুন, যেমন 017XXXXXXXX।');
    return { name: name || 'কাউন্টারের যাত্রী', phone };
  }
  function lnOrder(s, trip, picked, deck, who, channel, customerId, payment) {
    const now = new Date().toISOString();
    const lines = lnLines(trip, picked, deck);
    const total = lines.reduce((a, l) => a + l.price * l.qty, 0);
    const o = {
      code: newCode(), shopId: s.id, shopName: s.name, shopIcon: s.icon, customerId: customerId || null, mode: 'service', book: 'launch',
      placeLabel: trip.route.from.name, recipient: { name: who.name, phone: who.phone, line: trip.route.from.name, lat: trip.route.from.lat, lng: trip.route.from.lng }, note: '',
      when: dayStr(trip.dep) + ' ' + hhmmOf(trip.dep), lines, sub: total, fee: 0, total, pay: payment ? payment.method : 'counter', serial: 0, rate: data.commission,
      launch: {
        trip: trip.id, date: trip.date, time: trip.time, boat: trip.boat.id, boatName: trip.boat.name, from: trip.route.from.name, to: trip.route.to.name, dep: trip.dep.toISOString(), arr: trip.arr.toISOString(),
        cabins: picked.map((c) => ({ no: c.no, type: c.type, floor: trip.boat.floors[c.floor] ? trip.boat.floors[c.floor].name : '' })), deck, channel
      },
      status: 'confirmed', history: [{ status: 'placed', at: now, by: channel === 'app' ? 'customer' : 'shop', note: '' }, { status: 'confirmed', at: now, by: 'shop', note: '' }],
      delivery: null, offer: null, contract: null, pin: String(Math.floor(1000 + Math.random() * 9000)), createdAt: now
    };
    if (payment) o.paid = { method: payment.method, trx: String(payment.trx || '').slice(0, 20), at: now };
    return o;
  }
  const lnShop = (id) => { const s = shopById(id); if (!s || !lnOf(s)) fail('কাউন্টার পাওয়া যায়নি'); return s; };
  const lnTripOr = (s, id) => lnTrip(s, id) || fail('ট্রিপ পাওয়া যায়নি');
  // The app: the chosen cabins and deck places are held for ten minutes while the payment page is open.
  function lnHold(p) {
    const s = lnShop(p.shopId);
    if (!shopLive(s) || !s.open) fail('কাউন্টারটি সাময়িকভাবে বন্ধ আছে');
    const trip = lnTripOr(s, p.trip);
    lnSellable(trip);
    lnPerson(p, true);
    if (!PAID_WORD[p.pay]) fail('কিভাবে টাকা দেবেন, বেছে নিন');
    const { picked, deck } = lnCheckPick(s, trip, p.cabins, p.deck);
    const l = lnOf(s);
    l.holds = l.holds.filter(holdLive);
    const h = { id: 'h' + Date.now().toString(36) + l.holds.length, trip: trip.id, cabins: picked.map((c) => c.no), deck, kind: 'pay', by: p.customerId, until: new Date(Date.now() + PAY_HOLD_MIN * 6e4).toISOString() };
    l.holds.push(h);
    commit(() => l.holds.pop());
    return { hold: h.id, until: h.until, total: lnTotal(trip, picked, deck) };
  }
  // Paid: every check again, the ticket's own hold left out, so the cabins it holds are its own.
  function lnBuy(p, holdId, payment) {
    const s = lnShop(p.shopId);
    const trip = lnTripOr(s, p.trip);
    const who = lnPerson(p, true);
    if (!payment || !PAID_WORD[payment.method]) fail('কিভাবে টাকা দেবেন, বেছে নিন');
    const { picked, deck } = lnCheckPick(s, trip, p.cabins, p.deck, holdId);
    lnSellable(trip);
    const o = lnOrder(s, trip, picked, deck, who, 'app', p.customerId, payment);
    const l = lnOf(s);
    l.holds = l.holds.filter((h) => h.id !== holdId);
    data.orders.unshift(o);
    notifyShop(o, 'booked');
    save();
    return o;
  }
  function lnRelease(shopId, holdId) {
    const l = lnOf(shopById(shopId));
    if (!l) return;
    l.holds = l.holds.filter((h) => h.id !== holdId);
    save();
  }
  // The counter: a cash sale, at once. A phone hold being paid for becomes a sale of the same cabins.
  function lnSell(shopId, p) {
    const s = lnShop(shopId);
    const trip = lnTripOr(s, p.trip);
    lnSellable(trip);
    const hold = p.hold ? lnHolds(s, trip.id).find((h) => h.id === p.hold && h.kind === 'phone') || fail('এই হোল্ডের সময় শেষ হয়ে গেছে') : null;
    const who = lnPerson(hold || p, false);
    const { picked, deck } = lnCheckPick(s, trip, hold ? hold.cabins : p.cabins, hold ? hold.deck : p.deck, hold ? hold.id : null);
    const o = lnOrder(s, trip, picked, deck, who, hold ? 'phone' : 'counter', null, null);
    if (hold) lnOf(s).holds = lnOf(s).holds.filter((h) => h.id !== hold.id);
    data.orders.unshift(o);
    save();
    return o;
  }
  // A cabin kept for a caller, until the time the agent set, and never past the set time before departure.
  function lnPhoneHold(shopId, p) {
    const s = lnShop(shopId);
    const trip = lnTripOr(s, p.trip);
    lnSellable(trip);
    const who = lnPerson(p, true);
    const { picked, deck } = lnCheckPick(s, trip, p.cabins, p.deck);
    const l = lnOf(s);
    const until = Math.min(Date.now() + l.hold.hours * 36e5, trip.dep.getTime() - l.hold.before * 6e4);
    if (until <= Date.now() + 6e4) fail('ছাড়ার সময় খুব কাছে, এখন ফোনে হোল্ড রাখা যাবে না। নগদে বিক্রি করুন।');
    l.holds = l.holds.filter(holdLive);
    const h = { id: 'h' + Date.now().toString(36) + l.holds.length, trip: trip.id, cabins: picked.map((c) => c.no), deck, kind: 'phone', name: who.name, phone: who.phone, until: new Date(until).toISOString() };
    l.holds.push(h);
    save();
    return h;
  }
  function lnHoldDrop(shopId, holdId) {
    const l = lnOf(lnShop(shopId));
    l.holds = l.holds.filter((h) => h.id !== holdId);
    save();
  }
  // Boarding: the 4-digit code on the ticket, or its QR code. Without a network the boarding waits in a queue on the phone.
  function lnFindTicket(shopId, tripId, text) {
    const t = String(text || '').trim();
    const list = data.orders.filter((o) => o.book === 'launch' && o.shopId === shopId && o.launch.trip === tripId && o.status !== 'cancelled');
    const qr = t.match(/^LHL:(\d{10}):(\d{4})$/);
    if (qr) return list.filter((o) => o.code === qr[1] && o.pin === qr[2]);
    return /^\d{4}$/.test(t) ? list.filter((o) => o.pin === t) : [];
  }
  function lnBoard(shopId, code, offline) {
    const o = orderBy(code);
    if (o.book !== 'launch' || o.shopId !== shopId) fail('এই টিকেট এই কাউন্টারের নয়');
    if (o.status === 'cancelled') fail('এই টিকেট বাতিল হয়েছে');
    if (o.status === 'completed' || o.launch.boarded) fail('আগেই উঠেছেন');
    if (offline) {
      o.launch.boarded = new Date().toISOString();
      data.boardQueue.push({ code, at: o.launch.boarded });
      save();
      return o;
    }
    push(o, 'completed', 'shop');
    return o;
  }
  // the network is back: boardings made without it are sent, the first one of each ticket counts
  function lnSync() {
    const q = data.boardQueue;
    data.boardQueue = [];
    q.forEach((x) => { const o = data.orders.find((y) => y.code === x.code); if (o && o.status === 'confirmed') push(o, 'completed', 'shop'); });
    save();
    return q.length;
  }
  // a text message to a passenger; the prototype keeps it in a log, the real app sends it through the SMS gateway
  function sms(phone, text, code) {
    if (!phone) return;
    data.sms.unshift({ to: phone, text, code, at: new Date().toISOString() });
    if (data.sms.length > 200) data.sms.length = 200;
  }
  // How much comes back when a ticket is given back: by the hours left before departure, as the agent set.
  function lnRefund(o) {
    const l = lnOf(shopById(o.shopId));
    const hours = (new Date(o.launch.dep).getTime() - Date.now()) / 36e5;
    const tier = (l ? l.refund : []).find((t) => hours >= t.hours);
    const pct = tier ? tier.pct : 0;
    const back = Math.round((o.total * pct) / 100);
    return { pct, back, keep: o.total - back };
  }
  // Money paid online goes back through the team's refund list; cash is paid back at the counter.
  // What is kept back stays with the agent, less LocalHaat's share.
  function lnCancelTicket(o, by, full, reason) {
    const q = full ? { pct: 100, back: o.total, keep: 0 } : lnRefund(o);
    o.keep = q.keep;
    if (o.paid) { if (q.back > 0) o.refund = { amount: q.back, reason: '', phone: '', auto: true, status: 'open', paid: 0, note: '', at: new Date().toISOString() }; } else o.cashBack = q.back;
    push(o, 'cancelled', by, reason);
    return q;
  }
  // the customer gives a ticket back by the agent's rule; the agent cancelling one pays it all back
  function lnCancel(o, by, reason) {
    if (isFinal(o)) fail('এই টিকেট ইতিমধ্যে শেষ হয়েছে');
    if (by !== 'customer') return lnCancelTicket(o, by, true, reason);
    if (new Date(o.launch.dep) <= new Date() || o.launch.boarded) fail('লঞ্চ ছাড়ার পর টিকেট বাতিল করা যাবে না');
    return lnCancelTicket(o, 'customer', false, reason);
  }
  // a passenger gives the ticket back at the counter: the agent's rule, as in the app
  function lnReturn(shopId, code) {
    const o = orderBy(code);
    if (o.book !== 'launch' || o.shopId !== shopId || o.status !== 'confirmed' || o.launch.boarded) fail('এই টিকেট এখন ফেরত নেওয়া যাবে না');
    if (new Date(o.launch.dep) <= new Date()) fail('লঞ্চ ছাড়ার পর টিকেট ফেরত নেওয়া যাবে না');
    return lnCancelTicket(o, 'shop', false, 'যাত্রী কাউন্টারে টিকেট ফেরত দিয়েছেন');
  }
  // A trip late, cancelled, gone, or back on time. Every ticket holder hears of a delay or a cancellation.
  function lnSetTrip(shopId, tripId, status, late, note) {
    const s = lnShop(shopId);
    const trip = lnTripOr(s, tripId);
    if (!TRIP_STATUS[status]) fail('এই ধাপ এখন করা যাবে না');
    if (trip.status === 'off') fail('বাতিল ট্রিপ আর বদলানো যাবে না');
    const l = lnOf(s);
    const why = words(note).slice(0, 120);
    const set = { status, at: new Date().toISOString(), note: why };
    if (status === 'late') {
      const t = new Date(late);
      if (Number.isNaN(t.getTime()) || t <= trip.dep0) fail('নতুন সময় আগের ছাড়ার সময়ের পরে দিন');
      if (t - trip.dep0 > 24 * 36e5) fail('২৪ ঘণ্টার বেশি দেরি হলে ট্রিপ বাতিল করুন');
      set.late = t.toISOString();
    }
    if (status === 'off' && why.length < 3) fail('বাতিলের কারণ লিখুন, যাত্রীরা দেখবেন');
    if (status === 'on') delete l.trips[tripId]; else l.trips[tripId] = set;
    const now = lnTrip(s, tripId);
    const tickets = lnTickets(s, tripId).filter((o) => o.status === 'confirmed');
    const when = (d) => `${bnNum(d.getDate())}/${bnNum(d.getMonth() + 1)} ${bnNum(hhmmOf(d))}`;
    tickets.forEach((o) => {
      if (status === 'off') {
        lnCancelTicket(o, 'shop', true, 'লঞ্চ কর্তৃপক্ষ ট্রিপ বাতিল করেছে: ' + why);
        sms(o.recipient.phone, `লোকালহাট: ${trip.boat.name} ${when(trip.dep0)} এর ট্রিপ বাতিল হয়েছে। পুরো টাকা ফেরত পাবেন। টিকেট #${o.code}`, o.code);
        return;
      }
      o.launch.dep = now.dep.toISOString();
      o.launch.arr = now.arr.toISOString();
      o.when = dayStr(now.dep) + ' ' + hhmmOf(now.dep);
      if (status === 'late') {
        notify(o.customerId, 'trip-late', o.code);
        sms(o.recipient.phone, `লোকালহাট: ${trip.boat.name} দেরিতে ছাড়বে, নতুন সময় ${when(now.dep)}। টিকেট #${o.code}`, o.code);
      }
    });
    if (status === 'off') l.holds = l.holds.filter((h) => h.trip !== tripId);
    save();
    return tickets.length;
  }
  // The search: trips of a day from every live launch counter, wherever the customer is, by the ghats typed.
  function lnFind(fromText, toText, date) {
    const a = stopName(fromText);
    const b = stopName(toText);
    const hit = (g, q) => !q || stopName(g.name).includes(q);
    const out = [];
    data.shops.filter((s) => shopLive(s) && s.open && lnOf(s)).forEach((s) => {
      lnTrips(s, date, 1).forEach((t) => { if (hit(t.route.from, a) && hit(t.route.to, b)) out.push({ shop: s, trip: t }); });
    });
    return out.sort((x, y) => x.trip.dep0 - y.trip.dep0);
  }
  const lnGhats = () => [...new Set(data.shops.filter((s) => shopLive(s) && lnOf(s)).flatMap((s) => lnOf(s).routes.flatMap((r) => [r.from.name, r.to.name])))];
  // live tickets and holds from now on, which a change to a launch, a route or a rule must not break
  function lnAhead(s, test) {
    const now = new Date();
    if (data.orders.some((o) => o.book === 'launch' && o.shopId === s.id && o.status === 'confirmed' && new Date(o.launch.dep) > now && test(o.launch))) return true;
    return lnOf(s).holds.some((h) => {
      const t = holdLive(h) && lnTrip(s, h.trip);
      return !!t && test({ trip: h.trip, boat: t.boat.id, cabins: h.cabins.map((no) => ({ no })) });
    });
  }
  // A launch as the agent enters it: its name, its deck, and how many cabins of each kind on each floor.
  function lnSaveBoat(shopId, id, v) {
    const s = lnShop(shopId);
    const l = lnOf(s);
    const name = words(v.name).slice(0, 60);
    if (name.length < 2) fail('লঞ্চের নাম লিখুন');
    if (l.boats.some((b) => b.id !== id && words(b.name) === name)) fail('এই নামে আরেকটি লঞ্চ আছে');
    if (!Number.isInteger(v.deck) || v.deck < 0 || v.deck > 3000) fail('ডেকে কতজন, ০ থেকে ৩০০০ এর মধ্যে দিন');
    const floors = (v.floors || []).map((f, i) => {
      const fn = words(f.name).slice(0, 30);
      if (fn.length < 2) fail(`তলা ${bnNum(i + 1)}: তলার নাম দিন`);
      if (!Number.isInteger(f.start) || f.start < 1 || f.start > 9999) fail(`তলা ${bnNum(i + 1)}: প্রথম কেবিনের নম্বর দিন`);
      const counts = {};
      Object.keys(CABIN).forEach((k) => {
        const n = f.counts[k] === undefined || f.counts[k] === '' ? 0 : f.counts[k];
        if (!Number.isInteger(n) || n < 0 || n > 80) fail(`তলা ${bnNum(i + 1)}: কেবিনের সংখ্যা ০ থেকে ৮০ এর মধ্যে দিন`);
        counts[k] = n;
      });
      return { name: fn, start: f.start, counts };
    });
    if (floors.length > 5) fail('৫টির বেশি তলা দেওয়া যাবে না');
    const old = id ? l.boats.find((b) => b.id === id) || fail('লঞ্চ পাওয়া যায়নি') : null;
    // a floor given as before keeps its cabins as the agent edited them; a changed floor is numbered again
    const same = (a, b) => !!a && !!b && a.start === b.start && Object.keys(CABIN).every((k) => a.counts[k] === b.counts[k]);
    const fresh = makeCabins(floors);
    const cabins = [];
    floors.forEach((f, i) => {
      const keep = old && same(old.floors[i], f) ? old.cabins.filter((c) => c.floor === i) : fresh.filter((c) => c.floor === i);
      keep.forEach((c) => cabins.push(Object.assign({}, c, { floor: i })));
    });
    if (!cabins.length && !v.deck) fail('অন্তত কিছু কেবিন বা ডেকের জায়গা দিন');
    const seen = new Set();
    cabins.forEach((c) => { if (seen.has(c.no)) fail(`কেবিন নম্বর ${bnNum(c.no)} দুইবার এসেছে, তলার প্রথম নম্বর বদলান`); seen.add(c.no); });
    if (old) {
      const gone = old.cabins.filter((c) => !seen.has(c.no)).map((c) => c.no);
      const hit = gone.find((no) => lnAhead(s, (t) => t.boat === old.id && t.cabins.some((c) => c.no === no)));
      if (hit) fail(`কেবিন ${bnNum(hit)} এ সামনের ট্রিপের টিকেট আছে, এই কেবিন বাদ দেওয়া যাবে না`);
      Object.assign(old, { name, deck: v.deck, floors, cabins });
      save();
      return old;
    }
    const b = { id: 'b' + Date.now().toString(36), name, deck: v.deck, floors, cabins, on: true };
    l.boats.push(b);
    save();
    return b;
  }
  // one cabin: its number, its kind, or kept out of sale (under repair)
  function lnSaveCabin(shopId, boatId, no, v) {
    const s = lnShop(shopId);
    const b = lnOf(s).boats.find((x) => x.id === boatId) || fail('লঞ্চ পাওয়া যায়নি');
    const c = b.cabins.find((x) => x.no === no) || fail('কেবিন পাওয়া যায়নি');
    const nn = String(v.no || '').trim();
    if (!/^[0-9]{1,4}[A-Za-z]?$/.test(nn)) fail('কেবিন নম্বর দিন, যেমন 205');
    if (nn !== no && b.cabins.some((x) => x.no === nn)) fail('এই নম্বরে আরেকটি কেবিন আছে');
    if (!CABIN[v.type]) fail('কেবিনের ধরন বেছে নিন');
    if (nn !== no && lnAhead(s, (t) => t.boat === b.id && t.cabins.some((x) => x.no === no))) fail('এই কেবিনে সামনের ট্রিপের টিকেট আছে, নম্বর বদলানো যাবে না');
    Object.assign(c, { no: nn, type: v.type, off: !!v.off });
    save();
  }
  function lnDeleteBoat(shopId, boatId) {
    const l = lnOf(lnShop(shopId));
    if (l.rules.some((r) => r.boat === boatId)) fail('এই লঞ্চের ট্রিপ আছে। আগে ট্রিপের নিয়ম মুছুন।');
    l.boats = l.boats.filter((b) => b.id !== boatId);
    save();
  }
  // A route: the ghat it leaves from and the ghat it reaches, both on the map, the time on the river, and the fare of each class.
  function lnSaveRoute(shopId, id, v) {
    const s = lnShop(shopId);
    const l = lnOf(s);
    const end = (e, word, needPhone) => {
      const name = words(e && e.name).slice(0, 60);
      if (name.length < 2) fail(`${word} ঘাটের নাম দিন`);
      if (!inBangladesh(e.lat, e.lng)) fail(`${word} ঘাট ম্যাপে বসান`);
      const phone = String(e.phone || '').replace(/[\s-]/g, '');
      if ((needPhone || phone) && !BD_PHONE.test(phone)) fail(`${word} ঘাটের কাউন্টারের ফোন নম্বর দিন`);
      return { name, lat: e.lat, lng: e.lng, phone };
    };
    const from = end(v.from, 'ছাড়ার', true);
    const to = end(v.to, 'পৌঁছানোর', false);
    if (stopName(from.name) === stopName(to.name)) fail('ছাড়ার ও পৌঁছানোর ঘাট আলাদা দিন');
    if (!Number.isInteger(v.min) || v.min < 30 || v.min > 2880) fail('নদীপথে কত সময় লাগে, ঘণ্টা ও মিনিটে দিন');
    const fares = {};
    CLASSES.forEach((k) => {
      const n = v.fares[k] === undefined || v.fares[k] === '' ? 0 : v.fares[k];
      if (!Number.isInteger(n) || n < 0 || n > 100000) fail('ভাড়া টাকায় লিখুন, না থাকলে খালি রাখুন');
      fares[k] = n;
    });
    if (!CLASSES.some((k) => fares[k] > 0)) fail('অন্তত একটি ভাড়া দিন');
    const old = id ? l.routes.find((r) => r.id === id) || fail('রুট পাওয়া যায়নি') : null;
    // the demo river line stays while the ghats stay where they were
    const path = old && old.from.lat === from.lat && old.from.lng === from.lng && old.to.lat === to.lat && old.to.lng === to.lng ? old.path : [];
    if (old) { Object.assign(old, { from, to, min: v.min, fares, path }); save(); return old; }
    const r = { id: 'r' + Date.now().toString(36), from, to, min: v.min, fares, path };
    l.routes.push(r);
    save();
    return r;
  }
  function lnDeleteRoute(shopId, routeId) {
    const l = lnOf(lnShop(shopId));
    if (l.rules.some((r) => r.route === routeId)) fail('এই রুটের ট্রিপ আছে। আগে ট্রিপের নিয়ম মুছুন।');
    l.routes = l.routes.filter((r) => r.id !== routeId);
    save();
  }
  // A repeat rule: a launch on a route at a time, every day, on odd or even dates, or on some days of the week.
  function lnSaveRule(shopId, v) {
    const s = lnShop(shopId);
    const l = lnOf(s);
    if (!l.boats.some((b) => b.id === v.boat)) fail('লঞ্চ বেছে নিন');
    if (!l.routes.some((r) => r.id === v.route)) fail('রুট বেছে নিন');
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(v.time || '')) fail('ছাড়ার সময় দিন, যেমন 20:30');
    const days = DAY_RULES.includes(v.days) ? v.days : Array.isArray(v.days) ? [...new Set(v.days)].filter((d) => Number.isInteger(d) && d >= 0 && d <= 6).sort() : [];
    if (Array.isArray(days) && !days.length) fail('কোন কোন দিন চলবে, বেছে নিন');
    const rule = { id: 'p' + Date.now().toString(36), boat: v.boat, route: v.route, time: v.time, days };
    const start = todayStr();
    for (let i = 0; i < 28; i++) {
      const date = addDays(start, i);
      if (ruleOn(rule, date) && l.rules.some((r) => r.boat === rule.boat && ruleOn(r, date))) fail('এই লঞ্চ ওই দিনগুলোর কোনো একটিতে আরেকটি ট্রিপে আছে');
    }
    l.rules.push(rule);
    save();
    return rule;
  }
  function lnDeleteRule(shopId, ruleId) {
    const s = lnShop(shopId);
    const l = lnOf(s);
    if (lnAhead(s, (t) => t.trip.split('@')[0] === ruleId)) fail('এই নিয়মের সামনের ট্রিপে টিকেট বা হোল্ড আছে। ট্রিপগুলো আলাদা করে বাতিল করুন।');
    l.rules = l.rules.filter((r) => r.id !== ruleId);
    save();
  }
  // the phone hold and the give-back rule, as the agent sets them
  function lnSettings(shopId, v) {
    const l = lnOf(lnShop(shopId));
    if (!Number.isInteger(v.hours) || v.hours < 1 || v.hours > 48) fail('হোল্ড কত ঘণ্টা থাকবে, ১ থেকে ৪৮ এর মধ্যে দিন');
    if (!Number.isInteger(v.before) || v.before < 0 || v.before > 720) fail('ছাড়ার কত মিনিট আগে হোল্ড শেষ, ০ থেকে ৭২০ এর মধ্যে দিন');
    const tiers = v.refund || [];
    tiers.forEach((t) => {
      if (!Number.isInteger(t.hours) || t.hours < 0 || t.hours > 240) fail('ফেরতের নিয়মে ঘণ্টা ০ থেকে ২৪০ এর মধ্যে দিন');
      if (!Number.isInteger(t.pct) || t.pct < 0 || t.pct > 100) fail('ফেরতের নিয়মে শতাংশ ০ থেকে ১০০ এর মধ্যে দিন');
    });
    if (tiers.length === 2 && (tiers[0].hours <= tiers[1].hours || tiers[0].pct < tiers[1].pct)) fail('প্রথম ধাপে বেশি ঘণ্টা আগে আর বেশি ফেরত দিন');
    l.hold = { hours: v.hours, before: v.before };
    l.refund = tiers.map((t) => ({ hours: t.hours, pct: t.pct }));
    save();
  }
  // A month of an agent's tickets by how they were sold: in the app, at the counter, or held on the phone and paid at the counter.
  function lnChannels(shopId, month) {
    const out = { app: { n: 0, tk: 0 }, counter: { n: 0, tk: 0 }, phone: { n: 0, tk: 0 } };
    data.orders.filter((o) => o.book === 'launch' && o.shopId === shopId && o.status !== 'cancelled' && dayStr(new Date(o.launch.dep)).slice(0, 7) === month).forEach((o) => {
      const c = out[o.launch.channel] || out.counter;
      c.n++;
      c.tk += o.total;
    });
    return out;
  }
  /* ---------- an agent's categories: the one it signed up with, and more that the team approves against its trade licence ---------- */
  // Friday and Saturday are off. A business written on the trade licence is decided within 24 hours, any other within 7 working days.
  const OFF_DAYS = [5, 6];
  const ASK_WORK_DAYS = 7;
  const ASK_LICENCE_HOURS = 24;
  const extraOf = (s) => (s && s.extra) || [];
  const catsOf = (s) => [...new Set([s.cat].concat(extraOf(s).map((x) => x.cat)))];
  const inCat = (s, cat) => catsOf(s).includes(cat);
  // under a category, the items of its own sub-categories; an item without one stays under the shop's own category
  function itemInCat(s, it, cat) {
    const c = window.LH.cats.find((x) => x.id === cat);
    return it.sub ? !!c && c.examples.includes(it.sub) : s.cat === cat;
  }
  const openAsks = (shopId) => data.catAsks.filter((a) => a.shopId === shopId && a.status === 'open');
  // what the item form offers: the shop's own sub-category first, then the approved ones, then the ones waiting for the team
  function subChoices(s) {
    const out = [{ sub: s.sub, state: 'main' }].concat(extraOf(s).map((x) => ({ sub: x.sub, state: 'ok' })), openAsks(s.id).map((a) => ({ sub: a.sub, state: 'wait' })));
    return out.filter((x, i) => x.sub && out.findIndex((y) => y.sub === x.sub) === i);
  }
  // the end of the n-th working day after a moment
  function addWorkDays(from, n) {
    const d = new Date(from);
    let left = n;
    while (left > 0) { d.setDate(d.getDate() + 1); if (!OFF_DAYS.includes(d.getDay())) left--; }
    d.setHours(23, 59, 0, 0);
    return d;
  }
  // whole working days from one moment's day to another's
  function workDaysBetween(a, b) {
    const d = new Date(a);
    const end = new Date(b);
    let n = 0;
    while (dayStr(d) < dayStr(end)) { d.setDate(d.getDate() + 1); if (!OFF_DAYS.includes(d.getDay())) n++; }
    return n;
  }
  const askDue = (at, onLicence) => (onLicence ? new Date(new Date(at).getTime() + ASK_LICENCE_HOURS * 36e5) : addWorkDays(at, ASK_WORK_DAYS));
  // a sub-category with its own panel (a clinic, a bus or a launch counter) needs an account of its own
  const ownPanel = (sub) => Object.values(window.LH.setups).some((l) => l.includes(sub));
  const LICENCE_PIC = /^data:image\/(webp|jpeg);base64,[A-Za-z0-9+/=]+$/;
  function checkLicence(v) {
    const no = words(v && v.no).slice(0, 40);
    if (no.length < 4) fail('ট্রেড লাইসেন্সের নম্বর দিন');
    if (!LICENCE_PIC.test((v && v.pic) || '')) fail('ট্রেড লাইসেন্সের ছবি দিন');
    return { no, pic: v.pic, at: new Date().toISOString() };
  }
  // The trade licence: its number and a picture. A request already open becomes a 24-hour one when its business is on it.
  function setLicence(shopId, v) {
    const s = shopById(shopId) || fail('দোকান পাওয়া যায়নি');
    const old = s.licence;
    s.licence = checkLicence(v);
    commit(() => { s.licence = old; });
  }
  // An item of a sub-category the team has not approved waits apart from the shop's list, where no user sees it.
  function sortItem(s, it) {
    s.waiting = s.waiting || [];
    const wait = !!it.sub && it.sub !== s.sub && !extraOf(s).some((x) => x.sub === it.sub);
    const shown = s.items.includes(it);
    if (wait && shown) { s.items = s.items.filter((x) => x !== it); s.waiting.unshift(it); }
    if (!wait && !shown) { s.waiting = s.waiting.filter((x) => x !== it); s.items.unshift(it); }
  }
  const findItem = (s, id) => s.items.find((x) => x.id === id) || (s.waiting || []).find((x) => x.id === id) || null;
  function checkAsk(s, sub) {
    if (!catOfSub(sub)) fail('ক্যাটাগরি ও সাব-ক্যাটাগরি বেছে নিন');
    if (ownPanel(sub)) fail('এই বিভাগের নিজের আলাদা প্যানেল আছে, এর জন্য আলাদা একাউন্ট খুলুন');
    if (sub === s.sub || extraOf(s).some((x) => x.sub === sub)) fail('এই বিভাগ আগে থেকেই আপনার আছে');
    if (openAsks(s.id).some((a) => a.sub === sub)) fail('এই বিভাগের অনুরোধ আগেই পাঠানো হয়েছে');
  }
  function newAsk(s, sub, note, onLicence) {
    const at = new Date().toISOString();
    return { id: 'ca' + Date.now().toString(36) + data.catAsks.length, shopId: s.id, cat: catOfSub(sub).id, sub, note: words(note).slice(0, 200), onLicence: !!onLicence, status: 'open', at, due: askDue(at, !!onLicence).toISOString() };
  }
  // The agent asks for one more category. The trade licence comes first; ticking that the business is on it puts it in the 24-hour line.
  function catAsk(shopId, v) {
    const s = shopById(shopId) || fail('দোকান পাওয়া যায়নি');
    checkAsk(s, v.sub);
    if (!s.licence) fail('আগে ট্রেড লাইসেন্স দিন');
    const a = newAsk(s, v.sub, v.note, v.onLicence);
    data.catAsks.unshift(a);
    save();
    return a;
  }
  function catWithdraw(shopId, id) {
    const a = data.catAsks.find((x) => x.id === id && x.shopId === shopId && x.status === 'open') || fail('এই অনুরোধ আর খোলা নেই');
    data.catAsks = data.catAsks.filter((x) => x !== a);
    save();
  }
  function grant(s, sub) {
    if (!extraOf(s).some((x) => x.sub === sub)) s.extra = extraOf(s).concat({ cat: catOfSub(sub).id, sub, at: new Date().toISOString() });
    (s.waiting || []).slice().forEach((it) => sortItem(s, it));
  }
  // The team decides; approved, the products already added in it show to users by themselves.
  function catDecide(id, ok, reason) {
    const a = data.catAsks.find((x) => x.id === id) || fail('অনুরোধ পাওয়া যায়নি');
    const s = shopById(a.shopId);
    need('cats', s);
    if (a.status !== 'open') fail('এই অনুরোধ আগেই ঠিক হয়ে গেছে');
    const why = words(reason).slice(0, 200);
    if (!ok && why.length < 5) fail('কেন হচ্ছে না, লিখুন; এজেন্ট দেখবেন');
    audit(ok ? 'cat-approve' : 'cat-refuse', placeOfShop(s), why, { after: a.sub });
    Object.assign(a, { status: ok ? 'ok' : 'no', reason: why, decidedAt: new Date().toISOString() });
    if (ok) grant(s, a.sub);
    const owner = ownerOf(s.id);
    if (owner) notify(owner.id, ok ? 'cat-ok' : 'cat-no', a.id);
    save();
  }
  // the team adds a category at once, as when support sorts out a problem
  function catGrant(shopId, sub) {
    const s = shopById(shopId) || fail('দোকান পাওয়া যায়নি');
    need('cats', s);
    if (!catOfSub(sub)) fail('ক্যাটাগরি ও সাব-ক্যাটাগরি বেছে নিন');
    if (ownPanel(sub)) fail('এই বিভাগের নিজের আলাদা প্যানেল আছে, এর জন্য আলাদা একাউন্ট খুলুন');
    if (sub === s.sub || extraOf(s).some((x) => x.sub === sub)) fail('এই বিভাগ আগে থেকেই আছে');
    openAsks(s.id).filter((a) => a.sub === sub).forEach((a) => Object.assign(a, { status: 'ok', reason: '', decidedAt: new Date().toISOString() }));
    audit('cat-grant', placeOfShop(s), '', { after: sub });
    grant(s, sub);
    save();
  }
  // An added category can be dropped by the agent or the team; its products stop showing. The shop's own category stays.
  // the team removing one needs a reason, which the log keeps
  function catDrop(shopId, sub, reason, byTeam) {
    const s = shopById(shopId) || fail('দোকান পাওয়া যায়নি');
    if (byTeam) need('cats', s);
    if (sub === s.sub) fail('দোকানের মূল ক্যাটাগরি বদলাতে সাপোর্টে জানান');
    if (!extraOf(s).some((x) => x.sub === sub)) fail('এই বিভাগ আপনার তালিকায় নেই');
    if (byTeam) audit('cat-remove', placeOfShop(s), reasonOf(reason, 'বাদ দেওয়ার কারণ লিখুন'), { before: sub });
    s.extra = extraOf(s).filter((x) => x.sub !== sub);
    s.items.slice().forEach((it) => sortItem(s, it));
    save();
  }
  // the agent's own view: the open, approved and refused requests, newest first
  const asksOf = (shopId) => data.catAsks.filter((a) => a.shopId === shopId);
  // at sign up: the trade licence and the other categories the shop sells, asked for at once
  function signupAsks(shopId, licence, list) {
    const s = shopById(shopId) || fail('দোকান পাওয়া যায়নি');
    if (list.length && !licence) fail('আরো ক্যাটাগরির জন্য ট্রেড লাইসেন্স দিন');
    if (licence) s.licence = checkLicence(licence);
    list.forEach((x) => { checkAsk(s, x.sub); data.catAsks.unshift(newAsk(s, x.sub, '', x.onLicence)); });
    save();
  }
  const bookingNote = (o, kind, extra) => {
    if (o.book !== 'quote') return;
    chatFor(o.shopId, o.customerId).msgs.push(Object.assign({ kind, by: 'shop', code: o.code, at: new Date().toISOString() }, extra));
  };
  function offer(code, amount, terms) {
    const o = orderBy(code);
    if (o.book !== 'quote' || isFinal(o)) fail('এই ধাপ এখন করা যাবে না');
    if (!Number.isInteger(amount) || amount < o.sub) fail('বিল সার্ভিস চার্জের চেয়ে কম হতে পারে না');
    o.offer = { amount, terms, at: new Date().toISOString() };
    chatFor(o.shopId, o.customerId).msgs.push({ kind: 'offer', by: 'shop', code, amount, terms, at: o.offer.at });
    save();
  }
  function agree(code) {
    const o = orderBy(code);
    if (!o.offer || isFinal(o)) fail('এই প্রস্তাব আর নেই');
    o.contract = { amount: o.offer.amount, terms: o.offer.terms, at: new Date().toISOString() };
    o.total = o.offer.amount;
    o.offer = null;
    chatFor(o.shopId, o.customerId).msgs.push({ kind: 'agreed', by: 'customer', code, amount: o.total, at: o.contract.at });
    if (o.status === 'placed') push(o, 'confirmed', 'customer'); else save();
  }
  function rejectOffer(code) {
    const o = orderBy(code);
    if (!o.offer) fail('এই প্রস্তাব আর নেই');
    o.offer = null;
    chatFor(o.shopId, o.customerId).msgs.push({ kind: 'rejected', by: 'customer', code, at: new Date().toISOString() });
    save();
  }

  /* ---------- chat ---------- */
  const chatOf = (shopId, customerId) => data.chats.find((c) => c.shopId === shopId && c.customerId === customerId) || null;
  function chatFor(shopId, customerId) {
    let c = chatOf(shopId, customerId);
    if (!c) { c = { shopId, customerId, msgs: [], seenCustomer: 0, seenShop: 0 }; data.chats.push(c); }
    return c;
  }
  function chatPost(shopId, customerId, by, msg) {
    const c = chatFor(shopId, customerId);
    c.msgs.push(Object.assign({ by, at: new Date().toISOString() }, msg));
    c[by === 'shop' ? 'seenShop' : 'seenCustomer'] = c.msgs.length;
    commit(() => c.msgs.pop());
  }
  const chatSend = (shopId, customerId, by, text) => chatPost(shopId, customerId, by, { kind: 'text', text: text.slice(0, 1000) });
  // a product or service the shop shows in the chat; the name stays for the day the shop deletes the item
  function chatShare(shopId, customerId, by, itemId) {
    if (by !== 'shop') fail('শুধু এজেন্ট প্যানেল থেকে শেয়ার করা যায়');
    const it = shopById(shopId).items.find((x) => x.id === itemId);
    if (!it || !it.available) fail('এই পণ্য এখন পাওয়া যাচ্ছে না');
    chatPost(shopId, customerId, by, { kind: 'item', itemId, name: it.name });
  }
  function chatSeen(c, by) {
    const k = by === 'shop' ? 'seenShop' : 'seenCustomer';
    if (c[k] !== c.msgs.length) { c[k] = c.msgs.length; save(true); }
  }
  // a picture sent in the chat, already resized in the browser
  function chatImage(shopId, customerId, by, pic) {
    if (!/^data:image\/(webp|jpeg);base64,[A-Za-z0-9+/=]+$/.test(pic.image)) fail('ছবিটি খোলা যায়নি, অন্য ছবি দিন');
    chatPost(shopId, customerId, by, { kind: 'image', image: pic.image, w: pic.w, h: pic.h });
  }
  // The sender takes a message back from both sides: its content is deleted, a note stays in its place.
  // Booking, offer and contract cards are the record of a deal and cannot be taken back.
  const UNSENDABLE = ['text', 'image', 'item'];
  function chatUnsend(shopId, customerId, by, index) {
    const c = chatOf(shopId, customerId);
    const m = c && c.msgs[index];
    if (!m || m.by !== by || !UNSENDABLE.includes(m.kind)) fail('এই বার্তা আনসেন্ড করা যাবে না');
    c.msgs[index] = { kind: 'unsent', by, at: m.at };
    commit(() => { c.msgs[index] = m; });
  }
  const unreadIn = (c, by) => c.msgs.slice(c[by === 'shop' ? 'seenShop' : 'seenCustomer']).filter((m) => m.by !== by && m.kind !== 'unsent').length;
  const lastAt = (c) => (c.msgs.length ? c.msgs[c.msgs.length - 1].at : '');
  function chatsOf(q) {
    return data.chats.filter((c) => (q.shopId ? c.shopId === q.shopId : c.customerId === q.customerId) && c.msgs.length).sort((a, b) => lastAt(b).localeCompare(lastAt(a)));
  }
  const unreadTotal = (q, by) => chatsOf(q).reduce((a, c) => a + unreadIn(c, by), 0);

  /* ---------- notifications: each account's own list; the real app also sends them by push and SMS ---------- */
  function notify(accountId, kind, code) {
    if (!accountId) return;
    data.notes.unshift({ id: 'nt' + Date.now().toString(36) + data.notes.length, to: accountId, kind, code, at: new Date().toISOString(), seen: false });
    if (data.notes.length > 300) data.notes.length = 300;
  }
  const ownerOf = (shopId) => data.accounts.find((a) => a.role === 'owner' && a.shopId === shopId) || null;
  const notifyShop = (o, kind) => { const a = ownerOf(o.shopId); if (a) notify(a.id, kind, o.code); };
  const notesFor = (accountId) => data.notes.filter((n) => n.to === accountId);
  const notesUnseen = (accountId) => data.notes.filter((n) => n.to === accountId && !n.seen).length;
  function notesSeen(accountId) {
    let changed = false;
    data.notes.forEach((n) => { if (n.to === accountId && !n.seen) { n.seen = true; changed = true; } });
    if (changed) save(true);
  }

  /* ---------- delivery men: the company's, by area; a shop never chooses one ---------- */
  const riderAccounts = () => data.accounts.filter((a) => a.role === 'delivery');
  const riderFree = (a) => a.verified && a.approved !== false && !data.riderBlocks[a.contact];
  const riderLoad = (a) => data.orders.filter((o) => o.delivery && o.delivery.phone === a.contact && !isFinal(o)).length;
  // messages to a delivery man; the real app also sends them by SMS
  function noteRider(phone, code, kind) {
    data.riderNotes = data.riderNotes.filter((n) => !(n.phone === phone && n.code === code));
    data.riderNotes.unshift({ id: 'rn' + Date.now().toString(36) + data.riderNotes.length, phone, code, kind, at: new Date().toISOString() });
  }
  const riderNotes = (phone) => data.riderNotes.filter((n) => n.phone === phone);
  function riderNoteDone(id) {
    data.riderNotes = data.riderNotes.filter((n) => n.id !== id);
    save();
  }
  function riderNotesSeen(phone, code) {
    if (!data.riderNotes.some((n) => n.phone === phone && n.code === code)) return;
    data.riderNotes = data.riderNotes.filter((n) => !(n.phone === phone && n.code === code));
    save(true);
  }
  // The free delivery man of the shop's own upazila whose distance reaches the shop; nobody free means the team's list.
  // A small order goes to a van or a pickup only when no one else is free, so they stay free for big items.
  // Then someone of the shop's own bazar, then the nearer one (by whole kilometres), then the one with fewer jobs.
  const isVan = (a) => BIG_VEHICLES.includes(a.vehicle);
  const words = (t) => String(t || '').normalize('NFC').trim().replace(/\s+/g, ' ');
  const sameBazar = (a, shop) => !!words(a.market) && words(a.market) === words(shop.market);
  // one who has not put his point on the map yet works the whole upazila, as before v10
  const inReach = (a, shop) => !a.lat || !shop.lat || kmBetween(a, shop) <= (a.km || 3) + 1e-9;
  const nearer = (x, y, shop) => (x.lat && y.lat ? Math.floor(kmBetween(x, shop)) - Math.floor(kmBetween(y, shop)) : 0);
  function sendToRider(o) {
    const shop = shopById(o.shopId);
    const tried = o.riderTried || [];
    const a = riderAccounts()
      .filter((x) => riderFree(x) && canCarry(x, o) && x.area === shop.area && (!x.zila || !shop.zila || x.zila === shop.zila) && inReach(x, shop) && !tried.includes(x.contact))
      .sort((x, y) => (o.big ? 0 : Number(isVan(x)) - Number(isVan(y))) || Number(sameBazar(y, shop)) - Number(sameBazar(x, shop)) || nearer(x, y, shop) || riderLoad(x) - riderLoad(y))[0];
    o.delivery = a ? { id: a.id, name: a.name, phone: a.contact } : null;
    o.needsRider = !a;
    if (a) noteRider(a.contact, o.code, o.status === 'packed' ? 'ready' : 'assigned');
    return a;
  }
  function fillWaiting() {
    data.orders.filter((o) => o.needsRider && !isFinal(o)).forEach(sendToRider);
    save();
  }
  function accept(code) {
    const o = orderBy(code);
    if (o.status !== 'placed') fail('এই ধাপ এখন করা যাবে না');
    if (o.mode === 'delivery') sendToRider(o);
    bookingNote(o, 'confirmed');
    push(o, 'confirmed', 'shop');
  }
  // the LocalHaat team's own choice, when nobody was free or someone must be replaced
  function assignRider(code, accountId) {
    const o = orderBy(code);
    need('assign', shopById(o.shopId));
    if (o.mode !== 'delivery' || !['confirmed', 'packed'].includes(o.status)) fail('এখন ডেলিভারি ম্যান বদলানো যাবে না');
    const a = riderAccounts().find((x) => x.id === accountId) || fail('ডেলিভারি ম্যান বেছে নিন');
    audit('assign', placeOfOrder(o), '', { before: o.delivery ? o.delivery.name : '', after: a.name });
    if (!riderFree(a)) fail('এই ডেলিভারি ম্যান এখন কাজ নিতে পারবেন না');
    if (!canCarry(a, o)) fail('বড় জিনিসের জন্য ভ্যান বা পিকআপ লাগবে');
    if (o.delivery && o.delivery.phone !== a.contact) noteRider(o.delivery.phone, code, 'removed');
    o.delivery = { id: a.id, name: a.name, phone: a.contact };
    o.needsRider = false;
    noteRider(a.contact, code, o.status === 'packed' ? 'ready' : 'assigned');
    save();
  }
  function teamDeliver(code) {
    const o = orderBy(code);
    need('assign', shopById(o.shopId));
    if (o.status !== 'out_for_delivery') fail('এই ধাপ এখন করা যাবে না');
    audit('team-deliver', placeOfOrder(o));
    push(o, 'delivered', 'team', 'লোকালহাট টিম নিশ্চিত করেছে');
  }
  function pack(code) {
    const o = orderBy(code);
    if (o.status !== 'confirmed' || !flow(o).includes('packed')) fail('এই ধাপ এখন করা যাবে না');
    if (o.delivery) noteRider(o.delivery.phone, code, 'ready');
    push(o, 'packed', 'shop');
  }
  function shopComplete(code) {
    const o = orderBy(code);
    if (next(o) !== 'completed') fail('এই ধাপ এখন করা যাবে না');
    if (o.offer) fail('বিল প্রস্তাবে গ্রাহকের উত্তরের অপেক্ষায় আছে');
    bookingNote(o, 'completed');
    push(o, 'completed', 'shop');
  }
  function riderPickup(code, phone) {
    const o = orderBy(code);
    if (!o.delivery || o.delivery.phone !== phone) fail('এই অর্ডার আপনার নয়');
    if (data.riderBlocks[phone]) fail('আপনার একাউন্ট স্থগিত আছে, নতুন ডেলিভারি নেওয়া যাবে না');
    if (o.status === 'confirmed') fail('দোকান এখনো পণ্য প্রস্তুত করেনি');
    if (o.status !== 'packed') fail('এই ধাপ এখন করা যাবে না');
    push(o, 'out_for_delivery', 'delivery');
  }
  function riderDecline(code, phone) {
    const o = orderBy(code);
    if (!o.delivery || o.delivery.phone !== phone) fail('এই অর্ডার আপনার নয়');
    if (!['confirmed', 'packed'].includes(o.status)) fail('পণ্য নেওয়ার পর ফেরানো যাবে না');
    o.riderTried = (o.riderTried || []).concat(phone);
    data.riderNotes = data.riderNotes.filter((n) => !(n.phone === phone && n.code === code));
    sendToRider(o);
    save();
  }
  function riderDeliver(code, phone, pin) {
    const o = orderBy(code);
    if (!o.delivery || o.delivery.phone !== phone) fail('এই অর্ডার আপনার নয়');
    if (o.status !== 'out_for_delivery') fail('আগে "পণ্য নিয়েছি" চাপুন');
    if (String(pin).trim() !== o.pin) fail('কোড মেলেনি। গ্রাহকের কাছ থেকে ৪ সংখ্যার কোড নিন');
    push(o, 'delivered', 'delivery');
  }
  // The delivery man's phone shares where he is while the goods are on the way. Only that order's customer sees it,
  // and push() wipes it when the job ends. False when sharing must stop.
  function riderLive(code, phone, lat, lng) {
    const o = data.orders.find((x) => x.code === code);
    if (!o || !o.delivery || o.delivery.phone !== phone || o.status !== 'out_for_delivery') return false;
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return true;
    o.live = { lat: Math.round(lat * 1e5) / 1e5, lng: Math.round(lng * 1e5) / 1e5, at: new Date().toISOString() };
    save(true);
    return true;
  }
  function cancel(code, by, reason) {
    const o = orderBy(code);
    if (o.book === 'launch') return lnCancel(o, by, reason);
    if (isFinal(o)) fail('এই অর্ডার ইতিমধ্যে শেষ হয়েছে');
    if (o.status === 'out_for_delivery') fail('পণ্য রওনা হওয়ার পর বাতিল করা যাবে না');
    // a bus ticket can be given back until the bus reaches the passenger's stop
    const busOpen = o.book === 'bus' && o.status === 'confirmed' && new Date(o.bus.board) > new Date();
    if (by === 'customer' && o.book === 'bus' && !busOpen) fail('বাস আপনার স্টপ পার হওয়ার পর টিকেট বাতিল করা যাবে না');
    if (by === 'customer' && o.status !== 'placed' && !busOpen) fail('দোকান গ্রহণ করার পর দোকানে ফোন করে বাতিল করুন');
    o.offer = null;
    o.needsRider = false;
    if (o.delivery) noteRider(o.delivery.phone, code, 'cancelled');
    bookingNote(o, 'cancelled');
    // money paid online goes back the same way; the team sees it in the refund list
    if (o.paid && !o.refund) o.refund = { amount: o.total, reason: '', phone: '', auto: true, status: 'open', paid: 0, note: '', at: new Date().toISOString() };
    push(o, 'cancelled', by, reason);
  }

  // an item of a sub-category still waiting for the team is kept apart until it is approved
  function saveItem(shopId, id, v) {
    const shop = shopById(shopId);
    if (id) {
      const it = findItem(shop, id) || fail('পণ্য পাওয়া যায়নি');
      const old = Object.assign({}, it);
      Object.assign(it, v);
      sortItem(shop, it);
      commit(() => { Object.keys(it).forEach((k) => delete it[k]); Object.assign(it, old); sortItem(shop, it); });
    } else {
      const it = Object.assign({ id: shopId + '-' + Date.now().toString(36), available: true }, v);
      shop.items.unshift(it);
      sortItem(shop, it);
      commit(() => { shop.items = shop.items.filter((x) => x !== it); shop.waiting = shop.waiting.filter((x) => x !== it); });
    }
  }
  function deleteItem(shopId, id) {
    const shop = shopById(shopId);
    shop.items = shop.items.filter((x) => x.id !== id);
    shop.waiting = (shop.waiting || []).filter((x) => x.id !== id);
    const g = data.cart.groups[shopId];
    if (g) {
      delete g.lines[id];
      if (!Object.keys(g.lines).length) delete data.cart.groups[shopId];
    }
    save();
  }
  /* ---------- ratings: only a customer's own finished order can rate, once ---------- */
  const isFinished = (o) => o.status === 'delivered' || o.status === 'completed';
  const ratingOf = (code, about) => data.ratings.find((r) => r.orderCode === code && r.about === about) || null;
  const ratingsOf = (about, targetId, all) => data.ratings.filter((r) => r.about === about && r.targetId === targetId && (all || !r.hidden)).sort((a, b) => b.at.localeCompare(a.at));
  function ratingSummary(about, targetId) {
    const l = ratingsOf(about, targetId);
    return { n: l.length, avg: l.length ? Math.round((l.reduce((a, r) => a + r.stars, 0) / l.length) * 10) / 10 : 0 };
  }
  function rate(code, customerId, about, stars, text) {
    const o = orderBy(code);
    if (o.customerId !== customerId) fail('এই অর্ডার আপনার নয়');
    if (!isFinished(o)) fail('অর্ডার সম্পন্ন হওয়ার পর রেটিং দিতে পারবেন');
    const targetId = about === 'rider' ? (o.delivery ? o.delivery.phone : null) : about === 'shop' ? o.shopId : null;
    if (!targetId) fail('এই অর্ডারে ডেলিভারি ম্যান ছিলেন না');
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) fail('১ থেকে ৫ এর মধ্যে তারা বেছে নিন');
    if (ratingOf(code, about)) fail('এই অর্ডারে আপনি আগেই রেটিং দিয়েছেন');
    const who = data.accounts.find((a) => a.id === customerId);
    data.ratings.push({ id: 'rt' + Date.now().toString(36) + data.ratings.length, orderCode: code, about, targetId, customerId, by: who ? who.first : '', stars, text: String(text || '').trim().slice(0, 300), at: new Date().toISOString(), hidden: false });
    const notesBefore = data.notes.length;
    if (about === 'shop') notifyShop(o, 'rated');
    commit(() => { data.ratings.pop(); data.notes.splice(0, data.notes.length - notesBefore); });
  }
  // hiding a rating takes it away from users, so it needs a reason
  function setRatingHidden(id, hidden, reason) {
    need('ratings');
    const r = data.ratings.find((x) => x.id === id) || fail('রেটিং পাওয়া যায়নি');
    const why = hidden ? reasonOf(reason, 'লুকানোর কারণ লিখুন') : '';
    r.hidden = !!hidden;
    audit(hidden ? 'rating-hide' : 'rating-show', { kind: 'rating', id: r.id, name: r.by + ' · ' + r.stars + '★' }, why);
    save();
  }

  /* ---------- refunds: the customer asks, the LocalHaat team decides ---------- */
  function refundAsk(code, customerId, p) {
    const o = orderBy(code);
    if (o.customerId !== customerId) fail('এই অর্ডার আপনার নয়');
    if (!isFinished(o)) fail('অর্ডার সম্পন্ন হওয়ার পর রিফান্ড চাওয়া যাবে');
    if (o.refund) fail('এই অর্ডারে আগেই রিফান্ড চাওয়া হয়েছে');
    if (!Number.isInteger(p.amount) || p.amount < 1 || p.amount > o.total) fail('রিফান্ডের টাকা অর্ডারের মোটের মধ্যে দিন');
    if (String(p.reason).trim().length < 5) fail('রিফান্ডের কারণ লিখুন');
    if (!/^01[3-9]\d{8}$/.test(p.phone)) fail('১১ সংখ্যার মোবাইল নম্বর লিখুন, যেমন 017XXXXXXXX।');
    o.refund = { amount: p.amount, reason: String(p.reason).trim().slice(0, 500), phone: p.phone, status: 'open', paid: 0, note: '', at: new Date().toISOString() };
    commit(() => { delete o.refund; });
  }
  // A refund asked above the limit takes two people: one decides, another of finance or the super admin approves.
  // Below it, one decision is final. Each decision needs a reason the customer sees.
  const needsTwo = (o) => o.refund.amount > data.refundLimit;
  function refundFinal(o, d) {
    Object.assign(o.refund, { status: d.status, paid: d.status === 'paid' ? d.amount : 0, note: d.note, decidedAt: new Date().toISOString() });
    notify(o.customerId, 'refund', o.code);
  }
  function refundDecide(code, status, amount, note) {
    const o = orderBy(code);
    const me = need('refunds', shopById(o.shopId));
    if (!o.refund || o.refund.status !== 'open') fail('এই রিফান্ড আগেই ঠিক হয়ে গেছে');
    if (o.refund.step1) fail('প্রথম সিদ্ধান্ত হয়ে গেছে, এখন আরেকজনের অনুমোদন লাগবে');
    if (status !== 'paid' && status !== 'rejected') fail('এই ধাপ এখন করা যাবে না');
    if (status === 'paid' && (!Number.isInteger(amount) || amount < 1 || amount > o.total)) fail('রিফান্ডের টাকা অর্ডারের মোটের মধ্যে দিন');
    const why = reasonOf(note, status === 'paid' ? 'নোট লিখুন: কীভাবে, কোন নম্বরে টাকা ফেরত দিলেন' : 'বাতিলের কারণ লিখুন');
    const d = { status, amount: status === 'paid' ? amount : 0, note: why, by: me.id, byName: me.name, at: new Date().toISOString() };
    if (needsTwo(o)) {
      o.refund.step1 = d;
      delete o.refund.sentBack;
      audit('refund-step1', placeOfOrder(o), why, { after: status === 'paid' ? '৳' + amount : 'বাতিল' });
      save();
      return 'check';
    }
    refundFinal(o, d);
    o.refund.by = me.name;
    audit(status === 'paid' ? 'refund-paid' : 'refund-rejected', placeOfOrder(o), why, { after: status === 'paid' ? '৳' + amount : 'বাতিল' });
    save();
    return 'done';
  }
  // the second person: approves the first decision, or sends it back with a reason; never their own
  function refundCheck(code, ok, note) {
    const o = orderBy(code);
    const me = need('refunds', shopById(o.shopId));
    const d = (o.refund && o.refund.status === 'open' && o.refund.step1) || fail('এখানে অনুমোদনের কিছু নেই');
    if (d.by === me.id) fail('নিজের সিদ্ধান্ত নিজে অনুমোদন করা যাবে না, আরেকজন লাগবে');
    if (ok) {
      refundFinal(o, d);
      Object.assign(o.refund, { by: d.byName, checkedBy: me.name });
      delete o.refund.step1;
      audit('refund-approve', placeOfOrder(o), String(note || '').trim().slice(0, 300), { after: d.status === 'paid' ? '৳' + d.amount : 'বাতিল' });
    } else {
      const why = reasonOf(note, 'ফেরত পাঠানোর কারণ লিখুন');
      o.refund.sentBack = { by: me.name, note: why, at: new Date().toISOString() };
      delete o.refund.step1;
      audit('refund-send-back', placeOfOrder(o), why);
    }
    save();
  }

  /* ---------- offers: company coupons for cart orders, on the price of the items ---------- */
  const offerLive = (of) => of.active && !(of.until && of.until < todayStr());
  const offerUses = (code) => new Set(data.orders.filter((o) => o.offerCode === code && o.status !== 'cancelled').map((o) => o.group || o.code)).size;
  function offerQuote(raw, customerId, sub) {
    const code = String(raw || '').trim().toUpperCase();
    const of = data.offers.find((x) => x.code === code);
    if (!of || !of.active) fail('এই অফার কোড ঠিক নয়');
    if (!offerLive(of)) fail('এই অফারের মেয়াদ শেষ');
    if (sub < of.minOrder) fail(`এই অফারে কমপক্ষে ৳${bnNum(of.minOrder)} এর পণ্য লাগবে`);
    if (data.orders.some((o) => o.customerId === customerId && o.offerCode === code && o.status !== 'cancelled')) fail('এই অফার আপনি আগেই ব্যবহার করেছেন');
    const off = of.kind === 'percent' ? Math.round((sub * of.value) / 100) : of.value;
    return { code, off: Math.min(off, sub) };
  }
  function saveOffer(id, v) {
    need('ads');
    const code = String(v.code || '').trim().toUpperCase();
    if (String(v.title || '').trim().length < 2) fail('অফারের নাম দিন');
    if (!/^[A-Z0-9]{3,15}$/.test(code)) fail('কোড ৩-১৫ অক্ষরের দিন (ইংরেজি অক্ষর ও সংখ্যা)');
    if (data.offers.some((x) => x.code === code && x.id !== id)) fail('এই কোড আগেই আছে');
    if (v.kind !== 'flat' && v.kind !== 'percent') fail('ছাড়ের ধরন বেছে নিন');
    if (!Number.isInteger(v.value) || v.value < 1 || v.value > (v.kind === 'percent' ? 100 : 100000)) fail(v.kind === 'percent' ? 'ছাড় ১ থেকে ১০০ শতাংশের মধ্যে দিন' : 'ছাড়ের টাকা সংখ্যায় লিখুন');
    if (!Number.isInteger(v.minOrder) || v.minOrder < 0) fail('কমপক্ষে কত টাকার পণ্য লাগবে, সংখ্যায় লিখুন');
    const clean = { title: String(v.title).trim().slice(0, 60), code, kind: v.kind, value: v.value, minOrder: v.minOrder, until: v.until || '' };
    if (id) Object.assign(data.offers.find((x) => x.id === id) || fail('অফার পাওয়া যায়নি'), clean);
    else data.offers.unshift(Object.assign({ id: 'of' + Date.now().toString(36), active: true }, clean));
    audit(id ? 'offer-edit' : 'offer-add', { kind: 'offer', id: id || data.offers[0].id, name: clean.code });
    save();
  }
  function setOfferActive(id, on) {
    need('ads');
    const of = data.offers.find((x) => x.id === id) || fail('অফার পাওয়া যায়নি');
    of.active = !!on;
    audit(on ? 'offer-on' : 'offer-off', { kind: 'offer', id, name: of.code });
    save();
  }
  function deleteOffer(id, reason) {
    need('ads');
    const of = data.offers.find((x) => x.id === id) || fail('অফার পাওয়া যায়নি');
    const why = reasonOf(reason, 'মোছার কারণ লিখুন');
    data.offers = data.offers.filter((x) => x.id !== id);
    audit('offer-delete', { kind: 'offer', id, name: of.code }, why);
    save();
  }

  /* ---------- home page ads, run by the LocalHaat team ---------- */
  const adItem = (ad) => { const s = shopById(ad.shopId); return s && ad.kind === 'item' ? s.items.find((x) => x.id === ad.itemId) || null : null; };
  // an ad shows only while its shop is open to users and its product is still on sale
  function adLive(ad) {
    const s = shopById(ad.shopId);
    if (!ad.active || !s || !shopLive(s)) return false;
    return ad.kind !== 'item' || !!(adItem(ad) && adItem(ad).available);
  }
  function saveAd(id, v) {
    need('ads');
    const s = shopById(v.shopId) || fail('দোকান বা সেবা বেছে নিন');
    if (v.kind !== 'item' && v.kind !== 'shop') fail('বিজ্ঞাপনের ধরন বেছে নিন');
    if (v.kind === 'item' && !s.items.some((x) => x.id === v.itemId)) fail('পণ্য বা সেবা বেছে নিন');
    const clean = { kind: v.kind, shopId: s.id, itemId: v.kind === 'item' ? v.itemId : '', text: String(v.text || '').trim().slice(0, 60) };
    if (id) Object.assign(data.ads.find((x) => x.id === id) || fail('বিজ্ঞাপন পাওয়া যায়নি'), clean);
    else data.ads.unshift(Object.assign({ id: 'ad' + Date.now().toString(36), active: true }, clean));
    audit(id ? 'ad-edit' : 'ad-add', Object.assign(placeOfShop(s), { kind: 'ad', id: id || data.ads[0].id }));
    save();
  }
  function setAdActive(id, on) {
    need('ads');
    const ad = data.ads.find((x) => x.id === id) || fail('বিজ্ঞাপন পাওয়া যায়নি');
    ad.active = !!on;
    audit(on ? 'ad-on' : 'ad-off', Object.assign(placeOfShop(shopById(ad.shopId)), { kind: 'ad', id }));
    save();
  }
  function deleteAd(id, reason) {
    need('ads');
    const ad = data.ads.find((x) => x.id === id) || fail('বিজ্ঞাপন পাওয়া যায়নি');
    const why = reasonOf(reason, 'মোছার কারণ লিখুন');
    data.ads = data.ads.filter((x) => x.id !== id);
    audit('ad-delete', Object.assign(placeOfShop(shopById(ad.shopId)), { kind: 'ad', id }), why);
    save();
  }
  // the order users see them in
  function moveAd(id, by) {
    need('ads');
    const i = data.ads.findIndex((x) => x.id === id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= data.ads.length) return;
    [data.ads[i], data.ads[j]] = [data.ads[j], data.ads[i]];
    save();
  }

  /* ---------- sales: finished orders through LocalHaat, by month and by area ---------- */
  // A finished order counts on the day it finished, a cancelled one on the day it was placed. The value is the
  // price of the items or the agreed bill; the delivery charge and a LocalHaat offer are kept apart.
  // LocalHaat keeps its commission on the value and the delivery charge, and pays for its own offers. Cash paid at the
  // shop stays with the agent; cash given to the delivery man and money paid online come to LocalHaat.
  // balance: what LocalHaat owes the agent for the order, or below zero what the agent owes LocalHaat.
  function money(value, rate, cashAtShop) {
    const commission = Math.round((value * rate) / 100);
    return { commission, balance: value - commission - cashAtShop };
  }
  const CASH_WITH_AGENT = ['shop', 'counter', 'bus'];
  const orderMoney = (o) => money(o.mode === 'service' ? o.total : o.sub, o.rate === undefined ? data.commission : o.rate, CASH_WITH_AGENT.includes(o.pay) ? o.total : 0);
  // a launch ticket is sold when the launch leaves, boarded or not; it counts on the day it left
  const ticketDone = (o) => o.book === 'launch' && o.status === 'confirmed' && new Date(o.launch.dep) < new Date();
  function salesRows() {
    const rows = [];
    const none = { commission: 0, balance: 0 };
    data.orders.forEach((o) => {
      if (isFinished(o) || ticketDone(o)) {
        const end = o.history.filter((h) => h.status === o.status).pop();
        rows.push(Object.assign({ shopId: o.shopId, day: dayStr(new Date(o.book === 'launch' ? o.launch.dep : end ? end.at : o.createdAt)), value: o.mode === 'service' ? o.total : o.sub, fee: o.fee || 0, off: o.discount || 0, cancelled: false, lines: o.lines.map((l) => [l.name, l.qty]) }, orderMoney(o)));
      } else if (o.status === 'cancelled') {
        // what a given-back launch ticket kept back: LocalHaat's share of it, and who holds the money
        const kept = o.keep > 0 ? money(o.keep, KEEP_SHARE, o.paid ? 0 : o.keep) : none;
        rows.push(Object.assign({ shopId: o.shopId, day: dayStr(new Date(o.createdAt)), value: 0, kept: o.keep || 0, fee: 0, off: 0, cancelled: true, lines: [] }, kept));
      }
    });
    // a sample order with a delivery charge was cash on delivery, one without it was paid at the shop
    (data.pastSales || []).forEach((p) => rows.push(Object.assign({ shopId: p.s, day: p.d, value: p.x ? 0 : p.t, fee: p.x ? 0 : p.f, off: 0, cancelled: !!p.x, lines: p.x ? [] : p.l, demo: true },
      p.x ? none : money(p.t, data.commission, p.f ? 0 : p.t))));
    return rows;
  }
  // the last n months, this one first, as "YYYY-MM"
  function salesMonths(n) {
    const now = new Date();
    return Array.from({ length: n }, (_, i) => dayStr(new Date(now.getFullYear(), now.getMonth() - i, 1)).slice(0, 7));
  }
  // one shop's month, or every shop's when shopId is empty
  function salesReport(shopId, month, rows) {
    const list = (rows || salesRows()).filter((r) => r.day.startsWith(month) && (!shopId || r.shopId === shopId));
    const done = list.filter((r) => !r.cancelled);
    const items = {};
    done.forEach((r) => r.lines.forEach(([name, qty]) => { items[name] = (items[name] || 0) + qty; }));
    return {
      month, orders: done.length, cancelled: list.length - done.length, sales: done.reduce((a, r) => a + r.value, 0),
      fees: done.reduce((a, r) => a + r.fee, 0), offs: done.reduce((a, r) => a + r.off, 0), demo: list.some((r) => r.demo),
      commission: list.reduce((a, r) => a + r.commission, 0), balance: list.reduce((a, r) => a + r.balance, 0), kept: list.reduce((a, r) => a + (r.kept || 0), 0),
      items: Object.entries(items).sort((a, b) => b[1] - a[1]).slice(0, 5)
    };
  }
  // Who sells most in an area: finished orders in the last 30 days, the bill as a tie-break. Shops with none are left out.
  function areaRanks(zila, area, rows) {
    const from = dayStr(new Date(Date.now() - 30 * 864e5));
    const all = (rows || salesRows()).filter((r) => !r.cancelled && r.day >= from);
    return data.shops.filter((s) => shopLive(s) && s.area === area && (!s.zila || !zila || s.zila === zila))
      .map((s) => { const mine = all.filter((r) => r.shopId === s.id); return { shop: s, orders: mine.length, sales: mine.reduce((a, r) => a + r.value, 0) }; })
      .filter((x) => x.orders)
      .sort((a, b) => b.orders - a.orders || b.sales - a.sales)
      .map((x, i) => Object.assign(x, { rank: i + 1 }));
  }
  // a shop's place among the shops of its own area
  function shopRank(shopId, rows) {
    const s = shopById(shopId);
    if (!s) return null;
    const list = areaRanks(s.zila, s.area, rows);
    const me = list.find((x) => x.shop.id === shopId);
    return { list, rank: me ? me.rank : 0, of: data.shops.filter((x) => shopLive(x) && x.area === s.area && (!x.zila || !s.zila || x.zila === s.zila)).length };
  }

  /* ---------- support: a conversation between one account and the LocalHaat team ---------- */
  const ticketById = (id) => data.support.find((t) => t.id === id) || null;
  function ticketNew(p) {
    const subject = String(p.subject || '').trim();
    const text = String(p.text || '').trim();
    if (subject.length < 3) fail('বিষয় লিখুন');
    if (text.length < 5) fail('সমস্যাটি একটু লিখুন');
    const at = new Date().toISOString();
    const t = { id: 'tk' + Date.now().toString(36) + data.support.length, role: p.role, accountId: p.accountId, name: p.name, contact: p.contact, subject: subject.slice(0, 80), orderCode: p.orderCode || '', status: 'open', msgs: [{ by: 'user', text: text.slice(0, 1000), at }], seenUser: 1, seenTeam: 0, at };
    data.support.unshift(t);
    commit(() => data.support.shift());
    return t;
  }
  function ticketReply(id, by, text) {
    const t = ticketById(id) || fail('অনুরোধ পাওয়া যায়নি');
    const body = String(text || '').trim();
    if (!body) fail('বার্তা লিখুন');
    if (by === 'team') { need('support', placeOfTicket(t)); audit('ticket-reply', placeOfTicket(t)); }
    const was = t.status;
    t.msgs.push({ by, text: body.slice(0, 1000), at: new Date().toISOString() });
    t[by === 'team' ? 'seenTeam' : 'seenUser'] = t.msgs.length;
    if (by === 'user') t.status = 'open';
    const notesBefore = data.notes.length;
    if (by === 'team') notify(t.accountId, 'support', t.id);
    commit(() => { t.msgs.pop(); t.status = was; data.notes.splice(0, data.notes.length - notesBefore); });
  }
  // "call me back": the team sees it at the top of its list with the number and how long it has waited
  function callbackAsk(p) {
    const phone = String(p.phone || '').trim();
    if (!/^01[3-9]\d{8}$/.test(phone)) fail('১১ সংখ্যার মোবাইল নম্বর লিখুন, যেমন 017XXXXXXXX।');
    if (data.support.some((t) => t.accountId === p.accountId && t.callback && !t.callback.done)) fail('আপনার কল ব্যাকের অনুরোধ আগেই আছে, টিম কল করবে');
    const at = new Date().toISOString();
    const t = { id: 'tk' + Date.now().toString(36) + data.support.length, role: p.role, accountId: p.accountId, name: p.name, contact: p.contact, subject: '', orderCode: p.orderCode || '', status: 'open',
      callback: { phone, done: false, at }, msgs: [{ by: 'user', kind: 'call-ask', text: phone, at }], seenUser: 1, seenTeam: 0, at };
    data.support.unshift(t);
    commit(() => data.support.shift());
    return t;
  }
  function callbackDone(id) {
    const t = ticketById(id) || fail('অনুরোধ পাওয়া যায়নি');
    need('support', placeOfTicket(t));
    if (!t.callback || t.callback.done) fail('এই কল ব্যাক আগেই হয়ে গেছে');
    audit('callback-done', placeOfTicket(t));
    const at = new Date().toISOString();
    t.callback.done = true;
    t.callback.doneAt = at;
    t.msgs.push({ by: 'team', kind: 'call-done', text: '', at });
    t.seenTeam = t.msgs.length;
    notify(t.accountId, 'support', t.id);
    save();
  }
  const callbacksWaiting = () => data.support.filter((t) => t.callback && !t.callback.done);
  function ticketSetStatus(id, status) {
    const t = ticketById(id) || fail('অনুরোধ পাওয়া যায়নি');
    need('support', placeOfTicket(t));
    t.status = status === 'closed' ? 'closed' : 'open';
    audit(t.status === 'closed' ? 'ticket-close' : 'ticket-open', placeOfTicket(t));
    save();
  }
  function ticketSeen(t, by) {
    const k = by === 'team' ? 'seenTeam' : 'seenUser';
    if (t[k] !== t.msgs.length) { t[k] = t.msgs.length; save(true); }
  }
  const ticketUnread = (t, by) => t.msgs.slice(by === 'team' ? t.seenTeam : t.seenUser).filter((m) => m.by !== by).length;

  /* ---------- the LocalHaat team's control over shops and delivery men ---------- */
  function setShopVerified(id, on) {
    const s = shopById(id) || fail('দোকান পাওয়া যায়নি');
    need('shop.verify', s);
    s.verified = !!on;
    audit(on ? 'shop-verify' : 'shop-unverify', placeOfShop(s));
    save();
  }
  function suspendShop(id, reason) {
    const s = shopById(id) || fail('দোকান পাওয়া যায়নি');
    need('shop.suspend', s);
    const why = reasonOf(reason, 'স্থগিতের কারণ লিখুন');
    s.suspended = { reason: why, at: new Date().toISOString() };
    audit('shop-suspend', placeOfShop(s), why);
    save();
  }
  function unsuspendShop(id) {
    const s = shopById(id) || fail('দোকান পাওয়া যায়নি');
    need('shop.suspend', s);
    delete s.suspended;
    audit('shop-resume', placeOfShop(s));
    save();
  }
  function setShopArea(id, zila, upazila) {
    const s = shopById(id) || fail('দোকান পাওয়া যায়নি');
    need('shop.area', s);
    const where = String(upazila || '').normalize('NFC').trim();
    if (!zila) fail('জেলা বেছে নিন');
    if (where.length < 2) fail('উপজেলা / থানা দিন');
    const before = s.area + ', ' + s.zila;
    Object.assign(s, { zila, area: where });
    audit('shop-area', placeOfShop(s), '', { before, after: where + ', ' + zila });
    save();
  }
  // The team's change. A delivery man moved to another upazila puts his point on the map again; until then he works the whole upazila.
  function setRiderArea(id, zila, upazila, more) {
    const where = String(upazila || '').normalize('NFC').trim();
    if (!zila) fail('জেলা বেছে নিন');
    if (where.length < 2) fail('উপজেলা / থানা দিন');
    const a = riderAccounts().find((x) => x.id === id) || fail('পাওয়া যায়নি');
    need('rider.area', a);
    const before = (a.area || '') + ', ' + (a.zila || '');
    // the address and the bazar go together; someone who signed up before v10 may have neither yet
    const m = more || {};
    const extra = words(m.addr) || words(m.market) ? baseText(m) : {};
    if (m.km !== undefined && !RIDER_KM.includes(m.km)) fail('কত দূর পর্যন্ত যাবেন, বেছে নিন');
    if (a.zila !== zila || a.area !== where) { delete a.lat; delete a.lng; }
    Object.assign(a, { zila, area: where }, extra, m.km !== undefined ? { km: m.km } : {});
    audit('rider-area', { kind: 'rider', id: a.contact, name: a.name, zila, area: where }, '', { before, after: where + ', ' + zila });
    fillWaiting();
  }
  function baseText(p) {
    const addr = words(p.addr);
    const market = words(p.market);
    if (addr.length < 5) fail('পুরো ঠিকানা লিখুন (কমপক্ষে ৫ অক্ষর)');
    if (market.length < 2) fail('কোন বাজারের আন্ডারে কাজ করবেন, লিখুন');
    return { addr: addr.slice(0, 150), market: market.slice(0, 60) };
  }
  const inBangladesh = (lat, lng) => Number.isFinite(lat) && Number.isFinite(lng) && lat > 20.3 && lat < 26.8 && lng > 87.9 && lng < 92.8;
  // A delivery man's own working area: district, upazila, full address, his bazar, his point on the map and how far he goes.
  function checkRiderBase(p) {
    if (!Object.hasOwn(window.LH_GEO, p.zila || '')) fail('জেলা বেছে নিন');
    const area = words(p.area);
    if (area.length < 2) fail('উপজেলা / থানা দিন');
    const text = baseText(p);
    if (!inBangladesh(p.lat, p.lng)) fail('ম্যাপে আপনার জায়গায় পিন দিন, অথবা GPS চাপুন');
    if (!RIDER_KM.includes(p.km)) fail('কত দূর পর্যন্ত যাবেন, বেছে নিন');
    return Object.assign({ zila: p.zila, area }, text, { lat: p.lat, lng: p.lng, km: p.km });
  }
  function setRiderBase(id, p) {
    const a = riderAccounts().find((x) => x.id === id) || fail('পাওয়া যায়নি');
    Object.assign(a, checkRiderBase(p));
    fillWaiting();
  }
  // shops of an upazila whose bazar a delivery man can pick, and how far a shop is from him
  const bazarsOf = (zila, area) => [...new Set(data.shops.filter((s) => s.zila === zila && s.area === area && s.market).map((s) => words(s.market)))];
  const riderKm = (a, shop) => (a && a.lat && shop && shop.lat ? Math.round(kmBetween(a, shop) * 10) / 10 : null);
  // A delivery man is known by phone; an order saved before the company took over delivery can be the only record of one.
  function riders() {
    const map = new Map();
    const add = (phone, name) => { if (!map.has(phone)) map.set(phone, { phone, name, zila: '', area: '', account: null }); return map.get(phone); };
    data.orders.forEach((o) => { if (o.delivery) add(o.delivery.phone, o.delivery.name); });
    riderAccounts().forEach((a) => { Object.assign(add(a.contact, a.name), { name: a.name, zila: a.zila || '', area: a.area || '', account: a }); });
    return [...map.values()].map((r) => Object.assign(r, {
      key: hash(r.phone), blocked: data.riderBlocks[r.phone] || null, free: !!r.account && riderFree(r.account),
      delivered: data.orders.filter((o) => o.status === 'delivered' && o.delivery && o.delivery.phone === r.phone).length,
      active: data.orders.filter((o) => !isFinal(o) && o.delivery && o.delivery.phone === r.phone).length
    }));
  }
  const riderBlock = (phone) => data.riderBlocks[phone] || null;
  // A new delivery man sends his NID, and for a motorcycle or a pickup his driving licence and number plate.
  // The team checks them before he gets any job. Pictures are already resized in the browser.
  const PIC = /^data:image\/(webp|jpeg);base64,[A-Za-z0-9+/=]+$/;
  const needsLicence = (a) => PAPER_VEHICLES.includes(a.vehicle);
  function riderPapers(id, p) {
    const a = riderAccounts().find((x) => x.id === id) || fail('পাওয়া যায়নি');
    if (a.kyc && a.kyc.status === 'ok') fail('আপনার কাগজ আগেই যাচাই হয়েছে');
    const nid = String(p.nid || '').replace(/[\s-]/g, '');
    if (!/^(\d{10}|\d{13}|\d{17})$/.test(nid)) fail('এনআইডি নম্বর ১০, ১৩ বা ১৭ সংখ্যার দিন');
    if (!PIC.test(p.front || '') || !PIC.test(p.back || '')) fail('এনআইডির সামনের ও পেছনের ছবি দিন');
    const lic = needsLicence(a);
    const licence = String(p.licence || '').trim();
    const plate = String(p.plate || '').trim();
    if (lic && licence.length < 5) fail('ড্রাইভিং লাইসেন্সের নম্বর দিন');
    if (lic && !PIC.test(p.licencePic || '')) fail('ড্রাইভিং লাইসেন্সের ছবি দিন');
    if (lic && plate.length < 4) fail('গাড়ির নম্বর প্লেট লিখুন');
    const old = a.kyc;
    const was = a.approved;
    a.kyc = { status: 'pending', nid, front: p.front, back: p.back, licence: lic ? licence.slice(0, 30) : '', licencePic: lic ? p.licencePic : '', plate: lic ? plate.slice(0, 30) : '', at: new Date().toISOString() };
    a.approved = false;
    commit(() => { a.kyc = old; a.approved = was; });
  }
  function approveRider(id) {
    const a = riderAccounts().find((x) => x.id === id) || fail('পাওয়া যায়নি');
    need('rider.papers', a);
    if (!a.kyc || a.kyc.status !== 'pending') fail('আগে এনআইডি ও কাগজ জমা দিতে হবে');
    audit('rider-approve', placeOfRider(a.contact));
    a.approved = true;
    a.kyc.status = 'ok';
    a.kyc.decidedAt = new Date().toISOString();
    delete a.kyc.reason;
    fillWaiting();
  }
  // the papers go back with the reason; he can send them again
  function rejectRider(id, reason) {
    const a = riderAccounts().find((x) => x.id === id) || fail('পাওয়া যায়নি');
    need('rider.papers', a);
    const why = reasonOf(reason, 'বাতিলের কারণ লিখুন');
    if (!a.kyc || a.kyc.status !== 'pending') fail('এই কাগজ এখন বাতিল করা যাবে না');
    a.approved = false;
    Object.assign(a.kyc, { status: 'rejected', reason: why, decidedAt: new Date().toISOString() });
    audit('rider-reject', placeOfRider(a.contact), why);
    save();
  }
  // his jobs not yet picked up go to someone else; a job already in hand stays with him to finish
  function blockRider(phone, reason) {
    need('rider.suspend', placeOfRider(phone));
    const why = reasonOf(reason, 'স্থগিতের কারণ লিখুন');
    data.riderBlocks[phone] = { reason: why, at: new Date().toISOString() };
    audit('rider-suspend', placeOfRider(phone), why);
    data.orders.filter((o) => o.delivery && o.delivery.phone === phone && ['confirmed', 'packed'].includes(o.status)).forEach((o) => {
      noteRider(phone, o.code, 'removed');
      sendToRider(o);
    });
    save();
  }
  function unblockRider(phone) {
    need('rider.suspend', placeOfRider(phone));
    delete data.riderBlocks[phone];
    audit('rider-resume', placeOfRider(phone));
    fillWaiting();
  }

  /* ---------- the LocalHaat team: an account for each person, roles, a two-step login and the audit log ---------- */
  // What each role may do. A division's staff do it only inside their own division.
  const ROLES = { super: 'সুপার অ্যাডমিন', support: 'সাপোর্ট', verify: 'ভেরিফিকেশন', finance: 'ফাইন্যান্স', division: 'বিভাগীয় স্টাফ' };
  const PERMS = {
    super: ['*'],
    support: ['dash', 'riders', 'rider.suspend', 'assign', 'support', 'orders'],
    verify: ['dash', 'shops', 'shop.verify', 'shop.suspend', 'shop.area', 'cats', 'riders', 'rider.papers', 'rider.suspend', 'rider.area', 'docs'],
    finance: ['dash', 'orders', 'refunds', 'report'],
    division: ['dash', 'shops', 'riders', 'assign', 'support', 'orders', 'report']
  };
  const TEAM_CODE_MIN = 5;
  const TEAM_CODE_TRIES = 3;
  // one demo login for each role; the password of each is demo1234
  function seedTeam() {
    return [
    ['tm-super', 'রাশেদ করিম', '01700000001', 'super', ''], ['tm-support', 'তানিয়া সুলতানা', '01700000002', 'support', ''],
    ['tm-verify', 'মাহমুদ হাসান', '01700000003', 'verify', ''], ['tm-finance', 'শারমিন আক্তার', '01700000004', 'finance', ''],
    ['tm-dhaka', 'আরিফুল ইসলাম', '01700000005', 'division', 'ঢাকা']
  ].map(([id, name, contact, role, division]) => ({ id, name, contact, pw: hash('demo1234'), role, division, active: true, at: '', by: '' }));
  }
  const teamMe = () => { const m = data.team.find((x) => x.id === data.sessions.team); return m && m.active ? m : null; };
  const divOfZila = (zila) => Object.keys(window.LH_DIV || {}).find((d) => window.LH_DIV[d].includes(zila)) || '';
  // whether the person logged in may do this; a place narrows a division's staff to their own division
  function can(perm, place) {
    const m = teamMe();
    if (!m) return false;
    const list = PERMS[m.role] || [];
    if (!list.includes('*') && !list.includes(perm)) return false;
    if (m.role === 'division' && place !== undefined) return !!place && divOfZila(place.zila) === m.division;
    return true;
  }
  const need = (perm, place) => { if (!can(perm, place)) fail('এই কাজের অনুমতি নেই'); return teamMe(); };
  // The audit log only grows: there is no way to change or delete an entry.
  function audit(action, target, reason, change) {
    const m = teamMe();
    const t = target || {};
    data.audit.unshift({
      id: 'au' + Date.now().toString(36) + data.audit.length, at: new Date().toISOString(), by: m ? m.id : (t.by || ''), byName: m ? m.name : (t.byName || ''), role: m ? m.role : '',
      action, kind: t.kind || '', target: t.id || '', name: t.name || '', zila: t.zila || '', area: t.area || '', reason: reason || '', change: change || null
    });
  }
  // a reason the team must give: at least five letters
  const reasonOf = (r, msg) => { const why = String(r || '').trim(); if (why.length < 5) fail(msg || 'কারণ লিখুন (কমপক্ষে ৫ অক্ষর)'); return why.slice(0, 300); };
  const placeOfShop = (s) => (s ? { kind: 'shop', id: s.id, name: s.name, zila: s.zila, area: s.area } : {});
  const placeOfRider = (phone) => { const a = riderAccounts().find((x) => x.contact === phone); return { kind: 'rider', id: phone, name: a ? a.name : phone, zila: a ? a.zila : '', area: a ? a.area : '' }; };
  const placeOfOrder = (o) => { const s = shopById(o.shopId); return { kind: 'order', id: o.code, name: o.shopName, zila: s ? s.zila : '', area: s ? s.area : '' }; };
  function placeOfTicket(t) {
    const a = t.accountId && data.accounts.find((x) => x.id === t.accountId);
    const s = a && a.role === 'owner' ? shopById(a.shopId) : null;
    const o = !s && !(a && a.role === 'delivery') && t.orderCode ? data.orders.find((x) => x.code === t.orderCode) : null;
    const p = s || (a && a.role === 'delivery' ? a : null) || (o ? shopById(o.shopId) : null) || {};
    return { kind: 'ticket', id: t.id, name: t.name, zila: p.zila || '', area: p.area || '' };
  }
  // Step one: the password. A six-digit code follows; the prototype shows it on the screen as a demo.
  function teamLogin(contact, pw) {
    const c = String(contact || '').trim().toLowerCase();
    const m = data.team.find((x) => x.contact.toLowerCase() === c);
    if (!m || m.pw !== hash(String(pw || ''))) {
      audit('login-fail', { kind: 'team', id: c, name: c });
      save();
      fail('মোবাইল / ইমেইল বা পাসওয়ার্ড ভুল');
    }
    if (!m.active) fail('আপনার একাউন্ট বন্ধ করা হয়েছে। সুপার অ্যাডমিনের সাথে যোগাযোগ করুন।');
    const code = String(Math.floor(100000 + Math.random() * 900000));
    data.sessions.teamPending = { id: m.id, code, until: new Date(Date.now() + TEAM_CODE_MIN * 6e4).toISOString(), tries: 0 };
    save();
    return { code, name: m.name };
  }
  // Step two: the code. Three wrong codes, or a late one, start again from the password.
  function teamVerify(code) {
    const p = data.sessions.teamPending || fail('আবার মোবাইল ও পাসওয়ার্ড দিন');
    if (new Date(p.until) < new Date()) { delete data.sessions.teamPending; save(); fail('কোডের সময় শেষ। আবার মোবাইল ও পাসওয়ার্ড দিন।'); }
    if (String(code || '').trim() !== p.code) {
      p.tries++;
      if (p.tries >= TEAM_CODE_TRIES) { delete data.sessions.teamPending; save(); fail('তিনবার ভুল কোড। আবার মোবাইল ও পাসওয়ার্ড দিন।'); }
      save();
      fail('কোড মেলেনি');
    }
    const m = data.team.find((x) => x.id === p.id);
    if (!m || !m.active) { delete data.sessions.teamPending; save(); fail('আপনার একাউন্ট বন্ধ করা হয়েছে। সুপার অ্যাডমিনের সাথে যোগাযোগ করুন।'); }
    delete data.sessions.teamPending;
    data.sessions.team = m.id;
    m.last = new Date().toISOString();
    audit('login', { kind: 'team', id: m.id, name: m.name });
    save();
    return m;
  }
  function teamLogout() {
    const m = teamMe();
    if (m) audit('logout', { kind: 'team', id: m.id, name: m.name });
    delete data.sessions.team;
    delete data.sessions.teamPending;
    save();
  }
  const isContact = (c) => /^01[3-9]\d{8}$/.test(c) || /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(c);
  function checkMemberRole(role, division) {
    if (!ROLES[role]) fail('দায়িত্ব বেছে নিন');
    if (role === 'division' && !Object.hasOwn(window.LH_DIV || {}, division || '')) fail('কোন বিভাগ, বেছে নিন');
    return role === 'division' ? division : '';
  }
  const supersLeft = (skip) => data.team.filter((x) => x.role === 'super' && x.active && x.id !== skip).length;
  // the super admin adds a person with a first password, which they give the person
  function teamAdd(v) {
    const me = need('team');
    const name = words(v.name).slice(0, 60);
    if (name.length < 3) fail('পুরো নাম লিখুন');
    const contact = String(v.contact || '').trim().toLowerCase();
    if (!isContact(contact)) fail('১১ সংখ্যার মোবাইল নম্বর বা ইমেইল দিন');
    if (data.team.some((x) => x.contact.toLowerCase() === contact)) fail('এই মোবাইল বা ইমেইলে আরেকজন আছেন');
    if (String(v.pw || '').length < 8) fail('প্রথম পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের দিন');
    const division = checkMemberRole(v.role, v.division);
    const m = { id: 'tm' + Date.now().toString(36), name, contact, pw: hash(v.pw), role: v.role, division, active: true, at: new Date().toISOString(), by: me.id };
    data.team.push(m);
    audit('team-add', { kind: 'team', id: m.id, name }, '', { after: ROLES[m.role] + (division ? ' · ' + division : '') });
    save();
    return m;
  }
  function teamSetRole(id, role, division) {
    need('team');
    const m = data.team.find((x) => x.id === id) || fail('পাওয়া যায়নি');
    const div = checkMemberRole(role, division);
    if (m.role === 'super' && role !== 'super' && !supersLeft(m.id)) fail('অন্তত একজন সুপার অ্যাডমিন থাকতে হবে');
    const before = ROLES[m.role] + (m.division ? ' · ' + m.division : '');
    Object.assign(m, { role, division: div });
    audit('team-role', { kind: 'team', id: m.id, name: m.name }, '', { before, after: ROLES[role] + (div ? ' · ' + div : '') });
    save();
  }
  // a closed account cannot log in; it needs a reason
  function teamSetActive(id, on, reason) {
    const me = need('team');
    const m = data.team.find((x) => x.id === id) || fail('পাওয়া যায়নি');
    if (!on && m.id === me.id) fail('নিজের একাউন্ট নিজে বন্ধ করা যাবে না');
    if (!on && m.role === 'super' && !supersLeft(m.id)) fail('অন্তত একজন সুপার অ্যাডমিন থাকতে হবে');
    const why = on ? String(reason || '').trim().slice(0, 300) : reasonOf(reason, 'বন্ধ করার কারণ লিখুন');
    m.active = !!on;
    audit(on ? 'team-on' : 'team-off', { kind: 'team', id: m.id, name: m.name }, why);
    save();
  }
  // what the support team sees of a customer's phone and address, and the log when they open it in full
  const maskPhone = (p) => { const s = String(p || ''); return s.length > 6 ? s.slice(0, 3) + '••••••' + s.slice(-2) : s; };
  const maskLine = (l) => { const s = words(l); return s ? s.split(' ')[0] + ' ••••' : ''; };
  const hidesCustomer = () => { const m = teamMe(); return !!m && m.role === 'support'; };
  function teamReveal(field, target) {
    need('dash');
    audit(field === 'phone' ? 'see-phone' : 'see-address', target);
    save();
  }
  // NID and trade licence pictures: only verification and the super admin, and every look is logged
  function teamSeeDocs(kind, target) {
    need('docs', target);
    audit(kind === 'nid' ? 'see-nid' : 'see-licence', target);
    save();
  }
  // a refund above the limit needs a second person
  function setRefundLimit(n) {
    need('settings');
    if (!Number.isInteger(n) || n < 0 || n > 1000000) fail('রিফান্ডের সীমা ০ থেকে ১০,০০,০০০ টাকার মধ্যে দিন');
    if (n === data.refundLimit) return;
    audit('setting', { kind: 'setting', id: 'refundLimit', name: 'রিফান্ডের সীমা' }, '', { before: data.refundLimit, after: n });
    data.refundLimit = n;
    save();
  }

  /* ---------- company settings, from the admin panel ---------- */
  function setDeliveryFees(first, next) {
    setCharges(Object.assign({}, data.feeRules, { first, next, rate: data.commission }));
  }
  // Everything is checked before anything changes. Orders already placed keep their charge and their commission.
  const SETTING_WORD = { first: 'প্রথম দোকানের ডেলিভারি চার্জ', next: 'পরের দোকানের ডেলিভারি চার্জ', freeKm: 'চার্জে কত কিমি', perKm: 'প্রতি কিমি', bigFee: 'বড় জিনিসের চার্জ', bigPerKm: 'বড় জিনিসে প্রতি কিমি', rate: 'কমিশন (%)' };
  function setCharges(v) {
    need('settings');
    const was = { first: data.deliveryFee, next: data.deliveryFeeNext, freeKm: data.feeRules.freeKm, perKm: data.feeRules.perKm, bigFee: data.feeRules.bigFee, bigPerKm: data.feeRules.bigPerKm, rate: data.commission };
    const ok = (n, max) => Number.isInteger(n) && n >= 0 && n <= max;
    if (!ok(v.first, 1000) || !ok(v.next, 1000)) fail('ডেলিভারি চার্জ ০ থেকে ১০০০ টাকার মধ্যে দিন');
    if (!ok(v.freeKm, 50)) fail('কত কিমি পর্যন্ত, ০ থেকে ৫০ এর মধ্যে দিন');
    if (!ok(v.perKm, 500) || !ok(v.bigPerKm, 500)) fail('প্রতি কিমির চার্জ ০ থেকে ৫০০ টাকার মধ্যে দিন');
    if (!ok(v.bigFee, 5000)) fail('বড় জিনিসের চার্জ ০ থেকে ৫০০০ টাকার মধ্যে দিন');
    if (!ok(v.rate, 30)) fail('কমিশন ০ থেকে ৩০ শতাংশের মধ্যে দিন');
    const old = [data.deliveryFee, data.deliveryFeeNext, data.feeRules, data.commission];
    data.deliveryFee = v.first;
    data.deliveryFeeNext = v.next;
    data.feeRules = { freeKm: v.freeKm, perKm: v.perKm, bigFee: v.bigFee, bigPerKm: v.bigPerKm };
    data.commission = v.rate;
    const auditBefore = data.audit.length;
    Object.keys(was).filter((k) => was[k] !== v[k]).forEach((k) => audit('setting', { kind: 'setting', id: k, name: SETTING_WORD[k] }, '', { before: was[k], after: v[k] }));
    commit(() => { [data.deliveryFee, data.deliveryFeeNext, data.feeRules, data.commission] = old; data.audit.splice(0, data.audit.length - auditBefore); });
  }
  // a mobile number, a 09 number or a short code such as 16XXX; empty hides the call button
  function setHelpline(raw) {
    need('settings');
    const phone = String(raw || '').replace(/[\s-]/g, '');
    if (phone && !/^(01[3-9]\d{8}|09\d{9}|16\d{3})$/.test(phone)) fail('হেল্পলাইন নম্বর ঠিক নয়, যেমন 16XXX বা 09XXXXXXXXX');
    if (phone !== data.helpline.phone) audit('setting', { kind: 'setting', id: 'helpline', name: 'হেল্পলাইন' }, '', { before: data.helpline.phone, after: phone });
    data.helpline = { phone };
    save();
  }
  function setShopImage(shopId, key, value) {
    const shop = shopById(shopId);
    const old = shop[key];
    if (value) shop[key] = value; else delete shop[key];
    commit(() => { if (old) shop[key] = old; else delete shop[key]; });
  }
  return {
    get data() { return data; },
    save, reset, reload, hash, KEY, shopById, flow, next, label, isFinal, LABELS, openNow,
    book, seatsLeft, bookLines, offerOn, setupOf, PATIENT, today: todayStr, offer, agree, rejectOffer, chatOf, chatsOf, chatSend, chatShare, chatImage, chatUnsend, chatSeen,
    deliveryFee: () => data.deliveryFee, deliveryFeeNext: () => data.deliveryFeeNext, deliveryFees, deliveryQuote, setDeliveryFees, setCharges, isAdmin: () => !!teamMe(),
    checkOrders, PAID_WORD, BIG_VEHICLES, needsLicence, riderPapers, rejectRider, riderLive, kmBetween, money, orderMoney,
    ROLES, PERMS, teamMe, can, divOfZila, teamLogin, teamVerify, teamLogout, teamAdd, teamSetRole, teamSetActive, maskPhone, maskLine, hidesCustomer, teamReveal, teamSeeDocs,
    setRefundLimit, refundCheck, placeOfTicket, placeOfOrder, placeOfShop, placeOfRider, refundLimit: () => data.refundLimit,
    notesFor, notesUnseen, notesSeen, ownerOf, setHelpline, callbackAsk, callbackDone, callbacksWaiting,
    RIDER_KM, checkRiderBase, setRiderBase, bazarsOf, riderKm, inReach, vehicleSet, whereOf, isEmergency,
    BUS_COACH, busFare, busSeatsLeft, busAt, busKm, busFind, busStops, busBook, busBoard, busList, saveRoute,
    catOfSub, catsOf, inCat, itemInCat, subChoices, openAsks, asksOf, addWorkDays, workDaysBetween, ownPanel, checkLicence, setLicence, catAsk, catWithdraw, catDecide, catGrant, catDrop, signupAsks, findItem, ASK_WORK_DAYS, ASK_LICENCE_HOURS,
    lnBlank, CABIN, CLASSES, LAUNCH_DAYS, PAY_HOLD_MIN, KEEP_SHARE, TRIP_STATUS, lnTrips, lnTrip, lnTickets, lnHolds, lnUsed, lnFree, lnHold, lnBuy, lnRelease, lnSell, lnPhoneHold, lnHoldDrop,
    lnFindTicket, lnBoard, lnSync, lnRefund, lnReturn, lnSetTrip, lnFind, lnGhats, lnSaveBoat, lnSaveCabin, lnDeleteBoat, lnSaveRoute, lnDeleteRoute, lnSaveRule, lnDeleteRule, lnSettings, lnChannels,
    addAreaPlace, shopLive, isFinished, rate, ratingOf, ratingsOf, ratingSummary, setRatingHidden, refundAsk, refundDecide,
    offerLive, offerUses, offerQuote, saveOffer, setOfferActive, deleteOffer,
    openAt, adLive, adItem, saveAd, setAdActive, deleteAd, moveAd, salesRows, salesMonths, salesReport, areaRanks, shopRank, canBook,
    ticketById, ticketNew, ticketReply, ticketSetStatus, ticketSeen, ticketUnread,
    setShopVerified, suspendShop, unsuspendShop, setShopArea, setRiderArea, riders, riderBlock, blockRider, unblockRider, approveRider, assignRider, teamDeliver, fillWaiting, riderNotes, riderNoteDone, riderNotesSeen, unreadIn, unreadTotal,
    placeOrders, accept, pack, shopComplete, riderPickup, riderDecline, riderDeliver, cancel,
    saveItem, deleteItem, setShopImage,
    session(role) { return data.accounts.find((a) => a.id === data.sessions[role]) || null; },
    setSession(role, acc) { if (acc) data.sessions[role] = acc.id; else delete data.sessions[role]; save(); }
  };
})();

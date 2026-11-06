// Website translator: same dictionary approach as public/app.js in the real app, so it works under its CSP.
// Bangla stays in the markup; for English every rendered text node and label is translated from window.LH_LANG.en.
window.LHI18n = (function () {
  'use strict';
  // label: the group headings of a list, as in <optgroup label>
  const ATTRS = ['placeholder', 'aria-label', 'title', 'alt', 'label'];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA']);
  const BN = /[ঀ-৿]/;
  const toAscii = (t) => t.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
  const reEsc = (k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let lang = 'bn';
  try { if (localStorage.getItem('lh-preview-lang') === 'en') lang = 'en'; } catch (e) { /* private mode */ }
  let exact = null;
  let frag = null;
  let sub = null;
  let re = null;
  let obs = null;

  function build() {
    const dict = window.LH_LANG.en;
    exact = new Map();
    frag = new Map();
    sub = new Map();
    const keys = [];
    for (const [k, v] of Object.entries(dict)) {
      // A key with spaces around it is part of a longer text, as in "চাল কে মুছবেন?" after a product name. As a whole text it must not replace
      // the word's own entry, and a part such as ": show" or "" is no translation for a word standing alone.
      const core = k.trim();
      if (core !== k) frag.set(k, v);
      // A word's own entry keeps the spaces of its English, as in "র বাজার" after a name becoming " from the shops".
      if (core === k) exact.set(core, v);
      else if (!exact.has(core) && v.trim() && !/^[:—,.;)]/.test(v.trim())) exact.set(core, v.trim());
      if (k.length >= 5) { const a = toAscii(k); sub.set(a, v); keys.push(a); }
    }
    keys.sort((a, b) => b.length - a.length);
    re = new RegExp(keys.map(reEsc).join('|'), 'g');
  }
  // What shops and customers wrote is wrapped in these two invisible marks and never translated.
  const OPEN = '\u2068';
  const CLOSE = '\u2069';
  const KEPT = /(\u2068[^\u2069]*\u2069)/;
  const keep = (s) => OPEN + String(s).replace(/[\u2068\u2069]/g, '') + CLOSE;
  function tr(str) {
    if (lang === 'bn' || !str) return str;
    return str.split(KEPT).map((part, i) => (i % 2 ? part : en(part))).join('');
  }
  // The part of a text next to a name or number, such as " কে মুছবেন?", takes the entry written for it, spaces included.
  // Only plain spaces count: a line break around a text is page layout, not part of a sentence.
  function part(str) {
    const [, lead, core, tail] = /^( *)([\s\S]*?)( *)$/.exec(str);
    for (const [l, t] of [[lead, tail], [lead, ''], ['', tail]]) {
      if (!l && !t) continue;
      const v = frag.get((l ? ' ' : '') + core + (t ? ' ' : ''));
      if (v !== undefined) return (l ? '' : lead) + v + (t ? '' : tail);
    }
    return undefined;
  }
  // English whatever the current language is; search also uses it
  function en(str) {
    if (!str || !BN.test(str)) return str;
    if (!exact) build();
    const core = str.trim();
    if (core !== str) { const p = part(str); if (p !== undefined) return p; }
    const hit = exact.get(core);
    if (hit !== undefined) return str.replace(core, hit);
    // short words (under 5 characters) are only safe as whole runs of Bangla text, e.g. "Open now · সেবা"
    return toAscii(str).replace(re, (m) => sub.get(m)).replace(/।/g, '.')
      .replace(/[ঀ-৲৴-৿]+(?: [ঀ-৲৴-৿]+)*/g, (m) => (exact.has(m) ? exact.get(m) : m));
  }
  // District, upazila and thana names are the app's own words: English names in English, Bangla in Bangla.
  // A name the list does not know, such as an area a shop typed in, stays as it was written.
  const GEO_FIX = {
    'কুমিল্লা': 'Cumilla', 'চট্টগ্রাম': 'Chattogram', 'বগুড়া': 'Bogura', 'যশোর': 'Jashore', 'ঝালকাঠি': 'Jhalokati', 'বরিশাল': 'Barishal',
    'কিশোরগঞ্জ': 'Kishoreganj', 'দৌলতপুর': 'Daulatpur', 'বোরহান উদ্দিন': 'Borhanuddin', 'বোরহানউদ্দিন': 'Borhanuddin', 'আদর্শ সদর': 'Adarsha Sadar', 'শান্তিগঞ্জ': 'Shantiganj', 'ফুলবাড়ী': 'Fulbari', 'পীরগঞ্জ': 'Pirganj',
    'কক্সবাজার': "Cox's Bazar", 'কক্সবাজার সদর': "Cox's Bazar Sadar", 'চর রাজিবপুর': 'Char Rajibpur'
  };
  const geoEn = (name) => GEO_FIX[name] || (window.LH_GEO_EN || {})[name] || '';
  function geoText(name) {
    const n = String(name == null ? '' : name);
    return lang === 'en' && geoEn(n) ? geoEn(n) : n;
  }
  // An upazila typed in Bangla or English becomes the list's own Bangla name, so shops and addresses still match.
  // An older spelling of a renamed place becomes today's.
  function areaKey(zila, typed) {
    const old = String(typed || '').normalize('NFC').trim();
    const t = (window.LH_GEO_OLD || {})[old] || old;
    const low = t.toLowerCase();
    const list = (window.LH_GEO || {})[zila] || [];
    return list.find((a) => a === t || geoEn(a).toLowerCase() === low || ((window.LH_GEO_EN || {})[a] || '').toLowerCase() === low) || t;
  }
  function text(n) {
    if (n.parentNode && SKIP.has(n.parentNode.nodeName)) return;
    if (BN.test(n.nodeValue)) n.nodeValue = tr(n.nodeValue);
  }
  function el(e) {
    for (const a of ATTRS) if (e.hasAttribute(a) && BN.test(e.getAttribute(a))) e.setAttribute(a, tr(e.getAttribute(a)));
  }
  function walk(root) {
    if (root.nodeType === 3) return text(root);
    if (root.nodeType !== 1) return;
    el(root);
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = tw.nextNode())) { if (n.nodeType === 3) text(n); else el(n); }
  }
  function observe() {
    if (!obs) {
      obs = new MutationObserver((muts) => {
        if (lang === 'bn') return;
        obs.disconnect();
        muts.forEach((m) => m.addedNodes.forEach(walk));
        muts.filter((m) => m.type === 'characterData').forEach((m) => text(m.target));
        start();
      });
    }
    start();
  }
  function start() { obs.observe(document.body, { childList: true, subtree: true, characterData: true }); }
  function apply() {
    document.documentElement.lang = lang;
    document.title = lang === 'en' ? tr(window.LH_TITLE) : window.LH_TITLE;
    if (lang === 'en') { walk(document.body); observe(); } else if (obs) obs.disconnect();
  }
  function set(l) {
    lang = l;
    try { localStorage.setItem('lh-preview-lang', l); } catch (e) { /* private mode */ }
    apply();
  }
  return { tr, en, keep, apply, set, geoText, areaKey, get lang() { return lang; } };
})();

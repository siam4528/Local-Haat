// Leaflet + OpenStreetMap. Numbered pins match the numbers in the list next to the map.
window.LHMap = (function () {
  'use strict';
  const ATTR = '&copy; OpenStreetMap';
  const TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  let explorer = null;
  let minis = [];

  function base(el, opts) {
    const map = L.map(el, Object.assign({ zoomControl: true, attributionControl: true }, opts));
    map.attributionControl.setPrefix(false);
    const layer = L.tileLayer(TILES, { maxZoom: 19, attribution: ATTR, referrerPolicy: 'strict-origin-when-cross-origin' });
    let warned = false;
    layer.on('tileerror', () => {
      if (warned) return;
      warned = true;
      const note = document.createElement('div');
      note.className = 'map-off';
      note.textContent = 'ম্যাপের ছবি লোড হয়নি। ইন্টারনেট দেখুন। পিন ও তালিকা ঠিক আছে।';
      el.appendChild(note);
    });
    layer.addTo(map);
    return map;
  }
  const pinIcon = (n, on) => L.divIcon({ className: '', iconSize: [34, 42], iconAnchor: [17, 40], html: `<span class="pin ${on ? 'on' : ''}"><b>${n}</b></span>` });
  const dotIcon = (txt) => L.divIcon({ className: '', iconSize: [38, 38], iconAnchor: [19, 19], html: `<span class="dotpin">${txt}</span>` });

  function mountExplorer(el, onPick) {
    destroy();
    const map = base(el, {});
    explorer = { map, markers: new Map(), ref: null, onPick };
    return explorer;
  }
  /** rows: [{id, lat, lng, n}] */
  function setPins(rows, ref, selected, fit) {
    if (!explorer) return;
    const { map, markers } = explorer;
    markers.forEach((m) => m.remove());
    markers.clear();
    rows.forEach((r) => {
      const m = L.marker([r.lat, r.lng], { icon: pinIcon(r.n, r.id === selected), title: r.title, alt: r.title, zIndexOffset: r.id === selected ? 500 : 0 }).addTo(map);
      m.on('click', () => explorer.onPick(r.id));
      markers.set(r.id, m);
    });
    if (explorer.ref) explorer.ref.remove();
    explorer.ref = L.marker([ref.lat, ref.lng], { icon: dotIcon(ref.icon), interactive: false, keyboard: false }).addTo(map);
    if (fit) {
      const pts = rows.map((r) => [r.lat, r.lng]).concat([[ref.lat, ref.lng]]);
      // no animation: a page change can remove the map mid-zoom, which makes Leaflet throw
      if (pts.length > 1) map.fitBounds(pts, { padding: [46, 46], maxZoom: 15, animate: false });
      else map.setView(pts[0], 13, { animate: false });
    }
  }
  function focus(lat, lng) {
    if (explorer) explorer.map.panTo([lat, lng]);
  }
  function resize() {
    if (explorer) explorer.map.invalidateSize();
  }

  /** points: [{lat, lng, icon}] */
  function mini(el, points) {
    const map = base(el, { scrollWheelZoom: false });
    points.forEach((p) => L.marker([p.lat, p.lng], { icon: dotIcon(p.icon), keyboard: false, interactive: false }).addTo(map));
    const pts = points.map((p) => [p.lat, p.lng]);
    if (pts.length > 1) map.fitBounds(pts, { padding: [36, 36], maxZoom: 15 });
    else map.setView(pts[0], 15);
    minis.push(map);
    return map;
  }
  /** a marker that moves, such as the delivery man on the way; returns it, so setLatLng can move it */
  function mover(map, p) {
    return L.marker([p.lat, p.lng], { icon: dotIcon(p.icon), keyboard: false, interactive: false, zIndexOffset: 800 }).addTo(map);
  }
  /** click to drop a pin; used by the shop and delivery man sign-up forms and a trip's end.
      opts: icon; around, where the map opens with no pin yet; km, a circle of that radius round the pin.
      Returns setKm, which redraws the circle. */
  function picker(el, start, onSet, opts) {
    const o = opts || {};
    const map = base(el, {});
    const around = o.around || [23.685, 90.356];
    map.setView(start ? [start.lat, start.lng] : around, start ? (o.km ? 13 : 15) : o.around ? 12 : 7);
    const icon = dotIcon(o.icon || '🏪');
    let marker = start ? L.marker([start.lat, start.lng], { icon }).addTo(map) : null;
    let ring = null;
    let km = o.km || 0;
    const draw = () => {
      if (ring) { ring.remove(); ring = null; }
      if (marker && km) ring = L.circle(marker.getLatLng(), { radius: km * 1000, color: '#0f766e', weight: 2, fillOpacity: 0.08, interactive: false }).addTo(map);
    };
    draw();
    map.on('click', (e) => {
      if (marker) marker.setLatLng(e.latlng);
      else marker = L.marker(e.latlng, { icon }).addTo(map);
      draw();
      onSet(e.latlng.lat, e.latlng.lng);
    });
    minis.push(map);
    return {
      map,
      setKm: (n) => { km = n; draw(); },
      // a point from GPS: the pin moves there and the map follows
      setPin: (lat, lng) => {
        if (marker) marker.setLatLng([lat, lng]); else marker = L.marker([lat, lng], { icon }).addTo(map);
        draw();
        map.setView([lat, lng], km ? 13 : 15, { animate: false });
      }
    };
  }
  /** a bus route: its road as a line through the stops that have a place, counters as 🏪, the rider's two stops marked.
      stops: [{lat, lng, counter}]; mark: {from, to} indexes, or null */
  const stopIcon = (n, cls) => L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 14], html: `<span class="stoppin ${cls}">${n}</span>` });
  function route(el, stops, mark) {
    const map = base(el, { scrollWheelZoom: false });
    const pts = [];
    stops.forEach((s, i) => {
      if (!Number.isFinite(s.lat)) return;
      pts.push([s.lat, s.lng]);
      const on = mark && (i === mark.from || i === mark.to);
      const cls = on ? (i === mark.from ? 'from' : 'to') : s.counter ? 'counter' : '';
      L.marker([s.lat, s.lng], { icon: stopIcon(s.counter && !on ? '🏪' : i + 1, cls), keyboard: false, interactive: false, zIndexOffset: on ? 600 : s.counter ? 300 : 0 }).addTo(map);
    });
    if (pts.length > 1) {
      L.polyline(pts, { color: '#0f766e', weight: 4, opacity: 0.7, interactive: false }).addTo(map);
      map.fitBounds(pts, { padding: [30, 30], maxZoom: 14, animate: false });
    } else if (pts.length) map.setView(pts[0], 13, { animate: false });
    else map.setView([23.685, 90.356], 7, { animate: false });
    minis.push(map);
    return map;
  }
  /** a launch route: the ghat it leaves from, the ghat it reaches, and the river between them as a dashed line through the route's points */
  function river(el, r) {
    const map = base(el, { scrollWheelZoom: false });
    const pts = [[r.from.lat, r.from.lng]].concat(r.path || [], [[r.to.lat, r.to.lng]]).filter((p) => Number.isFinite(p[0]));
    if (Number.isFinite(r.from.lat)) L.marker([r.from.lat, r.from.lng], { icon: stopIcon('⚓', 'from'), keyboard: false, interactive: false, zIndexOffset: 600 }).addTo(map);
    if (Number.isFinite(r.to.lat)) L.marker([r.to.lat, r.to.lng], { icon: stopIcon('🏁', 'to'), keyboard: false, interactive: false, zIndexOffset: 600 }).addTo(map);
    if (pts.length > 1) {
      L.polyline(pts, { color: '#2563eb', weight: 4, opacity: 0.7, dashArray: '8 6', interactive: false }).addTo(map);
      map.fitBounds(pts, { padding: [30, 30], maxZoom: 12, animate: false });
    } else map.setView(pts[0] || [23.685, 90.356], pts.length ? 12 : 7, { animate: false });
    minis.push(map);
    return map;
  }
  /** a counter puts its stops on the map: a tap places the stop chosen in the list. Returns draw(stops, active), to show them again. */
  function routeEdit(el, onSet) {
    const map = base(el, {});
    let layer = L.layerGroup().addTo(map);
    let first = true;
    const draw = (stops, active) => {
      layer.remove();
      layer = L.layerGroup().addTo(map);
      const pts = [];
      stops.forEach((s, i) => {
        if (!Number.isFinite(s.lat)) return;
        pts.push([s.lat, s.lng]);
        L.marker([s.lat, s.lng], { icon: stopIcon(i + 1, i === active ? 'from' : s.counter ? 'counter' : ''), keyboard: false, interactive: false }).addTo(layer);
      });
      if (pts.length > 1) L.polyline(pts, { color: '#0f766e', weight: 3, opacity: 0.6, interactive: false }).addTo(layer);
      // the first drawing frames the stops; later ones keep where the counter is looking
      if (first) {
        first = false;
        if (pts.length > 1) map.fitBounds(pts, { padding: [30, 30], maxZoom: 14, animate: false });
        else if (pts.length) map.setView(pts[0], 13, { animate: false });
        else map.setView([23.685, 90.356], 7, { animate: false });
      }
    };
    map.on('click', (e) => onSet(e.latlng.lat, e.latlng.lng));
    minis.push(map);
    return { map, draw };
  }
  function destroy() {
    if (explorer) { explorer.map.stop(); explorer.map.remove(); explorer = null; }
    minis.forEach((m) => m.remove());
    minis = [];
  }
  function km(a, b) {
    const rad = (d) => d * Math.PI / 180;
    const x = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.sqrt(x));
  }
  // OpenStreetMap's public place search. Its rules allow about one request a second and no search-as-you-type,
  // so this runs only when someone asks. The real app needs its own or a paid service.
  const found = new Map();
  // place names come back in the language of the page
  async function geocode(q) {
    const lang = window.LHI18n && window.LHI18n.lang === 'en' ? 'en' : 'bn';
    const key = lang + '|' + q;
    if (found.has(key)) return found.get(key);
    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), 8000);
    try {
      const res = await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=bd&limit=5&accept-language=' + lang + '&q=' + encodeURIComponent(q), { signal: stop.signal });
      if (!res.ok) throw new Error('geocode ' + res.status);
      const rows = (await res.json())
        .map((r) => ({ lat: Number(r.lat), lng: Number(r.lon), name: r.name || String(r.display_name).split(',')[0], line: String(r.display_name) }))
        .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
      found.set(key, rows);
      return rows;
    } finally { clearTimeout(timer); }
  }
  const directions = (lat, lng) => `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

  return { geocode, mountExplorer, setPins, focus, resize, mini, mover, picker, route, river, routeEdit, destroy, km, directions };
})();

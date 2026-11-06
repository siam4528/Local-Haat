// Picture uploads for the prototype. Every picture is cropped, resized and re-encoded in the browser, which also
// drops EXIF data such as GPS position. The real app should do the same on the server (see POST /api/owner/items/:id/image).
window.LHImage = (function () {
  'use strict';
  const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  const MAX_BYTES = 10 * 1024 * 1024;
  const SIZES = { cover: [1200, 400, 0.72], logo: [320, 320, 0.8], item: [480, 480, 0.72] };
  const CHAT_SIDE = 800;
  const CHAT_QUALITY = 0.7;

  function encode(canvas, q) {
    const webp = canvas.toDataURL('image/webp', q);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', q);
  }
  function open(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('ছবি পাওয়া যায়নি'));
      if (!TYPES.includes(file.type)) return reject(new Error('শুধু JPG, PNG বা WebP ছবি দিন'));
      if (file.size > MAX_BYTES) return reject(new Error('ছবি ১০ MB এর ছোট হতে হবে'));
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('ছবিটি খোলা যায়নি, অন্য ছবি দিন')); };
      img.src = url;
    });
  }
  function draw(img, w, h, sx, sy, sw, sh) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = '#fff'; // transparent PNG logos
    g.fillRect(0, 0, w, h);
    g.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    return c;
  }
  /** Promise of a data URL. Rejects with a message that can be shown to the user. */
  async function read(file, kind) {
    const img = await open(file);
    const [w, h, q] = SIZES[kind];
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / scale;
    const sh = h / scale;
    return encode(draw(img, w, h, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh), q);
  }
  /** Promise of { image, w, h }: the whole picture for a chat message, not cropped. */
  async function readWhole(file) {
    const img = await open(file);
    const scale = Math.min(1, CHAT_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    return { image: encode(draw(img, w, h, 0, 0, img.naturalWidth, img.naturalHeight), CHAT_QUALITY), w, h };
  }
  return { read, readWhole };
})();

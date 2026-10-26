// StealthKeep backend v2.2.0 – วางใน Google Apps Script แล้ว Deploy เป็น Web app (Execute as: Me, Access: Anyone)
// บัญชีที่ Deploy สคริปต์นี้ ต้องเปิดโฟลเดอร์รูปได้ (เป็นเจ้าของ หรือถูกแชร์ให้)
const TOKEN = 'เปลี่ยนเป็นรหัสลับของคุณ';
const sh = () => { const s = SpreadsheetApp.getActiveSpreadsheet(); return s.getSheetByName('Vault') || s.insertSheet('Vault'); };
const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
// ขอรูปขนาด ~1280px ผ่านสิทธิ์ของบัญชีเจ้าของสคริปต์ (เร็วกว่าไฟล์เต็ม)
// ถ้าไม่ได้: ไฟล์ต้นฉบับ <= 4MB ส่งทั้งไฟล์, ใหญ่กว่านั้นส่งภาพย่อของ Drive แทน (กันค้าง/ช้าจากไฟล์ใหญ่)
const BIG = 4 * 1024 * 1024;
function img(id) {
  try {
    const r = UrlFetchApp.fetch('https://drive.google.com/thumbnail?id=' + id + '&sz=w1280',
      { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    const b = r.getBlob();
    if (r.getResponseCode() === 200 && String(b.getContentType()).indexOf('image/') === 0) return uri(b); // กันหน้า HTML/login หลุดมาเป็นรูป
  } catch (x) {}
  const f = DriveApp.getFileById(id);
  if (f.getSize() > BIG) { const t = f.getThumbnail(); if (t) return uri(t); }
  return uri(f.getBlob());
}
// รูปหลายใบในคำขอเดียว: ดึงภาพย่อพร้อมกันฝั่งเซิร์ฟเวอร์ (fetchAll) — เร็วกว่าขอทีละรูปหลายเท่า
function imgs(ids) {
  const tk = ScriptApp.getOAuthToken();
  let rs = [];
  try {
    rs = UrlFetchApp.fetchAll(ids.map(id => ({ url: 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1280', headers: { Authorization: 'Bearer ' + tk }, muteHttpExceptions: true })));
  } catch (x) {}
  return ids.map((id, i) => {
    try {
      const r = rs[i];
      if (r && r.getResponseCode() === 200) { const b = r.getBlob(); if (String(b.getContentType()).indexOf('image/') === 0) return { id: id, d: uri(b) }; }
      return { id: id, d: img(id) }; // สำรอง: วิธีเดิมทีละรูป
    } catch (x) { return { id: id, e: String(x) }; }
  });
}
const uri = b => 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes());
// รายชื่อรูปในโฟลเดอร์: ค้นเฉพาะรูปในครั้งเดียว (เร็วกว่าไล่เช็ค MIME ทีละไฟล์) และอ่านชื่อครั้งเดียวก่อนเรียง
function list(id) {
  const fo = DriveApp.getFolderById(id), out = [];
  try {
    const it = fo.searchFiles("mimeType contains 'image/'");
    while (it.hasNext()) { const f = it.next(); out.push({ id: f.getId(), name: f.getName() }); }
  } catch (x) { out.length = 0; }
  if (!out.length) { // สำรอง: วิธีเดิม
    const it = fo.getFiles();
    while (it.hasNext()) { const f = it.next(); if (f.getMimeType().indexOf('image/') === 0) out.push({ id: f.getId(), name: f.getName() }); }
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

// ---- เพลง (MP3 ฯลฯ) ใน Drive: ส่งไฟล์เป็น base64 (จำกัด 25MB) และรายชื่อไฟล์เสียงในโฟลเดอร์ ----
const AUD = { mp3: 'audio/mpeg', m4a: 'audio/mp4', aac: 'audio/aac', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', opus: 'audio/ogg', flac: 'audio/flac' };
const extOf = n => String(n).split('.').pop().toLowerCase();
// ส่งไฟล์เพลงเป็นชิ้น (o = ตำแหน่งไบต์, l = ขนาดชิ้น) เพื่อให้แอปแสดง % การโหลดได้ — ถ้าไม่ส่ง l จะส่งทั้งไฟล์
function audio(id, o, l) {
  const f = DriveApp.getFileById(id), size = f.getSize();
  if (size > 25 * 1024 * 1024) throw new Error('ไฟล์เพลงใหญ่เกิน 25MB');
  const name = f.getName();
  let y = String(f.getMimeType());
  if (y.indexOf('audio/') !== 0) y = AUD[extOf(name)] || 'audio/mpeg';
  o = Number(o) || 0; l = Number(l) || size;
  if (o >= size) return { y: y, n: name, t: size, o: o, d: '' };
  const e = Math.min(size, o + l) - 1;
  try {
    const r = UrlFetchApp.fetch('https://www.googleapis.com/drive/v3/files/' + id + '?alt=media', { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken(), Range: 'bytes=' + o + '-' + e }, muteHttpExceptions: true });
    if (r.getResponseCode() === 206 || (r.getResponseCode() === 200 && o === 0 && e === size - 1)) return { y: y, n: name, t: size, o: o, d: Utilities.base64Encode(r.getContent()) };
  } catch (x) {}
  return { y: y, n: name, t: size, o: 0, all: 1, d: Utilities.base64Encode(f.getBlob().getBytes()) }; // สำรอง: ส่งทั้งไฟล์
}
function audioList(id) {
  const fo = DriveApp.getFolderById(id), res = [];
  try {
    const it = fo.searchFiles("mimeType contains 'audio/'");
    while (it.hasNext()) { const f = it.next(); res.push({ id: f.getId(), name: f.getName() }); }
  } catch (x) { res.length = 0; }
  if (!res.length) { // สำรอง: ดูจากนามสกุลไฟล์
    const it = fo.getFiles();
    while (it.hasNext()) { const f = it.next(); if (AUD[extOf(f.getName())]) res.push({ id: f.getId(), name: f.getName() }); }
  }
  res.sort((a, b) => a.name.localeCompare(b.name));
  return res;
}

// เซลล์ใน Google Sheets เก็บได้ไม่เกิน 50,000 ตัวอักษร → แบ่งเป็นท่อนละ 45,000 ตัวอักษรลงคอลัมน์ A หลายแถว
const CHUNK = 45000;
function writeBlob(t) {
  const s = sh(), parts = [];
  for (let i = 0; i < t.length; i += CHUNK) parts.push([t.substring(i, i + CHUNK)]);
  if (!parts.length) parts.push(['']);
  s.clear();
  s.getRange(1, 1, parts.length, 1).setNumberFormat('@').setValues(parts);
}
function readBlob() { // อ่านได้ทั้งรูปแบบใหม่ (หลายแถว) และเก่า (เซลล์ A1 เดียว)
  const s = sh(), n = s.getLastRow();
  return n < 1 ? '' : s.getRange(1, 1, n, 1).getValues().map(r => String(r[0])).join('');
}

function doGet(e) {
  const p = e.parameter;
  try {
    if (p.token !== TOKEN) return out({ ok: false, error: 'bad token' });
    if (p.action === 'folder') { // รายชื่อรูป + (ถ้าไม่ส่ง noimg=1) รูปแรกที่ต้องแสดงมาในรอบเดียว
      const files = list(p.id);
      if (!files.length) return out({ ok: true, files: files });
      if (p.noimg === '1') return out({ ok: true, files: files });
      const sid = files.some(f => f.id === p.show) ? p.show : files[0].id;
      return out({ ok: true, files: files, sid: sid, d: img(sid) });
    }
    if (p.action === 'img') return out({ ok: true, d: img(p.id) });
    if (p.action === 'audio') { return out(Object.assign({ ok: true }, audio(p.id, p.o, p.l))); }
    if (p.action === 'audiolist') return out({ ok: true, files: audioList(p.id) });
    if (p.action === 'imgs') return out({ ok: true, items: imgs(String(p.ids || '').split(',').filter(String).slice(0, 4)) });
    return out({ ok: true, blob: readBlob() });
  } catch (err) { return out({ ok: false, error: String(err) }); }
}
function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    if (b.token !== TOKEN) return out({ ok: false, error: 'bad token' });
    writeBlob(String(b.blob || '')); // เก็บเฉพาะข้อมูลที่เข้ารหัสแล้ว
    return out({ ok: true });
  } catch (err) { return out({ ok: false, error: String(err) }); }
}

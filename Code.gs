// StealthKeep backend – วางใน Google Apps Script แล้ว Deploy เป็น Web app (Execute as: Me, Access: Anyone)
// บัญชีที่ Deploy สคริปต์นี้ ต้องเปิดโฟลเดอร์รูปได้ (เป็นเจ้าของ หรือถูกแชร์ให้)
const TOKEN = 'เปลี่ยนเป็นรหัสลับของคุณ';
const sh = () => { const s = SpreadsheetApp.getActiveSpreadsheet(); return s.getSheetByName('Vault') || s.insertSheet('Vault'); };
const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
// ขอรูปขนาด ~1280px ผ่านสิทธิ์ของบัญชีเจ้าของสคริปต์ (เร็วกว่าไฟล์เต็ม) ถ้าไม่ได้จะใช้ไฟล์เต็มแทน
function img(id) {
  try {
    const r = UrlFetchApp.fetch('https://drive.google.com/thumbnail?id=' + id + '&sz=w1280',
      { headers: { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() }, muteHttpExceptions: true });
    if (r.getResponseCode() === 200) return uri(r.getBlob());
  } catch (x) {}
  return uri(DriveApp.getFileById(id).getBlob());
}
const uri = b => 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes());

function doGet(e) {
  const p = e.parameter;
  try {
    if (p.token !== TOKEN) return out({ ok: false, error: 'bad token' });
    if (p.action === 'folder') { // รายชื่อรูป (เร็ว ไม่มีภาพย่อ) + รูปแรกที่ต้องแสดง
      const it = DriveApp.getFolderById(p.id).getFiles(), all = [];
      while (it.hasNext()) { const f = it.next(); if (f.getMimeType().indexOf('image/') === 0) all.push(f); }
      all.sort((a, b) => a.getName().localeCompare(b.getName()));
      const files = all.map(f => ({ id: f.getId(), name: f.getName() }));
      if (!files.length) return out({ ok: true, files: files });
      const sid = files.some(f => f.id === p.show) ? p.show : files[0].id;
      return out({ ok: true, files: files, sid: sid, d: img(sid) });
    }
    if (p.action === 'img') return out({ ok: true, d: img(p.id) });
    return out({ ok: true, blob: sh().getRange('A1').getValue() || '' });
  } catch (err) { return out({ ok: false, error: String(err) }); }
}
function doPost(e) {
  try {
    const b = JSON.parse(e.postData.contents);
    if (b.token !== TOKEN) return out({ ok: false, error: 'bad token' });
    sh().getRange('A1').setValue(b.blob); // เก็บเฉพาะข้อมูลที่เข้ารหัสแล้ว
    return out({ ok: true });
  } catch (err) { return out({ ok: false, error: String(err) }); }
}

// StealthKeep backend – วางใน Google Apps Script แล้ว Deploy เป็น Web app (Execute as: Me, Access: Anyone)
// บัญชีที่ Deploy สคริปต์นี้ ต้องเปิดโฟลเดอร์รูปได้ (เป็นเจ้าของ หรือถูกแชร์ให้)
const TOKEN = 'เปลี่ยนเป็นรหัสลับของคุณ';
const sh = () => { const s = SpreadsheetApp.getActiveSpreadsheet(); return s.getSheetByName('Vault') || s.insertSheet('Vault'); };
const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const uri = b => 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes());

function doGet(e) {
  const p = e.parameter;
  try {
    if (p.token !== TOKEN) return out({ ok: false, error: 'bad token' });
    if (p.action === 'folder') { // รายการรูป + ภาพย่อ (ไม่ต้องแชร์สาธารณะ)
      const from = +p.from || 0, n = Math.min(+p.n || 24, 48), it = DriveApp.getFolderById(p.id).getFiles(), all = [];
      while (it.hasNext()) { const f = it.next(); if (f.getMimeType().indexOf('image/') === 0) all.push(f); }
      all.sort((a, b) => a.getName().localeCompare(b.getName()));
      const files = all.slice(from, from + n).map(f => {
        let t = ''; try { const b = f.getThumbnail(); if (b) t = uri(b); } catch (x) {}
        return { id: f.getId(), name: f.getName(), t: t };
      });
      return out({ ok: true, total: all.length, files: files });
    }
    if (p.action === 'img') return out({ ok: true, d: uri(DriveApp.getFileById(p.id).getBlob()) }); // รูปเต็ม
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

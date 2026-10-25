// StealthKeep backend – วางใน Google Apps Script แล้ว Deploy เป็น Web app (Execute as: Me, Access: Anyone)
const TOKEN = 'เปลี่ยนเป็นรหัสลับของคุณ';
const sh = () => { const s = SpreadsheetApp.getActiveSpreadsheet(); return s.getSheetByName('Vault') || s.insertSheet('Vault'); };
const out = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
function doGet(e) {
  const p = e.parameter;
  if (p.token !== TOKEN) return out({ ok: false, error: 'bad token' });
  if (p.action === 'folder') {
    const it = DriveApp.getFolderById(p.id).getFiles(), list = [];
    while (it.hasNext()) { const f = it.next(); if (f.getMimeType().indexOf('image/') === 0) list.push({ id: f.getId(), name: f.getName() }); }
    return out({ ok: true, files: list });
  }
  return out({ ok: true, blob: sh().getRange('A1').getValue() || '' });
}
function doPost(e) {
  const b = JSON.parse(e.postData.contents);
  if (b.token !== TOKEN) return out({ ok: false, error: 'bad token' });
  sh().getRange('A1').setValue(b.blob); // เก็บเฉพาะข้อมูลที่เข้ารหัสแล้ว
  return out({ ok: true });
}

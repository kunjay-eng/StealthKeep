/** Link Hub backend v1.0.0 — Google Apps Script Web App
 *  ผูกกับ Google Sheet ที่มีชีต "Links" หัวคอลัมน์:
 *  id | title | subtitle | url | icon | category | pinned | sort
 *  ตั้งรหัสแอดมินที่ Project Settings > Script properties: ADMIN_PIN
 */
const SHEET = "Links";
const HEAD = ["id","title","subtitle","url","icon","category","pinned","sort"];

function sh_() {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(SHEET);
  if (!s) { s = ss.insertSheet(SHEET); s.appendRow(HEAD); }
  return s;
}
function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
function rows_() {
  const v = sh_().getDataRange().getValues(); v.shift();
  return v.filter(r => r[0]).map(r => {
    const o = {}; HEAD.forEach((h,i) => o[h] = r[i]); o.pinned = o.pinned === true || o.pinned === "TRUE"; return o;
  });
}

function doGet(e) {
  const a = (e.parameter.action || "list");
  if (a === "list") return out_({ ok:true, data: rows_() });
  if (a === "status") {           // ตรวจสถานะระบบปลายทาง
    try {
      const r = UrlFetchApp.fetch(e.parameter.url, { muteHttpExceptions:true, followRedirects:true });
      return out_({ ok:true, online: r.getResponseCode() < 400, code: r.getResponseCode() });
    } catch (err) { return out_({ ok:true, online:false }); }
  }
  return out_({ ok:false, error:"unknown action" });
}

// ส่งเป็น text/plain เพื่อเลี่ยง CORS preflight
function doPost(e) {
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const b = JSON.parse(e.postData.contents);
    const pin = PropertiesService.getScriptProperties().getProperty("ADMIN_PIN");
    if (!pin || b.pin !== pin) return out_({ ok:false, error:"รหัสไม่ถูกต้อง" });
    const s = sh_(), item = b.item || {};
    if (b.action === "add") {
      item.id = Utilities.getUuid().slice(0,8);
      s.appendRow(HEAD.map(h => item[h] === undefined ? "" : item[h]));
      return out_({ ok:true, id:item.id });
    }
    const ids = s.getRange(1,1,s.getLastRow(),1).getValues().flat();
    const row = ids.indexOf(b.id || item.id) + 1;
    if (row < 2) return out_({ ok:false, error:"ไม่พบรายการ" });
    if (b.action === "update") {
      s.getRange(row,1,1,HEAD.length).setValues([HEAD.map(h => h==="id" ? ids[row-1] : (item[h] === undefined ? "" : item[h]))]);
      return out_({ ok:true });
    }
    if (b.action === "delete") { s.deleteRow(row); return out_({ ok:true }); }
    return out_({ ok:false, error:"unknown action" });
  } catch (err) { return out_({ ok:false, error:String(err) }); }
  finally { lock.releaseLock(); }
}

# StealthKeep v1.0.0
ห้องนิรภัยดิจิทัลแบบ PWA (HTML + Vanilla JS + Tailwind) — ข้อมูลเข้ารหัส AES-256-GCM ในเครื่อง (คีย์มาจาก PIN ผ่าน PBKDF2)

## ติดตั้งผ่าน GitHub Pages
1. สร้าง repo ใหม่ → อัปโหลดไฟล์ทั้งหมดในโฟลเดอร์นี้ (branch `main`)
2. Settings → Pages → Source เลือก **GitHub Actions** (workflow `pages.yml` จะ deploy ให้อัตโนมัติ)
3. เปิด `https://<user>.github.io/<repo>/` บนมือถือ

## เพิ่มไอคอนบนหน้าหลักมือถือ
- **Android (Chrome):** เมนู ⋮ → “ติดตั้งแอป” หรือปุ่ม “เพิ่มไอคอนลงหน้าจอหลัก” ในหน้าตั้งค่า (กดไอคอนค้างจะมีทางลัด โน้ตลับ / เช็คลิสต์ / เอกสาร)
- **iPhone (Safari):** ปุ่มแชร์ → “เพิ่มไปยังหน้าจอโฮม”

## เชื่อม Google Sheets (ไม่บังคับ — ใช้กับอัลบั้ม และซิงก์สำรอง)
1. สร้าง Google Sheet → Extensions → Apps Script → วางโค้ดจาก `Code.gs` แก้ `TOKEN`
2. Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone)
3. นำ URL + Token ไปใส่ในแอป: ตั้งค่า → Google Sheets Backend

## หมายเหตุ
- ลืม PIN = กู้ข้อมูลไม่ได้ (ออกแบบมาเช่นนั้น) — สำรองไฟล์ JSON ไว้เสมอ
- ต้องอัปเดต `VERSION`, `CACHE` ใน `sw.js` และ `VER` ใน `index.html` ทุกครั้งที่ปล่อยเวอร์ชันใหม่

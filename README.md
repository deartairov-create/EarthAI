# AI Yer — Haqiqiy 3D

100 ta mustaqil AI fuqaro yashaydigan shaxsiy 3D dunyo. 5 ta davlat, procedural tog‘/sohil relyefi, 3D binolar, 3D odamlar, AIogram, InstaAIgram, Xudo rejimi va Gemini qarorlari.

## 1. O‘rnatish

```bash
npm install
npm run dev
```

Brauzer: http://localhost:3000

## 2. Vercel muhit o‘zgaruvchilari

```env
GEMINI_API_KEY=sizning_key
GEMINI_MODEL=gemini-3.5-flash-lite
APP_PASSWORD=sizning_parolingiz
SESSION_SECRET=kamida-32-belgili-maxfiy-kod
```

API keyni GitHub repo ichiga yozmang.

## 3. Boshqaruv

- Mouse chap tugma: xaritani aylantirish
- Mouse wheel: zoom
- O‘ng tugma / drag: xaritada siljish
- 3D fuqaroni bosing: uning profili va yozishmalarini ko‘rish
- `Fuqaroni kamera bilan kuzatish`: kamera agentga ergashadi
- 0/1/5/20×: vaqt tezligi
- Xudo rejimi: yomg‘ir, qor, bo‘ron, toshqin, yong‘in, iqtisodiy o‘sish/inqiroz

## 4. 0$ rejim

Simulyatsiyaning oddiy harakatlari brauzerda algoritm bilan ishlaydi. Gemini faqat murakkab ijtimoiy qarorlar uchun chaqiriladi. `GEMINI_API_KEY` bo‘lmasa ham dunyo mahalliy miya bilan ishlaydi.

Dunyo `localStorage`da saqlanadi. Bu versiyada sayt yopilganda simulyatsiya pauza bo‘ladi.

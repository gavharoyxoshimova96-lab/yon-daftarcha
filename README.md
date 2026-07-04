# Yon Daftarcha

O'zbek foydalanuvchilari uchun shaxsiy va oilaviy moliya boshqaruv ilovasi.

## Xususiyatlar (MVP 1.0)

- **Ro'yxatdan o'tishsiz** — darhol foydalanish mumkin
- **Offline ishlaydi** — barcha ma'lumotlar qurilmada SQLite da saqlanadi
- **Bosh sahifa** — balans, oylik kirim/chiqim, tezkor amallar, oxirgi 10 operatsiya
- **Kirim / Chiqim** — qo'shish, tahrirlash, o'chirish
- **Kategoriyalar** — kirim va chiqim kategoriyalarini boshqarish
- **Kalendar** — kunlik kirim/chiqim ko'rinishi
- **Qarzlar** — pul oldim/berdim, to'langan deb belgilash
- **Hisobotlar** — oylik statistika, diagrammalar
- **Qidiruv** — sana, kategoriya, tur va izoh bo'yicha filtr

## Xususiyatlar (v2.0)

- **Jamg'arma maqsadlari** — pul yig'ish rejalarini kuzatish
- **Byudjet** — kategoriya bo'yicha oylik chiqim limitlari
- **Zaxira nusxa** — JSON eksport va import
- **PIN qulfi** — 4 raqamli PIN, fon rejimida qulflash
- **Biometrika** — barmoq izi / Face ID bilan ochish
- **Bildirishnomalar** — qarz muddati eslatmalari

## Xususiyatlar (v3.0)

- **AI yordamchi** — moliyaviy savollarga javob, shaxsiy maslahatlar
- **Offline rejim** — internet siz ham ishlaydi (mahalliy tahlil)
- **OpenAI** — ixtiyoriy API kalit bilan aqlli javoblar

## Texnologiyalar

- React Native (Expo SDK 56)
- Expo Router (navigatsiya)
- Expo SQLite (mahalliy ma'lumotlar bazasi)
- React Native Paper (Material Design 3)
- React Native Calendars, Chart Kit

## Ishga tushirish

```bash
cd yon-daftarcha
npm install
npm start
```

Keyin:
- `a` — Android emulator
- `w` — veb-brauzer
- Expo Go ilovasi orqali QR kod skanerlash

## Loyiha tuzilmasi

```
app/              — Ekranlar (Expo Router)
components/       — UI komponentlar
database/         — SQLite operatsiyalari
context/          — Global holat
constants/        — Mavzu va standart kategoriyalar
types/            — TypeScript tiplar
utils/            — Formatlash va sana yordamchilari
```

## Kelajak versiyalar

- Qo'shimcha AI imkoniyatlari (ovozli yordam, bashorat)

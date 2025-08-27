# Liquid Glass UI Kit — Vite Template (v2)

Готовий до запуску шаблон **Vite + React + Tailwind + Framer Motion** з підключеним UI-китом.
Експорт компонентів і демо взято **точно** з canvas (стан на 2025-08-27 12:12 UTC).

## Запуск
```bash
npm i
npm run dev
# або:
# pnpm i && pnpm dev
# bun i && bun dev
```
Відкрий `http://localhost:5173`.

## Структура
- `src/ui/ProGran3D-Liquid-Glass-Theme-v2.jsx` — весь набір компонентів + демо.
- `src/App.jsx` — вставляє демо; можеш замінити на свій додаток.
- `tailwind.config.js` (`darkMode: 'class'`), `postcss.config.js`, `index.css` — налаштування стилів.
- `vite.config.js` — плагін React.

## Використання у власному коді
```jsx
import { PgTheme, PgCard, PgButton } from './ui/ProGran3D-Liquid-Glass-Theme-v2.jsx';

export default function MyScreen(){
  return (
    <PgTheme mode="dark" accent="emerald">
      <main className="p-6">
        <PgCard className="max-w-md">
          <PgButton>Привіт</PgButton>
        </PgCard>
      </main>
    </PgTheme>
  );
}
```

## Теми
`sky | indigo | emerald | violet | graphite | rose | amber | teal`

Якщо потрібен TypeScript-варіант чи збірка під SketchUp HtmlDialog — скажи 😉

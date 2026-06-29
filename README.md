# CourseNest

**Smart semester scheduler.** Upload your class syllabi and CourseNest reads each
course, calculates study time from your school's official credit-hour guidelines,
and builds a balanced weekly plan around work, the gym, clubs, and free time —
then exports it to Google or Apple Calendar.

🔗 **Live site:** https://aminmenaa06-ship-it.github.io/CourseNest/

## How it works

1. **Pick your school.** CourseNest applies that institution's published
   credit-hour policy (≈2 study hours per unit per week across the UC, CSU, UT,
   SUNY, CUNY, and Florida systems — plus a custom rate). A syllabus's own stated
   workload always overrides the preset.
2. **Upload syllabi.** PDFs are parsed in your browser — course name, units,
   meeting times, and expected workload are auto-filled for you to confirm.
3. **Add the rest of your life.** Work shifts, gym, clubs, volunteering, and how
   much free time you want to protect each week.
4. **Generate & export.** Study blocks are placed around your fixed commitments,
   and you download one `.ics` file that imports into Google **and** Apple
   Calendar.

Everything runs locally in the browser — no accounts, no backend, no data leaves
your device.

## Tech

- React + TypeScript + Vite
- Tailwind CSS (v4)
- [pdf.js](https://mozilla.github.io/pdf.js/) for in-browser syllabus parsing
- Hand-rolled `.ics` (iCalendar) export

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
```

`npm run dev` and `npm run build` automatically copy pdf.js CMap and standard-font
data into `public/pdfjs/` (see `scripts/copy-pdf-assets.mjs`) so the syllabus
reader can decode the full range of fonts real PDFs use.

## Deploy

Pushing to `main` builds the site and publishes it to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

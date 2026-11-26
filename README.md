# Japan Pet Quarantine Check

Free checker for bringing a dog or cat into Japan, taking it out, or leaving Japan and coming back, from the MAFF Animal Quarantine Service (AQS) rules: earliest arrival (180 days after the rabies antibody blood draw), the 40-day advance notice, the 10-day vet-check window, detention days for an early arrival, invalid-step checks (chip after the first shot, shot before 91 days, <30 days between shots, late booster, titer <0.5), designated regions (Iceland, Australia, NZ, Fiji, Hawaii, Guam), the 14-day export application (mandatory for dogs and rabbits exported from 2027-01-01) and the short-stay route (≤12 h quarantine on return).

- Full app and API (Vercel): https://japan-pet-quarantine.vercel.app
- Checker (GitHub Pages): https://akiba-labs.github.io/japan-pet-quarantine/

- API: `GET /api/check?direction=import&species=dog&country=US&birthDate=2026-03-01&microchipDate=2026-06-10&vaccine1Date=2026-06-10&vaccine2Date=2026-07-20&bloodDrawDate=2026-08-05&titer=2.1&arrivalDate=2027-06-15` (keyless, CORS open), `/api/rules`, `/openapi.json`, `/llms.txt`
- MCP: `japan_pet_quarantine_check` on https://free-agent-tools.vercel.app/mcp

Sources: MAFF AQS pages (import from non-designated / designated regions, export, 短期滞在編, 2027-01-01 notices, FAQ, designated labs) and 犬等の輸出入検疫規則 (e-Gov 411M50000200068). Rules as of 2026-10-31.

```
npm install
npm test
npm run build
npm run build:pages
```

`npm run build` is the Vercel app (checker, JSON API, share pages). `npm run build:pages` writes a static `out/` for GitHub Pages and checks that internal links and assets resolve under `/japan-pet-quarantine`. Server routes stay in the repo; the Pages script only moves them aside for that build.

GitHub settings: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Pushes to `main` deploy with `.github/workflows/pages.yml`. The copy-paste steps for the other tool repos are at the top of `scripts/build-pages.mjs`.

**Disclaimer:** educational, not veterinary or legal advice, not affiliated with MAFF or AQS. AQS decides on your documents; confirm with the AQS office at your port before booking.

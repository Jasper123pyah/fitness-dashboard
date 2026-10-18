# Trainlog

Persoonlijke app voor training, maaltijdplanning, boodschappen en voortgang.
Alles draait op je telefoon: er is geen server, geen account en geen internet
nodig na de installatie.

- **Training** — schema, trainingen loggen, gewichten van vorige keer, advies
  voor de volgende keer, geschiedenis per oefening.
- **Voeding** — receptenbibliotheek met echte hoeveelheden, weekmenu voor vier
  momenten per dag, porties per maaltijd en sjablonen.
- **Boodschappen** — automatisch uit het weekmenu: hoeveelheden geschaald,
  gelijke ingrediënten opgeteld, gegroepeerd per schap.
- **Voortgang** — gewicht met weekgemiddelden, omtrekken, foto's en records.

## Wat je nodig hebt

Node 20 of nieuwer.

```bash
npm install
npm run dev
```

De app staat dan op http://localhost:5173.

## Commando's

```bash
npm run dev        # ontwikkelserver
npm run build      # productiebuild naar dist/
npm run preview    # de productiebuild lokaal bekijken (inclusief service worker)
npm run check      # lint + typecheck + tests
npm test           # alleen de tests
```

## Op je iPhone zetten

Installeren en offline werken vraagt een beveiligde verbinding: `https://`, of
`localhost` op dezelfde machine. Over `http://` naar een IP-adres in je eigen
netwerk werkt de app wel, maar registreert de service worker niet — zet hem
daarvoor dus eerst online (zie hieronder).

1. Open <https://jasper123pyah.github.io/fitness-dashboard/> in **Safari** op
   je iPhone.
2. Tik op het deelicoon en kies **Zet op beginscherm**.
3. Open de app vanaf je beginscherm. Vanaf dat moment werkt alles zonder
   internet: de app staat in de cache en je gegevens staan in de database op je
   toestel.

Op Android doe je hetzelfde via het menu van Chrome, met **App installeren**.

## Online zetten

De app staat op <https://jasper123pyah.github.io/fitness-dashboard/>.

Opnieuw publiceren na een wijziging:

```bash
npm run deploy
```

Dat bouwt de app met het juiste basispad en zet het resultaat op de branch
`gh-pages`, waar GitHub Pages hem vandaan serveert. De broncode staat op
`main`; op `gh-pages` staat alleen de build.

Wil je dat het automatisch gebeurt bij elke push naar `main`, gebruik dan de
workflow in `.github/workflows/deploy.yml`. Die kan pas gepusht worden als je
token de scope `workflow` heeft:

```bash
gh auth refresh --user Jasper123pyah -s workflow
```

Zet daarna in de repository-instellingen *Pages* op *GitHub Actions*.

**Een andere host.** De build is een map met statische bestanden, dus Netlify,
Cloudflare Pages of een eigen webruimte werken net zo goed:

```bash
npm run build          # relatieve paden, werkt in elke map
BASE_PATH=/submap/ npm run build
```

De app gebruikt hash-routering (`/#/training`), dus er zijn geen serverregels
nodig om diep linken te laten werken.

## Waar je gegevens staan

Alles staat in IndexedDB op het toestel waarop je de app gebruikt. Er gaat
niets naar een server, ook de voortgangsfoto's niet.

Dat betekent ook: **maak af en toe een back-up**. Dat doe je bij
*Instellingen → Back-up*. Je krijgt één JSON-bestand met alles erin, inclusief
de foto's. Datzelfde bestand kun je terugzetten op een ander toestel of na het
leegmaken van je browser.

De app vraagt de browser om de opslag te bewaren
(`navigator.storage.persist()`), zodat iOS de database niet opruimt als er
ruimte nodig is.

## Hoe het in elkaar zit

```
src/
  db/            datamodel, Dexie-database, standaardinhoud en back-up
    repo/        alle lees- en schrijfacties per onderdeel
  lib/           rekenwerk zonder UI: eenheden, recepten, boodschappen,
                 gewicht, progressie, datums
  features/      de schermen, per onderdeel
  components/    gedeelde UI en de shadcn-componenten
```

Het rekenwerk in `src/lib` staat los van de database en de UI, en is waar de
tests zich op richten: porties omrekenen, ingrediënten samenvoegen, eenheden
omrekenen, weekgemiddelden en de adviezen voor meer gewicht. In
`src/db/repo/*.test.ts` staan tests die de echte database gebruiken, van een
training loggen tot de boodschappenlijst opnieuw genereren.

## Het datamodel uitbreiden

De database heeft een versienummer (`src/db/db.ts`). Een nieuw veld of een
nieuwe tabel komt in een **nieuw** `version(n).stores({...})`-blok, met zo nodig
een `upgrade()` om bestaande rijen bij te werken. Dexie laat alles wat er al
staat dan gewoon staan, zodat een update van de app nooit gegevens wist.

Standaardinhoud (oefeningen, recepten) wordt alleen aangevuld, nooit
overschreven: zie `SEED_VERSION` in `src/db/seed-data.ts`.

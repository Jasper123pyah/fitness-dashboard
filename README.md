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

1. Zet de app online, bijvoorbeeld op GitHub Pages.
2. Open de pagina in **Safari** op je iPhone.
3. Tik op het deelicoon en kies **Zet op beginscherm**.
4. Open de app vanaf je beginscherm. Vanaf dat moment werkt alles zonder
   internet: de app staat in de cache en je gegevens staan in de database op je
   toestel.

Op Android doe je hetzelfde via het menu van Chrome, met **App installeren**.

## Online zetten

De build is een map met statische bestanden. Die kan op elke host staan.

**GitHub Pages.** Er staat een workflow klaar in
`.github/workflows/deploy.yml`. Zet in de repository-instellingen *Pages* op
*GitHub Actions* en push naar `main`. De workflow bouwt met het juiste
basispad.

**Zelf bouwen voor een submap:**

```bash
BASE_PATH=/naam-van-je-repo/ npm run build
```

Zonder `BASE_PATH` worden relatieve paden gebruikt, wat op de meeste hosts
(Netlify, Vercel, een eigen map) direct werkt. De app gebruikt hash-routering
(`/#/training`), dus er zijn geen serverregels nodig om diep linken te laten
werken.

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

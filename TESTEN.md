# Frontend opstarten & testen

## Lokaal draaien (geen Supabase nodig)

```bash
cd app
npm install
npm run dev
```

Open http://localhost:3000

Bij eerste bezoek word je naar `/login` gestuurd. Vul een willekeurig email-adres
in en klik "Stuur magic link" — in mock mode log je direct in als testgebruiker.

## Wat je kunt testen

### 1. Wedstrijdtegel-staten
Open `/predictions` → tab "Groepsfase" → groep **A**.

In de mock data zit een mix van wedstrijdstaten:
- **Wedstrijd 1 (Mexico–Zuid-Afrika)** — al gespeeld 2-1. Jan heeft 2-1 voorspeld
  (EXACT, +10), Sara 1-0 (UITSLAG, +4). Wissel rechtsboven van gebruiker om dit
  verschil te zien.
- **Wedstrijd 2 (Zuid-Korea–Tsjechië)** — net begonnen (30 min geleden).
  Vergrendeld, wacht op eindstand. Test wat er gebeurt als je een wedstrijd ziet
  waar je wél vs niet voor hebt voorspeld (switch user).
- **Wedstrijd 25 (Tsjechië–Zuid-Afrika)** — over ~48 uur. Volledig actief.
- **Wedstrijd 28 (Mexico–Zuid-Korea)** — over ~54 uur. Volledig actief.

### 2. Voorspelling opslaan
Vul beide score-vakjes van een open wedstrijd in. Na ~0.6 seconde verschijnt
een groen vinkje rechts → opgeslagen. Refresh de pagina; je voorspelling staat
er nog (in `localStorage`).

### 3. Wisselen tussen gebruikers
Rechtsboven dropdown:
- **Jan K.** — gewone deelnemer, paar voorspellingen ingevuld
- **Sara M.** — andere voorspellingen, andere puntenstand
- **Tom (admin)** — krijgt later een admin-paneel
- **Lisa** — nog niets ingevuld, lege staat

### 4. Groep-navigatie
Switch tussen groepen A/B/C/F bovenaan. Het vinkje verschijnt zodra een
gebruiker alle wedstrijden van die groep heeft ingevuld. Probeer:
- Bij Jan in groep A: alle 4 wedstrijden invullen → vinkje verschijnt naast "A"
- Switch naar Sara: vinkje verdwijnt (zij heeft niet alles ingevuld)

### 5. Groepsstand uitklappen
Klik op "Huidige stand ⌃" boven de wedstrijdtegels. Toont de live stand
op basis van gespeelde wedstrijden in die groep.

### 6. Ranglijst
Klik op "Ranglijst" in de top-nav. Toont:
- Alle 4 testgebruikers gesorteerd op punten
- Jouw eigen rij is oranje-gehighlight
- Top 3 krijgt oranje rangnummer

### 7. Andere fases
Klik op "1/16 finale" of "Finale" in de fase-tabs. Mock data bevat geen
matches in deze fases (alleen groepsfase) — je ziet de lege staat.
Dit is niet kapot, gewoon: testdata is beperkt tot groepsfase.

### 8. Deadline countdown
Bovenaan elke fase zie je een countdown naar de deadline. Test dit door
in `app/lib/mock-provider.ts` de `hoursFromNow(...)` waarden te
veranderen — bv. wedstrijd op 23 uur in plaats van 26.

## Reset alles

Browser dev tools → Application → Local Storage → wis `wkpool_*` keys.
Refresh. Je begint opnieuw met de initiële mock data.

## Wat werkt nog niet (volgende rondes)

- Bonusvragen (topscorer, rode kaarten, etc.) — UI nog niet gebouwd
- Admin-paneel voor uitslagen invoeren
- Knockout-fases met TBD-placeholders
- Privacy: andermans voorspellingen pas zichtbaar na deadline
- Mail-notificaties

## Overschakelen naar Supabase

Wanneer de backend van Step 1 (de SQL migraties) draait:

1. In `.env.local`:
   ```
   NEXT_PUBLIC_DATA_MODE=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://JOUW-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG... (de anon key, niet service_role)
   ```
2. Restart de dev server. Alles werkt nu tegen je echte database.
3. De "Dev mode — mock data" banner bovenin verdwijnt.
4. De user-switcher dropdown verdwijnt (er is dan echte auth).

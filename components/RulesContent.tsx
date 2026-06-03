'use client'

// Single source of truth for the rules text — used on both the public
// /rules page and the /terms-accept gate.

export function RulesContent() {
  return (
    <div className="space-y-6 text-ink-200 text-sm leading-relaxed">

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Hoe werkt de poule?</h2>
        <p>
          Voorspel de uitslagen van het WK 2026. Per wedstrijd vul je de eindstand in.
          Hoe dichter je bij de werkelijke uitslag zit, hoe meer punten je verdient.
        </p>
      </section>

         <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Punten per wedstrijd</h2>
        <ul className="space-y-1.5 ml-4 list-disc marker:text-ink-500">
          <li><b className="text-ink-50">Exacte score</b>: volledige punten als je de uitslag exact goed hebt.</li>
          <li><b className="text-ink-50">Juiste winnaar</b>: punten als je winst/gelijk/verlies goed hebt voorspeld.</li>
          <li><b className="text-ink-50">Per juist doelpuntenaantal</b>: punten voor elk team waarvan je het exacte aantal goals goed hebt — ook als de rest niet klopt.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Puntenverdeling per fase</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-ink-500 text-[10px] tracking-wider uppercase border-b border-ink-600">
              <th className="text-left font-normal pb-1.5">Fase</th>
              <th className="text-right font-normal pb-1.5">Exact</th>
              <th className="text-right font-normal pb-1.5">Uitkomst</th>
              <th className="text-right font-normal pb-1.5">Goals</th>
            </tr>
          </thead>
          <tbody className="text-ink-200">
            <tr className="border-b border-ink-800"><td className="py-1.5">Poulefase</td><td className="text-right tabular-nums">10</td><td className="text-right tabular-nums">4</td><td className="text-right tabular-nums">1</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">1/16e finale / Round of 32</td><td className="text-right tabular-nums">15</td><td className="text-right tabular-nums">6</td><td className="text-right tabular-nums">2</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">1/8e finale / Round of 16</td><td className="text-right tabular-nums">20</td><td className="text-right tabular-nums">8</td><td className="text-right tabular-nums">2</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">Kwartfinales</td><td className="text-right tabular-nums">30</td><td className="text-right tabular-nums">12</td><td className="text-right tabular-nums">3</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">Halve finales</td><td className="text-right tabular-nums">40</td><td className="text-right tabular-nums">16</td><td className="text-right tabular-nums">4</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">Troostfinale / 3e plek</td><td className="text-right tabular-nums">30</td><td className="text-right tabular-nums">12</td><td className="text-right tabular-nums">3</td></tr>
            <tr><td className="py-1.5">Finale</td><td className="text-right tabular-nums">60</td><td className="text-right tabular-nums">24</td><td className="text-right tabular-nums">6</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Knockout-rondes: verlenging & penalty&apos;s</h2>
        <p>
          In knockout-wedstrijden voorspel je de <b className="text-ink-50">eindstand inclusief verlenging</b>.
          Eindigt een wedstrijd op penalty&apos;s, dan telt deze voor de poule als gelijkspel: de stand na 120 minuten is leidend.
          De penaltyserie zelf telt niet mee voor de voorspelde uitslag.
        </p>
      </section>

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Deadlines & vergrendeling</h2>
        <p className="mb-2">
          Voorspellingen sluiten per speelronde, niet per losse wedstrijd. Zodra de eerste wedstrijd van een speelronde begint,
          worden alle wedstrijden binnen die speelronde vergrendeld.
        </p>
        <table className="w-full text-xs mb-2">
          <thead>
            <tr className="text-ink-500 text-[10px] tracking-wider uppercase border-b border-ink-600">
              <th className="text-left font-normal pb-1.5">Speelronde</th>
              <th className="text-left font-normal pb-1.5">Deadline</th>
              <th className="text-right font-normal pb-1.5">Amsterdam</th>
            </tr>
          </thead>
          <tbody className="text-ink-200">
            <tr className="border-b border-ink-800"><td className="py-1.5">Poulefase</td><td>Donderdag 11 juni 2026</td><td className="text-right tabular-nums">21:00</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">1/16e finale / Round of 32</td><td>Zondag 28 juni 2026</td><td className="text-right tabular-nums">21:00</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">1/8e finale / Round of 16</td><td>Zaterdag 4 juli 2026</td><td className="text-right tabular-nums">19:00</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">Kwartfinale</td><td>Donderdag 9 juli 2026</td><td className="text-right tabular-nums">22:00</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">Halve finale</td><td>Dinsdag 14 juli 2026</td><td className="text-right tabular-nums">21:00</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">3e plaats finale</td><td>Zaterdag 18 juli 2026</td><td className="text-right tabular-nums">23:00</td></tr>
            <tr><td className="py-1.5">Finale</td><td>Zondag 19 juli 2026</td><td className="text-right tabular-nums">21:00</td></tr>
          </tbody>
        </table>
        <ul className="space-y-1.5 ml-4 list-disc marker:text-ink-500">
          <li>Na de deadline van een speelronde kun je voor <b className="text-ink-50">géén wedstrijd</b> in die speelronde nog voorspellingen doen of aanpassen.</li>
          <li>Deadlines worden getoond in jouw lokale tijdzone, met het exacte sluitingsmoment.</li>
          <li>Je mag later instromen, maar alleen speelrondes waarvan de deadline nog niet is verlopen kunnen nog worden voorspeld.</li>
          <li>Wedstrijden en speelrondes die al gesloten of gestart zijn, kunnen niet meer worden voorspeld.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Bonusvragen</h2>
        <p className="mb-2">
          Aan het einde van het toernooi worden de bonusvragen uitgekeerd. Alle bonusvragen sluiten bij de start van de eerste wedstrijd van het toernooi:
          <b className="text-ink-50"> donderdag 11 juni 2026 om 21:00 Amsterdam-tijd</b>.
        </p>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-ink-500 text-[10px] tracking-wider uppercase border-b border-ink-600">
              <th className="text-left font-normal pb-1.5">Bonusvraag</th>
              <th className="text-right font-normal pb-1.5">Punten</th>
            </tr>
          </thead>
          <tbody className="text-ink-200">
            <tr className="border-b border-ink-800"><td className="py-1.5"><b className="text-ink-50">Welk land wordt wereldkampioen?</b><br />De winnaar van het WK.</td><td className="text-right tabular-nums align-top py-1.5">50</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5"><b className="text-ink-50">Wie wordt de topscorer van het toernooi?</b><br />Het meeste aantal doelpunten tijdens het WK.</td><td className="text-right tabular-nums align-top py-1.5">40</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5"><b className="text-ink-50">Hoeveel rode kaarten worden er tijdens het gehele toernooi uitgedeeld?</b><br />Het exacte aantal rode kaarten tijdens het gehele toernooi.</td><td className="text-right tabular-nums align-top py-1.5">30</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5"><b className="text-ink-50">Hoeveel minuten speelt Marten de Roon?</b><br />Exact goed: 40 punten. Afwijking van 1 t/m 45 minuten: 25 punten. Afwijking van 46 t/m 90 minuten: 10 punten.</td><td className="text-right tabular-nums align-top py-1.5">40 / 25 / 10</td></tr>
            <tr><td className="py-1.5"><b className="text-ink-50">Hoe vaak komt Jelle in beeld tijdens een wedstrijd?</b><br />Alleen exact goed levert punten op.</td><td className="text-right tabular-nums align-top py-1.5">150</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Nadere uitleg bonusvragen</h2>
        <ul className="space-y-1.5 ml-4 list-disc marker:text-ink-500">
          <li><b className="text-ink-50">Rode kaarten</b>: alles telt mee tijdens de wedstrijd: direct rood, twee keer geel, reguliere speeltijd, verlenging, na afloop, Donald Trump, stafleden en wisselspelers.</li>
          <li><b className="text-ink-50">Marten de Roon</b>: alleen officiële speelminuten volgens de FIFA tellen mee. Penaltyseries, kleedkamerspeeches en andere belangrijke minuten in de kleedkamer tellen niet mee.</li>
          <li><b className="text-ink-50">Jelle in beeld</b>: de organisatoren beslissen of hij herkenbaar genoeg in beeld is. Alleen momenten tijdens de live-tv-uitzending van een WK-wedstrijd tellen mee. Herhalingen, social clips, foto&apos;s en andere overzichten waarin hetzelfde beeld opnieuw wordt getoond en beelden buiten de live-wedstrijdregistratie tellen niet mee. Alleen een exacte voorspelling levert punten op.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Tiebreakers</h2>
        <p>Bij gelijke punten in de eindstand bepalen we de winnaar zo:</p>
        <ol className="space-y-1.5 ml-4 list-decimal marker:text-ink-500 mt-2">
          <li>Meeste exact geraden wedstrijduitslagen.</li>
          <li>Juist voorspelde WK-winnaar.</li>
          <li>Meeste punten uit bonusvragen.</li>
          <li>Bij blijvende gelijke stand: beslissing door de organisator.</li>
        </ol>
      </section>

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Spelvoorwaarden</h2>
        <ul className="space-y-1.5 ml-4 list-disc marker:text-ink-500">
          <li>Bij twijfel over de regels beslist de organisator. Deze beslissing is definitief.</li>
          <li>Officiële FIFA-wedstrijdstatistieken en toernooigegevens zijn leidend voor uitslagen, doelpunten, kaarten, speelminuten en topscorer.</li>
          <li>Vooral: veel plezier, en laat het geen ruzies opleveren.</li>
        </ul>
      </section>
    </div>
  )
}

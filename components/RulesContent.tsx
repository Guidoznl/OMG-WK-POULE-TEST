'use client'

// Single source of truth for the rules text — used on both the public
// /rules page and the /terms-accept gate.

export function RulesContent() {
  return (
    <div className="space-y-6 text-ink-200 text-sm leading-relaxed">

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Hoe werkt de poule?</h2>
        <p>
          Voorspel de uitslagen van het WK 2026. Per wedstrijd vul je twee scores in.
          Hoe dichter je bij de werkelijke uitslag zit, hoe meer punten je verdient.
        </p>
      </section>

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Punten per wedstrijd</h2>
        <ul className="space-y-1.5 ml-4 list-disc marker:text-ink-500">
          <li><b className="text-ink-50">Exacte score</b>: volledige punten als je de uitslag exact goed hebt.</li>
          <li><b className="text-ink-50">Juiste winnaar</b>: punten als je winst/gelijk/verlies goed hebt voorspeld.</li>
          <li><b className="text-ink-50">Per juist doelpuntenaantal</b>: extra punten voor elk team waarvan je het exacte aantal goals goed hebt — ook als de rest niet klopt.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Puntenverdeling per fase</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-ink-500 text-[10px] tracking-wider uppercase border-b border-ink-600">
              <th className="text-left font-normal pb-1.5">Fase</th>
              <th className="text-right font-normal pb-1.5">Exact</th>
              <th className="text-right font-normal pb-1.5">Winnaar</th>
              <th className="text-right font-normal pb-1.5">Per goal</th>
            </tr>
          </thead>
          <tbody className="text-ink-200">
            <tr className="border-b border-ink-800"><td className="py-1.5">Groepsfase</td><td className="text-right tabular-nums">10</td><td className="text-right tabular-nums">4</td><td className="text-right tabular-nums">1</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">1/16 finale</td><td className="text-right tabular-nums">15</td><td className="text-right tabular-nums">6</td><td className="text-right tabular-nums">2</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">1/8 finale</td><td className="text-right tabular-nums">20</td><td className="text-right tabular-nums">8</td><td className="text-right tabular-nums">2</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">Kwartfinale</td><td className="text-right tabular-nums">30</td><td className="text-right tabular-nums">12</td><td className="text-right tabular-nums">3</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">Halve finale</td><td className="text-right tabular-nums">40</td><td className="text-right tabular-nums">16</td><td className="text-right tabular-nums">4</td></tr>
            <tr className="border-b border-ink-800"><td className="py-1.5">3e plek</td><td className="text-right tabular-nums">30</td><td className="text-right tabular-nums">12</td><td className="text-right tabular-nums">3</td></tr>
            <tr><td className="py-1.5">Finale</td><td className="text-right tabular-nums">60</td><td className="text-right tabular-nums">24</td><td className="text-right tabular-nums">6</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Knockout-rondes: verlenging & penalty's</h2>
        <p>
          In knockout-wedstrijden voorspel je de <b className="text-ink-50">eindstand inclusief verlenging</b>.
          Eindigt een wedstrijd op penalty's, dan telt deze als gelijkspel — de stand na 120 minuten is leidend.
        </p>
      </section>

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Deadlines & vergrendeling</h2>
        <ul className="space-y-1.5 ml-4 list-disc marker:text-ink-500">
          <li>Elke wedstrijd sluit <b className="text-ink-50">2 uur vóór de officiële aftrap</b>.</li>
          <li>Daarna kun je voor die wedstrijd geen voorspelling meer doen of aanpassen.</li>
          <li>Deadlines worden getoond in jouw lokale tijdzone, met het exacte sluitingsmoment.</li>
          <li>Je mag altijd later instromen — wedstrijden die nog open staan kun je gewoon voorspellen.</li>
          <li>Wedstrijden die al gesloten of gestart zijn, kunnen niet meer worden voorspeld.</li>
        </ul>
      </section>

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Extra punten</h2>
        <p className="mb-2">Aan het einde van het toernooi worden er drie bonusvragen uitgekeerd:</p>
        <ul className="space-y-1.5 ml-4 list-disc marker:text-ink-500">
          <li><b className="text-ink-50">WK kampioen</b> — kies de winnaar van het toernooi (50 punten).</li>
          <li><b className="text-ink-50">Topscorer</b> — wie scoort de meeste goals? (20 punten).</li>
          <li><b className="text-ink-50">Aantal keer Jelle in beeld</b> — gok hoe vaak (100 punten exact, 25 punten als je binnen 3 zit).</li>
        </ul>
        <p className="mt-2 text-xs text-ink-400">De bonusvragen sluiten bij de eerste wedstrijd van het toernooi.</p>
      </section>

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Tiebreakers</h2>
        <p>Bij gelijke punten in de eindstand bepalen we de winnaar zo:</p>
        <ol className="space-y-1.5 ml-4 list-decimal marker:text-ink-500 mt-2">
          <li>Meeste exact geraden wedstrijduitslagen.</li>
          <li>Juist voorspelde WK-winnaar.</li>
          <li>Bij blijvende gelijke stand: interne afhandeling.</li>
        </ol>
      </section>

      <section>
        <h2 className="font-display text-base text-ink-50 font-medium mb-2">Spelvoorwaarden</h2>
        <ul className="space-y-1.5 ml-4 list-disc marker:text-ink-500">
          <li>Deze poule is uitsluitend voor OppoSuits-medewerkers.</li>
          <li>Voorspellingen zijn pas zichtbaar voor anderen nadat de betreffende wedstrijd is begonnen.</li>
          <li>Bij twijfel over de regels beslist de organisator.</li>
          <li>Vooral: veel plezier, en laat het geen ruzies opleveren.</li>
        </ul>
      </section>
    </div>
  )
}

// Centralized Dutch label helpers so they're consistent everywhere

export function dutchStageName(en: string): string {
  const map: Record<string, string> = {
    'Group Stage': 'Groepsfase',
    'Round of 32': '1/16 finale',
    'Round of 16': '1/8 finale',
    'Quarterfinals': 'Kwartfinale',
    'Semifinals': 'Halve finale',
    'Third Place Playoff': '3e plek',
    'Third Place': '3e plek',
    'Final': 'Finale',
  }
  return map[en] || en
}

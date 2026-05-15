'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BonusQuestion, BonusPrediction, CURRENT_TERMS_VERSION } from '@/lib/types'
import { getDataProvider } from '@/lib/data-provider'
import { getAllTeams } from '@/lib/mock-provider'
import { TopNav } from '@/components/TopNav'
import { FlagCircle } from '@/components/FlagCircle'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function ExtrasPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<BonusQuestion[]>([])
  const [myAnswers, setMyAnswers] = useState<BonusPrediction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const provider = getDataProvider()
      const user = await provider.getCurrentUser()
      if (!user) { router.push('/login'); return }
      if (!user.accepted_terms_at || user.accepted_terms_version !== CURRENT_TERMS_VERSION) {
        router.push('/terms-accept'); return
      }
      const [qs, mine] = await Promise.all([
        provider.getBonusQuestions(),
        provider.getMyBonusPredictions(),
      ])
      setQuestions(qs)
      setMyAnswers(mine)
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSave(questionId: number, answer: string) {
    await getDataProvider().saveBonusPrediction(questionId, answer)
    setMyAnswers(prev => {
      const others = prev.filter(a => a.question_id !== questionId)
      return [...others, {
        question_id: questionId, answer_raw: answer, answer_normalized: answer,
        submitted_at: new Date().toISOString(), points_awarded: null,
      }]
    })
  }

  if (loading) {
    return <><TopNav /><main className="max-w-3xl mx-auto p-4"><p className="text-ink-400 text-sm text-center mt-12">Laden…</p></main></>
  }

  return (
    <>
      <TopNav />
      <main className="max-w-3xl mx-auto p-4 pb-12">
        <h1 className="font-display text-2xl font-medium text-ink-50 mb-1">Extra punten</h1>
        <p className="text-ink-400 text-sm mb-6">
          Drie bonusvragen die je éénmalig invult. Punten worden uitgekeerd na afloop van het toernooi.
        </p>

        <div className="space-y-4">
          {questions.map(q => {
            const current = myAnswers.find(a => a.question_id === q.id)
            return (
              <BonusQuestionCard
                key={q.id}
                question={q}
                currentAnswer={current?.answer_raw || ''}
                onSave={(answer) => handleSave(q.id, answer)}
              />
            )
          })}
        </div>

        <p className="text-[11px] text-ink-500 text-center mt-8">
          Sluitingsmoment: bij de aftrap van de eerste wedstrijd van het toernooi.
        </p>
      </main>
    </>
  )
}

// ───────────────────────────────────────────────────────────────

function BonusQuestionCard({ question, currentAnswer, onSave }: {
  question: BonusQuestion
  currentAnswer: string
  onSave: (answer: string) => Promise<void>
}) {
  const [value, setValue] = useState(currentAnswer)
  const [save, setSave] = useState<SaveState>('idle')
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    if (value === currentAnswer) return
    if (!value.trim()) return

    const timer = setTimeout(async () => {
      setSave('saving')
      try {
        await onSave(value.trim())
        setSave('saved')
        setSavedFlash(true)
        setTimeout(() => { setSave('idle'); setSavedFlash(false) }, 4000)
      } catch {
        setSave('error')
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [value])

  const wrapClass = `tile p-5 transition-all duration-300 ${
    savedFlash ? 'ring-2 ring-accent-mint ring-offset-2 ring-offset-ink-950' : ''
  }`

  return (
    <div className={wrapClass}>
      <div className="flex items-start justify-between mb-3 gap-3">
        <h3 className="font-display text-base text-ink-50 font-medium">{question.question_text}</h3>
        <span className="text-xs text-accent-orange font-display font-medium whitespace-nowrap">
          {question.points_exact} pt{question.points_close ? ` (of ${question.points_close})` : ''}
        </span>
      </div>

      {question.question_type === 'team' && (
        <TeamPicker value={value} onChange={setValue} />
      )}

      {question.question_type === 'text' && (
        <input
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Naam van speler"
          className="w-full px-3 py-2.5 text-sm"
          aria-label={question.question_text}
        />
      )}

      {question.question_type === 'number' && (
        <input
          type="number"
          min="0"
          inputMode="numeric"
          value={value}
          onChange={e => setValue(e.target.value)}
          placeholder="Aantal"
          className="w-full px-3 py-2.5 text-sm tabular-nums"
          aria-label={question.question_text}
        />
      )}

      <div className="h-4 mt-2.5 text-right">
        {save === 'saving' && <span className="text-ink-400 text-[11px]">Opslaan…</span>}
        {save === 'saved' && (
          <span className="text-accent-mint text-[11px] font-medium inline-flex items-center gap-1">
            <CheckMini /> Opgeslagen
          </span>
        )}
        {save === 'error' && <span className="text-accent-coral text-[11px]">Fout — probeer opnieuw</span>}
      </div>

      {question.id === 3 && (
        <p className="text-[11px] text-ink-500 mt-1">
          Exact = {question.points_exact} pt. Binnen {question.close_threshold} = {question.points_close} pt.
        </p>
      )}
    </div>
  )
}

function TeamPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const teams = getAllTeams()
  const selectedTeam = teams.find(t => t.name === value)

  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm appearance-none bg-ink-950 border border-ink-600 rounded-lg text-ink-50 cursor-pointer pr-10"
      >
        <option value="">Kies een land…</option>
        {teams.map(t => (
          <option key={t.id} value={t.name}>{t.name}</option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-400">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      {selectedTeam && (
        <div className="mt-2 flex items-center gap-2">
          <FlagCircle isoCode={selectedTeam.iso_code} size="sm" />
          <span className="text-ink-200 text-xs">{selectedTeam.fifa_code} · {selectedTeam.name}</span>
        </div>
      )}
    </div>
  )
}

function CheckMini() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

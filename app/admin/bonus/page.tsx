'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BonusQuestion, AdminBonusAnswer } from '@/lib/types'
import { getDataProvider } from '@/lib/data-provider'
import { getAllTeams } from '@/lib/mock-provider'
import { TopNav } from '@/components/TopNav'

export default function AdminBonusPage() {
  const router = useRouter()
  const [questions, setQuestions] = useState<BonusQuestion[]>([])
  const [answers, setAnswers] = useState<AdminBonusAnswer[]>([])
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, string>>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  async function reload() {
    const provider = getDataProvider()
    const [qs, ans] = await Promise.all([
      provider.getBonusQuestions(),
      provider.adminGetBonusAnswers(),
    ])
    setQuestions(qs)
    setAnswers(ans)
    // Vul correctAnswers met wat al in DB staat (uit getBonusQuestions);
    // fallback: localStorage cache uit eerdere sessies.
    const fromDB: Record<number, string> = {}
    for (const q of qs) {
      const ca = (q as any).correct_answer
      if (ca) fromDB[q.id] = ca
    }
    try {
      const raw = window.localStorage.getItem('wkpool_admin_bonus_correct')
      const cached = raw ? JSON.parse(raw) : {}
      setCorrectAnswers({ ...cached, ...fromDB })  // DB wint
    } catch {
      setCorrectAnswers(fromDB)
    }
  }

  useEffect(() => {
    async function load() {
      const provider = getDataProvider()
      const user = await provider.getCurrentUser()
      if (!user) { router.push('/login'); return }
      if (!user.is_admin) { router.push('/predictions'); return }
      await reload()
      setLoading(false)
    }
    load()
  }, [router])

  async function handleSetCorrect(questionId: number, value: string) {
    setCorrectAnswers(prev => ({ ...prev, [questionId]: value }))
    try {
      await getDataProvider().adminSetBonusCorrectAnswer(questionId, value)
    } catch (err: any) {
      setMessage({ kind: 'error', text: err.message })
    }
  }

  async function handleNormalize(userId: string, questionId: number, value: string) {
    try {
      await getDataProvider().adminNormalizeAnswer(userId, questionId, value)
      await reload()
    } catch (err: any) {
      setMessage({ kind: 'error', text: err.message })
    }
  }

  async function handleScore(questionId: number) {
    if (!correctAnswers[questionId]?.trim()) {
      setMessage({ kind: 'error', text: 'Stel eerst het juiste antwoord in.' })
      return
    }
    try {
      const res = await getDataProvider().adminScoreBonusQuestion(questionId)
      setMessage({ kind: 'success', text: `${res.updated} antwoorden gescoord.` })
      await reload()
    } catch (err: any) {
      setMessage({ kind: 'error', text: err.message })
    }
  }

  if (loading) {
    return <><TopNav /><main className="max-w-3xl mx-auto p-4"><p className="text-ink-400 text-sm text-center mt-12">Laden…</p></main></>
  }

  return (
    <>
      <TopNav />
      <main className="max-w-3xl mx-auto p-4 pb-12">
        <Link href="/admin" className="text-xs text-ink-400 hover:text-ink-50 inline-flex items-center gap-1 mb-3">
          <BackIcon /> Terug naar wedstrijden
        </Link>

        <h1 className="font-display text-2xl font-medium text-ink-50 mb-1">Bonusvragen</h1>
        <p className="text-ink-400 text-sm mb-6">
          Per vraag: stel het juiste antwoord in, normaliseer spelfouten waar van toepassing, en bereken de punten.
        </p>

        {message && (
          <div className={`p-3 rounded-tile mb-4 text-sm ${
            message.kind === 'success'
              ? 'bg-accent-mint/10 border border-accent-mint/30 text-accent-mint'
              : 'bg-accent-coral/10 border border-accent-coral/30 text-accent-coral'
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-4">
          {questions.map(q => (
            <BonusQuestionAdminCard
              key={q.id}
              question={q}
              correctAnswer={correctAnswers[q.id] || ''}
              answers={answers.filter(a => a.question_id === q.id)}
              onSetCorrect={(v) => handleSetCorrect(q.id, v)}
              onNormalize={(userId, v) => handleNormalize(userId, q.id, v)}
              onScore={() => handleScore(q.id)}
            />
          ))}
        </div>
      </main>
    </>
  )
}

function BonusQuestionAdminCard({ question, correctAnswer, answers, onSetCorrect, onNormalize, onScore }: {
  question: BonusQuestion
  correctAnswer: string
  answers: AdminBonusAnswer[]
  onSetCorrect: (value: string) => void
  onNormalize: (userId: string, value: string) => void
  onScore: () => void
}) {
  const [localCorrect, setLocalCorrect] = useState(correctAnswer)
  const scoringType = (question as any).scoring_type as string | undefined
  const isScale = scoringType === 'scale'
  const isMulti = scoringType === 'multi_correct'

  // Sync localCorrect when prop changes (na reload)
  useEffect(() => { setLocalCorrect(correctAnswer) }, [correctAnswer])

  const suggestions = Array.from(new Set(
    answers
      .map(a => a.answer_normalized || a.answer_raw)
      .filter(v => v && v.trim())
  )).sort()

  // Label per scoring-type voor de admin
  const typeLabel = isScale
    ? 'SCHAALPUNTEN'
    : isMulti
      ? 'MEERDERE JUIST'
      : 'EXACT GOED'

  return (
    <div className="tile p-5">
      <div className="flex items-start justify-between mb-3 gap-3">
        <h3 className="font-display text-base text-ink-50 font-medium">{question.question_text}</h3>
        <span className="text-[10px] tracking-wider uppercase text-ink-500 whitespace-nowrap">
          {typeLabel}
        </span>
      </div>

      {/* Type-specifieke hint */}
      {isScale && (
        <p className="text-[11px] text-ink-400 mb-3 -mt-1">
          Vul het officiële numerieke antwoord in. Punten worden automatisch
          berekend op basis van afwijking: 0 = {question.points_exact} pt · 1–45 = {question.points_close} pt · 46–90 = 10 pt · ≥91 = 0 pt.
        </p>
      )}
      {isMulti && (
        <p className="text-[11px] text-ink-400 mb-3 -mt-1">
          Bij meerdere juiste antwoorden: scheid met komma's (bv. <i>Mbappé, Kane</i>).
        </p>
      )}

      {/* Correct answer input */}
      <div className="mb-4">
        <label className="block text-[10px] tracking-wider uppercase text-ink-500 mb-1.5">Juiste antwoord</label>
        {question.question_type === 'team' ? (
          <select
            value={localCorrect}
            onChange={e => { setLocalCorrect(e.target.value); onSetCorrect(e.target.value) }}
            className="w-full px-3 py-2 text-sm bg-ink-950 border border-ink-600 rounded-lg text-ink-50"
          >
            <option value="">Kies een land…</option>
            {getAllTeams().map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
        ) : question.question_type === 'number' ? (
          <input
            type="number"
            min="0"
            value={localCorrect}
            onChange={e => setLocalCorrect(e.target.value)}
            onBlur={() => onSetCorrect(localCorrect)}
            placeholder={isScale ? 'bv. 105' : 'bv. 17'}
            className="w-full px-3 py-2 text-sm tabular-nums"
          />
        ) : (
          <input
            type="text"
            value={localCorrect}
            onChange={e => setLocalCorrect(e.target.value)}
            onBlur={() => onSetCorrect(localCorrect)}
            placeholder={isMulti ? 'bv. Mbappé, Kane' : 'bv. Kylian Mbappé'}
            className="w-full px-3 py-2 text-sm"
            list={`suggest-q${question.id}`}
          />
        )}
        {suggestions.length > 0 && question.question_type === 'text' && (
          <datalist id={`suggest-q${question.id}`}>
            {suggestions.map(s => <option key={s} value={s} />)}
          </datalist>
        )}
      </div>

      {/* Score button */}
      <button
        onClick={onScore}
        disabled={!localCorrect.trim()}
        className="w-full py-2.5 bg-accent-orange hover:brightness-110 text-ink-950 text-sm font-display font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed mb-4"
      >
        Bereken punten voor deze vraag
      </button>

      {/* Answers list */}
      <div className="border-t border-ink-600 pt-3">
        <div className="text-[10px] tracking-wider uppercase text-ink-500 mb-2">
          Ingezonden antwoorden ({answers.length})
        </div>
        {answers.length === 0 ? (
          <p className="text-ink-400 text-xs">Nog geen antwoorden ingediend.</p>
        ) : (
          <div className="space-y-1.5">
            {answers.map(a => {
              const normalizedValue = a.answer_normalized || a.answer_raw
              const isCorrect = correctAnswer && (
                isScale
                  ? parseInt(normalizedValue) === parseInt(correctAnswer)
                  : isMulti
                    ? correctAnswer.split(',').map(s => s.trim().toLowerCase()).includes(normalizedValue.trim().toLowerCase())
                    : question.question_type === 'number'
                      ? parseInt(normalizedValue) === parseInt(correctAnswer)
                      : normalizedValue.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
              )
              return (
                <div key={a.user_id} className="flex items-center gap-2 p-2 bg-ink-800 rounded-lg">
                  <span className="text-ink-200 text-sm w-24 truncate">{a.display_name}</span>
                  <span className="text-ink-400 text-xs flex-1 truncate">
                    {a.answer_raw}
                    {a.answer_normalized && a.answer_normalized !== a.answer_raw && (
                      <span className="text-ink-500"> &rarr; {a.answer_normalized}</span>
                    )}
                  </span>
                  {/* Normaliseren alleen voor text-vragen */}
                  {question.question_type === 'text' && !isMulti && (
                    <button
                      onClick={() => {
                        const v = prompt('Normaliseer naar:', a.answer_normalized || a.answer_raw)
                        if (v !== null && v.trim()) onNormalize(a.user_id, v.trim())
                      }}
                      className="text-ink-400 hover:text-ink-50 text-[10px] underline"
                    >
                      bewerken
                    </button>
                  )}
                  {a.points_awarded !== null && (
                    <span className={`font-display font-medium text-sm w-10 text-right ${
                      a.points_awarded > 0 ? 'text-accent-orange' : 'text-ink-500'
                    }`}>+{a.points_awarded}</span>
                  )}
                  {isCorrect && a.points_awarded === null && (
                    <span className="text-accent-mint text-[10px]">✓</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function BackIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

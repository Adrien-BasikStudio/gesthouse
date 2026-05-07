'use client'

import { useState, useTransition } from 'react'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths, isSameMonth,
  startOfWeek, endOfWeek,
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Globe, Lock, Pencil, Trash2, X, Check } from 'lucide-react'
import { createNote, updateNote, deleteNote } from '@/lib/actions/notes'
import { toast } from 'sonner'

type Note = {
  id: string
  title: string | null
  content: string
  note_date: string
  is_shared: boolean
  color: string
  user_id: string
  profiles?: { display_name: string } | null
}

const COLORS = [
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#3B82F6', label: 'Bleu' },
  { value: '#10B981', label: 'Vert' },
  { value: '#F59E0B', label: 'Jaune' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#E8923C', label: 'Ambre' },
  { value: '#EC4899', label: 'Rose' },
]

function AddNoteSheet({
  householdId,
  initialDate,
  onClose,
}: {
  householdId: string
  initialDate: string
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isShared, setIsShared] = useState(false)
  const [color, setColor] = useState('#8B5CF6')
  const [date, setDate] = useState(initialDate)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('household_id', householdId)
    fd.set('content', content)
    fd.set('title', title)
    fd.set('note_date', date)
    fd.set('is_shared', String(isShared))
    fd.set('color', color)

    startTransition(async () => {
      const result = await createNote(fd)
      if (result?.error) toast.error(result.error)
      else { toast.success('Note ajoutée'); onClose() }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-background rounded-t-2xl max-h-[85dvh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-4 border-b">
          <h2 className="font-semibold">Nouvelle note</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-4 py-4 space-y-4 pb-8">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full text-sm bg-secondary rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Titre (optionnel)"
            className="w-full text-sm bg-secondary rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Écris ta note..."
            rows={5}
            required
            className="w-full text-sm bg-secondary rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          {/* Couleur */}
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className="size-7 rounded-full transition-transform hover:scale-110"
                style={{ backgroundColor: c.value, outline: color === c.value ? `3px solid ${c.value}` : 'none', outlineOffset: '2px' }}
                title={c.label}
              />
            ))}
          </div>
          {/* Partage */}
          <button
            type="button"
            onClick={() => setIsShared(!isShared)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${isShared ? 'bg-primary/10 border-primary text-primary' : 'border-input text-muted-foreground'}`}
          >
            {isShared ? <Globe className="size-4" /> : <Lock className="size-4" />}
            {isShared ? 'Partagée avec le foyer' : 'Privée'}
          </button>
          <button
            type="submit"
            disabled={isPending || !content.trim()}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-medium text-sm disabled:opacity-50 transition-opacity"
          >
            {isPending ? 'Enregistrement…' : 'Ajouter la note'}
          </button>
        </form>
      </div>
    </div>
  )
}

function NoteCard({ note, currentUserId }: { note: Note; currentUserId: string }) {
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(note.title ?? '')
  const [content, setContent] = useState(note.content)
  const [isShared, setIsShared] = useState(note.is_shared)
  const [color, setColor] = useState(note.color)
  const isOwner = note.user_id === currentUserId

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData()
    fd.set('title', title)
    fd.set('content', content)
    fd.set('is_shared', String(isShared))
    fd.set('color', color)
    fd.set('note_date', note.note_date)
    startTransition(async () => {
      const result = await updateNote(note.id, fd)
      if (result?.error) toast.error(result.error)
      else { toast.success('Note mise à jour'); setEditing(false) }
    })
  }

  function handleDelete() {
    if (!confirm('Supprimer cette note ?')) return
    startTransition(async () => {
      const result = await deleteNote(note.id)
      if (result?.error) toast.error(result.error)
    })
  }

  const borderColor = note.color ?? '#8B5CF6'

  if (editing) {
    return (
      <form onSubmit={handleSave} className="bg-card border rounded-2xl p-4 space-y-3" style={{ borderLeftColor: color, borderLeftWidth: 4 }}>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Titre (optionnel)"
          className="w-full text-sm bg-secondary rounded-lg px-3 py-2 outline-none"
        />
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          required
          className="w-full text-sm bg-secondary rounded-lg px-3 py-2 outline-none resize-none"
        />
        <div className="flex gap-2">
          {COLORS.map(c => (
            <button key={c.value} type="button" onClick={() => setColor(c.value)}
              className="size-6 rounded-full transition-transform hover:scale-110"
              style={{ backgroundColor: c.value, outline: color === c.value ? `3px solid ${c.value}` : 'none', outlineOffset: '2px' }}
            />
          ))}
        </div>
        <button type="button" onClick={() => setIsShared(!isShared)}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${isShared ? 'bg-primary/10 border-primary text-primary' : 'border-input text-muted-foreground'}`}
        >
          {isShared ? <Globe className="size-3" /> : <Lock className="size-3" />}
          {isShared ? 'Partagée' : 'Privée'}
        </button>
        <div className="flex gap-2">
          <button type="submit" disabled={isPending} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">
            <Check className="size-3.5" /> Enregistrer
          </button>
          <button type="button" onClick={() => setEditing(false)} className="px-3 py-1.5 border rounded-lg text-xs">
            Annuler
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="bg-card border rounded-2xl p-4 space-y-2" style={{ borderLeftColor: borderColor, borderLeftWidth: 4 }}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {note.title && <p className="font-semibold text-sm leading-snug">{note.title}</p>}
          <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed mt-0.5">{note.content}</p>
        </div>
        {isOwner && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setEditing(true)} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-secondary transition-colors">
              <Pencil className="size-3.5" />
            </button>
            <button onClick={handleDelete} disabled={isPending} className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors">
              <Trash2 className="size-3.5" />
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {note.is_shared ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Globe className="size-3" /> Partagée
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3" /> Privée
          </span>
        )}
        {note.profiles?.display_name && note.user_id !== currentUserId && (
          <span className="text-xs text-muted-foreground">· {note.profiles.display_name}</span>
        )}
      </div>
    </div>
  )
}

export default function NotesClient({
  initialNotes,
  householdId,
  currentUserId,
}: {
  initialNotes: Note[]
  householdId: string
  currentUserId: string
}) {
  const [notes, setNotes] = useState(initialNotes)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAdd, setShowAdd] = useState(false)

  // Jours du mois affiché (grille lun-dim)
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calStart = startOfWeek(monthStart, { locale: fr })
  const calEnd = endOfWeek(monthEnd, { locale: fr })
  const days = eachDayOfInterval({ start: calStart, end: calEnd })

  // Index des dates avec notes
  const datesWithNotes = new Set(initialNotes.map(n => n.note_date))

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
  const dayNotes = initialNotes.filter(n => n.note_date === selectedDateStr)

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-2xl font-bold">Notes</h1>
      </div>

      {/* Mini calendrier */}
      <div className="px-4 pb-3">
        <div className="bg-card border rounded-2xl p-3">
          {/* Navigation mois */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </span>
            <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
              <ChevronRight className="size-4" />
            </button>
          </div>

          {/* En-têtes jours */}
          <div className="grid grid-cols-7 mb-1">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <div key={i} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
            ))}
          </div>

          {/* Jours */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {days.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const hasNote = datesWithNotes.has(dateStr)
              const isSelected = isSameDay(day, selectedDate)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const todayDay = isToday(day)

              return (
                <button
                  key={dateStr}
                  onClick={() => { setSelectedDate(day); if (!isSameMonth(day, currentMonth)) setCurrentMonth(day) }}
                  className={`relative flex flex-col items-center py-1 rounded-lg transition-colors ${
                    isSelected ? 'bg-primary text-primary-foreground' :
                    todayDay ? 'bg-primary/10 text-primary' :
                    'hover:bg-secondary'
                  } ${!isCurrentMonth ? 'opacity-30' : ''}`}
                >
                  <span className="text-xs font-medium">{format(day, 'd')}</span>
                  {hasNote && (
                    <span className={`size-1 rounded-full mt-0.5 ${isSelected ? 'bg-primary-foreground/70' : 'bg-primary'}`} />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Jour sélectionné + notes */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-sm capitalize">
            {isToday(selectedDate) ? 'Aujourd\'hui' : format(selectedDate, 'EEEE d MMMM', { locale: fr })}
          </h2>
          <span className="text-xs text-muted-foreground">{dayNotes.length} note{dayNotes.length !== 1 ? 's' : ''}</span>
        </div>

        {dayNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <p className="text-3xl">📝</p>
            <p className="text-sm text-muted-foreground font-medium">Aucune note ce jour.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-2 text-sm text-primary hover:underline"
            >
              Ajouter une note
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {dayNotes.map(note => (
              <NoteCard key={note.id} note={note} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </div>

      {/* Bouton flottant */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-4 z-40 size-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="Nouvelle note"
      >
        <Plus className="size-6" />
      </button>

      {showAdd && (
        <AddNoteSheet
          householdId={householdId}
          initialDate={selectedDateStr}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}

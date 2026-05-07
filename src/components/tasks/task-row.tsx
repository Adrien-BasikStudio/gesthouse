'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Pencil, RotateCcw, Trash2 } from 'lucide-react'
import { completeTask, uncompleteTask, deleteTask, updateTask } from '@/lib/actions/tasks'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

type Task = {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  due_at: string | null
  completed_at: string | null
  recurrence_rule: string | null
  group_id?: string | null
  profiles?: { display_name: string } | null
  household_groups?: { name: string; color: string; emoji: string | null } | null
}

type Member = { user_id: string; display_name: string }
type Group = { id: string; name: string; emoji: string | null; color: string }

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Pas de répétition' },
  { value: 'FREQ=DAILY', label: 'Tous les jours' },
  { value: 'FREQ=WEEKLY', label: 'Toutes les semaines' },
  { value: 'FREQ=MONTHLY', label: 'Tous les mois' },
]

export default function TaskRow({
  task,
  members = [],
  groups = [],
}: {
  task: Task
  members?: Member[]
  groups?: Group[]
}) {
  const [isPending, startTransition] = useTransition()
  const [optimisticDone, setOptimisticDone] = useState(!!task.completed_at)
  const [editOpen, setEditOpen] = useState(false)
  const [assignedTo, setAssignedTo] = useState<string>(task.assigned_to ?? 'none')
  const [recurrence, setRecurrence] = useState<string>(task.recurrence_rule ?? 'none')
  const [groupId, setGroupId] = useState<string>(task.group_id ?? 'none')

  const isDone = optimisticDone

  function handleToggle() {
    setOptimisticDone(!isDone)
    startTransition(async () => {
      const result = isDone
        ? await uncompleteTask(task.id)
        : await completeTask(task.id)
      if (result?.error) {
        setOptimisticDone(isDone)
        toast.error(result.error)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTask(task.id)
      if (result?.error) toast.error(result.error)
    })
  }

  function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('assigned_to', assignedTo)
    formData.set('recurrence_rule', recurrence)
    formData.set('group_id', groupId)

    startTransition(async () => {
      const result = await updateTask(task.id, formData)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Tâche modifiée')
        setEditOpen(false)
      }
    })
  }

  const groupBadge = task.household_groups
  const dueDate = task.due_at ? new Date(task.due_at) : null

  return (
    <div className={`flex items-center gap-3 px-4 py-3 bg-card rounded-2xl border transition-opacity ${isPending ? 'opacity-50' : ''}`}>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`size-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          isDone
            ? 'bg-primary border-primary'
            : 'border-muted-foreground/30 hover:border-primary'
        }`}
      >
        {isDone && (
          <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-snug ${isDone ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          {groupBadge && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: groupBadge.color + '22', color: groupBadge.color }}
            >
              {groupBadge.emoji ? `${groupBadge.emoji} ` : ''}{groupBadge.name}
            </span>
          )}
          {task.profiles?.display_name && (
            <span className="text-xs text-muted-foreground">{task.profiles.display_name}</span>
          )}
          {task.profiles?.display_name && dueDate && (
            <span className="text-xs text-muted-foreground/40">·</span>
          )}
          {dueDate && (
            <span className={`text-xs font-medium ${
              !isDone && dueDate < new Date()
                ? 'text-destructive'
                : 'text-muted-foreground'
            }`}>
              {format(dueDate, 'd MMM', { locale: fr })}
            </span>
          )}
          {task.recurrence_rule && (
            <RotateCcw className="size-3 text-muted-foreground/60" />
          )}
        </div>
      </div>

      {members.length > 0 && (
        <Sheet open={editOpen} onOpenChange={setEditOpen}>
          <SheetTrigger
            onClick={e => e.stopPropagation()}
            className="shrink-0 p-1.5 rounded-lg text-muted-foreground/30 hover:text-foreground hover:bg-secondary transition-colors"
          >
            <Pencil className="size-4" />
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl max-h-[90dvh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Modifier la tâche</SheetTitle>
            </SheetHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4 mt-4 pb-4">
              <div className="space-y-2">
                <Label htmlFor={`edit-task-title-${task.id}`}>Tâche *</Label>
                <Input
                  id={`edit-task-title-${task.id}`}
                  name="title"
                  defaultValue={task.title}
                  required
                 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Assignée à</Label>
                  <Select value={assignedTo} onValueChange={v => { if (v !== null) setAssignedTo(v) }}>
                    <SelectTrigger>
                      <SelectValue>
                        {assignedTo && assignedTo !== 'none'
                          ? (members.find(m => m.user_id === assignedTo)?.display_name ?? 'Membre')
                          : <span className="text-muted-foreground">N&apos;importe qui</span>}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">N&apos;importe qui</SelectItem>
                      {members.map(m => (
                        <SelectItem key={m.user_id} value={m.user_id}>
                          {m.display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`edit-task-due-${task.id}`}>Date</Label>
                  <Input
                    id={`edit-task-due-${task.id}`}
                    name="due_at"
                    type="date"
                    defaultValue={task.due_at ? task.due_at.split('T')[0] : ''}
                  />
                </div>
              </div>

              {groups.length > 0 && (
                <div className="space-y-2">
                  <Label>Groupe</Label>
                  <Select value={groupId} onValueChange={v => { if (v !== null) setGroupId(v) }}>
                    <SelectTrigger>
                      <SelectValue>
                        {groupId && groupId !== 'none'
                          ? (() => {
                              const g = groups.find(g => g.id === groupId)
                              return g ? `${g.emoji ? g.emoji + ' ' : ''}${g.name}` : 'Groupe'
                            })()
                          : <span className="text-muted-foreground">Aucun groupe</span>}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucun groupe</SelectItem>
                      {groups.map(g => (
                        <SelectItem key={g.id} value={g.id}>
                          {g.emoji ? `${g.emoji} ` : ''}{g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Répétition</Label>
                <Select value={recurrence} onValueChange={v => { if (v !== null) setRecurrence(v) }}>
                  <SelectTrigger>
                    <SelectValue>
                      {recurrence && recurrence !== 'none'
                        ? (RECURRENCE_OPTIONS.find(o => o.value === recurrence)?.label ?? recurrence)
                        : <span className="text-muted-foreground">Pas de répétition</span>}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      )}

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="shrink-0 p-1.5 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}

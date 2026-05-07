'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { deleteCompletedTasks } from '@/lib/actions/tasks'
import { toast } from 'sonner'
import TaskRow from './task-row'

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

export default function TaskListRealtime({
  initialTasks,
  householdId,
  channelSuffix = 'default',
  members = [],
  groups = [],
}: {
  initialTasks: Task[]
  householdId: string
  channelSuffix?: string
  members?: Member[]
  groups?: Group[]
}) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)
  const [isPending, startTransition] = useTransition()

  function handleDeleteCompleted() {
    if (!confirm('Supprimer toutes les tâches terminées ?')) return
    startTransition(async () => {
      const result = await deleteCompletedTasks(householdId)
      if (result?.error) toast.error(result.error)
      else toast.success('Tâches terminées supprimées')
    })
  }

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`tasks-realtime-${channelSuffix}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tasks',
        filter: `household_id=eq.${householdId}`,
      }, (payload) => {
        // Mise à jour locale des champs scalaires — pas de re-render complet
        setTasks(prev => prev.map(t =>
          t.id === payload.new.id
            ? { ...t, completed_at: payload.new.completed_at, assigned_to: payload.new.assigned_to, due_at: payload.new.due_at, title: payload.new.title }
            : t
        ))
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'tasks',
        filter: `household_id=eq.${householdId}`,
      }, (payload) => {
        setTasks(prev => prev.filter(t => t.id !== payload.old.id))
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tasks',
        filter: `household_id=eq.${householdId}`,
      }, () => {
        // Nouvelle tâche (récurrence ou autre membre) — refresh pour avoir les joins
        router.refresh()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [householdId, channelSuffix, router])

  const pending = tasks.filter((t) => !t.completed_at)
  const done = tasks.filter((t) => t.completed_at)

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
        <p className="text-2xl">🐜</p>
        <p className="text-muted-foreground font-medium">La fourmilière est zen aujourd&apos;hui.</p>
        <p className="text-sm text-muted-foreground">Appuie sur + pour ajouter une tâche.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 py-2">
      {pending.map((task) => (
        <TaskRow key={task.id} task={task} members={members} groups={groups} />
      ))}

      {done.length > 0 && (
        <div className="mt-6 space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">
              Terminées ({done.length})
            </p>
            <button
              onClick={handleDeleteCompleted}
              disabled={isPending}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="size-3" />
              Tout effacer
            </button>
          </div>
          {done.map((task) => (
            <TaskRow key={task.id} task={task} members={members} groups={groups} />
          ))}
        </div>
      )}
    </div>
  )
}

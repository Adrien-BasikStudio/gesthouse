'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import TaskRow from './task-row'

type Task = {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  due_at: string | null
  completed_at: string | null
  recurrence_rule: string | null
  profiles?: { display_name: string } | null
}

export default function TaskListRealtime({
  initialTasks,
  householdId,
  channelSuffix = 'default',
}: {
  initialTasks: Task[]
  householdId: string
  channelSuffix?: string
}) {
  const router = useRouter()
  const [tasks, setTasks] = useState(initialTasks)

  useEffect(() => {
    setTasks(initialTasks)
  }, [initialTasks])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`tasks-realtime-${channelSuffix}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `household_id=eq.${householdId}`,
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [householdId, router])

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
    <div className="space-y-1">
      {pending.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}

      {done.length > 0 && (
        <div className="mt-4">
          <p className="text-xs text-muted-foreground font-medium px-3 mb-1">
            Terminées ({done.length})
          </p>
          {done.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}

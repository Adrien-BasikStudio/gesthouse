'use client'

import { useState, useTransition } from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Trash2, RotateCcw } from 'lucide-react'
import { completeTask, uncompleteTask, deleteTask } from '@/lib/actions/tasks'
import { toast } from 'sonner'

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

export default function TaskRow({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition()
  const [optimisticDone, setOptimisticDone] = useState(!!task.completed_at)

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

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl transition-opacity ${isPending ? 'opacity-60' : ''}`}>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className={`mt-0.5 size-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
          isDone
            ? 'bg-primary border-primary'
            : 'border-muted-foreground/40 hover:border-primary'
        }`}
      >
        {isDone && (
          <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium leading-tight ${isDone ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.profiles?.display_name && (
            <span className="text-xs text-muted-foreground">{task.profiles.display_name}</span>
          )}
          {task.due_at && (
            <span className={`text-xs ${
              !isDone && new Date(task.due_at) < new Date()
                ? 'text-destructive font-medium'
                : 'text-muted-foreground'
            }`}>
              {format(new Date(task.due_at), 'd MMM', { locale: fr })}
            </span>
          )}
          {task.recurrence_rule && (
            <RotateCcw className="size-3 text-muted-foreground" />
          )}
        </div>
      </div>

      <button
        onClick={handleDelete}
        disabled={isPending}
        className="shrink-0 p-1 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { CalendarCheck } from 'lucide-react'

type Member = { user_id: string; display_name: string }
type Group = { id: string; name: string; emoji: string | null; color: string }

export default function FilterChips({
  members,
  groups,
  showTasksToggle = false,
}: {
  members: Member[]
  groups: Group[]
  showTasksToggle?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeMembers = (searchParams.get('members') ?? '').split(',').filter(Boolean)
  const activeGroups = (searchParams.get('groups') ?? '').split(',').filter(Boolean)
  const showTasks = searchParams.get('tasks') === '1'

  function buildUrl(newMembers: string[], newGroups: string[], newShowTasks: boolean) {
    const params = new URLSearchParams(searchParams.toString())
    if (newMembers.length > 0) params.set('members', newMembers.join(','))
    else params.delete('members')
    if (newGroups.length > 0) params.set('groups', newGroups.join(','))
    else params.delete('groups')
    if (newShowTasks) params.set('tasks', '1')
    else params.delete('tasks')
    return `${pathname}?${params.toString()}`
  }

  function toggleMember(uid: string) {
    const next = activeMembers.includes(uid)
      ? activeMembers.filter(id => id !== uid)
      : [...activeMembers, uid]
    router.push(buildUrl(next, activeGroups, showTasks))
  }

  function toggleGroup(gid: string) {
    const next = activeGroups.includes(gid)
      ? activeGroups.filter(id => id !== gid)
      : [...activeGroups, gid]
    router.push(buildUrl(activeMembers, next, showTasks))
  }

  function toggleTasks() {
    router.push(buildUrl(activeMembers, activeGroups, !showTasks))
  }

  const hasFilters = activeMembers.length > 0 || activeGroups.length > 0

  if (members.length === 0 && groups.length === 0 && !showTasksToggle) return null

  return (
    <div className="space-y-1.5">
      {(members.length > 0 || groups.length > 0) && (
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
          {hasFilters && (
            <button
              onClick={() => router.push(buildUrl([], [], showTasks))}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground hover:bg-secondary/80 whitespace-nowrap shrink-0 transition-colors"
            >
              ✕ Tout
            </button>
          )}

          {members.map(m => {
            const active = activeMembers.includes(m.user_id)
            return (
              <button
                key={m.user_id}
                onClick={() => toggleMember(m.user_id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {m.display_name}
              </button>
            )
          })}

          {groups.map(g => {
            const active = activeGroups.includes(g.id)
            return (
              <button
                key={g.id}
                onClick={() => toggleGroup(g.id)}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors"
                style={active
                  ? { background: g.color, color: '#fff' }
                  : { background: `${g.color}20`, color: g.color }
                }
              >
                {g.emoji ? `${g.emoji} ` : ''}{g.name}
              </button>
            )
          })}
        </div>
      )}

      {showTasksToggle && (
        <button
          onClick={toggleTasks}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            showTasks
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
          }`}
        >
          <CalendarCheck className="size-3" />
          Tâches
        </button>
      )}
    </div>
  )
}

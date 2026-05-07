'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { createGroup, updateGroup, deleteGroup } from '@/lib/actions/groups'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type Group = {
  id: string
  name: string
  emoji: string | null
  color: string
  member_ids: string[]
}

type Member = { user_id: string; display_name: string }

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6']

export default function GroupsManager({
  householdId,
  initialGroups,
  members,
}: {
  householdId: string
  initialGroups: Group[]
  members: Member[]
}) {
  const [groups, setGroups] = useState(initialGroups)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [isPending, startTransition] = useTransition()

  // New group form state
  const [newName, setNewName] = useState('')
  const [newEmoji, setNewEmoji] = useState('')
  const [newColor, setNewColor] = useState(COLORS[0])
  const [newMembers, setNewMembers] = useState<string[]>([])

  // Edit form state
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editMembers, setEditMembers] = useState<string[]>([])

  function startEdit(group: Group) {
    setEditingId(group.id)
    setEditName(group.name)
    setEditEmoji(group.emoji ?? '')
    setEditColor(group.color)
    setEditMembers(group.member_ids)
  }

  function toggleMember(uid: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(uid) ? list.filter(id => id !== uid) : [...list, uid])
  }

  function handleCreate() {
    if (!newName.trim()) return
    const fd = new FormData()
    fd.set('household_id', householdId)
    fd.set('name', newName)
    fd.set('emoji', newEmoji)
    fd.set('color', newColor)
    newMembers.forEach(uid => fd.append('member_ids', uid))

    startTransition(async () => {
      const result = await createGroup(fd)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Groupe créé')
        setShowNew(false)
        setNewName('')
        setNewEmoji('')
        setNewColor(COLORS[0])
        setNewMembers([])
        // Optimistic update
        setGroups(prev => [...prev, {
          id: Math.random().toString(),
          name: newName,
          emoji: newEmoji || null,
          color: newColor,
          member_ids: newMembers,
        }])
      }
    })
  }

  function handleUpdate(groupId: string) {
    if (!editName.trim()) return
    const fd = new FormData()
    fd.set('name', editName)
    fd.set('emoji', editEmoji)
    fd.set('color', editColor)
    editMembers.forEach(uid => fd.append('member_ids', uid))

    startTransition(async () => {
      const result = await updateGroup(groupId, fd)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Groupe mis à jour')
        setEditingId(null)
        setGroups(prev => prev.map(g => g.id === groupId ? {
          ...g, name: editName, emoji: editEmoji || null, color: editColor, member_ids: editMembers,
        } : g))
      }
    })
  }

  function handleDelete(groupId: string) {
    if (!confirm('Supprimer ce groupe ?')) return
    startTransition(async () => {
      await deleteGroup(groupId)
      setGroups(prev => prev.filter(g => g.id !== groupId))
      toast.success('Groupe supprimé')
    })
  }

  return (
    <div className="space-y-2">
      {groups.map(group => (
        <div key={group.id} className="bg-card border rounded-2xl overflow-hidden">
          {editingId === group.id ? (
            <div className="p-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  value={editEmoji}
                  onChange={e => setEditEmoji(e.target.value)}
                  placeholder="😀"
                  className="w-16 text-center shrink-0"
                  maxLength={2}
                />
                <Input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="Nom du groupe"
                  className="flex-1"
                 
                />
              </div>

              <div className="flex gap-1.5 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditColor(c)}
                    className={`size-6 rounded-full transition-transform ${editColor === c ? 'scale-125 ring-2 ring-offset-1 ring-foreground/30' : ''}`}
                    style={{ background: c }}
                  />
                ))}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Membres</p>
                <div className="flex gap-1.5 flex-wrap">
                  {members.map(m => (
                    <button
                      key={m.user_id}
                      type="button"
                      onClick={() => toggleMember(m.user_id, editMembers, setEditMembers)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        editMembers.includes(m.user_id)
                          ? 'text-white'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                      style={editMembers.includes(m.user_id) ? { background: editColor } : {}}
                    >
                      {m.display_name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleUpdate(group.id)} disabled={isPending} className="flex-1">
                  <Check className="size-3.5 mr-1" /> Sauver
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3">
              <div
                className="size-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{ background: group.color }}
              >
                {group.emoji ?? group.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{group.name}</p>
                {group.member_ids.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {group.member_ids
                      .map(uid => members.find(m => m.user_id === uid)?.display_name)
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                )}
              </div>
              <button onClick={() => startEdit(group)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="size-3.5" />
              </button>
              <button onClick={() => handleDelete(group.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      ))}

      {showNew ? (
        <div className="bg-card border rounded-2xl p-3 space-y-3">
          <div className="flex gap-2">
            <Input
              value={newEmoji}
              onChange={e => setNewEmoji(e.target.value)}
              placeholder="😀"
              className="w-16 text-center shrink-0"
              maxLength={2}
            />
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nom du groupe (ex: Famille, Enfants…)"
              className="flex-1"
             
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={`size-6 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-offset-1 ring-foreground/30' : ''}`}
                style={{ background: c }}
              />
            ))}
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Membres</p>
            <div className="flex gap-1.5 flex-wrap">
              {members.map(m => (
                <button
                  key={m.user_id}
                  type="button"
                  onClick={() => toggleMember(m.user_id, newMembers, setNewMembers)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    newMembers.includes(m.user_id)
                      ? 'text-white'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                  style={newMembers.includes(m.user_id) ? { background: newColor } : {}}
                >
                  {m.display_name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={isPending || !newName.trim()} className="flex-1">
              <Check className="size-3.5 mr-1" /> Créer
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowNew(false)}>
              <X className="size-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 w-full px-4 py-2.5 bg-secondary/50 border border-dashed rounded-2xl text-sm text-muted-foreground hover:bg-secondary transition-colors"
        >
          <Plus className="size-4" /> Nouveau groupe
        </button>
      )}
    </div>
  )
}

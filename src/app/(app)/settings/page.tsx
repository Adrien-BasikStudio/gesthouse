import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getActiveHouseholdId } from '@/lib/active-household'
import MembersList from '@/components/settings/members-list'
import InviteButton from '@/components/settings/invite-button'
import LogoutButton from '@/components/settings/logout-button'
import HouseholdSwitcher from '@/components/settings/household-switcher'
import GroupsManager from '@/components/settings/groups-manager'
import ProfileEditor from '@/components/settings/profile-editor'
import ChangePassword from '@/components/settings/change-password'
import HouseholdEditor from '@/components/settings/household-editor'
import DangerZone from '@/components/settings/danger-zone'
import { Badge } from '@/components/ui/badge'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: allMemberships } = await supabase
    .from('household_members')
    .select('household_id, role, households(name, emoji, plan)')
    .eq('user_id', user.id)

  if (!allMemberships || allMemberships.length === 0) redirect('/onboarding')

  const activeId = await getActiveHouseholdId(allMemberships)
  const membership = allMemberships.find(m => m.household_id === activeId) ?? allMemberships[0]

  const householdId = membership.household_id
  const household = membership.households as unknown as { name: string; emoji: string; plan: string }
  const isAdmin = membership.role === 'admin'

  const admin = createAdminClient()
  const { data: members } = await admin
    .from('household_members')
    .select('user_id, role, joined_at, profiles(display_name, avatar_url)')
    .eq('household_id', householdId)
    .order('joined_at')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const { data: groups } = await admin
    .from('household_groups')
    .select('id, name, emoji, color, group_members(user_id)')
    .eq('household_id', householdId)
    .order('created_at', { ascending: true })

  return (
    <div className="p-4 space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold">Paramètres</h1>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Mon profil</h2>
        <ProfileEditor displayName={profile?.display_name ?? ''} email={user.email ?? ''} />
        <ChangePassword />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Ma fourmilière
        </h2>
        <div className="bg-card rounded-2xl border p-4 space-y-3">
          {isAdmin ? (
            <HouseholdEditor
              householdId={householdId}
              initialName={household.name}
              initialEmoji={household.emoji}
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-2xl">{household.emoji}</span>
              <span className="font-semibold text-lg">{household.name}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge variant={household.plan === 'family' ? 'default' : 'secondary'}>
              {household.plan === 'family' ? 'Famille' : 'Gratuit'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {members?.length ?? 0} membre{(members?.length ?? 0) > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Switcher si plusieurs foyers ou option rejoindre */}
        <HouseholdSwitcher
          households={allMemberships.map(m => ({
            household_id: m.household_id,
            name: (m.households as unknown as { name: string; emoji: string }).name,
            emoji: (m.households as unknown as { name: string; emoji: string }).emoji,
          }))}
          activeId={activeId ?? membership.household_id}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Membres
          </h2>
          {isAdmin && <InviteButton householdId={householdId} />}
        </div>
        <MembersList
          members={(members ?? []) as unknown as {
            user_id: string
            role: string
            profiles: { display_name: string; avatar_url: string | null } | null
          }[]}
          currentUserId={user.id}
          householdId={householdId}
          isAdmin={isAdmin}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Groupes
        </h2>
        <GroupsManager
          householdId={householdId}
          initialGroups={(groups ?? []).map(g => ({
            id: g.id,
            name: g.name,
            emoji: g.emoji,
            color: g.color,
            member_ids: (g.group_members as unknown as { user_id: string }[]).map(gm => gm.user_id),
          }))}
          members={(members ?? []).map(m => ({
            user_id: m.user_id,
            display_name: (m.profiles as unknown as { display_name: string } | null)?.display_name ?? 'Membre',
          }))}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide text-destructive">
          Zone danger
        </h2>
        <DangerZone
          householdId={householdId}
          householdName={household.name}
          isAdmin={isAdmin}
          memberCount={members?.length ?? 1}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          Compte
        </h2>
        <div className="bg-card rounded-2xl border">
          <LogoutButton />
        </div>
      </section>
    </div>
  )
}

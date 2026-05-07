'use server'

import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Crée un compte utilisateur sans envoyer d'email de confirmation.
 * Utilisé uniquement pour le flux d'inscription via invitation — le lien
 * d'invite sert de vérification, l'email de confirmation est superflu.
 */
export async function signUpViaInvite(formData: FormData) {
  const token = String(formData.get('invite_token') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const name = String(formData.get('name') ?? '').trim() || email.split('@')[0]

  if (!token || !email || !password) return { error: 'Données manquantes' }
  if (password.length < 8) return { error: 'Mot de passe trop court' }

  const admin = createAdminClient()

  // Vérifier que le token d'invite est encore valide
  const { data: invite } = await admin
    .from('household_invitations')
    .select('id')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) return { error: 'Invitation invalide ou expirée' }

  // Créer le compte directement confirmé — pas d'email envoyé
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already registered') ||
        error.message.toLowerCase().includes('already been registered')) {
      return { error: 'Cet email est déjà utilisé. Connecte-toi à la place.' }
    }
    return { error: error.message }
  }

  return { success: true }
}

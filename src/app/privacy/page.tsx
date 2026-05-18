import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Politique de confidentialité — Les Fourmis',
  description: 'Comment Les Fourmis collecte, utilise et protège vos données personnelles.',
}

const LAST_UPDATED = '7 mai 2026'
const CONTACT_EMAIL = 'hello@lesfourmis.ch'
const APP_URL = 'https://www.lesfourmis.app'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10 pb-20">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ChevronLeft className="size-4" /> Retour
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🐜</span>
            <h1 className="text-2xl font-bold">Les Fourmis</h1>
          </div>
          <h2 className="text-xl font-semibold text-foreground/80">Politique de confidentialité</h2>
          <p className="text-sm text-muted-foreground mt-1">Dernière mise à jour : {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8 text-sm leading-relaxed text-foreground/90">

          {/* Intro */}
          <Section>
            <p>
              Les Fourmis (<strong>{APP_URL}</strong>) est une application de gestion de foyer qui vous permet de gérer vos tâches, courses, repas, dépenses partagées et notes en famille ou en colocation. Cette politique explique quelles données nous collectons, pourquoi, et comment nous les protégeons.
            </p>
            <p>
              En utilisant Les Fourmis, vous acceptez les pratiques décrites dans ce document. Si vous avez des questions, contactez-nous à <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          {/* 1. Responsable */}
          <Section title="1. Responsable du traitement">
            <p>
              Le responsable du traitement des données est :
            </p>
            <div className="bg-muted/50 rounded-xl px-4 py-3 text-sm space-y-0.5">
              <p><strong>Les Fourmis</strong></p>
              <p>Suisse</p>
              <p>Contact : <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a></p>
            </div>
          </Section>

          {/* 2. Données collectées */}
          <Section title="2. Données que nous collectons">
            <p>Nous collectons uniquement les données nécessaires au fonctionnement de l&apos;application :</p>

            <SubSection title="Données de compte">
              <ul>
                <li><strong>Adresse e-mail</strong> — utilisée pour la connexion et les notifications importantes</li>
                <li><strong>Nom d&apos;affichage</strong> — visible par les membres de votre foyer</li>
                <li><strong>Mot de passe</strong> — stocké sous forme hachée, jamais en clair</li>
              </ul>
            </SubSection>

            <SubSection title="Données de foyer">
              <ul>
                <li>Tâches, listes de courses, articles en stock, recettes et menus</li>
                <li>Événements du calendrier et notes personnelles ou partagées</li>
                <li>Dépenses et répartitions financières entre membres</li>
                <li>Appartenance au foyer et rôles (admin / membre)</li>
              </ul>
            </SubSection>

            <SubSection title="Données techniques">
              <ul>
                <li><strong>Tokens de notification push</strong> — pour vous envoyer des rappels sur votre appareil (si vous les activez)</li>
                <li><strong>Logs serveur</strong> — adresse IP et horodatage des requêtes, conservés 30 jours maximum</li>
                <li><strong>Cookies de session</strong> — nécessaires à la connexion, avec attributs <code>httpOnly</code>, <code>secure</code> et <code>SameSite</code></li>
              </ul>
            </SubSection>

            <p className="text-muted-foreground italic">
              Nous ne collectons pas de données de géolocalisation, ni d&apos;identifiants publicitaires, ni d&apos;informations de paiement (aucun paiement en ligne à ce jour).
            </p>
          </Section>

          {/* 3. Finalités */}
          <Section title="3. Pourquoi nous traitons vos données">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold">Finalité</th>
                  <th className="text-left py-2 font-semibold">Base légale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr>
                  <td className="py-2 pr-4">Création de compte et authentification</td>
                  <td className="py-2 text-muted-foreground">Exécution du contrat</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Fonctionnement des modules (tâches, courses, etc.)</td>
                  <td className="py-2 text-muted-foreground">Exécution du contrat</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Notifications push (rappels, tâches assignées)</td>
                  <td className="py-2 text-muted-foreground">Consentement</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Sécurité et prévention de la fraude</td>
                  <td className="py-2 text-muted-foreground">Intérêt légitime</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Amélioration de l&apos;application</td>
                  <td className="py-2 text-muted-foreground">Intérêt légitime</td>
                </tr>
              </tbody>
            </table>
          </Section>

          {/* 4. Partage */}
          <Section title="4. Partage des données">
            <p>
              Nous ne vendons pas vos données. Nous ne les partageons pas à des fins publicitaires. Vos données peuvent être transmises aux prestataires techniques suivants, dans le strict cadre du service :
            </p>
            <div className="space-y-3">
              <Provider
                name="Supabase"
                role="Base de données, authentification, stockage"
                location="Union européenne (AWS eu-west-3, Paris)"
                url="https://supabase.com/privacy"
              />
              <Provider
                name="Vercel"
                role="Hébergement et déploiement de l&apos;application"
                location="Union européenne"
                url="https://vercel.com/legal/privacy-policy"
              />
              <Provider
                name="Infomaniak"
                role="Envoi d&apos;e-mails transactionnels"
                location="Suisse"
                url="https://www.infomaniak.com/fr/cgv/politique-de-confidentialite"
              />
            </div>
            <p className="mt-3">
              Ces prestataires agissent en tant que sous-traitants et sont liés contractuellement à des obligations de confidentialité. Ils ne peuvent pas utiliser vos données à d&apos;autres fins.
            </p>
          </Section>

          {/* 5. Durée */}
          <Section title="5. Durée de conservation">
            <ul>
              <li><strong>Données de compte et de foyer</strong> — conservées tant que votre compte est actif</li>
              <li><strong>Données supprimées</strong> — effacées définitivement dans les 30 jours suivant la suppression</li>
              <li><strong>Tokens push</strong> — supprimés automatiquement en cas de déconnexion ou de révocation</li>
              <li><strong>Logs techniques</strong> — conservés 30 jours maximum, puis supprimés automatiquement</li>
            </ul>
            <p>
              En cas de suppression de votre compte, toutes vos données personnelles sont effacées. Les données partagées avec votre foyer (dépenses, tâches communes) restent accessibles aux autres membres jusqu&apos;à leur propre suppression.
            </p>
          </Section>

          {/* 6. Sécurité */}
          <Section title="6. Sécurité des données">
            <p>Nous mettons en place les mesures techniques suivantes pour protéger vos données :</p>
            <ul>
              <li>Connexions chiffrées via HTTPS (TLS) sur l&apos;ensemble du site</li>
              <li>Mots de passe hachés avec bcrypt — jamais stockés en clair</li>
              <li>Politiques de sécurité au niveau des lignes (RLS) sur toutes les tables de la base de données</li>
              <li>Clés d&apos;API serveur jamais exposées côté client</li>
              <li>En-têtes de sécurité HTTP (HSTS, X-Frame-Options, CSP, etc.)</li>
              <li>Sessions authentifiées avec cookies <code>httpOnly</code> et <code>Secure</code></li>
            </ul>
          </Section>

          {/* 7. Droits */}
          <Section title="7. Vos droits">
            <p>Conformément au RGPD (UE 2016/679) et à la LPD suisse, vous disposez des droits suivants :</p>
            <ul>
              <li><strong>Accès</strong> — obtenir une copie de vos données personnelles</li>
              <li><strong>Rectification</strong> — corriger des données inexactes</li>
              <li><strong>Effacement</strong> — demander la suppression de vos données</li>
              <li><strong>Portabilité</strong> — recevoir vos données dans un format structuré</li>
              <li><strong>Opposition</strong> — vous opposer à certains traitements fondés sur l&apos;intérêt légitime</li>
              <li><strong>Retrait du consentement</strong> — désactiver les notifications push à tout moment dans les paramètres</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous à <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>. Nous répondrons dans un délai de 30 jours.
            </p>
            <p>
              Si vous estimez que le traitement de vos données n&apos;est pas conforme, vous pouvez déposer une réclamation auprès du <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Préposé fédéral à la protection des données (PFPDT)</a> en Suisse, ou auprès de l&apos;autorité de protection des données de votre pays de résidence dans l&apos;UE.
            </p>
          </Section>

          {/* 8. Cookies */}
          <Section title="8. Cookies">
            <p>Les Fourmis utilise uniquement des cookies strictement nécessaires au fonctionnement :</p>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 font-semibold">Cookie</th>
                  <th className="text-left py-2 pr-4 font-semibold">Rôle</th>
                  <th className="text-left py-2 font-semibold">Durée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">sb-*</td>
                  <td className="py-2 pr-4">Session Supabase (authentification)</td>
                  <td className="py-2 text-muted-foreground">Session / 1 an</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4 font-mono text-xs">fourmis_household</td>
                  <td className="py-2 pr-4">Foyer actif sélectionné</td>
                  <td className="py-2 text-muted-foreground">1 an</td>
                </tr>
              </tbody>
            </table>
            <p className="text-muted-foreground italic">
              Aucun cookie publicitaire ou de tracking tiers n&apos;est déposé.
            </p>
          </Section>

          {/* 9. Mineurs */}
          <Section title="9. Mineurs">
            <p>
              Les Fourmis n&apos;est pas destiné aux enfants de moins de 13 ans. Si vous êtes parent et pensez que votre enfant a créé un compte, contactez-nous à <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a> pour procéder à la suppression.
            </p>
          </Section>

          {/* 10. Modifications */}
          <Section title="10. Modifications de cette politique">
            <p>
              En cas de modification substantielle, nous vous préviendrons par e-mail au moins 14 jours avant l&apos;entrée en vigueur des nouvelles dispositions. La date de dernière mise à jour est indiquée en haut de cette page.
            </p>
          </Section>

          {/* Contact */}
          <div className="bg-muted/50 rounded-2xl px-5 py-4 mt-8">
            <p className="font-semibold mb-1">Une question ?</p>
            <p className="text-muted-foreground text-sm">
              Écrivez-nous à{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a>.
              Nous nous engageons à répondre dans un délai de 30 jours ouvrés.
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
      {children}
    </section>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-medium text-foreground/80">{title}</h3>
      {children}
    </div>
  )
}

function Provider({ name, role, location, url }: { name: string; role: string; location: string; url: string }) {
  return (
    <div className="flex items-start gap-3 bg-muted/30 rounded-xl px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
        <p className="text-xs text-muted-foreground">Localisation : {location}</p>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-primary hover:underline shrink-0 mt-0.5"
      >
        Politique
      </a>
    </div>
  )
}

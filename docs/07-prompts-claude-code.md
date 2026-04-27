# 07 — Prompts prêts à l'emploi pour Claude Code

> Copie-colle ces prompts dans Claude Code dans l'ordre. Vérifie le résultat à chaque étape, corrige, puis avance. **Ne lance pas tout d'un coup.**

## ⚙️ Setup initial (à faire une fois)

```bash
# Dans un dossier vide :
git init
# Place tous les fichiers /docs/ et CLAUDE.md à la racine
# Puis lance Claude Code dans ce dossier
claude
```

Premier message à Claude Code :
> Lis CLAUDE.md puis tous les fichiers de /docs en entier. Confirme que tu as compris le projet, et résume-moi en 5 points la phase actuelle (Phase 1 — Fondations) avant de commencer.

---

## 🧱 Prompt 1 — Setup du repo

```
Initialise le projet selon docs/02-architecture.md :
- pnpm + Next.js 15 (App Router, TypeScript strict, Tailwind)
- shadcn/ui configuré
- next-intl avec locale FR par défaut
- next-pwa configuré (manifest + service worker basique)
- Structure de dossiers comme indiqué dans CLAUDE.md
- ESLint + Prettier
- .env.example avec toutes les variables nécessaires (Supabase, Stripe, Anthropic, Resend)
- README.md avec les commandes de dev

Avant de commencer, liste-moi tout ce que tu vas créer/installer et attends ma validation.
```

---

## 🗄️ Prompt 2 — Setup Supabase

```
Configure Supabase pour le projet :
1. Crée le dossier supabase/ avec config.toml
2. Crée la première migration `supabase/migrations/00000000000000_initial_schema.sql` qui contient TOUTES les tables et RLS de docs/03-database-schema.md (sauf la vue expense_balances → migration séparée)
3. Crée `supabase/migrations/00000000000001_expense_balances_view.sql` pour la vue
4. Crée `supabase/seed.sql` qui insère un foyer démo avec 3 tâches, 1 menu, 5 items courses
5. Crée le client Supabase typé dans `apps/web/lib/supabase/`:
   - `server.ts` (createServerClient pour Server Components)
   - `client.ts` (createBrowserClient)
   - `middleware.ts` (middleware Next.js pour rafraîchir la session)
6. Génère les types TypeScript depuis le schéma : ajoute le script `pnpm types:gen` dans package.json

Vérifie bien que TOUTES les tables ont RLS activée. Aucune exception.
```

---

## 🔐 Prompt 3 — Auth & Onboarding

```
Implémente l'auth + onboarding :

1. Pages :
   - /login (magic link + Google)
   - /signup (idem)
   - /onboarding (création foyer + invitations)
   - /(app) — layout protégé avec redirect si non authentifié

2. Server Actions dans apps/web/lib/actions/auth.ts :
   - signInWithMagicLink(email)
   - signOut()
   - createHousehold({name, emoji}) → seed le foyer démo
   - inviteMember({householdId, email, role})

3. Middleware Next.js qui rafraîchit la session sur chaque request

4. À la création du compte, créer automatiquement un profil + un foyer "Mon foyer" pré-rempli avec données démo (utilise les seed data)

5. Validation Zod sur tous les inputs

6. UI shadcn/ui : Card, Form, Input, Button. Mobile-first.

Avant de coder, liste les composants et fichiers que tu vas créer. Attends validation.
```

---

## ✅ Prompt 4 — Module Tâches

```
Implémente le module Tâches selon docs/04-features-detail.md section "Module Tâches".

1. Page /(app)/tasks avec onglets : Aujourd'hui / Semaine / Par membre / Historique
2. Server Actions : createTask, completeTask, uncompleteTask, deleteTask, updateTask
3. Composant TaskRow réutilisable (checkbox + titre + assigné + due date)
4. Modal de création de tâche (mobile : bottom sheet, desktop : dialog) avec champs :
   - Titre (avec parsing IA optionnel — bouton ✨)
   - Description
   - Assigné à (sélecteur membres du foyer)
   - Date d'échéance (date picker)
   - Récurrence (preset rapide + custom RRULE)
   - Rotation (toggle + sélection membres)
5. Logique de complétion :
   - Si tâche récurrente → générer la prochaine occurrence
   - Si rotation → assigner au membre suivant
6. Realtime Supabase pour la liste de tâches du jour

Pour le parsing IA, utilise Claude Haiku via Server Action — voir docs/05-ai-integration.md.

Tests Vitest à écrire pour : génération prochaine occurrence (RRULE) + rotation index.
```

---

## 📅 Prompt 5 — Module Calendrier

```
Implémente le module Calendrier (vue semaine prioritaire mobile).

1. Page /(app)/calendar avec sélecteur vue (jour / semaine / mois)
2. Composant SemaineView : grille 7 colonnes avec événements positionnés par heure
3. Server Actions : createEvent, updateEvent, deleteEvent
4. Modal création événement (bottom sheet mobile) : titre, description, début/fin, all-day, lieu, participants (chips), récurrence
5. Code couleur par participant principal
6. Intégrer les tâches qui ont une due_at dans la vue calendrier (en lecture seule, distinction visuelle)
7. Détection de conflits : si overlap d'événements pour un même participant, badge ⚠️

Utilise date-fns avec locale fr.
```

---

## 🛒 Prompt 6 — Liste de courses (temps réel)

```
Implémente le module Liste de courses.

1. Page /(app)/shopping
2. Multi-listes : sélecteur de liste en haut + bouton "+ Nouvelle liste"
3. Input rapide en haut : "Ajouter un article..." → enter ajoute + catégorise via IA (Haiku) en background
4. Items groupés par catégorie (auto-tri)
5. Tap sur item = check/uncheck (optimistic update + Supabase realtime)
6. Bouton "Cacher les cochés" / "Réinitialiser la liste"
7. Long press sur item = édition (quantité, unité, catégorie)
8. Server Action `categorizeShoppingItem(name)` qui appelle Haiku, retourne {category, confidence}, et logge dans ai_usage
9. Pendant la catégorisation : afficher l'item avec catégorie "Autres" puis le déplacer une fois la réponse arrivée

L'expérience temps réel est CRITIQUE : si Marc coche le lait pendant que Sarah est au magasin, ça doit s'afficher chez Sarah en moins d'1 seconde.
```

---

## 🍳 Prompt 7 — Recettes & Menu

```
Implémente le module Recettes & Menu de la semaine.

1. Page /(app)/recipes : grille de cartes recettes (image, titre, durée, tags, ★ favori)
2. Page /(app)/recipes/[id] : détail (ingrédients, étapes, photo) — voir Prompt 7bis pour la partie matching stock
3. Page /(app)/recipes/new : création manuelle OU import depuis URL
4. Server Action importRecipeFromUrl(url) :
   - fetch HTML
   - envoie à Claude Haiku avec prompt JSON-structured pour extraire titre, ingrédients (name/qty/unit), instructions, image
   - valide avec Zod, insère en DB
5. Page /(app)/meals : planning de la semaine, drag & drop d'une recette sur un slot
6. Bouton "✨ Génère un menu de la semaine" qui appelle Sonnet avec : stock + favoris + préférences foyer + jours non remplis. Output JSON validé Zod.
7. Bouton "Ajouter ingrédients manquants à la liste de courses" sur un repas planifié — diff stock vs ingrédients → ajoute à la liste active (cf. Prompt 7bis pour la logique de matching).

Toujours montrer le coût IA estimé en mode dev (console.log) pour calibrer.
```

---

## 🧠 Prompt 7bis — Recette × Stock (Le frigo intelligent) ⭐

C'est la feature signature. À soigner particulièrement.

```
Implémente la feature "Recette × Stock" décrite dans docs/04-features-detail.md section "Recette × Stock — Le frigo intelligent".

## 1. Migration SQL

Crée la migration `supabase/migrations/{timestamp}_recipe_stock_matching.sql` qui :
- Active les extensions pg_trgm et unaccent
- Crée l'index GIN trigram sur stock_items.name (lowercased + unaccented)
- Crée la table ingredient_stock_matches avec son index
- Active RLS sur ingredient_stock_matches avec policy is_household_member

(Le SQL exact est dans docs/03-database-schema.md section "Recette × Stock — cache de matching")

## 2. Module units (apps/web/lib/units.ts)

Crée un module qui exporte :
- type Unit ('g'|'kg'|'mg'|'ml'|'cl'|'l'|'piece'|'tbsp'|'tsp'|...)
- normalizeUnit(unit: string): Unit | null  — comprend "grammes", "g", "gr"...
- canConvert(from: Unit, to: Unit): boolean
- convert(quantity: number, from: Unit, to: Unit): number | null
- isEnoughStock(needed: {qty,unit}, available: {qty,unit|null}): 'enough' | 'partial' | 'missing' | 'unknown'

Conversions à supporter au minimum :
- masse : g↔kg↔mg
- volume : ml↔cl↔dl↔l
- càs ≈ 15ml ≈ 15g (approximation, marquer comme "approx")
- càc ≈ 5ml ≈ 5g
- pièce/douzaine

Si conversion impossible → retourner null, ne pas planter. Tests Vitest obligatoires.

## 3. Module matching (apps/web/lib/recipes/match-ingredients.ts)

Fonction principale :

```ts
export type IngredientMatch = {
  ingredient: RecipeIngredient
  stockItem: StockItem | null
  matchType: 'exact' | 'fuzzy' | 'ai' | 'none'
  confidence: number // 0..1
  status: 'enough' | 'partial' | 'missing' | 'unknown'
  missingQuantity?: number
  missingUnit?: string
}

export async function matchRecipeWithStock(
  recipeId: string,
  householdId: string,
  options?: { forceRefresh?: boolean }
): Promise<IngredientMatch[]>
```

Algorithme :
1. Charger les recipe_ingredients du recipeId
2. Charger les stock_items du householdId (mise en cache 60s côté Server Component)
3. Pour chaque ingredient :
   a. Si forceRefresh=false : check ingredient_stock_matches pour cache <30j
   b. Sinon ou cache miss :
      - exact match (lowercase+unaccent égalité)
      - fuzzy match Postgres : query SQL avec similarity > 0.4, ORDER BY similarity DESC
      - si rien trouvé : appeler IA via aiSemanticMatch() (Haiku)
      - INSERT/UPSERT dans ingredient_stock_matches
   c. Comparer quantités via lib/units.ts → status
4. Retourner array IngredientMatch

⚠️ Les insertions en cache se font en parallèle après le retour à l'utilisateur (ne pas bloquer le rendu).

## 4. Server Action IA fallback (apps/web/lib/ai/match-ingredient-stock.ts)

```ts
export async function aiSemanticMatch(
  ingredientName: string,
  stockItemNames: string[]
): Promise<{ matchedName: string | null, confidence: number }>
```

- Modèle : claude-haiku-4-5
- Prompt : "Parmi cette liste d'items en stock, lequel correspond à l'ingrédient demandé ? Retourne JSON {match: string|null, confidence: 0..1}. Sois strict : 'oignon' ne matche PAS 'échalote'."
- Validation Zod sur la sortie
- Log dans ai_usage avec feature='ingredient_stock_match'
- Coût estimé : ~150-300 tokens

## 5. UI — page /(app)/recipes/[id]

En haut de la page (sous le titre/photo), afficher la "Coverage Card" :

```tsx
<CoverageCard matches={matches}>
  - Si plan free : afficher "🐜 Connecte ton stock pour voir ce qu'il te manque" + CTA upgrade
  - Si premium :
      - Compteur "X/Y ingrédients en stock"
      - Liste des manquants (≤3 affichés, "+N autres")
      - Bouton "+ Ajouter manquants à ma liste"
      - Barre de progression (couleur selon couverture)
</CoverageCard>
```

Liste des ingrédients : chaque ligne montre :
- ✅ vert si status='enough'
- 🟨 ambre si 'partial' (avec qty manquante)
- ⚠️ rouge si 'missing'
- ❓ gris si 'unknown'
- À droite : "X g en stock" si trouvé

Bouton bas de page : "👨‍🍳 J'ai cuisiné — déduire le stock" (Premium only).

## 6. Server Actions

- addMissingToShoppingList(recipeId, householdId) → ajoute en bulk les missing+partial à la liste active. Catégorise via Haiku en background. Retourne { added: number }.
- markRecipeCooked(recipeId, householdId, servings) → décrémente les stock_items correspondants au prorata des servings. Si quantité tombe sous low_stock_threshold → ajoute auto à la liste de courses (avec toast).

## 7. Filtre "Recettes possibles maintenant" (page bibliothèque)

Sur /(app)/recipes :
- Sélecteur en haut : Toutes / Possibles maintenant / Presque possibles / Anti-gaspi
- "Possibles maintenant" : filtre sur recipes ayant coverage = 100% (calculé via job nightly OU à la demande, ne pas faire à chaque chargement de page)
- Premium uniquement, gate avec PaywallGate

## 8. Tests Vitest

Tests obligatoires :
- units.ts : conversions valides, conversions impossibles, edge cases (0, négatif)
- match-ingredients.ts : avec mocks pour DB et IA
- isEnoughStock : tous les cas (manque, juste, trop, sans qty)

## 9. Invalidation du cache

Quand un stock_item change OU recipe_ingredient change, invalider les ingredient_stock_matches concernés. À implémenter via Server Actions de update/delete (DELETE FROM ingredient_stock_matches WHERE ...) plutôt que triggers SQL.
```

---

## 🥬 Prompt 7ter — "Cuisiner avec ce qui me reste" + Mode "Frigo presque vide"

```
Implémente les deux features IA bonus liées au stock :

## A. "✨ Que cuisiner avec ça ?" (depuis /(app)/stock)

1. Bouton dans la barre d'action de la page Stock (Premium only)
2. Server Action cookFromStock(householdId) appelle Sonnet avec :
   - Liste du stock (name, qty, unit, expires_on)
   - Recettes favorites du foyer (titres + tags)
   - Préférences foyer
3. Prompt demande JSON :
   ```json
   {
     "suggestions": [
       {
         "type": "existing" | "new",
         "existing_recipe_id": "uuid|null",
         "title": "...",
         "rationale": "utilise les yaourts qui périment dans 2 jours",
         "duration_min": 25,
         "ingredients": [{name, qty, unit, in_stock: bool}],
         "instructions": ["...", "..."]
       }
     ]
   }
   ```
4. Validation Zod stricte
5. UI : bottom sheet avec 3 cartes recettes, bouton "Sauvegarder dans ma bibliothèque" sur les nouvelles
6. Cap fair use : 10 appels/foyer/mois (afficher progression dans l'UI)

## B. "Mode courses minimales" (depuis /(app)/meals ou /(app)/stock)

1. Bouton "🥬 Mode frigo presque vide"
2. Modal : choix nb de jours à couvrir (3 / 5 / 7) + nb personnes
3. Server Action minimalShoppingPlan(householdId, days, people) appelle Sonnet
4. Prompt demande un menu où ≥70% des ingrédients viennent du stock existant + liste des manquants essentiels
5. Output JSON : { meals: [...], shopping_list: [{name, qty, unit}] }
6. UI : preview du menu + "Ajouter au planning" + "Ajouter X items à ma liste"
7. Cap fair use : 5 appels/foyer/mois

## C. Suggestions du soir (push proactif)

Edge Function Supabase `daily-evening-suggestions` :
- Cron : tous les jours à 17h (UTC, à ajuster par fuseau du foyer si possible)
- Pour chaque foyer Premium :
  1. Récupère recettes favorites
  2. Calcule coverage avec matchRecipeWithStock pour chacune
  3. Si ≥1 recette à 100% ET aucun meal_plan pour ce soir
  4. Push notif : "🍝 Tu as tout pour faire des [titre] ce soir !"
  5. Tap → deep link vers /(app)/recipes/[id]
- Throttle : pas plus d'1 push/jour, pas la même recette 2 jours d'affilée (table `evening_suggestions_log`)

Tous ces appels IA doivent être loggés dans ai_usage et respecter les quotas/rate limits.
```

---



## 📦 Prompt 8 — Stock

```
Implémente le module Stock.

1. Page /(app)/stock avec filtres par lieu (frigo, congélateur, placard)
2. Ajout rapide : nom + quantité + date péremption + lieu
3. Tri par date péremption ascendante
4. Bandeau en haut "X articles périment dans 3 jours" avec lien vers la liste filtrée
5. Bouton "✨ Que faire avec ce qui périme ?" → Sonnet propose 3 recettes utilisant les items à risque
6. Décrément automatique du stock quand on marque un repas planifié comme "cuisiné" (basé sur les ingrédients de la recette)
7. Si quantité < low_stock_threshold après décrément → ajouter automatiquement à la liste de courses (avec confirmation toast "Ajouté à la liste de courses : Lait")
```

---

## 💰 Prompt 9 — Module Tricount intégré

```
Implémente le module Dépenses partagées (le plus important commercialement).

1. Page /(app)/expenses :
   - En haut : sélecteur de groupe (par défaut "Vie quotidienne")
   - Bandeau "Soldes" : "Tu dois 12,50€ à Marc" / "Sarah te doit 5€"
   - Liste des dépenses récentes (date desc)
   - FAB "+ Ajouter une dépense"

2. Modal ajouter dépense :
   - Description (texte)
   - Montant (input numérique)
   - Payé par (sélecteur membre)
   - Catégorie (sélecteur)
   - Date (par défaut aujourd'hui)
   - Photo ticket (optionnel, upload Storage)
   - Pour qui : par défaut tous les membres en parts égales
   - Bouton "Personnaliser" → modale avec 5 modes : parts égales, parts inégales (poids), montants fixes, %, sélection
   - Toujours afficher la somme calculée et l'écart vs montant total (doit être 0)

3. Server Actions : createExpense (transaction qui insère expense + shares), updateExpense, deleteExpense, recordSettlement

4. Page /(app)/expenses/balances :
   - Solde par membre
   - "Suggestions de remboursements" (algo de minimisation des transferts)
   - Bouton "Marquer comme remboursé" qui crée un settlement

5. Algo de minimisation dans apps/web/lib/expenses/settle.ts (testé Vitest) :
   ```ts
   function minimizeTransfers(balances: {userId: string, cents: number}[]): Transfer[]
   ```
   Glouton : tri créanciers / débiteurs par |montant| desc, on rembourse le plus gros au plus gros, on répète.

6. Export CSV (paid feature, gate par plan)

7. Page de groupe : lister groupes, créer un nouveau (vacances, etc.)

CRITICAL : le calcul des soldes utilise la vue `expense_balances` côté DB. Vérifie qu'elle est cohérente après chaque dépense / settlement.
Tests Vitest obligatoires sur l'algo de répartition (les 5 modes) et sur le solver.
```

---

## 💳 Prompt 10 — Stripe & paywall

```
Implémente la monétisation Stripe avec pricing différencié CH/EU.

1. Crée 4 produits/prix Stripe :
   - "Fourmilière CHF mensuel" : 9,90 CHF/mois — price_id dans .env: STRIPE_PRICE_CHF_MONTHLY
   - "Fourmilière CHF annuel" : 89 CHF/an — STRIPE_PRICE_CHF_YEARLY
   - "Fourmilière EUR mensuel" : 5,99 €/mois — STRIPE_PRICE_EUR_MONTHLY
   - "Fourmilière EUR annuel" : 59 €/an — STRIPE_PRICE_EUR_YEARLY

2. Crée le coupon Stripe :
   - "EARLY100" : -25% à vie, durée=forever, max_redemptions=100, applicable au yearly seulement

3. Page /(app)/pricing :
   - Détection devise via header Accept-Language + fallback IP géoloc (côté Server Component)
   - Sélecteur manuel CHF / EUR en haut
   - 2 cartes (Ouvrière gratuit / Fourmilière)
   - Toggle Mensuel/Annuel avec économie affichée
   - CTA "Démarrer mon essai gratuit" — pas de CB demandée

4. Server Action createCheckoutSession({plan: 'monthly'|'yearly', currency: 'CHF'|'EUR', couponCode?: string}):
   - Mode subscription
   - trial_period_days: 30
   - Pas de carte requise pour le trial (payment_method_collection: 'if_required')
   - Customer email pré-rempli
   - Coupon EARLY100 si fourni
   - Retour URL : /(app)/welcome?session_id={CHECKOUT_SESSION_ID}

5. Webhook Stripe /api/stripe/webhook :
   - Vérification signature (CRITICAL)
   - Events :
     - checkout.session.completed → set household.plan='trial', trial_ends_at = now + 30j
     - customer.subscription.updated → met à jour status (trial / active / past_due / canceled)
     - customer.subscription.deleted → set household.plan='free'
     - invoice.payment_failed → email rappel + grace period 7j

6. Server Action openCustomerPortal() → Stripe Billing Portal pour gérer son abo

7. Lib apps/web/lib/billing/plan.ts :
   - getPlanForHousehold(householdId) → 'free' | 'trial' | 'family'
   - canUseFeature(plan, feature) avec feature in :
     'invite_members' | 'unlimited_tasks' | 'recurring_tasks' | 'multiple_lists' |
     'unlimited_shopping_items' | 'ai_categorize' | 'unlimited_recipes' | 'recipe_url_import' |
     'meal_planner' | 'menu_generator' | 'unlimited_stock' | 'expiry_alerts' |
     'recipe_stock_matching' | 'cook_from_stock' | 'minimal_shopping_mode' |
     'evening_suggestions_push' | 'tricount_advanced_split' | 'expense_export' |
     'receipt_ocr' | 'multi_household' | 'unlimited_history' | 'priority_support'
   - getLimit(plan, limit) avec limit in :
     'max_members' (1 vs ∞) | 'max_active_tasks' (10 vs ∞) |
     'max_shopping_items_per_list' (20 vs ∞) | 'max_shopping_lists' (1 vs ∞) |
     'max_recipes' (5 vs ∞) | 'max_stock_items' (10 vs ∞) |
     'history_days' (0 vs ∞) | 'monthly_ai_actions' (0 vs ∞)

8. Composant <PaywallGate feature="..." /> qui wrap une feature et affiche un upsell si plan free

9. Hook usePlan() qui retourne le plan + helpers

10. 8 paywalls intelligents (cf docs/04-features-detail.md) à brancher au bon endroit :
    - Click "Inviter un membre" en free → modal upsell
    - 11ème tâche créée → modal "Continuez avec Fourmilière"
    - 21ème item de course → idem
    - Tentative création 2ème liste de courses → idem
    - Toggle récurrence sur tâche → idem
    - Bouton import recette URL → idem
    - Bouton "Génère un menu" → idem
    - Click "J'ai cuisiné" / Voir coverage stock → idem
    
    Règle : afficher la modale max 1x/mois par utilisateur sur le même trigger (cookie + tracking PostHog).

Tests Playwright : 
- flow signup → trial → utilisation feature premium → fin trial → conversion
- code EARLY100 appliqué correctement (25% off + à vie)
```

---

## 🎨 Prompt 11 — Polish & lancement

```
Phase finale avant lancement :

1. Onboarding poli en 3 écrans + foyer démo pré-rempli (déjà fait mais à raffiner)
2. Empty states sympas sur chaque module
3. Skeleton loaders partout (pas de spinners)
4. Notifications push web (Web Push API + Edge Function pour envoyer)
5. Emails Resend :
   - Bienvenue (J+0)
   - Tutoriel (J+1)
   - Invitation manquante (J+3 si tu n'as invité personne)
   - Fin d'essai (J+12)
6. Page /legal/cgu et /legal/privacy (générique RGPD à adapter)
7. SEO basique sur la landing : title, meta description, OG image
8. PostHog pour tracker : signup, household_created, member_invited, task_created, expense_created, paywall_seen, upgrade_clicked, subscription_started
9. Sentry pour erreurs prod
10. Audit Lighthouse mobile ≥ 90 sur toutes les pages clés
```

---

## 🧠 Comment utiliser ces prompts efficacement

1. **Un prompt = une grosse PR.** Termine et merge avant de passer au suivant.
2. **Toujours commencer par "Lis CLAUDE.md et docs/"** au début d'une nouvelle session Claude Code, pour qu'il ait le contexte.
3. **Demande à Claude Code de faire un plan** avant de coder. "Liste-moi les fichiers que tu vas créer et attends ma validation."
4. **Tests à chaque étape.** Si Claude Code dit "ça marche", lance vraiment l'app et clique partout.
5. **Commits petits et fréquents.** `git commit` après chaque fonctionnalité qui marche.
6. **Quand quelque chose foire** : ne dis pas "ça marche pas". Dis : "j'ai cliqué sur X, j'attendais Y, j'ai eu Z. Voici l'erreur console : ...".

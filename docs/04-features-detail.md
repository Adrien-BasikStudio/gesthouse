# 04 — Détail fonctionnel des modules

## 🏠 Module Foyer

### Création
- À l'inscription, un foyer "démo" est créé automatiquement avec données de seed (3 tâches, 1 menu, 1 liste de courses) → l'utilisateur voit la valeur immédiatement.
- L'utilisateur peut renommer / changer l'emoji / quitter et créer le sien.

### Invitation
- Génère un lien unique `/invite/{token}` valide 7 jours
- L'invité s'inscrit (si pas de compte) puis rejoint le foyer en 1 tap
- Email d'invitation envoyé via Resend
- Limite plan gratuit : 2 membres actifs (les invitations supplémentaires bloquées avec CTA "Passer en Famille")

### Rôles
- **Admin** : tout
- **Membre** : tout sauf supprimer le foyer / gérer les rôles
- **Invité** : lecture + ajout dans ses propres listes (ex : baby-sitter)
- **Enfant** : voit ses tâches et événements, peut cocher, mais ne voit pas les dépenses

---

## ✅ Module Tâches

### Création rapide
Bouton flottant + parsing IA optionnel :
> "vidange voiture papa samedi" → titre: "Vidange voiture", assigné: Papa, date: samedi prochain.

### Récurrence
- Pré-sets : tous les jours, lundi au vendredi, hebdo, bi-mensuel, mensuel
- Custom : RRULE complète

### Rotation auto
Pour les tâches type "sortir les poubelles" :
- L'admin sélectionne 2-N membres dans `rotation_user_ids`
- À chaque complétion, l'index avance et la prochaine occurrence est assignée au suivant
- L'historique permet de voir "qui a fait quoi le plus" → équité visible

### Vues
- **Aujourd'hui** (par défaut, mobile)
- **Cette semaine**
- **Par membre**
- **Historique** (qui a fait quoi)

---

## 📅 Module Calendrier

- Vue jour/semaine/mois (semaine par défaut sur mobile)
- Événements colorés par membre ou catégorie
- Rappels push 15min / 1h / 1 jour avant
- Détection de conflits ("Papa a déjà un RDV à 14h")
- **Phase 2** : sync Google Calendar 2-way

---

## 🛒 Module Liste de courses

### Spécificités UX
- **Temps réel** : si quelqu'un coche "lait", ça apparaît coché chez tous les membres en magasin
- **Auto-complétion** des items courants (avec catégorie auto)
- **Catégorisation IA** : ajoute "shampooing" → l'IA met "Hygiène" en catégorie → tri par rayon en magasin
- **Multi-listes** : Carrefour, Marché, Bricolage, etc.
- **"Cacher les cochés"** au lieu de les supprimer (utile en magasin)
- **Réinitialiser** la liste quand on rentre des courses → décoche tout ou archive

### Source des items
- Ajout manuel
- Depuis une recette (auto en planifiant un repas)
- Depuis le stock bas (auto si quantité < seuil)
- Suggestion IA basée sur historique ("vous achetez du pain tous les 3 jours")

---

## 🍳 Module Recettes & Menu

### Recettes
- Création manuelle
- **Import depuis URL** (parsing IA → titre, ingrédients, étapes, photo)
- Photo upload
- Tags (rapide, végé, plat unique, kids friendly)
- Favoris

### Planificateur de menu
- Vue calendrier de la semaine, glisser-déposer une recette sur un jour/repas
- Bouton magique : **"Génère un menu de la semaine"** (IA) prend en compte :
  - Stock disponible
  - Préférences/restrictions du foyer (végé, allergies, à éviter)
  - Recettes favorites
  - Variété (pas 2x le même type de plat dans la semaine)
- Bouton **"Ajouter au panier"** : tous les ingrédients manquants vs stock → liste de courses

---

## 🧠 Recette × Stock — "Le frigo intelligent" (feature signature)

C'est **LA feature** qui transforme Les Fourmis d'une "app de recettes parmi d'autres" en "assistant qui connaît mon frigo". Personne ne fait ça bien aujourd'hui — c'est notre vrai moat.

### Promesse utilisateur
**Tu ouvres une recette, tu vois immédiatement ce que tu as déjà. Tu vois ce qui manque. Un seul tap = ajouté à la liste de courses.**

### UX recette détaillée

Quand un user ouvre une recette, il voit :

```
┌────────────────────────────────────────────┐
│ Pâtes carbonara — ⏱ 20 min · 👥 4 pers      │
│                                            │
│ ✅ Tu as 4/6 ingrédients !                  │
│ Il te manque : œufs, parmesan              │
│ [ + Ajouter à la liste de courses ]        │
│                                            │
│ INGRÉDIENTS                                │
│ ✅ Pâtes (500g)         · 600g en stock    │
│ ✅ Lardons (200g)       · 250g (frigo)     │
│ ✅ Crème (20cl)         · 1 brique (frigo) │
│ ✅ Ail (2 gousses)      · stock OK         │
│ ⚠ Œufs (4)              · pas en stock     │
│ ⚠ Parmesan (50g)        · pas en stock     │
│                                            │
│ ÉTAPES                                     │
│ 1. Faire cuire les pâtes...                │
│                                            │
│ [ 👨‍🍳 J'ai cuisiné — déduire le stock ]      │
└────────────────────────────────────────────┘
```

### Algorithme de matching (3 niveaux)

Pour chaque ingrédient d'une recette, on tente dans l'ordre :

**Niveau 1 — Match exact** (gratuit, instantané)
- Lowercase + unaccent + singulier
- Ex : "Œufs" matche "oeufs"

**Niveau 2 — Match flou Postgres** (gratuit, instantané, pg_trgm)
- `similarity(stock_name, ingredient_name) > 0.4`
- Tokenisation : "tomates cerises" → matche "tomates"
- Ex : "courgettes bio" matche "courgette"

**Niveau 3 — Match sémantique IA** (Haiku, mis en cache 30 jours)
- Appelé **uniquement si niveau 2 échoue**
- Ex : "pousses d'épinards" → matche "épinards frais"
- Ex : "filet mignon de porc" → matche "porc"
- Ex : "échalote" ne matche PAS "oignon" (l'IA sait que c'est différent)
- Cachée dans `ingredient_stock_matches`, invalidée si l'ingrédient ou le stock_item est modifié

### Comparaison de quantités

Une fois l'ingrédient matché à un stock_item :

```
demandé = recipe_ingredients.quantity (avec son unité)
en stock = stock_items.quantity (avec son unité)

Si unités identiques → comparaison directe
Si unités convertibles (g↔kg, ml↔cl↔l) → convertir puis comparer
Si pas convertible → "présumé OK" avec icône "?"
Si stock_item.quantity = NULL → "présumé OK"
```

Conversions à coder dans `apps/web/lib/units.ts` :
- Masse : g, kg, mg
- Volume : ml, cl, dl, l
- Quantité : pièce, douzaine
- Cuillère : càs ≈ 15ml ≈ 15g (approximation)
- Cuillère à café : càc ≈ 5ml ≈ 5g

Ne pas chercher la perfection : si conversion impossible, afficher "?" et ne pas bloquer.

### Bouton "Ajouter manquants à la liste"

Tap → ajoute en bulk les ingrédients ⚠ et 🔴 à la liste de courses active du foyer, avec leur quantité. Toast en bas avec undo (5 sec). Categorisation auto (Haiku) en background.

### Bouton "J'ai cuisiné — déduire le stock"

Tap → boucle sur les ingrédients matchés, décrémente `stock_items.quantity`. Si `quantity` passe sous `low_stock_threshold` → ajout auto à la liste de courses (avec confirmation toast).

### Filtre "Recettes possibles maintenant" 🔥

Sur la page bibliothèque de recettes, un filtre **Premium** :

- **Toutes les recettes** (par défaut)
- **Possibles maintenant** (couverture 100% — j'ai tout ce qu'il faut)
- **Presque possibles** (couverture ≥ 80% — il manque juste 1 truc)
- **Anti-gaspi** (utilise les items qui périment dans 3 jours)

Cette feature nécessite que les matchings soient pré-calculés. Job nightly Edge Function : pour chaque foyer Premium, recalculer les couvertures des 50 dernières recettes.

### Free vs Premium (paywall mapping)

| Feature | Ouvrière (Gratuit) | Fourmilière (Premium) |
|---|---|---|
| Voir les ingrédients d'une recette | ✅ | ✅ |
| Voir si je les ai en stock | ❌ | ✅ |
| Bouton "ajouter manquants" | ❌ | ✅ |
| Bouton "J'ai cuisiné" (décrément) | ❌ | ✅ |
| Filtre "Recettes possibles maintenant" | ❌ | ✅ |
| Match IA sémantique | ❌ | ✅ |

Sur le free, afficher discrètement : *"🐜 Connecte ton stock pour savoir ce qu'il te manque — Découvrir Fourmilière"*

---

## 🌟 Feature : "Cuisiner avec ce qui me reste"

Depuis la vue **Stock**, bouton **"✨ Que cuisiner avec ça ?"**.

### Workflow
1. Tap sur le bouton (Premium uniquement)
2. L'app envoie à Claude Sonnet :
   - Liste du stock (avec dates de péremption)
   - Recettes favorites du foyer
   - Préférences/restrictions
3. Sonnet retourne **3 suggestions de recettes** :
   - 1 depuis les recettes existantes du foyer (si match possible)
   - 2 nouvelles (avec ingrédients, étapes, durée estimée)
   - Priorité aux items qui périment vite
4. L'utilisateur peut sauver une nouvelle recette en bibliothèque en 1 tap

### Coût : ~0,02€/appel · cap 10/mois pour foyer Premium classique

---

## 🔔 Feature : Suggestions du soir (push proactives)

Push notification à **17h** (configurable) si **couverture 100% sur ≥1 recette favorite** :

> 🍝 "Bonne nouvelle : tu as tout pour faire des Carbonara ce soir !"

Tap → ouvre directement la recette.

### Logique
- Edge Function cron qui tourne à 17h00 du fuseau du foyer
- Calcule la couverture pour les recettes favorites
- Si ≥1 à 100% ET aucun repas planifié pour ce soir → envoie 1 push (max)
- Throttle : pas plus d'1 suggestion/jour, jamais 2 jours d'affilée la même recette

### Free vs Premium
Premium uniquement (utilise stock + recettes étendues).

---

## 🥬 Feature : Mode "Frigo presque vide"

Bouton accessible depuis **Stock** ou **Menu** → **"Mode courses minimales"**.

### Promesse utilisateur
> "Génère-moi un menu de la semaine **sans aller faire les grosses courses**, en utilisant au maximum ce que j'ai déjà."

### Workflow
1. Tap sur "Mode courses minimales"
2. Claude Sonnet reçoit :
   - Stock complet
   - Recettes favorites
   - Préférences foyer
   - Nombre de repas à couvrir
3. Sonnet génère un menu qui :
   - Couvre au moins 70% des ingrédients depuis le stock existant
   - Liste **uniquement les essentiels manquants** (pas le menu de la semaine standard)
4. Bouton final : "Ajouter les 5 essentiels à ma liste"

### Cas d'usage typiques
- "Vacances qui arrivent dans 4 jours, je veux vider le frigo"
- "Pas envie de faire de grosses courses cette semaine"
- "Fin de mois, on serre le budget"

### Coût : ~0,03€/appel · feature Premium · cap fair use 5/mois

---



## 📦 Module Stock

- Liste simple par lieu (frigo, placard, congel)
- Ajout rapide par scan code-barre (Phase 2) ou texte
- Alerte 3 jours avant péremption (notif push + bandeau "à manger")
- IA "Que faire avec ce qui périme ?" → suggère 3 recettes
- Décrément auto quand on cuisine une recette planifiée

---

## 💰 Module Dépenses partagées (Tricount intégré)

C'est le module qui va déclencher le passage au payant. Doit être **excellent**.

### Concepts

- Un **groupe de dépenses** = un contexte (par défaut "Vie quotidienne", + "Vacances 2026", "Travaux maison", etc.)
- Une **dépense** = un paiement effectué par un membre, à répartir entre N membres
- Une **part** = combien chaque membre doit pour cette dépense
- Un **règlement** = un transfert entre membres pour solder une dette

### Modes de répartition

1. **Parts égales** (par défaut) : montant / nb de participants
2. **Parts inégales** : pondération par "parts" (ex: 1/1/2 pour Papa, Maman, et le couple compte double)
3. **Montants fixes** : on saisit ce que doit chacun
4. **Pourcentages** : 60% / 40% par exemple
5. **Quelques uns paient pour tous** : sélection des participants concernés (utile en coloc quand un seul ne mange pas le repas)

### Saisie d'une dépense

```
[Description]   "Courses Carrefour"
[Montant]        87,40 €
[Payé par]       Sarah ▼
[Catégorie]      🛒 Courses ▼
[Date]           Aujourd'hui
[Photo ticket]   📷 (optionnel, OCR Phase 2)
[Pour qui]       ☑ Sarah ☑ Marc ☑ Léa ☐ Tom (parts égales)
                 → ou bouton "Personnaliser la répartition"
```

### Calcul des soldes

Côté DB : la vue `expense_balances` renvoie le solde par utilisateur par groupe.

**Algorithme de minimisation** des transferts (côté app, en TS) :
```
balances = [{user: A, balance: +50}, {user: B, balance: -30}, {user: C, balance: -20}]

Algo glouton :
  - tri débiteurs (négatifs) et créanciers (positifs)
  - rembourser le plus gros débiteur au plus gros créancier
  - répéter jusqu'à équilibre
```
Donne typiquement N-1 transferts max au lieu de N(N-1).

### UI
- **Vue liste** des dépenses (récentes en haut)
- **Vue soldes** : "Tu dois X € à Marc" / "Sarah te doit Y €"
- **Bouton "Régler"** → enregistre un settlement → soldes mis à jour
- **Export CSV** (paid feature)
- **Photo du ticket** stockée dans Supabase Storage, lien depuis la dépense

### Catégories par défaut
Courses, Restaurants, Loyer/charges, Sorties, Voyages, Auto, Santé, Cadeaux, Divers.

### Plus tard
- OCR ticket → préremplit montant, marchand, catégorie
- Liaison automatique : dépense "Courses Carrefour" → si module Stock activé, propose d'incrémenter le stock
- Multi-devises pour les vacances

---

## 🤖 Assistant IA (transversal)

Voir `05-ai-integration.md` pour l'architecture détaillée. Côté UX :

- **Pas de chatbot principal**. L'IA agit en arrière-plan + boutons "magiques" contextuels.
- **Boutons "magiques"** (1 tap) :
  - "Génère un menu de la semaine"
  - "Que faire avec ce qui périme ?"
  - "Résume ma semaine" (digest dimanche soir)
  - "Catégorise mes courses" (auto-tri par rayon)
  - "Importe cette recette" (URL → recette structurée)
  - "Ajoute cette tâche en langage naturel" (dictée → tâche)
- **Digest hebdo** : email + notif chaque dimanche soir, "Voici votre semaine".
- **Anticipations** : "Tu cuisines des pâtes carbonara mercredi mais il manque les œufs → ajouté à la liste de courses ?"

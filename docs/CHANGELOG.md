# 📋 CHANGELOG du repo Les Fourmis

## v3 — 27 avril 2026 (cette session)

### 💰 Nouveau pricing acté
- 🇨🇭 Suisse : **9,90 CHF/mois** ou **89 CHF/an**
- 🇪🇺 Europe : **5,99 €/mois** ou **59 €/an**
- Essai 30 jours full premium, sans CB
- Code `EARLY100` : -25% à vie sur l'annuel pour les 100 premiers waitlist
- ❌ Pas de pack "à vie" → focus sur revenu récurrent stable

### 🐜 Plan "Ouvrière" (gratuit) recalibré
- 1 seul membre (pas 2)
- 10 tâches max, pas de récurrence
- 1 liste de courses, 20 items max
- 5 recettes max, pas d'import URL
- 10 items en stock, pas d'alertes péremption
- Tricount basique (parts égales seulement)
- 0 jour d'historique, **aucune IA**

### ⭐ Nouvelle feature signature — "Le frigo intelligent"
Recette × Stock : matching automatique des ingrédients avec le stock du foyer.
- 3 niveaux de match : exact → fuzzy SQL (pg_trgm) → IA sémantique (Haiku, cache 30j)
- Bouton "Ajouter manquants à la liste de courses"
- Bouton "J'ai cuisiné — déduire le stock"
- Filtre **"Recettes possibles maintenant"** (couverture 100%)
- Premium uniquement → paywall fort

### 🌟 3 nouvelles features IA
1. **"Cuisiner avec ce qui me reste"** — depuis le stock, IA propose 3 recettes (Sonnet, Premium)
2. **Suggestions du soir** — push à 17h si recette favorite à 100% disponible (Phase 2)
3. **Mode "Frigo presque vide"** — menu de la semaine qui maximise l'usage du stock (Sonnet, Premium)

### 📝 Fichiers modifiés
- `CLAUDE.md` — pricing
- `docs/01-product-spec.md` — modules MVP étendus
- `docs/03-database-schema.md` — table `ingredient_stock_matches` + extensions pg_trgm/unaccent
- `docs/04-features-detail.md` — sections "Recette × Stock", "Cuisiner avec ce qui reste", "Suggestions du soir", "Mode frigo presque vide"
- `docs/05-ai-integration.md` — features IA mises à jour, coûts recalculés (~0,80€/foyer/mois max)
- `docs/06-roadmap.md` — Phase 5 mise à jour (Stripe multi-devise)
- `docs/07-prompts-claude-code.md` — Prompt 7 réécrit, **nouveaux Prompts 7bis et 7ter**, Prompt 10 réécrit
- `docs/09-landing-copy.md` — pricing CH/EU + nouveau bloc "Le frigo intelligent"

## v2 — Brand Les Fourmis 🐜

- Nom officiel : **Les Fourmis**
- Domaines : `lesfourmis.ch` + `lesfourmis.app`
- Brand book complet (`docs/08-brand-book.md`)
- Landing copy (`docs/09-landing-copy.md`)

## v1 — Setup initial

- CLAUDE.md
- Docs 01-07 (spec, archi, schéma DB, features, IA, roadmap, prompts)

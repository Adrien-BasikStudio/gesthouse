'use client'

import { useState, useTransition } from 'react'
import { Plus, Check, ChevronDown } from 'lucide-react'
import { addSuggestedRecipe } from '@/lib/actions/recipes'
import { toast } from 'sonner'

type Ingredient = { name: string; quantity?: number; unit?: string }
type Recipe = {
  title: string
  tags: string[]
  prep_minutes: number
  cook_minutes: number
  servings: number
  instructions: string
  ingredients: Ingredient[]
}
type Category = { label: string; emoji: string; recipes: Recipe[] }

const CATEGORIES: Category[] = [
  {
    label: 'Petit-déjeuner',
    emoji: '🥣',
    recipes: [
      {
        title: 'Crêpes maison',
        tags: ['petit-déjeuner', 'sucré'],
        prep_minutes: 10, cook_minutes: 20, servings: 4,
        instructions: `1. Mélange la farine et le sucre dans un saladier. Creuse un puits et casse les œufs au centre.
2. Incorpore le lait progressivement en fouettant pour éviter les grumeaux.
3. Ajoute le beurre fondu et mélange jusqu'à obtenir une pâte lisse. Laisse reposer 30 min si possible.
4. Fais chauffer une poêle légèrement beurrée à feu moyen.
5. Verse une louche de pâte, incline la poêle pour étaler. Cuis 1-2 min par face.
6. Sers avec confiture, Nutella, sucre ou citron.`,
        ingredients: [{ name: 'Farine', quantity: 250, unit: 'g' }, { name: 'Lait', quantity: 500, unit: 'ml' }, { name: 'Oeufs', quantity: 3 }, { name: 'Beurre', quantity: 30, unit: 'g' }, { name: 'Sucre', quantity: 1, unit: 'cs' }],
      },
      {
        title: 'Pancakes moelleux',
        tags: ['petit-déjeuner', 'sucré'],
        prep_minutes: 10, cook_minutes: 15, servings: 4,
        instructions: `1. Mélange la farine, le sucre et la levure dans un saladier.
2. Dans un autre bol, bats les œufs avec le lait.
3. Verse le mélange liquide sur les ingrédients secs et mélange sans trop travailler la pâte (quelques grumeaux c'est normal).
4. Fais chauffer une poêle anti-adhésive légèrement beurrée à feu moyen-doux.
5. Verse 2-3 cs de pâte par pancake. Quand des bulles apparaissent en surface, retourne et cuis encore 1 min.
6. Sers chaud avec sirop d'érable, miel ou fruits frais.`,
        ingredients: [{ name: 'Farine', quantity: 200, unit: 'g' }, { name: 'Lait', quantity: 250, unit: 'ml' }, { name: 'Oeufs', quantity: 2 }, { name: 'Levure chimique', quantity: 1, unit: 'cs' }, { name: 'Sucre', quantity: 2, unit: 'cs' }],
      },
      {
        title: 'Pain perdu',
        tags: ['petit-déjeuner', 'sucré'],
        prep_minutes: 5, cook_minutes: 10, servings: 4,
        instructions: `1. Bats les œufs avec le lait et le sucre vanillé dans un bol large.
2. Trempe les tranches de pain dans le mélange œuf-lait, 30 secondes de chaque côté.
3. Fais fondre le beurre dans une poêle à feu moyen.
4. Fais dorer les tranches 2-3 min de chaque côté jusqu'à ce qu'elles soient bien dorées.
5. Sers chaud, saupoudré de sucre glace ou avec de la confiture.`,
        ingredients: [{ name: 'Pain de mie', quantity: 8, unit: 'tranches' }, { name: 'Oeufs', quantity: 3 }, { name: 'Lait', quantity: 200, unit: 'ml' }, { name: 'Sucre vanillé', quantity: 1, unit: 'sachet' }, { name: 'Beurre', quantity: 20, unit: 'g' }],
      },
      {
        title: 'Granola maison',
        tags: ['petit-déjeuner', 'sain'],
        prep_minutes: 10, cook_minutes: 25, servings: 6,
        instructions: `1. Préchauffe le four à 160°C.
2. Mélange les flocons d'avoine et les amandes grossièrement concassées dans un grand bol.
3. Fais chauffer l'huile de coco et le miel ensemble, verse sur les flocons et mélange bien pour tout enrober.
4. Étale sur une plaque recouverte de papier cuisson.
5. Enfourne 20-25 min en remuant à mi-cuisson jusqu'à ce que le granola soit doré.
6. Laisse refroidir complètement (il durcit en refroidissant), puis incorpore les raisins secs.
7. Conserve dans un bocal hermétique jusqu'à 2 semaines.`,
        ingredients: [{ name: "Flocons d'avoine", quantity: 300, unit: 'g' }, { name: 'Miel', quantity: 3, unit: 'cs' }, { name: 'Huile de coco', quantity: 2, unit: 'cs' }, { name: 'Amandes', quantity: 80, unit: 'g' }, { name: 'Raisins secs', quantity: 50, unit: 'g' }],
      },
    ],
  },
  {
    label: 'Déjeuner',
    emoji: '🥗',
    recipes: [
      {
        title: 'Salade niçoise',
        tags: ['déjeuner', 'salade'],
        prep_minutes: 15, cook_minutes: 0, servings: 4,
        instructions: `1. Fais cuire les haricots verts à l'eau bouillante salée 5 min, puis refroidis-les sous l'eau froide.
2. Fais cuire les œufs durs 10 min, écale-les et coupe-les en quartiers.
3. Coupe les tomates en quartiers.
4. Émiette le thon dans un saladier.
5. Dispose tous les ingrédients harmonieusement dans les assiettes : haricots, tomates, œufs, thon, olives.
6. Assaisonne avec huile d'olive, vinaigre, sel et poivre.`,
        ingredients: [{ name: 'Thon en boîte', quantity: 200, unit: 'g' }, { name: 'Oeufs', quantity: 4 }, { name: 'Tomates', quantity: 4 }, { name: 'Olives noires', quantity: 80, unit: 'g' }, { name: 'Haricots verts', quantity: 200, unit: 'g' }],
      },
      {
        title: 'Wrap poulet avocat',
        tags: ['déjeuner', 'rapide'],
        prep_minutes: 10, cook_minutes: 10, servings: 2,
        instructions: `1. Fais cuire le poulet en lamelles dans une poêle avec un filet d'huile, sel et poivre, 5-7 min.
2. Coupe les avocats en deux, retire le noyau et tranche la chair en lamelles.
3. Lave et essore la salade.
4. Réchauffe les tortillas 30 secondes au micro-ondes ou dans une poêle sèche.
5. Étale une cs de crème fraîche sur chaque tortilla.
6. Dispose la salade, le poulet et les tranches d'avocat.
7. Roule serré en repliant les côtés, coupe en deux en diagonal et sers.`,
        ingredients: [{ name: 'Tortillas', quantity: 4 }, { name: 'Poulet', quantity: 300, unit: 'g' }, { name: 'Avocat', quantity: 2 }, { name: 'Salade', quantity: 1, unit: 'poignée' }, { name: 'Crème fraîche', quantity: 2, unit: 'cs' }],
      },
      {
        title: 'Soupe de légumes',
        tags: ['déjeuner', 'soupe', 'végétarien'],
        prep_minutes: 15, cook_minutes: 30, servings: 4,
        instructions: `1. Épluche et coupe les carottes, pommes de terre et courgettes en dés. Émince les poireaux.
2. Fais revenir les poireaux dans un peu de beurre ou d'huile dans une grande casserole, 3 min.
3. Ajoute les carottes et pommes de terre, verse le bouillon chaud. Porte à ébullition.
4. Réduis le feu, couvre et laisse mijoter 15 min.
5. Ajoute les courgettes et poursuis la cuisson 10 min jusqu'à ce que tous les légumes soient tendres.
6. Mixe partiellement ou totalement selon la texture souhaitée. Rectifie l'assaisonnement.`,
        ingredients: [{ name: 'Carottes', quantity: 3 }, { name: 'Pommes de terre', quantity: 3 }, { name: 'Poireaux', quantity: 2 }, { name: 'Courgettes', quantity: 2 }, { name: 'Bouillon de légumes', quantity: 1, unit: 'L' }],
      },
      {
        title: 'Quiche lorraine',
        tags: ['déjeuner', 'tarte'],
        prep_minutes: 15, cook_minutes: 35, servings: 6,
        instructions: `1. Préchauffe le four à 180°C. Fonce un moule à tarte avec la pâte brisée, pique le fond à la fourchette.
2. Fais revenir les lardons dans une poêle sans matière grasse jusqu'à ce qu'ils soient légèrement dorés.
3. Dans un bol, bats les œufs avec la crème fraîche. Assaisonne de sel, poivre et noix de muscade.
4. Répartis les lardons sur le fond de tarte, verse l'appareil œuf-crème par-dessus.
5. Parsème de gruyère râpé.
6. Enfourne 30-35 min jusqu'à ce que la quiche soit bien dorée et prise au centre.
7. Laisse tiédir 5 min avant de démouler et servir.`,
        ingredients: [{ name: 'Pâte brisée', quantity: 1 }, { name: 'Lardons', quantity: 200, unit: 'g' }, { name: 'Oeufs', quantity: 3 }, { name: 'Crème fraîche', quantity: 200, unit: 'ml' }, { name: 'Gruyère râpé', quantity: 100, unit: 'g' }],
      },
    ],
  },
  {
    label: 'Dîner',
    emoji: '🍽️',
    recipes: [
      {
        title: 'Pâtes bolognaise',
        tags: ['dîner', 'pâtes', 'viande'],
        prep_minutes: 10, cook_minutes: 30, servings: 4,
        instructions: `1. Émince l'oignon et l'ail. Fais-les revenir dans un filet d'huile d'olive à feu moyen, 3 min.
2. Ajoute la viande hachée, émiette-la et fais-la dorer en remuant, 5 min.
3. Verse les tomates concassées, ajoute sel, poivre et herbes (origan, basilic). Mélange bien.
4. Laisse mijoter à feu doux 20-25 min en remuant de temps en temps.
5. Fais cuire les pâtes dans une grande casserole d'eau bouillante salée selon le temps indiqué sur le paquet (al dente).
6. Égoutte les pâtes en réservant un peu d'eau de cuisson. Mélange avec la sauce, ajoute un peu d'eau de cuisson si besoin.
7. Sers avec du parmesan râpé.`,
        ingredients: [{ name: 'Pâtes', quantity: 400, unit: 'g' }, { name: 'Viande hachée', quantity: 500, unit: 'g' }, { name: 'Tomates concassées', quantity: 400, unit: 'g' }, { name: 'Oignon', quantity: 1 }, { name: 'Ail', quantity: 2, unit: 'gousses' }],
      },
      {
        title: 'Poulet rôti',
        tags: ['dîner', 'viande'],
        prep_minutes: 10, cook_minutes: 70, servings: 4,
        instructions: `1. Préchauffe le four à 200°C. Sors le poulet du réfrigérateur 30 min avant.
2. Écrase les gousses d'ail et glisse-les sous la peau du poulet avec quelques herbes de Provence.
3. Coupe le citron en deux et place-le à l'intérieur du poulet.
4. Badigeonne le poulet d'huile d'olive, saupoudre d'herbes de Provence, sel et poivre sur toute la surface.
5. Place dans un plat allant au four, enfourne 1h à 1h10 selon la taille (compter 20 min par 500g).
6. Arrose le poulet de son jus toutes les 20 min pour une belle peau dorée et croustillante.
7. Laisse reposer 10 min avant de découper.`,
        ingredients: [{ name: 'Poulet entier', quantity: 1 }, { name: 'Citron', quantity: 1 }, { name: 'Ail', quantity: 4, unit: 'gousses' }, { name: 'Herbes de Provence', quantity: 1, unit: 'cs' }, { name: "Huile d'olive", quantity: 2, unit: 'cs' }],
      },
      {
        title: 'Gratin dauphinois',
        tags: ['dîner', 'gratin', 'végétarien'],
        prep_minutes: 20, cook_minutes: 50, servings: 6,
        instructions: `1. Préchauffe le four à 180°C. Frotte un plat à gratin avec la gousse d'ail coupée en deux, puis beurre-le.
2. Épluche les pommes de terre et coupe-les en fines rondelles (2-3 mm) à la mandoline ou au couteau.
3. Mélange la crème fraîche et le lait dans un bol, assaisonne généreusement en sel, poivre et noix de muscade.
4. Dispose les rondelles de pommes de terre en couches dans le plat. Verse le mélange crème-lait par-dessus, les pommes de terre doivent être presque recouvertes.
5. Parsème de gruyère râpé.
6. Enfourne 45-50 min jusqu'à ce que le dessus soit doré et qu'un couteau s'enfonce facilement dans les pommes de terre.`,
        ingredients: [{ name: 'Pommes de terre', quantity: 1, unit: 'kg' }, { name: 'Crème fraîche', quantity: 400, unit: 'ml' }, { name: 'Lait', quantity: 200, unit: 'ml' }, { name: 'Gruyère râpé', quantity: 100, unit: 'g' }, { name: 'Ail', quantity: 1, unit: 'gousse' }],
      },
      {
        title: 'Saumon au four',
        tags: ['dîner', 'poisson', 'sain'],
        prep_minutes: 5, cook_minutes: 20, servings: 4,
        instructions: `1. Préchauffe le four à 200°C. Recouvre une plaque de papier cuisson.
2. Dépose les filets de saumon sur la plaque, côté peau vers le bas.
3. Arrose d'huile d'olive, sale et poivre généreusement.
4. Dépose quelques rondelles de citron sur les filets et parsème d'aneth frais.
5. Enfourne 15-20 min selon l'épaisseur. Le saumon est cuit quand sa chair se détache facilement à la fourchette.
6. Sers avec des légumes vapeur, du riz ou une salade verte.`,
        ingredients: [{ name: 'Filets de saumon', quantity: 4 }, { name: 'Citron', quantity: 1 }, { name: 'Aneth', quantity: 1, unit: 'bouquet' }, { name: "Huile d'olive", quantity: 2, unit: 'cs' }, { name: 'Sel et poivre', quantity: 1, unit: 'pincée' }],
      },
      {
        title: 'Ratatouille',
        tags: ['dîner', 'végétarien', 'été'],
        prep_minutes: 20, cook_minutes: 45, servings: 4,
        instructions: `1. Coupe les aubergines et courgettes en dés. Sale les aubergines et laisse-les dégorger 15 min, puis rince et essuie.
2. Épépine et coupe les poivrons en lamelles. Émince l'oignon et l'ail. Coupe les tomates en dés.
3. Fais revenir l'oignon et l'ail dans l'huile d'olive 3 min dans une grande cocotte.
4. Ajoute les poivrons, fais revenir 5 min. Ajoute les aubergines, 5 min supplémentaires.
5. Ajoute les courgettes et tomates, sale, poivre, ajoute herbes de Provence et thym.
6. Couvre et laisse mijoter à feu doux 30 min en remuant de temps en temps.
7. Retire le couvercle et laisse réduire encore 10 min. La ratatouille est encore meilleure réchauffée le lendemain.`,
        ingredients: [{ name: 'Aubergines', quantity: 2 }, { name: 'Courgettes', quantity: 2 }, { name: 'Poivrons', quantity: 2 }, { name: 'Tomates', quantity: 4 }, { name: 'Oignon', quantity: 1 }, { name: 'Ail', quantity: 3, unit: 'gousses' }],
      },
      {
        title: 'Risotto aux champignons',
        tags: ['dîner', 'végétarien', 'riz'],
        prep_minutes: 10, cook_minutes: 25, servings: 4,
        instructions: `1. Chauffe le bouillon dans une casserole à part et maintiens-le chaud.
2. Émince l'oignon. Nettoie et tranche les champignons.
3. Dans une grande poêle, fais revenir l'oignon dans l'huile d'olive 3 min. Ajoute les champignons, cuis 5 min.
4. Ajoute le riz arborio, nacre-le 2 min en remuant jusqu'à ce qu'il soit translucide.
5. Ajoute une louche de bouillon chaud, remue jusqu'à absorption. Répète l'opération pendant 18-20 min.
6. Retire du feu, incorpore le parmesan râpé et une noix de beurre. Mélange vigoureusement pour crémer.
7. Assaisonne, couvre et laisse reposer 2 min avant de servir.`,
        ingredients: [{ name: 'Riz arborio', quantity: 300, unit: 'g' }, { name: 'Champignons', quantity: 300, unit: 'g' }, { name: 'Bouillon de légumes', quantity: 1, unit: 'L' }, { name: 'Parmesan', quantity: 80, unit: 'g' }, { name: 'Oignon', quantity: 1 }],
      },
    ],
  },
  {
    label: 'Desserts',
    emoji: '🍰',
    recipes: [
      {
        title: 'Moelleux au chocolat',
        tags: ['dessert', 'chocolat'],
        prep_minutes: 10, cook_minutes: 12, servings: 6,
        instructions: `1. Préchauffe le four à 200°C. Beurre et farine 6 moules individuels (ou un moule à manqué).
2. Fais fondre le chocolat noir et le beurre au bain-marie ou au micro-ondes par tranches de 30s.
3. Dans un saladier, fouette les œufs et le sucre jusqu'à ce que le mélange blanchisse.
4. Incorpore le chocolat fondu, puis la farine tamisée. Mélange jusqu'à obtenir une pâte homogène.
5. Verse dans les moules et enfourne 10-12 min pour des moelleux coulants (le centre doit rester légèrement tremblotant).
6. Démoule immédiatement et sers avec une boule de glace vanille ou de la crème fouettée.`,
        ingredients: [{ name: 'Chocolat noir', quantity: 200, unit: 'g' }, { name: 'Beurre', quantity: 150, unit: 'g' }, { name: 'Oeufs', quantity: 4 }, { name: 'Sucre', quantity: 150, unit: 'g' }, { name: 'Farine', quantity: 50, unit: 'g' }],
      },
      {
        title: 'Tarte aux pommes',
        tags: ['dessert', 'fruit'],
        prep_minutes: 20, cook_minutes: 35, servings: 8,
        instructions: `1. Préchauffe le four à 180°C. Étale la pâte brisée dans un moule à tarte, pique le fond à la fourchette.
2. Épluche les pommes, coupe-les en quatre, retire les pépins et tranche-les en fines lamelles.
3. Dispose les lamelles de pommes en rosace sur le fond de tarte en les faisant se chevaucher légèrement.
4. Saupoudre de sucre et de cannelle, parsème de petits morceaux de beurre.
5. Enfourne 30-35 min jusqu'à ce que les pommes soient fondantes et le bord de la pâte doré.
6. Laisse tiédir avant de démouler. Nappe de confiture d'abricot chauffée pour faire briller (optionnel).`,
        ingredients: [{ name: 'Pâte brisée', quantity: 1 }, { name: 'Pommes', quantity: 6 }, { name: 'Sucre', quantity: 80, unit: 'g' }, { name: 'Beurre', quantity: 30, unit: 'g' }, { name: 'Cannelle', quantity: 1, unit: 'cc' }],
      },
      {
        title: 'Tiramisu',
        tags: ['dessert', 'café', 'italien'],
        prep_minutes: 20, cook_minutes: 0, servings: 6,
        instructions: `1. Prépare un café fort et laisse-le refroidir dans une assiette creuse.
2. Sépare les blancs des jaunes d'œufs. Bats les jaunes avec le sucre jusqu'à ce que le mélange blanchisse et double de volume.
3. Incorpore le mascarpone en fouettant pour obtenir une crème lisse.
4. Monte les blancs en neige ferme et incorpore-les délicatement à la crème mascarpone.
5. Trempe rapidement les biscuits cuillère dans le café froid (sans les détremper) et dispose-les en couche dans un plat.
6. Recouvre d'une couche de crème, puis refais une couche de biscuits et de crème.
7. Saupoudre généreusement de cacao en poudre. Réfrigère au moins 4h (idéalement une nuit) avant de servir.`,
        ingredients: [{ name: 'Mascarpone', quantity: 250, unit: 'g' }, { name: 'Oeufs', quantity: 3 }, { name: 'Sucre', quantity: 80, unit: 'g' }, { name: 'Biscuits cuillère', quantity: 200, unit: 'g' }, { name: 'Café', quantity: 200, unit: 'ml' }, { name: 'Cacao en poudre', quantity: 2, unit: 'cs' }],
      },
      {
        title: 'Crème brûlée',
        tags: ['dessert', 'crème'],
        prep_minutes: 10, cook_minutes: 40, servings: 4,
        instructions: `1. Préchauffe le four à 150°C. Chauffe la crème liquide avec la vanille sans la faire bouillir.
2. Dans un bol, fouette les jaunes d'œufs avec la moitié du sucre (50g) jusqu'à ce que le mélange blanchisse.
3. Verse la crème chaude progressivement sur les jaunes en fouettant doucement. Retire l'écume.
4. Répartis dans 4 ramequins, pose-les dans un plat à gratin rempli d'eau chaude à mi-hauteur (bain-marie).
5. Enfourne 35-40 min jusqu'à ce que les crèmes soient prises mais encore légèrement tremblantes au centre.
6. Laisse refroidir puis réfrigère au moins 2h.
7. Au moment de servir, saupoudre le reste du sucre sur chaque crème et caramélise au chalumeau.`,
        ingredients: [{ name: 'Crème liquide', quantity: 500, unit: 'ml' }, { name: "Jaunes d'oeufs", quantity: 5 }, { name: 'Sucre', quantity: 100, unit: 'g' }, { name: 'Extrait de vanille', quantity: 1, unit: 'cc' }],
      },
    ],
  },
  {
    label: 'Snacks',
    emoji: '🥨',
    recipes: [
      {
        title: 'Guacamole maison',
        tags: ['snack', 'dip', 'végétarien'],
        prep_minutes: 10, cook_minutes: 0, servings: 4,
        instructions: `1. Coupe les avocats en deux, retire les noyaux et récupère la chair à la cuillère.
2. Écrase la chair à la fourchette dans un bol — laisse quelques morceaux pour la texture.
3. Presse le citron vert et ajoute le jus immédiatement pour éviter l'oxydation.
4. Émince finement la moitié de l'oignon rouge et la coriandre fraîche.
5. Épépine et coupe la tomate en petits dés.
6. Mélange tous les ingrédients, assaisonne de sel et d'un peu de piment si souhaité.
7. Sers immédiatement avec des chips de maïs ou des légumes crudités.`,
        ingredients: [{ name: 'Avocats', quantity: 3 }, { name: 'Citron vert', quantity: 1 }, { name: 'Tomate', quantity: 1 }, { name: 'Oignon rouge', quantity: 0.5 }, { name: 'Coriandre', quantity: 1, unit: 'bouquet' }],
      },
      {
        title: 'Houmous maison',
        tags: ['snack', 'dip', 'végétarien'],
        prep_minutes: 10, cook_minutes: 0, servings: 6,
        instructions: `1. Égoutte et rince les pois chiches. Réserve un peu d'eau de la boîte.
2. Presse le citron.
3. Dans un mixeur, mets les pois chiches, le tahini, le jus de citron, l'ail et l'huile d'olive.
4. Mixe en ajoutant progressivement 3-4 cs d'eau (ou l'eau des pois chiches) pour obtenir une texture lisse et crémeuse.
5. Assaisonne de sel et cumin selon ton goût.
6. Verse dans un bol, fais un creux au centre, verse un filet d'huile d'olive et saupoudre de paprika.
7. Sers avec du pain pita, des légumes ou des crackers.`,
        ingredients: [{ name: 'Pois chiches', quantity: 400, unit: 'g' }, { name: 'Tahini', quantity: 2, unit: 'cs' }, { name: 'Citron', quantity: 1 }, { name: 'Ail', quantity: 1, unit: 'gousse' }, { name: "Huile d'olive", quantity: 3, unit: 'cs' }],
      },
      {
        title: 'Energy balls',
        tags: ['snack', 'sain', 'sans cuisson'],
        prep_minutes: 15, cook_minutes: 0, servings: 12,
        instructions: `1. Mélange les flocons d'avoine, le beurre de cacahuète, le miel et les graines de lin dans un grand bol.
2. Incorpore les pépites de chocolat.
3. Si le mélange est trop collant, ajoute un peu de flocons. S'il est trop sec, ajoute un peu de miel.
4. Réfrigère 30 min pour faciliter le façonnage.
5. Avec les mains légèrement humides, forme des boules de la taille d'une noix (environ 2 cs de mélange).
6. Dépose sur une plaque recouverte de papier cuisson et réfrigère encore 1h pour qu'elles durcissent.
7. Conserve dans un récipient hermétique au réfrigérateur jusqu'à 1 semaine.`,
        ingredients: [{ name: "Flocons d'avoine", quantity: 150, unit: 'g' }, { name: 'Beurre de cacahuète', quantity: 3, unit: 'cs' }, { name: 'Miel', quantity: 2, unit: 'cs' }, { name: 'Chocolat en pépites', quantity: 50, unit: 'g' }, { name: 'Graines de lin', quantity: 1, unit: 'cs' }],
      },
    ],
  },
]

export default function RecipeSuggestions({ householdId }: { householdId: string }) {
  const [open, setOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState(0)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  function handleAdd(recipe: Recipe) {
    startTransition(async () => {
      const result = await addSuggestedRecipe(householdId, recipe)
      if (result?.error) {
        toast.error(result.error)
      } else {
        setAdded(prev => new Set([...prev, recipe.title]))
        toast.success(`"${recipe.title}" ajoutée à ton carnet 🐜`)
      }
    })
  }

  return (
    <div className="mt-4 mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-card border rounded-2xl hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <span className="font-semibold text-sm">Recettes suggérées</span>
        </div>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="mt-2 bg-card border rounded-2xl overflow-hidden">
          {/* Category tabs */}
          <div className="flex gap-1 p-3 overflow-x-auto scrollbar-none">
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                onClick={() => setActiveCategory(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Recipe cards */}
          <div className="divide-y">
            {CATEGORIES[activeCategory].recipes.map(recipe => {
              const isAdded = added.has(recipe.title)
              const totalMin = recipe.prep_minutes + recipe.cook_minutes
              return (
                <div key={recipe.title} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{recipe.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {totalMin > 0 && (
                        <span className="text-xs text-muted-foreground">{totalMin} min</span>
                      )}
                      <span className="text-xs text-muted-foreground">{recipe.servings} pers.</span>
                      {recipe.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-xs px-1.5 py-0.5 bg-secondary rounded-full text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAdd(recipe)}
                    disabled={isPending || isAdded}
                    className={`size-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                      isAdded
                        ? 'bg-green-100 text-green-600'
                        : 'bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground'
                    }`}
                    title={isAdded ? 'Déjà ajoutée' : 'Ajouter au carnet'}
                  >
                    {isAdded ? <Check className="size-4" /> : <Plus className="size-4" />}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

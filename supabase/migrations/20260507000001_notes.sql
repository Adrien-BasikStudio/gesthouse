-- Table des notes personnelles / journal
CREATE TABLE public.notes (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id uuid       NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
  title       text,
  content     text        NOT NULL DEFAULT '',
  note_date   date        NOT NULL DEFAULT CURRENT_DATE,
  is_shared   boolean     NOT NULL DEFAULT false,
  color       text        NOT NULL DEFAULT '#8B5CF6',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Voir ses propres notes + les notes partagées du foyer
CREATE POLICY "notes_select" ON public.notes
  FOR SELECT USING (
    user_id = auth.uid()
    OR (
      is_shared = true
      AND household_id IN (
        SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
      )
    )
  );

-- Créer dans son propre foyer
CREATE POLICY "notes_insert" ON public.notes
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

-- Modifier uniquement ses propres notes
CREATE POLICY "notes_update" ON public.notes
  FOR UPDATE USING (user_id = auth.uid());

-- Supprimer uniquement ses propres notes
CREATE POLICY "notes_delete" ON public.notes
  FOR DELETE USING (user_id = auth.uid());

-- Index pour les requêtes par date / foyer
CREATE INDEX notes_household_date_idx ON public.notes (household_id, note_date);
CREATE INDEX notes_user_idx           ON public.notes (user_id);

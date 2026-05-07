-- Ajout du champ video_url sur les recettes (YouTube, Instagram, etc.)
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS video_url text;

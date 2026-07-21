
CREATE TABLE public.burgers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT NOT NULL DEFAULT '',
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.burgers TO anon, authenticated;
GRANT ALL ON public.burgers TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.burgers_id_seq TO service_role;

ALTER TABLE public.burgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active burgers"
ON public.burgers FOR SELECT
USING (is_active = true);

CREATE POLICY "No direct insert"
ON public.burgers FOR INSERT TO anon, authenticated
WITH CHECK (false);

CREATE POLICY "No direct update"
ON public.burgers FOR UPDATE TO anon, authenticated
USING (false);

CREATE POLICY "No direct delete"
ON public.burgers FOR DELETE TO anon, authenticated
USING (false);

CREATE OR REPLACE FUNCTION public.update_burgers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_burgers_updated_at
BEFORE UPDATE ON public.burgers
FOR EACH ROW EXECUTE FUNCTION public.update_burgers_updated_at();

-- Seed existing burgers (image_url empty → frontend falls back to bundled assets by id)
INSERT INTO public.burgers (id, name, description, price, image_url, ingredients, sort_order) VALUES
(1, 'Double Bacon Deluxe', 'Two juicy beef patties layered with crispy bacon, melted cheddar, and our secret sauce.', 12.99, '', ARRAY['Brioche bun','Beef patty x2','Crispy bacon','Cheddar cheese','Lettuce','Tomato','Secret sauce'], 1),
(2, 'Crispy Chicken Supreme', 'Golden crispy chicken breast with fresh lettuce, tomato, and creamy mayo.', 10.99, '', ARRAY['Sesame bun','Crispy chicken breast','Lettuce','Tomato','Pickles','Creamy mayo'], 2),
(3, 'Plant Power Burger', '100% plant-based patty with avocado, sprouts, and tangy vegan aioli.', 11.99, '', ARRAY['Whole-grain bun','Plant-based patty','Avocado','Sprouts','Red onion','Vegan aioli'], 3),
(4, 'BBQ Bacon Bliss', 'Smoky BBQ sauce drizzled over bacon, onion rings, and a perfectly grilled patty.', 13.99, '', ARRAY['Brioche bun','Beef patty','Bacon','Onion rings','Cheddar','BBQ sauce'], 4),
(5, 'Jalapeño Fire', 'Spicy jalapeños, pepper jack cheese, and chipotle mayo for heat lovers.', 11.49, '', ARRAY['Brioche bun','Beef patty','Jalapeños','Pepper jack cheese','Lettuce','Chipotle mayo'], 5),
(6, 'Mushroom Swiss Heaven', 'Sautéed mushrooms and melted Swiss cheese on a herb-seasoned patty.', 12.49, '', ARRAY['Brioche bun','Herb beef patty','Sautéed mushrooms','Swiss cheese','Arugula','Garlic aioli'], 6),
(7, 'Truffle Excellence', 'Luxurious truffle aioli, arugula, and parmesan on premium Wagyu beef.', 18.99, '', ARRAY['Brioche bun','Wagyu beef patty','Arugula','Parmesan','Caramelized onions','Truffle aioli'], 7),
(8, 'Breakfast Champion', 'Fried egg, bacon, hash brown, and maple syrup glaze for morning cravings.', 13.49, '', ARRAY['Brioche bun','Beef patty','Fried egg','Bacon','Hash brown','Maple glaze'], 8);

SELECT setval('public.burgers_id_seq', (SELECT MAX(id) FROM public.burgers));

-- Storage bucket for burger photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('burger-images', 'burger-images', true);

CREATE POLICY "Burger images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'burger-images');

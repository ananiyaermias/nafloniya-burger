
DROP POLICY IF EXISTS "No direct insert" ON public.burgers;
DROP POLICY IF EXISTS "No direct update" ON public.burgers;
DROP POLICY IF EXISTS "No direct delete" ON public.burgers;

DROP POLICY IF EXISTS "Burger images are publicly readable" ON storage.objects;

-- Add restrictive SELECT policy - only allow access through edge functions with service role
CREATE POLICY "No direct select allowed"
ON public.orders
FOR SELECT
TO anon, authenticated
USING (false);

-- Add restrictive UPDATE policy - only allow access through edge functions with service role
CREATE POLICY "No direct update allowed"
ON public.orders
FOR UPDATE
TO anon, authenticated
USING (false);

-- Add restrictive DELETE policy - prevent all direct deletes
CREATE POLICY "No direct delete allowed"
ON public.orders
FOR DELETE
TO anon, authenticated
USING (false);
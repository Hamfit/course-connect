CREATE POLICY "Authenticated users can insert courses"
ON public.courses
FOR INSERT
TO authenticated
WITH CHECK (true);
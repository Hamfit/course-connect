-- Allow admins to read all materials regardless of status
CREATE POLICY "Admins can read all materials"
ON public.materials
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Add foreign key from materials.uploaded_by to profiles.user_id for joins
-- (profiles already has user_id column linked to auth.users)
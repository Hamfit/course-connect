
ALTER TABLE public.materials ADD COLUMN IF NOT EXISTS rejection_reason text;

CREATE OR REPLACE FUNCTION public.increment_material_downloads(_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.materials SET downloads = downloads + 1 WHERE id = _id AND status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION public.increment_material_downloads(uuid) TO anon, authenticated;

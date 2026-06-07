-- 1. Create indices for faster filtering and joins
CREATE INDEX IF NOT EXISTS idx_materials_status ON public.materials (status);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by ON public.materials (uploaded_by);
CREATE INDEX IF NOT EXISTS idx_materials_course_id ON public.materials (course_id);
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status ON public.profiles (verification_status);
CREATE INDEX IF NOT EXISTS idx_departments_university_id ON public.departments (university_id);
CREATE INDEX IF NOT EXISTS idx_courses_department_level ON public.courses (department_id, level_id);

-- 2. Create the get_admin_stats database function to fetch admin dashboard counts in a single RPC
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  pending_count INT;
  approved_count INT;
  rejected_count INT;
  total_count INT;
  users_count INT;
  pending_users_count INT;
BEGIN
  -- Restrict this function to administrators
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  SELECT COUNT(*)::int INTO pending_count FROM public.materials WHERE status = 'pending';
  SELECT COUNT(*)::int INTO approved_count FROM public.materials WHERE status = 'approved';
  SELECT COUNT(*)::int INTO rejected_count FROM public.materials WHERE status = 'rejected';
  SELECT COUNT(*)::int INTO total_count FROM public.materials;
  SELECT COUNT(*)::int INTO users_count FROM public.profiles;
  SELECT COUNT(*)::int INTO pending_users_count FROM public.profiles WHERE verification_status = 'pending';

  RETURN json_build_object(
    'pending', pending_count,
    'approved', approved_count,
    'rejected', rejected_count,
    'total', total_count,
    'users', users_count,
    'pendingUsers', pending_users_count
  );
END;
$$;

-- 3. Create the university_course_counts view to fetch all universities and their course counts in a single select query
CREATE OR REPLACE VIEW public.university_course_counts AS
SELECT 
  u.id,
  u.name,
  u.short_name,
  COUNT(DISTINCT m.course_id)::int AS course_count
FROM public.universities u
LEFT JOIN public.departments d ON d.university_id = u.id
LEFT JOIN public.courses c ON c.department_id = d.id
LEFT JOIN public.materials m ON m.course_id = c.id AND m.status = 'approved'
GROUP BY u.id, u.name, u.short_name;

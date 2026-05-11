
-- Materials: most queries filter by status, course_id, uploaded_by, ordered by created_at
CREATE INDEX IF NOT EXISTS idx_materials_status_created ON public.materials (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_course_status ON public.materials (course_id, status);
CREATE INDEX IF NOT EXISTS idx_materials_uploaded_by_status ON public.materials (uploaded_by, status, created_at DESC);

-- Courses: filtered by department_id + level_id
CREATE INDEX IF NOT EXISTS idx_courses_dept_level ON public.courses (department_id, level_id);

-- Departments: filtered by university_id (already unique on (name, university_id) but leading column is name)
CREATE INDEX IF NOT EXISTS idx_departments_university ON public.departments (university_id);

-- Levels: ordered by sort_order
CREATE INDEX IF NOT EXISTS idx_levels_sort_order ON public.levels (sort_order);

-- User roles: has_role() lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles (user_id);


-- ============================================================
-- Update UNILAG departments to the 5 specified departments
-- and add per-department level restrictions via junction table
-- ============================================================

-- Step 1: Remove all existing departments (cascades to courses that reference them)
-- We scope this to UNILAG only so other universities are unaffected.
DO $$
DECLARE
  unilag_id UUID;
BEGIN
  SELECT id INTO unilag_id FROM public.universities WHERE short_name = 'UNILAG';

  IF unilag_id IS NOT NULL THEN
    -- Clear department_id (and level_id) on any profiles referencing a UNILAG department
    -- so the FK constraint doesn't block the delete below.
    UPDATE public.profiles
    SET department_id = NULL, level_id = NULL
    WHERE department_id IN (
      SELECT id FROM public.departments WHERE university_id = unilag_id
    );

    -- Remove all existing UNILAG departments (courses cascade-delete automatically)
    DELETE FROM public.departments WHERE university_id = unilag_id;

    -- Insert the 5 approved departments
    INSERT INTO public.departments (name, university_id) VALUES
      ('Computer Science',       unilag_id),
      ('Accounting',             unilag_id),
      ('Economics',              unilag_id),
      ('Electrical Engineering', unilag_id),
      ('Civil Engineering',      unilag_id);
  END IF;
END;
$$;

-- Step 2: Create a department_levels junction table to define which
-- academic levels are valid for each department.
CREATE TABLE IF NOT EXISTS public.department_levels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  level_id      UUID NOT NULL REFERENCES public.levels(id)      ON DELETE CASCADE,
  UNIQUE(department_id, level_id)
);

ALTER TABLE public.department_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Department levels are publicly readable"
  ON public.department_levels FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS idx_dept_levels_dept ON public.department_levels (department_id);

-- Step 3: Seed the department_levels for UNILAG departments.
-- Unilag structure:
--   Computer Science       → 100–400 Level  (4-year programme)
--   Accounting             → 100–500 Level  (5-year programme)
--   Economics              → 100–500 Level  (5-year programme)
--   Electrical Engineering → 100–500 Level  (5-year engineering programme)
--   Civil Engineering      → 100–500 Level  (5-year engineering programme)
DO $$
DECLARE
  unilag_id     UUID;
  dept_id       UUID;
  dept_name     TEXT;
  max_level_val INT;
  lvl_id        UUID;
  lvl_sort      INT;
BEGIN
  SELECT id INTO unilag_id FROM public.universities WHERE short_name = 'UNILAG';
  IF unilag_id IS NULL THEN RETURN; END IF;

  FOR dept_id, dept_name IN
    SELECT id, name FROM public.departments WHERE university_id = unilag_id
  LOOP
    -- Only Computer Science is a 4-year programme (100–400 Level)
    -- All others run to 500 Level
    IF dept_name = 'Computer Science' THEN
      max_level_val := 400;
    ELSE
      max_level_val := 500;
    END IF;

    FOR lvl_id, lvl_sort IN
      SELECT l.id, l.sort_order
      FROM public.levels l
      WHERE l.sort_order <= max_level_val
      ORDER BY l.sort_order
    LOOP
      INSERT INTO public.department_levels (department_id, level_id)
      VALUES (dept_id, lvl_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;

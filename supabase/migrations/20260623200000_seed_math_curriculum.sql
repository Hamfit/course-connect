-- ============================================================
-- Seed Mathematics Department and Curriculum
-- ============================================================
DO $$
DECLARE
  unilag_id UUID;
  math_dept_id UUID;
  lvl_id UUID;
  lvl_sort INT;
BEGIN
  SELECT id INTO unilag_id FROM public.universities WHERE short_name = 'UNILAG';
  IF unilag_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.departments WHERE name = 'Mathematics' AND university_id = unilag_id) THEN
      INSERT INTO public.departments (name, university_id)
      VALUES ('Mathematics', unilag_id);
    END IF;
    SELECT id INTO math_dept_id FROM public.departments WHERE university_id = unilag_id AND name = 'Mathematics';
    
    IF math_dept_id IS NOT NULL THEN
      FOR lvl_id, lvl_sort IN
        SELECT id, sort_order FROM public.levels WHERE sort_order <= 400 ORDER BY sort_order
      LOOP
        INSERT INTO public.department_levels (department_id, level_id)
        VALUES (math_dept_id, lvl_id)
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END IF;
END;
$$;

-- Helper Function to Seed Courses
CREATE OR REPLACE FUNCTION public.seed_course_helper(
  p_uni_short TEXT,
  p_dept_name TEXT,
  p_code TEXT,
  p_title TEXT,
  p_level_sort INT,
  p_semester INT
) RETURNS VOID AS $inner$
DECLARE
  v_uni_id UUID;
  v_dept_id UUID;
  v_level_id UUID;
BEGIN
  SELECT id INTO v_uni_id FROM public.universities WHERE short_name = p_uni_short;
  IF v_uni_id IS NULL THEN RETURN; END IF;
  SELECT id INTO v_dept_id FROM public.departments WHERE university_id = v_uni_id AND name = p_dept_name;
  IF v_dept_id IS NULL THEN RETURN; END IF;
  SELECT id INTO v_level_id FROM public.levels WHERE sort_order = p_level_sort;
  IF v_level_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.courses (code, title, department_id, level_id, semester)
  VALUES (p_code, p_title, v_dept_id, v_level_id, p_semester)
  ON CONFLICT ON CONSTRAINT courses_code_department_id_key
  DO UPDATE SET title = EXCLUDED.title, level_id = EXCLUDED.level_id, semester = EXCLUDED.semester;
END;
$inner$ LANGUAGE plpgsql;

-- Call helper to seed courses
DO $$
BEGIN
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'FSC 111', 'Practice Questions', 100, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'FSC 112', 'Practice Questions', 100, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'FSC 113', 'Practice Questions', 100, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'FSC 114', 'Practice Questions', 100, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'FSC 115', 'Practice Questions', 100, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'GST 102', 'GST 102 Course', 100, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'GST 105', 'GST 105 Course', 100, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'ZLY 111', 'ZLY 111 Course', 100, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 199', 'All Courses Outline.pdf', 100, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 103', 'Complex Algebra.pdf', 100, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'CHM 102', 'CHM 102 Course', 100, 2);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MTH 102', 'Practice Questions', 100, 2);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MTH 103', 'MTH 103 Course', 100, 2);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'STA 121', 'Practice Questions', 100, 2);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'CSC 212', 'CSC 212 Course', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 234', 'Mechanics 2 - Practice Questions', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 216', 'Numerical Analysis 1', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 231', 'Real Analysis 1', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 232', 'Abstract Algebra 1', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 233', 'Mathematical Methods 1', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'CSC 211', 'Maths and Computer - Software Workshop II', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'CSC 213', 'Maths and Computer - Foundation of Sequential Programs', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'FRE 187', 'Maths and Computer - b-135 - French for Science Students-An Ancilliary French I', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'GST 201', 'Maths and Computer - _- General African Studies', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 211', 'Maths and Computer - Real Analysis I', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 212', 'Maths and Computer - Abstract Algebra I', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 213', 'Maths and Computer - Mathematical Methods I', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 299', 'Maths and Computer - Other Documents', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'PHS 216', 'Maths and Computer - Electronics IA', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'STA 211', 'Probability Theory', 200, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'STA 212', 'Statistics -', 200, 2);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'STA 222', 'Statistics -', 200, 2);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'STA 201', 'Statistics', 200, 2);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 202', 'Real Analysis 2 ---  PQ and Solutions .pdf', 200, 2);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 399', 'Abstract', 300, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 302', 'Complex Analysis', 300, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 303', 'Past Questions - Abstract Algebra 2', 300, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'STA 301', 'Past Questions - Statistical Concepts and  Methods', 300, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'CSC 410', 'CSC 410 Course', 400, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 499', 'Notes & materials - Differential Equation', 400, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'MAT 402', 'Past Questions - Functional Analysis', 400, 1);
  PERFORM public.seed_course_helper('UNILAG', 'Mathematics', 'STA 401', 'Statistics - First Semester', 400, 1);
END;
$$;

-- Clean up helper
DROP FUNCTION public.seed_course_helper(TEXT, TEXT, TEXT, TEXT, INT, INT);
-- ============================================================
-- 1. Extend Computer Science Department levels to 500 Level (UNILAG)
-- 2. Seed Computer Science Course Curriculum (100L to 500L)
-- 3. Create Admin Upload Auto-Approval Trigger
-- ============================================================

-- Step 1: Map Computer Science to 500 Level in department_levels
DO $$
DECLARE
  unilag_id UUID;
  cs_dept_id UUID;
  lvl_500_id UUID;
BEGIN
  SELECT id INTO unilag_id FROM public.universities WHERE short_name = 'UNILAG';
  
  IF unilag_id IS NOT NULL THEN
    SELECT id INTO cs_dept_id FROM public.departments 
    WHERE university_id = unilag_id AND name = 'Computer Science';
    
    SELECT id INTO lvl_500_id FROM public.levels WHERE sort_order = 500;
    
    IF cs_dept_id IS NOT NULL AND lvl_500_id IS NOT NULL THEN
      INSERT INTO public.department_levels (department_id, level_id)
      VALUES (cs_dept_id, lvl_500_id)
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
END;
$$;

-- Step 2: Seed Course Curriculum using helper function
CREATE OR REPLACE FUNCTION public.seed_course_helper(
  p_uni_short TEXT,
  p_dept_name TEXT,
  p_code TEXT,
  p_title TEXT,
  p_level_sort INT,
  p_semester INT
) RETURNS VOID AS $$
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

  INSERT INTO public.courses (title, code, department_id, level_id, semester)
  VALUES (p_title, p_code, v_dept_id, v_level_id, p_semester)
  ON CONFLICT (code, department_id) DO UPDATE
  SET title = EXCLUDED.title, level_id = EXCLUDED.level_id, semester = EXCLUDED.semester;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Year 1 (100 Level) - First Semester
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'COS 101', 'Introduction to Computer Science', 100, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'FSC 101', 'Foundation Science I', 100, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'GST 111', 'Communication in English', 100, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 103', 'Introduction to Computer Science and Problem Solving', 100, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CYB 105', 'Introduction to Cybersecurity', 100, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'MTH 101', 'General Mathematics I', 100, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'PHY 101', 'General Physics I', 100, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'PHY 107', 'General Physics Laboratory I', 100, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'STA 111', 'Introduction to Statistics I', 100, 1);

-- Year 1 (100 Level) - Second Semester
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'COS 102', 'Computer Programming II', 100, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'COS 106', 'Introduction to Computer Systems', 100, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 104', 'Programming and Algorithms', 100, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CYB 106', 'Basic Cybersecurity Concepts', 100, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'FSC 102', 'Foundation Science II', 100, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'GST 112', 'Philosophy and Logic', 100, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'MTH 102', 'General Mathematics II', 100, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'PHY 102', 'General Physics II', 100, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'PHY 108', 'General Physics Laboratory II', 100, 2);

-- Year 2 (200 Level) - First Semester
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'COS 201', 'Computer Science I', 200, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 203', 'Computer Architecture', 200, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'DTS 201', 'Data Science Introduction', 200, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'ENT 211', 'Entrepreneurship', 200, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'ICT 201', 'Information and Communication Technology I', 200, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'IFT 211', 'Information Technology Foundations', 200, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 205', 'Operating Systems / Unix', 200, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'MTH 201', 'Mathematical Methods I', 200, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'SEN 201', 'Software Engineering I', 200, 1);

-- Year 2 (200 Level) - Second Semester
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'COS 202', 'Computer Science II', 200, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'COS 203', 'Computer Logic', 200, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 224', 'Data Structures & Algorithms', 200, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'DTS 204', 'Data Analysis', 200, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'GST 212', 'Social Science / African Studies', 200, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'INS 202', 'Information Systems I', 200, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'INS 204', 'Information Systems II', 200, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 210', 'Computer Hardware', 200, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'MTH 202', 'Mathematical Methods II', 200, 2);

-- Year 3 (300 Level) - First Semester
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 310', 'Operating Systems', 300, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 311', 'Operations Research', 300, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 313', 'Object-Oriented Programming', 300, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 314', 'Computer Architecture', 300, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 315', 'Theory of Computation', 300, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 316', 'Compiler Construction', 300, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 321', 'Systems Programming', 300, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'FSC 301', 'Entrepreneurship', 300, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'GST 307', 'Entrepreneurship and Corporate Governance', 300, 1);

-- Year 3 (300 Level) - Second Semester
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 320', 'Design & Analysis of Algorithms', 300, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 322', 'Software Engineering', 300, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 323', 'Computer Networks', 300, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 324', 'System Analysis & Design', 300, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 326', 'Structured Programming', 300, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 327', 'Computer Graphics', 300, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 328', 'Artificial Intelligence', 300, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'MAT 222', 'Linear Algebra II', 300, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'STA 222', 'Probability and Statistics II', 300, 2);

-- Year 4 (400 Level) - First Semester (Note: Year 4 second semester is reserved for SIWES/IT placement)
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 410', 'Database Design', 400, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 413', 'Discrete Mathematics', 400, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 416', 'Software Project Management', 400, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 419', 'Software Design', 400, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 434', 'Web Technologies', 400, 1);

-- Year 5 (500 Level) - First Semester
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 510', 'Special Topics in Computer Science', 500, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 511', 'Advanced Software Engineering', 500, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 512', 'Neural Networks & Deep Learning', 500, 1);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 513', 'Computer Vision', 500, 1);

-- Year 5 (500 Level) - Second Semester
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 522', 'Advanced Database Systems', 500, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 523', 'Advanced Computer Networks', 500, 2);
SELECT public.seed_course_helper('UNILAG', 'Computer Science', 'CSC 528', 'Distributed Systems', 500, 2);

-- Clean up helper function
DROP FUNCTION public.seed_course_helper(TEXT, TEXT, TEXT, TEXT, INT, INT);

-- Step 3: Admin auto-approval mechanism
CREATE OR REPLACE FUNCTION public.auto_approve_admin_materials()
RETURNS TRIGGER AS $$
BEGIN
  -- If uploader is an admin or moderator, automatically approve
  IF public.has_role(NEW.uploaded_by, 'admin') OR public.has_role(NEW.uploaded_by, 'moderator') THEN
    NEW.status := 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists to avoid conflict
DROP TRIGGER IF EXISTS on_material_insert_auto_approve ON public.materials;

-- Attach the BEFORE INSERT trigger to materials table
CREATE TRIGGER on_material_insert_auto_approve
  BEFORE INSERT ON public.materials
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_admin_materials();

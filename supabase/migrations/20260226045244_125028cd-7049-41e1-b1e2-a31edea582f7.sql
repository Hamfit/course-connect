
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Material status enum
CREATE TYPE public.material_status AS ENUM ('pending', 'approved', 'rejected');

-- Material type enum
CREATE TYPE public.material_type AS ENUM ('pdf', 'video', 'image', 'text');

-- Universities
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  short_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Universities are publicly readable" ON public.universities FOR SELECT USING (true);

-- Departments
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, university_id)
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Departments are publicly readable" ON public.departments FOR SELECT USING (true);

-- Levels
CREATE TABLE public.levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Levels are publicly readable" ON public.levels FOR SELECT USING (true);

-- Courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  level_id UUID NOT NULL REFERENCES public.levels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(code, department_id)
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses are publicly readable" ON public.courses FOR SELECT USING (true);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  university_id UUID REFERENCES public.universities(id),
  department_id UUID REFERENCES public.departments(id),
  level_id UUID REFERENCES public.levels(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are publicly readable" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Materials
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type material_type NOT NULL,
  file_url TEXT,
  content TEXT,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status material_status NOT NULL DEFAULT 'pending',
  downloads INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved materials are publicly readable" ON public.materials FOR SELECT USING (status = 'approved' OR auth.uid() = uploaded_by);
CREATE POLICY "Authenticated users can upload" ON public.materials FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "Users can update own materials" ON public.materials FOR UPDATE USING (auth.uid() = uploaded_by);
CREATE POLICY "Users can delete own materials" ON public.materials FOR DELETE USING (auth.uid() = uploaded_by);
-- Admins can update any material (for approval)
CREATE POLICY "Admins can update all materials" ON public.materials FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- Auto-create profile and role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for materials
INSERT INTO storage.buckets (id, name, public) VALUES ('materials', 'materials', true);

CREATE POLICY "Anyone can read materials files" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
CREATE POLICY "Authenticated users can upload materials files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own material files" ON storage.objects FOR DELETE USING (bucket_id = 'materials' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Seed levels
INSERT INTO public.levels (name, sort_order) VALUES
  ('100 Level', 100),
  ('200 Level', 200),
  ('300 Level', 300),
  ('400 Level', 400),
  ('500 Level', 500),
  ('600 Level', 600);

-- Seed universities
INSERT INTO public.universities (name, short_name) VALUES
  ('University of Lagos', 'UNILAG'),
  ('University of Ibadan', 'UI'),
  ('Obafemi Awolowo University', 'OAU'),
  ('University of Nigeria, Nsukka', 'UNN'),
  ('Ahmadu Bello University', 'ABU'),
  ('University of Benin', 'UNIBEN'),
  ('Federal University of Technology, Minna', 'FUTMinna'),
  ('Covenant University', 'CU'),
  ('Lagos State University', 'LASU'),
  ('University of Ilorin', 'UNILORIN');

-- Seed departments for each university (a common set)
DO $$
DECLARE
  uni_id UUID;
  dept_names TEXT[] := ARRAY['Computer Science', 'Electrical Engineering', 'Medicine & Surgery', 'Accounting', 'Economics', 'Law', 'Mechanical Engineering', 'Biochemistry', 'Mass Communication', 'Business Administration'];
  dept TEXT;
BEGIN
  FOR uni_id IN SELECT id FROM public.universities LOOP
    FOREACH dept IN ARRAY dept_names LOOP
      INSERT INTO public.departments (name, university_id) VALUES (dept, uni_id);
    END LOOP;
  END LOOP;
END;
$$;

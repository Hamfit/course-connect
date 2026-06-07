-- Add verification columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verification_rejection_reason TEXT;

-- Create verification check trigger function
CREATE OR REPLACE FUNCTION public.check_profile_verification_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If verification_status is changing to 'approved' and the current user is not an admin, raise an error or force it to 'pending'
  IF NEW.verification_status = 'approved' AND (OLD.verification_status IS DISTINCT FROM 'approved') THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.verification_status := 'pending';
    END IF;
  END IF;
  
  -- If any school info or ID changes, reset verification_status to 'pending' unless it is already approved or is being updated by an admin
  IF (OLD.university_id IS DISTINCT FROM NEW.university_id OR
      OLD.department_id IS DISTINCT FROM NEW.department_id OR
      OLD.level_id IS DISTINCT FROM NEW.level_id OR
      OLD.identification_url IS DISTINCT FROM NEW.identification_url) AND NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.verification_status := 'pending';
    NEW.verification_rejection_reason := NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on profiles
DROP TRIGGER IF EXISTS tr_check_profile_verification_update ON public.profiles;
CREATE TRIGGER tr_check_profile_verification_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_verification_update();

-- Create storage buckets if they do not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('identifications', 'identifications', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- RLS policies for identifications bucket
DROP POLICY IF EXISTS "Admins can read identification documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read identification documents" ON storage.objects;
CREATE POLICY "Anyone can read identification documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'identifications');

DROP POLICY IF EXISTS "Users can upload own identification documents" ON storage.objects;
CREATE POLICY "Users can upload own identification documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'identifications' AND auth.role() = 'authenticated');

-- RLS policies for avatars bucket
DROP POLICY IF EXISTS "Anyone can read avatars" ON storage.objects;
CREATE POLICY "Anyone can read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload own avatars" ON storage.objects;
CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- RLS policy for profiles table update by admins
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

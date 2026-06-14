-- 1. Clean up orphaned user agreements (if any) and add foreign key constraint with cascade delete
DELETE FROM public.user_agreements
WHERE user_id NOT IN (SELECT id FROM auth.users);

ALTER TABLE public.user_agreements
  DROP CONSTRAINT IF EXISTS fk_user_agreements_user_id;

ALTER TABLE public.user_agreements
  ADD CONSTRAINT fk_user_agreements_user_id
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Update the handle_new_user trigger function to atomically register agreements from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile row
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  -- Create user role row
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  -- Atomically register user agreements if agreed_to_terms metadata exists
  IF NEW.raw_user_meta_data->>'agreed_to_terms' = 'true' THEN
    INSERT INTO public.user_agreements (
      user_id, 
      agreed_privacy, 
      agreed_terms, 
      agreed_copyright, 
      agreed_community_guidelines, 
      signup_method, 
      agreed_at
    ) VALUES (
      NEW.id,
      COALESCE((NEW.raw_user_meta_data->>'agreed_privacy')::boolean, true),
      true,
      COALESCE((NEW.raw_user_meta_data->>'agreed_copyright')::boolean, true),
      COALESCE((NEW.raw_user_meta_data->>'agreed_community_guidelines')::boolean, true),
      COALESCE(NEW.raw_user_meta_data->>'signup_method', 'email'),
      COALESCE((NEW.raw_user_meta_data->>'agreed_at')::timestamptz, now())
    ) ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TABLE public.user_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  agreed_privacy BOOLEAN NOT NULL DEFAULT false,
  agreed_terms BOOLEAN NOT NULL DEFAULT false,
  agreed_copyright BOOLEAN NOT NULL DEFAULT false,
  agreed_community_guidelines BOOLEAN NOT NULL DEFAULT false,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  signup_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agreement"
ON public.user_agreements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all agreements"
ON public.user_agreements FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own agreement"
ON public.user_agreements FOR INSERT
WITH CHECK (auth.uid() = user_id);

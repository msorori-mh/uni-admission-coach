
-- Create moderator_permissions table
CREATE TABLE public.moderator_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);

ALTER TABLE public.moderator_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all permissions
CREATE POLICY "Admins can manage permissions"
ON public.moderator_permissions
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Moderators can view their own permissions
CREATE POLICY "Moderators can view own permissions"
ON public.moderator_permissions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create has_permission function
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.moderator_permissions
      WHERE user_id = _user_id
        AND permission = _permission
    );
$$;

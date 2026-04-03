
-- 1. Subscription Plans
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  duration_type TEXT NOT NULL DEFAULT 'semester',
  duration_months INTEGER NOT NULL DEFAULT 5,
  price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'YER',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Use trigger for duration_type validation instead of CHECK
CREATE OR REPLACE FUNCTION public.validate_duration_type()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.duration_type NOT IN ('semester', 'annual') THEN
    RAISE EXCEPTION 'duration_type must be semester or annual';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_subscription_plan_duration
  BEFORE INSERT OR UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.validate_duration_type();

CREATE TRIGGER set_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage plans"
  ON public.subscription_plans FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Payment Methods
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  account_name TEXT,
  account_number TEXT,
  details TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_payment_method_type()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.type NOT IN ('bank', 'exchange') THEN
    RAISE EXCEPTION 'type must be bank or exchange';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_payment_method_type_trigger
  BEFORE INSERT OR UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.validate_payment_method_type();

CREATE TRIGGER set_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active methods"
  ON public.payment_methods FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage methods"
  ON public.payment_methods FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'pending',
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_subscription_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'active', 'expired', 'cancelled') THEN
    RAISE EXCEPTION 'status must be pending, active, expired, or cancelled';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_subscription_status_trigger
  BEFORE INSERT OR UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.validate_subscription_status();

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can manage subscriptions"
  ON public.subscriptions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Payment Requests
CREATE TABLE public.payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  payment_method_id UUID REFERENCES public.payment_methods(id),
  plan_id UUID REFERENCES public.subscription_plans(id),
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'YER',
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.validate_payment_request_status()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'status must be pending, approved, or rejected';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_payment_request_status_trigger
  BEFORE INSERT OR UPDATE ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.validate_payment_request_status();

CREATE INDEX idx_payment_requests_status ON public.payment_requests(status);
CREATE INDEX idx_payment_requests_user_id ON public.payment_requests(user_id);

ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment requests"
  ON public.payment_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users can create own payment requests"
  ON public.payment_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage payment requests"
  ON public.payment_requests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. has_active_subscription function
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id UUID)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- 6. Notify admins on pending payment trigger
CREATE OR REPLACE FUNCTION public.notify_admins_on_pending_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  v_admin RECORD;
  v_student_name TEXT;
  v_amount TEXT;
BEGIN
  IF NEW.status <> 'pending' THEN RETURN NEW; END IF;

  SELECT CONCAT_WS(' ', s.first_name, s.second_name, s.third_name, s.fourth_name)
    INTO v_student_name
    FROM public.students s
    WHERE s.user_id = NEW.user_id
    LIMIT 1;

  v_amount := NEW.amount::text || ' ' || NEW.currency;

  FOR v_admin IN SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'admin' LOOP
    INSERT INTO public.notifications (user_id, title, message, type)
    VALUES (
      v_admin.user_id,
      'طلب دفع جديد',
      'طلب دفع بمبلغ ' || v_amount || ' من: ' || COALESCE(v_student_name, 'طالب غير معروف'),
      'info'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_pending_payment_request
  AFTER INSERT ON public.payment_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_admins_on_pending_payment();

-- 7. Storage bucket for receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', true);

CREATE POLICY "Users can upload receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

CREATE POLICY "Users can update own receipts"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

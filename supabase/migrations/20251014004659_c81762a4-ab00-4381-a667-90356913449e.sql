-- Create audit log table for tracking admin actions
CREATE TABLE public.admin_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  before_json JSONB,
  after_json JSONB,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_log_entity ON public.admin_audit_log(entity_type, entity_id);

-- Enable RLS
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add verification fields to lawyer_profiles
ALTER TABLE public.lawyer_profiles
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS bar_number TEXT,
ADD COLUMN IF NOT EXISTS verification_documents TEXT[],
ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Create firms table
CREATE TABLE IF NOT EXISTS public.firms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  firm_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  plan TEXT DEFAULT 'standard',
  discount_percentage NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.firms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage firms"
ON public.firms
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Add firm association to lawyer profiles
ALTER TABLE public.lawyer_profiles
ADD COLUMN IF NOT EXISTS firm_id UUID REFERENCES public.firms(id);

-- Create support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tickets"
ON public.support_tickets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all tickets"
ON public.support_tickets
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create reported items table
CREATE TABLE IF NOT EXISTS public.reported_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  action_taken TEXT,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.reported_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
ON public.reported_items
FOR INSERT
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can manage reports"
ON public.reported_items
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create settings table for admin configurations
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
ON public.admin_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updating firms updated_at
CREATE TRIGGER update_firms_updated_at
BEFORE UPDATE ON public.firms
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add indexes for performance
CREATE INDEX idx_lawyer_profiles_verified ON public.lawyer_profiles(verified);
CREATE INDEX idx_lawyer_profiles_status ON public.lawyer_profiles(verification_status);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_reported_items_status ON public.reported_items(status);
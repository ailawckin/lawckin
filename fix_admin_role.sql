-- Add admin role for user
INSERT INTO public.user_roles (user_id, role)
VALUES ('a6c35236-6540-421e-bf1e-4e03c6a1688d', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING
RETURNING *;

-- Verify it was added
SELECT 
  ur.*,
  u.email
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.user_id = 'a6c35236-6540-421e-bf1e-4e03c6a1688d';

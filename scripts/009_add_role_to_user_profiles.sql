-- Migration: Add role field to user_profiles table
-- This allows users to have admin role for accessing admin features

ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_role 
  ON public.user_profiles(role) 
  WHERE role = 'admin';



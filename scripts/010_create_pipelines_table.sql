-- Migration: Create pipelines table
-- This table stores custom pipeline metadata
-- The custom_pipeline_mappings table references pipelines by name

-- ============================================================================
-- Create pipelines table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Pipeline details
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_pipelines_name 
  ON public.pipelines(name);
  
CREATE INDEX IF NOT EXISTS idx_pipelines_created_at 
  ON public.pipelines(created_at DESC);

-- Add updated_at trigger
DROP TRIGGER IF EXISTS update_pipelines_updated_at ON public.pipelines;
CREATE TRIGGER update_pipelines_updated_at
  BEFORE UPDATE ON public.pipelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();



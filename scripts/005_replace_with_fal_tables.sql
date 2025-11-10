-- Migration: Replace old pipelines/generations with new fal_generations/fal_presets structure
-- This migration drops old tables and creates new ones optimized for fal.ai tracking

-- ============================================================================
-- STEP 1: Drop old tables (CASCADE will handle dependent objects)
-- ============================================================================

DROP TABLE IF EXISTS public.generations CASCADE;
DROP TABLE IF EXISTS public.pipelines CASCADE;

-- ============================================================================
-- STEP 2: Create fal_presets table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.fal_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Preset details
  name TEXT NOT NULL,
  description TEXT,
  model_id TEXT NOT NULL,
  input_template JSONB NOT NULL, -- Template with placeholders like {{image_url}}
  credit_cost INTEGER NOT NULL,
  
  -- Preview images
  image_before TEXT,
  image_after TEXT,
  
  -- Metadata
  is_public BOOLEAN DEFAULT false, -- Allow others to use this preset
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fal_presets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fal_presets
CREATE POLICY "fal_presets_select_public_or_own"
  ON public.fal_presets FOR SELECT
  USING (is_public = true OR owner_id = auth.uid());

CREATE POLICY "fal_presets_insert_own"
  ON public.fal_presets FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "fal_presets_update_own"
  ON public.fal_presets FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "fal_presets_delete_own"
  ON public.fal_presets FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Indexes for fal_presets
CREATE INDEX IF NOT EXISTS idx_fal_presets_owner 
  ON public.fal_presets(owner_id);
  
CREATE INDEX IF NOT EXISTS idx_fal_presets_public 
  ON public.fal_presets(is_public, created_at DESC) 
  WHERE is_public = true;

-- Trigger to automatically set owner_id on insert (like old pipelines table)
CREATE OR REPLACE FUNCTION public.set_fal_preset_owner_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.owner_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_fal_preset_owner_id_before_insert ON public.fal_presets;
CREATE TRIGGER set_fal_preset_owner_id_before_insert
  BEFORE INSERT ON public.fal_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_fal_preset_owner_id();

-- ============================================================================
-- STEP 3: Create fal_generations table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.fal_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- fal.ai tracking
  model_id TEXT NOT NULL,
  request_id TEXT, -- fal.ai request ID (nullable, set after submission)
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  error TEXT,
  
  -- Input/Output data
  input_data JSONB NOT NULL, -- All input parameters including image URLs
  output_data JSONB, -- Full response from fal.ai
  image_urls TEXT[], -- Array of final image URLs (after copying to our hosting)
  
  -- Cost tracking
  credit_cost INTEGER NOT NULL,
  
  -- Optional references
  preset_id UUID REFERENCES public.fal_presets(id) ON DELETE SET NULL,
  
  -- Pipeline grouping (set at execution time)
  pipeline_type TEXT, -- e.g., 'cloth-replacement', 'simple', 'custom'
  pipeline_id UUID, -- Groups related generations together
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fal_generations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fal_generations
CREATE POLICY "fal_generations_select_own"
  ON public.fal_generations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "fal_generations_insert_own"
  ON public.fal_generations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "fal_generations_update_all"
  ON public.fal_generations FOR UPDATE
  USING (true);

-- Indexes for fal_generations
CREATE INDEX IF NOT EXISTS idx_fal_generations_user_id 
  ON public.fal_generations(user_id, created_at DESC);
  
CREATE INDEX IF NOT EXISTS idx_fal_generations_status 
  ON public.fal_generations(status) 
  WHERE status IN ('pending', 'processing');
  
CREATE INDEX IF NOT EXISTS idx_fal_generations_request_id 
  ON public.fal_generations(request_id) 
  WHERE request_id IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_fal_generations_pipeline 
  ON public.fal_generations(pipeline_id, pipeline_type) 
  WHERE pipeline_id IS NOT NULL;
  
CREATE INDEX IF NOT EXISTS idx_fal_generations_preset_id 
  ON public.fal_generations(preset_id) 
  WHERE preset_id IS NOT NULL;

-- ============================================================================
-- STEP 4: Add updated_at trigger function (if not exists)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 5: Add updated_at triggers
-- ============================================================================

DROP TRIGGER IF EXISTS update_fal_presets_updated_at ON public.fal_presets;
CREATE TRIGGER update_fal_presets_updated_at
  BEFORE UPDATE ON public.fal_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_fal_generations_updated_at ON public.fal_generations;
CREATE TRIGGER update_fal_generations_updated_at
  BEFORE UPDATE ON public.fal_generations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


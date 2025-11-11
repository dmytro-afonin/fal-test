-- Migration: Create custom_pipeline_mappings table
-- This table stores simple mappings between custom pipelines, actions, and presets
-- Allows mapping which action relates to which preset for each custom pipeline
-- When presets are updated, all pipelines using them will automatically use the updated versions

-- ============================================================================
-- Create custom_pipeline_mappings table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.custom_pipeline_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Pipeline mapping details
  pipeline_name TEXT NOT NULL,
  action_name TEXT NOT NULL,
  preset_id UUID NOT NULL REFERENCES public.fal_presets(id) ON DELETE CASCADE,
  
  -- Ensure unique action names per pipeline
  UNIQUE(pipeline_name, action_name)
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_custom_pipeline_mappings_pipeline 
  ON public.custom_pipeline_mappings(pipeline_name);
  
CREATE INDEX IF NOT EXISTS idx_custom_pipeline_mappings_preset 
  ON public.custom_pipeline_mappings(preset_id);


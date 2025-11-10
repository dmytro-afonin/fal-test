-- Seed: Apply Outfit Preset
-- Temporarily disable trigger to allow manual owner_id
ALTER TABLE public.fal_presets DISABLE TRIGGER set_fal_preset_owner_id_before_insert;

INSERT INTO public.fal_presets (
  owner_id,
  name,
  description,
  model_id,
  input_template,
  credit_cost,
  image_before,
  image_after,
  is_public
) VALUES (
  '7dded5a6-72e4-44db-b95e-cac3418431a8'::uuid,
  'Apply Outfit',
  'Apply clothing from one image onto a character in another image using Qwen Image Edit with LoRA',
  'fal-ai/qwen-image-edit-plus-lora',
  jsonb_build_object(
    'prompt', 'change wearing clothes to clothes from second image',
    'negative_prompt', 'blurry, low quality, low resolution, bad anatomy, deformed, distorted, extra limbs, missing limbs, extra fingers, fused fingers, text, watermark, logo, artifacts, overexposed, underexposed, grainy',
    'loras', jsonb_build_array(
      jsonb_build_object(
        'path', 'https://huggingface.co/WILDFAL/odevalka/resolve/main/Try_On_Qwen_Edit_Lora.safetensors?download=true',
        'scale', 1.0
      )
    )
  ),
  40,
  NULL,
  NULL,
  true
) ON CONFLICT DO NOTHING;

-- Re-enable trigger
ALTER TABLE public.fal_presets ENABLE TRIGGER set_fal_preset_owner_id_before_insert;


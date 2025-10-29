-- Create generations table to store user-generated results
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id)
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  input_image_url text not null,
  output_image_url text,
  status text not null default 'pending',
  error text,
  created_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.generations enable row level security;

-- Allow anyone to view their own generations
create policy "generations_select_all"
  on public.generations for select
  using (true);

-- Allow anyone to insert generations
create policy "generations_insert_all"
  on public.generations for insert
  with check (true);

-- Create index for faster queries
create index if not exists generations_pipeline_id_idx on public.generations(pipeline_id);
create index if not exists generations_created_at_idx on public.generations(created_at desc);
create index if not exists pipelines_user_id_idx on public.pipelines (user_id);

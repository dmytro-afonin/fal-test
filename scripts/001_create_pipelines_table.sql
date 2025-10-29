-- Create pipelines table to store AI model configurations
create table if not exists public.pipelines (
  id uuid primary key default gen_random_uuid (),
  owner_id uuid not null references auth.users(id),
  name text not null,
  description text not null,
  model_id text not null,
  prompt text,
  config jsonb default '{}'::jsonb,
  before_image_url text not null,
  after_image_url text not null,
  credit_cost INTEGER not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.pipelines enable row level security;

-- Allow anyone to view pipelines (public gallery)
create policy "pipelines_select_all" on public.pipelines for
select
  using (true);

-- Allow only owners to insert/update/delete
create policy "pipelines_insert_owner" on public.pipelines for insert to authenticated
with
  check (
    (
      owner_id = (
        select
          auth.uid ()
      )
    )
  );

create policy "pipelines_update_owner" on public.pipelines
for update
  to authenticated using (
    (
      owner_id = (
        select
          auth.uid ()
      )
    )
  )
with
  check (
    (
      owner_id = (
        select
          auth.uid ()
      )
    )
  );

create policy "pipelines_delete_owner" on public.pipelines for delete to authenticated using (
  (
    owner_id = (
      select
        auth.uid ()
    )
  )
);

create or replace function public.set_owner_id()
returns trigger as $$
begin
  new.owner_id := auth.uid();
  return new;
end;
$$ language plpgsql security definer;

create trigger set_owner_id_before_insert
before insert on public.pipelines
for each row
execute function public.set_owner_id();

create index if not exists pipelines_created_at_idx on public.pipelines (created_at desc);
create index if not exists pipelines_owner_id_idx on public.pipelines (owner_id desc);
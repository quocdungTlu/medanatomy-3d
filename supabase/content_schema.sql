-- MedAnatomy 3D — bảng nội dung (Phase 2). Chạy trong Supabase SQL editor sau schema.sql.
-- Nguồn sự thật vẫn là content/*.json trong Git; bảng này là bản đồng bộ để app/AI/cố vấn truy vấn.
-- Ghi: chỉ qua SQL editor / service role. Đọc: công khai (nội dung giáo dục, không có dữ liệu người dùng).

create table if not exists public.sources (
  id text primary key,
  kind text not null,
  title text not null,
  authors text[],
  journal text,
  publisher text,
  year int,
  doi text,
  url text not null,
  license text not null check (license in ('open','cite')),
  cited_by int,
  note text
);

create table if not exists public.structures (
  id text primary key,
  system text not null,
  mesh_names text[] not null,
  name_vi text not null,
  name_latin text not null,
  name_latin_ta2 text,
  name_en text,
  grp text not null,
  layer int not null,
  description text not null,
  "function" text not null,
  clinical text,
  mnemonic text,
  source text,
  reviewed_by text,
  reviewed_at date,
  updated_at timestamptz not null default now()
);

create table if not exists public.structure_sources (
  structure_id text references public.structures(id) on delete cascade,
  source_id text references public.sources(id) on delete restrict,
  primary key (structure_id, source_id)
);

create table if not exists public.questions (
  id text primary key,
  system text not null,
  type text not null check (type in ('click','name')),
  prompt text,
  target_structure_id text not null references public.structures(id) on delete cascade,
  distractor_ids text[],
  difficulty int not null default 1 check (difficulty between 1 and 3),
  tags text[] not null default '{}'
);

create table if not exists public.content_versions (
  id bigserial primary key,
  system text not null,
  version text not null,
  git_sha text,
  n_structures int not null,
  n_questions int not null,
  n_sources int not null,
  synced_at timestamptz not null default now()
);

alter table public.sources enable row level security;
alter table public.structures enable row level security;
alter table public.structure_sources enable row level security;
alter table public.questions enable row level security;
alter table public.content_versions enable row level security;

do $$
declare t text;
begin
  foreach t in array array['sources','structures','structure_sources','questions','content_versions'] loop
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
  end loop;
end $$;

create index if not exists questions_target_idx on public.questions (target_structure_id);
create index if not exists structure_sources_src_idx on public.structure_sources (source_id);

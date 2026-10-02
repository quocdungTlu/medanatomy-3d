-- Chạy trong Supabase SQL editor. RLS: mỗi người chỉ đọc/ghi dữ liệu của mình.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  school text,
  year smallint,
  created_at timestamptz not null default now()
);

create table if not exists public.quiz_sessions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  system text not null,
  score smallint not null,
  total smallint not null,
  duration_s integer not null,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists quiz_sessions_user_idx on public.quiz_sessions(user_id, created_at desc);

create table if not exists public.content_reports (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  structure_id text not null,
  message text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.survey_responses (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  question_key text not null,
  answer text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.quiz_sessions enable row level security;
alter table public.content_reports enable row level security;
alter table public.survey_responses enable row level security;

create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own sessions" on public.quiz_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
-- Báo lỗi và khảo sát: ai cũng gửi được (kể cả ẩn danh), chỉ chủ sở hữu đọc lại
create policy "insert reports" on public.content_reports for insert with check (true);
create policy "read own reports" on public.content_reports for select using (auth.uid() = user_id);
create policy "insert survey" on public.survey_responses for insert with check (true);
create policy "read own survey" on public.survey_responses for select using (auth.uid() = user_id);

-- Tự tạo profile khi có user mới
create or replace function public.handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name) values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

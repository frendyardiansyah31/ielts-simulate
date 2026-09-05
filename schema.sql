-- =========================================================
-- IELTS Reading Simulator — MVP Schema (Supabase / Postgres)
-- =========================================================

-- ---------- ENUMS ----------
create type user_role as enum ('admin', 'user');
create type test_status as enum ('draft', 'published');
create type attempt_status as enum ('in_progress', 'submitted');
create type question_type as enum (
  'multiple_choice',
  'true_false_notgiven',
  'matching_headings',
  'matching_information',
  'summary_completion',
  'short_answer'
);

-- ---------- PROFILES ----------
-- Extends auth.users with app-specific role info
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'user',
  created_at timestamptz not null default now()
);

-- Auto-create profile row when a new auth user signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- READING TESTS ----------
create table reading_tests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  time_limit_minutes int not null default 60,
  status test_status not null default 'draft',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- READING PASSAGES ----------
create table reading_passages (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references reading_tests(id) on delete cascade,
  passage_number int not null check (passage_number between 1 and 3),
  title text not null,
  content text not null,
  word_count int not null default 0,
  created_at timestamptz not null default now(),
  unique (test_id, passage_number)
);

-- ---------- READING QUESTIONS ----------
-- question_data structure varies by `type` — validated at the app layer (Zod), not in Postgres.
-- test_id is denormalized from passage_id (kept in sync by trigger below) so that
-- question_number can be enforced unique across the whole test (1-40), not just per passage.
create table reading_questions (
  id uuid primary key default gen_random_uuid(),
  passage_id uuid not null references reading_passages(id) on delete cascade,
  test_id uuid not null references reading_tests(id) on delete cascade,
  question_number int not null,
  type question_type not null,
  question_data jsonb not null,
  explanation text,
  created_at timestamptz not null default now(),
  unique (test_id, question_number)
);

-- Keep reading_questions.test_id in sync with its passage's test_id
create function public.sync_question_test_id()
returns trigger as $$
begin
  select test_id into new.test_id
  from reading_passages
  where id = new.passage_id;

  if new.test_id is null then
    raise exception 'passage_id % tidak ditemukan / tidak punya test_id', new.passage_id;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_sync_question_test_id
  before insert or update of passage_id on reading_questions
  for each row execute procedure public.sync_question_test_id();

-- ---------- USER ATTEMPTS ----------
create table user_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  test_id uuid not null references reading_tests(id) on delete cascade,
  status attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  raw_score int,
  band_score_estimate numeric(2,1),
  created_at timestamptz not null default now()
);

-- ---------- USER ANSWERS ----------
create table user_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references user_attempts(id) on delete cascade,
  question_id uuid not null references reading_questions(id) on delete cascade,
  user_answer jsonb not null,
  is_correct boolean,
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

-- ---------- INDEXES ----------
create index idx_passages_test_id on reading_passages(test_id);
create index idx_questions_passage_id on reading_questions(passage_id);
create index idx_questions_test_id on reading_questions(test_id);
create index idx_attempts_user_id on user_attempts(user_id);
create index idx_attempts_test_id on user_attempts(test_id);
create index idx_answers_attempt_id on user_answers(attempt_id);

-- ---------- PUBLISH VALIDATION ----------
-- Safety net at the DB layer: a test can only move to 'published' once it has
-- exactly 3 passages and every passage has at least one question. The primary,
-- user-facing validation (clear PUBLISH_BLOCKED messages) belongs in the
-- PATCH /api/admin/tests/:testId handler; this trigger is the boundary that
-- still holds even if that endpoint is bypassed via a direct Supabase client call.
create function public.validate_test_publish()
returns trigger as $$
declare
  passage_count int;
  passages_missing_questions int;
begin
  if new.status = 'published' and (old.status is distinct from 'published') then
    select count(*) into passage_count
    from reading_passages where test_id = new.id;

    if passage_count <> 3 then
      raise exception 'Test harus punya tepat 3 passage sebelum dipublish (sekarang: %)', passage_count;
    end if;

    select count(*) into passages_missing_questions
    from reading_passages p
    where p.test_id = new.id
      and not exists (
        select 1 from reading_questions q where q.passage_id = p.id
      );

    if passages_missing_questions > 0 then
      raise exception 'Ada % passage tanpa soal, tidak bisa dipublish', passages_missing_questions;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_validate_test_publish
  before update of status on reading_tests
  for each row execute procedure public.validate_test_publish();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table profiles enable row level security;
alter table reading_tests enable row level security;
alter table reading_passages enable row level security;
alter table reading_questions enable row level security;
alter table user_attempts enable row level security;
alter table user_answers enable row level security;

-- Helper: is the current user an admin?
create function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- ---------- profiles ----------
create policy "users can read own profile"
  on profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- ---------- reading_tests ----------
create policy "published tests are readable by any logged-in user"
  on reading_tests for select
  using (status = 'published' or public.is_admin());

create policy "only admin can write tests"
  on reading_tests for insert
  with check (public.is_admin());

create policy "only admin can update tests"
  on reading_tests for update
  using (public.is_admin());

create policy "only admin can delete tests"
  on reading_tests for delete
  using (public.is_admin());

-- ---------- reading_passages ----------
create policy "passages readable if parent test is published or user is admin"
  on reading_passages for select
  using (
    public.is_admin()
    or exists (
      select 1 from reading_tests t
      where t.id = reading_passages.test_id and t.status = 'published'
    )
  );

create policy "only admin can write passages"
  on reading_passages for insert
  with check (public.is_admin());

create policy "only admin can update passages"
  on reading_passages for update
  using (public.is_admin());

create policy "only admin can delete passages"
  on reading_passages for delete
  using (public.is_admin());

-- ---------- reading_questions ----------
create policy "questions readable if parent test is published or user is admin"
  on reading_questions for select
  using (
    public.is_admin()
    or exists (
      select 1 from reading_passages p
      join reading_tests t on t.id = p.test_id
      where p.id = reading_questions.passage_id and t.status = 'published'
    )
  );

create policy "only admin can write questions"
  on reading_questions for insert
  with check (public.is_admin());

create policy "only admin can update questions"
  on reading_questions for update
  using (public.is_admin());

create policy "only admin can delete questions"
  on reading_questions for delete
  using (public.is_admin());

-- ---------- user_attempts ----------
create policy "users can read own attempts"
  on user_attempts for select
  using (auth.uid() = user_id or public.is_admin());

create policy "users can create own attempts"
  on user_attempts for insert
  with check (auth.uid() = user_id);

create policy "users can update own in-progress attempts"
  on user_attempts for update
  using (auth.uid() = user_id and status = 'in_progress')
  with check (auth.uid() = user_id);
  -- WITH CHECK intentionally does NOT require status = 'in_progress' on the new
  -- row — otherwise the legitimate in_progress -> submitted transition (submit
  -- flow) would also be rejected. USING (checked against the OLD row) already
  -- blocks any update once an attempt is submitted.
  --
  -- Recommended follow-up (not implemented, optional): move "submit" (score
  -- calculation + status change) into a `security definer` Postgres function
  -- called via supabase.rpc('submit_attempt', ...), and revoke direct client
  -- UPDATE grants on raw_score/band_score_estimate/status so the client can
  -- only ever touch user_answers.user_answer while in_progress.

-- ---------- user_answers ----------
create policy "users can read own answers"
  on user_answers for select
  using (
    exists (
      select 1 from user_attempts a
      where a.id = user_answers.attempt_id and (a.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "users can write own answers"
  on user_answers for insert
  with check (
    exists (
      select 1 from user_attempts a
      where a.id = user_answers.attempt_id
        and a.user_id = auth.uid()
        and a.status = 'in_progress'
    )
  );

create policy "users can update own answers"
  on user_answers for update
  using (
    exists (
      select 1 from user_attempts a
      where a.id = user_answers.attempt_id
        and a.user_id = auth.uid()
        and a.status = 'in_progress'
    )
  );

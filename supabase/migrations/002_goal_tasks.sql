-- Goal subtasks table
create table if not exists goal_tasks (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references goals(id) on delete cascade,
  user_id text not null,
  title text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

-- RLS
alter table goal_tasks enable row level security;

create policy "Users can manage their own goal tasks"
  on goal_tasks
  for all
  using (user_id = current_setting('request.jwt.claims', true)::json->>'sub')
  with check (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Index for fast lookups
create index if not exists goal_tasks_goal_id_idx on goal_tasks(goal_id);
create index if not exists goal_tasks_user_id_idx on goal_tasks(user_id);

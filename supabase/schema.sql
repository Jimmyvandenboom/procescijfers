-- D&P: isolated tables, no client access. Only the authenticated Edge API uses service_role.
create table public.dp_settings (
 id boolean primary key default true check (id), teacher_hash text not null
);
create table public.dp_groups (
 id uuid primary key default gen_random_uuid(),
 project text not null, class_name text not null, name text not null,
 roster jsonb not null check (jsonb_array_length(roster) between 1 and 5),
 closed boolean not null default false,
 created_at timestamptz not null default now()
);
create table public.dp_submissions (
 group_id uuid not null references public.dp_groups(id) on delete cascade,
 actor_id uuid not null,
 answers jsonb not null,
 submitted_at timestamptz not null default now(),
 honesty smallint check (honesty between 1 and 4),
 teacher_comment text not null default '',
 teacher_name text not null default '',
 reviewed_at timestamptz,
 primary key (group_id, actor_id)
);
alter table public.dp_settings enable row level security;
alter table public.dp_groups enable row level security;
alter table public.dp_submissions enable row level security;
revoke all on public.dp_settings, public.dp_groups, public.dp_submissions from anon, authenticated;
grant all on public.dp_settings, public.dp_groups, public.dp_submissions to service_role;
-- Lock the group so closing and submission cannot cross. The Edge API validates the full rubric first.
create function public.dp_save_submission(p_group uuid, p_actor uuid, p_code text, p_answers jsonb)
returns timestamptz language plpgsql security invoker set search_path = '' as $$
declare g public.dp_groups; saved timestamptz;
begin
 select * into g from public.dp_groups where id=p_group for update;
 if g.id is null or not exists(select 1 from jsonb_array_elements(g.roster) r where r->>'id'=p_actor::text and r->>'code'=p_code) then
  raise exception 'Ongeldige toegangscode';
 end if;
 if g.closed then raise exception 'Deze beoordelingsronde is gesloten'; end if;
 insert into public.dp_submissions(group_id,actor_id,answers) values(p_group,p_actor,p_answers)
 on conflict(group_id,actor_id) do update set answers=excluded.answers, submitted_at=now(), honesty=null,teacher_comment='',teacher_name='',reviewed_at=null
 returning submitted_at into saved;
 return saved;
end $$;
revoke all on function public.dp_save_submission(uuid,uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.dp_save_submission(uuid,uuid,text,jsonb) to service_role;

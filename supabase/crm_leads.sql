-- CRM Tropa: rode este arquivo uma vez no SQL Editor do projeto Supabase do QG.
create extension if not exists pgcrypto;

create table if not exists public.crm_admins (
  id uuid primary key references auth.users(id) on delete cascade,
  criado_em timestamptz not null default now()
);

alter table public.crm_admins enable row level security;

drop policy if exists "admins veem o proprio acesso" on public.crm_admins;
create policy "admins veem o proprio acesso"
on public.crm_admins for select
to authenticated
using (id = auth.uid());

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('marca', 'creator')),
  origem text not null default 'site',
  status text not null default 'novo'
    check (status in ('novo', 'contato', 'qualificado', 'proposta', 'ganho', 'perdido')),
  nome text,
  email text,
  whatsapp text,
  empresa text,
  tiktok text,
  dados jsonb not null default '{}'::jsonb,
  notas text,
  responsavel uuid references auth.users(id) on delete set null,
  ultimo_contato_em timestamptz,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists crm_leads_status_idx on public.crm_leads(status);
create index if not exists crm_leads_tipo_idx on public.crm_leads(tipo);
create index if not exists crm_leads_criado_em_idx on public.crm_leads(criado_em desc);

alter table public.crm_leads enable row level security;

drop policy if exists "site pode cadastrar leads" on public.crm_leads;
create policy "site pode cadastrar leads"
on public.crm_leads for insert
to anon, authenticated
with check (
  tipo in ('marca', 'creator')
  and status = 'novo'
  and responsavel is null
);

drop policy if exists "admins podem ler leads" on public.crm_leads;
create policy "admins podem ler leads"
on public.crm_leads for select
to authenticated
using (
  exists (select 1 from public.crm_admins where crm_admins.id = auth.uid())
);

drop policy if exists "admins podem atualizar leads" on public.crm_leads;
create policy "admins podem atualizar leads"
on public.crm_leads for update
to authenticated
using (
  exists (select 1 from public.crm_admins where crm_admins.id = auth.uid())
)
with check (
  exists (select 1 from public.crm_admins where crm_admins.id = auth.uid())
);

drop policy if exists "admins podem excluir leads" on public.crm_leads;
create policy "admins podem excluir leads"
on public.crm_leads for delete
to authenticated
using (
  exists (select 1 from public.crm_admins where crm_admins.id = auth.uid())
);

create or replace function public.crm_leads_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists crm_leads_atualizado_em on public.crm_leads;
create trigger crm_leads_atualizado_em
before update on public.crm_leads
for each row execute function public.crm_leads_atualizado_em();

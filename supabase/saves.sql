-- PomodoroCat: backup do save na nuvem.
-- Rodar UMA vez no Supabase -> SQL Editor -> New query -> colar tudo -> Run.
-- Pode rodar de novo sem estragar nada.
--
-- Cada conta tem uma linha com o save inteiro (o gato, moedas, quarto, tarefas).
-- O RLS garante que cada um só lê e grava a própria linha.

create table if not exists public.saves (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  dados         jsonb not null,
  atualizado_em timestamptz not null default now()
);

alter table public.saves enable row level security;
grant select, insert, update on public.saves to authenticated;

drop policy if exists "cada um le o seu" on public.saves;
create policy "cada um le o seu" on public.saves
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "cada um cria o seu" on public.saves;
create policy "cada um cria o seu" on public.saves
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "cada um atualiza o seu" on public.saves;
create policy "cada um atualiza o seu" on public.saves
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

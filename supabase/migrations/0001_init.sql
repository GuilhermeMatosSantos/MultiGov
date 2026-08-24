-- MULTI.GOV — esquema inicial Postgres/Supabase
-- Espelha os tipos de src/types.ts e o modelo de permissões de
-- src/lib/permissoes.ts. Corre isto no SQL Editor do teu projeto Supabase
-- (Database → SQL Editor → New query), de uma só vez.
--
-- Tudo dentro de uma transação: se alguma linha falhar, o Postgres desfaz
-- o script inteiro em vez de deixar a base de dados a meio.

begin;

-- ============================================================
-- Extensões necessárias (gen_random_uuid) — não faz nada se já
-- estiverem ativas, o que é o caso por omissão em projetos Supabase.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- Tipos enumerados
-- ============================================================

create type nivel_institucional as enum (
  'Comissão Europeia',
  'Nacional',
  'Regional (CCDR)',
  'Intermunicipal (CIM/AM)',
  'Municipal',
  'Organismo Intermédio',
  'Autoridade de Gestão',
  'Programa Temático',
  'ADC'
);

create type camada_permissao as enum ('coordenacao', 'territorio', 'supervisao');

-- ============================================================
-- Perfis — substitui a identidade autodeclarada do protótipo.
-- Um perfil por utilizador autenticado (auth.users).
-- ============================================================

create table public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  entidade text not null default '',
  nivel nivel_institucional not null default 'Municipal',
  criado_em timestamptz not null default now()
);

-- Cria automaticamente um perfil vazio quando alguém se regista.
create or replace function public.criar_perfil_ao_registar()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id) values (new.id);
  return new;
end;
$$;

create trigger criar_perfil_apos_signup
  after insert on auth.users
  for each row execute function public.criar_perfil_ao_registar();

-- ============================================================
-- Funções de permissão — espelham camadaDoNivel()/podeEscrever()
-- em src/lib/permissoes.ts. Se mudares o modelo lá, muda aqui também.
-- ============================================================

create or replace function public.camada_do_nivel(p_nivel nivel_institucional)
returns camada_permissao
language sql immutable as $$
  select case p_nivel
    when 'Comissão Europeia' then 'supervisao'::camada_permissao
    when 'Intermunicipal (CIM/AM)' then 'territorio'::camada_permissao
    when 'Municipal' then 'territorio'::camada_permissao
    else 'coordenacao'::camada_permissao
  end;
$$;

create or replace function public.minha_camada()
returns camada_permissao
language sql stable security definer set search_path = public as $$
  select camada_do_nivel(nivel) from public.perfis where id = auth.uid();
$$;

create or replace function public.minha_entidade()
returns text
language sql stable security definer set search_path = public as $$
  select entidade from public.perfis where id = auth.uid();
$$;

-- ============================================================
-- Tabelas principais
-- ============================================================

create table public.interlocutores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cargo text not null default '',
  entidade text not null default '',
  nivel nivel_institucional not null default 'Municipal',
  area_responsabilidade text not null default '',
  email text not null default '',
  telefone text not null default '',
  atualizado_em date not null default current_date,
  notas text not null default '',
  criado_em timestamptz not null default now()
);

create table public.interlocutor_historico (
  id uuid primary key default gen_random_uuid(),
  interlocutor_id uuid not null references public.interlocutores (id) on delete cascade,
  nome text not null,
  cargo text not null default '',
  email text not null default '',
  telefone text not null default '',
  desde date,
  ate date,
  notas_transicao text not null default ''
);

create table public.processos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  aviso_id uuid,
  entidade_responsavel text not null default '',
  programa text not null default '',
  estado text not null default 'Submetido'
    check (estado in ('Submetido', 'Em análise', 'Aprovado', 'Em execução', 'Concluído', 'Indeferido')),
  data_abertura date,
  notas text not null default '',
  criado_em timestamptz not null default now()
);

create table public.avisos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  programa text not null default '',
  entidade_responsavel text not null default '',
  entidades_envolvidas text not null default '',
  data_prevista_abertura date,
  data_prevista_fecho date,
  estado text not null default 'Planeado'
    check (estado in ('Planeado', 'Em preparação', 'Aberto', 'Fechado')),
  notas_alinhamento text not null default '',
  criado_em timestamptz not null default now()
);

alter table public.processos
  add constraint processos_aviso_id_fkey foreign key (aviso_id) references public.avisos (id) on delete set null;

create table public.aviso_comentarios (
  id uuid primary key default gen_random_uuid(),
  aviso_id uuid not null references public.avisos (id) on delete cascade,
  autor text not null default '',
  entidade text not null default '',
  texto text not null,
  data date not null default current_date
);

create table public.aviso_confirmacoes (
  id uuid primary key default gen_random_uuid(),
  aviso_id uuid not null references public.avisos (id) on delete cascade,
  entidade text not null,
  confirmado boolean not null default false,
  unique (aviso_id, entidade)
);

create table public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null
    check (tipo in ('Regra', 'Orientação técnica', 'Aviso', 'Prazo', 'Alteração de plataforma')),
  descricao text not null default '',
  entidade_origem text not null default '',
  entidades_afetadas text not null default '',
  data_publicacao date,
  prazo date,
  lida boolean not null default false,
  processo_id uuid references public.processos (id) on delete set null,
  risco_descompromisso boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.faq (
  id uuid primary key default gen_random_uuid(),
  pergunta text not null,
  resposta text not null default '',
  categoria text not null default '',
  programa_relacionado text not null default '',
  fonte text not null default '',
  atualizado_em date,
  tags text not null default '',
  vinculativa boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.registo_informal (
  id uuid primary key default gen_random_uuid(),
  tipo text not null
    check (tipo in ('Telefonema', 'Reunião informal', 'Decisão informal', 'Outro')),
  processo_associado text not null default '',
  processo_id uuid references public.processos (id) on delete set null,
  participantes text not null default '',
  entidade text not null default '',
  resumo text not null default '',
  data date not null default current_date,
  estado text check (estado in ('A confirmar formalmente', 'Decisório')),
  prazo_regularizacao date,
  criado_em timestamptz not null default now()
);

create table public.indicadores_territoriais (
  id uuid primary key default gen_random_uuid(),
  territorio text not null,
  tipo_territorio text not null
    check (tipo_territorio in ('Município', 'CIM', 'Área Metropolitana', 'Região')),
  dimensao text not null
    check (dimensao in ('Económica', 'Social', 'Ambiental', 'Cultural', 'Governação')),
  indicador text not null,
  valor text not null default '',
  unidade text not null default '',
  ano text not null default '',
  fonte text not null default '',
  intervencao_relacionada text not null default '',
  criado_em timestamptz not null default now()
);

create table public.decisoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  descricao text not null default '',
  entidade text not null default '',
  nivel text not null default '',
  estado text not null default 'Decidida'
    check (estado in ('Decidida', 'Em execução', 'Concluída')),
  data date,
  resultados text not null default '',
  criado_em timestamptz not null default now()
);

create table public.topicos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null
    check (categoria in ('CIM–CIM', 'AG–AG', 'CCDR–CCDR', 'Boas práticas', 'Outro')),
  autor text not null default '',
  entidade text not null default '',
  data date not null default current_date,
  tipo_pedido text check (tipo_pedido in ('Pergunta', 'Pedido de intercâmbio', 'Partilha de boas práticas')),
  formato_intercambio text check (formato_intercambio in ('Reunião', 'Visita', 'Workshop', 'Documento partilhado')),
  objetivo_intercambio text not null default '',
  resultado text not null default '',
  criado_em timestamptz not null default now()
);

create table public.topico_mensagens (
  id uuid primary key default gen_random_uuid(),
  topico_id uuid not null references public.topicos (id) on delete cascade,
  autor text not null default '',
  entidade text not null default '',
  texto text not null,
  data date not null default current_date
);

create table public.projetos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  territorio text not null default '',
  programa text not null default '',
  periodo text not null default '',
  o_que_resultou text not null default '',
  o_que_nao_resultou text not null default '',
  condicoes_replicabilidade text not null default '',
  boa_pratica boolean not null default false,
  fonte text not null default '',
  criado_em timestamptz not null default now()
);

create table public.noticias (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  fonte text not null
    check (fonte in ('Comissão Europeia', 'Governo / Diário da República', 'Autoridade de Gestão', 'Outra')),
  tipo text not null
    check (tipo in ('Alteração regulamentar', 'Nova orientação', 'Notícia', 'Prazo relevante')),
  resumo text not null default '',
  temas text[] not null default '{}',
  programas text[] not null default '{}',
  territorios text[] not null default '{}',
  data_publicacao date,
  data_entrada_vigor date,
  referencia text not null default '',
  imagem text not null default '',
  processos_afetados text not null default '',
  criado_em timestamptz not null default now()
);

create table public.atividade (
  id uuid primary key default gen_random_uuid(),
  quando timestamptz not null default now(),
  nome text not null default '',
  entidade text not null default '',
  acao text not null check (acao in ('criar', 'editar', 'remover')),
  modulo text not null,
  item_label text not null default ''
);

create table public.avaliacoes_impacto (
  id uuid primary key default gen_random_uuid(),
  quando timestamptz not null default now(),
  nome text not null default '',
  entidade text not null default '',
  modulo text not null,
  ajudou text not null check (ajudou in ('sim', 'nao', 'nao_relevante')),
  comentario text not null default ''
);

-- ============================================================
-- Row Level Security
-- Leitura aberta a qualquer utilizador autenticado em todo o lado
-- (tal como no protótipo). Escrita restringida por camada — ver
-- MODULOS_ESCRITA em src/lib/permissoes.ts para a tabela completa.
-- ============================================================

alter table public.perfis enable row level security;
create policy "ver_perfis" on public.perfis for select using (auth.role() = 'authenticated');
create policy "editar_proprio_perfil" on public.perfis for update using (id = auth.uid());

-- Tabela-a-tabela: interlocutores, notificações, notícias, FAQ,
-- monitorização, memória de projetos e transparência — só "coordenação".
do $$
declare
  tabela text;
begin
  foreach tabela in array array[
    'interlocutores', 'notificacoes', 'faq', 'indicadores_territoriais',
    'projetos', 'noticias', 'decisoes'
  ]
  loop
    execute format('alter table public.%I enable row level security', tabela);
    execute format($f$create policy "leitura_%1$s" on public.%1$I for select using (auth.role() = 'authenticated')$f$, tabela);
    execute format($f$create policy "escrita_%1$s" on public.%1$I for insert with check (minha_camada() = 'coordenacao')$f$, tabela);
    execute format($f$create policy "atualizacao_%1$s" on public.%1$I for update using (minha_camada() = 'coordenacao')$f$, tabela);
    execute format($f$create policy "remocao_%1$s" on public.%1$I for delete using (minha_camada() = 'coordenacao')$f$, tabela);
  end loop;
end $$;

-- processos e registo_informal: coordenação + território.
do $$
declare
  tabela text;
begin
  foreach tabela in array array['processos', 'registo_informal']
  loop
    execute format('alter table public.%I enable row level security', tabela);
    execute format($f$create policy "leitura_%1$s" on public.%1$I for select using (auth.role() = 'authenticated')$f$, tabela);
    execute format($f$create policy "escrita_%1$s" on public.%1$I for insert with check (minha_camada() in ('coordenacao','territorio'))$f$, tabela);
    execute format($f$create policy "atualizacao_%1$s" on public.%1$I for update using (minha_camada() in ('coordenacao','territorio'))$f$, tabela);
    execute format($f$create policy "remocao_%1$s" on public.%1$I for delete using (minha_camada() in ('coordenacao','territorio'))$f$, tabela);
  end loop;
end $$;

-- topicos: coordenação + território podem criar/editar/remover; a
-- supervisão (Comissão Europeia) só lê.
alter table public.topicos enable row level security;
create policy "leitura_topicos" on public.topicos for select using (auth.role() = 'authenticated');
create policy "escrita_topicos" on public.topicos for insert with check (minha_camada() in ('coordenacao', 'territorio'));
create policy "atualizacao_topicos" on public.topicos for update using (minha_camada() in ('coordenacao', 'territorio'));
create policy "remocao_topicos" on public.topicos for delete using (minha_camada() in ('coordenacao', 'territorio'));

-- topico_mensagens: responder fica aberto a qualquer autenticado
-- (participação não é restrita, só a posse do tópico em si).
alter table public.topico_mensagens enable row level security;
create policy "leitura_mensagens" on public.topico_mensagens for select using (auth.role() = 'authenticated');
create policy "escrever_mensagens" on public.topico_mensagens for insert with check (auth.role() = 'authenticated');

-- avisos: só "coordenação" cria/edita/remove o registo oficial.
alter table public.avisos enable row level security;
create policy "leitura_avisos" on public.avisos for select using (auth.role() = 'authenticated');
create policy "escrita_avisos" on public.avisos for insert with check (minha_camada() = 'coordenacao');
create policy "atualizacao_avisos" on public.avisos for update using (minha_camada() = 'coordenacao');
create policy "remocao_avisos" on public.avisos for delete using (minha_camada() = 'coordenacao');

-- aviso_comentarios / aviso_confirmacoes: participação sempre aberta,
-- mesmo para quem não pode editar o aviso em si — é este o ponto central
-- do modelo (podes negociar/confirmar sem seres o "dono" do registo).
alter table public.aviso_comentarios enable row level security;
create policy "leitura_comentarios" on public.aviso_comentarios for select using (auth.role() = 'authenticated');
create policy "comentar" on public.aviso_comentarios for insert with check (auth.role() = 'authenticated');

alter table public.aviso_confirmacoes enable row level security;
create policy "leitura_confirmacoes" on public.aviso_confirmacoes for select using (auth.role() = 'authenticated');
create policy "confirmar" on public.aviso_confirmacoes for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- interlocutor_historico: segue as permissões da tabela-mãe (só coordenação).
alter table public.interlocutor_historico enable row level security;
create policy "leitura_historico" on public.interlocutor_historico for select using (auth.role() = 'authenticated');
create policy "escrever_historico" on public.interlocutor_historico for insert with check (minha_camada() = 'coordenacao');

-- atividade e avaliações de impacto: qualquer autenticado regista;
-- leitura aberta (é a camada de transparência/analítica da própria app).
alter table public.atividade enable row level security;
create policy "leitura_atividade" on public.atividade for select using (auth.role() = 'authenticated');
create policy "registar_atividade" on public.atividade for insert with check (auth.role() = 'authenticated');
create policy "limpar_atividade" on public.atividade for delete using (minha_camada() = 'coordenacao');

alter table public.avaliacoes_impacto enable row level security;
create policy "leitura_avaliacoes" on public.avaliacoes_impacto for select using (auth.role() = 'authenticated');
create policy "avaliar" on public.avaliacoes_impacto for insert with check (auth.role() = 'authenticated');

commit;

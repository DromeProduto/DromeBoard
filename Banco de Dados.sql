-- Tabela Usuarios
create table public.users (
  id uuid not null default extensions.uuid_generate_v4 (),
  email character varying(255) not null,
  password text not null,
  role_id uuid null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  name character varying(255) not null default 'Novo Usuário'::text,
  phone character varying(20) null,
  is_active boolean null default true,
  last_login timestamp with time zone null,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email)
) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_role_id on public.users using btree (role_id) TABLESPACE pg_default;

create index IF not exists idx_users_is_active on public.users using btree (is_active) TABLESPACE pg_default;

create trigger update_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();


-- tabela Roles
create table public.roles (
  id uuid not null default gen_random_uuid (),
  name character varying(50) not null,
  display_name character varying(100) not null,
  level integer not null,
  description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint roles_pkey primary key (id),
  constraint roles_name_key unique (name)
) TABLESPACE pg_default;


-- Tabela unidades
create table public.units (
  id uuid not null default extensions.uuid_generate_v4 (),
  name character varying(255) not null,
  is_active boolean null default true,
  created_at timestamp with time zone not null default now(),
  code character varying(50) null,
  address text null,
  phone character varying(20) null,
  email character varying(255) null,
  updated_at timestamp with time zone null default now(),
  constraint units_pkey primary key (id),
  constraint units_code_key unique (code)
) TABLESPACE pg_default;

create index IF not exists idx_units_active on public.units using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_units_code on public.units using btree (code) TABLESPACE pg_default;

create index IF not exists idx_units_name on public.units using btree (name) TABLESPACE pg_default;

create trigger update_units_updated_at BEFORE
update on units for EACH row
execute FUNCTION update_updated_at_column ();


-- Tabela Modulos
create table public.modules (
  id uuid not null default gen_random_uuid (),
  name character varying(100) not null,
  display_name character varying(150) not null,
  description text null,
  icon character varying(50) null,
  parent_module uuid null,
  order_index integer null default 0,
  is_active boolean null default true,
  created_at timestamp with time zone not null default now(),
  route character varying(100) null,
  required_role character varying(50) null default 'user'::character varying,
  updated_at timestamp with time zone null default now(),
  constraint modules_pkey primary key (id),
  constraint modules_name_key unique (name),
  constraint modules_parent_module_fkey foreign KEY (parent_module) references modules (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_modules_active on public.modules using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_modules_order on public.modules using btree (order_index) TABLESPACE pg_default;

create index IF not exists idx_modules_required_role on public.modules using btree (required_role) TABLESPACE pg_default;

create trigger update_modules_updated_at BEFORE
update on modules for EACH row
execute FUNCTION update_updated_at_column ();


-- Tabela de Modulos liberados por unidade
create table public.unit_modules (
  id uuid not null default gen_random_uuid (),
  unit_id uuid not null,
  module_id uuid not null,
  enabled_by uuid null,
  enabled_at timestamp with time zone null default now(),
  is_active boolean not null default true,
  disabled_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint unit_modules_pkey primary key (id),
  constraint unit_modules_unit_id_module_id_key unique (unit_id, module_id),
  constraint unit_modules_enabled_by_fkey foreign KEY (enabled_by) references users (id) on delete set null,
  constraint unit_modules_module_id_fkey foreign KEY (module_id) references modules (id) on delete CASCADE,
  constraint unit_modules_unit_id_fkey foreign KEY (unit_id) references units (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_unit_modules_active on public.unit_modules using btree (unit_id, is_active) TABLESPACE pg_default;

create index IF not exists idx_unit_modules_unit_id on public.unit_modules using btree (unit_id) TABLESPACE pg_default;

create index IF not exists idx_unit_modules_module_id on public.unit_modules using btree (module_id) TABLESPACE pg_default;

create index IF not exists idx_unit_modules_enabled_by on public.unit_modules using btree (enabled_by) TABLESPACE pg_default;


-- Tabela de Permissoes
create table public.user_module_permissions (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  unit_id uuid null,
  module_id uuid null,
  granted_by uuid null,
  granted_at timestamp with time zone null default now(),
  can_view boolean null default false,
  can_create boolean null default false,
  can_edit boolean null default false,
  can_delete boolean null default false,
  can_export boolean null default false,
  expires_at timestamp with time zone null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint user_module_permissions_pkey primary key (id),
  constraint user_module_permissions_unique unique (user_id, module_id, unit_id),
  constraint user_module_permissions_granted_by_fkey foreign KEY (granted_by) references users (id) on delete set null,
  constraint user_module_permissions_module_id_fkey foreign KEY (module_id) references modules (id) on delete CASCADE,
  constraint user_module_permissions_unit_id_fkey foreign KEY (unit_id) references units (id) on delete CASCADE,
  constraint user_module_permissions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_module_permissions_user_id on public.user_module_permissions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_module_permissions_module_id on public.user_module_permissions using btree (module_id) TABLESPACE pg_default;

create index IF not exists idx_user_module_permissions_unit_id on public.user_module_permissions using btree (unit_id) TABLESPACE pg_default;

create index IF not exists idx_user_module_permissions_active on public.user_module_permissions using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_user_module_permissions_expires on public.user_module_permissions using btree (expires_at) TABLESPACE pg_default;


-- Tabela user Unitis

create table public.user_units (
  user_id uuid not null,
  unit_id uuid not null,
  created_at timestamp with time zone null default now(),
  id uuid not null default gen_random_uuid (),
  assigned_by uuid null,
  assigned_at timestamp with time zone null default now(),
  is_active boolean null default true,
  constraint user_units_pkey primary key (user_id, unit_id),
  constraint user_units_assigned_by_fkey foreign KEY (assigned_by) references users (id) on delete set null,
  constraint user_units_unit_id_fkey foreign KEY (unit_id) references units (id) on delete CASCADE,
  constraint user_units_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_units_id on public.user_units using btree (id) TABLESPACE pg_default;

create index IF not exists idx_user_units_user_id on public.user_units using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_units_unit_id on public.user_units using btree (unit_id) TABLESPACE pg_default;

create index IF not exists idx_user_units_active on public.user_units using btree (is_active) TABLESPACE pg_default;

-- Tabela Resultados

create table public.resultados (
  id uuid not null default extensions.uuid_generate_v4 (),
  data date null,
  horario text null,
  valor numeric null,
  servico text null,
  tipo text null,
  periodo text null,
  cliente text null,
  profissional text null,
  endereco text null,
  dia text null,
  repasse numeric null,
  whatscliente text null,
  cupom text null,
  origem text null,
  atendimento_id text null,
  is_divisao text null,
  cadastro date null,
  acao text null,
  horas text null,
  motivo text null,
  acomp date null,
  status text null,
  pos text null,
  observacao text null,
  user_id uuid not null,
  unit_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint resultados_pkey primary key (id),
  constraint resultados_unit_id_fkey foreign KEY (unit_id) references units (id) on delete RESTRICT,
  constraint resultados_user_id_fkey foreign KEY (user_id) references users (id) on delete RESTRICT
) TABLESPACE pg_default;

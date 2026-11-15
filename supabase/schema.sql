-- Konys Pizza: esquema inicial para el prototipo Expo + Supabase.
-- Seguro para volver a ejecutar: no elimina tablas ni registros existentes.
--
-- IMPORTANTE: las políticas prototype_anon permiten operaciones públicas para
-- que el prototipo (que solo usa un PIN local) funcione. No las uses tal cual
-- en producción. Protege el panel con Supabase Auth y políticas authenticated.

create table if not exists public.mesas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  zona text not null default 'salon',
  capacidad integer not null check (capacidad > 0),
  activa boolean not null default true,
  foto_url text,
  creado_en timestamptz not null default now()
);

create table if not exists public.horarios (
  id uuid primary key default gen_random_uuid(),
  dia_semana text not null check (dia_semana in (
    'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'
  )),
  jornada text not null check (jornada in ('almuerzo', 'noche')),
  hora_inicio time not null,
  hora_fin time not null,
  duracion_slot integer not null default 60 check (duracion_slot > 0),
  activo boolean not null default true,
  unique (dia_semana, jornada),
  check (hora_fin > hora_inicio)
);

create table if not exists public.reservas (
  id uuid primary key default gen_random_uuid(),
  mesa_id uuid not null references public.mesas(id) on delete restrict,
  cliente_nombre text not null,
  cliente_contacto text,
  num_personas integer not null check (num_personas > 0),
  fecha date not null,
  hora_inicio time not null,
  hora_fin time not null,
  estado text not null default 'confirmada'
    check (estado in ('confirmada', 'cancelada', 'completada')),
  creado_en timestamptz not null default now(),
  check (hora_fin > hora_inicio)
);

create table if not exists public.platos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null check (categoria in ('pizzas', 'entradas', 'postres', 'bebidas')),
  descripcion text,
  precio numeric(12, 2) not null default 0 check (precio >= 0),
  disponible boolean not null default true,
  foto_url text,
  creado_en timestamptz not null default now()
);

create index if not exists reservas_mesa_fecha_idx
  on public.reservas (mesa_id, fecha, hora_inicio);
create index if not exists reservas_fecha_idx
  on public.reservas (fecha, estado);
create index if not exists platos_categoria_disponible_idx
  on public.platos (categoria, disponible);

-- Horarios iniciales del restaurante. Los horarios existentes se conservan.
insert into public.horarios (dia_semana, jornada, hora_inicio, hora_fin, duracion_slot, activo)
select dias.dia_semana, jornadas.jornada, jornadas.hora_inicio, jornadas.hora_fin, 60, true
from (values
  ('lunes'), ('martes'), ('miércoles'), ('jueves'), ('viernes'), ('sábado'), ('domingo')
) as dias(dia_semana)
cross join (values
  ('almuerzo', time '12:30', time '14:30'),
  ('noche', time '17:00', time '23:00')
) as jornadas(jornada, hora_inicio, hora_fin)
on conflict (dia_semana, jornada) do nothing;

-- RLS y permisos para el prototipo sin cuentas de usuario.
alter table public.mesas enable row level security;
alter table public.horarios enable row level security;
alter table public.reservas enable row level security;
alter table public.platos enable row level security;

grant usage on schema public to anon;
grant select, insert, update, delete on public.mesas to anon;
grant select, insert, update, delete on public.horarios to anon;
grant select, insert, update on public.reservas to anon;
grant select, insert, update, delete on public.platos to anon;

drop policy if exists prototype_anon_mesas_select on public.mesas;
create policy prototype_anon_mesas_select on public.mesas
  for select to anon using (true);
drop policy if exists prototype_anon_mesas_insert on public.mesas;
create policy prototype_anon_mesas_insert on public.mesas
  for insert to anon with check (true);
drop policy if exists prototype_anon_mesas_update on public.mesas;
create policy prototype_anon_mesas_update on public.mesas
  for update to anon using (true) with check (true);
drop policy if exists prototype_anon_mesas_delete on public.mesas;
create policy prototype_anon_mesas_delete on public.mesas
  for delete to anon using (true);

drop policy if exists prototype_anon_horarios_select on public.horarios;
create policy prototype_anon_horarios_select on public.horarios
  for select to anon using (true);
drop policy if exists prototype_anon_horarios_insert on public.horarios;
create policy prototype_anon_horarios_insert on public.horarios
  for insert to anon with check (true);
drop policy if exists prototype_anon_horarios_update on public.horarios;
create policy prototype_anon_horarios_update on public.horarios
  for update to anon using (true) with check (true);
drop policy if exists prototype_anon_horarios_delete on public.horarios;
create policy prototype_anon_horarios_delete on public.horarios
  for delete to anon using (true);

drop policy if exists prototype_anon_reservas_select on public.reservas;
create policy prototype_anon_reservas_select on public.reservas
  for select to anon using (true);
drop policy if exists prototype_anon_reservas_insert on public.reservas;
create policy prototype_anon_reservas_insert on public.reservas
  for insert to anon with check (true);
drop policy if exists prototype_anon_reservas_update on public.reservas;
create policy prototype_anon_reservas_update on public.reservas
  for update to anon using (true) with check (true);

drop policy if exists prototype_anon_platos_select on public.platos;
create policy prototype_anon_platos_select on public.platos
  for select to anon using (true);
drop policy if exists prototype_anon_platos_insert on public.platos;
create policy prototype_anon_platos_insert on public.platos
  for insert to anon with check (true);
drop policy if exists prototype_anon_platos_update on public.platos;
create policy prototype_anon_platos_update on public.platos
  for update to anon using (true) with check (true);
drop policy if exists prototype_anon_platos_delete on public.platos;
create policy prototype_anon_platos_delete on public.platos
  for delete to anon using (true);

-- ALI employee portal: fixed username accounts + role permissions.
create table if not exists employee_accounts (
  user_id text primary key references "user" ("id") on delete cascade,
  username text not null unique,
  role text not null check (role in ('manager','warehouse','production','engineer','technician','delivery')),
  active boolean not null default true,
  created_at timestamptz not null default current_timestamp,
  updated_at timestamptz not null default current_timestamp
);

create index if not exists employee_accounts_role_idx on employee_accounts (role);
create index if not exists employee_accounts_active_idx on employee_accounts (active);

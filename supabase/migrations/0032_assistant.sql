-- AI asistent — chat conversations sa tool use.
-- Profesor priča sa AI asistentom u prirodnom jeziku — model može da
-- čita podatke, predlaže akcije (sa konfirmacijom), pomaže u navigaciji.

create table public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index assistant_conversations_user_idx
  on public.assistant_conversations (user_id, updated_at desc);

create trigger assistant_conversations_set_updated_at
  before update on public.assistant_conversations
  for each row
  execute function public.set_updated_at();

-- Poruke u konverzaciji — može biti user, assistant (text), tool_use
-- (assistant zove tool), tool_result (rezultat tool poziva).
create table public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.assistant_conversations (id) on delete cascade,

  role text not null check (role in ('user', 'assistant', 'tool')),

  -- Sadržaj kao JSON — može biti string, array of content blocks, tool calls...
  -- Cuvamo kompletan format koji Anthropic SDK koristi (text, tool_use, tool_result).
  content jsonb not null,

  -- Telemetry
  input_tokens integer,
  output_tokens integer,
  cache_read_tokens integer,
  cache_creation_tokens integer,

  created_at timestamptz not null default now()
);

create index assistant_messages_conversation_idx
  on public.assistant_messages (conversation_id, created_at);

-- RLS
alter table public.assistant_conversations enable row level security;
alter table public.assistant_messages enable row level security;

create policy "assistant_conversations select own org"
  on public.assistant_conversations for select
  to authenticated
  using (organization_id = public.current_organization_id());

create policy "assistant_conversations insert own org"
  on public.assistant_conversations for insert
  to authenticated
  with check (organization_id = public.current_organization_id());

create policy "assistant_conversations update own org"
  on public.assistant_conversations for update
  to authenticated
  using (organization_id = public.current_organization_id())
  with check (organization_id = public.current_organization_id());

create policy "assistant_conversations delete own org"
  on public.assistant_conversations for delete
  to authenticated
  using (organization_id = public.current_organization_id());

create policy "assistant_messages select via conversation"
  on public.assistant_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.assistant_conversations c
      where c.id = assistant_messages.conversation_id
        and c.organization_id = public.current_organization_id()
    )
  );

create policy "assistant_messages insert via conversation"
  on public.assistant_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.assistant_conversations c
      where c.id = assistant_messages.conversation_id
        and c.organization_id = public.current_organization_id()
    )
  );

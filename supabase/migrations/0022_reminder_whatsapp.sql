-- Dodaj 'whatsapp' kao validan kanal za podsetnike o naplati.

alter table public.reminder_logs
  drop constraint if exists reminder_logs_channel_check;

alter table public.reminder_logs
  add constraint reminder_logs_channel_check
  check (channel in ('copy', 'sms', 'email', 'viber', 'whatsapp'));

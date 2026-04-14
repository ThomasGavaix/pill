-- Enable Realtime on dose_logs so changes are pushed to all connected clients
alter publication supabase_realtime add table dose_logs;

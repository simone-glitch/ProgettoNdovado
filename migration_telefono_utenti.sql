-- ==================================================
-- MIGRAZIONE: numero di telefono utente (opzionale, univoco)
-- Eseguire una sola volta sul database live "ndovado_db".
--   psql -U postgres -d ndovado_db -f migration_telefono_utenti.sql
-- Il telefono è facoltativo: se valorizzato deve essere univoco tra gli utenti.
-- In PostgreSQL gli indici UNIQUE ignorano i NULL, quindi il vincolo scatta
-- solo tra numeri effettivamente inseriti.
-- ==================================================

ALTER TABLE public.utenti ADD COLUMN IF NOT EXISTS telefono character varying(30);
CREATE UNIQUE INDEX IF NOT EXISTS utenti_telefono_key ON public.utenti (telefono);

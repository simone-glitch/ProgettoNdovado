-- ==================================================
-- MIGRAZIONE: archiviazione conversazioni (per partecipante)
-- Eseguire una sola volta sul database live "ndovado_db".
--   psql -U postgres -d ndovado_db -f migration_archivio_conversazioni.sql
-- Ogni lato della conversazione (guest / host) può archiviare la chat in modo
-- indipendente: la chat archiviata sparisce dalla lista "Attive" solo per chi
-- l'ha archiviata, senza toccarla per l'altro partecipante.
-- ==================================================

ALTER TABLE public.conversazioni
    ADD COLUMN IF NOT EXISTS archiviata_guest boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS archiviata_host  boolean NOT NULL DEFAULT false;

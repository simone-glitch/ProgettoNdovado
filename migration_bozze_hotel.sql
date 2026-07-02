-- ==================================================
-- MIGRAZIONE: stato "bozza" e campi operativi per gli hotel
-- --------------------------------------------------
-- Aggiunge alla tabella hotel:
--   - stato        : ciclo di vita della struttura (BOZZA / PUBBLICATO / ...)
--   - check_in     : orario di check-in (stringa "HH:MM")
--   - check_out    : orario di check-out (stringa "HH:MM")
--   - telefono     : recapito telefonico della struttura
--   - email        : recapito email della struttura
--   - num_camere   : numero di camere dichiarato
--   - prezzo_medio : prezzo medio a notte
--
-- Idempotente: si può rieseguire senza errori (IF NOT EXISTS).
-- Gli hotel gia' esistenti restano PUBBLICATO grazie al DEFAULT.
-- ==================================================

ALTER TABLE public.hotel ADD COLUMN IF NOT EXISTS stato        character varying(20) NOT NULL DEFAULT 'PUBBLICATO';
ALTER TABLE public.hotel ADD COLUMN IF NOT EXISTS check_in     character varying(10);
ALTER TABLE public.hotel ADD COLUMN IF NOT EXISTS check_out    character varying(10);
ALTER TABLE public.hotel ADD COLUMN IF NOT EXISTS telefono     character varying(30);
ALTER TABLE public.hotel ADD COLUMN IF NOT EXISTS email        character varying(100);
ALTER TABLE public.hotel ADD COLUMN IF NOT EXISTS num_camere   integer;
ALTER TABLE public.hotel ADD COLUMN IF NOT EXISTS prezzo_medio numeric(10, 2);

-- Vincolo sui valori ammessi per lo stato (aggiunto solo se non gia' presente).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'hotel_stato_check'
    ) THEN
        ALTER TABLE public.hotel ADD CONSTRAINT hotel_stato_check CHECK (
            stato IN ('BOZZA', 'PUBBLICATO', 'IN_REVISIONE', 'SOSPESO', 'RIFIUTATO', 'NON_ATTIVO')
        );
    END IF;
END $$;

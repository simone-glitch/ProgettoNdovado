-- ==================================================
-- MIGRAZIONE: blocchi di disponibilità delle strutture
-- Eseguire una sola volta sul database live "ndovado_db".
--   psql -U postgres -d ndovado_db -f migration_blocchi_hotel.sql
-- Un blocco è un intervallo di date (inclusive) in cui l'host rende l'hotel
-- non prenotabile (ferie, lavori, chiusura stagionale, ...). Vale per tutte
-- le camere della struttura.
-- ==================================================

CREATE TABLE IF NOT EXISTS public.blocchi_hotel (
    id_blocco    integer NOT NULL,
    id_hotel     integer NOT NULL,
    data_inizio  date NOT NULL,
    data_fine    date NOT NULL,
    motivo       character varying(255),
    CONSTRAINT blocchi_hotel_pkey PRIMARY KEY (id_blocco),
    CONSTRAINT blocchi_hotel_id_hotel_fkey FOREIGN KEY (id_hotel)
        REFERENCES public.hotel(id_hotel) ON DELETE CASCADE
);

CREATE SEQUENCE IF NOT EXISTS public.blocchi_hotel_id_blocco_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.blocchi_hotel_id_blocco_seq OWNED BY public.blocchi_hotel.id_blocco;
ALTER TABLE ONLY public.blocchi_hotel
    ALTER COLUMN id_blocco SET DEFAULT nextval('public.blocchi_hotel_id_blocco_seq'::regclass);

-- ==================================================
-- MIGRAZIONE: messaggistica privata ospite-host
-- Eseguire una sola volta sul database live "ndovado_db".
--   psql -U postgres -d ndovado_db -f migration_conversazioni.sql
-- Una conversazione è 1-a-1 tra un guest e un host (unica per coppia); i
-- messaggi vi confluiscono. id_hotel è la struttura da cui è nata (contesto).
-- ==================================================

CREATE TABLE IF NOT EXISTS public.conversazioni (
    id_conversazione integer NOT NULL,
    id_guest         integer NOT NULL,
    id_host          integer NOT NULL,
    id_hotel         integer,
    data_creazione   timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT conversazioni_pkey PRIMARY KEY (id_conversazione),
    CONSTRAINT conversazioni_coppia_unica UNIQUE (id_guest, id_host),
    CONSTRAINT conversazioni_guest_fkey FOREIGN KEY (id_guest)
        REFERENCES public.utenti(id_utente) ON DELETE CASCADE,
    CONSTRAINT conversazioni_host_fkey FOREIGN KEY (id_host)
        REFERENCES public.utenti(id_utente) ON DELETE CASCADE,
    CONSTRAINT conversazioni_hotel_fkey FOREIGN KEY (id_hotel)
        REFERENCES public.hotel(id_hotel) ON DELETE SET NULL
);

CREATE SEQUENCE IF NOT EXISTS public.conversazioni_id_conversazione_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.conversazioni_id_conversazione_seq OWNED BY public.conversazioni.id_conversazione;
ALTER TABLE ONLY public.conversazioni
    ALTER COLUMN id_conversazione SET DEFAULT nextval('public.conversazioni_id_conversazione_seq'::regclass);

CREATE TABLE IF NOT EXISTS public.messaggi_conversazione (
    id_messaggio     integer NOT NULL,
    id_conversazione integer NOT NULL,
    id_mittente      integer NOT NULL,
    testo            text NOT NULL,
    data_invio       timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    letto            boolean NOT NULL DEFAULT false,
    CONSTRAINT messaggi_conversazione_pkey PRIMARY KEY (id_messaggio),
    CONSTRAINT messaggi_conversazione_conv_fkey FOREIGN KEY (id_conversazione)
        REFERENCES public.conversazioni(id_conversazione) ON DELETE CASCADE,
    CONSTRAINT messaggi_conversazione_mittente_fkey FOREIGN KEY (id_mittente)
        REFERENCES public.utenti(id_utente) ON DELETE CASCADE
);

CREATE SEQUENCE IF NOT EXISTS public.messaggi_conversazione_id_messaggio_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.messaggi_conversazione_id_messaggio_seq OWNED BY public.messaggi_conversazione.id_messaggio;
ALTER TABLE ONLY public.messaggi_conversazione
    ALTER COLUMN id_messaggio SET DEFAULT nextval('public.messaggi_conversazione_id_messaggio_seq'::regclass);

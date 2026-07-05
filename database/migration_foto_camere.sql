-- ==================================================
-- MIGRAZIONE: galleria foto delle camere
-- Eseguire una sola volta sul database live "ndovado_db".
--   psql -U postgres -d ndovado_db -f migration_foto_camere.sql
-- dati_foto contiene l'immagine come data URL base64 (upload da file).
-- ==================================================

CREATE TABLE IF NOT EXISTS public.foto_camere (
    id_foto     integer NOT NULL,
    dati_foto   text NOT NULL,
    id_camera   integer NOT NULL,
    CONSTRAINT foto_camere_pkey PRIMARY KEY (id_foto),
    CONSTRAINT foto_camere_id_camera_fkey FOREIGN KEY (id_camera)
        REFERENCES public.camere(id_camera) ON DELETE CASCADE
);

CREATE SEQUENCE IF NOT EXISTS public.foto_camere_id_foto_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.foto_camere_id_foto_seq OWNED BY public.foto_camere.id_foto;
ALTER TABLE ONLY public.foto_camere
    ALTER COLUMN id_foto SET DEFAULT nextval('public.foto_camere_id_foto_seq'::regclass);

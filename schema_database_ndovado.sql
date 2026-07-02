--
-- PostgreSQL database dump - Ndovado Hotel Booking
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

-- ==================================================
-- TABELLA: utenti
-- Ruoli: ADMIN (gestione piattaforma), HOST (proprietari hotel), GUEST (clienti)
-- ==================================================

CREATE TABLE public.utenti (
    id_utente   integer      NOT NULL,
    nome        character varying(100) NOT NULL,
    cognome     character varying(100) NOT NULL,
    email       character varying(100) NOT NULL,
    password    character varying(255) NOT NULL,
    ruolo       character varying(20)  NOT NULL,
    banned      boolean DEFAULT false,
    CONSTRAINT utenti_pkey PRIMARY KEY (id_utente),
    CONSTRAINT utenti_email_key UNIQUE (email),
    CONSTRAINT check_ruolo_valido CHECK (
        ruolo IN ('ADMIN', 'HOST', 'GUEST')
    )
);

CREATE SEQUENCE public.utenti_id_utente_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.utenti_id_utente_seq OWNED BY public.utenti.id_utente;
ALTER TABLE ONLY public.utenti ALTER COLUMN id_utente SET DEFAULT nextval('public.utenti_id_utente_seq'::regclass);

-- Utente amministratore di default (password: Admin123 — da cambiare in produzione)
INSERT INTO public.utenti (nome, cognome, email, password, ruolo) VALUES
    ('Admin', 'Ndovado', 'admin@ndovado.com', '$2a$10$mgvrCT9PeEa8UrhvlK30DeWfFh1vEHJntr/H9qJrva31T6uLIJFgS', 'ADMIN');

-- ==================================================
-- TABELLA: hotel
-- Ogni hotel appartiene a un HOST
-- ==================================================

CREATE TABLE public.hotel (
    id_hotel        integer NOT NULL,
    nome            character varying(150) NOT NULL,
    descrizione     text,
    citta           character varying(100) NOT NULL,
    indirizzo       character varying(200) NOT NULL,
    stelle          integer DEFAULT 3,
    latitudine      numeric(10, 7),
    longitudine     numeric(10, 7),
    id_proprietario integer NOT NULL,
    CONSTRAINT hotel_pkey PRIMARY KEY (id_hotel),
    CONSTRAINT hotel_stelle_check CHECK (stelle BETWEEN 1 AND 5),
    CONSTRAINT hotel_proprietario_fkey FOREIGN KEY (id_proprietario)
        REFERENCES public.utenti(id_utente) ON DELETE CASCADE
);

CREATE SEQUENCE public.hotel_id_hotel_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.hotel_id_hotel_seq OWNED BY public.hotel.id_hotel;
ALTER TABLE ONLY public.hotel ALTER COLUMN id_hotel SET DEFAULT nextval('public.hotel_id_hotel_seq'::regclass);

-- ==================================================
-- TABELLA: camere
-- Relazione 1-a-molti con hotel → QUI VIENE APPLICATO IL PATTERN PROXY
-- ==================================================

CREATE TABLE public.camere (
    id_camera       integer NOT NULL,
    tipo            character varying(50) NOT NULL,
    descrizione     text,
    prezzo_notte    numeric(10, 2) NOT NULL,
    capienza        integer NOT NULL DEFAULT 2,
    disponibile     boolean DEFAULT true,
    id_hotel        integer NOT NULL,
    CONSTRAINT camere_pkey PRIMARY KEY (id_camera),
    CONSTRAINT camere_tipo_check CHECK (
        tipo IN ('SINGOLA', 'DOPPIA', 'TRIPLA', 'SUITE', 'FAMILIARE', 'DELUXE')
    ),
    CONSTRAINT camere_id_hotel_fkey FOREIGN KEY (id_hotel)
        REFERENCES public.hotel(id_hotel) ON DELETE CASCADE
);

CREATE SEQUENCE public.camere_id_camera_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.camere_id_camera_seq OWNED BY public.camere.id_camera;
ALTER TABLE ONLY public.camere ALTER COLUMN id_camera SET DEFAULT nextval('public.camere_id_camera_seq'::regclass);

-- ==================================================
-- TABELLA: prenotazioni
-- Un GUEST prenota una camera per un periodo
-- ==================================================

CREATE TABLE public.prenotazioni (
    id_prenotazione integer NOT NULL,
    data_checkin    date    NOT NULL,
    data_checkout   date    NOT NULL,
    num_ospiti      integer NOT NULL DEFAULT 1,
    prezzo_totale   numeric(10, 2),
    stato           character varying(20) NOT NULL DEFAULT 'IN_ATTESA',
    id_utente       integer NOT NULL,
    id_camera       integer NOT NULL,
    CONSTRAINT prenotazioni_pkey PRIMARY KEY (id_prenotazione),
    CONSTRAINT prenotazioni_stato_check CHECK (
        stato IN ('IN_ATTESA', 'CONFERMATA', 'CANCELLATA')
    ),
    CONSTRAINT prenotazioni_date_check CHECK (data_checkout > data_checkin),
    CONSTRAINT prenotazioni_id_utente_fkey FOREIGN KEY (id_utente)
        REFERENCES public.utenti(id_utente) ON DELETE CASCADE,
    CONSTRAINT prenotazioni_id_camera_fkey FOREIGN KEY (id_camera)
        REFERENCES public.camere(id_camera) ON DELETE CASCADE
);

CREATE SEQUENCE public.prenotazioni_id_prenotazione_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.prenotazioni_id_prenotazione_seq OWNED BY public.prenotazioni.id_prenotazione;
ALTER TABLE ONLY public.prenotazioni ALTER COLUMN id_prenotazione SET DEFAULT nextval('public.prenotazioni_id_prenotazione_seq'::regclass);

-- ==================================================
-- TABELLA: recensioni
-- Un GUEST lascia una recensione su un hotel
-- ==================================================

CREATE TABLE public.recensioni (
    id_recensione   integer NOT NULL,
    titolo          character varying(150),
    testo           text    NOT NULL,
    voto            integer NOT NULL,
    data_recensione timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_utente       integer NOT NULL,
    id_hotel        integer NOT NULL,
    CONSTRAINT recensioni_pkey PRIMARY KEY (id_recensione),
    CONSTRAINT recensioni_voto_check CHECK (voto BETWEEN 1 AND 5),
    CONSTRAINT recensioni_id_utente_fkey FOREIGN KEY (id_utente)
        REFERENCES public.utenti(id_utente) ON DELETE CASCADE,
    CONSTRAINT recensioni_id_hotel_fkey FOREIGN KEY (id_hotel)
        REFERENCES public.hotel(id_hotel) ON DELETE CASCADE
);

CREATE SEQUENCE public.recensioni_id_recensione_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.recensioni_id_recensione_seq OWNED BY public.recensioni.id_recensione;
ALTER TABLE ONLY public.recensioni ALTER COLUMN id_recensione SET DEFAULT nextval('public.recensioni_id_recensione_seq'::regclass);

-- ==================================================
-- TABELLA: servizi
-- Servizi disponibili (WiFi, Piscina, Parcheggio, SPA, ecc.)
-- ==================================================

CREATE TABLE public.servizi (
    id_servizio integer NOT NULL,
    nome        character varying(100) NOT NULL,
    icona       character varying(50),
    CONSTRAINT servizi_pkey PRIMARY KEY (id_servizio)
);

CREATE SEQUENCE public.servizi_id_servizio_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.servizi_id_servizio_seq OWNED BY public.servizi.id_servizio;
ALTER TABLE ONLY public.servizi ALTER COLUMN id_servizio SET DEFAULT nextval('public.servizi_id_servizio_seq'::regclass);

INSERT INTO public.servizi (nome, icona) VALUES
    ('WiFi gratuito',    'wifi'),
    ('Parcheggio',       'local_parking'),
    ('Piscina',          'pool'),
    ('Colazione inclusa','free_breakfast'),
    ('Aria condizionata','ac_unit'),
    ('Palestra',         'fitness_center'),
    ('SPA',              'spa'),
    ('Ristorante',       'restaurant'),
    ('Animali ammessi',  'pets'),
    ('Reception 24h',    'support_agent');

-- ==================================================
-- TABELLA: hotel_servizi
-- Relazione many-to-many: hotel ↔ servizi
-- ==================================================

CREATE TABLE public.hotel_servizi (
    id_hotel    integer NOT NULL,
    id_servizio integer NOT NULL,
    CONSTRAINT hotel_servizi_pkey PRIMARY KEY (id_hotel, id_servizio),
    CONSTRAINT hotel_servizi_id_hotel_fkey FOREIGN KEY (id_hotel)
        REFERENCES public.hotel(id_hotel) ON DELETE CASCADE,
    CONSTRAINT hotel_servizi_id_servizio_fkey FOREIGN KEY (id_servizio)
        REFERENCES public.servizi(id_servizio) ON DELETE CASCADE
);

-- ==================================================
-- TABELLA: foto_hotel
-- Galleria fotografica di ogni hotel
-- ==================================================

CREATE TABLE public.foto_hotel (
    id_foto     integer NOT NULL,
    url_foto    character varying(500) NOT NULL,
    didascalia  character varying(200),
    id_hotel    integer NOT NULL,
    CONSTRAINT foto_hotel_pkey PRIMARY KEY (id_foto),
    CONSTRAINT foto_hotel_id_hotel_fkey FOREIGN KEY (id_hotel)
        REFERENCES public.hotel(id_hotel) ON DELETE CASCADE
);

CREATE SEQUENCE public.foto_hotel_id_foto_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.foto_hotel_id_foto_seq OWNED BY public.foto_hotel.id_foto;
ALTER TABLE ONLY public.foto_hotel ALTER COLUMN id_foto SET DEFAULT nextval('public.foto_hotel_id_foto_seq'::regclass);

-- ==================================================
-- TABELLA: foto_camere
-- Galleria fotografica di ogni camera.
-- dati_foto contiene l'immagine come data URL base64 (upload da file,
-- non da URL esterno), coerente con la gestione foto lato applicazione.
-- ==================================================

CREATE TABLE public.foto_camere (
    id_foto     integer NOT NULL,
    dati_foto   text NOT NULL,
    id_camera   integer NOT NULL,
    CONSTRAINT foto_camere_pkey PRIMARY KEY (id_foto),
    CONSTRAINT foto_camere_id_camera_fkey FOREIGN KEY (id_camera)
        REFERENCES public.camere(id_camera) ON DELETE CASCADE
);

CREATE SEQUENCE public.foto_camere_id_foto_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.foto_camere_id_foto_seq OWNED BY public.foto_camere.id_foto;
ALTER TABLE ONLY public.foto_camere ALTER COLUMN id_foto SET DEFAULT nextval('public.foto_camere_id_foto_seq'::regclass);

-- ==================================================
-- TABELLA: messaggi_chat  (invariata — chatbot Gemini)
-- ==================================================

CREATE TABLE public.messaggi_chat (
    id          integer NOT NULL,
    testo       text    NOT NULL,
    ruolo       character varying(10) NOT NULL,
    data_invio  timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    utente_id   integer NOT NULL,
    CONSTRAINT messaggi_chat_pkey PRIMARY KEY (id),
    CONSTRAINT fk_utente FOREIGN KEY (utente_id)
        REFERENCES public.utenti(id_utente) ON DELETE CASCADE
);

CREATE SEQUENCE public.messaggi_chat_id_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.messaggi_chat_id_seq OWNED BY public.messaggi_chat.id;
ALTER TABLE ONLY public.messaggi_chat ALTER COLUMN id SET DEFAULT nextval('public.messaggi_chat_id_seq'::regclass);

-- ==================================================
-- TABELLA: cronologiachat  (invariata — storico chatbot)
-- ==================================================

CREATE TABLE public.cronologiachat (
    id_messaggio integer NOT NULL,
    testo        text    NOT NULL,
    ruolo        character varying(10) NOT NULL,
    data_invio   timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    id_utente    integer NOT NULL,
    CONSTRAINT cronologiachat_pkey PRIMARY KEY (id_messaggio),
    CONSTRAINT fk_utente_chat FOREIGN KEY (id_utente)
        REFERENCES public.utenti(id_utente) ON DELETE CASCADE
);

CREATE SEQUENCE public.cronologiachat_id_messaggio_seq
    AS integer START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;
ALTER SEQUENCE public.cronologiachat_id_messaggio_seq OWNED BY public.cronologiachat.id_messaggio;
ALTER TABLE ONLY public.cronologiachat ALTER COLUMN id_messaggio SET DEFAULT nextval('public.cronologiachat_id_messaggio_seq'::regclass);

-- ==================================================
-- DATI DI ESEMPIO per sviluppo e demo
-- ==================================================

-- HOST di esempio
INSERT INTO public.utenti (nome, cognome, email, password, ruolo) VALUES
    ('Marco', 'Rossi',   'marco.host@ndovado.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'HOST'),
    ('Laura', 'Bianchi', 'laura.host@ndovado.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'HOST');

-- GUEST di esempio
INSERT INTO public.utenti (nome, cognome, email, password, ruolo) VALUES
    ('Giuseppe', 'Verdi',  'giuseppe@ndovado.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'GUEST'),
    ('Anna',     'Neri',   'anna@ndovado.com',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'GUEST');

-- Hotel di esempio (id_proprietario riferisce agli id degli HOST inseriti sopra)
INSERT INTO public.hotel (nome, descrizione, citta, indirizzo, stelle, latitudine, longitudine, id_proprietario) VALUES
    ('Grand Hotel Roma',    'Hotel di lusso nel cuore della capitale, a pochi passi dal Colosseo.',
     'Roma',   'Via dei Fori Imperiali, 1',  5,  41.8902102,  12.4922309, 2),
    ('Hotel Venezia Palace', 'Elegante struttura con vista sul Canal Grande e servizi premium.',
     'Venezia','Fondamenta delle Zattere, 10', 4, 45.4371908,  12.3345898, 2),
    ('Relais Toscana',      'Agriturismo di charme immerso nelle colline senesi.',
     'Siena',  'Strada delle Colline, 45',   3,  43.3187679,  11.3307574, 3),
    ('B&B Napoli Centro',   'Piccolo e accogliente bed & breakfast nel centro storico.',
     'Napoli', 'Via Toledo, 78',             3,  40.8359336,  14.2488479, 3);

-- Camere di esempio
INSERT INTO public.camere (tipo, descrizione, prezzo_notte, capienza, disponibile, id_hotel) VALUES
    ('SINGOLA',  'Camera singola con bagno privato e vista città.',             89.00,  1, true, 1),
    ('DOPPIA',   'Camera doppia con letto matrimoniale e balcone.',            149.00,  2, true, 1),
    ('SUITE',    'Suite presidenziale con jacuzzi e vista panoramica.',        450.00,  2, true, 1),
    ('DOPPIA',   'Camera doppia con vista canal grande.',                      180.00,  2, true, 2),
    ('FAMILIARE','Camera familiare con due letti matrimoniali.',               220.00,  4, true, 2),
    ('DOPPIA',   'Camera rurale con travi a vista e colazione inclusa.',       110.00,  2, true, 3),
    ('SINGOLA',  'Camera singola accogliente in pieno centro.',                 65.00,  1, true, 4),
    ('DOPPIA',   'Camera doppia con aria condizionata e TV.',                   95.00,  2, true, 4);

-- Servizi per gli hotel
INSERT INTO public.hotel_servizi (id_hotel, id_servizio) VALUES
    (1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8),
    (2, 1), (2, 4), (2, 5), (2, 8),
    (3, 1), (3, 4), (3, 9),
    (4, 1), (4, 5), (4, 10);

-- Recensioni di esempio
INSERT INTO public.recensioni (titolo, testo, voto, id_utente, id_hotel) VALUES
    ('Esperienza meravigliosa!',    'Hotel fantastico, staff gentilissimo e posizione perfetta.',      5, 4, 1),
    ('Ottimo rapporto qualità/prezzo', 'Camera pulita, colazione abbondante. Tornerò sicuramente!',   4, 5, 1),
    ('Vista mozzafiato',            'Il Canal Grande visto dalla finestra è indimenticabile.',         5, 4, 2),
    ('Rilassante e autentico',      'L agriturismo è un gioiello nascosto, pace assoluta.',           5, 5, 3),
    ('Comodo per visitare Napoli',  'Posizione ottima, personale disponibile.',                        4, 4, 4);

-- ==================================================
-- PostgreSQL database dump complete — ndovado_db
-- ==================================================

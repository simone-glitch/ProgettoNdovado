--
-- PostgreSQL database dump
--

-- Dumped from database version 18.3 (Postgres.app)
-- Dumped by pg_dump version 18.3 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clienti; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clienti (
                                id_cliente integer NOT NULL,
                                nome character varying(100) NOT NULL,
                                email_contatto character varying(100),
                                piva character varying(11)
);


ALTER TABLE public.clienti OWNER TO postgres;

--
-- Name: clienti_id_cliente_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.clienti_id_cliente_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.clienti_id_cliente_seq OWNER TO postgres;

--
-- Name: clienti_id_cliente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.clienti_id_cliente_seq OWNED BY public.clienti.id_cliente;


--
-- Name: cronologiachat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cronologiachat (
                                       id_messaggio integer NOT NULL,
                                       testo text NOT NULL,
                                       ruolo character varying(10) NOT NULL,
                                       data_invio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                       id_utente integer NOT NULL
);


ALTER TABLE public.cronologiachat OWNER TO postgres;

--
-- Name: cronologiachat_id_messaggio_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cronologiachat_id_messaggio_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cronologiachat_id_messaggio_seq OWNER TO postgres;

--
-- Name: cronologiachat_id_messaggio_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cronologiachat_id_messaggio_seq OWNED BY public.cronologiachat.id_messaggio;


--
-- Name: messaggi_chat; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messaggi_chat (
                                      id integer NOT NULL,
                                      testo text NOT NULL,
                                      ruolo character varying(10) NOT NULL,
                                      data_invio timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
                                      utente_id integer NOT NULL
);


ALTER TABLE public.messaggi_chat OWNER TO postgres;

--
-- Name: messaggi_chat_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messaggi_chat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messaggi_chat_id_seq OWNER TO postgres;

--
-- Name: messaggi_chat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messaggi_chat_id_seq OWNED BY public.messaggi_chat.id;


--
-- Name: progetti; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.progetti (
                                 id_progetto integer NOT NULL,
                                 nome_progetto character varying(100) NOT NULL,
                                 stato character varying(20) DEFAULT 'ACTIVE',
                                 data_fine date,
                                 id_cliente integer,
                                 data_inizio date,
                                 repository_github character varying(255),
                                 CONSTRAINT check_stato_progetto CHECK (stato IN ('ACTIVE', 'COMPLETED'))
);

ALTER TABLE public.progetti OWNER TO postgres;

--
-- Name: progetti_id_progetto_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.progetti_id_progetto_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.progetti_id_progetto_seq OWNER TO postgres;

--
-- Name: progetti_id_progetto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.progetti_id_progetto_seq OWNED BY public.progetti.id_progetto;


--
-- Name: task; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.task (
                             id_task integer NOT NULL,
                             titolo_task character varying(100) NOT NULL,
                             descrizione_task text,
                             id_progetto integer
);


ALTER TABLE public.task OWNER TO postgres;

--
-- Name: task_id_task_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.task_id_task_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.task_id_task_seq OWNER TO postgres;

--
-- Name: task_id_task_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.task_id_task_seq OWNED BY public.task.id_task;


--
-- Name: team; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team (
                             id_team integer NOT NULL,
                             nome_team character varying(100) NOT NULL
);


ALTER TABLE public.team OWNER TO postgres;

--
-- Name: team_id_team_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.team_id_team_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.team_id_team_seq OWNER TO postgres;

--
-- Name: team_id_team_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.team_id_team_seq OWNED BY public.team.id_team;


--
-- Name: team_progetto; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.team_progetto (
                                      id_team integer NOT NULL,
                                      id_progetto integer NOT NULL
);


ALTER TABLE public.team_progetto OWNER TO postgres;

--
-- Name: timesheet; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.timesheet (
                                  id_timesheet integer NOT NULL,
                                  data_lavoro date NOT NULL,
                                  ore numeric(4,2) NOT NULL,
                                  descrizione text,
                                  id_utente integer,
                                  id_task integer
);


ALTER TABLE public.timesheet OWNER TO postgres;

--
-- Name: timesheet_id_timesheet_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.timesheet_id_timesheet_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.timesheet_id_timesheet_seq OWNER TO postgres;

--
-- Name: timesheet_id_timesheet_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.timesheet_id_timesheet_seq OWNED BY public.timesheet.id_timesheet;


--
-- Name: utente_team; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utente_team (
                                    id_utente integer NOT NULL,
                                    id_team integer NOT NULL
);


ALTER TABLE public.utente_team OWNER TO postgres;

--
-- Name: utenti; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.utenti (
                               id_utente integer NOT NULL,
                               nome character varying(100) NOT NULL,
                               cognome character varying(100) NOT NULL,
                               email character varying(100) NOT NULL,
                               password character varying(255) NOT NULL,
                               ruolo character varying(20) NOT NULL,
                               CONSTRAINT check_ruolo_valido CHECK (((ruolo)::text = ANY ((ARRAY['ADMIN'::character varying, 'USER'::character varying])::text[])))
);


ALTER TABLE public.utenti OWNER TO postgres;

--
-- Name: utenti_id_utente_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.utenti_id_utente_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.utenti_id_utente_seq OWNER TO postgres;

--
-- Name: utenti_id_utente_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.utenti_id_utente_seq OWNED BY public.utenti.id_utente;


--
-- Name: clienti id_cliente; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clienti ALTER COLUMN id_cliente SET DEFAULT nextval('public.clienti_id_cliente_seq'::regclass);


--
-- Name: cronologiachat id_messaggio; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cronologiachat ALTER COLUMN id_messaggio SET DEFAULT nextval('public.cronologiachat_id_messaggio_seq'::regclass);


--
-- Name: messaggi_chat id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messaggi_chat ALTER COLUMN id SET DEFAULT nextval('public.messaggi_chat_id_seq'::regclass);


--
-- Name: progetti id_progetto; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progetti ALTER COLUMN id_progetto SET DEFAULT nextval('public.progetti_id_progetto_seq'::regclass);


--
-- Name: task id_task; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task ALTER COLUMN id_task SET DEFAULT nextval('public.task_id_task_seq'::regclass);


--
-- Name: team id_team; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team ALTER COLUMN id_team SET DEFAULT nextval('public.team_id_team_seq'::regclass);


--
-- Name: timesheet id_timesheet; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timesheet ALTER COLUMN id_timesheet SET DEFAULT nextval('public.timesheet_id_timesheet_seq'::regclass);


--
-- Name: utenti id_utente; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utenti ALTER COLUMN id_utente SET DEFAULT nextval('public.utenti_id_utente_seq'::regclass);


--
-- Name: clienti clienti_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clienti
    ADD CONSTRAINT clienti_pkey PRIMARY KEY (id_cliente);


--
-- Name: cronologiachat cronologiachat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cronologiachat
    ADD CONSTRAINT cronologiachat_pkey PRIMARY KEY (id_messaggio);


--
-- Name: messaggi_chat messaggi_chat_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messaggi_chat
    ADD CONSTRAINT messaggi_chat_pkey PRIMARY KEY (id);


--
-- Name: progetti progetti_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progetti
    ADD CONSTRAINT progetti_pkey PRIMARY KEY (id_progetto);


--
-- Name: task task_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_pkey PRIMARY KEY (id_task);


--
-- Name: team team_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team
    ADD CONSTRAINT team_pkey PRIMARY KEY (id_team);


--
-- Name: team_progetto team_progetto_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_progetto
    ADD CONSTRAINT team_progetto_pkey PRIMARY KEY (id_team, id_progetto);


--
-- Name: timesheet timesheet_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_pkey PRIMARY KEY (id_timesheet);


--
-- Name: utente_team utente_team_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utente_team
    ADD CONSTRAINT utente_team_pkey PRIMARY KEY (id_utente, id_team);


--
-- Name: utenti utenti_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utenti
    ADD CONSTRAINT utenti_email_key UNIQUE (email);


--
-- Name: utenti utenti_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utenti
    ADD CONSTRAINT utenti_pkey PRIMARY KEY (id_utente);


--
-- Name: messaggi_chat fk_utente; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messaggi_chat
    ADD CONSTRAINT fk_utente FOREIGN KEY (utente_id) REFERENCES public.utenti(id_utente) ON DELETE CASCADE;


--
-- Name: cronologiachat fk_utente_chat; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cronologiachat
    ADD CONSTRAINT fk_utente_chat FOREIGN KEY (id_utente) REFERENCES public.utenti(id_utente) ON DELETE CASCADE;


--
-- Name: progetti progetti_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.progetti
    ADD CONSTRAINT progetti_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.clienti(id_cliente);


--
-- Name: task task_id_progetto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task
    ADD CONSTRAINT task_id_progetto_fkey FOREIGN KEY (id_progetto) REFERENCES public.progetti(id_progetto);


--
-- Name: team_progetto team_progetto_id_progetto_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_progetto
    ADD CONSTRAINT team_progetto_id_progetto_fkey FOREIGN KEY (id_progetto) REFERENCES public.progetti(id_progetto);


--
-- Name: team_progetto team_progetto_id_team_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.team_progetto
    ADD CONSTRAINT team_progetto_id_team_fkey FOREIGN KEY (id_team) REFERENCES public.team(id_team);


--
-- Name: timesheet timesheet_id_task_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_id_task_fkey FOREIGN KEY (id_task) REFERENCES public.task(id_task);


--
-- Name: timesheet timesheet_id_utente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.timesheet
    ADD CONSTRAINT timesheet_id_utente_fkey FOREIGN KEY (id_utente) REFERENCES public.utenti(id_utente);


--
-- Name: utente_team utente_team_id_team_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utente_team
    ADD CONSTRAINT utente_team_id_team_fkey FOREIGN KEY (id_team) REFERENCES public.team(id_team);


--
-- Name: utente_team utente_team_id_utente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.utente_team
    ADD CONSTRAINT utente_team_id_utente_fkey FOREIGN KEY (id_utente) REFERENCES public.utenti(id_utente);


--
-- PostgreSQL database dump complete
--
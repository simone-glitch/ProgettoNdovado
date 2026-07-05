-- ==================================================
-- MIGRAZIONE: foto_hotel.url_foto  varchar(500) -> text
-- --------------------------------------------------
-- Le foto della struttura caricate dal wizard "Aggiungi hotel" sono immagini
-- come data URL base64 (upload da file), coerenti con foto_camere.dati_foto
-- (già di tipo text). La colonna varchar(500) non poteva contenerle: qui la
-- allarghiamo a text. È un allargamento sicuro: gli URL esterni già presenti
-- (foto di esempio) restano validi.
-- ==================================================

ALTER TABLE public.foto_hotel ALTER COLUMN url_foto TYPE text;

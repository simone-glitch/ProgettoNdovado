# Ndovado

Piattaforma di prenotazione hotel in stile Trivago, dedicata alle camere d'albergo.
Gli utenti cercano e prenotano strutture, lasciano recensioni e dialogano con host e
assistenza; gli host pubblicano e gestiscono le proprie strutture, camere, disponibilità
e prezzi; gli amministratori moderano le pubblicazioni e gestiscono utenti e assistenza.
È integrato **NdovAI**, un assistente virtuale.

## Stack tecnologico

- **Frontend:** Angular 21 (TypeScript), CSS responsive scritto a mano, Leaflet +
  OpenStreetMap per le mappe, Chart.js per i grafici delle statistiche.
- **Backend:** Spring Boot con pattern **DAO** (JdbcTemplate) su **PostgreSQL**, pattern
  **Proxy** per il caricamento lazy delle relazioni Hotel → Camere/Servizi, `@RestController`
  con scambio dati in JSON.
- **API/servizi esterni:** Google Gemini (assistente NdovAI), Nominatim/OpenStreetMap
  (geocoding degli indirizzi).

## Prerequisiti

- JDK 21+
- Node.js 20+ e npm
- PostgreSQL 14+

## 1. Database

Crea il database e importa lo schema principale:

```bash
createdb ndovado_db
psql -d ndovado_db -f schema_database_ndovado.sql
```

Applica poi le migrazioni presenti nella root (`migration_*.sql`):

```bash
psql -d ndovado_db -f migration_foto_camere.sql
psql -d ndovado_db -f migration_telefono_utenti.sql
psql -d ndovado_db -f migration_bozze_hotel.sql
psql -d ndovado_db -f migration_foto_hotel_text.sql
psql -d ndovado_db -f migration_blocchi_hotel.sql
psql -d ndovado_db -f migration_conversazioni.sql
psql -d ndovado_db -f migration_archivio_conversazioni.sql
```

## 2. Configurazione

Copia il file di esempio e inserisci i tuoi valori:

```bash
cp src/main/resources/application.properties.example src/main/resources/application.properties
```

Compila almeno le credenziali PostgreSQL e `gemini.api.key` (una tua chiave da
[Google AI Studio](https://aistudio.google.com/app/apikey)); le credenziali SMTP servono
solo se vuoi l'invio delle email (recupero password).

> `application.properties` è escluso dal versionamento perché contiene dati sensibili.

## 3. Avvio

Installa le dipendenze del frontend (la prima volta):

```bash
cd frontend
npm install
cd ..
```

Poi avvia backend e frontend:

- **Windows (rapido):** esegui `start.bat` (oppure `start.ps1`). Apre il frontend su
  http://localhost:4200 e il backend su http://localhost:8080.
- **Manuale:**
  ```bash
  ./gradlew bootRun          # backend su :8080 (su Windows avvia anche il frontend)
  cd frontend && npm start   # frontend su :4200 (se non parte da solo)
  ```

L'applicazione è disponibile su **http://localhost:4200**.

# Database

Script SQL del progetto (PostgreSQL).

## Ripristino del database

Il file da usare e' `dump_ndovado_db.sql` (schema + dati di esempio):

    createdb -U postgres ndovado_db
    psql -U postgres -d ndovado_db -f database/dump_ndovado_db.sql

## Altri file

- `schema_database_ndovado.sql`: struttura delle tabelle.
- `migration_*.sql`: modifiche allo schema applicate durante lo sviluppo.

package com.webappunical.applicationwebbackhand.dao;

import com.webappunical.applicationwebbackhand.model.Utente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Types;
import java.util.List;
import java.util.Map;

@Repository
public class UtenteJDBC {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<Utente> utenteRowMapper = (rs, rowNum) -> {
        Utente utente = new Utente();
        utente.setId(rs.getInt("id_utente"));
        utente.setNome(rs.getString("nome"));
        utente.setCognome(rs.getString("cognome"));
        utente.setEmail(rs.getString("email"));
        utente.setPassword(rs.getString("password"));
        utente.setRuolo(rs.getString("ruolo"));
        utente.setBanned(rs.getBoolean("banned"));
        return utente;
    };

    public void salva(Utente utente) {
        String query = "INSERT INTO utenti (nome, cognome, email, password, ruolo) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(query,
                utente.getNome(), utente.getCognome(),
                utente.getEmail(), utente.getPassword(), utente.getRuolo());
    }

    public Utente trovaPerId(Integer id) {
        String query = "SELECT * FROM utenti WHERE id_utente = ?";
        try {
            return jdbcTemplate.queryForObject(query, utenteRowMapper, id);
        } catch (Exception e) {
            return null;
        }
    }

    public Utente trovaPerEmail(String email) {
        String query = "SELECT * FROM utenti WHERE email = ?";
        try {
            return jdbcTemplate.queryForObject(query, utenteRowMapper, email);
        } catch (Exception e) {
            return null;
        }
    }

    public List<Utente> trovaTutti() {
        return jdbcTemplate.query("SELECT * FROM utenti ORDER BY nome, cognome", utenteRowMapper);
    }

    public void aggiorna(Utente utente) {
        String query = "UPDATE utenti SET nome = ?, cognome = ?, email = ?, ruolo = ? WHERE id_utente = ?";
        jdbcTemplate.update(query,
                utente.getNome(), utente.getCognome(),
                utente.getEmail(), utente.getRuolo(), utente.getId());
    }

    public void aggiornaPassword(Integer id, String nuovaPasswordHash) {
        jdbcTemplate.update("UPDATE utenti SET password = ? WHERE id_utente = ?", nuovaPasswordHash, id);
    }

    public void setBanned(Integer id, boolean banned) {
        jdbcTemplate.update("UPDATE utenti SET banned = ? WHERE id_utente = ?", banned, id);
    }

    public void promuoviAdAdmin(Integer id) {
        jdbcTemplate.update("UPDATE utenti SET ruolo = 'ADMIN' WHERE id_utente = ?", id);
    }

    public void elimina(Integer id) {
        jdbcTemplate.update("DELETE FROM utenti WHERE id_utente = ?", id);
    }

    public List<Map<String, Object>> searchUsers(int page, int size, String name, String role) {
        String sql = """
                SELECT id_utente, nome, cognome, email, ruolo, banned
                FROM utenti
                WHERE (? IS NULL OR (nome ILIKE ? OR cognome ILIKE ?))
                  AND (? = 'ALL' OR ruolo = ?)
                ORDER BY nome, cognome
                LIMIT ? OFFSET ?
                """;

        Object[] params;
        int[] types;

        if (name == null || name.trim().isEmpty()) {
            params = new Object[]{null, null, null, role, role, size, (page - 1) * size};
            types  = new int[]{Types.VARCHAR, Types.VARCHAR, Types.VARCHAR, Types.VARCHAR, Types.VARCHAR, Types.INTEGER, Types.INTEGER};
        } else {
            String pattern = "%" + name + "%";
            params = new Object[]{name, pattern, pattern, role, role, size, (page - 1) * size};
            types  = new int[]{Types.VARCHAR, Types.VARCHAR, Types.VARCHAR, Types.VARCHAR, Types.VARCHAR, Types.INTEGER, Types.INTEGER};
        }

        return jdbcTemplate.queryForList(sql, params, types);
    }

    public int countUsers(String name, String role) {
        String sql = """
                SELECT COUNT(*) FROM utenti
                WHERE (? IS NULL OR (nome ILIKE ? OR cognome ILIKE ?))
                  AND (? = 'ALL' OR ruolo = ?)
                """;

        Object[] params;
        int[] types;

        if (name == null || name.trim().isEmpty()) {
            params = new Object[]{null, null, null, role, role};
            types  = new int[]{Types.VARCHAR, Types.VARCHAR, Types.VARCHAR, Types.VARCHAR, Types.VARCHAR};
        } else {
            String pattern = "%" + name + "%";
            params = new Object[]{name, pattern, pattern, role, role};
            types  = new int[]{Types.VARCHAR, Types.VARCHAR, Types.VARCHAR, Types.VARCHAR, Types.VARCHAR};
        }

        Integer count = jdbcTemplate.queryForObject(sql, params, types, Integer.class);
        return count != null ? count : 0;
    }
}

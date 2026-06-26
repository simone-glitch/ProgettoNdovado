package com.webappunical.applicationwebbackhand.dao;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Repository
public class MessaggioChatDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public Map<String, Object> getAnagrafica(Long idUtente) {
        String sql = """
                SELECT id_utente,
                       nome AS username,
                       email,
                       ruolo
                FROM utenti
                WHERE id_utente = ?
                """;
        try {
            return jdbcTemplate.queryForMap(sql, idUtente);
        } catch (Exception e) {
            System.err.println("ERRORE in getAnagrafica: " + e.getMessage());
            return Collections.emptyMap();
        }
    }

    public List<Map<String, Object>> getUltimiMessaggi(Long idUtente) {
        String sql = """
                SELECT testo, ruolo
                FROM messaggi_chat
                WHERE utente_id = ?
                ORDER BY data_invio DESC
                LIMIT 5
                """;
        try {
            return jdbcTemplate.queryForList(sql, idUtente);
        } catch (Exception e) {
            System.err.println("ERRORE in getUltimiMessaggi: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<Map<String, Object>> getLavoroRecente(Long idUtente) {
        String sql = "SELECT tk.id_task, ts.ore, tk.titolo_task AS nome_task " +
                "FROM timesheet ts JOIN task tk ON ts.id_task = tk.id_task " +
                "WHERE ts.id_utente = ? ORDER BY ts.id_timesheet DESC LIMIT 5";
        try {
            return jdbcTemplate.queryForList(sql, idUtente);
        } catch (Exception e) {
            System.err.println("ERRORE in getLavoroRecente: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    public void salvaMessaggio(String testo, String ruolo, Long utenteId) {
        String sql = "INSERT INTO messaggi_chat (testo, ruolo, utente_id, data_invio) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql, testo, ruolo, utenteId, LocalDateTime.now());
    }
}
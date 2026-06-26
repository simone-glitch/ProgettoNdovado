package com.webappunical.applicationwebbackhand.dao;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class DashboardDAO {

    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public DashboardDAO(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    // ----------------------------------------------------------------
    // Statistiche globali (ADMIN)
    // ----------------------------------------------------------------

    public int contaHotel() {
        Integer c = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM hotel", Integer.class);
        return c != null ? c : 0;
    }

    public int contaUtenti() {
        Integer c = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM utenti WHERE ruolo != 'ADMIN'", Integer.class);
        return c != null ? c : 0;
    }

    public int contaPrenotazioni() {
        Integer c = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM prenotazioni", Integer.class);
        return c != null ? c : 0;
    }

    public double entrateMesseCorrente() {
        String sql = """
                SELECT COALESCE(SUM(prezzo_totale), 0)
                FROM prenotazioni
                WHERE stato = 'CONFERMATA'
                  AND EXTRACT(MONTH FROM data_checkin) = EXTRACT(MONTH FROM CURRENT_DATE)
                  AND EXTRACT(YEAR  FROM data_checkin) = EXTRACT(YEAR  FROM CURRENT_DATE)
                """;
        Double val = jdbcTemplate.queryForObject(sql, Double.class);
        return val != null ? val : 0.0;
    }

    // Grafico: prenotazioni per mese (ultimi 6 mesi)
    public List<Map<String, Object>> prenotazioniPerMese() {
        String sql = """
                SELECT TO_CHAR(data_checkin, 'YYYY-MM') AS mese,
                       COUNT(*)                          AS totale
                FROM prenotazioni
                WHERE data_checkin >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY mese
                ORDER BY mese
                """;
        return jdbcTemplate.queryForList(sql);
    }

    // Grafico: hotel più prenotati
    public List<Map<String, Object>> hotelPiuPrenotati() {
        String sql = """
                SELECT h.nome AS nome_hotel, COUNT(p.id_prenotazione) AS totale_prenotazioni
                FROM hotel h
                LEFT JOIN camere  c ON c.id_hotel  = h.id_hotel
                LEFT JOIN prenotazioni p ON p.id_camera = c.id_camera
                GROUP BY h.id_hotel, h.nome
                ORDER BY totale_prenotazioni DESC
                LIMIT 10
                """;
        return jdbcTemplate.queryForList(sql);
    }

    // ----------------------------------------------------------------
    // Statistiche per HOST
    // ----------------------------------------------------------------

    public int contaHotelHost(Integer idHost) {
        Integer c = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM hotel WHERE id_proprietario = ?", Integer.class, idHost);
        return c != null ? c : 0;
    }

    public int contaPrenotazioniHost(Integer idHost) {
        String sql = """
                SELECT COUNT(p.id_prenotazione)
                FROM prenotazioni p
                JOIN camere c ON c.id_camera = p.id_camera
                JOIN hotel  h ON h.id_hotel  = c.id_hotel
                WHERE h.id_proprietario = ?
                """;
        Integer c = jdbcTemplate.queryForObject(sql, Integer.class, idHost);
        return c != null ? c : 0;
    }

    public double entrateMesseCorrenteHost(Integer idHost) {
        String sql = """
                SELECT COALESCE(SUM(p.prezzo_totale), 0)
                FROM prenotazioni p
                JOIN camere c ON c.id_camera = p.id_camera
                JOIN hotel  h ON h.id_hotel  = c.id_hotel
                WHERE h.id_proprietario = ?
                  AND p.stato = 'CONFERMATA'
                  AND EXTRACT(MONTH FROM p.data_checkin) = EXTRACT(MONTH FROM CURRENT_DATE)
                  AND EXTRACT(YEAR  FROM p.data_checkin) = EXTRACT(YEAR  FROM CURRENT_DATE)
                """;
        Double val = jdbcTemplate.queryForObject(sql, Double.class, idHost);
        return val != null ? val : 0.0;
    }

    // Grafico: prenotazioni per hotel (HOST)
    public List<Map<String, Object>> prenotazioniPerHotelHost(Integer idHost) {
        String sql = """
                SELECT h.nome AS nome_hotel, COUNT(p.id_prenotazione) AS totale
                FROM hotel h
                LEFT JOIN camere c ON c.id_hotel = h.id_hotel
                LEFT JOIN prenotazioni p ON p.id_camera = c.id_camera
                WHERE h.id_proprietario = ?
                GROUP BY h.id_hotel, h.nome
                ORDER BY totale DESC
                """;
        return jdbcTemplate.queryForList(sql, idHost);
    }

    // Grafico: andamento mensile entrate (HOST, ultimi 6 mesi)
    public List<Map<String, Object>> andamentoEntrateHost(Integer idHost) {
        String sql = """
                SELECT TO_CHAR(p.data_checkin, 'YYYY-MM') AS mese,
                       COALESCE(SUM(p.prezzo_totale), 0)  AS entrate
                FROM prenotazioni p
                JOIN camere c ON c.id_camera = p.id_camera
                JOIN hotel  h ON h.id_hotel  = c.id_hotel
                WHERE h.id_proprietario = ?
                  AND p.stato = 'CONFERMATA'
                  AND p.data_checkin >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY mese
                ORDER BY mese
                """;
        return jdbcTemplate.queryForList(sql, idHost);
    }

    // Grafico: andamento mensile prenotazioni globali (ADMIN, ultimi 6 mesi)
    public List<Map<String, Object>> andamentoPrenotazioniAdmin() {
        String sql = """
                SELECT TO_CHAR(data_checkin, 'YYYY-MM') AS mese,
                       COUNT(*)                          AS totale
                FROM prenotazioni
                WHERE data_checkin >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY mese
                ORDER BY mese
                """;
        return jdbcTemplate.queryForList(sql);
    }
}

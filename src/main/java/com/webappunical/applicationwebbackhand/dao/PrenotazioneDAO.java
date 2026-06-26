package com.webappunical.applicationwebbackhand.dao;

import com.webappunical.applicationwebbackhand.model.Prenotazione;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
public class PrenotazioneDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<Prenotazione> prenotazioneRowMapper = (rs, rowNum) -> {
        Prenotazione p = new Prenotazione();
        p.setId(rs.getInt("id_prenotazione"));
        p.setDataCheckin(rs.getDate("data_checkin").toLocalDate());
        p.setDataCheckout(rs.getDate("data_checkout").toLocalDate());
        p.setNumOspiti(rs.getInt("num_ospiti"));
        p.setPrezzoTotale(rs.getDouble("prezzo_totale"));
        p.setStato(rs.getString("stato"));
        p.setIdUtente(rs.getInt("id_utente"));
        p.setIdCamera(rs.getInt("id_camera"));
        return p;
    };

    // RowMapper esteso con dati JOIN per la visualizzazione
    private final RowMapper<Prenotazione> prenotazioneConDettagliRowMapper = (rs, rowNum) -> {
        Prenotazione p = prenotazioneRowMapper.mapRow(rs, rowNum);
        try { p.setNomeUtente(rs.getString("nome_utente")); } catch (Exception ignored) {}
        try { p.setTipoCamera(rs.getString("tipo_camera")); } catch (Exception ignored) {}
        try { p.setNomeHotel(rs.getString("nome_hotel"));   } catch (Exception ignored) {}
        return p;
    };

    public Integer salva(Prenotazione p) {
        String sql = """
                INSERT INTO prenotazioni (data_checkin, data_checkout, num_ospiti, prezzo_totale, stato, id_utente, id_camera)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setDate(1, Date.valueOf(p.getDataCheckin()));
            ps.setDate(2, Date.valueOf(p.getDataCheckout()));
            ps.setInt(3, p.getNumOspiti());
            ps.setDouble(4, p.getPrezzoTotale());
            ps.setString(5, p.getStato());
            ps.setInt(6, p.getIdUtente());
            ps.setInt(7, p.getIdCamera());
            return ps;
        }, keyHolder);
        return keyHolder.getKey() != null ? keyHolder.getKey().intValue() : null;
    }

    public Prenotazione trovaPerId(Integer id) {
        String sql = """
                SELECT p.*,
                       u.nome || ' ' || u.cognome AS nome_utente,
                       c.tipo                     AS tipo_camera,
                       h.nome                     AS nome_hotel
                FROM prenotazioni p
                JOIN utenti  u ON u.id_utente = p.id_utente
                JOIN camere  c ON c.id_camera = p.id_camera
                JOIN hotel   h ON h.id_hotel  = c.id_hotel
                WHERE p.id_prenotazione = ?
                """;
        try {
            return jdbcTemplate.queryForObject(sql, prenotazioneConDettagliRowMapper, id);
        } catch (Exception e) {
            return null;
        }
    }

    public List<Prenotazione> trovaPerUtente(Integer idUtente) {
        String sql = """
                SELECT p.*,
                       u.nome || ' ' || u.cognome AS nome_utente,
                       c.tipo                     AS tipo_camera,
                       h.nome                     AS nome_hotel
                FROM prenotazioni p
                JOIN utenti  u ON u.id_utente = p.id_utente
                JOIN camere  c ON c.id_camera = p.id_camera
                JOIN hotel   h ON h.id_hotel  = c.id_hotel
                WHERE p.id_utente = ?
                ORDER BY p.data_checkin DESC
                """;
        return jdbcTemplate.query(sql, prenotazioneConDettagliRowMapper, idUtente);
    }

    public List<Prenotazione> trovaPerHotel(Integer idHotel) {
        String sql = """
                SELECT p.*,
                       u.nome || ' ' || u.cognome AS nome_utente,
                       c.tipo                     AS tipo_camera,
                       h.nome                     AS nome_hotel
                FROM prenotazioni p
                JOIN utenti  u ON u.id_utente = p.id_utente
                JOIN camere  c ON c.id_camera = p.id_camera
                JOIN hotel   h ON h.id_hotel  = c.id_hotel
                WHERE h.id_hotel = ?
                ORDER BY p.data_checkin DESC
                """;
        return jdbcTemplate.query(sql, prenotazioneConDettagliRowMapper, idHotel);
    }

    public List<Prenotazione> trovaTutte() {
        String sql = """
                SELECT p.*,
                       u.nome || ' ' || u.cognome AS nome_utente,
                       c.tipo                     AS tipo_camera,
                       h.nome                     AS nome_hotel
                FROM prenotazioni p
                JOIN utenti  u ON u.id_utente = p.id_utente
                JOIN camere  c ON c.id_camera = p.id_camera
                JOIN hotel   h ON h.id_hotel  = c.id_hotel
                ORDER BY p.data_checkin DESC
                """;
        return jdbcTemplate.query(sql, prenotazioneConDettagliRowMapper);
    }

    public void aggiornaStato(Integer id, String nuovoStato) {
        jdbcTemplate.update("UPDATE prenotazioni SET stato = ? WHERE id_prenotazione = ?", nuovoStato, id);
    }

    public void elimina(Integer id) {
        jdbcTemplate.update("DELETE FROM prenotazioni WHERE id_prenotazione = ?", id);
    }

    public boolean verificaDisponibilita(Integer idCamera, String dataCheckin, String dataCheckout) {
        String sql = """
                SELECT COUNT(*) FROM prenotazioni
                WHERE id_camera = ?
                  AND stato != 'CANCELLATA'
                  AND data_checkin < ?::date
                  AND data_checkout > ?::date
                """;
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, idCamera, dataCheckout, dataCheckin);
        return count != null && count == 0;
    }
}

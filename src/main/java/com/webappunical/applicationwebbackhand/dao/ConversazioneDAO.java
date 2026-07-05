package com.webappunical.applicationwebbackhand.dao;

import com.webappunical.applicationwebbackhand.model.Conversazione;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Types;
import java.util.List;

@Repository
public class ConversazioneDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<Conversazione> mapper = (rs, rowNum) -> {
        Conversazione c = new Conversazione();
        c.setId(rs.getInt("id_conversazione"));
        c.setIdGuest(rs.getInt("id_guest"));
        c.setIdHost(rs.getInt("id_host"));
        int hotel = rs.getInt("id_hotel");
        c.setIdHotel(rs.wasNull() ? null : hotel);
        c.setArchiviataGuest(rs.getBoolean("archiviata_guest"));
        c.setArchiviataHost(rs.getBoolean("archiviata_host"));
        return c;
    };

    public Conversazione trovaPerCoppia(Integer idGuest, Integer idHost) {
        String sql = "SELECT * FROM conversazioni WHERE id_guest = ? AND id_host = ?";
        try {
            return jdbcTemplate.queryForObject(sql, mapper, idGuest, idHost);
        } catch (Exception e) {
            return null;
        }
    }

    public Conversazione trovaPerId(Integer id) {
        String sql = "SELECT * FROM conversazioni WHERE id_conversazione = ?";
        try {
            return jdbcTemplate.queryForObject(sql, mapper, id);
        } catch (Exception e) {
            return null;
        }
    }

    /** Tutte le conversazioni in cui l'utente è ospite o host. */
    public List<Conversazione> trovaPerUtente(Integer idUtente) {
        String sql = "SELECT * FROM conversazioni WHERE id_guest = ? OR id_host = ?";
        return jdbcTemplate.query(sql, mapper, idUtente, idUtente);
    }

    /**
     * Tutte le conversazioni di assistenza (il cui host è un admin). Servono per
     * mostrare ogni segnalazione a qualunque amministratore, non solo al primo.
     */
    public List<Conversazione> trovaAssistenza() {
        String sql = "SELECT c.* FROM conversazioni c "
                + "JOIN utenti u ON c.id_host = u.id_utente WHERE u.ruolo = 'ADMIN'";
        return jdbcTemplate.query(sql, mapper);
    }

    public Integer salva(Integer idGuest, Integer idHost, Integer idHotel) {
        String sql = "INSERT INTO conversazioni (id_guest, id_host, id_hotel) VALUES (?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, new String[]{"id_conversazione"});
            ps.setInt(1, idGuest);
            ps.setInt(2, idHost);
            if (idHotel != null) ps.setInt(3, idHotel); else ps.setNull(3, Types.INTEGER);
            return ps;
        }, keyHolder);
        return keyHolder.getKey() != null ? keyHolder.getKey().intValue() : null;
    }

    /** Archivia/ripristina la conversazione per il lato indicato (guest o host). */
    public void setArchiviata(Integer idConversazione, boolean lato, boolean archiviata) {
        // lato = true -> guest, false -> host.
        String colonna = lato ? "archiviata_guest" : "archiviata_host";
        String sql = "UPDATE conversazioni SET " + colonna + " = ? WHERE id_conversazione = ?";
        jdbcTemplate.update(sql, archiviata, idConversazione);
    }
}

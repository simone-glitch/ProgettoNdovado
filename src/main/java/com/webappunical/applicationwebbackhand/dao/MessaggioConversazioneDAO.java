package com.webappunical.applicationwebbackhand.dao;

import com.webappunical.applicationwebbackhand.model.MessaggioConversazione;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public class MessaggioConversazioneDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<MessaggioConversazione> mapper = (rs, rowNum) -> {
        MessaggioConversazione m = new MessaggioConversazione();
        m.setId(rs.getInt("id_messaggio"));
        m.setIdConversazione(rs.getInt("id_conversazione"));
        m.setIdMittente(rs.getInt("id_mittente"));
        m.setTesto(rs.getString("testo"));
        Timestamp ts = rs.getTimestamp("data_invio");
        m.setDataInvio(ts != null ? ts.toLocalDateTime() : null);
        m.setLetto(rs.getBoolean("letto"));
        return m;
    };

    public MessaggioConversazione trovaPerId(Integer idMessaggio) {
        String sql = "SELECT * FROM messaggi_conversazione WHERE id_messaggio = ?";
        try {
            return jdbcTemplate.queryForObject(sql, mapper, idMessaggio);
        } catch (Exception e) {
            return null;
        }
    }

    public List<MessaggioConversazione> trovaPerConversazione(Integer idConversazione) {
        String sql = "SELECT * FROM messaggi_conversazione WHERE id_conversazione = ? ORDER BY data_invio, id_messaggio";
        return jdbcTemplate.query(sql, mapper, idConversazione);
    }

    public MessaggioConversazione ultimoMessaggio(Integer idConversazione) {
        String sql = "SELECT * FROM messaggi_conversazione WHERE id_conversazione = ? ORDER BY data_invio DESC, id_messaggio DESC LIMIT 1";
        try {
            return jdbcTemplate.queryForObject(sql, mapper, idConversazione);
        } catch (Exception e) {
            return null;
        }
    }

    /** Messaggi non letti destinati a un utente (cioè inviati dall'altro). */
    public int contaNonLetti(Integer idConversazione, Integer idDestinatario) {
        String sql = "SELECT COUNT(*) FROM messaggi_conversazione WHERE id_conversazione = ? AND id_mittente <> ? AND letto = false";
        Integer n = jdbcTemplate.queryForObject(sql, Integer.class, idConversazione, idDestinatario);
        return n != null ? n : 0;
    }

    public Integer salva(MessaggioConversazione m) {
        String sql = "INSERT INTO messaggi_conversazione (id_conversazione, id_mittente, testo, data_invio, letto) VALUES (?, ?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        LocalDateTime ora = LocalDateTime.now();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, new String[]{"id_messaggio"});
            ps.setInt(1, m.getIdConversazione());
            ps.setInt(2, m.getIdMittente());
            ps.setString(3, m.getTesto());
            ps.setTimestamp(4, Timestamp.valueOf(ora));
            ps.setBoolean(5, false);
            return ps;
        }, keyHolder);
        m.setDataInvio(ora);
        return keyHolder.getKey() != null ? keyHolder.getKey().intValue() : null;
    }

    /** Segna come letti i messaggi della conversazione ricevuti dall'utente (inviati dall'altro). */
    public void segnaLetti(Integer idConversazione, Integer idLettore) {
        String sql = "UPDATE messaggi_conversazione SET letto = true WHERE id_conversazione = ? AND id_mittente <> ? AND letto = false";
        jdbcTemplate.update(sql, idConversazione, idLettore);
    }
}

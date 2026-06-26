package com.webappunical.applicationwebbackhand.dao;

import com.webappunical.applicationwebbackhand.model.Recensione;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.sql.Timestamp;
import java.util.List;

@Repository
public class RecensioneDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<Recensione> recensioneRowMapper = (rs, rowNum) -> {
        Recensione r = new Recensione();
        r.setId(rs.getInt("id_recensione"));
        r.setTitolo(rs.getString("titolo"));
        r.setTesto(rs.getString("testo"));
        r.setVoto(rs.getInt("voto"));
        Timestamp ts = rs.getTimestamp("data_recensione");
        if (ts != null) r.setDataRecensione(ts.toLocalDateTime());
        r.setIdUtente(rs.getInt("id_utente"));
        r.setIdHotel(rs.getInt("id_hotel"));
        try { r.setNomeAutore(rs.getString("nome_autore")); } catch (Exception ignored) {}
        return r;
    };

    public Integer salva(Recensione recensione) {
        String sql = """
                INSERT INTO recensioni (titolo, testo, voto, id_utente, id_hotel)
                VALUES (?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, recensione.getTitolo());
            ps.setString(2, recensione.getTesto());
            ps.setInt(3, recensione.getVoto());
            ps.setInt(4, recensione.getIdUtente());
            ps.setInt(5, recensione.getIdHotel());
            return ps;
        }, keyHolder);
        return keyHolder.getKey() != null ? keyHolder.getKey().intValue() : null;
    }

    public Recensione trovaPerId(Integer id) {
        String sql = """
                SELECT r.*, u.nome || ' ' || u.cognome AS nome_autore
                FROM recensioni r
                JOIN utenti u ON u.id_utente = r.id_utente
                WHERE r.id_recensione = ?
                """;
        try {
            return jdbcTemplate.queryForObject(sql, recensioneRowMapper, id);
        } catch (Exception e) {
            return null;
        }
    }

    public List<Recensione> trovaPerHotel(Integer idHotel) {
        String sql = """
                SELECT r.*, u.nome || ' ' || u.cognome AS nome_autore
                FROM recensioni r
                JOIN utenti u ON u.id_utente = r.id_utente
                WHERE r.id_hotel = ?
                ORDER BY r.data_recensione DESC
                """;
        return jdbcTemplate.query(sql, recensioneRowMapper, idHotel);
    }

    public List<Recensione> trovaPerUtente(Integer idUtente) {
        String sql = """
                SELECT r.*, u.nome || ' ' || u.cognome AS nome_autore
                FROM recensioni r
                JOIN utenti u ON u.id_utente = r.id_utente
                WHERE r.id_utente = ?
                ORDER BY r.data_recensione DESC
                """;
        return jdbcTemplate.query(sql, recensioneRowMapper, idUtente);
    }

    public void elimina(Integer id) {
        jdbcTemplate.update("DELETE FROM recensioni WHERE id_recensione = ?", id);
    }

    public boolean utenteHaGiaRecensito(Integer idUtente, Integer idHotel) {
        String sql = "SELECT COUNT(*) FROM recensioni WHERE id_utente = ? AND id_hotel = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, idUtente, idHotel);
        return count != null && count > 0;
    }
}

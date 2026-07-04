package com.webappunical.applicationwebbackhand.dao;

import com.webappunical.applicationwebbackhand.model.BloccoHotel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.PreparedStatement;
import java.util.List;

@Repository
public class BloccoHotelDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<BloccoHotel> rowMapper = (rs, rowNum) -> {
        BloccoHotel b = new BloccoHotel();
        b.setId(rs.getInt("id_blocco"));
        b.setIdHotel(rs.getInt("id_hotel"));
        b.setDataInizio(rs.getDate("data_inizio").toLocalDate());
        b.setDataFine(rs.getDate("data_fine").toLocalDate());
        b.setMotivo(rs.getString("motivo"));
        return b;
    };

    public List<BloccoHotel> trovaPerHotel(Integer idHotel) {
        String sql = "SELECT * FROM blocchi_hotel WHERE id_hotel = ? ORDER BY data_inizio";
        return jdbcTemplate.query(sql, rowMapper, idHotel);
    }

    public BloccoHotel trovaPerId(Integer idBlocco) {
        String sql = "SELECT * FROM blocchi_hotel WHERE id_blocco = ?";
        try {
            return jdbcTemplate.queryForObject(sql, rowMapper, idBlocco);
        } catch (Exception e) {
            return null;
        }
    }

    public Integer salva(BloccoHotel b) {
        String sql = "INSERT INTO blocchi_hotel (id_hotel, data_inizio, data_fine, motivo) VALUES (?, ?, ?, ?)";
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, new String[]{"id_blocco"});
            ps.setInt(1, b.getIdHotel());
            ps.setDate(2, Date.valueOf(b.getDataInizio()));
            ps.setDate(3, Date.valueOf(b.getDataFine()));
            ps.setString(4, b.getMotivo());
            return ps;
        }, keyHolder);
        return keyHolder.getKey() != null ? keyHolder.getKey().intValue() : null;
    }

    public void elimina(Integer idBlocco) {
        jdbcTemplate.update("DELETE FROM blocchi_hotel WHERE id_blocco = ?", idBlocco);
    }

    /**
     * Esiste un blocco dell'hotel che si sovrappone all'intervallo di soggiorno
     * [checkin, checkout)? Le notti occupate vanno da checkin (incluso) a
     * checkout-1 (incluso); un blocco copre [data_inizio, data_fine] inclusi.
     * C'è sovrapposizione se: data_fine >= checkin AND data_inizio < checkout.
     */
    public boolean esisteSovrapposizione(Integer idHotel, String checkin, String checkout) {
        String sql = """
                SELECT COUNT(*) FROM blocchi_hotel
                WHERE id_hotel = ?
                  AND data_fine   >= ?::date
                  AND data_inizio  < ?::date
                """;
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, idHotel, checkin, checkout);
        return count != null && count > 0;
    }
}

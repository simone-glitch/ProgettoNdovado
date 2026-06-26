package com.webappunical.applicationwebbackhand.dao;

import com.webappunical.applicationwebbackhand.model.Servizio;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ServizioDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<Servizio> servizioRowMapper = (rs, rowNum) -> {
        Servizio s = new Servizio();
        s.setId(rs.getInt("id_servizio"));
        s.setNome(rs.getString("nome"));
        s.setIcona(rs.getString("icona"));
        return s;
    };

    public List<Servizio> trovaTutti() {
        return jdbcTemplate.query("SELECT * FROM servizi ORDER BY nome", servizioRowMapper);
    }

    public List<Servizio> trovaPerHotel(Integer idHotel) {
        String sql = """
                SELECT s.* FROM servizi s
                JOIN hotel_servizi hs ON hs.id_servizio = s.id_servizio
                WHERE hs.id_hotel = ?
                ORDER BY s.nome
                """;
        return jdbcTemplate.query(sql, servizioRowMapper, idHotel);
    }

    public Servizio trovaPerId(Integer id) {
        try {
            return jdbcTemplate.queryForObject(
                    "SELECT * FROM servizi WHERE id_servizio = ?", servizioRowMapper, id);
        } catch (Exception e) {
            return null;
        }
    }
}

package com.webappunical.applicationwebbackhand.dao;

import com.webappunical.applicationwebbackhand.model.Camera;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
public class CameraDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<Camera> cameraRowMapper = (rs, rowNum) -> {
        Camera c = new Camera();
        c.setId(rs.getInt("id_camera"));
        c.setTipo(rs.getString("tipo"));
        c.setDescrizione(rs.getString("descrizione"));
        c.setPrezzoNotte(rs.getDouble("prezzo_notte"));
        c.setCapienza(rs.getInt("capienza"));
        c.setDisponibile(rs.getBoolean("disponibile"));
        c.setIdHotel(rs.getInt("id_hotel"));
        return c;
    };

    public List<Camera> trovaPerHotel(Integer idHotel) {
        String sql = "SELECT * FROM camere WHERE id_hotel = ? ORDER BY prezzo_notte";
        return jdbcTemplate.query(sql, cameraRowMapper, idHotel);
    }

    public Camera trovaPerId(Integer id) {
        String sql = "SELECT * FROM camere WHERE id_camera = ?";
        try {
            return jdbcTemplate.queryForObject(sql, cameraRowMapper, id);
        } catch (Exception e) {
            return null;
        }
    }

    public List<Camera> trovaDisponibili(Integer idHotel) {
        String sql = "SELECT * FROM camere WHERE id_hotel = ? AND disponibile = true ORDER BY prezzo_notte";
        return jdbcTemplate.query(sql, cameraRowMapper, idHotel);
    }

    public Integer salva(Camera camera) {
        String sql = """
                INSERT INTO camere (tipo, descrizione, prezzo_notte, capienza, disponibile, id_hotel)
                VALUES (?, ?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, camera.getTipo());
            ps.setString(2, camera.getDescrizione());
            ps.setDouble(3, camera.getPrezzoNotte());
            ps.setInt(4, camera.getCapienza());
            ps.setBoolean(5, camera.isDisponibile());
            ps.setInt(6, camera.getIdHotel());
            return ps;
        }, keyHolder);
        return keyHolder.getKey() != null ? keyHolder.getKey().intValue() : null;
    }

    public void aggiorna(Camera camera) {
        String sql = """
                UPDATE camere
                SET tipo = ?, descrizione = ?, prezzo_notte = ?, capienza = ?, disponibile = ?
                WHERE id_camera = ?
                """;
        jdbcTemplate.update(sql,
                camera.getTipo(), camera.getDescrizione(),
                camera.getPrezzoNotte(), camera.getCapienza(),
                camera.isDisponibile(), camera.getId());
    }

    public void setDisponibile(Integer idCamera, boolean disponibile) {
        jdbcTemplate.update("UPDATE camere SET disponibile = ? WHERE id_camera = ?", disponibile, idCamera);
    }

    public void elimina(Integer id) {
        jdbcTemplate.update("DELETE FROM camere WHERE id_camera = ?", id);
    }
}

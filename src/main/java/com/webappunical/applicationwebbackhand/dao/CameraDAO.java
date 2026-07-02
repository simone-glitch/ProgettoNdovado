package com.webappunical.applicationwebbackhand.dao;

import com.webappunical.applicationwebbackhand.model.Camera;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.ArrayList;
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
        List<Camera> camere = jdbcTemplate.query(sql, cameraRowMapper, idHotel);
        camere.forEach(c -> c.setFoto(caricaFoto(c.getId())));
        return camere;
    }

    public Camera trovaPerId(Integer id) {
        String sql = "SELECT * FROM camere WHERE id_camera = ?";
        try {
            Camera camera = jdbcTemplate.queryForObject(sql, cameraRowMapper, id);
            if (camera != null) camera.setFoto(caricaFoto(id));
            return camera;
        } catch (Exception e) {
            return null;
        }
    }

    public List<Camera> trovaDisponibili(Integer idHotel) {
        String sql = "SELECT * FROM camere WHERE id_hotel = ? AND disponibile = true ORDER BY prezzo_notte";
        List<Camera> camere = jdbcTemplate.query(sql, cameraRowMapper, idHotel);
        camere.forEach(c -> c.setFoto(caricaFoto(c.getId())));
        return camere;
    }

    public Integer salva(Camera camera) {
        String sql = """
                INSERT INTO camere (tipo, descrizione, prezzo_notte, capienza, disponibile, id_hotel)
                VALUES (?, ?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, new String[]{"id_camera"});
            ps.setString(1, camera.getTipo());
            ps.setString(2, camera.getDescrizione());
            ps.setDouble(3, camera.getPrezzoNotte());
            ps.setInt(4, camera.getCapienza());
            ps.setBoolean(5, camera.isDisponibile());
            ps.setInt(6, camera.getIdHotel());
            return ps;
        }, keyHolder);
        Integer id = keyHolder.getKey() != null ? keyHolder.getKey().intValue() : null;
        if (id != null && camera.getFoto() != null) sostituisciFoto(id, camera.getFoto());
        return id;
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
        if (camera.getFoto() != null) sostituisciFoto(camera.getId(), camera.getFoto());
    }

    // ── Galleria camera ─────────────────────────────────────────────
    // Le foto sono data URL base64. Su create/update sostituiamo l'intera
    // galleria con quella inviata dal client: semplice e sempre coerente.

    public List<String> caricaFoto(Integer idCamera) {
        String sql = "SELECT dati_foto FROM foto_camere WHERE id_camera = ? ORDER BY id_foto";
        try {
            return jdbcTemplate.queryForList(sql, String.class, idCamera);
        } catch (DataAccessException e) {
            // La galleria è un arricchimento opzionale: se la tabella non è
            // ancora stata migrata non deve impedire di visualizzare la camera.
            return new ArrayList<>();
        }
    }

    public void sostituisciFoto(Integer idCamera, List<String> foto) {
        jdbcTemplate.update("DELETE FROM foto_camere WHERE id_camera = ?", idCamera);
        if (foto == null) return;
        for (String dati : foto) {
            if (dati != null && !dati.isBlank()) {
                jdbcTemplate.update(
                        "INSERT INTO foto_camere (dati_foto, id_camera) VALUES (?, ?)",
                        dati, idCamera);
            }
        }
    }

    public void setDisponibile(Integer idCamera, boolean disponibile) {
        jdbcTemplate.update("UPDATE camere SET disponibile = ? WHERE id_camera = ?", disponibile, idCamera);
    }

    public void elimina(Integer id) {
        jdbcTemplate.update("DELETE FROM camere WHERE id_camera = ?", id);
    }
}

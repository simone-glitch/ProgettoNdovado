package com.webappunical.applicationwebbackhand.dao;

import com.webappunical.applicationwebbackhand.model.Hotel;
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
public class HotelDAO {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final RowMapper<Hotel> hotelRowMapper = (rs, rowNum) -> {
        Hotel h = new Hotel();
        h.setId(rs.getInt("id_hotel"));
        h.setNome(rs.getString("nome"));
        h.setDescrizione(rs.getString("descrizione"));
        h.setCitta(rs.getString("citta"));
        h.setIndirizzo(rs.getString("indirizzo"));
        h.setStelle(rs.getInt("stelle"));
        h.setLatitudine(rs.getDouble("latitudine"));
        h.setLongitudine(rs.getDouble("longitudine"));
        h.setIdProprietario(rs.getInt("id_proprietario"));
        h.setStato(rs.getString("stato"));
        h.setCheckIn(rs.getString("check_in"));
        h.setCheckOut(rs.getString("check_out"));
        h.setTelefono(rs.getString("telefono"));
        h.setEmail(rs.getString("email"));
        // getObject preserva il null (getInt/getDouble restituirebbero 0)
        h.setNumCamere(rs.getObject("num_camere") != null ? rs.getInt("num_camere") : null);
        h.setPrezzoMedio(rs.getObject("prezzo_medio") != null ? rs.getDouble("prezzo_medio") : null);
        return h;
    };

    public List<Hotel> trovaTutti() {
        String sql = "SELECT * FROM hotel ORDER BY nome";
        return jdbcTemplate.query(sql, hotelRowMapper);
    }

    // Listato pubblico: solo strutture pubblicate (per home e viste non autenticate).
    public List<Hotel> trovaPubblicati() {
        String sql = "SELECT * FROM hotel WHERE stato = 'PUBBLICATO' ORDER BY nome";
        return jdbcTemplate.query(sql, hotelRowMapper);
    }

    /**
     * Vista di moderazione ADMIN: tutte le strutture tranne le BOZZA (private
     * dell'host finché non le invia), arricchite col proprietario per mostrare
     * "di chi è" ciascuna struttura.
     */
    public List<Hotel> trovaPerModerazione() {
        String sql = """
                SELECT h.*, u.nome AS prop_nome, u.cognome AS prop_cognome, u.email AS prop_email
                FROM hotel h
                JOIN utenti u ON u.id_utente = h.id_proprietario
                WHERE h.stato <> 'BOZZA'
                ORDER BY h.nome
                """;
        return jdbcTemplate.query(sql, (rs, n) -> {
            Hotel h = hotelRowMapper.mapRow(rs, n);
            String nome = ((rs.getString("prop_nome") == null ? "" : rs.getString("prop_nome")) + " "
                    + (rs.getString("prop_cognome") == null ? "" : rs.getString("prop_cognome"))).trim();
            h.setNomeProprietario(nome.isEmpty() ? null : nome);
            h.setEmailProprietario(rs.getString("prop_email"));
            return h;
        });
    }

    public List<Hotel> cerca(String citta, Integer stelleMin, Double prezzoMax, Integer numOspiti) {
        StringBuilder sql = new StringBuilder("""
                SELECT DISTINCT h.* FROM hotel h
                LEFT JOIN camere c ON c.id_hotel = h.id_hotel
                WHERE h.stato = 'PUBBLICATO'
                """);

        if (citta != null && !citta.isBlank())
            sql.append(" AND h.citta ILIKE '%").append(citta.replace("'", "''")).append("%'");
        if (stelleMin != null)
            sql.append(" AND h.stelle >= ").append(stelleMin);
        if (prezzoMax != null)
            sql.append(" AND c.prezzo_notte <= ").append(prezzoMax);
        if (numOspiti != null)
            sql.append(" AND c.capienza >= ").append(numOspiti);

        sql.append(" ORDER BY h.nome");
        return jdbcTemplate.query(sql.toString(), hotelRowMapper);
    }

    // Unicità dei contatti tra strutture: un telefono/email non può essere usato
    // da due hotel diversi. excludeId (l'hotel che si sta modificando) è escluso
    // dal confronto così un update che non tocca il contatto non falsi-positiva.
    public boolean esisteAltroHotelConTelefono(String telefono, Integer excludeId) {
        if (telefono == null || telefono.isBlank()) return false;
        String base = "SELECT COUNT(*) FROM hotel WHERE telefono = ?";
        Integer count = (excludeId != null)
                ? jdbcTemplate.queryForObject(base + " AND id_hotel <> ?", Integer.class, telefono, excludeId)
                : jdbcTemplate.queryForObject(base, Integer.class, telefono);
        return count != null && count > 0;
    }

    public boolean esisteAltroHotelConEmail(String email, Integer excludeId) {
        if (email == null || email.isBlank()) return false;
        String base = "SELECT COUNT(*) FROM hotel WHERE LOWER(email) = LOWER(?)";
        Integer count = (excludeId != null)
                ? jdbcTemplate.queryForObject(base + " AND id_hotel <> ?", Integer.class, email, excludeId)
                : jdbcTemplate.queryForObject(base, Integer.class, email);
        return count != null && count > 0;
    }

    public Hotel trovaPerId(Integer id) {
        String sql = "SELECT * FROM hotel WHERE id_hotel = ?";
        try {
            return jdbcTemplate.queryForObject(sql, hotelRowMapper, id);
        } catch (Exception e) {
            return null;
        }
    }

    public List<Hotel> trovaPerProprietario(Integer idProprietario) {
        String sql = "SELECT * FROM hotel WHERE id_proprietario = ? ORDER BY nome";
        return jdbcTemplate.query(sql, hotelRowMapper, idProprietario);
    }

    public Integer salva(Hotel hotel) {
        String sql = """
                INSERT INTO hotel (nome, descrizione, citta, indirizzo, stelle, latitudine, longitudine,
                                   id_proprietario, stato, check_in, check_out, telefono, email, num_camere, prezzo_medio)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """;
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql, new String[]{"id_hotel"});
            ps.setString(1, hotel.getNome());
            ps.setString(2, hotel.getDescrizione());
            ps.setString(3, hotel.getCitta());
            ps.setString(4, hotel.getIndirizzo());
            ps.setInt(5, hotel.getStelle());
            ps.setObject(6, hotel.getLatitudine());
            ps.setObject(7, hotel.getLongitudine());
            ps.setInt(8, hotel.getIdProprietario());
            ps.setString(9, hotel.getStato() != null ? hotel.getStato() : "BOZZA");
            ps.setString(10, hotel.getCheckIn());
            ps.setString(11, hotel.getCheckOut());
            ps.setString(12, hotel.getTelefono());
            ps.setString(13, hotel.getEmail());
            ps.setObject(14, hotel.getNumCamere());
            ps.setObject(15, hotel.getPrezzoMedio());
            return ps;
        }, keyHolder);
        return keyHolder.getKey() != null ? keyHolder.getKey().intValue() : null;
    }

    public void aggiorna(Hotel hotel) {
        String sql = """
                UPDATE hotel
                SET nome = ?, descrizione = ?, citta = ?, indirizzo = ?,
                    stelle = ?, latitudine = ?, longitudine = ?,
                    stato = COALESCE(?, stato), check_in = ?, check_out = ?,
                    telefono = ?, email = ?, num_camere = ?, prezzo_medio = ?
                WHERE id_hotel = ?
                """;
        jdbcTemplate.update(sql,
                hotel.getNome(), hotel.getDescrizione(), hotel.getCitta(), hotel.getIndirizzo(),
                hotel.getStelle(), hotel.getLatitudine(), hotel.getLongitudine(),
                hotel.getStato(), hotel.getCheckIn(), hotel.getCheckOut(),
                hotel.getTelefono(), hotel.getEmail(), hotel.getNumCamere(), hotel.getPrezzoMedio(),
                hotel.getId());
    }

    // Aggiorna solo lo stato (ciclo di vita): usato dalle transizioni di moderazione,
    // separato dall'update generico dei dati così un edit non può alterare lo stato.
    public void aggiornaStato(Integer idHotel, String stato) {
        jdbcTemplate.update("UPDATE hotel SET stato = ? WHERE id_hotel = ?", stato, idHotel);
    }

    public void elimina(Integer id) {
        jdbcTemplate.update("DELETE FROM hotel WHERE id_hotel = ?", id);
    }

    // Gestione servizi hotel
    public void aggiungiServizio(Integer idHotel, Integer idServizio) {
        jdbcTemplate.update(
                "INSERT INTO hotel_servizi (id_hotel, id_servizio) VALUES (?, ?) ON CONFLICT DO NOTHING",
                idHotel, idServizio);
    }

    public void rimuoviServizio(Integer idHotel, Integer idServizio) {
        jdbcTemplate.update("DELETE FROM hotel_servizi WHERE id_hotel = ? AND id_servizio = ?",
                idHotel, idServizio);
    }

    public void aggiornaServizi(Integer idHotel, List<Integer> idServizi) {
        jdbcTemplate.update("DELETE FROM hotel_servizi WHERE id_hotel = ?", idHotel);
        if (idServizi != null) {
            for (Integer idServizio : idServizi) {
                jdbcTemplate.update("INSERT INTO hotel_servizi (id_hotel, id_servizio) VALUES (?, ?)",
                        idHotel, idServizio);
            }
        }
    }

    public List<String> trovaServiziNomi(Integer idHotel) {
        String sql = """
                SELECT s.nome FROM servizi s
                JOIN hotel_servizi hs ON hs.id_servizio = s.id_servizio
                WHERE hs.id_hotel = ?
                ORDER BY s.nome
                """;
        return jdbcTemplate.queryForList(sql, String.class, idHotel);
    }

    // Gestione foto hotel
    public void aggiungiFoto(Integer idHotel, String urlFoto, String didascalia) {
        jdbcTemplate.update(
                "INSERT INTO foto_hotel (url_foto, didascalia, id_hotel) VALUES (?, ?, ?)",
                urlFoto, didascalia, idHotel);
    }

    public void eliminaFoto(Integer idFoto) {
        jdbcTemplate.update("DELETE FROM foto_hotel WHERE id_foto = ?", idFoto);
    }

    // Sostituisce l'intera galleria dell'hotel con quella passata (come per le
    // camere): semplice e sempre coerente con quanto inviato dal wizard.
    public void sostituisciFoto(Integer idHotel, List<String> foto) {
        jdbcTemplate.update("DELETE FROM foto_hotel WHERE id_hotel = ?", idHotel);
        if (foto == null) return;
        for (String url : foto) {
            if (url != null && !url.isBlank()) {
                jdbcTemplate.update(
                        "INSERT INTO foto_hotel (url_foto, didascalia, id_hotel) VALUES (?, ?, ?)",
                        url, null, idHotel);
            }
        }
    }

    public List<String> trovaFotoUrls(Integer idHotel) {
        String sql = "SELECT url_foto FROM foto_hotel WHERE id_hotel = ? ORDER BY id_foto";
        return jdbcTemplate.queryForList(sql, String.class, idHotel);
    }

    public Double trovaVotoMedio(Integer idHotel) {
        String sql = "SELECT AVG(voto) FROM recensioni WHERE id_hotel = ?";
        return jdbcTemplate.queryForObject(sql, Double.class, idHotel);
    }
}

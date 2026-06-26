package com.webappunical.applicationwebbackhand.service;

import com.webappunical.applicationwebbackhand.dao.CameraDAO;
import com.webappunical.applicationwebbackhand.dao.HotelDAO;
import com.webappunical.applicationwebbackhand.dao.HotelProxy;
import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.model.Hotel;
import com.webappunical.applicationwebbackhand.model.Utente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class HotelService {

    private final HotelDAO  hotelDAO;
    private final CameraDAO cameraDAO;
    private final UtenteJDBC utenteJDBC;

    @Autowired
    public HotelService(HotelDAO hotelDAO, CameraDAO cameraDAO, UtenteJDBC utenteJDBC) {
        this.hotelDAO   = hotelDAO;
        this.cameraDAO  = cameraDAO;
        this.utenteJDBC = utenteJDBC;
    }

    // Restituisce la lista degli hotel per la pagina di ricerca.
    // Le camere NON vengono caricate qui (lazy via Proxy sul dettaglio).
    public List<Hotel> cerca(String citta, Integer stelleMin, Double prezzoMax, Integer numOspiti) {
        List<Hotel> hotels = hotelDAO.cerca(citta, stelleMin, prezzoMax, numOspiti);
        // Arricchisce ogni card con il voto medio (una query leggera per hotel)
        hotels.forEach(h -> h.setVotoMedio(hotelDAO.trovaVotoMedio(h.getId())));
        return hotels;
    }

    public List<Hotel> getTutti() {
        List<Hotel> hotels = hotelDAO.trovaTutti();
        hotels.forEach(h -> h.setVotoMedio(hotelDAO.trovaVotoMedio(h.getId())));
        return hotels;
    }

    /**
     * Restituisce l'hotel con dettagli completi usando il Pattern Proxy.
     * Le camere, i servizi e le foto vengono caricati lazily dal proxy
     * solo quando Jackson li serializza nella response JSON.
     */
    public Hotel getDettaglio(Integer id) {
        Hotel hotelBase = hotelDAO.trovaPerId(id);
        if (hotelBase == null) {
            throw new RuntimeException("Hotel non trovato con id: " + id);
        }
        hotelBase.setVotoMedio(hotelDAO.trovaVotoMedio(id));
        // Crea il proxy: camere/servizi/foto vengono caricati solo alla prima get()
        return new HotelProxy(hotelBase, cameraDAO, hotelDAO);
    }

    public List<Hotel> getHotelDelHost(String emailHost) {
        Utente host = utenteJDBC.trovaPerEmail(emailHost);
        if (host == null) throw new RuntimeException("Utente non trovato.");
        List<Hotel> hotels = hotelDAO.trovaPerProprietario(host.getId());
        hotels.forEach(h -> h.setVotoMedio(hotelDAO.trovaVotoMedio(h.getId())));
        return hotels;
    }

    @Transactional
    public Hotel crea(Hotel hotel, String emailProprietario) {
        Utente proprietario = utenteJDBC.trovaPerEmail(emailProprietario);
        if (proprietario == null) throw new RuntimeException("Utente non trovato.");
        if (!"HOST".equals(proprietario.getRuolo()) && !"ADMIN".equals(proprietario.getRuolo())) {
            throw new SecurityException("Solo i HOST possono creare hotel.");
        }
        hotel.setIdProprietario(proprietario.getId());
        Integer id = hotelDAO.salva(hotel);
        hotel.setId(id);
        return hotel;
    }

    @Transactional
    public Hotel aggiorna(Hotel hotel, String emailRichiedente) {
        verificaProprietaOAdmin(hotel.getId(), emailRichiedente);
        hotelDAO.aggiorna(hotel);
        return hotel;
    }

    @Transactional
    public void aggiornaServizi(Integer idHotel, List<Integer> idServizi, String emailRichiedente) {
        verificaProprietaOAdmin(idHotel, emailRichiedente);
        hotelDAO.aggiornaServizi(idHotel, idServizi);
    }

    @Transactional
    public void aggiungiFoto(Integer idHotel, String urlFoto, String didascalia, String emailRichiedente) {
        verificaProprietaOAdmin(idHotel, emailRichiedente);
        hotelDAO.aggiungiFoto(idHotel, urlFoto, didascalia);
    }

    @Transactional
    public void eliminaFoto(Integer idFoto, Integer idHotel, String emailRichiedente) {
        verificaProprietaOAdmin(idHotel, emailRichiedente);
        hotelDAO.eliminaFoto(idFoto);
    }

    @Transactional
    public void elimina(Integer id, String emailRichiedente) {
        verificaProprietaOAdmin(id, emailRichiedente);
        hotelDAO.elimina(id);
    }

    // Verifica che il richiedente sia il proprietario dell'hotel o un ADMIN
    private void verificaProprietaOAdmin(Integer idHotel, String email) {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        if (utente == null) throw new RuntimeException("Utente non trovato.");
        Hotel hotel = hotelDAO.trovaPerId(idHotel);
        if (hotel == null) throw new RuntimeException("Hotel non trovato.");
        if ("ADMIN".equals(utente.getRuolo())) return;
        if (!hotel.getIdProprietario().equals(utente.getId())) {
            throw new SecurityException("Non sei il proprietario di questo hotel.");
        }
    }
}

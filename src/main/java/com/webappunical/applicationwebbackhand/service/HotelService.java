package com.webappunical.applicationwebbackhand.service;

import com.webappunical.applicationwebbackhand.dao.CameraDAO;
import com.webappunical.applicationwebbackhand.dao.HotelDAO;
import com.webappunical.applicationwebbackhand.dao.HotelProxy;
import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.model.Hotel;
import com.webappunical.applicationwebbackhand.model.StatoHotel;
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
    private final GeocodingService geocodingService;

    @Autowired
    public HotelService(HotelDAO hotelDAO, CameraDAO cameraDAO, UtenteJDBC utenteJDBC,
                        GeocodingService geocodingService) {
        this.hotelDAO   = hotelDAO;
        this.cameraDAO  = cameraDAO;
        this.utenteJDBC = utenteJDBC;
        this.geocodingService = geocodingService;
    }

    // Coordinata assente o nulla (0/near-0): un hotel italiano non sta a lat/lon 0.
    private static boolean coordinataMancante(Double v) {
        return v == null || Math.abs(v) < 0.0001;
    }

    /**
     * Rete di sicurezza: se le coordinate mancano (geocodifica lato browser fallita
     * o assente), le ricava lato server dall'indirizzo. Così ogni hotel finisce con
     * coordinate valide e la mappa nel dettaglio compare sempre.
     */
    private void riempiCoordinateSeMancanti(Hotel hotel) {
        if (!coordinataMancante(hotel.getLatitudine()) && !coordinataMancante(hotel.getLongitudine())) {
            return;
        }
        GeocodingService.Coordinate c = geocodingService.geocodifica(hotel.getIndirizzo(), hotel.getCitta());
        if (c != null) {
            hotel.setLatitudine(c.lat());
            hotel.setLongitudine(c.lon());
        }
    }

    // Restituisce la lista degli hotel per la pagina di ricerca.
    // Le camere NON vengono caricate qui (lazy via Proxy sul dettaglio).
    public List<Hotel> cerca(String citta, Integer stelleMin, Double prezzoMax, Integer numOspiti) {
        List<Hotel> hotels = hotelDAO.cerca(citta, stelleMin, prezzoMax, numOspiti);
        // Arricchisce ogni card con il voto medio (una query leggera per hotel)
        hotels.forEach(h -> h.setVotoMedio(hotelDAO.trovaVotoMedio(h.getId())));
        return hotels;
    }

    // Listato pubblico (home, viste non autenticate): solo strutture pubblicate.
    public List<Hotel> getTutti() {
        List<Hotel> hotels = hotelDAO.trovaPubblicati();
        hotels.forEach(h -> h.setVotoMedio(hotelDAO.trovaVotoMedio(h.getId())));
        return hotels;
    }

    // Vista di moderazione ADMIN: tutte tranne le bozze altrui, con il proprietario.
    public List<Hotel> getTuttiPerAdmin() {
        List<Hotel> hotels = hotelDAO.trovaPerModerazione();
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
        // Ogni nuova struttura nasce come BOZZA: la pubblicazione passa sempre
        // per l'invio in revisione e l'approvazione dell'admin.
        hotel.setStato(StatoHotel.BOZZA.name());
        verificaContattiUnivoci(hotel);
        riempiCoordinateSeMancanti(hotel);
        Integer id = hotelDAO.salva(hotel);
        hotel.setId(id);
        // Le camere NON vengono più generate automaticamente: l'host le aggiunge
        // singolarmente (tipo, prezzo, capienza, descrizione, foto) dal wizard o
        // da "Gestione camere", così ogni camera è definita esplicitamente.
        return hotel;
    }

    @Transactional
    public Hotel aggiorna(Hotel hotel, String emailRichiedente) {
        verificaProprietaOAdmin(hotel.getId(), emailRichiedente);
        Hotel esistente = hotelDAO.trovaPerId(hotel.getId());
        if (esistente == null) throw new RuntimeException("Hotel non trovato.");

        // I form di modifica sono parziali (es. la modifica rapida invia solo
        // nome/descrizione/città/indirizzo/stelle): per i campi non forniti si
        // conservano i valori esistenti, così un edit non azzera più i dati
        // operativi (contatti, camere/prezzo) né le coordinate della mappa.
        if (hotel.getCheckIn()     == null) hotel.setCheckIn(esistente.getCheckIn());
        if (hotel.getCheckOut()    == null) hotel.setCheckOut(esistente.getCheckOut());
        if (hotel.getTelefono()    == null) hotel.setTelefono(esistente.getTelefono());
        if (hotel.getEmail()       == null) hotel.setEmail(esistente.getEmail());
        if (hotel.getNumCamere()   == null) hotel.setNumCamere(esistente.getNumCamere());
        if (hotel.getPrezzoMedio() == null) hotel.setPrezzoMedio(esistente.getPrezzoMedio());
        if (coordinataMancante(hotel.getLatitudine()))  hotel.setLatitudine(esistente.getLatitudine());
        if (coordinataMancante(hotel.getLongitudine())) hotel.setLongitudine(esistente.getLongitudine());

        verificaContattiUnivoci(hotel);

        // L'update generico NON cambia mai lo stato: azzerandolo, il COALESCE nel
        // DAO conserva quello corrente. Lo stato si modifica solo via cambiaStato().
        hotel.setStato(null);
        riempiCoordinateSeMancanti(hotel);
        hotelDAO.aggiorna(hotel);
        return hotel;
    }

    // Rifiuta telefono/email già usati da un'altra struttura (contatti univoci).
    private void verificaContattiUnivoci(Hotel hotel) {
        if (hotelDAO.esisteAltroHotelConTelefono(hotel.getTelefono(), hotel.getId())) {
            throw new IllegalArgumentException("Numero di telefono già utilizzato da un'altra struttura.");
        }
        if (hotelDAO.esisteAltroHotelConEmail(hotel.getEmail(), hotel.getId())) {
            throw new IllegalArgumentException("Email già utilizzata da un'altra struttura.");
        }
    }

    /**
     * Applica una transizione di stato all'hotel, validando sia la proprietà/ruolo
     * sia l'ammissibilità della transizione secondo la macchina a stati.
     *
     * @param nuovoStato stato destinazione (case-insensitive)
     * @param email      email del richiedente autenticato
     * @throws SecurityException     se il richiedente non è proprietario né admin
     * @throws IllegalStateException se la transizione non è ammessa per quel ruolo
     * @throws IllegalArgumentException se lo stato destinazione non è valido
     */
    @Transactional
    public Hotel cambiaStato(Integer idHotel, String nuovoStato, String email) {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        if (utente == null) throw new RuntimeException("Utente non trovato.");
        Hotel hotel = hotelDAO.trovaPerId(idHotel);
        if (hotel == null) throw new RuntimeException("Hotel non trovato.");

        StatoHotel destinazione = StatoHotel.daStringa(nuovoStato);
        if (destinazione == null) {
            throw new IllegalArgumentException("Stato non valido: " + nuovoStato);
        }
        StatoHotel corrente = StatoHotel.daStringa(hotel.getStato());
        if (corrente == null) corrente = StatoHotel.BOZZA; // difensivo: dati storici incoerenti

        boolean isAdmin = "ADMIN".equals(utente.getRuolo());
        boolean isProprietario = hotel.getIdProprietario() != null
                && hotel.getIdProprietario().equals(utente.getId());
        if (!isAdmin && !isProprietario) {
            throw new SecurityException("Non sei il proprietario di questo hotel.");
        }

        StatoHotel.Attore attore = isAdmin ? StatoHotel.Attore.ADMIN : StatoHotel.Attore.PROPRIETARIO;
        if (corrente == destinazione || !corrente.puoTransire(destinazione, attore)) {
            throw new IllegalStateException(
                    "Transizione non ammessa: da " + corrente + " a " + destinazione + ".");
        }

        hotelDAO.aggiornaStato(idHotel, destinazione.name());
        hotel.setStato(destinazione.name());
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
    public void sostituisciFoto(Integer idHotel, List<String> foto, String emailRichiedente) {
        verificaProprietaOAdmin(idHotel, emailRichiedente);
        hotelDAO.sostituisciFoto(idHotel, foto);
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

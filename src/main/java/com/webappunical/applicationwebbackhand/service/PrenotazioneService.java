package com.webappunical.applicationwebbackhand.service;

import com.webappunical.applicationwebbackhand.dao.CameraDAO;
import com.webappunical.applicationwebbackhand.dao.PrenotazioneDAO;
import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.model.Camera;
import com.webappunical.applicationwebbackhand.model.Prenotazione;
import com.webappunical.applicationwebbackhand.model.Utente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class PrenotazioneService {

    private final PrenotazioneDAO prenotazioneDAO;
    private final CameraDAO       cameraDAO;
    private final UtenteJDBC      utenteJDBC;

    @Autowired
    public PrenotazioneService(PrenotazioneDAO prenotazioneDAO, CameraDAO cameraDAO, UtenteJDBC utenteJDBC) {
        this.prenotazioneDAO = prenotazioneDAO;
        this.cameraDAO       = cameraDAO;
        this.utenteJDBC      = utenteJDBC;
    }

    public List<Prenotazione> getPrenotazioniUtente(String email) {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        if (utente == null) throw new RuntimeException("Utente non trovato.");
        if ("HOST".equals(utente.getRuolo())) {
            return prenotazioneDAO.trovaPerProprietario(utente.getId());
        }
        return prenotazioneDAO.trovaPerUtente(utente.getId());
    }

    public List<Prenotazione> getPrenotazioniHotel(Integer idHotel) {
        return prenotazioneDAO.trovaPerHotel(idHotel);
    }

    public boolean puoiRecensire(String emailUtente, Integer idHotel) {
        Utente utente = utenteJDBC.trovaPerEmail(emailUtente);
        if (utente == null) return false;
        return prenotazioneDAO.hasSoggiornato(utente.getId(), idHotel);
    }

    public List<Prenotazione> getTutte() {
        return prenotazioneDAO.trovaTutte();
    }

    @Transactional
    public Prenotazione crea(Prenotazione prenotazione, String emailGuest) {
        Utente guest = utenteJDBC.trovaPerEmail(emailGuest);
        if (guest == null) throw new RuntimeException("Utente non trovato.");

        Camera camera = cameraDAO.trovaPerId(prenotazione.getIdCamera());
        if (camera == null) throw new RuntimeException("Camera non trovata.");
        if (!camera.isDisponibile()) throw new IllegalStateException("La camera non è disponibile.");

        String checkin  = prenotazione.getDataCheckin().toString();
        String checkout = prenotazione.getDataCheckout().toString();
        boolean libera  = prenotazioneDAO.verificaDisponibilita(camera.getId(), checkin, checkout);
        if (!libera) {
            throw new IllegalStateException("La camera non è disponibile nelle date selezionate.");
        }

        long notti = ChronoUnit.DAYS.between(prenotazione.getDataCheckin(), prenotazione.getDataCheckout());
        if (notti <= 0) throw new IllegalArgumentException("Le date selezionate non sono valide.");

        prenotazione.setIdUtente(guest.getId());
        prenotazione.setPrezzoTotale(camera.getPrezzoNotte() * notti);
        prenotazione.setStato("IN_ATTESA");

        Integer id = prenotazioneDAO.salva(prenotazione);
        prenotazione.setId(id);
        cameraDAO.setDisponibile(camera.getId(), false);
        return prenotazione;
    }

    @Transactional
    public void aggiornaStato(Integer id, String nuovoStato, String emailRichiedente) {
        Prenotazione prenotazione = prenotazioneDAO.trovaPerId(id);
        if (prenotazione == null) throw new RuntimeException("Prenotazione non trovata.");

        Utente utente = utenteJDBC.trovaPerEmail(emailRichiedente);
        if (utente == null) throw new RuntimeException("Utente non trovato.");

        // Il GUEST può solo cancellare le proprie prenotazioni
        if ("GUEST".equals(utente.getRuolo())) {
            if (!prenotazione.getIdUtente().equals(utente.getId())) {
                throw new SecurityException("Non puoi modificare questa prenotazione.");
            }
            if (!"CANCELLATA".equals(nuovoStato)) {
                throw new SecurityException("Il GUEST può solo cancellare la prenotazione.");
            }
        }

        prenotazioneDAO.aggiornaStato(id, nuovoStato);

        if ("CANCELLATA".equals(nuovoStato)) {
            if (!prenotazioneDAO.haAltrePrenotazioniAttive(prenotazione.getIdCamera(), id)) {
                cameraDAO.setDisponibile(prenotazione.getIdCamera(), true);
            }
        }
    }

    @Transactional
    public void elimina(Integer id, String emailRichiedente) {
        Prenotazione prenotazione = prenotazioneDAO.trovaPerId(id);
        if (prenotazione == null) throw new RuntimeException("Prenotazione non trovata.");

        Utente utente = utenteJDBC.trovaPerEmail(emailRichiedente);
        if (utente == null) throw new RuntimeException("Utente non trovato.");

        if (!"ADMIN".equals(utente.getRuolo()) && !prenotazione.getIdUtente().equals(utente.getId())) {
            throw new SecurityException("Non puoi eliminare questa prenotazione.");
        }

        prenotazioneDAO.elimina(id);
    }
}

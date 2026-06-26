package com.webappunical.applicationwebbackhand.service;

import com.webappunical.applicationwebbackhand.dao.RecensioneDAO;
import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.model.Recensione;
import com.webappunical.applicationwebbackhand.model.Utente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RecensioneService {

    private final RecensioneDAO recensioneDAO;
    private final UtenteJDBC    utenteJDBC;

    @Autowired
    public RecensioneService(RecensioneDAO recensioneDAO, UtenteJDBC utenteJDBC) {
        this.recensioneDAO = recensioneDAO;
        this.utenteJDBC    = utenteJDBC;
    }

    public List<Recensione> getRecensioniHotel(Integer idHotel) {
        return recensioneDAO.trovaPerHotel(idHotel);
    }

    public List<Recensione> getRecensioniUtente(String email) {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        if (utente == null) throw new RuntimeException("Utente non trovato.");
        return recensioneDAO.trovaPerUtente(utente.getId());
    }

    @Transactional
    public Recensione aggiungi(Recensione recensione, String emailAutore) {
        Utente autore = utenteJDBC.trovaPerEmail(emailAutore);
        if (autore == null) throw new RuntimeException("Utente non trovato.");
        if (!"GUEST".equals(autore.getRuolo()) && !"ADMIN".equals(autore.getRuolo())) {
            throw new SecurityException("Solo i GUEST possono lasciare recensioni.");
        }
        if (recensioneDAO.utenteHaGiaRecensito(autore.getId(), recensione.getIdHotel())) {
            throw new IllegalStateException("Hai già recensito questo hotel.");
        }
        if (recensione.getVoto() < 1 || recensione.getVoto() > 5) {
            throw new IllegalArgumentException("Il voto deve essere compreso tra 1 e 5.");
        }
        recensione.setIdUtente(autore.getId());
        Integer id = recensioneDAO.salva(recensione);
        recensione.setId(id);
        recensione.setNomeAutore(autore.getNome() + " " + autore.getCognome());
        return recensione;
    }

    @Transactional
    public void elimina(Integer id, String emailRichiedente) {
        Recensione recensione = recensioneDAO.trovaPerId(id);
        if (recensione == null) throw new RuntimeException("Recensione non trovata.");

        Utente utente = utenteJDBC.trovaPerEmail(emailRichiedente);
        if (utente == null) throw new RuntimeException("Utente non trovato.");

        if (!"ADMIN".equals(utente.getRuolo()) && !recensione.getIdUtente().equals(utente.getId())) {
            throw new SecurityException("Non puoi eliminare questa recensione.");
        }
        recensioneDAO.elimina(id);
    }
}

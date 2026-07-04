package com.webappunical.applicationwebbackhand.service;

import com.webappunical.applicationwebbackhand.dao.BloccoHotelDAO;
import com.webappunical.applicationwebbackhand.dao.HotelDAO;
import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.model.BloccoHotel;
import com.webappunical.applicationwebbackhand.model.Hotel;
import com.webappunical.applicationwebbackhand.model.Utente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Gestione dei blocchi di disponibilità di una struttura (ferie, lavori, ecc.).
 * L'host può bloccare/sbloccare intervalli di date per i propri hotel; i blocchi
 * rendono la struttura non prenotabile in quei giorni per tutte le camere.
 */
@Service
public class DisponibilitaService {

    private final BloccoHotelDAO bloccoDAO;
    private final HotelDAO       hotelDAO;
    private final UtenteJDBC     utenteJDBC;

    @Autowired
    public DisponibilitaService(BloccoHotelDAO bloccoDAO, HotelDAO hotelDAO, UtenteJDBC utenteJDBC) {
        this.bloccoDAO  = bloccoDAO;
        this.hotelDAO   = hotelDAO;
        this.utenteJDBC = utenteJDBC;
    }

    /** Blocchi di un hotel: lettura pubblica (servono al calendario di prenotazione). */
    public List<BloccoHotel> getBlocchi(Integer idHotel) {
        return bloccoDAO.trovaPerHotel(idHotel);
    }

    @Transactional
    public BloccoHotel aggiungiBlocco(Integer idHotel, String dataInizioStr, String dataFineStr,
                                      String motivo, String email) {
        verificaProprietaOAdmin(idHotel, email);

        LocalDate inizio, fine;
        try {
            inizio = LocalDate.parse(dataInizioStr);
            fine   = LocalDate.parse(dataFineStr);
        } catch (Exception e) {
            throw new IllegalArgumentException("Date non valide.");
        }
        if (fine.isBefore(inizio)) {
            throw new IllegalArgumentException("La data di fine non può precedere quella di inizio.");
        }
        if (fine.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Non puoi bloccare date già passate.");
        }

        BloccoHotel b = new BloccoHotel();
        b.setIdHotel(idHotel);
        b.setDataInizio(inizio);
        b.setDataFine(fine);
        b.setMotivo(motivo != null && !motivo.isBlank() ? motivo.trim() : null);
        Integer id = bloccoDAO.salva(b);
        b.setId(id);
        return b;
    }

    @Transactional
    public void rimuoviBlocco(Integer idBlocco, String email) {
        BloccoHotel b = bloccoDAO.trovaPerId(idBlocco);
        if (b == null) throw new RuntimeException("Blocco non trovato.");
        verificaProprietaOAdmin(b.getIdHotel(), email);
        bloccoDAO.elimina(idBlocco);
    }

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

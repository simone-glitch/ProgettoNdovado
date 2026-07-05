package com.webappunical.applicationwebbackhand.service;

import com.webappunical.applicationwebbackhand.dao.ConversazioneDAO;
import com.webappunical.applicationwebbackhand.dao.HotelDAO;
import com.webappunical.applicationwebbackhand.dao.MessaggioConversazioneDAO;
import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.model.Conversazione;
import com.webappunical.applicationwebbackhand.model.Hotel;
import com.webappunical.applicationwebbackhand.model.MessaggioConversazione;
import com.webappunical.applicationwebbackhand.model.Utente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Messaggistica privata tra ospiti e host. Ogni conversazione è 1-a-1 (una per
 * coppia guest/host) e nasce quando un ospite contatta l'host di una struttura;
 * entrambi possono poi scriversi. Ospite e host vedono solo le proprie chat.
 */
@Service
public class MessaggisticaService {

    private final ConversazioneDAO conversazioneDAO;
    private final MessaggioConversazioneDAO messaggioDAO;
    private final UtenteJDBC utenteJDBC;
    private final HotelDAO hotelDAO;

    @Autowired
    public MessaggisticaService(ConversazioneDAO conversazioneDAO,
                                MessaggioConversazioneDAO messaggioDAO,
                                UtenteJDBC utenteJDBC, HotelDAO hotelDAO) {
        this.conversazioneDAO = conversazioneDAO;
        this.messaggioDAO     = messaggioDAO;
        this.utenteJDBC       = utenteJDBC;
        this.hotelDAO         = hotelDAO;
    }

    /** Conversazioni dell'utente (come ospite o come host), ordinate per attività recente. */
    public List<Conversazione> getConversazioni(String email) {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        if (utente == null) throw new RuntimeException("Utente non trovato.");
        List<Conversazione> conv = new ArrayList<>(conversazioneDAO.trovaPerUtente(utente.getId()));
        // Un admin vede anche TUTTE le conversazioni di assistenza (segnalazioni
        // incluse), non solo quelle assegnate a lui: così ogni amministratore può
        // gestire qualunque richiesta indipendentemente da chi era il "primo admin".
        if ("ADMIN".equals(utente.getRuolo())) {
            for (Conversazione a : conversazioneDAO.trovaAssistenza()) {
                if (conv.stream().noneMatch(c -> c.getId().equals(a.getId()))) conv.add(a);
            }
        }
        conv.forEach(c -> arricchisci(c, utente.getId()));
        conv.sort(Comparator.comparing(
                Conversazione::getDataUltimoMessaggio,
                Comparator.nullsLast(Comparator.reverseOrder())));
        return conv;
    }

    /** L'utente corrente contatta l'host di una struttura: crea (o recupera) la chat. */
    @Transactional
    public Conversazione avviaConversazione(String email, Integer idHotel) {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        if (utente == null) throw new RuntimeException("Utente non trovato.");
        Hotel hotel = hotelDAO.trovaPerId(idHotel);
        if (hotel == null) throw new RuntimeException("Struttura non trovata.");
        Integer idHost = hotel.getIdProprietario();
        if (idHost == null) throw new RuntimeException("Struttura senza host.");
        if (idHost.equals(utente.getId())) {
            throw new IllegalStateException("Non puoi contattare te stesso.");
        }
        Conversazione esistente = conversazioneDAO.trovaPerCoppia(utente.getId(), idHost);
        if (esistente == null) {
            Integer id = conversazioneDAO.salva(utente.getId(), idHost, idHotel);
            esistente = conversazioneDAO.trovaPerId(id);
        }
        arricchisci(esistente, utente.getId());
        return esistente;
    }

    /** L'utente corrente contatta l'assistenza (un amministratore). */
    @Transactional
    public Conversazione avviaAssistenza(String email) {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        if (utente == null) throw new RuntimeException("Utente non trovato.");
        if ("ADMIN".equals(utente.getRuolo())) {
            throw new IllegalStateException("Sei già l'assistenza.");
        }
        Conversazione esistente = trovaOCreaAssistenza(utente);
        arricchisci(esistente, utente.getId());
        return esistente;
    }

    /** Conversazione di assistenza (utente ↔ primo admin): la recupera o la crea. */
    private Conversazione trovaOCreaAssistenza(Utente utente) {
        Utente admin = utenteJDBC.trovaPrimoAdmin(utente.getId());
        if (admin == null) throw new RuntimeException("Nessun amministratore disponibile.");
        Conversazione esistente = conversazioneDAO.trovaPerCoppia(utente.getId(), admin.getId());
        if (esistente == null) {
            Integer id = conversazioneDAO.salva(utente.getId(), admin.getId(), null);
            esistente = conversazioneDAO.trovaPerId(id);
        }
        return esistente;
    }

    /** Archivia (o ripristina) la conversazione per l'utente che lo richiede. */
    @Transactional
    public Conversazione archivia(Integer idConversazione, String email, boolean archiviata) {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        Conversazione conv = conversazioneDAO.trovaPerId(idConversazione);
        verificaPartecipante(conv, utente);
        boolean lato = utente.getId().equals(conv.getIdGuest()); // true = guest
        conversazioneDAO.setArchiviata(idConversazione, lato, archiviata);
        conv = conversazioneDAO.trovaPerId(idConversazione);
        arricchisci(conv, utente.getId());
        return conv;
    }

    /**
     * Segnala all'assistenza (admin) un messaggio ricevuto: crea/recupera la chat
     * di assistenza dell'utente e vi inserisce il messaggio incriminato come testo.
     */
    @Transactional
    public Conversazione segnalaMessaggio(Integer idMessaggio, String email) {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        if (utente == null) throw new RuntimeException("Utente non trovato.");
        if ("ADMIN".equals(utente.getRuolo())) {
            throw new IllegalStateException("L'assistenza non può inviare segnalazioni.");
        }
        MessaggioConversazione msg = messaggioDAO.trovaPerId(idMessaggio);
        if (msg == null) throw new RuntimeException("Messaggio non trovato.");
        Conversazione origine = conversazioneDAO.trovaPerId(msg.getIdConversazione());
        verificaPartecipante(origine, utente); // solo chi partecipa alla chat può segnalare
        Conversazione assist = trovaOCreaAssistenza(utente);

        Utente mittente = utenteJDBC.trovaPerId(msg.getIdMittente());
        String testo = "[Segnalazione] Messaggio di " + nomeCompleto(mittente)
                + ":\n\"" + msg.getTesto() + "\"";
        MessaggioConversazione m = new MessaggioConversazione();
        m.setIdConversazione(assist.getId());
        m.setIdMittente(utente.getId());
        m.setTesto(testo);
        m.setId(messaggioDAO.salva(m));

        arricchisci(assist, utente.getId());
        return assist;
    }

    /** Messaggi di una conversazione. Segna come letti quelli ricevuti dall'utente. */
    @Transactional
    public List<MessaggioConversazione> getMessaggi(Integer idConversazione, String email) {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        Conversazione conv = conversazioneDAO.trovaPerId(idConversazione);
        verificaPartecipante(conv, utente);
        messaggioDAO.segnaLetti(idConversazione, utente.getId());
        return messaggioDAO.trovaPerConversazione(idConversazione);
    }

    @Transactional
    public MessaggioConversazione inviaMessaggio(Integer idConversazione, String email, String testo) {
        Utente utente = utenteJDBC.trovaPerEmail(email);
        Conversazione conv = conversazioneDAO.trovaPerId(idConversazione);
        verificaPartecipante(conv, utente);
        if (testo == null || testo.isBlank()) {
            throw new IllegalArgumentException("Il messaggio non può essere vuoto.");
        }
        MessaggioConversazione m = new MessaggioConversazione();
        m.setIdConversazione(idConversazione);
        m.setIdMittente(utente.getId());
        m.setTesto(testo.trim());
        Integer id = messaggioDAO.salva(m);
        m.setId(id);
        return m;
    }

    // ── Helpers ──

    private void verificaPartecipante(Conversazione conv, Utente utente) {
        if (utente == null) throw new RuntimeException("Utente non trovato.");
        if (conv == null) throw new RuntimeException("Conversazione non trovata.");
        boolean partecipe = utente.getId().equals(conv.getIdGuest())
                || utente.getId().equals(conv.getIdHost());
        // Qualsiasi admin può gestire (aprire/rispondere) una chat di assistenza,
        // anche se non è l'host a cui era stata originariamente assegnata.
        if (!partecipe && "ADMIN".equals(utente.getRuolo()) && isAssistenza(conv)) {
            partecipe = true;
        }
        if (!partecipe) throw new SecurityException("Non fai parte di questa conversazione.");
    }

    /** Una conversazione è di assistenza quando il suo lato host è un amministratore. */
    private boolean isAssistenza(Conversazione conv) {
        Utente host = utenteJDBC.trovaPerId(conv.getIdHost());
        return host != null && "ADMIN".equals(host.getRuolo());
    }

    private void arricchisci(Conversazione c, Integer richiedenteId) {
        Utente guest = utenteJDBC.trovaPerId(c.getIdGuest());
        Utente host  = utenteJDBC.trovaPerId(c.getIdHost());
        c.setNomeGuest(nomeCompleto(guest));
        c.setNomeHost(nomeCompleto(host));
        // Se il lato "host" è un admin, è una conversazione di assistenza.
        c.setAssistenza(host != null && "ADMIN".equals(host.getRuolo()));
        if (c.getIdHotel() != null) {
            Hotel h = hotelDAO.trovaPerId(c.getIdHotel());
            if (h != null) c.setNomeHotel(h.getNome());
        }
        MessaggioConversazione ultimo = messaggioDAO.ultimoMessaggio(c.getId());
        if (ultimo != null) {
            c.setUltimoMessaggio(ultimo.getTesto());
            c.setDataUltimoMessaggio(ultimo.getDataInvio());
        }
        c.setNonLetti(messaggioDAO.contaNonLetti(c.getId(), richiedenteId));
        // Stato di archiviazione relativo a chi richiede la lista.
        c.setArchiviata(richiedenteId.equals(c.getIdGuest())
                ? c.isArchiviataGuest() : c.isArchiviataHost());
    }

    private String nomeCompleto(Utente u) {
        if (u == null) return "Utente";
        String nome = (u.getNome() == null ? "" : u.getNome());
        String cognome = (u.getCognome() == null ? "" : u.getCognome());
        String full = (nome + " " + cognome).trim();
        return full.isEmpty() ? u.getEmail() : full;
    }
}

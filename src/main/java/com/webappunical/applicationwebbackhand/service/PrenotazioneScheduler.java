package com.webappunical.applicationwebbackhand.service;

import com.webappunical.applicationwebbackhand.dao.CameraDAO;
import com.webappunical.applicationwebbackhand.dao.PrenotazioneDAO;
import jakarta.annotation.PostConstruct;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class PrenotazioneScheduler {

    private final PrenotazioneDAO prenotazioneDAO;
    private final CameraDAO cameraDAO;

    public PrenotazioneScheduler(PrenotazioneDAO prenotazioneDAO, CameraDAO cameraDAO) {
        this.prenotazioneDAO = prenotazioneDAO;
        this.cameraDAO = cameraDAO;
    }

    // Eseguito subito all'avvio del backend
    @PostConstruct
    public void aggiornaAlAvvio() {
        // Migrazione una-tantum: sblocca le camere rimaste "occupate" dalla vecchia
        // logica che disabilitava l'intera camera alla prenotazione. Ora l'occupazione
        // è per-data, quindi una camera prenotata deve restare selezionabile.
        int sbloccate = prenotazioneDAO.ripristinaCamereConPrenotazioni();
        if (sbloccate > 0) {
            System.out.println("[Scheduler] Camere sbloccate (occupazione ora per-data): " + sbloccate);
        }
        eseguiAggiornamentoGiornaliero();
    }

    // Ogni giorno a mezzanotte
    @Scheduled(cron = "0 0 0 * * *")
    public void eseguiAggiornamentoGiornaliero() {
        // Annulla le richieste IN_ATTESA scadute: così le loro date si liberano.
        // La disponibilità è ormai gestita per-data (occupazioni), quindi non si
        // tocca più il flag `disponibile` delle camere, che è controllo dell'host.
        int cancellate = prenotazioneDAO.cancellaScadute();
        if (cancellate > 0) {
            System.out.println("[Scheduler] Prenotazioni IN_ATTESA scadute cancellate: " + cancellate);
        }
    }
}

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
        eseguiAggiornamentoGiornaliero();
    }

    // Ogni giorno a mezzanotte
    @Scheduled(cron = "0 0 0 * * *")
    public void eseguiAggiornamentoGiornaliero() {
        int cancellate = prenotazioneDAO.cancellaScadute();
        if (cancellate > 0) {
            System.out.println("[Scheduler] Prenotazioni IN_ATTESA scadute cancellate: " + cancellate);
        }
        int ripristinate = prenotazioneDAO.ripristinaDisponibilitaCamere();
        if (ripristinate > 0) {
            System.out.println("[Scheduler] Camere ripristinate come disponibili: " + ripristinate);
        }
    }
}

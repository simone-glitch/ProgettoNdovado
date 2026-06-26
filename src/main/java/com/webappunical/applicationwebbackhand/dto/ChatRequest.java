package com.webappunical.applicationwebbackhand.dto;

public class ChatRequest {
    private String messaggio;
    
    // VULNERABILITA' CORRETTA: Rimosso idUtente
    // Questo dato NON DEVE mai arrivare dal client. Lo estraiamo dal token di sicurezza (Authentication).
    // private Long idUtente;

    public String getMessaggio() {
        return messaggio;
    }

    public void setMessaggio(String messaggio) {
        this.messaggio = messaggio;
    }
}

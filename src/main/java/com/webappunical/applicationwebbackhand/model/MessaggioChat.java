package com.webappunical.applicationwebbackhand.model;

import java.time.LocalDateTime;

public class MessaggioChat {

    private Long id;
    private String testo;
    private String ruolo;
    private LocalDateTime dataInvio;
    private Long utenteId;

    public MessaggioChat(Long id, String testo, String ruolo, LocalDateTime dataInvio, Long utenteId) {
        this.id = id;
        this.testo = testo;
        this.ruolo = ruolo;
        this.dataInvio = dataInvio;
        this.utenteId = utenteId;
    }

    public Long getId() {
        return id;
    }

    public String getTesto() {
        return testo;
    }

    public String getRuolo() {
        return ruolo;
    }

    public LocalDateTime getDataInvio() {
        return dataInvio;
    }

    public Long getUtenteId() {
        return utenteId;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTesto(String testo) {
        this.testo = testo;
    }

    public void setRuolo(String ruolo) {
        this.ruolo = ruolo;
    }

    public void setDataInvio(LocalDateTime dataInvio) {
        this.dataInvio = dataInvio;
    }

    public void setUtenteId(Long utenteId) {
        this.utenteId = utenteId;
    }


}



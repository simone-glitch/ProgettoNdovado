package com.webappunical.applicationwebbackhand.dto;

/** Corpo per l'invio di un messaggio in una conversazione. */
public class NuovoMessaggioDTO {
    private String testo;

    public NuovoMessaggioDTO() {}

    public String getTesto() { return testo; }
    public void setTesto(String testo) { this.testo = testo; }
}

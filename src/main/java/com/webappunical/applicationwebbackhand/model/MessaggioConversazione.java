package com.webappunical.applicationwebbackhand.model;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

/**
 * Singolo messaggio all'interno di una {@link Conversazione} guest-host.
 */
public class MessaggioConversazione {

    private Integer id;
    private Integer idConversazione;
    private Integer idMittente;
    private String testo;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dataInvio;
    private boolean letto;

    public MessaggioConversazione() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getIdConversazione() { return idConversazione; }
    public void setIdConversazione(Integer idConversazione) { this.idConversazione = idConversazione; }

    public Integer getIdMittente() { return idMittente; }
    public void setIdMittente(Integer idMittente) { this.idMittente = idMittente; }

    public String getTesto() { return testo; }
    public void setTesto(String testo) { this.testo = testo; }

    public LocalDateTime getDataInvio() { return dataInvio; }
    public void setDataInvio(LocalDateTime dataInvio) { this.dataInvio = dataInvio; }

    public boolean isLetto() { return letto; }
    public void setLetto(boolean letto) { this.letto = letto; }
}

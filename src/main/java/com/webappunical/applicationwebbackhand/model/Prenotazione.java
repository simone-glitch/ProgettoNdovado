package com.webappunical.applicationwebbackhand.model;

import java.time.LocalDate;

public class Prenotazione {

    private Integer id;
    private LocalDate dataCheckin;
    private LocalDate dataCheckout;
    private Integer numOspiti;
    private Double prezzoTotale;
    private String stato; // IN_ATTESA, CONFERMATA, CANCELLATA
    private Integer idUtente;
    private Integer idCamera;

    // Dati denormalizzati per la visualizzazione (non persistiti, usati nelle response)
    private String nomeUtente;
    private String tipoCamera;
    private String nomeHotel;

    public Prenotazione() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public LocalDate getDataCheckin() { return dataCheckin; }
    public void setDataCheckin(LocalDate dataCheckin) { this.dataCheckin = dataCheckin; }

    public LocalDate getDataCheckout() { return dataCheckout; }
    public void setDataCheckout(LocalDate dataCheckout) { this.dataCheckout = dataCheckout; }

    public Integer getNumOspiti() { return numOspiti; }
    public void setNumOspiti(Integer numOspiti) { this.numOspiti = numOspiti; }

    public Double getPrezzoTotale() { return prezzoTotale; }
    public void setPrezzoTotale(Double prezzoTotale) { this.prezzoTotale = prezzoTotale; }

    public String getStato() { return stato; }
    public void setStato(String stato) { this.stato = stato; }

    public Integer getIdUtente() { return idUtente; }
    public void setIdUtente(Integer idUtente) { this.idUtente = idUtente; }

    public Integer getIdCamera() { return idCamera; }
    public void setIdCamera(Integer idCamera) { this.idCamera = idCamera; }

    public String getNomeUtente() { return nomeUtente; }
    public void setNomeUtente(String nomeUtente) { this.nomeUtente = nomeUtente; }

    public String getTipoCamera() { return tipoCamera; }
    public void setTipoCamera(String tipoCamera) { this.tipoCamera = tipoCamera; }

    public String getNomeHotel() { return nomeHotel; }
    public void setNomeHotel(String nomeHotel) { this.nomeHotel = nomeHotel; }
}

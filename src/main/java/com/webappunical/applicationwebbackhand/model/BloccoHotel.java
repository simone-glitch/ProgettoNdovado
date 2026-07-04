package com.webappunical.applicationwebbackhand.model;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDate;

/**
 * Blocco di disponibilità di una struttura: un intervallo di date (inclusive)
 * in cui l'host rende l'hotel NON prenotabile per motivi propri (ferie, lavori,
 * chiusura stagionale, ecc.). È indipendente dalle prenotazioni: vale per tutte
 * le camere dell'hotel.
 */
public class BloccoHotel {

    private Integer id;
    private Integer idHotel;
    // Serializzate come stringa ISO "yyyy-MM-dd" (il frontend le tratta come stringhe).
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate dataInizio;   // primo giorno bloccato (incluso)
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate dataFine;     // ultimo giorno bloccato (incluso)
    private String motivo;

    public BloccoHotel() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getIdHotel() { return idHotel; }
    public void setIdHotel(Integer idHotel) { this.idHotel = idHotel; }

    public LocalDate getDataInizio() { return dataInizio; }
    public void setDataInizio(LocalDate dataInizio) { this.dataInizio = dataInizio; }

    public LocalDate getDataFine() { return dataFine; }
    public void setDataFine(LocalDate dataFine) { this.dataFine = dataFine; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}

package com.webappunical.applicationwebbackhand.dto;

/**
 * Corpo della richiesta per creare un blocco di disponibilità.
 * Le date arrivano come stringhe ISO (yyyy-MM-dd) dal frontend.
 */
public class BloccoHotelDTO {

    private String dataInizio;
    private String dataFine;
    private String motivo;

    public BloccoHotelDTO() {}

    public String getDataInizio() { return dataInizio; }
    public void setDataInizio(String dataInizio) { this.dataInizio = dataInizio; }

    public String getDataFine() { return dataFine; }
    public void setDataFine(String dataFine) { this.dataFine = dataFine; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}

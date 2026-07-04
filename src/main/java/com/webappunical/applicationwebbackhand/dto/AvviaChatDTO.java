package com.webappunical.applicationwebbackhand.dto;

/** Corpo per avviare/recuperare la conversazione con l'host di una struttura. */
public class AvviaChatDTO {
    private Integer idHotel;

    public AvviaChatDTO() {}

    public Integer getIdHotel() { return idHotel; }
    public void setIdHotel(Integer idHotel) { this.idHotel = idHotel; }
}

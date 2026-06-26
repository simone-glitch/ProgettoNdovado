package com.webappunical.applicationwebbackhand.dto;

public class RecensioneDTO {

    private String titolo;
    private String testo;
    private Integer voto;
    private Integer idHotel;

    public RecensioneDTO() {}

    public String getTitolo() { return titolo; }
    public void setTitolo(String titolo) { this.titolo = titolo; }

    public String getTesto() { return testo; }
    public void setTesto(String testo) { this.testo = testo; }

    public Integer getVoto() { return voto; }
    public void setVoto(Integer voto) { this.voto = voto; }

    public Integer getIdHotel() { return idHotel; }
    public void setIdHotel(Integer idHotel) { this.idHotel = idHotel; }
}

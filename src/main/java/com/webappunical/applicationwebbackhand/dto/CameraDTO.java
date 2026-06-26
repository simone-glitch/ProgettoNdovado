package com.webappunical.applicationwebbackhand.dto;

public class CameraDTO {

    private String tipo;
    private String descrizione;
    private Double prezzoNotte;
    private Integer capienza;
    private boolean disponibile;
    private Integer idHotel;

    public CameraDTO() {}

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getDescrizione() { return descrizione; }
    public void setDescrizione(String descrizione) { this.descrizione = descrizione; }

    public Double getPrezzoNotte() { return prezzoNotte; }
    public void setPrezzoNotte(Double prezzoNotte) { this.prezzoNotte = prezzoNotte; }

    public Integer getCapienza() { return capienza; }
    public void setCapienza(Integer capienza) { this.capienza = capienza; }

    public boolean isDisponibile() { return disponibile; }
    public void setDisponibile(boolean disponibile) { this.disponibile = disponibile; }

    public Integer getIdHotel() { return idHotel; }
    public void setIdHotel(Integer idHotel) { this.idHotel = idHotel; }
}

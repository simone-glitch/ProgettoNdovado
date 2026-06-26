package com.webappunical.applicationwebbackhand.dto;

public class PrenotazioneDTO {

    private String dataCheckin;   // formato ISO: yyyy-MM-dd
    private String dataCheckout;
    private Integer numOspiti;
    private Integer idCamera;

    public PrenotazioneDTO() {}

    public String getDataCheckin() { return dataCheckin; }
    public void setDataCheckin(String dataCheckin) { this.dataCheckin = dataCheckin; }

    public String getDataCheckout() { return dataCheckout; }
    public void setDataCheckout(String dataCheckout) { this.dataCheckout = dataCheckout; }

    public Integer getNumOspiti() { return numOspiti; }
    public void setNumOspiti(Integer numOspiti) { this.numOspiti = numOspiti; }

    public Integer getIdCamera() { return idCamera; }
    public void setIdCamera(Integer idCamera) { this.idCamera = idCamera; }
}

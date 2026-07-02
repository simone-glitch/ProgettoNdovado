package com.webappunical.applicationwebbackhand.dto;

import java.util.List;

public class HotelDTO {

    private String nome;
    private String descrizione;
    private String citta;
    private String indirizzo;
    private Integer stelle;
    private Double latitudine;
    private Double longitudine;
    private List<Integer> idServizi;

    // Ciclo di vita e dati operativi della struttura
    private String stato;
    private String checkIn;
    private String checkOut;
    private String telefono;
    private String email;
    private Integer numCamere;
    private Double prezzoMedio;

    public HotelDTO() {}

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getDescrizione() { return descrizione; }
    public void setDescrizione(String descrizione) { this.descrizione = descrizione; }

    public String getCitta() { return citta; }
    public void setCitta(String citta) { this.citta = citta; }

    public String getIndirizzo() { return indirizzo; }
    public void setIndirizzo(String indirizzo) { this.indirizzo = indirizzo; }

    public Integer getStelle() { return stelle; }
    public void setStelle(Integer stelle) { this.stelle = stelle; }

    public Double getLatitudine() { return latitudine; }
    public void setLatitudine(Double latitudine) { this.latitudine = latitudine; }

    public Double getLongitudine() { return longitudine; }
    public void setLongitudine(Double longitudine) { this.longitudine = longitudine; }

    public List<Integer> getIdServizi() { return idServizi; }
    public void setIdServizi(List<Integer> idServizi) { this.idServizi = idServizi; }

    public String getStato() { return stato; }
    public void setStato(String stato) { this.stato = stato; }

    public String getCheckIn() { return checkIn; }
    public void setCheckIn(String checkIn) { this.checkIn = checkIn; }

    public String getCheckOut() { return checkOut; }
    public void setCheckOut(String checkOut) { this.checkOut = checkOut; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public Integer getNumCamere() { return numCamere; }
    public void setNumCamere(Integer numCamere) { this.numCamere = numCamere; }

    public Double getPrezzoMedio() { return prezzoMedio; }
    public void setPrezzoMedio(Double prezzoMedio) { this.prezzoMedio = prezzoMedio; }
}

package com.webappunical.applicationwebbackhand.model;

import java.util.List;

public class Hotel {

    private Integer id;
    private String nome;
    private String descrizione;
    private String citta;
    private String indirizzo;
    private Integer stelle;
    private Double latitudine;
    private Double longitudine;
    private Integer idProprietario;

    // Ciclo di vita e dati operativi della struttura
    private String stato;
    private String checkIn;
    private String checkOut;
    private String telefono;
    private String email;
    private Integer numCamere;
    private Double prezzoMedio;

    // Caricati dal Proxy (lazy) — non mappati direttamente dalla query principale
    private List<Camera> camere;
    private List<String> servizi;
    private List<String> fotoUrls;
    private Double votoMedio;

    // Popolati solo nella vista di moderazione ADMIN (join con la tabella utenti):
    // servono a mostrare "di chi è" ogni struttura. Restano null altrove.
    private String nomeProprietario;
    private String emailProprietario;

    public Hotel() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

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

    public Integer getIdProprietario() { return idProprietario; }
    public void setIdProprietario(Integer idProprietario) { this.idProprietario = idProprietario; }

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

    public List<Camera> getCamere() { return camere; }
    public void setCamere(List<Camera> camere) { this.camere = camere; }

    public List<String> getServizi() { return servizi; }
    public void setServizi(List<String> servizi) { this.servizi = servizi; }

    public List<String> getFotoUrls() { return fotoUrls; }
    public void setFotoUrls(List<String> fotoUrls) { this.fotoUrls = fotoUrls; }

    public Double getVotoMedio() { return votoMedio; }
    public void setVotoMedio(Double votoMedio) { this.votoMedio = votoMedio; }

    public String getNomeProprietario() { return nomeProprietario; }
    public void setNomeProprietario(String nomeProprietario) { this.nomeProprietario = nomeProprietario; }

    public String getEmailProprietario() { return emailProprietario; }
    public void setEmailProprietario(String emailProprietario) { this.emailProprietario = emailProprietario; }
}

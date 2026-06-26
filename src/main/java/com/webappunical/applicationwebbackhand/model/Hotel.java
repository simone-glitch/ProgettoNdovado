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

    // Caricati dal Proxy (lazy) — non mappati direttamente dalla query principale
    private List<Camera> camere;
    private List<String> servizi;
    private List<String> fotoUrls;
    private Double votoMedio;

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

    public List<Camera> getCamere() { return camere; }
    public void setCamere(List<Camera> camere) { this.camere = camere; }

    public List<String> getServizi() { return servizi; }
    public void setServizi(List<String> servizi) { this.servizi = servizi; }

    public List<String> getFotoUrls() { return fotoUrls; }
    public void setFotoUrls(List<String> fotoUrls) { this.fotoUrls = fotoUrls; }

    public Double getVotoMedio() { return votoMedio; }
    public void setVotoMedio(Double votoMedio) { this.votoMedio = votoMedio; }
}

package com.webappunical.applicationwebbackhand.model;

import java.time.LocalDateTime;

public class Recensione {

    private Integer id;
    private String titolo;
    private String testo;
    private Integer voto; // 1-5
    private LocalDateTime dataRecensione;
    private Integer idUtente;
    private Integer idHotel;

    // Dati denormalizzati per la visualizzazione
    private String nomeAutore;

    public Recensione() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getTitolo() { return titolo; }
    public void setTitolo(String titolo) { this.titolo = titolo; }

    public String getTesto() { return testo; }
    public void setTesto(String testo) { this.testo = testo; }

    public Integer getVoto() { return voto; }
    public void setVoto(Integer voto) { this.voto = voto; }

    public LocalDateTime getDataRecensione() { return dataRecensione; }
    public void setDataRecensione(LocalDateTime dataRecensione) { this.dataRecensione = dataRecensione; }

    public Integer getIdUtente() { return idUtente; }
    public void setIdUtente(Integer idUtente) { this.idUtente = idUtente; }

    public Integer getIdHotel() { return idHotel; }
    public void setIdHotel(Integer idHotel) { this.idHotel = idHotel; }

    public String getNomeAutore() { return nomeAutore; }
    public void setNomeAutore(String nomeAutore) { this.nomeAutore = nomeAutore; }
}

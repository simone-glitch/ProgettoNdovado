package com.webappunical.applicationwebbackhand.model;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

/**
 * Conversazione privata 1-a-1 tra un ospite (guest) e un host, avviata a partire
 * da una struttura. È unica per la coppia (guest, host): i messaggi successivi,
 * anche relativi ad altri hotel dello stesso host, confluiscono nella stessa chat.
 */
public class Conversazione {

    private Integer id;
    private Integer idGuest;
    private Integer idHost;
    private Integer idHotel;   // struttura da cui è nata la conversazione (contesto)

    // Campi denormalizzati per la lista (non persistiti nella tabella conversazioni)
    private String nomeGuest;
    private String nomeHost;
    private String nomeHotel;
    private String ultimoMessaggio;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime dataUltimoMessaggio;
    private int nonLetti;      // messaggi non letti per l'utente che richiede la lista
    private boolean assistenza; // true se l'altro capo è un admin (chat di assistenza)

    // Archiviazione indipendente per lato: ogni partecipante può archiviare la
    // propria vista della chat. archiviata = valore relativo a chi richiede la lista.
    private boolean archiviataGuest;
    private boolean archiviataHost;
    private boolean archiviata;

    public Conversazione() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Integer getIdGuest() { return idGuest; }
    public void setIdGuest(Integer idGuest) { this.idGuest = idGuest; }

    public Integer getIdHost() { return idHost; }
    public void setIdHost(Integer idHost) { this.idHost = idHost; }

    public Integer getIdHotel() { return idHotel; }
    public void setIdHotel(Integer idHotel) { this.idHotel = idHotel; }

    public String getNomeGuest() { return nomeGuest; }
    public void setNomeGuest(String nomeGuest) { this.nomeGuest = nomeGuest; }

    public String getNomeHost() { return nomeHost; }
    public void setNomeHost(String nomeHost) { this.nomeHost = nomeHost; }

    public String getNomeHotel() { return nomeHotel; }
    public void setNomeHotel(String nomeHotel) { this.nomeHotel = nomeHotel; }

    public String getUltimoMessaggio() { return ultimoMessaggio; }
    public void setUltimoMessaggio(String ultimoMessaggio) { this.ultimoMessaggio = ultimoMessaggio; }

    public LocalDateTime getDataUltimoMessaggio() { return dataUltimoMessaggio; }
    public void setDataUltimoMessaggio(LocalDateTime dataUltimoMessaggio) { this.dataUltimoMessaggio = dataUltimoMessaggio; }

    public int getNonLetti() { return nonLetti; }
    public void setNonLetti(int nonLetti) { this.nonLetti = nonLetti; }

    public boolean isAssistenza() { return assistenza; }
    public void setAssistenza(boolean assistenza) { this.assistenza = assistenza; }

    public boolean isArchiviataGuest() { return archiviataGuest; }
    public void setArchiviataGuest(boolean archiviataGuest) { this.archiviataGuest = archiviataGuest; }

    public boolean isArchiviataHost() { return archiviataHost; }
    public void setArchiviataHost(boolean archiviataHost) { this.archiviataHost = archiviataHost; }

    public boolean isArchiviata() { return archiviata; }
    public void setArchiviata(boolean archiviata) { this.archiviata = archiviata; }
}

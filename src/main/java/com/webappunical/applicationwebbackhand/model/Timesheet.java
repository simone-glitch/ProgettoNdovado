package com.webappunical.applicationwebbackhand.model;

import java.time.LocalDate;

public class Timesheet {
    private Long idTimesheet;
    private LocalDate dataLavoro;
    private Double ore;
    private String descrizione;
    private Long idUtente;
    private Long idTask;

    // Costruttori
    public Timesheet() {
    }

    public Timesheet(Long idTimesheet, LocalDate dataLavoro, Double ore, String descrizione, Long idUtente, Long idTask) {
        this.idTimesheet = idTimesheet;
        this.dataLavoro = dataLavoro;
        this.ore = ore;
        this.descrizione = descrizione;
        this.idUtente = idUtente;
        this.idTask = idTask;
    }

    // Getters and Setters
    public Long getIdTimesheet() {
        return idTimesheet;
    }

    public void setIdTimesheet(Long idTimesheet) {
        this.idTimesheet = idTimesheet;
    }

    public LocalDate getDataLavoro() {
        return dataLavoro;
    }

    public void setDataLavoro(LocalDate dataLavoro) {
        this.dataLavoro = dataLavoro;
    }

    public Double getOre() {
        return ore;
    }

    public void setOre(Double ore) {
        this.ore = ore;
    }

    public String getDescrizione() {
        return descrizione;
    }

    public void setDescrizione(String descrizione) {
        this.descrizione = descrizione;
    }

    public Long getIdUtente() {
        return idUtente;
    }

    public void setIdUtente(Long idUtente) {
        this.idUtente = idUtente;
    }

    public Long getIdTask() {
        return idTask;
    }

    public void setIdTask(Long idTask) {
        this.idTask = idTask;
    }
}

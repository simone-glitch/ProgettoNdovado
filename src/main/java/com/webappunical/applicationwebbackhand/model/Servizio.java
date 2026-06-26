package com.webappunical.applicationwebbackhand.model;

public class Servizio {

    private Integer id;
    private String nome;
    private String icona; // nome icona Material Icons

    public Servizio() {}

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public String getIcona() { return icona; }
    public void setIcona(String icona) { this.icona = icona; }
}

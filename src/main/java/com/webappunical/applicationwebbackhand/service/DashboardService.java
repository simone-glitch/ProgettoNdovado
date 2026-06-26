package com.webappunical.applicationwebbackhand.service;

import com.webappunical.applicationwebbackhand.dao.DashboardDAO;
import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.model.Utente;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final DashboardDAO dashboardDAO;
    private final UtenteJDBC   utenteJDBC;

    @Autowired
    public DashboardService(DashboardDAO dashboardDAO, UtenteJDBC utenteJDBC) {
        this.dashboardDAO = dashboardDAO;
        this.utenteJDBC   = utenteJDBC;
    }

    // Statistiche globali per l'ADMIN
    public Map<String, Object> getStatisticheAdmin() {
        return Map.of(
                "totaleHotel",        dashboardDAO.contaHotel(),
                "totaleUtenti",       dashboardDAO.contaUtenti(),
                "totalePrenotazioni", dashboardDAO.contaPrenotazioni(),
                "entrateMese",        dashboardDAO.entrateMesseCorrente()
        );
    }

    // Dati grafici per l'ADMIN
    public Map<String, Object> getChartDataAdmin() {
        List<Map<String, Object>> prenotazioniPerMese = dashboardDAO.prenotazioniPerMese();
        List<String>  mesi    = prenotazioniPerMese.stream().map(m -> (String)  m.get("mese")).toList();
        List<Number>  totali  = prenotazioniPerMese.stream().map(m -> (Number)  m.get("totale")).toList();

        List<Map<String, Object>> hotelTop = dashboardDAO.hotelPiuPrenotati();
        List<String>  nomiHotel = hotelTop.stream().map(h -> (String) h.get("nome_hotel")).toList();
        List<Number>  prenotHotel = hotelTop.stream().map(h -> (Number) h.get("totale_prenotazioni")).toList();

        return Map.of(
                "andamentoPrenotazioni", Map.of("labels", mesi,       "data", totali),
                "hotelPiuPrenotati",     Map.of("labels", nomiHotel,  "data", prenotHotel)
        );
    }

    // Statistiche per il singolo HOST
    public Map<String, Object> getStatisticheHost(String emailHost) {
        Utente host = utenteJDBC.trovaPerEmail(emailHost);
        if (host == null) throw new RuntimeException("Utente non trovato.");
        return Map.of(
                "meiHotel",           dashboardDAO.contaHotelHost(host.getId()),
                "prenotazioniRicevute", dashboardDAO.contaPrenotazioniHost(host.getId()),
                "entrateMese",        dashboardDAO.entrateMesseCorrenteHost(host.getId())
        );
    }

    // Dati grafici per il singolo HOST
    public Map<String, Object> getChartDataHost(String emailHost) {
        Utente host = utenteJDBC.trovaPerEmail(emailHost);
        if (host == null) throw new RuntimeException("Utente non trovato.");

        List<Map<String, Object>> perHotel = dashboardDAO.prenotazioniPerHotelHost(host.getId());
        List<String>  nomi    = perHotel.stream().map(h -> (String) h.get("nome_hotel")).toList();
        List<Number>  totali  = perHotel.stream().map(h -> (Number) h.get("totale")).toList();

        List<Map<String, Object>> andamento = dashboardDAO.andamentoEntrateHost(host.getId());
        List<String>  mesi    = andamento.stream().map(m -> (String) m.get("mese")).toList();
        List<Number>  entrate = andamento.stream().map(m -> (Number) m.get("entrate")).toList();

        return Map.of(
                "prenotazioniPerHotel", Map.of("labels", nomi,   "data", totali),
                "andamentoEntrate",     Map.of("labels", mesi,   "data", entrate)
        );
    }
}

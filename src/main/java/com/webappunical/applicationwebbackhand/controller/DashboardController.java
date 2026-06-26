package com.webappunical.applicationwebbackhand.controller;

import com.webappunical.applicationwebbackhand.dao.UtenteJDBC;
import com.webappunical.applicationwebbackhand.model.Utente;
import com.webappunical.applicationwebbackhand.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:4200")
public class DashboardController {

    private final DashboardService dashboardService;
    private final UtenteJDBC       utenteJDBC;

    @Autowired
    public DashboardController(DashboardService dashboardService, UtenteJDBC utenteJDBC) {
        this.dashboardService = dashboardService;
        this.utenteJDBC       = utenteJDBC;
    }

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getStats(Authentication auth) {
        try {
            Utente utente = utenteJDBC.trovaPerEmail(auth.getName());
            if (utente == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

            if ("ADMIN".equals(utente.getRuolo())) {
                return ResponseEntity.ok(dashboardService.getStatisticheAdmin());
            } else {
                return ResponseEntity.ok(dashboardService.getStatisticheHost(auth.getName()));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/charts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCharts(Authentication auth) {
        try {
            Utente utente = utenteJDBC.trovaPerEmail(auth.getName());
            if (utente == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

            if ("ADMIN".equals(utente.getRuolo())) {
                return ResponseEntity.ok(dashboardService.getChartDataAdmin());
            } else {
                return ResponseEntity.ok(dashboardService.getChartDataHost(auth.getName()));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }
}

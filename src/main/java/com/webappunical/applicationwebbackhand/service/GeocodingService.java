package com.webappunical.applicationwebbackhand.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * Geocodifica lato server (Nominatim/OpenStreetMap): converte "indirizzo, città"
 * in coordinate. Rispetto alla geocodifica lato browser è più affidabile (nessun
 * problema di CORS, User-Agent controllato) ed è usata come rete di sicurezza al
 * salvataggio di un hotel, così ogni struttura finisce con coordinate valide e
 * la mappa nel dettaglio compare sempre.
 *
 * <p>In caso di errore/timeout restituisce {@code null}: il salvataggio prosegue
 * comunque, senza peggiorare il comportamento preesistente.</p>
 */
@Service
public class GeocodingService {

    private static final String BASE = "https://nominatim.openstreetmap.org/search";

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    /** Coppia di coordinate. */
    public record Coordinate(double lat, double lon) {}

    /**
     * Prova prima con "indirizzo, città"; se non trova nulla ricade sulla sola
     * città. Restituisce null se anche la città non è geolocalizzabile.
     */
    public Coordinate geocodifica(String indirizzo, String citta) {
        String via  = indirizzo == null ? "" : indirizzo.trim();
        String city = citta == null ? "" : citta.trim();
        String completo = (via + " " + city).trim();
        if (completo.isEmpty()) return null;

        Coordinate c = interroga((via.isEmpty() ? "" : via + ", ") + city);
        if (c == null && !city.isEmpty()) {
            c = interroga(city);
        }
        return c;
    }

    private Coordinate interroga(String query) {
        try {
            String url = BASE + "?format=json&limit=1&countrycodes=it&q="
                    + URLEncoder.encode(query, StandardCharsets.UTF_8);
            HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                    .header("User-Agent", "Ndovado/1.0 (hotel booking demo)")
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() != 200) return null;

            JsonNode arr = mapper.readTree(res.body());
            if (!arr.isArray() || arr.isEmpty()) return null;
            JsonNode first = arr.get(0);
            double lat = first.path("lat").asDouble(Double.NaN);
            double lon = first.path("lon").asDouble(Double.NaN);
            if (Double.isNaN(lat) || Double.isNaN(lon)) return null;
            return new Coordinate(lat, lon);
        } catch (Exception e) {
            return null; // rete/timeout/parse: nessuna coordinata, il salvataggio prosegue
        }
    }
}

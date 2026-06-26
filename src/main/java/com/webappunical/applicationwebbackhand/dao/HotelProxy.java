package com.webappunical.applicationwebbackhand.dao;

import com.webappunical.applicationwebbackhand.model.Camera;
import com.webappunical.applicationwebbackhand.model.Hotel;

import java.util.List;

/**
 * Pattern Proxy applicato alla relazione Hotel → Camere (1-a-molti).
 *
 * Il proxy avvolge un Hotel reale e posticipa il caricamento delle camere,
 * dei servizi e delle foto fino al momento in cui vengono effettivamente
 * richieste (lazy loading). Ogni istanza viene creata manualmente da
 * HotelService passando le dipendenze via costruttore.
 */
public class HotelProxy extends Hotel {

    private final CameraDAO cameraDAO;
    private final HotelDAO  hotelDAO;

    private boolean camereCaricate  = false;
    private boolean serviziCaricati = false;
    private boolean fotoCaricate    = false;

    public HotelProxy(Hotel hotelReale, CameraDAO cameraDAO, HotelDAO hotelDAO) {
        this.cameraDAO = cameraDAO;
        this.hotelDAO  = hotelDAO;
        // Copia i campi base dall'hotel reale senza toccare le liste (lazy)
        this.setId(hotelReale.getId());
        this.setNome(hotelReale.getNome());
        this.setDescrizione(hotelReale.getDescrizione());
        this.setCitta(hotelReale.getCitta());
        this.setIndirizzo(hotelReale.getIndirizzo());
        this.setStelle(hotelReale.getStelle());
        this.setLatitudine(hotelReale.getLatitudine());
        this.setLongitudine(hotelReale.getLongitudine());
        this.setIdProprietario(hotelReale.getIdProprietario());
        this.setVotoMedio(hotelReale.getVotoMedio());
    }

    @Override
    public List<Camera> getCamere() {
        if (!camereCaricate) {
            super.setCamere(cameraDAO.trovaPerHotel(this.getId()));
            camereCaricate = true;
        }
        return super.getCamere();
    }

    @Override
    public List<String> getServizi() {
        if (!serviziCaricati) {
            super.setServizi(hotelDAO.trovaServiziNomi(this.getId()));
            serviziCaricati = true;
        }
        return super.getServizi();
    }

    @Override
    public List<String> getFotoUrls() {
        if (!fotoCaricate) {
            super.setFotoUrls(hotelDAO.trovaFotoUrls(this.getId()));
            fotoCaricate = true;
        }
        return super.getFotoUrls();
    }
}

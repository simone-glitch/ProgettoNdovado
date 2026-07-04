package com.webappunical.applicationwebbackhand.model;

import java.util.EnumSet;
import java.util.Set;

/**
 * Ciclo di vita di una struttura ricettiva.
 *
 * <p>Le transizioni ammesse sono definite qui, insieme al ruolo che può
 * effettuarle, così che la logica del "chi può fare cosa" viva in un unico
 * punto ed sia coerente tra service e controller.</p>
 *
 * <pre>
 *   BOZZA ──invia──▶ IN_REVISIONE ──approva──▶ PUBBLICATO ◀─riattiva─ SOSPESO
 *     ▲                   │                        │  ▲                  ▲
 *     │                   └──rifiuta──▶ RIFIUTATO  │  │                  │
 *     │                                    │       │  └─disattiva─▶ NON_ATTIVO
 *     └────────────(re)invia───────────────┘       └────sospendi────────┘
 * </pre>
 */
public enum StatoHotel {

    /** Creata dall'host, non ancora inviata: non visibile al pubblico. */
    BOZZA,
    /** Inviata dall'host, in attesa della moderazione dell'admin. */
    IN_REVISIONE,
    /** Approvata dall'admin: pubblica e prenotabile. */
    PUBBLICATO,
    /** Respinta dall'admin: l'host può correggerla e reinviarla. */
    RIFIUTATO,
    /** Sospesa dall'admin per moderazione: non più visibile. */
    SOSPESO,
    /** Messa in pausa dall'host (era pubblicata): non più visibile. */
    NON_ATTIVO;

    /** Attore che richiede una transizione. */
    public enum Attore { PROPRIETARIO, ADMIN }

    /**
     * Transizioni consentite al PROPRIETARIO (host titolare) — o all'ADMIN,
     * che eredita i permessi del proprietario oltre ai propri.
     */
    private Set<StatoHotel> transizioniProprietario() {
        return switch (this) {
            case BOZZA      -> EnumSet.of(IN_REVISIONE);
            case RIFIUTATO  -> EnumSet.of(IN_REVISIONE);
            case PUBBLICATO -> EnumSet.of(NON_ATTIVO);
            case NON_ATTIVO -> EnumSet.of(PUBBLICATO);
            default         -> EnumSet.noneOf(StatoHotel.class);
        };
    }

    /** Transizioni di moderazione riservate all'ADMIN. */
    private Set<StatoHotel> transizioniAdmin() {
        return switch (this) {
            case IN_REVISIONE -> EnumSet.of(PUBBLICATO, RIFIUTATO);
            case PUBBLICATO   -> EnumSet.of(SOSPESO);
            case NON_ATTIVO   -> EnumSet.of(SOSPESO);
            case SOSPESO      -> EnumSet.of(PUBBLICATO);
            default           -> EnumSet.noneOf(StatoHotel.class);
        };
    }

    /**
     * Indica se, partendo da questo stato, l'attore indicato può portare
     * l'hotel a {@code destinazione}.
     */
    public boolean puoTransire(StatoHotel destinazione, Attore attore) {
        Set<StatoHotel> ammesse = EnumSet.noneOf(StatoHotel.class);
        // Il proprietario ha le sue transizioni; l'admin le eredita e aggiunge le proprie.
        ammesse.addAll(transizioniProprietario());
        if (attore == Attore.ADMIN) {
            ammesse.addAll(transizioniAdmin());
        }
        return ammesse.contains(destinazione);
    }

    /** Parsing tollerante (case-insensitive) che non lancia per valori ignoti. */
    public static StatoHotel daStringa(String valore) {
        if (valore == null) return null;
        try {
            return StatoHotel.valueOf(valore.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}

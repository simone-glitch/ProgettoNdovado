package com.webappunical.applicationwebbackhand.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    public void inviaResetPassword(String toEmail, String nomeUtente, String token) {
        try {
            String link = frontendUrl + "/reset-password?token=" + token;

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail, "Ndovado");
            helper.setTo(toEmail);
            helper.setSubject("Reimposta la tua password — Ndovado");
            helper.setText(buildHtml(nomeUtente, link), true);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Errore durante l'invio dell'email: " + e.getMessage(), e);
        }
    }

    private String buildHtml(String nome, String link) {
        return """
            <!DOCTYPE html>
            <html lang="it">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Reimposta la tua password</title>
            </head>
            <body style="margin:0;padding:0;background:#F5F7FA;font-family:'Segoe UI',Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#F5F7FA;padding:40px 0;">
                <tr>
                  <td align="center">
                    <table width="560" cellpadding="0" cellspacing="0"
                           style="background:#ffffff;border-radius:16px;overflow:hidden;
                                  box-shadow:0 4px 24px rgba(6,27,58,0.10);">

                      <!-- Header -->
                      <tr>
                        <td style="background:#061B3A;padding:32px 40px;text-align:center;">
                          <span style="font-size:26px;font-weight:800;color:#C9A45C;
                                       letter-spacing:2px;font-family:'Segoe UI',Arial,sans-serif;">
                            NDOVADO
                          </span>
                        </td>
                      </tr>

                      <!-- Body -->
                      <tr>
                        <td style="padding:40px 40px 20px;">
                          <p style="font-size:22px;font-weight:700;color:#0A2342;margin:0 0 12px;">
                            Ciao%s 👋
                          </p>
                          <p style="font-size:15px;color:#4A5565;margin:0 0 24px;line-height:1.6;">
                            Abbiamo ricevuto una richiesta per reimpostare la password del tuo account Ndovado.
                            Clicca sul pulsante qui sotto per scegliere una nuova password.
                          </p>

                          <!-- CTA Button -->
                          <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                            <tr>
                              <td style="background:#C9A45C;border-radius:10px;">
                                <a href="%s"
                                   style="display:inline-block;padding:14px 36px;
                                          font-size:15px;font-weight:700;color:#061B3A;
                                          text-decoration:none;border-radius:10px;">
                                  Reimposta password
                                </a>
                              </td>
                            </tr>
                          </table>

                          <p style="font-size:13px;color:#6B7280;margin:0 0 8px;line-height:1.6;">
                            Il link è valido per <strong>1 ora</strong>.<br>
                            Se non hai richiesto il reset della password, ignora questa email — il tuo account è al sicuro.
                          </p>

                          <hr style="border:none;border-top:1px solid #E8EDF4;margin:24px 0;">

                          <p style="font-size:12px;color:#9CA3AF;margin:0;line-height:1.6;">
                            Non riesci a cliccare il pulsante? Copia e incolla questo link nel browser:<br>
                            <a href="%s" style="color:#C9A45C;word-break:break-all;">%s</a>
                          </p>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background:#F9FAFB;padding:20px 40px;text-align:center;
                                   border-top:1px solid #E8EDF4;">
                          <p style="font-size:12px;color:#9CA3AF;margin:0;">
                            © 2025 Ndovado · Tutti i diritti riservati
                          </p>
                        </td>
                      </tr>

                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
            """.formatted(
                nome != null && !nome.isBlank() ? ", " + nome : "",
                link, link, link
        );
    }
}

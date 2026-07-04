package com.webappunical.applicationwebbackhand.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public static PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(withDefaults())
            .authorizeHttpRequests(auth -> auth
                // Pubblici: auth, ricerca hotel, dettaglio hotel, recensioni in sola lettura, servizi
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/hotel/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/camere/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/recensioni/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/servizi/**").permitAll()
                // Occupazioni camera: solo intervalli di date (nessun dato personale).
                // La pagina di dettaglio hotel è pubblica, quindi il calendario deve
                // mostrare le date già prenotate anche a chi non è autenticato.
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/prenotazioni/camera/*/occupazioni").permitAll()
                // Tutto il resto richiede autenticazione
                .anyRequest().authenticated()
            )
            .httpBasic(withDefaults());
        return http.build();
    }

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("http://localhost:4200");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}

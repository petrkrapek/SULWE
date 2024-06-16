package com.enernyte.zaverecnyprojektspringboot.models;
import org.springframework.stereotype.Service;

import java.sql.*;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class TopLekyService {

    /**
     * Metoda služby, která vrací nejpředepisovanější léky
     * @param topLekyDTO jde o předání dat, konkrétně vybraného okresu
     * @return list nejpředepisovanějších léků
     */
    public List<String> topLeky(TopLekyDTO topLekyDTO) {
        //List<String> topLekySeznam = new ArrayList<>(Arrays.asList("Lek1", "Lek2", "Lek3", "Lek4", "Lek5"));

        List<String> topLekySeznam = new ArrayList<>();
        PreparedStatement dotaz = null;
        try (Connection spojeni = DriverManager.getConnection("jdbc:mysql://localhost:3306/erecept?user=root&password=")) {
            // Zde přidejte podmínku pro if
            if (topLekyDTO.getLokalita().equals("cesko")) {
                dotaz = spojeni.prepareStatement("SELECT NAZEV, KOD_SUKL, SUM(MNOZSTVI) AS CELKOVE_MNOZSTVI FROM data_tabulka GROUP BY NAZEV ORDER BY CELKOVE_MNOZSTVI DESC LIMIT 10;");
            } else {
                dotaz = spojeni.prepareStatement("SELECT NAZEV, KOD_SUKL, SUM(MNOZSTVI) AS CELKOVE_MNOZSTVI FROM data_tabulka WHERE OKRES_KOD = ? GROUP BY NAZEV ORDER BY CELKOVE_MNOZSTVI DESC LIMIT 10;");
                dotaz.setString(1, topLekyDTO.getLokalita());
            }
            ResultSet vystup = dotaz.executeQuery();

            while (vystup.next()) {
                String nazevLeku = vystup.getString("NAZEV");
                String kodLeku = vystup.getString("KOD_SUKL");
                topLekySeznam.add(nazevLeku + " " + "[Kód léku: " + kodLeku + "]");
            }

        } catch (SQLException ex) {
            System.out.println("Chyba připojení k databázi: " + ex.getMessage());
        }

        return topLekySeznam;
    }

}

package com.enernyte.zaverecnyprojektspringboot.controllers;

import org.springframework.ui.Model;
import com.enernyte.zaverecnyprojektspringboot.models.TopLekyDTO;
import com.enernyte.zaverecnyprojektspringboot.models.TopLekyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import java.util.List;

@Controller
@RequestMapping("uvod")
public class TopLekyCeskoController {

    @Autowired
    private TopLekyService topLekyService;

    @GetMapping("top-leky-cesko")
    public String strankaTopLekyCesko(@ModelAttribute TopLekyDTO topLekyDTO,
                                      Model model) {
        List<String> topLekySeznamCR = topLekyService.topLeky(topLekyDTO);
        model.addAttribute("topLekySeznamCR", topLekySeznamCR);
        return "top-leky-cesko";
    }

}

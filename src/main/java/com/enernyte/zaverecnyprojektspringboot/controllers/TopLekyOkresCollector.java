package com.enernyte.zaverecnyprojektspringboot.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("uvod")
public class TopLekyOkresCollector {

    @GetMapping("top-leky-okresu")
    public String strankaTopLekyOkres() {
        return "top-leky-okres";
    }
}

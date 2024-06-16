package com.enernyte.zaverecnyprojektspringboot.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("")
public class ProjektController {

    @GetMapping("uvod")
    public String domovskaStranka() {
        return "index";
    }

}

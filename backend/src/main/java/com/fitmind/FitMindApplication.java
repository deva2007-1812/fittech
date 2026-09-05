package com.fitmind;

import com.fitmind.config.EnvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class FitMindApplication {
    public static void main(String[] args) {
        EnvLoader.load();
        SpringApplication.run(FitMindApplication.class, args);
    }
}

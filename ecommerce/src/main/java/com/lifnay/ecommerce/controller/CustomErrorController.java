package com.lifnay.ecommerce.controller;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class CustomErrorController implements ErrorController {

    @RequestMapping("/error")
    public String handleError(HttpServletRequest request, Model model) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        Object message = request.getAttribute(RequestDispatcher.ERROR_MESSAGE);

        int statusCode = status != null ? Integer.parseInt(status.toString()) : 500;
        String errorMessage;

        switch (statusCode) {
            case 404 -> errorMessage = "The page you're looking for doesn't exist";
            case 403 -> errorMessage = "You don't have permission to access this page";
            case 500 -> errorMessage = "Something went wrong on our end";
            default -> errorMessage = message != null ? message.toString() : "An unexpected error occurred";
        }

        model.addAttribute("statusCode", statusCode);
        model.addAttribute("errorMessage", errorMessage);
        return "error";
    }
}

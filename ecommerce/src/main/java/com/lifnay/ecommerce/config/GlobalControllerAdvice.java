package com.lifnay.ecommerce.config;

import com.lifnay.ecommerce.model.User;
import com.lifnay.ecommerce.service.CartService;
import com.lifnay.ecommerce.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;

@ControllerAdvice
public class GlobalControllerAdvice {

    private final CartService cartService;
    private final UserService userService;

    public GlobalControllerAdvice(CartService cartService, UserService userService) {
        this.cartService = cartService;
        this.userService = userService;
    }

    @ModelAttribute("cartCount")
    public int cartCount() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                User user = userService.getByEmail(auth.getName());
                return cartService.getCartItemCount(user.getId());
            }
        } catch (Exception ignored) {
        }
        return 0;
    }

    @ModelAttribute("currentUserName")
    public String currentUserName() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                User user = userService.getByEmail(auth.getName());
                return user.getName();
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}

package com.lifnay.ecommerce.controller;

import com.lifnay.ecommerce.model.User;
import com.lifnay.ecommerce.service.CartService;
import com.lifnay.ecommerce.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/cart")
public class CartController {

    private final CartService cartService;
    private final UserService userService;

    public CartController(CartService cartService, UserService userService) {
        this.cartService = cartService;
        this.userService = userService;
    }

    /** View cart */
    @GetMapping
    public String viewCart(Authentication auth, Model model) {
        User user = userService.getByEmail(auth.getName());
        model.addAttribute("cartItems", cartService.getCartItems(user.getId()));
        model.addAttribute("cartTotal", cartService.getCartTotal(user.getId()));
        return "cart";
    }

    /** Add item to cart */
    @PostMapping("/add")
    public String addToCart(@RequestParam String productId,
                            @RequestParam(required = false) String variantId,
                            @RequestParam(defaultValue = "1") int quantity,
                            Authentication auth,
                            RedirectAttributes redirectAttributes) {
        try {
            User user = userService.getByEmail(auth.getName());
            String result = cartService.addToCart(user.getId(), productId, variantId, quantity);
            redirectAttributes.addFlashAttribute("successMsg", result);
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMsg", e.getMessage());
        }
        return "redirect:/cart";
    }

    /** Update item quantity */
    @PostMapping("/update/{itemId}")
    public String updateQuantity(@PathVariable String itemId,
                                 @RequestParam int quantity,
                                 RedirectAttributes redirectAttributes) {
        try {
            cartService.updateQuantity(itemId, quantity);
            redirectAttributes.addFlashAttribute("successMsg", "Cart updated");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMsg", e.getMessage());
        }
        return "redirect:/cart";
    }

    /** Remove item from cart */
    @PostMapping("/remove/{itemId}")
    public String removeItem(@PathVariable String itemId,
                             RedirectAttributes redirectAttributes) {
        try {
            cartService.removeItem(itemId);
            redirectAttributes.addFlashAttribute("successMsg", "Item removed from cart");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMsg", e.getMessage());
        }
        return "redirect:/cart";
    }
}

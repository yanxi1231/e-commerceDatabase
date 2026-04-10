package com.lifnay.ecommerce.controller;

import com.lifnay.ecommerce.model.Order;
import com.lifnay.ecommerce.model.User;
import com.lifnay.ecommerce.model.UserAddress;
import com.lifnay.ecommerce.service.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;
    private final CartService cartService;
    private final UserService userService;

    public CheckoutController(CheckoutService checkoutService, CartService cartService,
                              UserService userService) {
        this.checkoutService = checkoutService;
        this.cartService = cartService;
        this.userService = userService;
    }

    /** Checkout page - select address and payment method */
    @GetMapping
    public String checkoutPage(Authentication auth, Model model, RedirectAttributes redirectAttributes) {
        User user = userService.getByEmail(auth.getName());

        // Check cart is not empty
        if (cartService.getCartItems(user.getId()).isEmpty()) {
            redirectAttributes.addFlashAttribute("errorMsg", "Your cart is empty");
            return "redirect:/cart";
        }

        model.addAttribute("cartItems", cartService.getCartItems(user.getId()));
        model.addAttribute("cartTotal", cartService.getCartTotal(user.getId()));
        model.addAttribute("addresses", checkoutService.getUserAddresses(user.getId()));
        return "checkout";
    }

    /** Add a new shipping address during checkout */
    @PostMapping("/add-address")
    public String addAddress(@RequestParam String label,
                             @RequestParam String recipientName,
                             @RequestParam(required = false) String phone,
                             @RequestParam String street,
                             @RequestParam String city,
                             @RequestParam String state,
                             @RequestParam String zipCode,
                             @RequestParam(defaultValue = "United States") String country,
                             Authentication auth,
                             RedirectAttributes redirectAttributes) {
        try {
            User user = userService.getByEmail(auth.getName());
            UserAddress address = new UserAddress();
            address.setLabel(label);
            address.setRecipientName(recipientName);
            address.setPhone(phone);
            address.setStreet(street);
            address.setCity(city);
            address.setState(state);
            address.setZipCode(zipCode);
            address.setCountry(country);
            checkoutService.saveAddress(user.getId(), address, user);
            redirectAttributes.addFlashAttribute("successMsg", "Address added");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMsg", e.getMessage());
        }
        return "redirect:/checkout";
    }

    /** Process the order */
    @PostMapping("/place-order")
    public String placeOrder(@RequestParam String addressId,
                             @RequestParam String paymentMethod,
                             Authentication auth,
                             RedirectAttributes redirectAttributes) {
        try {
            User user = userService.getByEmail(auth.getName());
            Order order = checkoutService.processCheckout(user.getId(), addressId, paymentMethod);
            return "redirect:/orders/" + order.getId() + "?new=true";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errorMsg", e.getMessage());
            return "redirect:/checkout";
        }
    }
}

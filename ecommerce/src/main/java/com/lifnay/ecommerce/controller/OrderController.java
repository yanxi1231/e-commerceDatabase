package com.lifnay.ecommerce.controller;

import com.lifnay.ecommerce.model.Order;
import com.lifnay.ecommerce.model.User;
import com.lifnay.ecommerce.service.OrderService;
import com.lifnay.ecommerce.service.UserService;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;

    public OrderController(OrderService orderService, UserService userService) {
        this.orderService = orderService;
        this.userService = userService;
    }

    /** Order history list */
    @GetMapping
    public String orderHistory(Authentication auth, Model model) {
        User user = userService.getByEmail(auth.getName());
        model.addAttribute("orders", orderService.getUserOrders(user.getId()));
        return "orders";
    }

    /** Single order detail / confirmation page */
    @GetMapping("/{id}")
    public String orderDetail(@PathVariable String id,
                              @RequestParam(required = false) String newOrder,
                              Authentication auth, Model model) {
        User user = userService.getByEmail(auth.getName());
        Order order = orderService.getOrderById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        // Security: ensure user can only see their own orders
        if (!order.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Order not found");
        }

        model.addAttribute("order", order);
        if (newOrder != null) {
            model.addAttribute("isNewOrder", true);
        }
        return "order-detail";
    }
}

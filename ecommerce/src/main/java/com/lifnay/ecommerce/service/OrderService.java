package com.lifnay.ecommerce.service;

import com.lifnay.ecommerce.model.Order;
import com.lifnay.ecommerce.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;

    public OrderService(OrderRepository orderRepository) {
        this.orderRepository = orderRepository;
    }

    /** Get all orders for a user, most recent first */
    public List<Order> getUserOrders(String userId) {
        return orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /** Get a single order by ID */
    public Optional<Order> getOrderById(String orderId) {
        return orderRepository.findById(orderId);
    }
}

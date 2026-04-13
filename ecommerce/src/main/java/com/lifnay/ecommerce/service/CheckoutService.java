package com.lifnay.ecommerce.service;

import com.lifnay.ecommerce.model.*;
import com.lifnay.ecommerce.repository.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Types;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CheckoutService {

    private final OrderRepository orderRepository;
    private final UserAddressRepository addressRepository;
    private final JdbcTemplate jdbcTemplate;

    public CheckoutService(OrderRepository orderRepository,
                           UserAddressRepository addressRepository,
                           JdbcTemplate jdbcTemplate) {
        this.orderRepository = orderRepository;
        this.addressRepository = addressRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /** Get addresses for the checkout page */
    public List<UserAddress> getUserAddresses(String userId) {
        return addressRepository.findByUserId(userId);
    }

    /** Save a new address */
    @Transactional
    public UserAddress saveAddress(String userId, UserAddress address, User user) {
        address.setId(UUID.randomUUID().toString());
        address.setUser(user);
        return addressRepository.save(address);
    }

    /**
     * Process checkout by calling the sp_checkout stored procedure.
     * The SP handles: stock verification, order creation, order items,
     * inventory decrement, payment creation, and cart clearing atomically.
     *
     * @return the created Order
     * @throws IllegalStateException if cart is empty or stock insufficient
     */
    public Order processCheckout(String userId, String addressId, String paymentMethod) {
        SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_checkout")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.CHAR),
                        new SqlParameter("p_address_id", Types.CHAR),
                        new SqlParameter("p_payment_method", Types.VARCHAR),
                        new SqlOutParameter("p_order_id", Types.CHAR),
                        new SqlOutParameter("p_result_msg", Types.VARCHAR)
                );

        Map<String, Object> result = jdbcCall.execute(userId, addressId, paymentMethod);

        String orderId = (String) result.get("p_order_id");
        String resultMsg = (String) result.get("p_result_msg");

        if (orderId == null) {
            throw new IllegalStateException(resultMsg);
        }

        return orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalStateException("Order created but not found: " + orderId));
    }
}

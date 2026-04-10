package com.lifnay.ecommerce.service;

import com.lifnay.ecommerce.model.*;
import com.lifnay.ecommerce.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
public class CheckoutService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final UserAddressRepository addressRepository;
    private final InventoryRepository inventoryRepository;

    public CheckoutService(CartRepository cartRepository, CartItemRepository cartItemRepository,
                           OrderRepository orderRepository, OrderItemRepository orderItemRepository,
                           PaymentRepository paymentRepository, UserAddressRepository addressRepository,
                           InventoryRepository inventoryRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.paymentRepository = paymentRepository;
        this.addressRepository = addressRepository;
        this.inventoryRepository = inventoryRepository;
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
     * Process checkout: verify stock, create order + items, decrement inventory,
     * create payment, clear cart. All within a single transaction.
     *
     * @return the created Order
     * @throws IllegalStateException if cart is empty or stock insufficient
     */
    @Transactional
    public Order processCheckout(String userId, String addressId, String paymentMethod) {
        // 1. Get cart and items
        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("No cart found"));
        List<CartItem> cartItems = cartItemRepository.findByCartId(cart.getId());

        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Your cart is empty");
        }

        // 2. Get shipping address
        UserAddress address = addressRepository.findById(addressId)
                .orElseThrow(() -> new IllegalArgumentException("Shipping address not found"));

        // 3. Verify stock for all items
        for (CartItem ci : cartItems) {
            int available;
            if (ci.getVariant() != null) {
                available = inventoryRepository.getAvailableStockForVariant(
                        ci.getProduct().getId(), ci.getVariant().getId());
            } else {
                available = inventoryRepository.getAvailableStockForProduct(ci.getProduct().getId());
            }
            if (available < ci.getQuantity()) {
                throw new IllegalStateException(
                        "Insufficient stock for " + ci.getProduct().getName() +
                        ". Available: " + available + ", Requested: " + ci.getQuantity());
            }
        }

        // 4. Calculate total
        BigDecimal total = cartItems.stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 5. Create order
        Order order = new Order();
        order.setId(UUID.randomUUID().toString());
        order.setUser(cart.getUser());
        order.setShippingAddress(address);
        order.setTotalAmount(total);
        order.setStatus(Order.OrderStatus.pending);
        orderRepository.save(order);

        // 6. Create order items (snapshot product names and prices)
        for (CartItem ci : cartItems) {
            OrderItem oi = new OrderItem();
            oi.setId(UUID.randomUUID().toString());
            oi.setOrder(order);
            oi.setProduct(ci.getProduct());
            oi.setVariantId(ci.getVariant() != null ? ci.getVariant().getId() : null);
            oi.setQuantity(ci.getQuantity());
            oi.setPriceAtTime(ci.getUnitPrice());
            oi.setProductNameSnapshot(ci.getProduct().getName());
            orderItemRepository.save(oi);
            order.getItems().add(oi);
        }

        // 7. Decrement inventory
        for (CartItem ci : cartItems) {
            decrementInventory(ci.getProduct().getId(),
                    ci.getVariant() != null ? ci.getVariant().getId() : null,
                    ci.getQuantity());
        }

        // 8. Create payment (simulated as completed)
        Payment payment = new Payment();
        payment.setId(UUID.randomUUID().toString());
        payment.setOrder(order);
        payment.setAmount(total);
        payment.setMethod(Payment.PaymentMethod.valueOf(paymentMethod));
        payment.setStatus(Payment.PaymentStatus.completed);
        payment.setTransactionRef("TXN-" + System.currentTimeMillis());
        payment.setIdempotencyKey("idem-" + order.getId());
        paymentRepository.save(payment);

        // 9. Update order status to paid
        order.setStatus(Order.OrderStatus.paid);
        order.setPayment(payment);
        orderRepository.save(order);

        // 10. Clear the cart
        cartItemRepository.deleteByCartId(cart.getId());

        return order;
    }

    /**
     * Decrement inventory for a product/variant across warehouses.
     * Takes from the first warehouse that has enough stock.
     */
    private void decrementInventory(String productId, String variantId, int quantity) {
        List<Inventory> stocks;
        if (variantId != null) {
            stocks = inventoryRepository.findAll().stream()
                    .filter(i -> i.getProduct().getId().equals(productId)
                            && i.getVariant() != null
                            && i.getVariant().getId().equals(variantId)
                            && i.getAvailableQuantity() > 0)
                    .toList();
        } else {
            stocks = inventoryRepository.findAll().stream()
                    .filter(i -> i.getProduct().getId().equals(productId)
                            && i.getVariant() == null
                            && i.getAvailableQuantity() > 0)
                    .toList();
        }

        int remaining = quantity;
        for (Inventory inv : stocks) {
            if (remaining <= 0) break;
            int take = Math.min(remaining, inv.getAvailableQuantity());
            inv.setStockQuantity(inv.getStockQuantity() - take);
            inventoryRepository.save(inv);
            remaining -= take;
        }

        if (remaining > 0) {
            throw new IllegalStateException("Failed to decrement inventory — inconsistent stock state");
        }
    }
}

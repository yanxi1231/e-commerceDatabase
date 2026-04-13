package com.lifnay.ecommerce.service;

import com.lifnay.ecommerce.model.*;
import com.lifnay.ecommerce.repository.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.SqlOutParameter;
import org.springframework.jdbc.core.SqlParameter;
import org.springframework.jdbc.core.simple.SimpleJdbcCall;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.sql.Types;
import java.util.List;
import java.util.Map;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final JdbcTemplate jdbcTemplate;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository,
                       JdbcTemplate jdbcTemplate) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    /** Get or create a cart for the user */
    public Cart getCart(String userId) {
        return cartRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("No cart found for user: " + userId));
    }

    /** Get all items in a user's cart */
    public List<CartItem> getCartItems(String userId) {
        Cart cart = getCart(userId);
        return cartItemRepository.findByCartId(cart.getId());
    }

    /**
     * Add an item to the cart by calling the sp_add_to_cart stored procedure.
     * The SP handles: stock validation, duplicate detection, insert or update.
     */
    public String addToCart(String userId, String productId, String variantId, int quantity) {
        // Normalize empty string to null for the SP
        if (variantId != null && variantId.isEmpty()) {
            variantId = null;
        }

        SimpleJdbcCall jdbcCall = new SimpleJdbcCall(jdbcTemplate)
                .withProcedureName("sp_add_to_cart")
                .declareParameters(
                        new SqlParameter("p_user_id", Types.CHAR),
                        new SqlParameter("p_product_id", Types.CHAR),
                        new SqlParameter("p_variant_id", Types.CHAR),
                        new SqlParameter("p_quantity", Types.INTEGER),
                        new SqlOutParameter("p_result_msg", Types.VARCHAR)
                );

        Map<String, Object> result = jdbcCall.execute(userId, productId, variantId, quantity);

        return (String) result.get("p_result_msg");
    }

    /** Update quantity of a cart item */
    @Transactional
    public void updateQuantity(String cartItemId, int quantity) {
        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("Cart item not found"));
        if (quantity <= 0) {
            cartItemRepository.delete(item);
        } else {
            item.setQuantity(quantity);
            cartItemRepository.save(item);
        }
    }

    /** Remove an item from the cart */
    @Transactional
    public void removeItem(String cartItemId) {
        cartItemRepository.deleteById(cartItemId);
    }

    /** Calculate cart total */
    public BigDecimal getCartTotal(String userId) {
        List<CartItem> items = getCartItems(userId);
        return items.stream()
                .map(CartItem::getSubtotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Get item count for cart badge */
    public int getCartItemCount(String userId) {
        List<CartItem> items = getCartItems(userId);
        return items.stream().mapToInt(CartItem::getQuantity).sum();
    }
}

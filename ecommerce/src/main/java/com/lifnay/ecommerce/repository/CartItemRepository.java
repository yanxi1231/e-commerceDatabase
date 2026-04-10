package com.lifnay.ecommerce.repository;

import com.lifnay.ecommerce.model.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, String> {
    List<CartItem> findByCartId(String cartId);
    Optional<CartItem> findByCartIdAndProductIdAndVariantId(String cartId, String productId, String variantId);
    Optional<CartItem> findByCartIdAndProductIdAndVariantIdIsNull(String cartId, String productId);
    void deleteByCartId(String cartId);
}

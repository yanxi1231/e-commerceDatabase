package com.lifnay.ecommerce.service;

import com.lifnay.ecommerce.model.*;
import com.lifnay.ecommerce.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository variantRepository;
    private final InventoryRepository inventoryRepository;

    public CartService(CartRepository cartRepository, CartItemRepository cartItemRepository,
                       ProductRepository productRepository, ProductVariantRepository variantRepository,
                       InventoryRepository inventoryRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.variantRepository = variantRepository;
        this.inventoryRepository = inventoryRepository;
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

    /** Add an item to the cart (or increase quantity if it already exists) */
    @Transactional
    public String addToCart(String userId, String productId, String variantId, int quantity) {
        // Validate product exists and is active
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));
        if (!product.isActive()) {
            throw new IllegalArgumentException("Product is not available");
        }

        // Validate variant if provided
        if (variantId != null && !variantId.isEmpty()) {
            variantRepository.findById(variantId)
                    .orElseThrow(() -> new IllegalArgumentException("Variant not found"));
        } else {
            variantId = null; // normalize empty string to null
        }

        // Check stock
        int available;
        if (variantId != null) {
            available = inventoryRepository.getAvailableStockForVariant(productId, variantId);
        } else {
            available = inventoryRepository.getAvailableStockForProduct(productId);
        }
        if (available < quantity) {
            return "Only " + available + " units available";
        }

        Cart cart = getCart(userId);

        // Check if item already in cart
        Optional<CartItem> existing;
        if (variantId != null) {
            existing = cartItemRepository.findByCartIdAndProductIdAndVariantId(cart.getId(), productId, variantId);
        } else {
            existing = cartItemRepository.findByCartIdAndProductIdAndVariantIdIsNull(cart.getId(), productId);
        }

        if (existing.isPresent()) {
            CartItem item = existing.get();
            int newQty = item.getQuantity() + quantity;
            if (newQty > available) {
                return "Cannot add more. Only " + available + " units available (you have " + item.getQuantity() + " in cart)";
            }
            item.setQuantity(newQty);
            cartItemRepository.save(item);
            return "Cart updated";
        } else {
            CartItem item = new CartItem();
            item.setId(UUID.randomUUID().toString());
            item.setCart(cart);
            item.setProduct(product);
            if (variantId != null) {
                item.setVariant(variantRepository.findById(variantId).orElse(null));
            }
            item.setQuantity(quantity);
            cartItemRepository.save(item);
            return "Item added to cart";
        }
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

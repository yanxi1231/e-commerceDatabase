package com.lifnay.ecommerce.service;

import com.lifnay.ecommerce.model.Cart;
import com.lifnay.ecommerce.model.User;
import com.lifnay.ecommerce.repository.CartRepository;
import com.lifnay.ecommerce.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, CartRepository cartRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Register a new customer account.
     * Also creates an empty cart for the user (mirroring the DB trigger for non-trigger path).
     */
    @Transactional
    public User register(String name, String email, String password) {
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("An account with this email already exists");
        }

        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setName(name);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(User.Role.customer);
        userRepository.save(user);

        // The DB trigger also creates a cart, but we create one here as well
        // to ensure the cart object is immediately available in the JPA session.
        // If the trigger already created one, this will be a no-op on next flush
        // because we check in getOrCreateCart.
        ensureCartExists(user);

        return user;
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + email));
    }

    private void ensureCartExists(User user) {
        Optional<Cart> existing = cartRepository.findByUserId(user.getId());
        if (existing.isEmpty()) {
            Cart cart = new Cart();
            cart.setId(UUID.randomUUID().toString());
            cart.setUser(user);
            cartRepository.save(cart);
        }
    }
}

package com.lifnay.ecommerce.service;

import com.lifnay.ecommerce.model.Category;
import com.lifnay.ecommerce.model.Product;
import com.lifnay.ecommerce.model.ProductVariant;
import com.lifnay.ecommerce.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductVariantRepository variantRepository;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          InventoryRepository inventoryRepository,
                          ProductVariantRepository variantRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.inventoryRepository = inventoryRepository;
        this.variantRepository = variantRepository;
    }

    /** Get all active products */
    public List<Product> getAllActiveProducts() {
        return productRepository.findByIsActiveTrue();
    }

    /** Get products by category */
    public List<Product> getProductsByCategory(String categoryId) {
        return productRepository.findByCategoryIdAndIsActiveTrue(categoryId);
    }

    /** Search products by keyword */
    public List<Product> searchProducts(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllActiveProducts();
        }
        return productRepository.searchByKeyword(keyword.trim());
    }

    /** Get a single product by ID */
    public Optional<Product> getProductById(String id) {
        return productRepository.findById(id);
    }

    /** Get all top-level categories */
    public List<Category> getTopLevelCategories() {
        return categoryRepository.findByParentIsNull();
    }

    /** Get all categories */
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    /** Get available stock for a product or variant */
    public int getAvailableStock(String productId, String variantId) {
        if (variantId != null && !variantId.isEmpty()) {
            return inventoryRepository.getAvailableStockForVariant(productId, variantId);
        }
        return inventoryRepository.getAvailableStockForProduct(productId);
    }

    /** Get variants for a product */
    public List<ProductVariant> getVariants(String productId) {
        return variantRepository.findByProductId(productId);
    }
}

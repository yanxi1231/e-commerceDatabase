package com.lifnay.ecommerce.controller;

import com.lifnay.ecommerce.model.Product;
import com.lifnay.ecommerce.service.ProductService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    /** Home page - redirects to product listing */
    @GetMapping("/")
    public String home() {
        return "redirect:/products";
    }

    /** Product listing with optional search and category filter */
    @GetMapping("/products")
    public String listProducts(@RequestParam(required = false) String search,
                               @RequestParam(required = false) String category,
                               Model model) {
        List<Product> products;

        if (search != null && !search.trim().isEmpty()) {
            products = productService.searchProducts(search);
            model.addAttribute("searchQuery", search);
        } else if (category != null && !category.isEmpty()) {
            products = productService.getProductsByCategory(category);
            model.addAttribute("selectedCategory", category);
        } else {
            products = productService.getAllActiveProducts();
        }

        model.addAttribute("products", products);
        model.addAttribute("categories", productService.getTopLevelCategories());
        return "products";
    }

    /** Product detail page */
    @GetMapping("/products/{id}")
    public String productDetail(@PathVariable String id, Model model) {
        Product product = productService.getProductById(id)
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        model.addAttribute("product", product);
        model.addAttribute("variants", productService.getVariants(id));

        // Get stock info: if product has variants, stock is per variant; otherwise per product
        if (product.getVariants().isEmpty()) {
            model.addAttribute("stock", productService.getAvailableStock(id, null));
        }

        return "product-detail";
    }
}

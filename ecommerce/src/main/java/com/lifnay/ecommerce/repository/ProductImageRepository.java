package com.lifnay.ecommerce.repository;

import com.lifnay.ecommerce.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, String> {
    List<ProductImage> findByProductIdOrderBySortOrder(String productId);
}

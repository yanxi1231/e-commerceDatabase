package com.lifnay.ecommerce.repository;

import com.lifnay.ecommerce.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InventoryRepository extends JpaRepository<Inventory, String> {

    @Query("SELECT COALESCE(SUM(i.stockQuantity - i.reservedQuantity), 0) " +
           "FROM Inventory i WHERE i.product.id = :productId AND i.variant IS NULL")
    int getAvailableStockForProduct(@Param("productId") String productId);

    @Query("SELECT COALESCE(SUM(i.stockQuantity - i.reservedQuantity), 0) " +
           "FROM Inventory i WHERE i.product.id = :productId AND i.variant.id = :variantId")
    int getAvailableStockForVariant(@Param("productId") String productId, @Param("variantId") String variantId);
}

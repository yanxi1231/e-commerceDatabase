package com.lifnay.ecommerce.repository;

import com.lifnay.ecommerce.model.Warehouse;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WarehouseRepository extends JpaRepository<Warehouse, String> {
}

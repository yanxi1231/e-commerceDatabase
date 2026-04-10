package com.lifnay.ecommerce.repository;

import com.lifnay.ecommerce.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, String> {
    List<Category> findByParentIsNull();
    Optional<Category> findBySlug(String slug);
}

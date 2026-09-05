package com.fitmind.repository;

import com.fitmind.entity.Food;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FoodRepository extends JpaRepository<Food, UUID> {

    @Query("SELECT f FROM Food f WHERE LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY f.name")
    List<Food> searchByName(@Param("query") String query);

    @Query("SELECT f FROM Food f WHERE LOWER(f.name) LIKE LOWER(CONCAT('%', :query, '%')) ORDER BY f.name LIMIT :limit")
    List<Food> searchByNameNative(@Param("query") String query, @Param("limit") int limit);
}

package ua.pnu.smartcode.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import ua.pnu.smartcode.entity.AnalysisRecordEntity;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnalysisRecordRepository extends JpaRepository<AnalysisRecordEntity, UUID> {

    List<AnalysisRecordEntity> findAllByOrderByCreatedAtDesc();
}

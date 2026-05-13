package vn.edu.iuh.fit.ott_education_be.service;

import vn.edu.iuh.fit.ott_education_be.dto.*;

import java.time.LocalDateTime;

public interface StatisticsService {
    StatisticsOverviewDTO getOverview();

    UserStatisticsDTO getUserStatistics(LocalDateTime startDate, LocalDateTime endDate);

    MessageStatisticsDTO getMessageStatistics(LocalDateTime startDate, LocalDateTime endDate);

    GroupStatisticsDTO getGroupStatistics(LocalDateTime startDate, LocalDateTime endDate);

    InteractionStatisticsDTO getInteractionStatistics();
}

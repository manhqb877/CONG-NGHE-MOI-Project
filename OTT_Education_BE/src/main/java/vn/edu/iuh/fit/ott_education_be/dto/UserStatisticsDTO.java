package vn.edu.iuh.fit.ott_education_be.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatisticsDTO {
    private long totalUsers;
    private long onlineUsers;
    private long offlineUsers;
    private long activeUsers; // Users who sent messages in the period
    private Map<String, Long> newUsersByDate; // Date -> Count
    private Map<String, Long> newUsersByMonth; // Month -> Count
}

package vn.edu.iuh.fit.ott_education_be.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsOverviewDTO {
    private long totalUsers;
    private long totalMessages;
    private long totalGroups;
    private long onlineUsers;
    private long activeUsersToday;
    private long messagesToday;
    private long newUsersToday;
    private long newGroupsToday;
}

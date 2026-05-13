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
public class GroupStatisticsDTO {
    private long totalGroups;
    private long activeGroups; // Groups with messages in the period
    private double averageMembersPerGroup;
    private Map<String, Long> newGroupsByDate; // Date -> Count
    private Map<String, Long> newGroupsByMonth; // Month -> Count
    private Map<String, GroupActivityDTO> mostActiveGroups; // GroupId -> Activity info (top 10)
}

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
public class InteractionStatisticsDTO {
    private Map<String, UserActivityDTO> topMessageSenders; // UserId -> Activity info (top 10)
    private Map<String, GroupActivityDTO> mostActiveGroups; // GroupId -> Activity info (top 10)
    private Map<Integer, Long> messagesByHour; // Hour (0-23) -> Count
}

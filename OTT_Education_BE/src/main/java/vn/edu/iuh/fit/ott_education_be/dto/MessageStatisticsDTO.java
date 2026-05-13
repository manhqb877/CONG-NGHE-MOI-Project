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
public class MessageStatisticsDTO {
    private long totalMessages;
    private long textMessages;
    private long imageMessages;
    private long videoMessages;
    private long fileMessages;
    private long oneToOneMessages;
    private long groupMessages;
    private Map<String, Long> messagesByDate; // Date -> Count
    private Map<String, Long> messagesByMonth; // Month -> Count
    private Map<String, Long> messagesByUser; // UserId -> Count (top 10)
    private Map<String, Long> messagesByGroup; // GroupId -> Count (top 10)
}

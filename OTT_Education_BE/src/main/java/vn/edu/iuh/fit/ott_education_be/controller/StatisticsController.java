package vn.edu.iuh.fit.ott_education_be.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.iuh.fit.ott_education_be.dto.*;
import vn.edu.iuh.fit.ott_education_be.service.StatisticsService;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
@Tag(name = "Statistics", description = "Statistics API - Admin Only")
@SecurityRequirement(name = "bearerAuth")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/overview")
    @Operation(summary = "Get overall statistics overview", description = "Returns overall system statistics including total users, messages, groups, and today's activity")
    public ResponseEntity<StatisticsOverviewDTO> getOverview() {
        return ResponseEntity.ok(statisticsService.getOverview());
    }

    @GetMapping("/users")
    @Operation(summary = "Get user statistics", description = "Returns user statistics for the specified date range")
    public ResponseEntity<UserStatisticsDTO> getUserStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay()
                : LocalDate.now().minusMonths(1).atStartOfDay();
        LocalDateTime end = endDate != null ? endDate.plusDays(1).atStartOfDay()
                : LocalDate.now().plusDays(1).atStartOfDay();

        return ResponseEntity.ok(statisticsService.getUserStatistics(start, end));
    }

    @GetMapping("/messages")
    @Operation(summary = "Get message statistics", description = "Returns message statistics for the specified date range")
    public ResponseEntity<MessageStatisticsDTO> getMessageStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay()
                : LocalDate.now().minusMonths(1).atStartOfDay();
        LocalDateTime end = endDate != null ? endDate.plusDays(1).atStartOfDay()
                : LocalDate.now().plusDays(1).atStartOfDay();

        return ResponseEntity.ok(statisticsService.getMessageStatistics(start, end));
    }

    @GetMapping("/groups")
    @Operation(summary = "Get group statistics", description = "Returns group statistics for the specified date range")
    public ResponseEntity<GroupStatisticsDTO> getGroupStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDateTime start = startDate != null ? startDate.atStartOfDay()
                : LocalDate.now().minusMonths(1).atStartOfDay();
        LocalDateTime end = endDate != null ? endDate.plusDays(1).atStartOfDay()
                : LocalDate.now().plusDays(1).atStartOfDay();

        return ResponseEntity.ok(statisticsService.getGroupStatistics(start, end));
    }

    @GetMapping("/interactions")
    @Operation(summary = "Get interaction statistics", description = "Returns interaction analytics including top senders, active groups, and peak hours")
    public ResponseEntity<InteractionStatisticsDTO> getInteractionStatistics() {
        return ResponseEntity.ok(statisticsService.getInteractionStatistics());
    }
}

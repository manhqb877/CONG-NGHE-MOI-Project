package vn.edu.iuh.fit.ott_education_be.service.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.edu.iuh.fit.ott_education_be.common.MessageType;
import vn.edu.iuh.fit.ott_education_be.common.UserActiveStatus;
import vn.edu.iuh.fit.ott_education_be.dto.*;
import vn.edu.iuh.fit.ott_education_be.model.Group;
import vn.edu.iuh.fit.ott_education_be.model.Message;
import vn.edu.iuh.fit.ott_education_be.model.User;
import vn.edu.iuh.fit.ott_education_be.repository.GroupRepository;
import vn.edu.iuh.fit.ott_education_be.repository.MessageRepository;
import vn.edu.iuh.fit.ott_education_be.repository.UserRepository;
import vn.edu.iuh.fit.ott_education_be.service.StatisticsService;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatisticsServiceImpl implements StatisticsService {

    private final UserRepository userRepository;
    private final MessageRepository messageRepository;
    private final GroupRepository groupRepository;

    @Override
    public StatisticsOverviewDTO getOverview() {
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = LocalDate.now().plusDays(1).atStartOfDay();

        List<User> allUsers = userRepository.findAll();
        List<Message> allMessages = messageRepository.findAll();
        List<Group> allGroups = groupRepository.findAll();

        long onlineUsers = allUsers.stream()
                .filter(u -> UserActiveStatus.ONLINE.equals(u.getActiveStatus()))
                .count();

        long newUsersToday = allUsers.stream()
                .filter(u -> u.getCreatedAt() != null &&
                        u.getCreatedAt().isAfter(startOfToday) &&
                        u.getCreatedAt().isBefore(endOfToday))
                .count();

        long messagesToday = allMessages.stream()
                .filter(m -> m.getCreatedAt() != null &&
                        m.getCreatedAt().isAfter(startOfToday) &&
                        m.getCreatedAt().isBefore(endOfToday))
                .count();

        long newGroupsToday = allGroups.stream()
                .filter(g -> g.getCreateAt() != null &&
                        g.getCreateAt().isAfter(startOfToday) &&
                        g.getCreateAt().isBefore(endOfToday))
                .count();

        Set<String> activeUserIdsToday = allMessages.stream()
                .filter(m -> m.getCreatedAt() != null &&
                        m.getCreatedAt().isAfter(startOfToday) &&
                        m.getCreatedAt().isBefore(endOfToday))
                .map(Message::getSenderId)
                .collect(Collectors.toSet());

        return StatisticsOverviewDTO.builder()
                .totalUsers(allUsers.size())
                .totalMessages(allMessages.size())
                .totalGroups(allGroups.size())
                .onlineUsers(onlineUsers)
                .activeUsersToday(activeUserIdsToday.size())
                .messagesToday(messagesToday)
                .newUsersToday(newUsersToday)
                .newGroupsToday(newGroupsToday)
                .build();
    }

    @Override
    public UserStatisticsDTO getUserStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        List<User> allUsers = userRepository.findAll();
        List<Message> messagesInPeriod = messageRepository.findAll().stream()
                .filter(m -> m.getCreatedAt() != null &&
                        m.getCreatedAt().isAfter(startDate) &&
                        m.getCreatedAt().isBefore(endDate))
                .collect(Collectors.toList());

        long onlineUsers = allUsers.stream()
                .filter(u -> UserActiveStatus.ONLINE.equals(u.getActiveStatus()))
                .count();

        long offlineUsers = allUsers.size() - onlineUsers;

        Set<String> activeUserIds = messagesInPeriod.stream()
                .map(Message::getSenderId)
                .collect(Collectors.toSet());

        // New users by date
        Map<String, Long> newUsersByDate = allUsers.stream()
                .filter(u -> u.getCreatedAt() != null &&
                        u.getCreatedAt().isAfter(startDate) &&
                        u.getCreatedAt().isBefore(endDate))
                .collect(Collectors.groupingBy(
                        u -> u.getCreatedAt().toLocalDate().format(DateTimeFormatter.ISO_DATE),
                        Collectors.counting()));

        // New users by month
        Map<String, Long> newUsersByMonth = allUsers.stream()
                .filter(u -> u.getCreatedAt() != null &&
                        u.getCreatedAt().isAfter(startDate) &&
                        u.getCreatedAt().isBefore(endDate))
                .collect(Collectors.groupingBy(
                        u -> u.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.counting()));

        return UserStatisticsDTO.builder()
                .totalUsers(allUsers.size())
                .onlineUsers(onlineUsers)
                .offlineUsers(offlineUsers)
                .activeUsers(activeUserIds.size())
                .newUsersByDate(newUsersByDate)
                .newUsersByMonth(newUsersByMonth)
                .build();
    }

    @Override
    public MessageStatisticsDTO getMessageStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        List<Message> allMessages = messageRepository.findAll();
        List<Message> messagesInPeriod = allMessages.stream()
                .filter(m -> m.getCreatedAt() != null &&
                        m.getCreatedAt().isAfter(startDate) &&
                        m.getCreatedAt().isBefore(endDate))
                .collect(Collectors.toList());

        long textMessages = messagesInPeriod.stream()
                .filter(m -> MessageType.TEXT.equals(m.getType()))
                .count();

        long imageMessages = messagesInPeriod.stream()
                .filter(m -> MessageType.IMAGE.equals(m.getType()))
                .count();

        long videoMessages = messagesInPeriod.stream()
                .filter(m -> MessageType.VIDEO.equals(m.getType()))
                .count();

        long fileMessages = messagesInPeriod.stream()
                .filter(m -> MessageType.FILE.equals(m.getType()))
                .count();

        long oneToOneMessages = messagesInPeriod.stream()
                .filter(m -> m.getGroupId() == null || m.getGroupId().isEmpty())
                .count();

        long groupMessages = messagesInPeriod.stream()
                .filter(m -> m.getGroupId() != null && !m.getGroupId().isEmpty())
                .count();

        // Messages by date
        Map<String, Long> messagesByDate = messagesInPeriod.stream()
                .collect(Collectors.groupingBy(
                        m -> m.getCreatedAt().toLocalDate().format(DateTimeFormatter.ISO_DATE),
                        Collectors.counting()));

        // Messages by month
        Map<String, Long> messagesByMonth = messagesInPeriod.stream()
                .collect(Collectors.groupingBy(
                        m -> m.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.counting()));

        // Top 10 users by message count
        Map<String, Long> messagesByUser = messagesInPeriod.stream()
                .collect(Collectors.groupingBy(Message::getSenderId, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new));

        // Top 10 groups by message count
        Map<String, Long> messagesByGroup = messagesInPeriod.stream()
                .filter(m -> m.getGroupId() != null && !m.getGroupId().isEmpty())
                .collect(Collectors.groupingBy(Message::getGroupId, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new));

        return MessageStatisticsDTO.builder()
                .totalMessages(allMessages.size())
                .textMessages(textMessages)
                .imageMessages(imageMessages)
                .videoMessages(videoMessages)
                .fileMessages(fileMessages)
                .oneToOneMessages(oneToOneMessages)
                .groupMessages(groupMessages)
                .messagesByDate(messagesByDate)
                .messagesByMonth(messagesByMonth)
                .messagesByUser(messagesByUser)
                .messagesByGroup(messagesByGroup)
                .build();
    }

    @Override
    public GroupStatisticsDTO getGroupStatistics(LocalDateTime startDate, LocalDateTime endDate) {
        List<Group> allGroups = groupRepository.findAll();
        List<Message> messagesInPeriod = messageRepository.findAll().stream()
                .filter(m -> m.getCreatedAt() != null &&
                        m.getCreatedAt().isAfter(startDate) &&
                        m.getCreatedAt().isBefore(endDate))
                .collect(Collectors.toList());

        Set<String> activeGroupIds = messagesInPeriod.stream()
                .filter(m -> m.getGroupId() != null && !m.getGroupId().isEmpty())
                .map(Message::getGroupId)
                .collect(Collectors.toSet());

        double averageMembersPerGroup = allGroups.stream()
                .filter(g -> g.getMemberIds() != null)
                .mapToInt(g -> g.getMemberIds().size())
                .average()
                .orElse(0.0);

        // New groups by date
        Map<String, Long> newGroupsByDate = allGroups.stream()
                .filter(g -> g.getCreateAt() != null &&
                        g.getCreateAt().isAfter(startDate) &&
                        g.getCreateAt().isBefore(endDate))
                .collect(Collectors.groupingBy(
                        g -> g.getCreateAt().toLocalDate().format(DateTimeFormatter.ISO_DATE),
                        Collectors.counting()));

        // New groups by month
        Map<String, Long> newGroupsByMonth = allGroups.stream()
                .filter(g -> g.getCreateAt() != null &&
                        g.getCreateAt().isAfter(startDate) &&
                        g.getCreateAt().isBefore(endDate))
                .collect(Collectors.groupingBy(
                        g -> g.getCreateAt().format(DateTimeFormatter.ofPattern("yyyy-MM")),
                        Collectors.counting()));

        // Most active groups (top 10)
        Map<String, Long> groupMessageCounts = messagesInPeriod.stream()
                .filter(m -> m.getGroupId() != null && !m.getGroupId().isEmpty())
                .collect(Collectors.groupingBy(Message::getGroupId, Collectors.counting()));

        Map<String, GroupActivityDTO> mostActiveGroups = groupMessageCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> {
                            Group group = groupRepository.findById(entry.getKey()).orElse(null);
                            return GroupActivityDTO.builder()
                                    .groupId(entry.getKey())
                                    .groupName(group != null ? group.getName() : "Unknown")
                                    .messageCount(entry.getValue())
                                    .memberCount(
                                            group != null && group.getMemberIds() != null ? group.getMemberIds().size()
                                                    : 0)
                                    .build();
                        },
                        (e1, e2) -> e1,
                        LinkedHashMap::new));

        return GroupStatisticsDTO.builder()
                .totalGroups(allGroups.size())
                .activeGroups(activeGroupIds.size())
                .averageMembersPerGroup(averageMembersPerGroup)
                .newGroupsByDate(newGroupsByDate)
                .newGroupsByMonth(newGroupsByMonth)
                .mostActiveGroups(mostActiveGroups)
                .build();
    }

    @Override
    public InteractionStatisticsDTO getInteractionStatistics() {
        List<Message> allMessages = messageRepository.findAll();

        // Top 10 message senders
        Map<String, Long> userMessageCounts = allMessages.stream()
                .collect(Collectors.groupingBy(Message::getSenderId, Collectors.counting()));

        Map<String, UserActivityDTO> topMessageSenders = userMessageCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> {
                            User user = userRepository.findById(entry.getKey()).orElse(null);
                            String userName = "Unknown";
                            if (user != null) {
                                userName = (user.getFirstName() != null ? user.getFirstName() : "") +
                                        " " + (user.getLastName() != null ? user.getLastName() : "");
                                userName = userName.trim();
                                if (userName.isEmpty()) {
                                    userName = user.getUsername() != null ? user.getUsername() : "Unknown";
                                }
                            }
                            return UserActivityDTO.builder()
                                    .userId(entry.getKey())
                                    .userName(userName)
                                    .messageCount(entry.getValue())
                                    .build();
                        },
                        (e1, e2) -> e1,
                        LinkedHashMap::new));

        // Most active groups (top 10)
        Map<String, Long> groupMessageCounts = allMessages.stream()
                .filter(m -> m.getGroupId() != null && !m.getGroupId().isEmpty())
                .collect(Collectors.groupingBy(Message::getGroupId, Collectors.counting()));

        Map<String, GroupActivityDTO> mostActiveGroups = groupMessageCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(10)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        entry -> {
                            Group group = groupRepository.findById(entry.getKey()).orElse(null);
                            return GroupActivityDTO.builder()
                                    .groupId(entry.getKey())
                                    .groupName(group != null ? group.getName() : "Unknown")
                                    .messageCount(entry.getValue())
                                    .memberCount(
                                            group != null && group.getMemberIds() != null ? group.getMemberIds().size()
                                                    : 0)
                                    .build();
                        },
                        (e1, e2) -> e1,
                        LinkedHashMap::new));

        // Messages by hour (0-23)
        Map<Integer, Long> messagesByHour = allMessages.stream()
                .filter(m -> m.getCreatedAt() != null)
                .collect(Collectors.groupingBy(
                        m -> m.getCreatedAt().getHour(),
                        Collectors.counting()));

        return InteractionStatisticsDTO.builder()
                .topMessageSenders(topMessageSenders)
                .mostActiveGroups(mostActiveGroups)
                .messagesByHour(messagesByHour)
                .build();
    }
}

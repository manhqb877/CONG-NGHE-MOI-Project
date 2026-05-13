import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    TextField,
    CircularProgress,
    Alert,
    Paper,
    Divider,
} from '@mui/material';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
} from 'recharts';
import {
    getOverview,
    getUserStatistics,
    getMessageStatistics,
    getGroupStatistics,
    getInteractionStatistics,
} from '../../api/statisticsApi';
import {
    BiUser,
    BiMessage,
    BiGroup,
    BiTrendingUp,
    BiCalendar,
} from 'react-icons/bi';

const COLORS = ['#2563eb', '#1d4ed8', '#3b82f6', '#60a5fa', '#f59e0b', '#ef4444'];

const StatisticsPanel = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [overview, setOverview] = useState(null);
    const [userStats, setUserStats] = useState(null);
    const [messageStats, setMessageStats] = useState(null);
    const [groupStats, setGroupStats] = useState(null);
    const [interactionStats, setInteractionStats] = useState(null);

    const [startDate, setStartDate] = useState(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchAllStatistics();
    }, [startDate, endDate]);

    const fetchAllStatistics = async () => {
        setLoading(true);
        setError(null);
        try {
            const [overviewData, userData, messageData, groupData, interactionData] = await Promise.all([
                getOverview(),
                getUserStatistics(startDate, endDate),
                getMessageStatistics(startDate, endDate),
                getGroupStatistics(startDate, endDate),
                getInteractionStatistics(),
            ]);

            setOverview(overviewData);
            setUserStats(userData);
            setMessageStats(messageData);
            setGroupStats(groupData);
            setInteractionStats(interactionData);
        } catch (err) {
            console.error('Error fetching statistics:', err);
            setError(err.response?.status === 403
                ? 'Bạn không có quyền truy cập. Chỉ Admin mới có thể xem thống kê.'
                : 'Không thể tải dữ liệu thống kê.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
                <CircularProgress sx={{ color: '#2563eb' }} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={3}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    // Prepare data for charts
    const messageTypeData = messageStats ? [
        { name: 'Text', value: messageStats.textMessages, color: COLORS[0] },
        { name: 'Hình ảnh', value: messageStats.imageMessages, color: COLORS[1] },
        { name: 'Video', value: messageStats.videoMessages, color: COLORS[2] },
        { name: 'File', value: messageStats.fileMessages, color: COLORS[3] },
    ].filter(item => item.value > 0) : [];

    const userStatusData = userStats ? [
        { name: 'Online', value: userStats.onlineUsers, color: '#3b82f6' },
        { name: 'Offline', value: userStats.offlineUsers, color: '#2563eb' },
    ] : [];

    const messagesByDateData = messageStats && messageStats.messagesByDate
        ? Object.entries(messageStats.messagesByDate)
            .slice(-14) // Last 14 days
            .map(([date, count]) => ({
                date: new Date(date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
                count,
            }))
        : [];

    const topSendersData = interactionStats && interactionStats.topMessageSenders
        ? Object.values(interactionStats.topMessageSenders).slice(0, 8).map(sender => ({
            name: sender.userName.length > 10 ? sender.userName.substring(0, 10) + '...' : sender.userName,
            messages: sender.messageCount,
        }))
        : [];

    const peakHoursData = interactionStats && interactionStats.messagesByHour
        ? Object.entries(interactionStats.messagesByHour)
            .map(([hour, count]) => ({
                hour: `${hour}h`,
                count,
            }))
            .sort((a, b) => parseInt(a.hour) - parseInt(b.hour))
        : [];

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Left Panel - Overview */}
            <Box sx={{
                width: 320,
                borderRight: '1px solid #e0e0e0',
                p: 2,
                overflow: 'auto',
                backgroundColor: '#fafafa'
            }}>
                {/* Header */}
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: '#2563eb' }}>
                    📊 Phân Tích Học Tập
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                    Dashboard quản lý hoạt động học tập
                </Typography>

                {/* Date Filter */}
                <Paper sx={{ p: 1.5, mb: 2, backgroundColor: 'white' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <BiCalendar size={16} color="#2563eb" />
                        <Typography variant="caption" fontWeight="600" ml={0.5}>
                            Khoảng thời gian
                        </Typography>
                    </Box>
                    <TextField
                        label="Từ ngày"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        fullWidth
                        sx={{ mb: 1 }}
                    />
                    <TextField
                        label="Đến ngày"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        fullWidth
                    />
                </Paper>

                {/* Overview Cards */}
                <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                        <Card sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', height: 100 }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <BiUser size={24} color="rgba(255,255,255,0.9)" />
                                <Typography variant="h5" color="white" fontWeight="bold" mt={0.5}>
                                    {overview?.totalUsers || 0}
                                </Typography>
                                <Typography variant="caption" color="rgba(255,255,255,0.8)">
                                    Học viên
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={6}>
                        <Card sx={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', height: 100 }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <BiMessage size={24} color="rgba(255,255,255,0.9)" />
                                <Typography variant="h5" color="white" fontWeight="bold" mt={0.5}>
                                    {overview?.totalMessages || 0}
                                </Typography>
                                <Typography variant="caption" color="rgba(255,255,255,0.8)">
                                    Tin nhắn học tập
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={6}>
                        <Card sx={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)', height: 100 }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <BiGroup size={24} color="rgba(255,255,255,0.9)" />
                                <Typography variant="h5" color="white" fontWeight="bold" mt={0.5}>
                                    {overview?.totalGroups || 0}
                                </Typography>
                                <Typography variant="caption" color="rgba(255,255,255,0.8)">
                                    Nhóm học tập
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={6}>
                        <Card sx={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)', height: 100 }}>
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                <BiTrendingUp size={24} color="rgba(255,255,255,0.9)" />
                                <Typography variant="h5" color="white" fontWeight="bold" mt={0.5}>
                                    {overview?.onlineUsers || 0}
                                </Typography>
                                <Typography variant="caption" color="rgba(255,255,255,0.8)">
                                    Đang hoạt động
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                {/* Quick Stats */}
                <Paper sx={{ p: 1.5, backgroundColor: 'white' }}>
                    <Typography variant="caption" fontWeight="600" color="text.secondary" display="block" mb={1}>
                        Hoạt động hôm nay
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Học viên mới</Typography>
                        <Typography variant="body2" fontWeight="bold" color="#2563eb">
                            +{overview?.newUsersToday || 0}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Tin nhắn học tập</Typography>
                        <Typography variant="body2" fontWeight="bold" color="#2563eb">
                            +{overview?.messagesToday || 0}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">Nhóm học tập mới</Typography>
                        <Typography variant="body2" fontWeight="bold" color="#2563eb">
                            +{overview?.newGroupsToday || 0}
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Học viên hoạt động</Typography>
                        <Typography variant="body2" fontWeight="bold" color="#2563eb">
                            {overview?.activeUsersToday || 0}
                        </Typography>
                    </Box>
                </Paper>
            </Box>

            {/* Right Panel - Charts */}
            <Box sx={{ flex: 1, p: 3, overflow: 'auto', backgroundColor: '#f5f5f5' }}>
                <Grid container spacing={2}>
                    {/* Messages Trend */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                📈 Xu hướng hoạt động học tập (14 ngày gần nhất)
                            </Typography>
                            <ResponsiveContainer width="100%" height={250}>
                                <AreaChart data={messagesByDateData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" style={{ fontSize: 12 }} />
                                    <YAxis style={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#2563eb"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                        name="Tin nhắn"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* User Status & Message Types */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                👥 Trạng thái học viên
                            </Typography>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie
                                        data={userStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {userStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, height: '100%' }}>
                            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                💬 Loại tin nhắn
                            </Typography>
                            {messageTypeData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={messageTypeData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry) => `${entry.name}: ${entry.value}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {messageTypeData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box display="flex" alignItems="center" justifyContent="center" height={220}>
                                    <Typography variant="body2" color="text.secondary">
                                        Chưa có dữ liệu
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Top Senders */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                🏆 Top học viên tích cực
                            </Typography>
                            {topSendersData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={topSendersData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" style={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
                                        <YAxis style={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="messages" fill="#2563eb" radius={[4, 4, 0, 0]} name="Tin nhắn" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box display="flex" alignItems="center" justifyContent="center" height={250}>
                                    <Typography variant="body2" color="text.secondary">
                                        Chưa có dữ liệu
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Peak Hours */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                ⏰ Giờ cao điểm
                            </Typography>
                            {peakHoursData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={peakHoursData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="hour" style={{ fontSize: 11 }} />
                                        <YAxis style={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Tin nhắn" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <Box display="flex" alignItems="center" justifyContent="center" height={250}>
                                    <Typography variant="body2" color="text.secondary">
                                        Chưa có dữ liệu
                                    </Typography>
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Group Stats */}
                    <Grid item xs={12}>
                        <Paper sx={{ p: 2 }}>
                            <Typography variant="subtitle1" fontWeight="600" gutterBottom>
                                📊 Thống kê nhóm học tập chi tiết
                            </Typography>
                            <Grid container spacing={2} mt={0.5}>
                                <Grid item xs={4}>
                                    <Box sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #2563eb15 0%, #1d4ed815 100%)',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="h4" fontWeight="bold" color="#2563eb">
                                            {groupStats?.totalGroups || 0}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Tổng số nhóm học tập
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #3b82f615 0%, #60a5fa15 100%)',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="h4" fontWeight="bold" color="#3b82f6">
                                            {groupStats?.activeGroups || 0}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Nhóm học tập hoạt động
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={4}>
                                    <Box sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        background: 'linear-gradient(135deg, #1d4ed815 0%, #3b82f615 100%)',
                                        textAlign: 'center'
                                    }}>
                                        <Typography variant="h4" fontWeight="bold" color="#1d4ed8">
                                            {groupStats?.averageMembersPerGroup?.toFixed(1) || 0}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            TB học viên/nhóm
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    );
};

export default StatisticsPanel;

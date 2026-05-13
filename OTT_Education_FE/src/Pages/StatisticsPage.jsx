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
    AppBar,
    Toolbar,
    Button,
    Container,
    Paper,
} from '@mui/material';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    AreaChart,
    Area,
} from 'recharts';
import {
    getOverview,
    getUserStatistics,
    getMessageStatistics,
    getGroupStatistics,
    getInteractionStatistics,
} from '../api/statisticsApi';
import {
    BiUser,
    BiMessage,
    BiGroup,
    BiTrendingUp,
    BiHome,
    BiLogOut,
    BiCalendar,
    BiBarChart
} from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140'];

const StatisticsPage = () => {
    const navigate = useNavigate();
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
                ? 'Bạn không có quyền truy cập trang này. Chỉ Admin mới có thể xem thống kê.'
                : 'Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('userId');
        navigate('/');
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh"
                sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Box textAlign="center">
                    <CircularProgress size={60} sx={{ color: 'white' }} />
                    <Typography variant="h6" color="white" mt={2}>Đang tải dữ liệu...</Typography>
                </Box>
            </Box>
        );
    }

    if (error) {
        return (
            <>
                <AppBar position="static" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <Toolbar>
                        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                            📊 OTT Education - Admin Dashboard
                        </Typography>
                    </Toolbar>
                </AppBar>
                <Container maxWidth="lg" sx={{ mt: 4 }}>
                    <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
                </Container>
            </>
        );
    }

    // Prepare data for charts
    const messageTypeData = messageStats ? [
        { name: 'Text', value: messageStats.textMessages, color: COLORS[0] },
        { name: 'Hình ảnh', value: messageStats.imageMessages, color: COLORS[1] },
        { name: 'Video', value: messageStats.videoMessages, color: COLORS[2] },
        { name: 'File', value: messageStats.fileMessages, color: COLORS[3] },
    ] : [];

    const messageChatTypeData = messageStats ? [
        { name: 'Chat 1-1', value: messageStats.oneToOneMessages, color: COLORS[0] },
        { name: 'Nhóm', value: messageStats.groupMessages, color: COLORS[1] },
    ] : [];

    const userStatusData = userStats ? [
        { name: 'Online', value: userStats.onlineUsers, color: '#43e97b' },
        { name: 'Offline', value: userStats.offlineUsers, color: '#f093fb' },
    ] : [];

    const messagesByDateData = messageStats && messageStats.messagesByDate
        ? Object.entries(messageStats.messagesByDate).map(([date, count]) => ({
            date: new Date(date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }),
            count,
        }))
        : [];

    const topSendersData = interactionStats && interactionStats.topMessageSenders
        ? Object.values(interactionStats.topMessageSenders).slice(0, 5).map(sender => ({
            name: sender.userName.length > 15 ? sender.userName.substring(0, 15) + '...' : sender.userName,
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
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
            {/* Modern Navbar */}
            <AppBar position="sticky" elevation={0} sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backdropFilter: 'blur(10px)'
            }}>
                <Toolbar>
                    <BiBarChart size={32} style={{ marginRight: 12 }} />
                    <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                        OTT Education - Admin Dashboard
                    </Typography>
                    <Button
                        color="inherit"
                        startIcon={<BiHome />}
                        onClick={() => navigate('/home')}
                        sx={{ mr: 1 }}
                    >
                        Trang chủ
                    </Button>
                    <Button
                        color="inherit"
                        startIcon={<BiLogOut />}
                        onClick={handleLogout}
                    >
                        Đăng xuất
                    </Button>
                </Toolbar>
            </AppBar>

            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight="bold" gutterBottom sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 1
                    }}>
                        📊 Thống Kê Tổng Quan
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        Phân tích chi tiết hoạt động hệ thống
                    </Typography>
                </Box>

                {/* Date Range Filter */}
                <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <BiCalendar size={24} color="#667eea" />
                        <Typography variant="subtitle1" fontWeight="600" sx={{ mr: 2 }}>
                            Khoảng thời gian:
                        </Typography>
                        <TextField
                            label="Từ ngày"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                            sx={{ minWidth: 180 }}
                        />
                        <TextField
                            label="Đến ngày"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                            sx={{ minWidth: 180 }}
                        />
                    </Box>
                </Paper>

                {/* Overview Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: 3,
                            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                            transition: 'transform 0.3s',
                            '&:hover': { transform: 'translateY(-8px)' }
                        }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="body2" color="rgba(255,255,255,0.8)" gutterBottom>
                                            Tổng người dùng
                                        </Typography>
                                        <Typography variant="h3" color="white" fontWeight="bold">
                                            {overview?.totalUsers || 0}
                                        </Typography>
                                        <Typography variant="caption" color="rgba(255,255,255,0.7)">
                                            +{overview?.newUsersToday || 0} hôm nay
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        borderRadius: '50%',
                                        p: 2
                                    }}>
                                        <BiUser size={40} color="white" />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            borderRadius: 3,
                            boxShadow: '0 8px 24px rgba(240, 147, 251, 0.3)',
                            transition: 'transform 0.3s',
                            '&:hover': { transform: 'translateY(-8px)' }
                        }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="body2" color="rgba(255,255,255,0.8)" gutterBottom>
                                            Tổng tin nhắn
                                        </Typography>
                                        <Typography variant="h3" color="white" fontWeight="bold">
                                            {overview?.totalMessages || 0}
                                        </Typography>
                                        <Typography variant="caption" color="rgba(255,255,255,0.7)">
                                            +{overview?.messagesToday || 0} hôm nay
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        borderRadius: '50%',
                                        p: 2
                                    }}>
                                        <BiMessage size={40} color="white" />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            borderRadius: 3,
                            boxShadow: '0 8px 24px rgba(79, 172, 254, 0.3)',
                            transition: 'transform 0.3s',
                            '&:hover': { transform: 'translateY(-8px)' }
                        }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="body2" color="rgba(255,255,255,0.8)" gutterBottom>
                                            Tổng nhóm
                                        </Typography>
                                        <Typography variant="h3" color="white" fontWeight="bold">
                                            {overview?.totalGroups || 0}
                                        </Typography>
                                        <Typography variant="caption" color="rgba(255,255,255,0.7)">
                                            +{overview?.newGroupsToday || 0} hôm nay
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        borderRadius: '50%',
                                        p: 2
                                    }}>
                                        <BiGroup size={40} color="white" />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} sm={6} md={3}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                            borderRadius: 3,
                            boxShadow: '0 8px 24px rgba(67, 233, 123, 0.3)',
                            transition: 'transform 0.3s',
                            '&:hover': { transform: 'translateY(-8px)' }
                        }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="body2" color="rgba(255,255,255,0.8)" gutterBottom>
                                            Đang online
                                        </Typography>
                                        <Typography variant="h3" color="white" fontWeight="bold">
                                            {overview?.onlineUsers || 0}
                                        </Typography>
                                        <Typography variant="caption" color="rgba(255,255,255,0.7)">
                                            {overview?.activeUsersToday || 0} hoạt động
                                        </Typography>
                                    </Box>
                                    <Box sx={{
                                        backgroundColor: 'rgba(255,255,255,0.2)',
                                        borderRadius: '50%',
                                        p: 2
                                    }}>
                                        <BiTrendingUp size={40} color="white" />
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Charts */}
                <Grid container spacing={3}>
                    {/* Messages by Date Area Chart */}
                    <Grid item xs={12}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                            <Typography variant="h6" fontWeight="600" gutterBottom>
                                📈 Xu hướng tin nhắn theo thời gian
                            </Typography>
                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={messagesByDateData}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#667eea" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" stroke="#666" />
                                    <YAxis stroke="#666" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 8
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#667eea"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                        name="Số tin nhắn"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* User Status & Message Type */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0', height: '100%' }}>
                            <Typography variant="h6" fontWeight="600" gutterBottom>
                                👥 Trạng thái người dùng
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={userStatusData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                        outerRadius={100}
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
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0', height: '100%' }}>
                            <Typography variant="h6" fontWeight="600" gutterBottom>
                                💬 Phân loại tin nhắn
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={messageTypeData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                        outerRadius={100}
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
                        </Paper>
                    </Grid>

                    {/* Top Senders */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                            <Typography variant="h6" fontWeight="600" gutterBottom>
                                🏆 Top người gửi tin nhắn
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={topSendersData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" stroke="#666" />
                                    <YAxis dataKey="name" type="category" width={100} stroke="#666" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 8
                                        }}
                                    />
                                    <Bar dataKey="messages" fill="#667eea" radius={[0, 8, 8, 0]} name="Số tin nhắn" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Peak Hours */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                            <Typography variant="h6" fontWeight="600" gutterBottom>
                                ⏰ Giờ cao điểm
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={peakHoursData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="hour" stroke="#666" />
                                    <YAxis stroke="#666" />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'white',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: 8
                                        }}
                                    />
                                    <Bar dataKey="count" fill="#f093fb" radius={[8, 8, 0, 0]} name="Số tin nhắn" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    {/* Chat Type & Group Stats */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                            <Typography variant="h6" fontWeight="600" gutterBottom>
                                💭 Loại cuộc trò chuyện
                            </Typography>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={messageChatTypeData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => `${entry.name}: ${entry.value}`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {messageChatTypeData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                            <Typography variant="h6" fontWeight="600" gutterBottom>
                                📊 Thống kê nhóm
                            </Typography>
                            <Box sx={{ mt: 3 }}>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 2,
                                    mb: 2,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)'
                                }}>
                                    <Typography variant="body1" color="text.secondary">
                                        Tổng số nhóm
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" color="primary">
                                        {groupStats?.totalGroups || 0}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 2,
                                    mb: 2,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #f093fb15 0%, #f5576c15 100%)'
                                }}>
                                    <Typography variant="body1" color="text.secondary">
                                        Nhóm hoạt động
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#f5576c' }}>
                                        {groupStats?.activeGroups || 0}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    p: 2,
                                    borderRadius: 2,
                                    background: 'linear-gradient(135deg, #4facfe15 0%, #00f2fe15 100%)'
                                }}>
                                    <Typography variant="body1" color="text.secondary">
                                        TB thành viên/nhóm
                                    </Typography>
                                    <Typography variant="h4" fontWeight="bold" sx={{ color: '#4facfe' }}>
                                        {groupStats?.averageMembersPerGroup?.toFixed(1) || 0}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default StatisticsPage;

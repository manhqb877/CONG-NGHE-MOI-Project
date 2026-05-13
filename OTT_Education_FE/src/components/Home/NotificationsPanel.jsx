import React from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    Button,
    Paper,
    Divider,
    IconButton,
} from '@mui/material';
import { BiUserCheck, BiUserX, BiBell } from 'react-icons/bi';

const NotificationsPanel = ({
    pendingRequests = [],
    onAccept,
    onDecline,
    isLoading,
}) => {
    if (!pendingRequests || pendingRequests.length === 0) {
        return (
            <Box
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3,
                    textAlign: 'center',
                }}
            >
                <BiBell size={64} color="#e0e0e0" />
                <Typography variant="h6" color="text.secondary" mt={2}>
                    Không có thông báo mới
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Khi có lời mời kết bạn hoặc tin nhắn mới, chúng sẽ xuất hiện ở đây.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
                sx={{
                    p: 2,
                    borderBottom: '1px solid #e0e0e0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Typography variant="h6" fontWeight="bold" color="primary">
                    Thông báo
                </Typography>
                <Box
                    sx={{
                        bgcolor: 'error.main',
                        color: 'white',
                        px: 1,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                    }}
                >
                    {pendingRequests.length} mới
                </Box>
            </Box>

            <List sx={{ flex: 1, overflow: 'auto', p: 0 }}>
                {pendingRequests.map((request) => (
                    <React.Fragment key={request.id}>
                        <ListItem
                            alignItems="flex-start"
                            sx={{
                                '&:hover': { bgcolor: '#f5f5f5' },
                                transition: 'background-color 0.2s',
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar
                                    src={request.sender?.avatar}
                                    sx={{ width: 48, height: 48 }}
                                >
                                    {request.sender?.firstName?.charAt(0)}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Typography
                                        variant="subtitle1"
                                        fontWeight="bold"
                                    >
                                        {request.sender?.firstName} {request.sender?.lastName}
                                    </Typography>
                                }
                                secondary={
                                    <Box component="span">
                                        <Typography
                                            variant="body2"
                                            color="text.primary"
                                            display="block"
                                            sx={{ mb: 1 }}
                                        >
                                            Đã gửi cho bạn một lời mời kết bạn
                                        </Typography>
                                        <Box display="flex" gap={1}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                startIcon={<BiUserCheck />}
                                                onClick={() => onAccept(request.id)}
                                                disabled={isLoading}
                                                disableElevation
                                            >
                                                Chấp nhận
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                color="inherit"
                                                startIcon={<BiUserX />}
                                                onClick={() => onDecline(request.id)}
                                                disabled={isLoading}
                                            >
                                                Từ chối
                                            </Button>
                                        </Box>
                                    </Box>
                                }
                            />
                        </ListItem>
                        <Divider variant="inset" component="li" />
                    </React.Fragment>
                ))}
            </List>
        </Box>
    );
};

export default NotificationsPanel;

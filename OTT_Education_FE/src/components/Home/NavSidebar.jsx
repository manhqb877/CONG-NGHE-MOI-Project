import React from 'react';
import {
    Box,
    IconButton,
    Avatar,
    Tooltip,
    Badge,
} from '@mui/material';
import {
    BiMessageSquareDetail,
    BiUser,
    BiCog,
    BiBarChart,
} from 'react-icons/bi';
import {
    MdNotifications,
} from 'react-icons/md';
import { styled } from '@mui/material/styles';

const NavSidebarContainer = styled(Box)(() => ({
    background: '#1e2535',
    width: 68,
    minWidth: 68,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    color: 'white',
    position: 'relative',
    zIndex: 10,
}));

const NavIcon = styled(IconButton)(({ active }) => ({
    width: 44,
    height: 44,
    borderRadius: 12,
    color: active ? '#ffffff' : 'rgba(255,255,255,0.45)',
    backgroundColor: active ? 'rgba(0,104,255,0.25)' : 'transparent',
    transition: 'all 0.15s ease',
    '&:hover': {
        color: '#ffffff',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
}));

const NavSidebar = ({ currentView, setCurrentView, user, unreadNotifications, onAvatarClick }) => {
    return (
        <NavSidebarContainer>
            {/* User Avatar */}
            <Box sx={{ mb: 3 }}>
                <Tooltip title={user?.fullName || 'Hồ sơ'} placement="right">
                    <Avatar
                        src={user?.avatar}
                        alt={user?.fullName}
                        sx={{
                            width: 40,
                            height: 40,
                            cursor: 'pointer',
                            border: '2px solid rgba(255,255,255,0.2)',
                            '&:hover': {
                                border: '2px solid rgba(0,104,255,0.7)',
                                boxShadow: '0 0 0 2px rgba(0,104,255,0.3)',
                            },
                            transition: 'all 0.15s ease',
                            fontSize: '1rem',
                            fontWeight: 600,
                            bgcolor: '#0068ff',
                        }}
                        onClick={onAvatarClick}
                    >
                        {user?.fullName?.charAt(0)}
                    </Avatar>
                </Tooltip>
            </Box>

            {/* Navigation Icons */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Tin nhắn" placement="right">
                    <NavIcon
                        active={currentView === 'messages' ? 1 : 0}
                        onClick={() => setCurrentView('messages')}
                    >
                        <BiMessageSquareDetail size={22} />
                    </NavIcon>
                </Tooltip>

                <Tooltip title="Danh bạ" placement="right">
                    <NavIcon
                        active={currentView === 'contacts' ? 1 : 0}
                        onClick={() => setCurrentView('contacts')}
                    >
                        <BiUser size={22} />
                    </NavIcon>
                </Tooltip>

                <Tooltip title="Thông báo" placement="right">
                    <NavIcon
                        active={currentView === 'notifications' ? 1 : 0}
                        onClick={() => setCurrentView('notifications')}
                    >
                        <Badge
                            badgeContent={unreadNotifications || 0}
                            color="error"
                            max={99}
                            sx={{
                                '& .MuiBadge-badge': {
                                    fontSize: '0.6rem',
                                    minWidth: 16,
                                    height: 16,
                                    padding: '0 4px',
                                },
                            }}
                        >
                            <MdNotifications size={22} />
                        </Badge>
                    </NavIcon>
                </Tooltip>

                {user?.role === 'ADMIN' && (
                    <Tooltip title="Thống kê" placement="right">
                        <NavIcon
                            active={currentView === 'statistics' ? 1 : 0}
                            onClick={() => setCurrentView('statistics')}
                        >
                            <BiBarChart size={22} />
                        </NavIcon>
                    </Tooltip>
                )}
            </Box>

            {/* Bottom: Settings */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="Cài đặt" placement="right">
                    <NavIcon
                        active={currentView === 'settings' ? 1 : 0}
                        onClick={() => setCurrentView('settings')}
                    >
                        <BiCog size={22} />
                    </NavIcon>
                </Tooltip>
            </Box>
        </NavSidebarContainer>
    );
};

export default NavSidebar;

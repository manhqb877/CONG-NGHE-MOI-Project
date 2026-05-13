import React from 'react';
import {
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Badge,
    Typography,
    Button,
    Box,
} from '@mui/material';
import { BiGroup, BiBell, BiPin } from 'react-icons/bi';
import { cancelFriendRequest } from '../../api/user';
import ProfileModal from './ProfileModal';
import { toast } from 'react-toastify';

const ContactList = ({
    contacts,
    selectedContact,
    onContactSelect,
    pendingRequests,
    onAcceptFriendRequest,
    isLoading,
    fetchPendingFriendRequests,
}) => {
    const token = localStorage.getItem('accessToken');
    const userId = localStorage.getItem('userId');

    const handleCancelRequest = async (requestId) => {
        try {
            const result = await cancelFriendRequest(requestId);
            if (result) {
                toast.dismiss();
                toast.success(result.message || 'Đã hủy lời mời kết bạn');
                await fetchPendingFriendRequests();
            }
        } catch (error) {
            toast.dismiss();
            toast.error(error.message || 'Hủy lời mời kết bạn thất bại');
        }
    };

    return (
        <>
            {pendingRequests?.length > 0 && (
                <>
                    <Typography
                        variant="caption"
                        sx={{
                            px: 2,
                            py: 1,
                            display: 'block',
                            color: '#7589a3',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontSize: '0.7rem',
                        }}
                    >
                        Lời mời kết bạn ({pendingRequests.length})
                    </Typography>
                    <List sx={{ overflow: 'auto', mb: 1, px: 1 }}>
                        {pendingRequests.map((request) => (
                            <ListItem
                                key={request.requestId || request.id}
                                sx={{
                                    py: 1,
                                    px: 1,
                                    borderRadius: 2,
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    '&:hover': { backgroundColor: '#f5f7fb' },
                                }}
                            >
                                <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                                    <Avatar
                                        src={request.avatar}
                                        sx={{ width: 44, height: 44, mr: 1.5, flexShrink: 0 }}
                                    >
                                        {!request.avatar &&
                                            (request.name || request.lastName || 'U').charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#081c36', fontSize: '0.9rem' }}>
                                            {request.name || request.lastName || request.senderName || 'Người dùng'}
                                        </Typography>
                                        <Typography variant="caption" sx={{ color: '#7589a3' }}>
                                            Đã gửi lời mời kết bạn
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1, ml: '56px' }}>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        onClick={() => onAcceptFriendRequest(request.requestId)}
                                        disabled={isLoading}
                                        sx={{
                                            borderRadius: 6,
                                            fontSize: '0.75rem',
                                            py: 0.4,
                                            px: 1.5,
                                            background: 'linear-gradient(90deg, #0068ff 0%, #00aeff 100%)',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Chấp nhận
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        onClick={() => handleCancelRequest(request.requestId)}
                                        disabled={isLoading}
                                        sx={{
                                            borderRadius: 6,
                                            fontSize: '0.75rem',
                                            py: 0.4,
                                            px: 1.5,
                                            borderColor: '#e0e7ef',
                                            color: '#7589a3',
                                            '&:hover': { borderColor: '#b0bec5', bgcolor: '#f5f7fb' },
                                        }}
                                    >
                                        Từ chối
                                    </Button>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                    <Box sx={{ height: 1, bgcolor: '#f0f2f5', mx: 2, mb: 1 }} />
                </>
            )}

            {contacts.length > 0 && (
                <List sx={{ overflow: 'auto', flex: 1, px: 1, py: 0 }}>
                    {contacts.map((contact) => (
                        <ListItem
                            key={contact.isGroup ? `group-${contact.id}` : `contact-${contact.id}`}
                            component="button"
                            selected={selectedContact?.id === contact.id}
                            onClick={() => onContactSelect(contact)}
                            sx={{
                                py: 0.75,
                                px: 1,
                                borderRadius: 2,
                                border: 'none',
                                width: '100%',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                backgroundColor: selectedContact?.id === contact.id ? '#e8f0fe' : 'transparent',
                                '&:hover': {
                                    backgroundColor: selectedContact?.id === contact.id ? '#e8f0fe' : '#f5f7fb',
                                },
                                transition: 'background-color 0.1s ease',
                                textAlign: 'left',
                            }}
                        >
                            {/* Avatar with online dot */}
                            <Box sx={{ position: 'relative', mr: 1.5, flexShrink: 0 }}>
                                <Avatar
                                    src={contact.avatar}
                                    sx={{
                                        width: 44,
                                        height: 44,
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        bgcolor: contact.isGroup ? '#e8f0fe' : '#0068ff',
                                        color: contact.isGroup ? '#0068ff' : '#fff',
                                    }}
                                >
                                    {contact.isGroup && !contact.avatar ? (
                                        <BiGroup size={22} />
                                    ) : (
                                        !contact.avatar && (contact.name || contact.username || '?').charAt(0).toUpperCase()
                                    )}
                                </Avatar>
                                {!contact.isGroup && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            bottom: 1,
                                            right: 1,
                                            width: 11,
                                            height: 11,
                                            borderRadius: '50%',
                                            bgcolor: contact.status === 'online' ? '#2ecc71' : '#bdbdbd',
                                            border: '2px solid #fff',
                                        }}
                                    />
                                )}
                            </Box>

                            {/* Text content */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                                        {contact.isPinned && <BiPin size={13} color="#0068ff" style={{ flexShrink: 0 }} />}
                                        <Typography
                                            noWrap
                                            sx={{
                                                fontSize: '0.9rem',
                                                fontWeight: contact.unreadCount > 0 ? 700 : 500,
                                                color: '#081c36',
                                                lineHeight: 1.3,
                                            }}
                                        >
                                            {contact.isGroup ? contact.name : (contact.name || contact.username)}
                                        </Typography>
                                        {contact.isMuted && <BiBell size={13} color="#bdbdbd" style={{ flexShrink: 0 }} />}
                                    </Box>
                                    {/* Unread badge */}
                                    {contact.unreadCount > 0 && (
                                        <Box
                                            sx={{
                                                bgcolor: '#0068ff',
                                                color: 'white',
                                                borderRadius: 10,
                                                minWidth: 18,
                                                height: 18,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '0.6875rem',
                                                fontWeight: 700,
                                                px: 0.6,
                                                ml: 0.5,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                                        </Box>
                                    )}
                                </Box>
                                <Typography
                                    noWrap
                                    variant="caption"
                                    sx={{
                                        color: contact.unreadCount > 0 ? '#081c36' : '#7589a3',
                                        fontWeight: contact.unreadCount > 0 ? 500 : 400,
                                        fontSize: '0.8rem',
                                        display: 'block',
                                        lineHeight: 1.3,
                                    }}
                                >
                                    {contact.lastMessage && contact.lastMessage.trim()
                                        ? contact.lastMessage
                                        : 'Chưa có tin nhắn'}
                                </Typography>
                            </Box>
                        </ListItem>
                    ))}
                </List>
            )}

            <ProfileModal
                userId={userId}
                token={token}
                contacts={contacts}
                onContactSelect={onContactSelect}
            />
        </>
    );
};

export default ContactList;

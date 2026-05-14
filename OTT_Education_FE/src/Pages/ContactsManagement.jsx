import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    IconButton,
    Avatar,
} from '@mui/material';
import { BiArrowBack } from 'react-icons/bi';
import FriendsList from '../components/Home/FriendsList';
import ContactList from '../components/Home/ContactList';
import NavSidebar from '../components/Home/NavSidebar';
import {
    fetchFriendsList,
    fetchPendingFriendRequests,
    acceptFriendRequest,
} from '../api/user';
import {
    fetchUserGroups,
    fetchGroupInvites,
    acceptGroupInvite,
    rejectGroupInvite,
} from '../api/groupApi';

const ContactsManagement = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [currentView, setCurrentView] = useState('friends'); // friends, groups, friend-requests, group-invites
    const [contacts, setContacts] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [groupInvites, setGroupInvites] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Get initial view from navigation state
    useEffect(() => {
        if (location.state?.view) {
            setCurrentView(location.state.view);
        }
    }, [location.state]);

    // Fetch friends and groups
    useEffect(() => {
        const loadContacts = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem('accessToken');
                const userId = localStorage.getItem('userId');
                if (!token || !userId) return;

                // Fetch friends
                const friendsData = await fetchFriendsList();
                console.log(
                    '📋 Friends data in ContactsManagement:',
                    friendsData,
                );
                const friendsWithFlags = friendsData.map((friend) => {
                    const status =
                        friend.activeStatus?.toUpperCase() === 'ONLINE'
                            ? 'online'
                            : 'offline';
                    console.log(
                        `Friend ${friend.name}: activeStatus=${friend.activeStatus}, mapped status=${status}`,
                    );
                    return {
                        ...friend,
                        avatar:
                            friend.avatar ||
                            `https://i.pravatar.cc/150?img=${Math.floor(
                                Math.random() * 70,
                            )}`,
                        status: status,
                        lastMessage: '',
                        isGroup: false,
                    };
                });

                // Fetch groups
                const groupsData = await fetchUserGroups(userId, token);
                const groupsWithFlags = groupsData.map((group) => ({
                    ...group,
                    avatar:
                        group.avatarGroup ||
                        'https://th.bing.com/th/id/R.0fb6fad84621ac768796c2c228858678?rik=EZHn72rbvK8jkg&pid=ImgRaw&r=0',
                    lastMessage: '',
                    isGroup: true,
                }));

                setContacts([...friendsWithFlags, ...groupsWithFlags]);
            } catch (error) {
                console.error('Error loading contacts:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadContacts();
    }, []);

    // Fetch pending friend requests
    useEffect(() => {
        const loadPendingRequests = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                const requests = await fetchPendingFriendRequests();
                console.log('📩 Pending friend requests:', requests);
                console.log('📩 Number of requests:', requests?.length);
                if (requests && requests.length > 0) {
                    console.log(
                        '📩 First request structure:',
                        JSON.stringify(requests[0], null, 2),
                    );
                }
                if (requests) {
                    setPendingRequests(requests);
                }
            } catch (error) {
                console.error('Error loading pending requests:', error);
            }
        };

        loadPendingRequests();
        // Refresh every 30 seconds to get new requests
        const interval = setInterval(loadPendingRequests, 30000);
        return () => clearInterval(interval);
    }, []);

    // Fetch group invites
    useEffect(() => {
        const loadGroupInvites = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) return;

                const invites = await fetchGroupInvites(token);
                console.log('🎟️ Group invites:', invites);
                if (invites) {
                    setGroupInvites(invites);
                }
            } catch (error) {
                console.error('Error loading group invites:', error);
            }
        };

        loadGroupInvites();
        // Refresh every 30 seconds
        const interval = setInterval(loadGroupInvites, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleBackToHome = () => {
        navigate('/home');
    };

    const handleContactSelect = (contact) => {
        // Navigate back to home with contact id and type
        navigate('/home', {
            state: {
                selectedContactId: contact.id,
                selectedContactIsGroup: contact.isGroup,
            },
        });
    };

    const handleAcceptFriendRequest = async (requestId) => {
        try {
            await acceptFriendRequest(requestId);
            // Refresh the pending requests list
            const requests = await fetchPendingFriendRequests();
            if (requests) {
                setPendingRequests(requests);
            }
            // Refresh friends list as well
            const friendsData = await fetchFriendsList();
            if (friendsData) {
                const friendsWithFlags = friendsData.map((friend) => ({
                    ...friend,
                    avatar:
                        friend.avatar ||
                        `https://i.pravatar.cc/150?img=${Math.floor(
                            Math.random() * 70,
                        )}`,
                    status:
                        friend.activeStatus?.toUpperCase() === 'ONLINE'
                            ? 'online'
                            : 'offline',
                    lastMessage: '',
                    isGroup: false,
                }));
                const userId = localStorage.getItem('userId');
                const token = localStorage.getItem('accessToken');
                const groupsData = await fetchUserGroups(userId, token);
                const groupsWithFlags = groupsData.map((group) => ({
                    ...group,
                    avatar:
                        group.avatarGroup ||
                        'https://th.bing.com/th/id/R.0fb6fad84621ac768796c2c228858678?rik=EZHn72rbvK8jkg&pid=ImgRaw&r=0',
                    lastMessage: '',
                    isGroup: true,
                }));
                setContacts([...friendsWithFlags, ...groupsWithFlags]);
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    const refreshPendingRequests = async () => {
        try {
            const requests = await fetchPendingFriendRequests();
            if (requests) {
                setPendingRequests(requests);
            }
        } catch (error) {
            console.error('Error refreshing pending requests:', error);
        }
    };

    const handleAcceptGroupInvite = async (inviteId) => {
        try {
            const token = localStorage.getItem('accessToken');
            await acceptGroupInvite(inviteId, token);
            // Refresh group invites
            const invites = await fetchGroupInvites(token);
            if (invites) {
                setGroupInvites(invites);
            }
            // Refresh groups list
            const userId = localStorage.getItem('userId');
            const groupsData = await fetchUserGroups(userId, token);
            const friendsData = await fetchFriendsList();
            const friendsWithFlags = friendsData.map((friend) => ({
                ...friend,
                avatar:
                    friend.avatar ||
                    `https://i.pravatar.cc/150?img=${Math.floor(
                        Math.random() * 70,
                    )}`,
                status:
                    friend.activeStatus?.toUpperCase() === 'ONLINE'
                        ? 'online'
                        : 'offline',
                lastMessage: '',
                isGroup: false,
            }));
            const groupsWithFlags = groupsData.map((group) => ({
                ...group,
                avatar:
                    group.avatarGroup ||
                    'https://th.bing.com/th/id/R.0fb6fad84621ac768796c2c228858678?rik=EZHn72rbvK8jkg&pid=ImgRaw&r=0',
                lastMessage: '',
                isGroup: true,
            }));
            setContacts([...friendsWithFlags, ...groupsWithFlags]);
        } catch (error) {
            console.error('Error accepting group invite:', error);
        }
    };

    const handleRejectGroupInvite = async (inviteId) => {
        try {
            const token = localStorage.getItem('accessToken');
            await rejectGroupInvite(inviteId, token);
            // Refresh group invites
            const invites = await fetchGroupInvites(token);
            if (invites) {
                setGroupInvites(invites);
            }
        } catch (error) {
            console.error('Error rejecting group invite:', error);
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#fff' }}>
            {/* NavSidebar */}
            <NavSidebar
                currentView={currentView}
                setCurrentView={setCurrentView}
                user={null}
                unreadNotifications={pendingRequests.length}
                onAvatarClick={() => navigate('/home')}
            />

            {/* Left Sidebar - Menu List */}
            <Box
                sx={{
                    width: '350px',
                    borderRight: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#fff',
                }}
            >
                {/* Menu Items */}
                <List sx={{ p: 0, flex: 1 }}>
                    <ListItemButton
                        onClick={() => setCurrentView('friends')}
                        sx={{
                            py: 1.5,
                            px: 2.5,
                            backgroundColor:
                                currentView === 'friends'
                                    ? '#e7f3ff'
                                    : 'transparent',
                            borderLeft:
                                currentView === 'friends'
                                    ? '3px solid #0068ff'
                                    : '3px solid transparent',
                            '&:hover': {
                                backgroundColor:
                                    currentView === 'friends'
                                        ? '#e7f3ff'
                                        : '#f5f5f5',
                            },
                        }}
                    >
                        <ListItemText
                            primary="Danh sách bạn bè"
                            primaryTypographyProps={{
                                fontWeight:
                                    currentView === 'friends' ? 600 : 400,
                                color:
                                    currentView === 'friends'
                                        ? '#0068ff'
                                        : 'text.primary',
                                fontSize: '0.95rem',
                            }}
                        />
                    </ListItemButton>
                    <ListItemButton
                        onClick={() => setCurrentView('groups')}
                        sx={{
                            py: 1.5,
                            px: 2.5,
                            backgroundColor:
                                currentView === 'groups'
                                    ? '#e7f3ff'
                                    : 'transparent',
                            borderLeft:
                                currentView === 'groups'
                                    ? '3px solid #0068ff'
                                    : '3px solid transparent',
                            '&:hover': {
                                backgroundColor:
                                    currentView === 'groups'
                                        ? '#e7f3ff'
                                        : '#f5f5f5',
                            },
                        }}
                    >
                        <ListItemText
                            primary="Danh sách nhóm và cộng đồng"
                            primaryTypographyProps={{
                                fontWeight:
                                    currentView === 'groups' ? 600 : 400,
                                color:
                                    currentView === 'groups'
                                        ? '#0068ff'
                                        : 'text.primary',
                                fontSize: '0.95rem',
                            }}
                        />
                    </ListItemButton>
                    <ListItemButton
                        onClick={() => setCurrentView('friend-requests')}
                        sx={{
                            py: 1.5,
                            px: 2.5,
                            backgroundColor:
                                currentView === 'friend-requests'
                                    ? '#e7f3ff'
                                    : 'transparent',
                            borderLeft:
                                currentView === 'friend-requests'
                                    ? '3px solid #0068ff'
                                    : '3px solid transparent',
                            '&:hover': {
                                backgroundColor:
                                    currentView === 'friend-requests'
                                        ? '#e7f3ff'
                                        : '#f5f5f5',
                            },
                        }}
                    >
                        <ListItemText
                            primary="Lời mời kết bạn"
                            primaryTypographyProps={{
                                fontWeight:
                                    currentView === 'friend-requests'
                                        ? 600
                                        : 400,
                                color:
                                    currentView === 'friend-requests'
                                        ? '#0068ff'
                                        : 'text.primary',
                                fontSize: '0.95rem',
                            }}
                        />
                    </ListItemButton>
                    <ListItemButton
                        onClick={() => setCurrentView('group-invites')}
                        sx={{
                            py: 1.5,
                            px: 2.5,
                            backgroundColor:
                                currentView === 'group-invites'
                                    ? '#e7f3ff'
                                    : 'transparent',
                            borderLeft:
                                currentView === 'group-invites'
                                    ? '3px solid #0068ff'
                                    : '3px solid transparent',
                            '&:hover': {
                                backgroundColor:
                                    currentView === 'group-invites'
                                        ? '#e7f3ff'
                                        : '#f5f5f5',
                            },
                        }}
                    >
                        <ListItemText
                            primary="Lời mời vào nhóm và cộng đồng"
                            primaryTypographyProps={{
                                fontWeight:
                                    currentView === 'group-invites' ? 600 : 400,
                                color:
                                    currentView === 'group-invites'
                                        ? '#0068ff'
                                        : 'text.primary',
                                fontSize: '0.95rem',
                            }}
                        />
                    </ListItemButton>
                </List>
            </Box>

            {/* Right Content Area */}
            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header with back button */}
                <Box
                    sx={{
                        p: 2.5,
                        borderBottom: '1px solid #e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <IconButton
                        onClick={handleBackToHome}
                        sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}
                    >
                        <BiArrowBack size={24} />
                    </IconButton>
                    <Typography variant="h6" fontWeight={600}>
                        {currentView === 'friends' && 'Danh sách bạn bè'}
                        {currentView === 'groups' &&
                            'Danh sách nhóm và cộng đồng'}
                        {currentView === 'friend-requests' && 'Lời mời kết bạn'}
                        {currentView === 'group-invites' &&
                            'Lời mời vào nhóm và cộng đồng'}
                    </Typography>
                </Box>

                {/* Content */}
                {currentView === 'friends' && (
                    <FriendsList
                        contacts={contacts.filter((c) => !c.isGroup)}
                        onSelectContact={handleContactSelect}
                        onOpenUserSearch={() => {}}
                        onStartCall={() => {}}
                        hideHeader={false}
                    />
                )}
                {currentView === 'groups' && (
                    <Box sx={{ p: 3, overflow: 'auto' }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                        >
                            {contacts.filter((c) => c.isGroup).length} nhóm
                        </Typography>
                        <ContactList
                            contacts={contacts.filter((c) => c.isGroup)}
                            selectedContact={null}
                            onContactSelect={handleContactSelect}
                            pendingRequests={[]}
                            onAcceptFriendRequest={() => {}}
                            isLoading={isLoading}
                            fetchPendingFriendRequests={() => {}}
                        />
                    </Box>
                )}
                {currentView === 'friend-requests' && (
                    <Box sx={{ p: 3, overflow: 'auto' }}>
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 2 }}
                        >
                            {pendingRequests?.length || 0} lời mời
                        </Typography>
                        <ContactList
                            contacts={[]}
                            selectedContact={null}
                            onContactSelect={handleContactSelect}
                            pendingRequests={pendingRequests}
                            onAcceptFriendRequest={handleAcceptFriendRequest}
                            isLoading={isLoading}
                            fetchPendingFriendRequests={refreshPendingRequests}
                        />
                    </Box>
                )}
                {currentView === 'group-invites' && (
                    <Box sx={{ p: 3, overflow: 'auto' }}>
                        {groupInvites && groupInvites.length > 0 ? (
                            <>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 2 }}
                                >
                                    {groupInvites.length} lời mời
                                </Typography>
                                <List>
                                    {groupInvites.map((invite) => (
                                        <ListItem
                                            key={invite.id || invite.inviteId}
                                            sx={{
                                                py: 2,
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                borderBottom:
                                                    '1px solid #e0e0e0',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    width: '100%',
                                                    alignItems: 'center',
                                                    mb: 1,
                                                }}
                                            >
                                                <Avatar
                                                    src={
                                                        invite.groupAvatar ||
                                                        'https://th.bing.com/th/id/R.0fb6fad84621ac768796c2c228858678?rik=EZHn72rbvK8jkg&pid=ImgRaw&r=0'
                                                    }
                                                    sx={{
                                                        width: 56,
                                                        height: 56,
                                                        mr: 2,
                                                    }}
                                                />
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography
                                                        variant="h6"
                                                        sx={{
                                                            fontSize: '1.1rem',
                                                        }}
                                                    >
                                                        {invite.groupName ||
                                                            'Nhóm'}
                                                    </Typography>
                                                    <Typography
                                                        variant="body2"
                                                        color="text.secondary"
                                                    >
                                                        {invite.inviterName ||
                                                            'Người dùng'}{' '}
                                                        đã mời bạn vào nhóm
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    gap: 1,
                                                    ml: 8,
                                                }}
                                            >
                                                <IconButton
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    onClick={() =>
                                                        handleAcceptGroupInvite(
                                                            invite.id ||
                                                                invite.inviteId,
                                                        )
                                                    }
                                                    disabled={isLoading}
                                                    sx={{
                                                        fontSize: '0.8rem',
                                                        py: 0.5,
                                                        px: 2,
                                                        backgroundColor:
                                                            '#0068ff',
                                                        color: '#fff',
                                                        '&:hover': {
                                                            backgroundColor:
                                                                '#0056d2',
                                                        },
                                                    }}
                                                >
                                                    Chấp nhận
                                                </IconButton>
                                                <IconButton
                                                    variant="contained"
                                                    color="error"
                                                    size="small"
                                                    onClick={() =>
                                                        handleRejectGroupInvite(
                                                            invite.id ||
                                                                invite.inviteId,
                                                        )
                                                    }
                                                    disabled={isLoading}
                                                    sx={{
                                                        fontSize: '0.8rem',
                                                        py: 0.5,
                                                        px: 2,
                                                        backgroundColor:
                                                            '#f44336',
                                                        color: '#fff',
                                                        '&:hover': {
                                                            backgroundColor:
                                                                '#d32f2f',
                                                        },
                                                    }}
                                                >
                                                    Từ chối
                                                </IconButton>
                                            </Box>
                                        </ListItem>
                                    ))}
                                </List>
                            </>
                        ) : (
                            <Box sx={{ p: 8, textAlign: 'center' }}>
                                <Typography
                                    variant="h6"
                                    color="text.secondary"
                                    sx={{ mb: 1 }}
                                >
                                    Chưa có lời mời nào
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    Các lời mời tham gia nhóm sẽ xuất hiện ở đây
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ContactsManagement;

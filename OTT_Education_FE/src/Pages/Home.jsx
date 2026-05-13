import React, {
    useState,
    useEffect,
    useCallback,
    useMemo,
    Component,
} from 'react';
import { ThemeProvider, styled } from '@mui/material/styles';
import {
    CssBaseline,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Checkbox,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
} from '@mui/material';
import {
    Box,
    Typography,
    IconButton,
    Menu,
    MenuItem,
    Snackbar,
    Alert,
    InputBase,
} from '@mui/material';
import {
    BiUserPlus,
    BiGroup,
    BiDotsVerticalRounded,
    BiSearch,
    BiMenu,
    BiArrowBack,
} from 'react-icons/bi';
import { useNavigate, useLocation } from 'react-router-dom';
import NavSidebar from '../components/Home/NavSidebar';
import ContactList from '../components/Home/ContactList';
import FriendsList from '../components/Home/FriendsList';
import SettingsPanel from '../components/Home/SettingsPanel';
import StatisticsPanel from '../components/Home/StatisticsPanel';
import NotificationsPanel from '../components/Home/NotificationsPanel';
import ChatWindow from '../components/Home/ChatWindow';
import ProfileModal from '../components/Home/ProfileModal';
import UserSearchModal from '../components/Home/UserSearchModal';
import IncomingCallModal from '../components/Home/IncomingCallModal';
import VideoCallModal from '../components/Home/VideoCallModal';
import PermissionGuideModal from '../components/Home/PermissionGuideModal';
import {
    fetchUserProfile,
    fetchFriendsList,
    sendFriendRequest,
    fetchPendingFriendRequests,
    acceptFriendRequest,
    cancelFriendRequest,
    fetchUserByPhone,
} from '../api/user';
import {
    getChatHistory,
    getGroupChatHistory,
    connectWebSocket,
    disconnectWebSocket,
    sendCallSignal,
} from '../api/messageApi';
import { createGroup, fetchUserGroups } from '../api/groupApi';
import { ottEducationTheme } from '../theme/theme';
import {
    initializePeerConnection,
    startCall,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    endCall,
    toggleAudio,
    toggleVideo,
} from '../services/webrtcService';
import { playNotificationSound } from '../utils/notificationSound';
import {
    requestNotificationPermission,
    showNotificationIfHidden,
} from '../utils/browserNotification';

// Error Boundary Component
class ErrorBoundary extends Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught in ErrorBoundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box p={3} textAlign="center">
                    <Typography variant="h6" color="error">
                        Đã xảy ra lỗi:{' '}
                        {this.state.error?.message || 'Không xác định'}
                    </Typography>
                    <Typography variant="body1">
                        Vui lòng làm mới trang hoặc liên hệ hỗ trợ.
                    </Typography>
                </Box>
            );
        }
        return this.props.children;
    }
}

const RootContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    height: '100vh',
    overflow: 'hidden',
}));

const SidebarContainer = styled(Box)(() => ({
    width: 340,
    minWidth: 340,
    borderRight: '1px solid #e8ecf0',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
}));

const HeaderContainer = styled(Box)(() => ({
    backgroundColor: '#ffffff',
    padding: '10px 12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #e8ecf0',
    minHeight: 56,
}));

const Home = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        token: navToken,
        userId: navUserId,
        selectedContactId,
        selectedContactIsGroup,
    } = location.state || {};
    const [userId, setUserId] = useState(
        navUserId ||
        localStorage.getItem('userId') ||
        '680e6d95a73e35151128bf65',
    );
    const [token, setToken] = useState(
        navToken || localStorage.getItem('accessToken'),
    );
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState('');
    const [currentView, setCurrentView] = useState('messages');
    const [anchorEl, setAnchorEl] = useState(null);
    const [profileOpen, setProfileOpen] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [contacts, setContacts] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [showAddFriendInput, setShowAddFriendInput] = useState(false);
    const [friendPhoneInput, setFriendPhoneInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [createGroupOpen, setCreateGroupOpen] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [userSearchOpen, setUserSearchOpen] = useState(false);
    const [openChangePasswordModal, setOpenChangePasswordModal] =
        useState(false);
    const [groupAvatar, setGroupAvatar] = useState(null);
    const [headerSearchQuery, setHeaderSearchQuery] = useState('');
    const [messageTab, setMessageTab] = useState('all'); // 'all', 'unread', 'stranger'
    const [contactView, setContactView] = useState('all'); // 'all', 'friends', 'groups', 'friend-requests', 'group-invites'
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [sentFriendRequests, setSentFriendRequests] = useState(new Set()); // Track sent friend requests by user ID

    // Incoming call states
    const [incomingCall, setIncomingCall] = useState(null);
    const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);

    // Active call states
    const [activeCall, setActiveCall] = useState(null);
    const [callModalOpen, setCallModalOpen] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [callStatus, setCallStatus] = useState('');
    const [showPermissionGuide, setShowPermissionGuide] = useState(false);
    const [pendingCallAction, setPendingCallAction] = useState(null);

    // Đồng bộ token với localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem('accessToken');
        if (storedToken !== token) {
            setToken(storedToken);
        }
    }, [token]);

    // Handle Settings View
    useEffect(() => {
        if (currentView === 'settings') {
            setOpenChangePasswordModal(true);
        }
    }, [currentView]);

    // Auto-select contact from navigation state
    useEffect(() => {
        if (
            selectedContactId &&
            contacts.length > 0 &&
            (!selectedContact || selectedContact.id !== selectedContactId)
        ) {
            const contact = contacts.find((c) => c.id === selectedContactId);
            if (contact) {
                setSelectedContact(contact);
            }
        }
    }, [selectedContactId, contacts.length]);

    // Keep selectedContact in sync with contacts state (for realtime updates like status, online/offline)
    useEffect(() => {
        if (selectedContact) {
            const updatedContact = contacts.find((c) => c.id === selectedContact.id);
            // Only update if status or lastSeen changed to avoid infinite loop
            // caused by other updates to contacts (like unreadCount reset)
            if (updatedContact && (
                updatedContact.status !== selectedContact.status ||
                updatedContact.lastSeen !== selectedContact.lastSeen
            )) {
                console.log('Syncing selectedContact status:', updatedContact.status);
                setSelectedContact(prev => ({
                    ...prev,
                    status: updatedContact.status,
                    lastSeen: updatedContact.lastSeen,
                    avatar: updatedContact.avatar // Also sync avatar in case it changes
                }));
            }
        }
    }, [contacts, selectedContact]);

    // Kiểm tra token và chuyển hướng ngay lập tức nếu không có token
    useEffect(() => {
        if (!token) {
            setSnackbarMessage('Vui lòng đăng nhập để sử dụng chức năng!');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            navigate('/'); // Chuyển hướng ngay lập tức về trang đăng nhập
            return;
        }

        let isMounted = true;

        const handleFriendRequest = async (notification) => {
            if (!isMounted) return;
            console.log('Received friend request notification:', notification);
            if (notification.type === 'accepted') {
                // Thông báo cho người gửi (A)
                await updateFriendsList(); // Làm mới danh sách bạn bè
                setSnackbarMessage(
                    'Yêu cầu kết bạn của bạn đã được chấp nhận!',
                );
                setSnackbarSeverity('success');
            } else if (notification.type === 'confirmed') {
                // Thông báo cho người nhận (B)
                await updatePendingRequests(); // Làm mới danh sách yêu cầu
                setSnackbarMessage('Bạn đã chấp nhận một yêu cầu kết bạn!');
                setSnackbarSeverity('success');
            } else {
                // Yêu cầu kết bạn mới
                await updatePendingRequests();
                setSnackbarMessage('Bạn nhận được một yêu cầu kết bạn mới!');
                setSnackbarSeverity('info');
            }
            setOpenSnackbar(true);
        };

        updateGroups().then((groupIds) => {
            if (!isMounted) return;

            connectWebSocket(
                token,
                userId,
                (receivedMessage) => {
                    if (!isMounted) return;
                    console.log('Received message in Home:', receivedMessage);
                    setMessages((prev) => {
                        const messageExistsById = prev.some(
                            (msg) => msg.id === receivedMessage.id,
                        );
                        if (messageExistsById) {
                            return prev;
                        }

                        const messageExistsByContent = prev.find(
                            (msg) =>
                                msg.tempKey &&
                                msg.content === receivedMessage.content &&
                                msg.senderId === receivedMessage.senderId &&
                                (msg.receiverId ===
                                    receivedMessage.receiverId ||
                                    msg.groupId === receivedMessage.groupId),
                        );
                        if (messageExistsByContent) {
                            return prev.map((msg) =>
                                msg.tempKey === messageExistsByContent.tempKey
                                    ? { ...receivedMessage, tempKey: undefined }
                                    : msg,
                            );
                        }

                        const deletedMessageIds = JSON.parse(
                            localStorage.getItem('deletedMessageIds') || '[]',
                        );
                        if (deletedMessageIds.includes(receivedMessage.id)) {
                            return prev;
                        }

                        let createAt =
                            receivedMessage.createdAt ||
                            receivedMessage.createAt;
                        let parsedDate = new Date(createAt);
                        if (isNaN(parsedDate.getTime())) {
                            console.warn(
                                'Invalid createAt value:',
                                createAt,
                                'Using current time as fallback',
                            );
                            parsedDate = new Date();
                        } else if (
                            typeof createAt === 'string' &&
                            !createAt.endsWith('Z') &&
                            !createAt.includes('+')
                        ) {
                            createAt = `${createAt}Z`;
                            parsedDate = new Date(createAt);
                        }

                        return [
                            ...prev,
                            {
                                ...receivedMessage,
                                createAt: parsedDate.toISOString(),
                                recalled: receivedMessage.recalled || false,
                                deletedByUsers:
                                    receivedMessage.deletedByUsers || [],
                                isRead: receivedMessage.isRead || false,
                                // Coerce to real boolean to avoid truthy strings like "false"
                                // Không auto-pin tin nhắn mới đến; chỉ pin khi có thông báo pin/unpin riêng
                                isPinned: false,
                                isEdited: receivedMessage.isEdited || false,
                            },
                        ];
                    });

                    // Cập nhật contact list khi nhận tin nhắn mới
                    if (!isMounted) return;
                    const contactId =
                        receivedMessage.groupId ||
                        (receivedMessage.receiverId === userId
                            ? receivedMessage.senderId
                            : receivedMessage.receiverId);

                    // Play notification sound and show browser notification
                    const isSentByMe = receivedMessage.senderId === userId;
                    const isCurrentlyViewing =
                        selectedContact?.id === contactId;

                    if (!isSentByMe) {
                        // Play sound
                        playNotificationSound();

                        // Show browser notification if tab is not active
                        const senderName =
                            contacts.find(
                                (c) => c.id === receivedMessage.senderId,
                            )?.name || 'Người dùng';
                        const messagePreview =
                            receivedMessage.type === 'TEXT'
                                ? receivedMessage.content
                                : receivedMessage.type === 'IMAGE'
                                    ? '📷 Hình ảnh'
                                    : receivedMessage.type === 'VIDEO'
                                        ? '🎥 Video'
                                        : receivedMessage.type === 'FILE'
                                            ? '📎 Tệp đính kèm'
                                            : '💬 Tin nhắn mới';

                        showNotificationIfHidden(senderName, {
                            body: messagePreview,
                            icon: contacts.find(
                                (c) => c.id === receivedMessage.senderId,
                            )?.avatar,
                            onClick: () => {
                                window.focus();
                                // TODO: Focus on the contact/conversation
                            },
                        });
                    }

                    setContacts((prevContacts) =>
                        prevContacts.map((contact) => {
                            if (contact.id === contactId) {
                                // Chỉ tăng unreadCount nếu KHÔNG phải mình gửi và không đang xem
                                return {
                                    ...contact,
                                    lastMessage:
                                        receivedMessage.type === 'TEXT'
                                            ? receivedMessage.content
                                            : receivedMessage.type === 'IMAGE'
                                                ? '[Hình ảnh]'
                                                : receivedMessage.type === 'VIDEO'
                                                    ? '[Video]'
                                                    : receivedMessage.type ===
                                                        'AUDIO'
                                                        ? '[Âm thanh]'
                                                        : receivedMessage.type ===
                                                            'FILE'
                                                            ? `[File: ${receivedMessage.fileName ||
                                                            'Tài liệu'
                                                            }]`
                                                            : '[Tin nhắn]',
                                    timestamp: new Date().toISOString(),
                                    unreadCount:
                                        isSentByMe || isCurrentlyViewing
                                            ? 0
                                            : (contact.unreadCount || 0) + 1,
                                };
                            }
                            return contact;
                        }),
                    );
                },
                (deletedMessage) => {
                    if (!isMounted) return;
                    console.log(
                        'Received delete notification:',
                        deletedMessage,
                    );
                    if (deletedMessage.id) {
                        const deletedMessageIds = JSON.parse(
                            localStorage.getItem('deletedMessageIds') || '[]',
                        );
                        if (!deletedMessageIds.includes(deletedMessage.id)) {
                            deletedMessageIds.push(deletedMessage.id);
                            localStorage.setItem(
                                'deletedMessageIds',
                                JSON.stringify(deletedMessageIds),
                            );
                        }
                    }
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === deletedMessage.id
                                ? {
                                    ...msg,
                                    deletedByUsers:
                                        deletedMessage.deletedByUsers || [],
                                }
                                : msg,
                        ),
                    );
                },
                (recalledMessage) => {
                    if (!isMounted) return;
                    console.log(
                        'Received recall notification:',
                        recalledMessage,
                    );
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === recalledMessage.id
                                ? {
                                    ...msg,
                                    recalled:
                                        recalledMessage.recalled || false,
                                }
                                : msg,
                        ),
                    );
                },
                (pinnedMessage) => {
                    if (!isMounted) return;
                    console.log('Received pin notification:', pinnedMessage);
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === pinnedMessage.id
                                ? { ...msg, isPinned: true }
                                : msg,
                        ),
                    );
                },
                (unpinnedMessage) => {
                    if (!isMounted) return;
                    console.log(
                        'Received unpin notification:',
                        unpinnedMessage,
                    );
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === unpinnedMessage.id
                                ? { ...msg, isPinned: false }
                                : msg,
                        ),
                    );
                },
                groupIds,
                handleFriendRequest,
                (editedMessage) => {
                    if (!isMounted) return;
                    console.log('Received edit notification:', editedMessage);

                    // Update message content
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === editedMessage.id
                                ? {
                                    ...msg,
                                    content: editedMessage.content,
                                    isEdited: true,
                                }
                                : msg,
                        ),
                    );

                    // Update lastMessage in contact list if it's the most recent message
                    const contactId =
                        editedMessage.groupId ||
                        (editedMessage.receiverId === userId
                            ? editedMessage.senderId
                            : editedMessage.receiverId);

                    setContacts((prevContacts) =>
                        prevContacts.map((contact) => {
                            if (contact.id === contactId) {
                                // Only update if this is likely the last message
                                // (we can check by comparing IDs or timestamps if needed)
                                return {
                                    ...contact,
                                    lastMessage:
                                        editedMessage.type === 'TEXT'
                                            ? editedMessage.content
                                            : contact.lastMessage,
                                };
                            }
                            return contact;
                        }),
                    );
                },
                (statusChange) => {
                    if (!isMounted) return;
                    console.log(
                        '🔔 Received status change notification:',
                        statusChange,
                    );
                    // statusChange có dạng: { userId: 'xxx', status: 'online' hoặc 'offline' }
                    setContacts((prevContacts) => {
                        const updatedContacts = prevContacts.map((contact) => {
                            if (contact.id === statusChange.userId) {
                                console.log(
                                    `✅ Updating ${contact.name} status: ${contact.status} -> ${statusChange.status}`,
                                );
                                return {
                                    ...contact,
                                    status: statusChange.status,
                                };
                            }
                            return contact;
                        });
                        return updatedContacts;
                    });
                },
                (callSignal) => {
                    if (!isMounted) return;
                    console.log('Received call signal:', callSignal);

                    // Handle different call signal types
                    switch (callSignal.type) {
                        case 'offer':
                            // Incoming call
                            const caller = contacts.find(
                                (c) => c.id === callSignal.senderId,
                            );
                            setIncomingCall({
                                ...callSignal,
                                caller: caller || {
                                    id: callSignal.senderId,
                                    name: 'Unknown',
                                },
                            });
                            setShowIncomingCallModal(true);
                            break;

                        case 'answer':
                            // Peer accepted call
                            if (activeCall) {
                                setRemoteDescription(callSignal.data.answer)
                                    .then(() => setCallStatus('Đã kết nối'))
                                    .catch((err) =>
                                        console.error(
                                            'Error setting remote description:',
                                            err,
                                        ),
                                    );
                            }
                            break;

                        case 'ice-candidate':
                            // Add ICE candidate
                            if (activeCall || callModalOpen) {
                                addIceCandidate(callSignal.data).catch((err) =>
                                    console.error(
                                        'Error adding ICE candidate:',
                                        err,
                                    ),
                                );
                            }
                            break;

                        case 'call-end':
                            // Peer ended call
                            handleEndCall();
                            setSnackbarMessage('Cuộc gọi đã kết thúc');
                            setSnackbarSeverity('info');
                            setOpenSnackbar(true);
                            break;

                        case 'call-reject':
                            // Peer rejected call
                            handleEndCall();
                            setSnackbarMessage('Cuộc gọi bị từ chối');
                            setSnackbarSeverity('warning');
                            setOpenSnackbar(true);
                            break;

                        default:
                            console.warn(
                                'Unknown call signal type:',
                                callSignal.type,
                            );
                    }
                },
                (readReceipt) => {
                    if (!isMounted) return;
                    console.log('✅ Read receipt received:', readReceipt);
                    // Cập nhật trạng thái isRead cho tin nhắn
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === readReceipt.id
                                ? { ...msg, isRead: true }
                                : msg,
                        ),
                    );
                },
            )
                .then(() => {
                    if (!isMounted) return;
                    console.log('STOMP connected in Home');
                })
                .catch((error) => {
                    if (!isMounted) return;
                    console.error('Failed to connect STOMP in Home:', error);
                    setSnackbarMessage(
                        `Không thể kết nối WebSocket: ${error.message}`,
                    );
                    setSnackbarSeverity('error');
                    setOpenSnackbar(true);
                });
        });

        return () => {
            isMounted = false;
            disconnectWebSocket();
        };
    }, [token, userId, navigate]);

    useEffect(() => {
        console.log('Home mounted with userId:', userId);
        if (profileOpen) {
            fetchUserProfile(token).then((data) => {
                if (data) {
                    setUserProfile(data);
                }
            });
        }

        // Request notification permission
        requestNotificationPermission().then((permission) => {
            console.log('Notification permission:', permission);
        });

        return () => {
            console.log('Home unmounting');
        };
    }, [profileOpen, token]);

    const updateGroups = useCallback(async () => {
        if (!token) return [];
        try {
            const groups = await fetchUserGroups(userId, token);
            const groupContacts = await Promise.all(
                groups.map(async (group) => {
                    // Lấy tin nhắn cuối từ group chat history
                    let lastMessage = group.lastMessage || '';
                    try {
                        const chatHistory = await getGroupChatHistory(
                            group.id,
                            token,
                        );
                        if (chatHistory && chatHistory.length > 0) {
                            const lastMsg = chatHistory[chatHistory.length - 1];
                            if (lastMsg.type === 'TEXT') {
                                lastMessage = lastMsg.content;
                            } else if (lastMsg.type === 'IMAGE') {
                                lastMessage = '[Hình ảnh]';
                            } else if (lastMsg.type === 'VIDEO') {
                                lastMessage = '[Video]';
                            } else if (lastMsg.type === 'FILE') {
                                lastMessage = '[File]';
                            }
                        }
                    } catch (err) {
                        console.error(
                            'Error loading last message for group',
                            group.name,
                            err,
                        );
                    }

                    return {
                        id: group.id,
                        name: group.name,
                        isGroup: true,
                        avatar:
                            group.avatarGroup ||
                            'https://th.bing.com/th/id/R.0fb6fad84621ac768796c2c228858678?rik=EZHn72rbvK8jkg&pid=ImgRaw&r=0',
                        status: 'group',
                        lastMessage: lastMessage,
                        timestamp: group.timestamp || 'Yesterday',
                    };
                }),
            );
            setContacts((prev) => [
                ...prev.filter((c) => !c.isGroup),
                ...groupContacts,
            ]);
            const groupIds = groups.map((group) => group.id).filter((id) => id);
            console.log('Group IDs for subscription:', groupIds);
            return groupIds;
        } catch (error) {
            setSnackbarMessage(
                'Lỗi tải danh sách nhóm: ' +
                (error.response?.data?.message || error.message),
            );
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return [];
        }
    }, [userId, token]);

    const updateFriendsList = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await fetchFriendsList(token);
            console.log('📋 Friends list data from API:', data);
            if (data) {
                const mappedFriends = await Promise.all(
                    data.map(async (friend) => {
                        // Map ONLINE -> online, OFFLINE -> offline
                        const status =
                            friend.activeStatus?.toUpperCase() === 'ONLINE'
                                ? 'online'
                                : 'offline';

                        // Lấy tin nhắn cuối từ chat history
                        let lastMessage = friend.lastMessage || '';
                        try {
                            const chatHistory = await getChatHistory(
                                friend.id,
                                token,
                            );
                            if (chatHistory && chatHistory.length > 0) {
                                const lastMsg =
                                    chatHistory[chatHistory.length - 1];
                                if (lastMsg.type === 'TEXT') {
                                    lastMessage = lastMsg.content;
                                } else if (lastMsg.type === 'IMAGE') {
                                    lastMessage = '[Hình ảnh]';
                                } else if (lastMsg.type === 'VIDEO') {
                                    lastMessage = '[Video]';
                                } else if (lastMsg.type === 'FILE') {
                                    lastMessage = '[File]';
                                }
                            }
                        } catch (err) {
                            console.error(
                                'Error loading last message for',
                                friend.name,
                                err,
                            );
                        }

                        return {
                            id: friend.id,
                            name: friend.name,
                            username: friend.name,
                            avatar:
                                friend.avatar ||
                                `https://i.pravatar.cc/150?img=${Math.floor(
                                    Math.random() * 70,
                                )}`,
                            status: status,
                            isFriend: true,
                            lastSeen: friend.lastSeen || friend.lastSeenAt,
                            lastMessage: lastMessage,
                            unreadCount: friend.unreadCount || 0,
                            timestamp: friend.timestamp || 'Yesterday',
                        };
                    }),
                );

                console.log('✅ Mapped friends with status:', mappedFriends);

                setContacts((prev) => [
                    ...prev.filter((c) => c.isGroup),
                    ...mappedFriends,
                ]);
            } else {
                setSnackbarMessage('Không thể tải danh sách bạn bè!');
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            }
        } catch (error) {
            setSnackbarMessage(
                'Lỗi tải danh sách bạn bè: ' +
                (error.response?.data?.message || error.message),
            );
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const updatePendingRequests = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const data = await fetchPendingFriendRequests(token);
            if (data) {
                console.log('Pending friend requests data:', data); // Debug log
                setPendingRequests(
                    data.map((request) => {
                        // Log từng request để debug
                        console.log('Processing request:', request);

                        // Thử nhiều cách lấy tên
                        const name =
                            request.name ||
                            request.senderName ||
                            request.sender?.name ||
                            `${request.firstName || ''} ${request.lastName || ''
                                }`.trim() ||
                            `${request.sender?.firstName || ''} ${request.sender?.lastName || ''
                                }`.trim() ||
                            request.username ||
                            request.sender?.username ||
                            'Người dùng';

                        // Thử nhiều cách lấy avatar
                        const avatar =
                            request.avatar ||
                            request.senderAvatar ||
                            request.sender?.avatar ||
                            request.avatarUrl ||
                            request.sender?.avatarUrl ||
                            `https://i.pravatar.cc/150?img=${Math.floor(
                                Math.random() * 70,
                            )}`;

                        return {
                            id: request.senderId || request.sender?.id,
                            requestId: request.id,
                            name: name,
                            avatar: avatar,
                        };
                    }),
                );
            } else {
                setSnackbarMessage('Không thể tải danh sách lời mời!');
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            }
        } catch (error) {
            setSnackbarMessage(
                'Lỗi tải danh sách lời mời: ' +
                (error.response?.data?.message || error.message),
            );
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (currentView === 'contacts' || currentView === 'messages') {
            updateFriendsList();
            updatePendingRequests();
        }
    }, [currentView, updateFriendsList, updatePendingRequests]);

    useEffect(() => {
        if (!selectedContact || !token || !selectedContact.id) return;

        // Reset unreadCount khi chọn contact
        setContacts((prevContacts) =>
            prevContacts.map((contact) =>
                contact.id === selectedContact.id
                    ? { ...contact, unreadCount: 0 }
                    : contact,
            ),
        );

        const loadChatHistory = async () => {
            try {
                let chatHistory;
                if (selectedContact.isGroup) {
                    chatHistory = await getGroupChatHistory(
                        selectedContact.id,
                        token,
                    );
                } else {
                    chatHistory = await getChatHistory(
                        selectedContact.id,
                        token,
                    );
                }
                console.log('Chat history loaded:', chatHistory);
                const uniqueMessages = chatHistory.reduce((acc, msg) => {
                    if (!acc.some((item) => item.id === msg.id)) {
                        let createAt = msg.createAt || msg.createdAt;
                        let parsedDate = new Date(createAt);
                        if (isNaN(parsedDate.getTime())) {
                            console.warn(
                                'Invalid createAt value in chat history:',
                                createAt,
                                'Using current time as fallback',
                            );
                            parsedDate = new Date();
                        } else if (
                            typeof createAt === 'string' &&
                            !createAt.endsWith('Z') &&
                            !createAt.includes('+')
                        ) {
                            createAt = `${createAt}Z`;
                            parsedDate = new Date(createAt);
                        }
                        acc.push({
                            id: msg.id,
                            senderId: msg.senderId,
                            receiverId: msg.receiverId,
                            groupId: msg.groupId,
                            content: msg.content,
                            type: msg.type,
                            createAt: parsedDate.toISOString(),
                            recalled: msg.recalled || false,
                            deletedByUsers: msg.deletedByUsers || [],
                            isRead: msg.isRead || false,
                            // Coerce to boolean to avoid string "false" being truthy
                            isPinned: msg.isPinned === true,
                            isEdited: msg.isEdited || false,
                        });
                    }
                    return acc;
                }, []);
                setMessages(uniqueMessages);
            } catch (error) {
                setSnackbarMessage(
                    'Lỗi tải lịch sử tin nhắn: ' +
                    (error.response?.data?.message || error.message),
                );
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            }
        };
        loadChatHistory();
    }, [selectedContact, token]);

    const handleSendMessage = useCallback(
        (message) => {
            console.log('Sending message:', message);
            setMessages((prev) => {
                if (!message.content && !message.type) {
                    return prev.map((msg) =>
                        msg.id === message.id ? { ...msg, ...message } : msg,
                    );
                }

                const deletedMessageIds = JSON.parse(
                    localStorage.getItem('deletedMessageIds') || '[]',
                );
                if (message.id && deletedMessageIds.includes(message.id)) {
                    return prev;
                }

                return [...prev, message];
            });

            // Cập nhật lastMessage trong contact list
            const contactId =
                message.groupId ||
                (message.receiverId === userId
                    ? message.senderId
                    : message.receiverId);
            setContacts((prevContacts) =>
                prevContacts.map((contact) => {
                    if (contact.id === contactId) {
                        return {
                            ...contact,
                            lastMessage:
                                message.type === 'TEXT'
                                    ? message.content
                                    : message.type === 'IMAGE'
                                        ? '[Hình ảnh]'
                                        : message.type === 'VIDEO'
                                            ? '[Video]'
                                            : message.type === 'AUDIO'
                                                ? '[Âm thanh]'
                                                : '[File]',
                            timestamp: new Date().toISOString(),
                        };
                    }
                    return contact;
                }),
            );
        },
        [userId],
    );

    const handleProfileOpen = useCallback((user) => {
        setSelectedProfile(user);
        setProfileOpen(true);
    }, []);

    const handleProfileClose = useCallback(() => {
        setProfileOpen(false);
        setSelectedProfile(null);
    }, []);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // Search for users when typing in search bar
    useEffect(() => {
        const searchUsers = async () => {
            if (!headerSearchQuery.trim()) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            // Kiểm tra xem có phải tìm số điện thoại không (chỉ chứa số)
            const isPhoneSearch = /^\d+$/.test(headerSearchQuery.trim());

            if (!isPhoneSearch) {
                // Nếu là tìm tin nhắn (chứa chữ), không gọi API, chỉ lọc contacts
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            // Kiểm tra độ dài số điện thoại (phải đủ 10 số)
            const phoneNumber = headerSearchQuery.trim();
            if (phoneNumber.length < 10) {
                // Chưa đủ 10 số, không search
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            // Chỉ tìm người dùng mới nếu nhập số điện thoại đủ 10 số
            setIsSearching(true);
            try {
                // Tìm người dùng mới bằng số điện thoại
                const userData = await fetchUserByPhone(
                    headerSearchQuery.trim(),
                );

                // Kiểm tra userData có hợp lệ không (phải có id)
                if (userData && userData.id) {
                    // Kiểm tra xem đã là bạn bè chưa
                    const isFriend = contacts.some((c) => c.id === userData.id);
                    // Kiểm tra xem đã gửi lời mời chưa
                    const hasSentRequest = sentFriendRequests.has(userData.id);
                    const fullName =
                        userData.name ||
                        `${userData.firstName || ''} ${userData.lastName || ''
                            }`.trim() ||
                        userData.username ||
                        userData.phone;

                    setSearchResults([
                        {
                            id: userData.id,
                            name: fullName,
                            phone: userData.phone,
                            avatar:
                                userData.avatar ||
                                'https://i.pravatar.cc/150?img=' +
                                Math.floor(Math.random() * 70),
                            friendStatus: isFriend
                                ? 'FRIEND'
                                : hasSentRequest
                                    ? 'PENDING'
                                    : userData.friendStatus || 'NONE',
                            isSearchResult: true,
                        },
                    ]);
                } else {
                    setSearchResults([]);
                }
            } catch (error) {
                console.error('Error searching users:', error);
                setSearchResults([]);
            }
            setIsSearching(false);
        };

        const timeoutId = setTimeout(searchUsers, 500); // Debounce 500ms
        return () => clearTimeout(timeoutId);
    }, [headerSearchQuery, contacts, sentFriendRequests]);

    // Call handlers
    const handleAcceptCall = async () => {
        if (!incomingCall) return;

        try {
            setShowIncomingCallModal(false);
            setCallStatus('Đang kết nối...');
            setCallModalOpen(true);
            setActiveCall({
                ...incomingCall,
                isVideoCall: incomingCall.data?.isVideoCall || false,
            });

            // Initialize peer connection
            initializePeerConnection(
                (candidate) => {
                    sendCallSignal(
                        'ice-candidate',
                        candidate,
                        incomingCall.senderId,
                        token,
                    );
                },
                (stream) => {
                    setRemoteStream(stream);
                    setCallStatus('Đã kết nối');
                },
            );

            // Get local media
            const stream = await startCall(
                incomingCall.data?.isVideoCall || false,
            );
            setLocalStream(stream);

            // Set remote offer and create answer
            await setRemoteDescription(incomingCall.data.offer);
            const answer = await createAnswer();
            sendCallSignal('answer', { answer }, incomingCall.senderId, token);

            setCallStatus('Đã kết nối');
            setIncomingCall(null);
        } catch (error) {
            console.error('Error accepting call:', error);

            // Check if it's a permission error
            if (error.message.includes('quyền truy cập')) {
                setShowPermissionGuide(true);
                setPendingCallAction(() => handleAcceptCall);
            } else {
                setSnackbarMessage(
                    'Không thể chấp nhận cuộc gọi: ' + error.message,
                );
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            }
            handleEndCall();
        }
    };

    const handleRejectCall = () => {
        if (incomingCall) {
            sendCallSignal('call-reject', {}, incomingCall.senderId, token);
            setIncomingCall(null);
            setShowIncomingCallModal(false);
        }
    };

    const handleEndCall = () => {
        endCall();
        setCallModalOpen(false);
        setLocalStream(null);
        setRemoteStream(null);
        setCallStatus('');
        setActiveCall(null);
        setIsAudioEnabled(true);
        setIsVideoEnabled(true);

        if (activeCall) {
            sendCallSignal(
                'call-end',
                {},
                activeCall.senderId || activeCall.receiverId,
                token,
            );
        }
    };

    const handleToggleAudio = () => {
        const enabled = toggleAudio();
        setIsAudioEnabled(enabled);
    };

    const handleToggleVideo = () => {
        const enabled = toggleVideo();
        setIsVideoEnabled(enabled);
    };

    const handleRetryPermission = () => {
        setShowPermissionGuide(false);
        if (pendingCallAction) {
            pendingCallAction();
            setPendingCallAction(null);
        }
    };

    const handleStartCallFromFriendsList = async (friend, isVideo) => {
        // Switch to messages view to show ChatWindow
        setCurrentView('messages');
        // Select the friend
        setSelectedContact(friend);

        // Wait for state updates then initiate call
        setTimeout(async () => {
            try {
                setIsVideoCall(isVideo);
                setCallStatus('Đang kết nối...');
                setCallModalOpen(true);
                setActiveCall({
                    caller: friend,
                    isVideoCall: isVideo,
                    receiverId: friend.id,
                });

                // Initialize peer connection
                initializePeerConnection(
                    (candidate) => {
                        sendCallSignal(
                            'ice-candidate',
                            candidate,
                            friend.id,
                            token,
                        );
                    },
                    (stream) => {
                        setRemoteStream(stream);
                        setCallStatus('Đang gọi...');
                    },
                );

                // Get local media stream
                const stream = await startCall(isVideo);
                setLocalStream(stream);

                // Create and send offer
                const offer = await createOffer();
                sendCallSignal(
                    'offer',
                    { offer, isVideoCall: isVideo },
                    friend.id,
                    token,
                );

                setCallStatus('Đang đổ chuông...');
            } catch (error) {
                console.error('Error starting call:', error);

                if (error.message.includes('quyền truy cập')) {
                    setShowPermissionGuide(true);
                    setPendingCallAction(
                        () => () =>
                            handleStartCallFromFriendsList(friend, isVideo),
                    );
                } else {
                    setSnackbarMessage(
                        'Không thể bắt đầu cuộc gọi: ' + error.message,
                    );
                    setSnackbarSeverity('error');
                    setOpenSnackbar(true);
                }
                handleEndCall();
            }
        }, 200);
    };

    const handleLogout = useCallback(() => {
        // Disconnect WebSocket trước khi đăng xuất để cập nhật status offline
        disconnectWebSocket();

        localStorage.removeItem('userId');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('deletedMessageIds');
        setUserId(null);
        setToken(null);
        setSnackbarMessage('Đăng xuất thành công!');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
        handleMenuClose();
        navigate('/');
    }, [navigate]);

    const handleToggleAddFriendInput = useCallback(() => {
        setShowAddFriendInput(!showAddFriendInput);
        setFriendPhoneInput('');
    }, [showAddFriendInput]);

    const handleSendFriendRequest = useCallback(async () => {
        if (!friendPhoneInput.trim()) {
            setSnackbarMessage('Vui lòng nhập số điện thoại!');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }

        if (!/^\d+$/.test(friendPhoneInput)) {
            setSnackbarMessage('Số điện thoại chỉ được chứa các chữ số!');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }

        if (!token) {
            setSnackbarMessage('Vui lòng đăng nhập để gửi lời mời kết bạn!');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }

        setIsLoading(true);
        try {
            const result = await sendFriendRequest(friendPhoneInput);
            if (result) {
                setSnackbarMessage('Gửi lời mời kết bạn thành công!');
                setSnackbarSeverity('success');
                setOpenSnackbar(true);
                setShowAddFriendInput(false);
                setFriendPhoneInput('');
                await updateFriendsList();
                await updatePendingRequests();
            } else {
                setSnackbarMessage('Gửi lời mời kết bạn thất bại!');
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            }
        } catch (error) {
            setSnackbarMessage(
                'Lỗi gửi lời mời kết bạn: ' +
                (error.message || 'Không xác định'),
            );
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    }, [friendPhoneInput, updateFriendsList, updatePendingRequests, token]);

    const handleAcceptFriendRequest = useCallback(
        async (requestId) => {
            if (!token) {
                setSnackbarMessage(
                    'Vui lòng đăng nhập để chấp nhận lời mời kết bạn!',
                );
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
                return;
            }

            setIsLoading(true);
            try {
                const result = await acceptFriendRequest(requestId);
                if (result) {
                    setSnackbarMessage('Đã chấp nhận lời mời kết bạn!');
                    setSnackbarSeverity('success');
                    setOpenSnackbar(true);
                    await updateFriendsList();
                    await updatePendingRequests();
                } else {
                    setSnackbarMessage('Chấp nhận lời mời thất bại!');
                    setSnackbarSeverity('error');
                    setOpenSnackbar(true);
                }
            } catch (error) {
                setSnackbarMessage(
                    'Lỗi chấp nhận lời mời: ' +
                    (error.message || 'Không xác định'),
                );
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            } finally {
                setIsLoading(false);
            }
        },
        [updateFriendsList, updatePendingRequests, token],
    );

    const handleDeclineFriendRequest = async (requestId) => {
        setIsLoading(true);
        try {
            await cancelFriendRequest(requestId);
            setSnackbarMessage('Đã từ chối lời mời kết bạn');
            setSnackbarSeverity('info');
            setOpenSnackbar(true);
            await updatePendingRequests();
        } catch (error) {
            console.error('Error declining friend request:', error);
            setSnackbarMessage(
                error.message || 'Lỗi khi từ chối lời mời kết bạn',
            );
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedMemberIds.length === 0) {
            setSnackbarMessage(
                'Vui lòng nhập tên nhóm và chọn ít nhất một thành viên!',
            );
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }

        if (!token) {
            setSnackbarMessage('Vui lòng đăng nhập để tạo nhóm!');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }

        const userId =
            localStorage.getItem('userId') || '680e6d95a73e35151128bf65';
        const finalMemberIds = [...new Set([...selectedMemberIds, userId])];

        setIsLoading(true);
        try {
            console.log('Creating group with:', {
                groupName,
                memberIds: finalMemberIds,
                token,
            });
            const result = await createGroup(
                groupName,
                finalMemberIds,
                groupAvatar,
                token,
            );
            if (result) {
                setSnackbarMessage('Tạo nhóm thành công!');
                setSnackbarSeverity('success');
                setOpenSnackbar(true);
                setCreateGroupOpen(false);
                setGroupName('');
                setSelectedMemberIds([]);
                await updateGroups();
            } else {
                setSnackbarMessage('Tạo nhóm thất bại!');
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            }
        } catch (error) {
            setSnackbarMessage(
                'Lỗi tạo nhóm: ' +
                (error.response?.data?.message || error.message),
            );
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCreateGroup = () => {
        setCreateGroupOpen(true);
        handleMenuClose();
    };

    const handleUpdateContact = (contactId, updates) => {
        setContacts((prevContacts) =>
            prevContacts.map((contact) =>
                contact.id === contactId ? { ...contact, ...updates } : contact,
            ),
        );
    };

    const chatWindowProps = useMemo(
        () => ({
            selectedContact,
            messages,
            messageInput,
            onMessageInputChange: (e) => setMessageInput(e.target.value),
            onSendMessage: handleSendMessage,
            onProfileOpen: handleProfileOpen,
            userId,
            contacts,
            token,
            onUpdateContact: handleUpdateContact,
        }),
        [
            selectedContact,
            messages,
            messageInput,
            handleSendMessage,
            handleProfileOpen,
            userId,
            contacts,
            token,
        ],
    );

    const filteredContacts = useMemo(() => {
        let filtered = contacts;

        // Filter theo tab
        if (messageTab === 'unread') {
            filtered = filtered.filter((contact) => contact.unreadCount > 0);
        } else if (messageTab === 'stranger') {
            // Lọc tin nhắn từ người lạ (không phải bạn bè, không phải nhóm, và đã có tin nhắn)
            filtered = filtered.filter(
                (contact) =>
                    !contact.isFriend &&
                    !contact.isGroup &&
                    contact.lastMessage && // Phải có tin nhắn
                    contact.lastMessage !== 'Chưa có tin nhắn', // Không phải placeholder
            );
        }

        // Filter theo search query
        if (headerSearchQuery.trim()) {
            filtered = filtered.filter(
                (contact) =>
                    contact.name
                        ?.toLowerCase()
                        .includes(headerSearchQuery.toLowerCase()) ||
                    contact.phone?.includes(headerSearchQuery),
            );
        }

        // Sắp xếp: Hội thoại đã ghim lên đầu
        filtered.sort((a, b) => {
            // Ghim lên đầu
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            // Nếu cùng trạng thái ghim, giữ nguyên thứ tự hiện tại
            return 0;
        });

        console.log('Message tab:', messageTab);
        console.log('Search query:', headerSearchQuery);
        console.log('Filtered contacts:', filtered);
        return filtered;
    }, [contacts, headerSearchQuery, messageTab]);

    return (
        <ErrorBoundary>
            <ThemeProvider theme={ottEducationTheme}>
                <CssBaseline />
                <RootContainer>
                    <NavSidebar
                        currentView={currentView}
                        setCurrentView={setCurrentView}
                        user={userProfile}
                        unreadNotifications={pendingRequests.length}
                        onAvatarClick={() => handleProfileOpen({ id: userId, name: userProfile?.fullName || 'User' })}
                    />
                    {currentView === 'statistics' ? (
                        <StatisticsPanel />
                    ) : (
                        <>
                            <SidebarContainer>
                                <HeaderContainer>
                                    {contactView !== 'all' ? (
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                width: '100%',
                                            }}
                                        >
                                            <IconButton
                                                onClick={() => setContactView('all')}
                                                sx={{ color: '#7589a3', mr: 1 }}
                                            >
                                                <BiArrowBack size={22} />
                                            </IconButton>
                                            <Typography
                                                variant="h6"
                                                sx={{ fontWeight: 'bold', flex: 1 }}
                                            >
                                                {contactView === 'friends' &&
                                                    'Danh sách bạn bè'}
                                                {contactView === 'groups' &&
                                                    'Danh sách nhóm'}
                                                {contactView === 'friend-requests' &&
                                                    'Lời mời kết bạn'}
                                                {contactView === 'group-invites' &&
                                                    'Lời mời vào nhóm'}
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    backgroundColor: '#f0f2f5',
                                                    borderRadius: '8px',
                                                    px: 2,
                                                    py: 1,
                                                    flex: 1,
                                                    mr: 1,
                                                }}
                                            >
                                                <BiSearch size={18} color="#7589a3" />
                                                <InputBase
                                                    placeholder="Tìm bạn bè, tin nhắn..."
                                                    value={headerSearchQuery}
                                                    onChange={(e) =>
                                                        setHeaderSearchQuery(
                                                            e.target.value,
                                                        )
                                                    }
                                                    sx={{
                                                        ml: 1,
                                                        flex: 1,
                                                        fontSize: '14px',
                                                    }}
                                                />
                                            </Box>
                                            <IconButton
                                                onClick={handleMenuOpen}
                                                disabled={isLoading}
                                                title="Menu"
                                                sx={{ color: '#7589a3' }}
                                            >
                                                <BiDotsVerticalRounded size={22} />
                                            </IconButton>
                                        </>
                                    )}
                                </HeaderContainer>
                                {contactView === 'all' && (
                                    <Box
                                        sx={{
                                            display: 'flex',
                                            borderBottom: '1px solid #e0e0e0',
                                            px: 2,
                                            pt: 2,
                                        }}
                                    >
                                        <Box
                                            onClick={() => {
                                                setMessageTab('all');
                                                setContactView('all');
                                            }}
                                            sx={{
                                                flex: 1,
                                                textAlign: 'center',
                                                pb: 1.5,
                                                borderBottom:
                                                    messageTab === 'all'
                                                        ? '2px solid #0068ff'
                                                        : 'none',
                                                color:
                                                    messageTab === 'all'
                                                        ? '#0068ff'
                                                        : '#666',
                                                fontWeight:
                                                    messageTab === 'all'
                                                        ? 'bold'
                                                        : 'normal',
                                                cursor: 'pointer',
                                                '&:hover': { color: '#0068ff' },
                                            }}
                                        >
                                            Tất cả
                                        </Box>
                                        <Box
                                            onClick={() => {
                                                setMessageTab('unread');
                                                setContactView('all');
                                            }}
                                            sx={{
                                                flex: 1,
                                                textAlign: 'center',
                                                pb: 1.5,
                                                borderBottom:
                                                    messageTab === 'unread'
                                                        ? '2px solid #0068ff'
                                                        : 'none',
                                                color:
                                                    messageTab === 'unread'
                                                        ? '#0068ff'
                                                        : '#666',
                                                fontWeight:
                                                    messageTab === 'unread'
                                                        ? 'bold'
                                                        : 'normal',
                                                cursor: 'pointer',
                                                '&:hover': { color: '#0068ff' },
                                            }}
                                        >
                                            Chưa đọc
                                        </Box>
                                        <Box
                                            onClick={() => {
                                                setMessageTab('stranger');
                                                setContactView('all');
                                            }}
                                            sx={{
                                                flex: 1,
                                                textAlign: 'center',
                                                pb: 1.5,
                                                borderBottom:
                                                    messageTab === 'stranger'
                                                        ? '2px solid #0068ff'
                                                        : 'none',
                                                color:
                                                    messageTab === 'stranger'
                                                        ? '#0068ff'
                                                        : '#666',
                                                fontWeight:
                                                    messageTab === 'stranger'
                                                        ? 'bold'
                                                        : 'normal',
                                                cursor: 'pointer',
                                                '&:hover': { color: '#0068ff' },
                                            }}
                                        >
                                            Người lạ
                                        </Box>
                                    </Box>
                                )}
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                >
                                    <MenuItem
                                        onClick={() => {
                                            navigate('/contacts', {
                                                state: { view: 'friends' },
                                            });
                                            handleMenuClose();
                                        }}
                                    >
                                        <BiUserPlus
                                            size={20}
                                            style={{ marginRight: 12 }}
                                        />
                                        Danh sách bạn bè
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            navigate('/contacts', {
                                                state: { view: 'groups' },
                                            });
                                            handleMenuClose();
                                        }}
                                    >
                                        <BiGroup
                                            size={20}
                                            style={{ marginRight: 12 }}
                                        />
                                        Danh sách nhóm và cộng đồng
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            navigate('/contacts', {
                                                state: { view: 'friend-requests' },
                                            });
                                            handleMenuClose();
                                        }}
                                    >
                                        <BiUserPlus
                                            size={20}
                                            style={{ marginRight: 12 }}
                                        />
                                        Lời mời kết bạn
                                    </MenuItem>
                                    <MenuItem
                                        onClick={() => {
                                            navigate('/contacts', {
                                                state: { view: 'group-invites' },
                                            });
                                            handleMenuClose();
                                        }}
                                    >
                                        <BiGroup
                                            size={20}
                                            style={{ marginRight: 12 }}
                                        />
                                        Lời mời vào nhóm và cộng đồng
                                    </MenuItem>
                                </Menu>
                                <Snackbar
                                    open={openSnackbar}
                                    autoHideDuration={2000}
                                    onClose={() => setOpenSnackbar(false)}
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'center',
                                    }}
                                >
                                    <Alert
                                        onClose={() => setOpenSnackbar(false)}
                                        severity={snackbarSeverity}
                                        sx={{ width: '100%' }}
                                    >
                                        {snackbarMessage}
                                    </Alert>
                                </Snackbar>
                                {currentView === 'messages' &&
                                    contactView === 'all' && (
                                        <>
                                            {/* Hiển thị kết quả tìm kiếm người dùng mới */}
                                            {headerSearchQuery &&
                                                searchResults.length > 0 && (
                                                    <Box>
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                            sx={{ p: 2, pb: 1 }}
                                                        >
                                                            Kết quả tìm kiếm
                                                        </Typography>
                                                        <List>
                                                            {searchResults.map(
                                                                (user) => (
                                                                    <ListItem
                                                                        key={user.id}
                                                                        sx={{
                                                                            py: 1.5,
                                                                            cursor: 'pointer',
                                                                            '&:hover': {
                                                                                backgroundColor:
                                                                                    'rgba(0, 0, 0, 0.04)',
                                                                            },
                                                                        }}
                                                                    >
                                                                        <ListItemAvatar>
                                                                            <Avatar
                                                                                src={
                                                                                    user.avatar
                                                                                }
                                                                                sx={{
                                                                                    width: 56,
                                                                                    height: 56,
                                                                                }}
                                                                            >
                                                                                {user.name?.charAt(
                                                                                    0,
                                                                                )}
                                                                            </Avatar>
                                                                        </ListItemAvatar>
                                                                        <ListItemText
                                                                            primary={
                                                                                user.name
                                                                            }
                                                                            secondary={
                                                                                user.phone
                                                                            }
                                                                        />
                                                                        {user.friendStatus ===
                                                                            'NONE' && (
                                                                                <Button
                                                                                    variant="contained"
                                                                                    color="primary"
                                                                                    size="small"
                                                                                    onClick={async () => {
                                                                                        try {
                                                                                            await sendFriendRequest(
                                                                                                user.phone,
                                                                                                token,
                                                                                            );
                                                                                            setSnackbarMessage(
                                                                                                'Đã gửi lời mời kết bạn!',
                                                                                            );
                                                                                            setSnackbarSeverity(
                                                                                                'success',
                                                                                            );
                                                                                            setOpenSnackbar(
                                                                                                true,
                                                                                            );
                                                                                            // Thêm user ID vào danh sách đã gửi lời mời
                                                                                            setSentFriendRequests(
                                                                                                (
                                                                                                    prev,
                                                                                                ) =>
                                                                                                    new Set(
                                                                                                        [
                                                                                                            ...prev,
                                                                                                            user.id,
                                                                                                        ],
                                                                                                    ),
                                                                                            );
                                                                                            // Cập nhật trạng thái
                                                                                            setSearchResults(
                                                                                                (
                                                                                                    prev,
                                                                                                ) =>
                                                                                                    prev.map(
                                                                                                        (
                                                                                                            u,
                                                                                                        ) =>
                                                                                                            u.id ===
                                                                                                                user.id
                                                                                                                ? {
                                                                                                                    ...u,
                                                                                                                    friendStatus:
                                                                                                                        'PENDING',
                                                                                                                }
                                                                                                                : u,
                                                                                                    ),
                                                                                            );
                                                                                        } catch (error) {
                                                                                            setSnackbarMessage(
                                                                                                error.message ||
                                                                                                'Gửi lời mời thất bại',
                                                                                            );
                                                                                            setSnackbarSeverity(
                                                                                                'error',
                                                                                            );
                                                                                            setOpenSnackbar(
                                                                                                true,
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                    sx={{
                                                                                        fontSize:
                                                                                            '0.8rem',
                                                                                        py: 0.5,
                                                                                        px: 2,
                                                                                    }}
                                                                                >
                                                                                    Kết bạn
                                                                                </Button>
                                                                            )}
                                                                        {user.friendStatus ===
                                                                            'PENDING' && (
                                                                                <Typography
                                                                                    variant="caption"
                                                                                    color="text.secondary"
                                                                                >
                                                                                    Đã gửi
                                                                                    lời mời
                                                                                </Typography>
                                                                            )}
                                                                        {user.friendStatus ===
                                                                            'FRIEND' && (
                                                                                <Button
                                                                                    variant="outlined"
                                                                                    size="small"
                                                                                    onClick={() => {
                                                                                        const contact =
                                                                                            contacts.find(
                                                                                                (
                                                                                                    c,
                                                                                                ) =>
                                                                                                    c.id ===
                                                                                                    user.id,
                                                                                            );
                                                                                        if (
                                                                                            contact
                                                                                        ) {
                                                                                            setSelectedContact(
                                                                                                contact,
                                                                                            );
                                                                                            setHeaderSearchQuery(
                                                                                                '',
                                                                                            );
                                                                                        }
                                                                                    }}
                                                                                    sx={{
                                                                                        fontSize:
                                                                                            '0.8rem',
                                                                                        py: 0.5,
                                                                                        px: 2,
                                                                                    }}
                                                                                >
                                                                                    Nhắn tin
                                                                                </Button>
                                                                            )}
                                                                    </ListItem>
                                                                ),
                                                            )}
                                                        </List>
                                                    </Box>
                                                )}
                                            {/* Hiển thị thông báo không tìm thấy - CHỈ KHI TÌM SỐ ĐIỆN THOẠI */}
                                            {headerSearchQuery &&
                                                !isSearching &&
                                                searchResults.length === 0 &&
                                                filteredContacts.length === 0 &&
                                                /^\d+$/.test(
                                                    headerSearchQuery.trim(),
                                                ) && (
                                                    <Box
                                                        sx={{
                                                            p: 4,
                                                            textAlign: 'center',
                                                        }}
                                                    >
                                                        <Typography
                                                            variant="body2"
                                                            color="text.secondary"
                                                        >
                                                            Số điện thoại chưa đăng ký
                                                            hoặc không cho phép tìm kiếm
                                                        </Typography>
                                                    </Box>
                                                )}
                                            {/* Hiển thị danh sách contacts nếu không tìm kiếm hoặc không có kết quả */}
                                            {!headerSearchQuery && (
                                                <ContactList
                                                    contacts={filteredContacts}
                                                    selectedContact={selectedContact}
                                                    onContactSelect={setSelectedContact}
                                                    pendingRequests={[]}
                                                    onAcceptFriendRequest={
                                                        handleAcceptFriendRequest
                                                    }
                                                    isLoading={isLoading}
                                                    fetchPendingFriendRequests={
                                                        fetchPendingFriendRequests
                                                    }
                                                />
                                            )}
                                            {/* Hiển thị contacts được lọc theo search */}
                                            {headerSearchQuery && !isSearching && (
                                                <ContactList
                                                    contacts={filteredContacts}
                                                    selectedContact={selectedContact}
                                                    onContactSelect={setSelectedContact}
                                                    pendingRequests={[]}
                                                    onAcceptFriendRequest={
                                                        handleAcceptFriendRequest
                                                    }
                                                    isLoading={isLoading}
                                                    fetchPendingFriendRequests={
                                                        fetchPendingFriendRequests
                                                    }
                                                />
                                            )}
                                        </>
                                    )}
                                {currentView === 'messages' &&
                                    contactView === 'friends' && (
                                        <Box sx={{ height: '100%', overflow: 'auto' }}>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ p: 2, pb: 1 }}
                                            >
                                                {
                                                    filteredContacts.filter(
                                                        (c) => !c.isGroup,
                                                    ).length
                                                }{' '}
                                                bạn bè
                                            </Typography>
                                            <FriendsList
                                                contacts={filteredContacts}
                                                onSelectContact={setSelectedContact}
                                                onOpenUserSearch={() =>
                                                    setUserSearchOpen(true)
                                                }
                                                onStartCall={
                                                    handleStartCallFromFriendsList
                                                }
                                                hideHeader={true}
                                            />
                                        </Box>
                                    )}
                                {currentView === 'messages' &&
                                    contactView === 'groups' && (
                                        <Box sx={{ height: '100%', overflow: 'auto' }}>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ p: 2, pb: 1 }}
                                            >
                                                {
                                                    filteredContacts.filter(
                                                        (c) => c.isGroup,
                                                    ).length
                                                }{' '}
                                                nhóm
                                            </Typography>
                                            <ContactList
                                                contacts={filteredContacts.filter(
                                                    (c) => c.isGroup,
                                                )}
                                                selectedContact={selectedContact}
                                                onContactSelect={setSelectedContact}
                                                pendingRequests={[]}
                                                onAcceptFriendRequest={
                                                    handleAcceptFriendRequest
                                                }
                                                isLoading={isLoading}
                                                fetchPendingFriendRequests={
                                                    fetchPendingFriendRequests
                                                }
                                            />
                                        </Box>
                                    )}
                                {currentView === 'notifications' && (
                                    <NotificationsPanel
                                        pendingRequests={pendingRequests}
                                        onAccept={handleAcceptFriendRequest}
                                        onDecline={handleDeclineFriendRequest}
                                        isLoading={isLoading}
                                    />
                                )}
                                {currentView === 'messages' &&
                                    contactView === 'friend-requests' && (
                                        <Box sx={{ height: '100%', overflow: 'auto' }}>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{ p: 2, pb: 1 }}
                                            >
                                                {pendingRequests?.length || 0} lời mời
                                            </Typography>
                                            <ContactList
                                                contacts={[]}
                                                selectedContact={selectedContact}
                                                onContactSelect={setSelectedContact}
                                                pendingRequests={pendingRequests}
                                                onAcceptFriendRequest={
                                                    handleAcceptFriendRequest
                                                }
                                                isLoading={isLoading}
                                                fetchPendingFriendRequests={
                                                    fetchPendingFriendRequests
                                                }
                                            />
                                        </Box>
                                    )}
                                {currentView === 'messages' &&
                                    contactView === 'group-invites' && (
                                        <Box sx={{ p: 4, textAlign: 'center', mt: 4 }}>
                                            <Typography
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                Chưa có lời mời nào
                                            </Typography>
                                        </Box>
                                    )}

                                <SettingsPanel
                                    open={openChangePasswordModal}
                                    onClose={() => {
                                        setOpenChangePasswordModal(false);
                                        if (currentView === 'settings') {
                                            setCurrentView('messages');
                                        }
                                    }}
                                    onLogout={handleLogout}
                                />
                            </SidebarContainer>
                            {token ? (
                                <ChatWindow {...chatWindowProps} />
                            ) : (
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                    height="100%"
                                >
                                    <Typography variant="h6" color="text.secondary">
                                        Vui lòng đăng nhập để sử dụng chức năng chat
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}
                    <ProfileModal
                        open={profileOpen}
                        onClose={handleProfileClose}
                        profileData={selectedProfile}
                        userProfile={userProfile}
                        setUserProfile={setUserProfile}
                        sx={{ backgroundColor: '#0068ff' }}
                    />
                    <UserSearchModal
                        open={userSearchOpen}
                        onClose={() => setUserSearchOpen(false)}
                    />

                    <Dialog
                        open={createGroupOpen}
                        onClose={() => setCreateGroupOpen(false)}
                        maxWidth="sm"
                        fullWidth
                    >
                        <DialogTitle
                            sx={{
                                textAlign: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: 'primary.main',
                                pb: 2,
                            }}
                        >
                            Tạo nhóm mới
                        </DialogTitle>
                        <DialogContent>
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    mb: 3,
                                }}
                            >
                                <Avatar
                                    src={
                                        groupAvatar ||
                                        'https://th.bing.com/th/id/R.0fb6fad84621ac768796c2c228858678?rik=EZHn72rbvK8jkg&pid=ImgRaw&r=0'
                                    }
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        mb: 2,
                                        border: '3px solid',
                                        borderColor: 'primary.main',
                                        boxShadow: 2,
                                        cursor: 'pointer',
                                        '&:hover': {
                                            opacity: 0.8,
                                        },
                                    }}
                                    onClick={() =>
                                        document
                                            .getElementById('groupAvatarInput')
                                            .click()
                                    }
                                >
                                    <BiGroup size={40} />
                                </Avatar>
                                <input
                                    id="groupAvatarInput"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setGroupAvatar(reader.result);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    color="textSecondary"
                                >
                                    Nhấn để thay đổi ảnh nhóm
                                </Typography>
                            </Box>

                            <TextField
                                fullWidth
                                label="Tên nhóm"
                                variant="outlined"
                                value={groupName}
                                onChange={(e) => setGroupName(e.target.value)}
                                sx={{
                                    mb: 3,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: 2,
                                        '&:hover fieldset': {
                                            borderColor: 'primary.main',
                                        },
                                    },
                                }}
                            />

                            <Typography
                                variant="subtitle1"
                                sx={{
                                    mb: 2,
                                    fontWeight: 'medium',
                                    color: 'text.primary',
                                }}
                            >
                                Chọn thành viên
                            </Typography>

                            <List
                                sx={{
                                    maxHeight: 300,
                                    overflow: 'auto',
                                    bgcolor: 'background.paper',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                {contacts
                                    .filter((contact) => !contact.isGroup)
                                    .map((contact) => (
                                        <ListItem
                                            key={`friend-${contact.id}`}
                                            sx={{
                                                borderBottom: '1px solid',
                                                borderColor: 'divider',
                                                '&:last-child': {
                                                    borderBottom: 'none',
                                                },
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                },
                                            }}
                                        >
                                            <Checkbox
                                                checked={selectedMemberIds.includes(
                                                    contact.id,
                                                )}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedMemberIds(
                                                            (prev) => [
                                                                ...prev,
                                                                contact.id,
                                                            ],
                                                        );
                                                    } else {
                                                        setSelectedMemberIds(
                                                            (prev) =>
                                                                prev.filter(
                                                                    (id) =>
                                                                        id !==
                                                                        contact.id,
                                                                ),
                                                        );
                                                    }
                                                }}
                                                sx={{
                                                    color: 'primary.main',
                                                    '&.Mui-checked': {
                                                        color: 'primary.main',
                                                    },
                                                }}
                                            />
                                            <ListItemAvatar>
                                                <Avatar
                                                    src={contact.avatar}
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                    }}
                                                />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={contact.name}
                                                secondary={`@${contact.username}`}
                                                primaryTypographyProps={{
                                                    fontWeight: 'medium',
                                                }}
                                            />
                                        </ListItem>
                                    ))}
                            </List>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 3 }}>
                            <Button
                                onClick={() => setCreateGroupOpen(false)}
                                variant="outlined"
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    px: 3,
                                }}
                            >
                                Hủy
                            </Button>
                            <Button
                                onClick={handleCreateGroup}
                                disabled={isLoading}
                                variant="contained"
                                sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    px: 3,
                                }}
                            >
                                {isLoading ? 'Đang tạo...' : 'Tạo nhóm'}
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Incoming Call Modal */}
                    <IncomingCallModal
                        open={showIncomingCallModal}
                        caller={incomingCall?.caller}
                        isVideoCall={incomingCall?.data?.isVideoCall || false}
                        onAccept={handleAcceptCall}
                        onReject={handleRejectCall}
                    />

                    {/* Active Call Modal */}
                    <VideoCallModal
                        open={callModalOpen}
                        contact={activeCall?.caller || selectedContact}
                        isVideoCall={activeCall?.isVideoCall || false}
                        localStream={localStream}
                        remoteStream={remoteStream}
                        onToggleAudio={handleToggleAudio}
                        onToggleVideo={handleToggleVideo}
                        isAudioEnabled={isAudioEnabled}
                        isVideoEnabled={isVideoEnabled}
                        callStatus={callStatus}
                        onClose={handleEndCall}
                    />

                    {/* Permission Guide Modal */}
                    <PermissionGuideModal
                        open={showPermissionGuide}
                        onClose={() => {
                            setShowPermissionGuide(false);
                            setPendingCallAction(null);
                        }}
                        onRetry={handleRetryPermission}
                    />
                </RootContainer>
            </ThemeProvider>
        </ErrorBoundary>
    );
};

export default Home;

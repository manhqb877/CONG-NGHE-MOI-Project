import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
    Box,
    Avatar,
    Typography,
    IconButton,
    TextField,
    Paper,
    styled,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    CircularProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Menu,
    MenuItem,
    Tooltip,
} from '@mui/material';
import {
    BiSearch,
    BiPhone,
    BiVideo,
    BiDotsVerticalRounded,
    BiSmile,
    BiPaperclip,
    BiSend,
    BiUndo,
    BiTrash,
    BiShare,
    BiGroup,
    BiPin,
    BiEdit,
    BiImage,
    BiFile,
    BiMicrophone,
    BiCheck,
    BiMenu,
    BiInfoCircle,
    BiX,
    BiStop,
    BiMessageSquareDetail,
} from 'react-icons/bi';
import { BsCheckAll } from 'react-icons/bs';
import Picker from 'emoji-picker-react';
import {
    sendMessage,
    uploadFile,
    recallMessage,
    deleteMessage,
    forwardMessage,
    pinMessage,
    unpinMessage,
    getPinnedMessages,
    editMessage,
    sendCallSignal,
    readMessage,
} from '../../api/messageApi';

import { fetchGroupMembers } from '../../api/groupApi';
import SearchMessages from '../../components/SearchMessages';
import FriendModal from './FriendModal';
import VideoCallModal from './VideoCallModal';
import GroupInfoPanel from './GroupInfoPanel';
import PersonalChatInfoPanel from './PersonalChatInfoPanel';
import MessageItem from './MessageItem';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getLastSeenText } from '../../utils/timeUtils';
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
} from '../../services/webrtcService';

const ChatContainer = styled(Box)(({ theme }) => ({
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: theme.palette.grey[100],
}));

const ChatWindow = ({
    selectedContact,
    messages,
    messageInput,
    onMessageInputChange,
    onSendMessage,
    onProfileOpen,
    userId,
    contacts,
    token,
    onUpdateContact,
}) => {
    const [localMessages, setLocalMessages] = useState(messages);
    const [isSending, setIsSending] = useState(false);
    const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [pinnedMessagesDialogOpen, setPinnedMessagesDialogOpen] =
        useState(false);
    const [pinnedMessages, setPinnedMessages] = useState([]);
    const [syncedPinnedIds, setSyncedPinnedIds] = useState(new Set());
    const [messageToForward, setMessageToForward] = useState(null);
    const [messageToEdit, setMessageToEdit] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [groupMembers, setGroupMembers] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // Recording states and refs
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);

    const fileInputRef = useRef(null);
    const documentInputRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [isFriendModalOpen, setIsFriendModalOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [showSearchBar, setShowSearchBar] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const messageInputRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const open = Boolean(anchorEl);

    // Reset pinned state when switching conversations to avoid showing stale pins
    useEffect(() => {
        setPinnedMessages([]);
        setPinnedMessagesDialogOpen(false);
    }, [selectedContact?.id]);

    // Video call states
    const [callModalOpen, setCallModalOpen] = useState(false);
    const [isVideoCall, setIsVideoCall] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [callStatus, setCallStatus] = useState('');
    const [isInitiator, setIsInitiator] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);

    // Cập nhật thời gian mỗi phút để hiển thị "last seen" realtime
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000); // Cập nhật mỗi phút

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (messageInputRef.current) {
            messageInputRef.current.focus();
        }
    }, [selectedContact]);
    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
    };
    const handleProfileOpen = () => {
        setProfileData(selectedContact);
        setIsFriendModalOpen(true);
    };

    const handleProfileClose = () => {
        setIsFriendModalOpen(false);
        setProfileData(null);
    };

    useEffect(() => {
        // Deduplicate by id but always take the latest version (to keep refreshed flags like isPinned/isRead)
        const mapById = new Map();
        messages.forEach((msg) => {
            mapById.set(
                msg.id || msg.tempKey || `${msg.createAt}-${msg.senderId}`,
                msg,
            );
        });
        setLocalMessages((prev) => {
            const merged = Array.from(mapById.values()).map((msg) => {
                // Preserve local pinned state if backend list already marked it pinned
                if (syncedPinnedIds.has(msg.id)) {
                    return { ...msg, isPinned: true };
                }
                return msg;
            });
            return merged;
        });
    }, [messages, syncedPinnedIds]);

    // Tách riêng useEffect để đánh dấu tin nhắn đã đọc
    useEffect(() => {
        if (!selectedContact || selectedContact.isGroup || !token) return;

        // Đợi lâu hơn để đảm bảo WebSocket đã kết nối
        const timer = setTimeout(() => {
            // Chỉ đánh dấu tin nhắn chưa đọc khi mở chat lần đầu
            const unreadMessages = localMessages.filter(
                (msg) => msg.senderId !== userId && !msg.isRead && msg.id,
            );

            if (unreadMessages.length > 0) {
                console.log(
                    `Marking ${unreadMessages.length} messages as read`,
                );
                const successfulReads = [];

                unreadMessages.forEach((msg) => {
                    const success = readMessage(
                        msg.id,
                        msg.senderId,
                        userId,
                        token,
                    );
                    if (success) {
                        successfulReads.push(msg.id);
                    }
                });

                // Chỉ cập nhật local state cho những tin nhắn đã gửi read receipt thành công
                if (successfulReads.length > 0) {
                    setTimeout(() => {
                        setLocalMessages((prev) =>
                            prev.map((m) =>
                                successfulReads.includes(m.id)
                                    ? { ...m, isRead: true }
                                    : m,
                            ),
                        );
                    }, 200);
                }
            }
        }, 500); // Đợi 500ms để WebSocket connect xong

        return () => clearTimeout(timer);
    }, [selectedContact?.id]); // Chỉ chạy khi đổi contact

    useEffect(() => {
        if (!token) {
            setGroupMembers([]);
            return;
        }

        if (selectedContact?.isGroup) {
            fetchGroupMembers(selectedContact.id, token)
                .then((members) => {
                    console.log('Group members loaded:', members);
                    setGroupMembers(members);
                })
                .catch((error) => {
                    console.error('Error fetching group members:', error);
                    setGroupMembers([]);
                });
        } else {
            setGroupMembers([]);
        }
    }, [selectedContact, token]);

    const handleShowPinnedMessages = async () => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để xem tin nhắn đã ghim');
            return;
        }

        try {
            const pinned = await getPinnedMessages(
                // Với nhóm: chỉ cần groupId, otherUserId để null để tránh backend trả về tất cả
                selectedContact.isGroup ? null : selectedContact.id,
                selectedContact.isGroup ? selectedContact.id : null,
                token,
            );

            console.log('🔍 Raw pinned messages from backend:', pinned);
            console.log('📌 Current contact:', selectedContact);
            console.log('👤 Current userId:', userId);

            const filteredPinned = (pinned || [])
                .filter((msg) => {
                    const isPinnedFlag =
                        msg.isPinned === true || msg.isPinned === 'true';
                    const hasPinMeta = !!(
                        msg.pinBy ||
                        msg.pinnedBy ||
                        msg.pinnedAt ||
                        msg.pinAt ||
                        msg.pinTime
                    );

                    if (!isPinnedFlag && !hasPinMeta) {
                        console.log('Skip not-marked-pinned:', msg.id);
                        return false;
                    }

                    if (selectedContact.isGroup) {
                        const sameGroup = msg.groupId === selectedContact.id;
                        if (!sameGroup) {
                            console.log(
                                'Skip non-group message for current group:',
                                msg.id,
                                msg.groupId,
                            );
                        }
                        return sameGroup;
                    }

                    const otherId = selectedContact.id;
                    const isDirectMessage =
                        msg.groupId === undefined || msg.groupId === null;
                    const involvesCurrentPair =
                        (msg.senderId === userId &&
                            msg.receiverId === otherId) ||
                        (msg.senderId === otherId && msg.receiverId === userId);

                    if (!isDirectMessage || !involvesCurrentPair) {
                        console.log(
                            'Skip message not in this DM pair:',
                            msg.id,
                            msg.groupId,
                            msg.senderId,
                            msg.receiverId,
                        );
                    }

                    return isDirectMessage && involvesCurrentPair;
                })
                .reduce((unique, msg) => {
                    if (!unique.some((item) => item.id === msg.id)) {
                        unique.push(msg);
                    }
                    return unique;
                }, []);

            console.log('✅ Filtered pinned messages:', filteredPinned);
            setPinnedMessages(filteredPinned);
            setSyncedPinnedIds(new Set(filteredPinned.map((m) => m.id)));
            setPinnedMessagesDialogOpen(true);
        } catch (error) {
            console.error('Error fetching pinned messages:', error);
            let errorMessage = 'Lỗi tải tin nhắn đã ghim';
            if (error.response) {
                if (error.response.status === 403) {
                    errorMessage =
                        'Không có quyền truy cập tin nhắn đã ghim. Vui lòng kiểm tra lại quyền truy cập nhóm.';
                } else if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                }
            } else {
                errorMessage = error.message || errorMessage;
            }
            toast.error(errorMessage);
        }
    };

    // Format duration helper
    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                stream.getTracks().forEach((track) => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setRecordingDuration(0);

            timerRef.current = setInterval(() => {
                setRecordingDuration((prev) => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            toast.error(
                'Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.',
            );
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            clearInterval(timerRef.current);
            setIsRecording(false);

            // Create audio blob and send properly
            setTimeout(() => {
                const audioBlob = new Blob(audioChunksRef.current, {
                    type: 'audio/webm',
                });
                const file = new File(
                    [audioBlob],
                    `voice_message_${Date.now()}.webm`,
                    { type: 'audio/webm' },
                );
                uploadVoiceMessage(file);
            }, 200);
        }
    };

    const uploadVoiceMessage = async (file) => {
        if (!file) return;

        setIsSending(true);
        try {
            const token = localStorage.getItem('accessToken');
            const receiverId = !selectedContact.isGroup ? selectedContact.id : null;
            const groupId = selectedContact.isGroup ? selectedContact.id : null;
            const replyToId = replyingTo ? replyingTo.id : null;

            await uploadFile([file], receiverId, token, groupId, replyToId);

            // Success (optimistically handled or waiting for websocket)
        } catch (error) {
            console.error('Upload voice failed', error);
            toast.error('Gửi tin nhắn thoại thất bại');
        } finally {
            setIsSending(false);
            setReplyingTo(null);
        }
    };

    const handleCancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            clearInterval(timerRef.current);
            setIsRecording(false);
            setRecordingDuration(0);
            audioChunksRef.current = [];
        }
    };

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;
        if (!token) {
            toast.error('Vui lòng đăng nhập để gửi tin nhắn');
            return;
        }

        setIsSending(true);

        const tempKey = `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`;
        const message = {
            senderId: userId,
            [selectedContact.isGroup ? 'groupId' : 'receiverId']:
                selectedContact.id,
            content: messageInput,
            type: 'TEXT',
            tempKey: tempKey,
            replyToMessageId: replyingTo?.id,
        };

        try {
            console.log('Attempting to send message:', message);
            const success = sendMessage('/app/chat.send', message, token);
            if (success) {
                const newMessage = {
                    ...message,
                    createAt: new Date().toISOString(),
                    recalled: false,
                    deletedByUsers: [],
                    isRead: false,
                    isPinned: false,
                    isEdited: false,
                };
                onMessageInputChange({ target: { value: '' } });
                onSendMessage(newMessage);
            } else {
                toast.error(
                    'Không thể gửi tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error(`Lỗi gửi tin nhắn: ${error.message}`);
        } finally {
            setIsSending(false);
            setShowEmojiPicker(false);
            setReplyingTo(null);
        }
    };

    const handleReply = (message) => {
        setReplyingTo(message);
        if (messageInputRef.current) {
            messageInputRef.current.focus();
        }
    };

    const onEmojiClick = (emojiObject) => {
        const newMessageInput = messageInput + emojiObject.emoji;
        onMessageInputChange({ target: { value: newMessageInput } });
        setShowEmojiPicker(false);
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Voice/Video Call Handlers
    const handleStartCall = async (withVideo = false) => {
        if (selectedContact?.isGroup) {
            toast.error('Không thể gọi cho nhóm');
            return;
        }

        try {
            setIsVideoCall(withVideo);
            setIsInitiator(true);
            setCallStatus('Đang kết nối...');
            setCallModalOpen(true);

            // Initialize peer connection
            initializePeerConnection(
                (candidate) => {
                    // Send ICE candidate to peer
                    sendCallSignal(
                        'ice-candidate',
                        candidate,
                        selectedContact.id,
                        token,
                    );
                },
                (stream) => {
                    // Receive remote stream
                    setRemoteStream(stream);
                    setCallStatus('Đang gọi...');
                },
            );

            // Get local media stream
            const stream = await startCall(withVideo);
            setLocalStream(stream);

            // Create and send offer
            const offer = await createOffer();
            sendCallSignal(
                'offer',
                { offer, isVideoCall: withVideo },
                selectedContact.id,
                token,
            );

            setCallStatus('Đang đổ chuông...');
        } catch (error) {
            console.error('Error starting call:', error);

            // Show specific error message for permissions
            if (error.message.includes('quyền truy cập')) {
                toast.error(
                    'Vui lòng cho phép quyền microphone/camera! Click vào icon 🔒 bên cạnh URL và bật quyền.',
                    { autoClose: 8000 },
                );
            } else {
                toast.error('Không thể bắt đầu cuộc gọi: ' + error.message);
            }
            handleEndCall();
        }
    };

    const handleEndCall = () => {
        endCall();
        setCallModalOpen(false);
        setLocalStream(null);
        setRemoteStream(null);
        setCallStatus('');
        setIsInitiator(false);
        setIsAudioEnabled(true);
        setIsVideoEnabled(true);

        if (isInitiator) {
            sendCallSignal('call-end', {}, selectedContact.id, token);
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

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (!files.length) return;
        if (!token) {
            toast.error('Vui lòng đăng nhập để gửi file');
            return;
        }
        if (!selectedContact?.id) {
            toast.error('Không tìm thấy ID liên hệ hoặc nhóm');
            return;
        }

        console.log('Uploading files:', {
            isGroup: selectedContact.isGroup,
            id: selectedContact.id,
            files: files.map((f) => ({
                name: f.name,
                type: f.type,
                size: f.size,
            })),
            token: token ? `${token.substring(0, 20)}...` : 'NO TOKEN',
        });

        setIsSending(true);
        try {
            const response = await uploadFile(
                files,
                selectedContact.isGroup ? null : selectedContact.id,
                token,
                selectedContact.isGroup ? selectedContact.id : null,
            );
            // File sẽ tự động xuất hiện trong chat khi upload xong
        } catch (error) {
            console.error('Error uploading file:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status,
                headers: error.response?.headers,
                token: token ? 'EXISTS' : 'NO TOKEN',
            });

            // Xử lý lỗi cụ thể
            if (error.response?.status === 403) {
                toast.error('Lỗi xác thực. Vui lòng đăng nhập lại!');
            } else if (error.response?.status === 401) {
                toast.error('Token hết hạn. Vui lòng đăng nhập lại!');
            } else {
                toast.error(
                    `Lỗi gửi file: ${error.response?.data?.message || error.message
                    }`,
                );
            }
        } finally {
            setIsSending(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            if (documentInputRef.current) {
                documentInputRef.current.value = '';
            }
        }
    };

    const handleRecallMessage = (message) => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để thu hồi tin nhắn');
            return;
        }

        setIsSending(true);
        try {
            const identifier = message.id;
            if (!identifier) {
                throw new Error('Missing message identifier.');
            }
            const success = recallMessage(identifier, userId, token);
            if (success) {
                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === message.id
                            ? { ...msg, recalled: true }
                            : msg,
                    ),
                );
                toast.success('Đã thu hồi');
            } else {
                toast.error(
                    'Không thể thu hồi tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Error recalling message:', error);
            toast.error(`Lỗi thu hồi tin nhắn: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleDeleteMessage = (message) => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để xóa tin nhắn');
            return;
        }

        setIsSending(true);
        try {
            const identifier = message.id;
            if (!identifier) {
                throw new Error('Missing message identifier.');
            }
            const success = deleteMessage(identifier, userId, token);
            if (success) {
                const deletedMessageIds = JSON.parse(
                    localStorage.getItem('deletedMessageIds') || '[]',
                );
                if (message.id && !deletedMessageIds.includes(message.id)) {
                    deletedMessageIds.push(message.id);
                    localStorage.setItem(
                        'deletedMessageIds',
                        JSON.stringify(deletedMessageIds),
                    );
                }

                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === message.id
                            ? {
                                ...msg,
                                deletedByUsers: [
                                    ...(msg.deletedByUsers || []),
                                    userId,
                                ],
                            }
                            : msg,
                    ),
                );
                toast.success('Đã xóa');
            } else {
                toast.error(
                    'Không thể xóa tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Error deleting message:', error);
            toast.error(`Lỗi xóa tin nhắn: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const handlePinMessage = (message) => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để ghim tin nhắn');
            return;
        }

        setIsSending(true);
        try {
            const identifier = message.id;
            if (!identifier) {
                throw new Error('Missing message identifier.');
            }
            const success = pinMessage(identifier, userId, token);
            if (success) {
                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === message.id
                            ? { ...msg, isPinned: true }
                            : msg,
                    ),
                );
                toast.success('Đã ghim');
            } else {
                toast.error(
                    'Không thể ghim tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Error pinning message:', error);
            toast.error(`Lỗi ghim tin nhắn: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleUnpinMessage = (message) => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để bỏ ghim tin nhắn');
            return;
        }

        setIsSending(true);
        try {
            const identifier = message.id;
            if (!identifier) {
                throw new Error('Missing message identifier.');
            }
            const success = unpinMessage(identifier, userId, token);
            if (success) {
                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === message.id
                            ? { ...msg, isPinned: false }
                            : msg,
                    ),
                );
                toast.success('Đã bỏ ghim');
            } else {
                toast.error(
                    'Không thể bỏ ghim tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Error unpinning message:', error);
            toast.error(`Lỗi bỏ ghim tin nhắn: ${error.message}`);
        } finally {
            setIsSending(false);
        }
    };

    const handleUnpinFromModal = async (message) => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để bỏ ghim tin nhắn');
            return;
        }

        try {
            const success = await unpinMessage(message.id, userId, token);
            if (success) {
                setPinnedMessages((prev) =>
                    prev.filter((msg) => msg.id !== message.id),
                );
                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === message.id
                            ? { ...msg, isPinned: false }
                            : msg,
                    ),
                );
                toast.success('Đã bỏ ghim');
            } else {
                toast.error(
                    'Không thể bỏ ghim tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Error unpinning message from modal:', error);
            toast.error(`Lỗi bỏ ghim tin nhắn: ${error.message}`);
        }
    };

    const handleOpenForwardDialog = (message) => {
        setMessageToForward(message);
        setForwardDialogOpen(true);
    };

    const handleOpenEditDialog = (message) => {
        if (message.type !== 'TEXT') {
            toast.error('Chỉ có thể chỉnh sửa tin nhắn văn bản');
            return;
        }
        setMessageToEdit(message);
        setEditContent(message.content);
        setEditDialogOpen(true);
    };

    const handleEditMessage = async () => {
        if (!editContent.trim()) {
            toast.error('Nội dung tin nhắn không được để trống');
            return;
        }
        if (!token) {
            toast.error('Vui lòng đăng nhập để chỉnh sửa tin nhắn');
            return;
        }

        setIsSending(true);
        try {
            const success = await editMessage(
                messageToEdit.id,
                userId,
                editContent,
                selectedContact.isGroup ? selectedContact.id : null,
                token,
            );
            if (success) {
                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === messageToEdit.id
                            ? { ...msg, content: editContent, isEdited: true }
                            : msg,
                    ),
                );
                toast.success('Đã chỉnh sửa');
            } else {
                toast.error(
                    'Không thể chỉnh sửa tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Error editing message:', error);
            toast.error(`Lỗi chỉnh sửa tin nhắn: ${error.message}`);
        } finally {
            setIsSending(false);
            setEditDialogOpen(false);
            setMessageToEdit(null);
            setEditContent('');
        }
    };

    const handleForwardMessage = (contact) => {
        if (!token) {
            toast.error('Vui lòng đăng nhập để chuyển tiếp tin nhắn');
            return;
        }
        if (!contact.id) {
            toast.error('Không tìm thấy ID của liên hệ hoặc nhóm');
            return;
        }

        setIsSending(true);
        try {
            const identifier = messageToForward?.id;
            if (!identifier) {
                throw new Error('Missing message identifier.');
            }
            console.log('Forwarding message:', {
                identifier,
                userId,
                receiverId: contact.isGroup ? null : contact.id,
                groupId: contact.isGroup ? contact.id : null,
                content: messageToForward.content,
                type: messageToForward.type,
            });
            const success = forwardMessage(
                identifier,
                userId,
                contact.isGroup ? null : contact.id,
                contact.isGroup ? contact.id : null,
                messageToForward.content,
                token,
            );
            if (success) {
                toast.success('Đã chuyển tiếp');
            } else {
                toast.error(
                    'Không thể chuyển tiếp tin nhắn: WebSocket không hoạt động',
                );
            }
        } catch (error) {
            console.error('Lỗi chuyển tiếp tin nhắn:', error);
            toast.error(`Lỗi chuyển tiếp tin nhắn: ${error.message}`);
        } finally {
            setIsSending(false);
            setForwardDialogOpen(false);
            setMessageToForward(null);
        }
    };

    const handleSelectMessage = (message) => {
        setPinnedMessagesDialogOpen(false);
        const messageElement = document.getElementById(`message-${message.id}`);
        if (messageElement) {
            messageElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }
    };

    const getMessagePreview = (msg) => {
        if (!msg) return '';
        switch (msg.type) {
            case 'TEXT':
                return msg.content || '';
            case 'IMAGE':
                return '[Hình ảnh]';
            case 'VIDEO':
                return '[Video]';
            case 'AUDIO':
                return '[Âm thanh]';
            case 'FILE':
                return msg.fileName || '[Tệp đính kèm]';
            default:
                return '[Tin nhắn]';
        }
    };

    const pinnedHighlight = useMemo(() => {
        const pinned = localMessages.filter((m) => m.isPinned);
        if (!pinned.length) return null;

        return pinned.reduce((latest, msg) => {
            const latestTime = new Date(
                latest.createAt || latest.createdAt || 0,
            ).getTime();
            const msgTime = new Date(
                msg.createAt || msg.createdAt || 0,
            ).getTime();
            return msgTime >= latestTime ? msg : latest;
        }, pinned[0]);
    }, [localMessages]);

    useEffect(() => {
        if (!selectedContact || !token) {
            setSyncedPinnedIds(new Set());
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                const pinned = await getPinnedMessages(
                    selectedContact.isGroup ? null : selectedContact.id,
                    selectedContact.isGroup ? selectedContact.id : null,
                    token,
                );

                if (cancelled) return;

                const ids = new Set((pinned || []).map((m) => m.id));
                setSyncedPinnedIds(ids);
                setPinnedMessages(pinned || []);
                setLocalMessages((prev) =>
                    prev.map((msg) =>
                        ids.has(msg.id) ? { ...msg, isPinned: true } : msg,
                    ),
                );
            } catch (error) {
                console.error('Error syncing pinned messages:', error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [selectedContact?.id, selectedContact?.isGroup, token]);

    if (!selectedContact) {
        return (
            <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                height="100%"
                width="100%"
                textAlign="center"
                sx={{ bgcolor: '#f0f2f5' }}
            >
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0068ff 0%, #00aeff 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                        boxShadow: '0 4px 20px rgba(0,104,255,0.25)',
                    }}
                >
                    <BiMessageSquareDetail size={36} color="white" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#081c36', mb: 0.5 }}>
                    Chào mừng đến OTT Education
                </Typography>
                <Typography variant="body2" sx={{ color: '#7589a3', maxWidth: 280 }}>
                    Chọn một cuộc trò chuyện để bắt đầu nhắn tin
                </Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                flex: 1,
                height: '100%',
                overflow: 'hidden',
            }}
        >
            <ChatContainer>
                <Box
                    px={2}
                    py={1.25}
                    display="flex"
                    alignItems="center"
                    sx={{
                        bgcolor: 'white',
                        borderBottom: '1px solid #e8ecf0',
                        minHeight: 56,
                    }}
                >
                    <Box sx={{ position: 'relative', mr: 1.5, flexShrink: 0 }}>
                        <Avatar
                            src={selectedContact.avatar}
                            sx={{
                                cursor: 'pointer',
                                width: 42,
                                height: 42,
                                bgcolor: selectedContact.isGroup ? '#e8f0fe' : '#0068ff',
                                color: selectedContact.isGroup ? '#0068ff' : '#fff',
                            }}
                            onClick={handleProfileOpen}
                        >
                            {selectedContact.isGroup && <BiGroup size={20} />}
                        </Avatar>
                        {!selectedContact.isGroup && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 1,
                                    right: 1,
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    bgcolor: selectedContact.status === 'online' ? '#2ecc71' : '#bdbdbd',
                                    border: '2px solid #fff',
                                }}
                            />
                        )}
                    </Box>
                    <Box
                        flex={1}
                        sx={{ cursor: 'pointer', minWidth: 0 }}
                        onClick={handleProfileOpen}
                    >
                        <Typography
                            variant="subtitle1"
                            sx={{ fontWeight: 700, fontSize: '0.9375rem', color: '#081c36', lineHeight: 1.3 }}
                            noWrap
                        >
                            {selectedContact.name}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{
                                fontSize: '0.75rem',
                                color: selectedContact.status === 'online' ? '#2ecc71' : '#7589a3',
                                fontWeight: selectedContact.status === 'online' ? 500 : 400,
                            }}
                            key={currentTime.getTime()}
                        >
                            {selectedContact.isGroup
                                ? `Nhóm`
                                : selectedContact.status === 'online'
                                    ? 'Đang hoạt động'
                                    : selectedContact.lastSeen
                                        ? `Hoạt động ${getLastSeenText(selectedContact.lastSeen)}`
                                        : 'Không hoạt động'}
                        </Typography>
                    </Box>
                    {selectedContact.isGroup ? (
                        <>
                            <IconButton
                                onClick={() => setShowSearchBar(!showSearchBar)}
                                sx={{ color: '#7589a3' }}
                            >
                                <BiSearch size={22} />
                            </IconButton>
                            <IconButton
                                onClick={handleShowPinnedMessages}
                                sx={{ color: '#7589a3' }}
                            >
                                <BiPin size={22} />
                            </IconButton>
                            <IconButton
                                onClick={() => setShowGroupInfo(!showGroupInfo)}
                                sx={{
                                    color: showGroupInfo ? '#0068ff' : '#666',
                                }}
                                title="Thông tin nhóm"
                            >
                                <BiInfoCircle size={22} />
                            </IconButton>
                        </>
                    ) : (
                        <>
                            <IconButton
                                onClick={() => setShowSearchBar(!showSearchBar)}
                                sx={{ color: '#7589a3' }}
                            >
                                <BiSearch size={22} />
                            </IconButton>
                            <IconButton
                                onClick={handleShowPinnedMessages}
                                sx={{ color: '#7589a3' }}
                            >
                                <BiPin size={22} />
                            </IconButton>
                            {!selectedContact?.isGroup && (
                                <>
                                    <IconButton
                                        onClick={() => handleStartCall(false)}
                                        sx={{ color: '#7589a3' }}
                                        title="Gọi thoại"
                                    >
                                        <BiPhone size={22} />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleStartCall(true)}
                                        sx={{ color: '#7589a3' }}
                                        title="Gọi video"
                                    >
                                        <BiVideo size={22} />
                                    </IconButton>
                                </>
                            )}
                            <IconButton
                                onClick={() => setShowGroupInfo(!showGroupInfo)}
                                sx={{
                                    color: showGroupInfo ? '#0068ff' : '#666',
                                }}
                                title="Thông tin"
                            >
                                <BiInfoCircle size={22} />
                            </IconButton>
                        </>
                    )}
                </Box>

                {pinnedHighlight && (
                    <Box
                        onClick={() => handleSelectMessage(pinnedHighlight)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 2,
                            py: 1,
                            backgroundColor: '#fff6e6',
                            borderBottom: '1px solid #ffd599',
                            cursor: 'pointer',
                        }}
                    >
                        <BiPin color="#b56c00" size={18} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                variant="caption"
                                sx={{
                                    color: '#b56c00',
                                    fontWeight: 700,
                                    letterSpacing: 0.1,
                                }}
                            >
                                Tin nhắn đã ghim
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{ color: '#8a5a00' }}
                                noWrap
                                title={getMessagePreview(pinnedHighlight)}
                            >
                                {getMessagePreview(pinnedHighlight)}
                            </Typography>
                        </Box>
                        <Button
                            size="small"
                            variant="text"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleShowPinnedMessages();
                            }}
                            sx={{
                                textTransform: 'none',
                                color: '#b56c00',
                                fontWeight: 600,
                                minWidth: 0,
                                px: 1,
                            }}
                        >
                            Xem tất cả
                        </Button>
                    </Box>
                )}

                {showSearchBar && (
                    <SearchMessages
                        userId={userId}
                        selectedContact={selectedContact}
                        token={token}
                        onSelectMessage={handleSelectMessage}
                        onClose={() => setShowSearchBar(false)}
                    />
                )}

                <Box
                    flex={1}
                    overflow="auto"
                    p={1.5}
                    sx={{
                        bgcolor: '#e8edf2',
                        position: 'relative',
                        backgroundImage: 'none',
                    }}
                >
                    {isSending && (
                        <Box display="flex" justifyContent="center" my={2}>
                            <CircularProgress size={24} />
                        </Box>
                    )}
                    {localMessages.map((message) => (
                        <MessageItem
                            key={
                                message.id
                                    ? message.id
                                    : message.tempKey
                                        ? message.tempKey
                                        : `${message.createAt}-${message.senderId}`
                            }
                            message={message}
                            userId={userId}
                            selectedContact={selectedContact}
                            groupMembers={groupMembers}
                            replyMessage={
                                message.replyToMessageId
                                    ? localMessages.find(
                                        (m) => m.id === message.replyToMessageId
                                    )
                                    : null
                            }
                            onReply={handleReply}
                            onPin={handlePinMessage}
                            onUnpin={handleUnpinMessage}
                            onRecall={handleRecallMessage}
                            onDelete={handleDeleteMessage}
                            onForward={handleOpenForwardDialog}
                            onEdit={handleOpenEditDialog}
                            onScrollToMessage={(id) => {
                                const el = document.getElementById(
                                    `message-${id}`
                                );
                                if (el)
                                    el.scrollIntoView({
                                        behavior: 'smooth',
                                        block: 'center',
                                    });
                            }}
                            isSending={isSending}
                        />
                    ))}
                    <div ref={messagesEndRef} />
                </Box>

                <Box
                    p={1.5}
                    borderTop={1}
                    borderColor="divider"
                    sx={{ bgcolor: 'background.paper', position: 'relative' }}
                >
                    {replyingTo && (
                        <Box
                            sx={{
                                p: 1,
                                mb: 1,
                                bgcolor: '#f5f5f5',
                                borderLeft: '4px solid #1976d2',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderRadius: '4px',
                            }}
                        >
                            <Box sx={{ flex: 1, overflow: 'hidden', mr: 2 }}>
                                <Typography variant="caption" fontWeight="bold">
                                    Đang trả lời{' '}
                                    {replyingTo.senderId === userId
                                        ? 'chính mình'
                                        : 'tin nhắn'}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    noWrap
                                    sx={{ color: 'text.secondary' }}
                                >
                                    {replyingTo.content ||
                                        (replyingTo.type === 'IMAGE'
                                            ? '[Hình ảnh]'
                                            : replyingTo.type === 'FILE'
                                                ? '[File]'
                                                : '[Tin nhắn]')}
                                </Typography>
                            </Box>
                            <IconButton
                                size="small"
                                onClick={() => setReplyingTo(null)}
                            >
                                <BiX />
                            </IconButton>
                        </Box>
                    )}
                    {showEmojiPicker && (
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: '100%',
                                right: 10,
                                zIndex: 1000,
                            }}
                        >
                            <Picker onEmojiClick={onEmojiClick} />
                        </Box>
                    )}
                    <Box display="flex" alignItems="center" gap={1}>
                        <IconButton
                            size="medium"
                            component="label"
                            sx={{ color: '#0068ff' }}
                            title="Gửi file"
                        >
                            <BiPaperclip size={24} />
                            <input
                                type="file"
                                multiple
                                hidden
                                ref={documentInputRef}
                                onChange={handleFileUpload}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                            />
                        </IconButton>
                        <IconButton
                            size="medium"
                            component="label"
                            sx={{ color: '#0068ff' }}
                        >
                            <BiImage size={24} />
                            <input
                                type="file"
                                multiple
                                hidden
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                                accept="image/*,video/*,audio/*"
                            />
                        </IconButton>
                        <IconButton
                            size="medium"
                            sx={{ color: '#0068ff' }}
                            onClick={handleStartRecording}
                            disabled={isRecording}
                        >
                            <BiMicrophone size={24} />
                        </IconButton>

                        {isRecording ? (
                            <Box
                                sx={{
                                    flex: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    bgcolor: '#f0f2f5',
                                    borderRadius: '20px',
                                    px: 2,
                                    py: 1,
                                }}
                            >
                                <Typography color="error" fontWeight="bold">
                                    Đang ghi âm: {formatDuration(recordingDuration)}
                                </Typography>
                                <Box>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={handleCancelRecording}
                                        sx={{ mr: 1 }}
                                    >
                                        <BiX size={24} />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={handleStopRecording}
                                    >
                                        <BiCheck size={24} />
                                    </IconButton>
                                </Box>
                            </Box>
                        ) : (
                            <TextField
                                fullWidth
                                placeholder={`Aa`}
                                variant="outlined"
                                size="small"
                                value={messageInput}
                                onChange={onMessageInputChange}
                                onKeyPress={(e) =>
                                    e.key === 'Enter' && handleSendMessage()
                                }
                                inputRef={messageInputRef}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '20px',
                                        backgroundColor: '#f0f2f5',
                                        '& fieldset': {
                                            borderColor: 'transparent',
                                        },
                                        '&:hover fieldset': {
                                            borderColor: 'transparent',
                                        },
                                        '&.Mui-focused fieldset': {
                                            borderColor: '#0068ff',
                                            borderWidth: '1px',
                                        },
                                    },
                                }}
                            />
                        )}
                        <IconButton
                            size="medium"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            sx={{ color: '#0068ff' }}
                            disabled={isRecording}
                        >
                            <BiSmile size={24} />
                        </IconButton>
                        {!isRecording && messageInput.trim() ? (
                            <IconButton
                                onClick={handleSendMessage}
                                disabled={isSending}
                                sx={{
                                    color: '#0068ff',
                                    '&:hover': {
                                        bgcolor: 'rgba(0, 104, 255, 0.1)',
                                    },
                                }}
                            >
                                <BiSend size={24} />
                            </IconButton>
                        ) : null}
                    </Box>
                </Box>

                <Dialog
                    open={forwardDialogOpen}
                    onClose={() => setForwardDialogOpen(false)}
                >
                    <DialogTitle>
                        Chọn liên hệ hoặc nhóm để chuyển tiếp
                    </DialogTitle>
                    <DialogContent>
                        <List>
                            {contacts.map((contact) => (
                                <ListItem
                                    key={contact.id}
                                    onClick={() =>
                                        handleForwardMessage(contact)
                                    }
                                >
                                    <ListItemAvatar>
                                        <Avatar src={contact.avatar}>
                                            {contact.isGroup && <BiGroup />}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            contact.isGroup
                                                ? `[Nhóm] ${contact.name}`
                                                : contact.name
                                        }
                                        secondary={
                                            contact.isGroup
                                                ? 'Nhóm'
                                                : contact.username
                                        }
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={editDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                >
                    <DialogTitle>Chỉnh sửa tin nhắn</DialogTitle>
                    <DialogContent>
                        <TextField
                            fullWidth
                            label="Nội dung tin nhắn"
                            variant="outlined"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            multiline
                            rows={3}
                            sx={{ mt: 2 }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button
                            onClick={handleEditMessage}
                            disabled={isSending || !editContent.trim()}
                        >
                            Lưu
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={pinnedMessagesDialogOpen}
                    onClose={() => setPinnedMessagesDialogOpen(false)}
                >
                    <DialogTitle>Tin nhắn đã ghim</DialogTitle>
                    <DialogContent>
                        {pinnedMessages.length > 0 ? (
                            <List>
                                {pinnedMessages.map((message) => (
                                    <ListItem
                                        key={message.id}
                                        secondaryAction={
                                            <IconButton
                                                edge="end"
                                                onClick={() =>
                                                    handleUnpinFromModal(
                                                        message,
                                                    )
                                                }
                                                disabled={isSending}
                                            >
                                                <BiPin />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemText
                                            primary={
                                                message.type === 'IMAGE' ? (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                        }}
                                                    >
                                                        <img
                                                            src={
                                                                message.content
                                                            }
                                                            alt="Ảnh"
                                                            style={{
                                                                maxWidth:
                                                                    '100px',
                                                                maxHeight:
                                                                    '60px',
                                                                marginRight:
                                                                    '8px',
                                                            }}
                                                        />
                                                        <Typography variant="body2">
                                                            [Hình ảnh]
                                                        </Typography>
                                                    </Box>
                                                ) : message.type === 'VIDEO' ? (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems:
                                                                'center',
                                                        }}
                                                    >
                                                        <video
                                                            src={
                                                                message.content
                                                            }
                                                            style={{
                                                                maxWidth:
                                                                    '100px',
                                                                maxHeight:
                                                                    '60px',
                                                                marginRight:
                                                                    '8px',
                                                            }}
                                                        />
                                                        <Typography variant="body2">
                                                            [Video]
                                                        </Typography>
                                                    </Box>
                                                ) : message.type === 'AUDIO' ? (
                                                    <Typography>
                                                        [Âm thanh]
                                                    </Typography>
                                                ) : message.type === 'FILE' ? (
                                                    <Typography>
                                                        {message.fileName ||
                                                            '[Tệp đính kèm]'}
                                                    </Typography>
                                                ) : (
                                                    message.content
                                                )
                                            }
                                            secondary={`Từ: ${selectedContact.isGroup
                                                ? message.senderId ===
                                                    userId
                                                    ? 'Bạn'
                                                    : message.senderId
                                                : message.senderId ===
                                                    userId
                                                    ? 'Bạn'
                                                    : selectedContact.name
                                                } - ${new Date(
                                                    message.createAt,
                                                ).toLocaleString()}`}
                                            onClick={() =>
                                                handleSelectMessage(message)
                                            }
                                            sx={{ cursor: 'pointer' }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        ) : (
                            <Typography>
                                Không có tin nhắn nào được ghim.
                            </Typography>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() => setPinnedMessagesDialogOpen(false)}
                        >
                            Đóng
                        </Button>
                    </DialogActions>
                </Dialog>

                <FriendModal
                    open={isFriendModalOpen}
                    onClose={handleProfileClose}
                    profileData={profileData}
                    userId={userId}
                    token={token}
                    contacts={contacts}
                    onContactSelect={onSendMessage}
                />

                <VideoCallModal
                    open={callModalOpen}
                    onClose={handleEndCall}
                    contact={selectedContact}
                    isVideoCall={isVideoCall}
                    localStream={localStream}
                    remoteStream={remoteStream}
                    onToggleAudio={handleToggleAudio}
                    onToggleVideo={handleToggleVideo}
                    isAudioEnabled={isAudioEnabled}
                    isVideoEnabled={isVideoEnabled}
                    callStatus={callStatus}
                />

                <ToastContainer
                    position="top-right"
                    autoClose={2000}
                    hideProgressBar={false}
                    newestOnTop
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss={false}
                    draggable
                    pauseOnHover
                    theme="light"
                    limit={3}
                    style={{
                        fontSize: '14px',
                        fontFamily: 'inherit',
                    }}
                />
            </ChatContainer>

            {showGroupInfo &&
                (selectedContact.isGroup ? (
                    <GroupInfoPanel
                        selectedContact={selectedContact}
                        groupMembers={groupMembers}
                        messages={localMessages}
                        onClose={() => setShowGroupInfo(false)}
                        contacts={contacts}
                        onAddMembers={async (groupId, memberIds) => {
                            if (!token) {
                                toast.error(
                                    'Vui lòng đăng nhập để thêm thành viên',
                                );
                                return;
                            }
                            try {
                                const { addGroupMembers } = await import(
                                    '../../api/groupApi'
                                );
                                await addGroupMembers(
                                    groupId,
                                    memberIds,
                                    token,
                                );
                                toast.success('Đã thêm thành viên vào nhóm!');
                                // Reload group members
                                const { fetchGroupMembers } = await import(
                                    '../../api/groupApi'
                                );
                                const updatedMembers = await fetchGroupMembers(
                                    groupId,
                                    token,
                                );
                                setGroupMembers(updatedMembers);
                            } catch (error) {
                                console.error('Error adding members:', error);
                                toast.error(
                                    'Lỗi thêm thành viên: ' + error.message,
                                );
                            }
                        }}
                        onSendGroupInvites={async (groupId, memberIds) => {
                            if (!token) {
                                toast.error(
                                    'Vui lòng đăng nhập để gửi lời mời',
                                );
                                return;
                            }
                            try {
                                const { sendGroupInvite } = await import(
                                    '../../api/groupApi'
                                );
                                await sendGroupInvite(
                                    groupId,
                                    memberIds,
                                    token,
                                );
                                toast.success('Đã gửi lời mời vào nhóm!');
                            } catch (error) {
                                console.error('Error sending invites:', error);
                                toast.error(
                                    'Lỗi gửi lời mời: ' + error.message,
                                );
                            }
                        }}
                        onUpdateGroupInfo={async (groupId, updates) => {
                            if (!token) {
                                toast.error(
                                    'Vui lòng đăng nhập để cập nhật thông tin nhóm',
                                );
                                return;
                            }
                            try {
                                const { updateGroupInfo } = await import(
                                    '../../api/groupApi'
                                );
                                await updateGroupInfo(groupId, updates, token);
                                toast.success('Đã cập nhật thông tin nhóm!');

                                // Cập nhật selectedContact nếu đang xem nhóm này
                                if (selectedContact?.id === groupId) {
                                    // Reload lại thông tin nhóm để hiển thị cập nhật
                                    window.location.reload();
                                }
                            } catch (error) {
                                console.error(
                                    'Error updating group info:',
                                    error,
                                );
                                toast.error(
                                    'Lỗi cập nhật thông tin nhóm: ' +
                                    error.message,
                                );
                            }
                        }}
                        onPinConversation={async (contactId, isPinned) => {
                            try {
                                // TODO: Call API to pin/unpin conversation
                                console.log(
                                    'Pin conversation:',
                                    contactId,
                                    isPinned,
                                );

                                // Cập nhật contact trong danh sách
                                if (onUpdateContact) {
                                    onUpdateContact(contactId, { isPinned });
                                }

                                toast.success(
                                    isPinned
                                        ? 'Đã ghim hội thoại'
                                        : 'Đã bỏ ghim hội thoại',
                                );
                            } catch (error) {
                                console.error(
                                    'Error pinning conversation:',
                                    error,
                                );
                                toast.error('Lỗi ghim hội thoại');
                            }
                        }}
                        onMuteConversation={async (
                            contactId,
                            isMuted,
                            muteOption,
                        ) => {
                            try {
                                // TODO: Call API to mute/unmute conversation
                                console.log(
                                    'Mute conversation:',
                                    contactId,
                                    isMuted,
                                    muteOption,
                                );

                                // Cập nhật contact trong danh sách
                                if (onUpdateContact) {
                                    onUpdateContact(contactId, {
                                        isMuted,
                                        muteOption,
                                    });
                                }

                                if (isMuted) {
                                    const muteLabels = {
                                        '1hour': '1 giờ',
                                        '4hours': '4 giờ',
                                        until8am: 'đến 8:00 AM',
                                        forever: 'vĩnh viễn',
                                    };
                                    toast.success(
                                        `Đã tắt thông báo trong ${muteLabels[muteOption] || ''
                                        }`,
                                    );
                                } else {
                                    toast.success('Đã bật thông báo');
                                }
                            } catch (error) {
                                console.error(
                                    'Error muting conversation:',
                                    error,
                                );
                                toast.error('Lỗi tắt thông báo');
                            }
                        }}
                    />
                ) : (
                    <PersonalChatInfoPanel
                        selectedContact={selectedContact}
                        messages={localMessages}
                        onClose={() => setShowGroupInfo(false)}
                        contacts={contacts}
                        onCreateGroup={async (groupName, memberIds) => {
                            if (!token) {
                                toast.error('Vui lòng đăng nhập để tạo nhóm');
                                return;
                            }
                            try {
                                const { createGroup } = await import(
                                    '../../api/groupApi'
                                );
                                await createGroup(
                                    groupName,
                                    memberIds,
                                    null,
                                    token,
                                );
                                toast.success('Đã tạo nhóm thành công!');
                                setShowGroupInfo(false);
                            } catch (error) {
                                console.error('Error creating group:', error);
                                toast.error('Lỗi tạo nhóm: ' + error.message);
                            }
                        }}
                        onPinConversation={async (contactId, isPinned) => {
                            try {
                                // TODO: Call API to pin/unpin conversation
                                console.log(
                                    'Pin conversation:',
                                    contactId,
                                    isPinned,
                                );

                                // Cập nhật contact trong danh sách
                                if (onUpdateContact) {
                                    onUpdateContact(contactId, { isPinned });
                                }

                                toast.success(
                                    isPinned
                                        ? 'Đã ghim hội thoại'
                                        : 'Đã bỏ ghim hội thoại',
                                );
                            } catch (error) {
                                console.error(
                                    'Error pinning conversation:',
                                    error,
                                );
                                toast.error('Lỗi ghim hội thoại');
                            }
                        }}
                        onMuteConversation={async (
                            contactId,
                            isMuted,
                            muteOption,
                        ) => {
                            try {
                                // TODO: Call API to mute/unmute conversation
                                console.log(
                                    'Mute conversation:',
                                    contactId,
                                    isMuted,
                                    muteOption,
                                );

                                // Cập nhật contact trong danh sách
                                if (onUpdateContact) {
                                    onUpdateContact(contactId, {
                                        isMuted,
                                        muteOption,
                                    });
                                }

                                if (isMuted) {
                                    const muteLabels = {
                                        '1hour': '1 giờ',
                                        '4hours': '4 giờ',
                                        until8am: 'đến 8:00 AM',
                                        forever: 'vĩnh viễn',
                                    };
                                    toast.success(
                                        `Đã tắt thông báo trong ${muteLabels[muteOption] || ''
                                        }`,
                                    );
                                } else {
                                    toast.success('Đã bật thông báo');
                                }
                            } catch (error) {
                                console.error(
                                    'Error muting conversation:',
                                    error,
                                );
                                toast.error('Lỗi tắt thông báo');
                            }
                        }}
                    />
                ))}
        </Box>
    );
};

export default ChatWindow;

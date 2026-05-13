import React, { useState } from 'react';
import {
    Box,
    Typography,
    IconButton,
    Paper,
    Menu,
    MenuItem,
    styled,
    Avatar,
} from '@mui/material';
import {
    BiDotsVerticalRounded,
    BiUndo,
    BiTrash,
    BiShare,
    BiPin,
    BiEdit,
    BiReply,
    BiShow,
} from 'react-icons/bi';

const MessageContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isSender',
})(({ isSender }) => ({
    display: 'flex',
    justifyContent: isSender ? 'flex-end' : 'flex-start',
    marginBottom: 4,
    padding: '2px 16px',
    alignItems: 'flex-end',
    width: '100%',
    gap: 6,
}));

const MessageBubble = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'isSender',
})(({ isSender }) => ({
    padding: '9px 14px',
    backgroundColor: isSender ? '#0068ff' : '#f0f2f5',
    color: isSender ? '#ffffff' : '#081c36',
    borderRadius: isSender ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
    position: 'relative',
    maxWidth: '68%',
    boxShadow: isSender ? '0 1px 4px rgba(0,104,255,0.2)' : '0 1px 2px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    wordBreak: 'break-word',
}));

const PinIndicator = styled(Box)(({ theme }) => ({
    position: 'absolute',
    top: -10,
    right: 10,
    color: theme.palette.warning.main,
    zIndex: 1,
    backgroundColor: 'white',
    borderRadius: '50%',
}));

const ReplyPreview = styled(Box)(({ theme, isSender }) => ({
    backgroundColor: isSender ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)',
    borderLeft: `4px solid ${isSender ? '#fff' : theme.palette.primary.main}`,
    padding: '4px 8px',
    marginBottom: '4px',
    borderRadius: '4px',
    fontSize: '0.85rem',
    cursor: 'pointer',
}));

const MessageItem = ({
    message,
    userId,
    selectedContact,
    groupMembers,
    replyMessage,
    onReply,
    onPin,
    onUnpin,
    onRecall,
    onDelete,
    onForward,
    onEdit,
    onScrollToMessage,
    isSending,
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const isSender = message.senderId === userId;

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const getSenderName = () => {
        if (!selectedContact.isGroup || isSender) return 'You';
        const member = groupMembers.find((m) => m.id === message.senderId);
        return member
            ? `${member.firstName || ''} ${member.lastName || ''}`.trim() ||
            member.username ||
            'Unknown'
            : 'Unknown';
    };

    const handleDownload = async (url, fileName) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', fileName || 'download');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Download failed, falling back to new tab:', error);
            window.open(url, '_blank');
        }
    };

    const renderContent = () => {
        if (message.recalled) {
            return (
                <Typography fontStyle="italic">
                    Tin nhắn đã được thu hồi
                </Typography>
            );
        }

        if (
            message.deletedByUsers?.includes(userId) ||
            message.deletedByUsers?.includes(message.senderId)
        ) {
            return <Typography fontStyle="italic">Tin nhắn đã bị xóa</Typography>;
        }

        switch (message.type) {
            case 'TEXT':
                return (
                    <>
                        <Typography variant="body1">{message.content}</Typography>
                        {message.isEdited && (
                            <Typography
                                variant="caption"
                                sx={{
                                    opacity: 0.7,
                                    fontStyle: 'italic',
                                    display: 'block',
                                    textAlign: 'right',
                                }}
                            >
                                (Đã chỉnh sửa)
                            </Typography>
                        )}
                    </>
                );
            case 'IMAGE':
                return (
                    <img
                        src={message.content}
                        alt="Uploaded"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                        }}
                        onClick={() => window.open(message.content, '_blank')}
                    />
                );
            case 'VIDEO':
                return (
                    <video
                        src={message.content}
                        controls
                        style={{
                            maxWidth: '100%',
                            borderRadius: '8px',
                        }}
                    />
                );
            case 'AUDIO':
                return (
                    <audio controls style={{ maxWidth: '100%' }}>
                        <source src={message.content} />
                        Trình duyệt của bạn không hỗ trợ phát audio.
                    </audio>
                );
            case 'FILE':
                return (
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            padding: '8px 12px',
                            backgroundColor: isSender
                                ? 'rgba(255,255,255,0.2)'
                                    .replace(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/, 'rgba($1,$2,$3,0.3)') // darkening slightly for visibility
                                : '#e4e6eb',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            '&:hover': {
                                opacity: 0.8,
                            },
                        }}
                        onClick={() => handleDownload(message.content, message.fileName)}
                    >
                        <Box sx={{ flex: 1, overflow: 'hidden' }}>
                            <Typography
                                variant="body2"
                                fontWeight="bold"
                                noWrap
                                sx={{ color: isSender ? 'inherit' : 'text.primary' }}
                            >
                                {message.fileName || 'File đính kèm'}
                            </Typography>
                            <Typography
                                variant="caption"
                                sx={{ opacity: 0.8, color: isSender ? 'inherit' : 'text.secondary' }}
                            >
                                Click để tải xuống
                            </Typography>
                        </Box>
                    </Box>
                );
            case 'FORWARD':
                return (
                    <Box>
                        <Typography
                            fontStyle="italic"
                            variant="caption"
                            sx={{ opacity: 0.8, display: 'block', mb: 0.5 }}
                        >
                            Chuyển tiếp từ{' '}
                            {message.forwardedFrom?.senderId || 'người dùng khác'}
                        </Typography>
                        <Typography variant="body1">{message.content}</Typography>
                    </Box>
                )
            default:
                return (
                    <Typography variant="body1">
                        {message.content || '[Tin nhắn]'}
                    </Typography>
                );
        }
    };

    return (
        <MessageContainer isSender={isSender} id={`message-${message.id}`}>
            <Box display="flex" flexDirection="row" alignItems="center" gap={0.5}>
                {/* Actions Menu (Left of message for Sender, Right for Receiver) */}
                {!message.recalled && !message.deletedByUsers?.includes(userId) && (
                    <Box display="flex" alignItems="center">
                        <IconButton
                            size="small"
                            onClick={handleMenuOpen}
                            sx={{ opacity: 0, transition: 'opacity 0.2s', '.MuiBox-root:hover &': { opacity: 1 } }}
                        >
                            <BiDotsVerticalRounded />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleMenuClose}
                        >
                            <MenuItem
                                onClick={() => {
                                    onReply(message);
                                    handleMenuClose();
                                }}
                            >
                                <BiReply style={{ marginRight: 8 }} /> Trả lời
                            </MenuItem>

                            {/* Pin/Unpin */}
                            <MenuItem
                                onClick={() => {
                                    message.isPinned ? onUnpin(message) : onPin(message);
                                    handleMenuClose();
                                }}
                            >
                                <BiPin style={{ marginRight: 8 }} /> {message.isPinned ? 'Bỏ ghim' : 'Ghim'}
                            </MenuItem>

                            <MenuItem
                                onClick={() => {
                                    onForward(message);
                                    handleMenuClose();
                                }}
                            >
                                <BiShare style={{ marginRight: 8 }} /> Chuyển tiếp
                            </MenuItem>

                            {(message.type === 'FILE' || message.type === 'IMAGE' || message.type === 'VIDEO') && (
                                <MenuItem
                                    onClick={() => {
                                        window.open(message.content, '_blank');
                                        handleMenuClose();
                                    }}
                                >
                                    <BiShow style={{ marginRight: 8 }} /> Xem trước
                                </MenuItem>
                            )}

                            {isSender && message.type === 'TEXT' && (
                                <MenuItem
                                    onClick={() => {
                                        onEdit(message);
                                        handleMenuClose();
                                    }}
                                >
                                    <BiEdit style={{ marginRight: 8 }} /> Chỉnh sửa
                                </MenuItem>
                            )}

                            {isSender && (
                                <MenuItem
                                    onClick={() => {
                                        onRecall(message);
                                        handleMenuClose();
                                    }}
                                >
                                    <BiUndo style={{ marginRight: 8 }} /> Thu hồi
                                </MenuItem>
                            )}
                            {isSender && (
                                <MenuItem
                                    onClick={() => {
                                        onDelete(message);
                                        handleMenuClose();
                                    }}
                                >
                                    <BiTrash style={{ marginRight: 8 }} /> Xóa
                                </MenuItem>
                            )}
                        </Menu>
                    </Box>
                )}
            </Box>

            <MessageBubble isSender={isSender}>
                {message.isPinned && (
                    <PinIndicator>
                        <BiPin size={14} style={{ padding: 2 }} />
                    </PinIndicator>
                )}

                {/* Reply Context */}
                {replyMessage && (
                    <ReplyPreview
                        isSender={isSender}
                        onClick={() => onScrollToMessage(replyMessage.id)}
                    >
                        <Typography variant="caption" fontWeight="bold">
                            Trả lời tin nhắn
                        </Typography>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {replyMessage.content || (replyMessage.type === 'IMAGE' ? '[Hình ảnh]' : '[File]')}
                        </Typography>
                    </ReplyPreview>
                )}

                {/* Sender Name in Group */}
                {selectedContact.isGroup && !isSender && (
                    <Typography
                        variant="caption"
                        display="block"
                        sx={{ opacity: 0.7, mb: 0.5, fontWeight: 600 }}
                    >
                        {getSenderName()}
                    </Typography>
                )}

                {renderContent()}
            </MessageBubble>
        </MessageContainer>
    );
};

export default MessageItem;

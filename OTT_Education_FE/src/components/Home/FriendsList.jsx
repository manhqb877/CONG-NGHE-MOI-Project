import React, { useMemo, useRef, useState } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    IconButton,
    Divider,
    styled,
    Chip,
    InputBase,
    Tabs,
    Tab,
} from '@mui/material';
import {
    BiUserPlus,
    BiPhone,
    BiVideo,
    BiChat,
    BiSearch,
    BiSortAlt2,
} from 'react-icons/bi';

const Container = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#fff',
});

const Header = styled(Box)({
    padding: '16px 20px',
    borderBottom: '1px solid #e0e0e0',
});

const FriendListContainer = styled(Box)({
    flex: 1,
    overflowY: 'auto',
});

const StyledListItem = styled(ListItem)({
    cursor: 'pointer',
    '&:hover': {
        backgroundColor: '#f5f5f5',
    },
    padding: '12px 20px',
});

const ActionButtons = styled(Box)({
    display: 'flex',
    gap: '8px',
});

const FriendsList = ({
    contacts,
    onSelectContact,
    onOpenUserSearch,
    onStartCall,
    hideHeader = false,
}) => {
    // Filter only friends (not groups)
    const friends = contacts.filter((contact) => !contact.isGroup);
    const listRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState(0); // 0: Tất cả, 1: A-Z
    const [sortDirection, setSortDirection] = useState('asc'); // 'asc' = A-Z, 'desc' = Z-A

    // Sắp xếp và phân nhóm bạn bè
    const { sortedFriends, onlineFriends, groupedByAlphabet } = useMemo(() => {
        // Lọc theo search query
        let filtered = friends;
        if (searchQuery.trim()) {
            filtered = friends.filter((f) =>
                (f.name || '')
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
            );
        }

        // Tách online và offline
        const online = filtered.filter((f) => f.status === 'online');
        const offline = filtered.filter((f) => f.status !== 'online');

        // Sắp xếp theo alphabet
        const sortByName = (a, b) => {
            const comparison = (a.name || '').localeCompare(b.name || '');
            return sortDirection === 'asc' ? comparison : -comparison;
        };
        online.sort(sortByName);
        offline.sort(sortByName);

        // Gộp lại: online trước, offline sau
        const sorted = [...online, ...offline];

        // Nhóm theo chữ cái đầu
        const grouped = {};
        sorted.forEach((friend) => {
            const firstChar = (friend.name || '?').charAt(0).toUpperCase();
            const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
            if (!grouped[letter]) {
                grouped[letter] = [];
            }
            grouped[letter].push(friend);
        });

        return {
            sortedFriends: sorted,
            onlineFriends: online,
            groupedByAlphabet: grouped,
        };
    }, [friends, searchQuery, filterTab, sortDirection]);

    // Danh sách các chữ cái có bạn bè
    const alphabetList = Object.keys(groupedByAlphabet).sort();

    const scrollToLetter = (letter) => {
        const element = document.getElementById(`letter-${letter}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleFriendClick = (friend) => {
        if (onSelectContact) {
            onSelectContact(friend);
        }
    };

    const handleStartCall = (friend, isVideo) => {
        // Select friend first, then trigger call
        if (onSelectContact) {
            onSelectContact(friend);
        }
        if (onStartCall) {
            // Wait a bit for selection to process
            setTimeout(() => {
                onStartCall(friend, isVideo);
            }, 100);
        }
    };

    return (
        <Container sx={{ position: 'relative' }}>
            {!hideHeader && (
                <Header>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 2,
                        }}
                    >
                        <Typography variant="h6" fontWeight={600}>
                            Danh sách bạn bè
                        </Typography>
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 1,
                                alignItems: 'center',
                            }}
                        >
                            {filterTab === 1 && (
                                <IconButton
                                    size="small"
                                    onClick={() =>
                                        setSortDirection((prev) =>
                                            prev === 'asc' ? 'desc' : 'asc',
                                        )
                                    }
                                    sx={{
                                        backgroundColor: '#f0f2f5',
                                        '&:hover': {
                                            backgroundColor: '#e4e6eb',
                                        },
                                    }}
                                    title={
                                        sortDirection === 'asc'
                                            ? 'Sắp xếp Z-A'
                                            : 'Sắp xếp A-Z'
                                    }
                                >
                                    <BiSortAlt2 size={18} />
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            ml: 0.5,
                                            fontSize: '11px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {sortDirection === 'asc'
                                            ? 'A-Z'
                                            : 'Z-A'}
                                    </Typography>
                                </IconButton>
                            )}
                            {onlineFriends.length > 0 && (
                                <Chip
                                    label={`${onlineFriends.length} online`}
                                    size="small"
                                    sx={{
                                        height: '24px',
                                        fontSize: '12px',
                                        backgroundColor: '#e7f3ff',
                                        color: '#0068ff',
                                        fontWeight: 600,
                                    }}
                                />
                            )}
                        </Box>
                    </Box>

                    {/* Thanh tìm kiếm */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#f0f2f5',
                            borderRadius: '20px',
                            px: 2,
                            py: 1,
                            mb: 2,
                        }}
                    >
                        <BiSearch size={18} color="#7589a3" />
                        <InputBase
                            placeholder="Tìm tên bạn bè..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{
                                ml: 1,
                                flex: 1,
                                fontSize: '14px',
                            }}
                        />
                    </Box>

                    {/* Filter Tabs */}
                    <Tabs
                        value={filterTab}
                        onChange={(e, newValue) => setFilterTab(newValue)}
                        sx={{
                            minHeight: '40px',
                            '& .MuiTab-root': {
                                minHeight: '40px',
                                fontSize: '14px',
                                textTransform: 'none',
                                fontWeight: 500,
                            },
                        }}
                    >
                        <Tab label="Tất cả" />
                        <Tab label="A-Z" />
                    </Tabs>
                </Header>
            )}

            <FriendListContainer ref={listRef}>
                {sortedFriends.length === 0 ? (
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            color: 'text.secondary',
                            py: 8,
                        }}
                    >
                        <BiUserPlus size={64} color="#ccc" />
                        <Typography variant="body1" sx={{ mt: 2 }}>
                            {searchQuery
                                ? 'Không tìm thấy bạn bè'
                                : 'Chưa có bạn bè'}
                        </Typography>
                        {!searchQuery && (
                            <Typography
                                variant="body2"
                                color="primary"
                                sx={{
                                    mt: 1,
                                    cursor: 'pointer',
                                    '&:hover': { textDecoration: 'underline' },
                                }}
                                onClick={onOpenUserSearch}
                            >
                                Thêm bạn bè ngay
                            </Typography>
                        )}
                    </Box>
                ) : (
                    <List sx={{ p: 0 }}>
                        {/* Tab Tất cả: hiển thị danh sách bình thường */}
                        {filterTab === 0 &&
                            sortedFriends.map((friend) => (
                                <React.Fragment key={friend.id}>
                                    <StyledListItem>
                                        <ListItemAvatar>
                                            <Avatar
                                                src={friend.avatar}
                                                sx={{
                                                    width: 56,
                                                    height: 56,
                                                }}
                                            >
                                                {friend.name?.charAt(0)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography
                                                    variant="body1"
                                                    fontWeight={500}
                                                >
                                                    {friend.name}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                        mt: 0.5,
                                                    }}
                                                >
                                                    {friend.status ===
                                                    'online' ? (
                                                        <Chip
                                                            label="Đang hoạt động"
                                                            size="small"
                                                            sx={{
                                                                height: '20px',
                                                                fontSize:
                                                                    '11px',
                                                                backgroundColor:
                                                                    '#e7f3ff',
                                                                color: '#0068ff',
                                                            }}
                                                        />
                                                    ) : (
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            component="span"
                                                        >
                                                            {friend.lastSeen
                                                                ? `Hoạt động ${new Date(
                                                                      friend.lastSeen,
                                                                  ).toLocaleDateString()}`
                                                                : 'Không hoạt động'}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            }
                                            secondaryTypographyProps={{
                                                component: 'div',
                                            }}
                                        />
                                        <ActionButtons>
                                            <IconButton
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFriendClick(friend);
                                                }}
                                                sx={{
                                                    backgroundColor: '#f0f2f5',
                                                    '&:hover': {
                                                        backgroundColor:
                                                            '#e4e6eb',
                                                    },
                                                }}
                                            >
                                                <BiChat size={18} />
                                            </IconButton>
                                            {!friend.isGroup && (
                                                <>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartCall(
                                                                friend,
                                                                false,
                                                            );
                                                        }}
                                                        sx={{
                                                            backgroundColor:
                                                                '#f0f2f5',
                                                            '&:hover': {
                                                                backgroundColor:
                                                                    '#e4e6eb',
                                                            },
                                                        }}
                                                        title="Gọi thoại"
                                                    >
                                                        <BiPhone size={18} />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStartCall(
                                                                friend,
                                                                true,
                                                            );
                                                        }}
                                                        sx={{
                                                            backgroundColor:
                                                                '#f0f2f5',
                                                            '&:hover': {
                                                                backgroundColor:
                                                                    '#e4e6eb',
                                                            },
                                                        }}
                                                        title="Gọi video"
                                                    >
                                                        <BiVideo size={18} />
                                                    </IconButton>
                                                </>
                                            )}
                                        </ActionButtons>
                                    </StyledListItem>
                                    <Divider variant="inset" component="li" />
                                </React.Fragment>
                            ))}

                        {/* Tab A-Z: hiển thị nhóm theo chữ cái */}
                        {filterTab === 1 &&
                            alphabetList.map((letter) => (
                                <React.Fragment key={letter}>
                                    {/* Header chữ cái */}
                                    <Box
                                        id={`letter-${letter}`}
                                        sx={{
                                            position: 'sticky',
                                            top: 0,
                                            backgroundColor: '#f8f9fa',
                                            px: 3,
                                            py: 1.5,
                                            zIndex: 1,
                                            borderBottom: '1px solid #e0e0e0',
                                        }}
                                    >
                                        <Typography
                                            variant="subtitle2"
                                            fontWeight={700}
                                            color="#0068ff"
                                            sx={{ fontSize: '15px' }}
                                        >
                                            {letter}
                                        </Typography>
                                    </Box>
                                    {/* Danh sách bạn bè trong nhóm */}
                                    {groupedByAlphabet[letter].map((friend) => (
                                        <React.Fragment key={friend.id}>
                                            <StyledListItem>
                                                <ListItemAvatar>
                                                    <Avatar
                                                        src={friend.avatar}
                                                        sx={{
                                                            width: 56,
                                                            height: 56,
                                                        }}
                                                    >
                                                        {friend.name?.charAt(0)}
                                                    </Avatar>
                                                </ListItemAvatar>
                                                <ListItemText
                                                    primary={
                                                        <Typography
                                                            variant="body1"
                                                            fontWeight={500}
                                                        >
                                                            {friend.name}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems:
                                                                    'center',
                                                                gap: 1,
                                                                mt: 0.5,
                                                            }}
                                                        >
                                                            {friend.status ===
                                                            'online' ? (
                                                                <Chip
                                                                    label="Đang hoạt động"
                                                                    size="small"
                                                                    sx={{
                                                                        height: '20px',
                                                                        fontSize:
                                                                            '11px',
                                                                        backgroundColor:
                                                                            '#e7f3ff',
                                                                        color: '#0068ff',
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    component="span"
                                                                >
                                                                    {friend.lastSeen
                                                                        ? `Hoạt động ${new Date(
                                                                              friend.lastSeen,
                                                                          ).toLocaleDateString()}`
                                                                        : 'Không hoạt động'}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    }
                                                    secondaryTypographyProps={{
                                                        component: 'div',
                                                    }}
                                                />
                                                <ActionButtons>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleFriendClick(
                                                                friend,
                                                            );
                                                        }}
                                                        sx={{
                                                            backgroundColor:
                                                                '#f0f2f5',
                                                            '&:hover': {
                                                                backgroundColor:
                                                                    '#e4e6eb',
                                                            },
                                                        }}
                                                    >
                                                        <BiChat size={18} />
                                                    </IconButton>
                                                    {!friend.isGroup && (
                                                        <>
                                                            <IconButton
                                                                size="small"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleStartCall(
                                                                        friend,
                                                                        false,
                                                                    );
                                                                }}
                                                                sx={{
                                                                    backgroundColor:
                                                                        '#f0f2f5',
                                                                    '&:hover': {
                                                                        backgroundColor:
                                                                            '#e4e6eb',
                                                                    },
                                                                }}
                                                                title="Gọi thoại"
                                                            >
                                                                <BiPhone
                                                                    size={18}
                                                                />
                                                            </IconButton>
                                                            <IconButton
                                                                size="small"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleStartCall(
                                                                        friend,
                                                                        true,
                                                                    );
                                                                }}
                                                                sx={{
                                                                    backgroundColor:
                                                                        '#f0f2f5',
                                                                    '&:hover': {
                                                                        backgroundColor:
                                                                            '#e4e6eb',
                                                                    },
                                                                }}
                                                                title="Gọi video"
                                                            >
                                                                <BiVideo
                                                                    size={18}
                                                                />
                                                            </IconButton>
                                                        </>
                                                    )}
                                                </ActionButtons>
                                            </StyledListItem>
                                            <Divider />
                                        </React.Fragment>
                                    ))}
                                </React.Fragment>
                            ))}
                    </List>
                )}
            </FriendListContainer>

            {/* Alphabet Index - thanh cuộn nhanh bên phải - chỉ hiển thị ở tab A-Z */}
            {filterTab === 1 && sortedFriends.length > 10 && (
                <Box
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: hideHeader ? '50%' : 'calc(50% + 100px)',
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.2,
                        py: 1.5,
                        px: 0.8,
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '20px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        zIndex: 10,
                    }}
                >
                    {alphabetList.map((letter) => (
                        <Box
                            key={letter}
                            onClick={() => scrollToLetter(letter)}
                            sx={{
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#0068ff',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    backgroundColor: '#0068ff',
                                    color: '#fff',
                                    borderRadius: '50%',
                                    transform: 'scale(1.2)',
                                },
                            }}
                        >
                            {letter}
                        </Box>
                    ))}
                </Box>
            )}
        </Container>
    );
};

export default FriendsList;

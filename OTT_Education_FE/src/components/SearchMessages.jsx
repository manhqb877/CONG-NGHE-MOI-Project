import React, { useState, useEffect } from 'react';
import {
    Box,
    TextField,
    InputAdornment,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemText,
} from '@mui/material';
import { BiSearch, BiX } from 'react-icons/bi';
import { searchMessages } from '../api/messageApi';
import { toast } from 'react-toastify';

const SearchMessages = ({
    userId,
    selectedContact,
    token,
    onSelectMessage,
    onClose,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    // Tự động tìm kiếm khi searchQuery thay đổi
    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (searchQuery.trim() && token) {
                handleSearch();
            } else {
                setSearchResults([]);
            }
        }, 500); // Debounce 500ms

        return () => clearTimeout(delaySearch);
    }, [searchQuery, token]);

    const handleSearch = async () => {
        if (!searchQuery.trim() || !token) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const results = await searchMessages(
                userId,
                selectedContact.isGroup ? null : selectedContact.id,
                selectedContact.isGroup ? selectedContact.id : null,
                searchQuery,
                token,
            );
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching messages:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        onClose();
    };

    return (
        <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
                fullWidth
                placeholder="Tìm kiếm tin nhắn"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <BiSearch />
                        </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                        <InputAdornment position="end">
                            <IconButton
                                onClick={handleClearSearch}
                                disabled={isSearching}
                            >
                                <BiX />
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
                sx={{ mb: 2 }}
            />

            {searchResults.length > 0 && (
                <List sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {searchResults.map((message) => (
                        <ListItem
                            key={message.id}
                            button
                            onClick={() => onSelectMessage(message)}
                        >
                            <ListItemText
                                primary={message.content}
                                secondary={`Từ: ${
                                    selectedContact.isGroup
                                        ? message.senderId === userId
                                            ? 'Bạn'
                                            : message.senderId
                                        : message.senderId === userId
                                        ? 'Bạn'
                                        : selectedContact.name
                                } - ${new Date(
                                    message.createAt,
                                ).toLocaleString()}`}
                            />
                        </ListItem>
                    ))}
                </List>
            )}
            {searchQuery.trim() && searchResults.length === 0 && (
                <Typography textAlign="center" color="text.secondary">
                    Không tìm thấy tin nhắn nào khớp với "{searchQuery}"
                </Typography>
            )}
        </Box>
    );
};

export default SearchMessages;

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
} from '@mui/material';
import Check from '@mui/icons-material/Check';

const RegisterSuccessModal = ({ open, onClose, onLoginClick }) => {
    const handleLogin = () => {
        onClose();
        if (onLoginClick) {
            onLoginClick();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    boxShadow: '0 10px 40px rgba(0,104,255,0.2)',
                },
            }}
        >
            <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 3 }}>
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0068ff 0%, #00aeff 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        boxShadow: '0 4px 20px rgba(0,104,255,0.35)',
                        animation: 'bounce 0.6s ease-in-out',
                        '@keyframes bounce': {
                            '0%, 100%': { transform: 'scale(0.9)' },
                            '50%': { transform: 'scale(1.1)' },
                        },
                    }}
                >
                    <Check sx={{ color: 'white', fontSize: 48 }} />
                </Box>

                <Typography
                    variant="h5"
                    sx={{
                        fontWeight: 700,
                        color: '#081c36',
                        mb: 1,
                        fontSize: '1.5rem',
                    }}
                >
                    Đăng ký thành công!
                </Typography>

                <Typography
                    variant="body1"
                    sx={{
                        color: '#7589a3',
                        mb: 3,
                        lineHeight: 1.6,
                        fontSize: '0.95rem',
                    }}
                >
                    Chúc mừng bạn! Tài khoản của bạn đã được tạo thành công.
                    <br />
                    Vui lòng đăng nhập để bắt đầu trải nghiệm OTT Education.
                </Typography>
            </DialogContent>

            <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 1 }}>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={onClose}
                    sx={{
                        borderRadius: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                    }}
                >
                    Để sau
                </Button>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleLogin}
                    sx={{
                        borderRadius: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 3,
                        background: 'linear-gradient(135deg, #0068ff 0%, #00aeff 100%)',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #0056d6 0%, #0096d6 100%)',
                        },
                    }}
                >
                    Đăng nhập ngay
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RegisterSuccessModal;

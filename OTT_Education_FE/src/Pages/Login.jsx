import React, { useState, useEffect } from 'react';
import { ThemeProvider, styled } from '@mui/material/styles';
import {
    Box,
    CssBaseline,
    Button,
    TextField,
    Typography,
    Paper,
    Link,
    Container,
    InputAdornment,
    IconButton,
    Alert,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { AccountCircle, Lock } from '@mui/icons-material';
import { ottEducationTheme } from '../theme/theme';

const AuthContainer = styled(Container)(() => ({
    minHeight: '100vh',
    display: 'flex',
    maxWidth: '100% !important',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    background: 'linear-gradient(135deg, #0068ff 0%, #00aeff 100%)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: '-30%',
        left: '-20%',
        width: '60%',
        height: '80%',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.07)',
        pointerEvents: 'none',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '-20%',
        right: '-10%',
        width: '50%',
        height: '70%',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)',
        pointerEvents: 'none',
    },
}));

const AuthPaper = styled(Paper)(() => ({
    padding: '36px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: 420,
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
    position: 'relative',
    zIndex: 1,
    margin: '16px',
}));

const AppLogo = () => (
    <Box sx={{ textAlign: 'center', mb: 3 }}>
        <Box
            sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0068ff 0%, #00aeff 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 1.5,
                boxShadow: '0 4px 16px rgba(0,104,255,0.35)',
            }}
        >
            <Typography
                sx={{
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1.5rem',
                    letterSpacing: '-1px',
                    lineHeight: 1,
                }}
            >
                OTT
            </Typography>
        </Box>
        <Typography
            variant="caption"
            sx={{
                color: '#7589a3',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
            }}
        >
            Education
        </Typography>
    </Box>
);

const ZaloTextField = styled(TextField)(() => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: 8,
        backgroundColor: '#f5f7fb',
        '& fieldset': { borderColor: '#e0e7ef' },
        '&:hover fieldset': { borderColor: '#0068ff' },
        '&.Mui-focused fieldset': { borderColor: '#0068ff', borderWidth: 1.5 },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: '#0068ff' },
}));

const Login = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [isResetPassword, setIsResetPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        phone: '',
        firstName: '',
        lastName: '',
        gender: 'MALE',
        birthday: '',
        code: '',
    });
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (location.state?.successMessage) {
            setSuccessMessage(location.state.successMessage);
        }
    }, [location]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTogglePassword = () => setShowPassword((prev) => !prev);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        const password = formData.password;
        const hasUpperCase = /[A-Z]/.test(password);
        const maxLength = password.length <= 10;

        if (!hasUpperCase || !maxLength) {
            setIsLoading(false);
            setError('Mật khẩu phải có ít nhất 1 ký tự in hoa và tối đa 10 ký tự.');
            return;
        }

        if (!isLogin && formData.password !== formData.confirmPassword) {
            setIsLoading(false);
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        if (isLogin) {
            // Đăng nhập
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: formData.username,
                        password: formData.password,
                    }),
                });

                if (!response.ok) {
                    let errorMessage = 'Đăng nhập thất bại';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch {
                        errorMessage = response.status === 403
                            ? 'Tên đăng nhập hoặc mật khẩu không đúng'
                            : `Lỗi ${response.status}: ${response.statusText}`;
                    }
                    throw new Error(errorMessage);
                }

                const data = await response.json();
                localStorage.setItem('accessToken', data.accessToken);
                localStorage.setItem('refreshToken', data.refreshToken);
                localStorage.setItem('userId', data.userId);
                navigate('/home');
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        } else {
            // Đăng ký trực tiếp - không cần xác thực email
            try {
                if (!formData.email || !formData.email.includes('@')) {
                    throw new Error('Email không hợp lệ');
                }
                if (!formData.phone) {
                    throw new Error('Số điện thoại không được để trống');
                }

                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: formData.username,
                        password: formData.password,
                        email: formData.email,
                        phone: formData.phone,
                        firstName: formData.username,
                        lastName: '',
                        gender: 'MALE',
                        birthday: new Date('2000-01-01').toISOString(),
                        status: 'ACTIVE',
                    }),
                });

                if (!response.ok) {
                    let errorMessage = 'Đăng ký thất bại';
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorData.error || errorMessage;
                    } catch {
                        errorMessage = `Lỗi ${response.status}: ${response.statusText}`;
                    }
                    throw new Error(errorMessage);
                }

                const data = await response.json();

                // Nếu backend trả về token, tự động đăng nhập luôn
                if (data.accessToken) {
                    localStorage.setItem('accessToken', data.accessToken);
                    localStorage.setItem('refreshToken', data.refreshToken);
                    localStorage.setItem('userId', data.userId);
                    navigate('/home');
                } else {
                    // Không có token, chuyển về trang đăng nhập
                    setSuccessMessage('Đăng ký thành công! Vui lòng đăng nhập.');
                    setIsLogin(true);
                    setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <ThemeProvider theme={ottEducationTheme}>
            <CssBaseline />
            <AuthContainer>
                <AuthPaper elevation={0}>
                    <AppLogo />

                    <Typography
                        component="h1"
                        variant="h6"
                        sx={{
                            fontWeight: 700,
                            color: '#081c36',
                            mb: 0.5,
                            fontSize: '1.25rem',
                        }}
                    >
                        {isResetPassword ? 'Quên mật khẩu' : isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#7589a3', mb: 3, fontSize: '0.8125rem' }}>
                        {isResetPassword
                            ? 'Nhập email để nhận mã khôi phục'
                            : isLogin
                              ? 'Chào mừng bạn trở lại!'
                              : 'Tham gia OTT Education ngay hôm nay'}
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2, width: '100%', borderRadius: 2, fontSize: '0.8125rem' }}>
                            {error}
                        </Alert>
                    )}
                    {successMessage && (
                        <Alert severity="success" sx={{ mb: 2, width: '100%', borderRadius: 2, fontSize: '0.8125rem' }}>
                            {successMessage}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                        {isResetPassword ? (
                            resetEmail ? (
                                <>
                                    <ZaloTextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        label="Mã xác nhận"
                                        name="code"
                                        value={formData.code}
                                        onChange={handleChange}
                                        helperText="Nhập mã từ email"
                                        size="small"
                                    />
                                    <ZaloTextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        label="Mật khẩu mới"
                                        name="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        size="small"
                                    />
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        sx={{
                                            mt: 2.5, mb: 1.5, py: 1.25, borderRadius: 2,
                                            background: 'linear-gradient(90deg, #0068ff 0%, #00aeff 100%)',
                                            fontWeight: 600,
                                            '&:hover': { background: 'linear-gradient(90deg, #0051cc 0%, #0089cc 100%)' },
                                        }}
                                        onClick={async () => {
                                            try {
                                                const response = await fetch('/api/auth/reset-password', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ code: formData.code, password: formData.password }),
                                                });
                                                if (!response.ok) throw new Error('Reset mật khẩu thất bại');
                                                setIsResetPassword(false);
                                                setIsLogin(true);
                                                setResetEmail('');
                                                setSuccessMessage('Đổi mật khẩu thành công! Vui lòng đăng nhập.');
                                            } catch (err) {
                                                setError(err.message);
                                            }
                                        }}
                                    >
                                        Đổi mật khẩu
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <ZaloTextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        label="Email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        name="email"
                                        size="small"
                                    />
                                    <Button
                                        fullWidth
                                        variant="contained"
                                        sx={{
                                            mt: 2.5, mb: 1.5, py: 1.25, borderRadius: 2,
                                            background: 'linear-gradient(90deg, #0068ff 0%, #00aeff 100%)',
                                            fontWeight: 600,
                                            '&:hover': { background: 'linear-gradient(90deg, #0051cc 0%, #0089cc 100%)' },
                                        }}
                                        onClick={async () => {
                                            try {
                                                const response = await fetch('/api/auth/forgot-password', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ email: formData.email }),
                                                });
                                                if (!response.ok) throw new Error('Gửi mã thất bại');
                                                setResetEmail(formData.email);
                                                setSuccessMessage('Đã gửi mã đến email của bạn!');
                                            } catch (err) {
                                                setError(err.message);
                                            }
                                        }}
                                    >
                                        Gửi mã xác nhận
                                    </Button>
                                </>
                            )
                        ) : (
                            <>
                                <ZaloTextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="Tên đăng nhập"
                                    name="username"
                                    autoComplete="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AccountCircle sx={{ color: '#b0bec5', fontSize: 20 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                {!isLogin && (
                                    <>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <ZaloTextField
                                                margin="normal"
                                                required
                                                fullWidth
                                                label="Họ"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                size="small"
                                            />
                                            <ZaloTextField
                                                margin="normal"
                                                required
                                                fullWidth
                                                label="Tên"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                size="small"
                                            />
                                        </Box>
                                        <ZaloTextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            label="Email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            size="small"
                                        />
                                        <ZaloTextField
                                            margin="normal"
                                            required
                                            fullWidth
                                            label="Số điện thoại"
                                            name="phone"
                                            autoComplete="tel"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            size="small"
                                        />
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <ZaloTextField
                                                margin="normal"
                                                required
                                                fullWidth
                                                label="Giới tính"
                                                name="gender"
                                                value={formData.gender}
                                                onChange={handleChange}
                                                select
                                                SelectProps={{ native: true }}
                                                size="small"
                                            >
                                                <option value="MALE">Nam</option>
                                                <option value="FEMALE">Nữ</option>
                                                <option value="OTHER">Khác</option>
                                            </ZaloTextField>
                                            <ZaloTextField
                                                margin="normal"
                                                required
                                                fullWidth
                                                label="Ngày sinh"
                                                name="birthday"
                                                type="date"
                                                value={formData.birthday}
                                                onChange={handleChange}
                                                size="small"
                                                InputLabelProps={{ shrink: true }}
                                            />
                                        </Box>
                                    </>
                                )}

                                <ZaloTextField
                                    margin="normal"
                                    required
                                    fullWidth
                                    label="Mật khẩu"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    size="small"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock sx={{ color: '#b0bec5', fontSize: 18 }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton onClick={handleTogglePassword} edge="end" size="small">
                                                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                {!isLogin && (
                                    <ZaloTextField
                                        margin="normal"
                                        required
                                        fullWidth
                                        label="Nhập lại mật khẩu"
                                        name="confirmPassword"
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        size="small"
                                    />
                                )}

                                {isLogin && (
                                    <Box sx={{ textAlign: 'right', mt: 0.5 }}>
                                        <Link
                                            component="button"
                                            type="button"
                                            variant="caption"
                                            onClick={() => { setIsResetPassword(true); setError(''); setSuccessMessage(''); }}
                                            sx={{ color: '#7589a3', textDecoration: 'none', '&:hover': { color: '#0068ff' } }}
                                        >
                                            Quên mật khẩu?
                                        </Link>
                                    </Box>
                                )}

                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={isLoading}
                                    sx={{
                                        mt: 2,
                                        mb: 1.5,
                                        py: 1.25,
                                        borderRadius: 2,
                                        background: 'linear-gradient(90deg, #0068ff 0%, #00aeff 100%)',
                                        fontWeight: 700,
                                        fontSize: '0.9375rem',
                                        letterSpacing: '0.3px',
                                        '&:hover': {
                                            background: 'linear-gradient(90deg, #0051cc 0%, #0089cc 100%)',
                                        },
                                        '&.Mui-disabled': {
                                            background: '#e0e7ef',
                                            color: '#b0bec5',
                                        },
                                    }}
                                >
                                    {isLoading
                                        ? (isLogin ? 'Đang đăng nhập...' : 'Đang đăng ký...')
                                        : (isLogin ? 'Đăng nhập' : 'Đăng ký')}
                                </Button>
                            </>
                        )}

                        <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                            {!isResetPassword && (
                                <Link
                                    component="button"
                                    type="button"
                                    variant="body2"
                                    onClick={() => {
                                        setIsLogin(!isLogin);
                                        setError('');
                                        setSuccessMessage('');
                                    }}
                                    sx={{
                                        color: '#0068ff',
                                        fontWeight: 500,
                                        textDecoration: 'none',
                                        '&:hover': { textDecoration: 'underline' },
                                    }}
                                >
                                    {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
                                </Link>
                            )}
                            {isResetPassword && (
                                <Link
                                    component="button"
                                    type="button"
                                    variant="body2"
                                    onClick={() => { setIsResetPassword(false); setResetEmail(''); setError(''); setSuccessMessage(''); }}
                                    sx={{ color: '#7589a3', textDecoration: 'none', '&:hover': { color: '#0068ff' } }}
                                >
                                    Quay lại đăng nhập
                                </Link>
                            )}
                        </Box>
                    </Box>
                </AuthPaper>
            </AuthContainer>
        </ThemeProvider>
    );
};

export default Login;

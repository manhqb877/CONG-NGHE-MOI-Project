import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Modal,
  Fade,
  Backdrop,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import { updatePassword } from '../../api/user';
import { BiLockAlt, BiLogOut, BiArrowBack, BiX } from 'react-icons/bi';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 0,
  overflow: 'hidden',
};

const SettingsPanel = ({ open, onClose, onLogout }) => {
  const [view, setView] = useState('main'); // 'main' | 'change-password'

  const handleUpdatePassword = async () => {
    const currentPassword =
      document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword =
      document.getElementById('confirmPassword').value;

    if (newPassword !== confirmPassword) {
      alert('Mật khẩu mới không khớp');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const isMaxLength = newPassword.length <= 10;

    // Note: Logic này có vẻ ngược, thường là min length, không phải max length <= 10.
    // Nhưng giữ nguyên logic cũ của người dùng nếu họ muốn vậy, hoặc sửa lại cho hợp lý hơn.
    // Logic cũ: if (!hasUpperCase || !isMaxLength) -> alert(...)
    // Nghĩa là BẮT BUỘC có chữ hoa và ĐỘ DÀI <= 10. (hơi lạ với mật khẩu, thường là >= 8)
    // Tạm thời giữ nguyên logic validation cũ để tránh breaking change không mong muốn, 
    // hoặc user có quy tắc riêng.

    if (!hasUpperCase || !isMaxLength) {
      alert(
        'Mật khẩu phải có ít nhất 1 ký tự in hoa và tối đa 10 ký tự',
      );
      return;
    }

    try {
      const result = await updatePassword(currentPassword, newPassword);
      if (result) {
        alert('Cập nhật mật khẩu thành công');
        setView('main');
        // Có thể clear input ở đây nếu muốn
      } else {
        alert('Cập nhật mật khẩu thất bại');
      }
    } catch (error) {
      alert('Đã xảy ra lỗi khi cập nhật mật khẩu');
    }
  };

  const renderMainView = () => (
    <Box>
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Cài đặt
        </Typography>
        <IconButton onClick={onClose} size="small">
          <BiX size={24} />
        </IconButton>
      </Box>
      <List sx={{ pt: 0 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={() => setView('change-password')}>
            <ListItemIcon>
              <BiLockAlt size={24} />
            </ListItemIcon>
            <ListItemText
              primary="Đổi mật khẩu"
              secondary="Thay đổi mật khẩu đăng nhập"
            />
          </ListItemButton>
        </ListItem>
        <Divider />
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => {
              if (
                window.confirm(
                  'Bạn có chắc chắn muốn đăng xuất?',
                )
              ) {
                onLogout();
              }
            }}
            sx={{ color: 'error.main' }}
          >
            <ListItemIcon sx={{ color: 'error.main' }}>
              <BiLogOut size={24} />
            </ListItemIcon>
            <ListItemText primary="Đăng xuất" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  const renderChangePasswordView = () => (
    <Box sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton
          onClick={() => setView('main')}
          sx={{ mr: 1, ml: -1 }}
        >
          <BiArrowBack />
        </IconButton>
        <Typography variant="h6">Đổi mật khẩu</Typography>
      </Box>

      <TextField
        fullWidth
        type="password"
        label="Mật khẩu hiện tại"
        margin="normal"
        id="currentPassword"
        size="small"
      />
      <TextField
        fullWidth
        type="password"
        label="Mật khẩu mới"
        margin="normal"
        id="newPassword"
        size="small"
        helperText="Tối đa 10 ký tự, ít nhất 1 chữ hoa"
      />
      <TextField
        fullWidth
        type="password"
        label="Nhập lại mật khẩu mới"
        margin="normal"
        id="confirmPassword"
        size="small"
      />
      <Box mt={3} display="flex" justifyContent="flex-end" gap={1}>
        <Button variant="outlined" onClick={() => setView('main')}>
          Hủy
        </Button>
        <Button variant="contained" onClick={handleUpdatePassword}>
          Cập nhật
        </Button>
      </Box>
    </Box>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: { timeout: 300 },
      }}
    >
      <Fade in={open}>
        <Box sx={style}>
          {view === 'main'
            ? renderMainView()
            : renderChangePasswordView()}
        </Box>
      </Fade>
    </Modal>
  );
};

export default SettingsPanel;

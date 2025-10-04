import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
  Chip,
} from '@mui/material';
import {
  AccountCircle,
  Dashboard,
  Campaign,
  Business,
  MonetizationOn,
  Token,
  Receipt,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleClose();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'error';
      case 'ADMIN':
        return 'warning';
      case 'USER':
        return 'primary';
      case 'CUSTOMER':
        return 'success';
      default:
        return 'default';
    }
  };

  const navigationItems = [
    { label: 'Dashboard', path: '/', icon: <Dashboard /> },
    { label: 'Campaigns', path: '/campaigns', icon: <Campaign /> },
    { label: 'Charities', path: '/charities', icon: <Business /> },
    { label: 'Tokens', path: '/tokens', icon: <Token /> },
    { label: 'Transactions', path: '/transactions', icon: <Receipt /> },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{ flexGrow: 1, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          CharityChain
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
              }}
            >
              {item.label}
            </Button>
          ))}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={user?.role || 'USER'}
              color={getRoleColor(user?.role || 'USER')}
              size="small"
              variant="outlined"
            />
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="subtitle2">
                  {user?.first_name} {user?.last_name}
                </Typography>
              </MenuItem>
              <MenuItem disabled>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <AccountCircle sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

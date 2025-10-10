import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Avatar,
  Link,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from '@mui/material';
import { LockOutlined, Business, AccountBalanceWallet, Person } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LoginRequest } from '../../types';
import WalletLogin from './WalletLogin';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginType, setLoginType] = useState<'donor' | 'charity-manager'>('donor');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    setLoading(true);
    setError(null);

    try {
      await login(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newLoginType: 'donor' | 'charity-manager' | null,
  ) => {
    if (newLoginType !== null) {
      setLoginType(newLoginType);
      setError(null);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <Business />
          </Avatar>
          
          <Typography component="h1" variant="h4" gutterBottom>
            CharityChain
          </Typography>
          
          <Typography component="h2" variant="h5" gutterBottom>
            Sign In
          </Typography>
          
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Welcome back! Please sign in to your account.
          </Typography>

          {/* Login Type Toggle */}
          <Box sx={{ width: '100%', mb: 3 }}>
            <ToggleButtonGroup
              value={loginType}
              exclusive
              onChange={handleLoginTypeChange}
              aria-label="login type"
              fullWidth
              size="large"
            >
              <ToggleButton value="donor" aria-label="donor">
                <AccountBalanceWallet sx={{ mr: 1 }} />
                Donor
              </ToggleButton>
              <ToggleButton value="charity-manager" aria-label="charity manager">
                <Person sx={{ mr: 1 }} />
                Charity Manager
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <Divider sx={{ width: '100%', mb: 3 }} />

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Conditional Login Forms */}
          {loginType === 'donor' ? (
            <WalletLogin />
          ) : (
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    autoComplete="email"
                    autoFocus
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
              
              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    margin="normal"
                    required
                    fullWidth
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />
                )}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <LockOutlined />}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{' '}
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => {
                      // For now, just show an alert since registration isn't implemented in backend
                      alert('Registration is currently handled by administrators. Please contact support.');
                    }}
                    sx={{ textDecoration: 'none' }}
                  >
                    Contact Support
                  </Link>
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginForm;

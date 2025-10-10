import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { ConnectButton, useActiveAccount, useDisconnect, useActiveWallet } from 'thirdweb/react';
import { client, wallets } from '../../config/thirdweb';
import { useAuth } from '../../contexts/AuthContext';
import { WalletLoginRequest } from '../../types';

const WalletLogin: React.FC = () => {
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [profileData, setProfileData] = useState({
    email: '',
    first_name: '',
    last_name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { walletLogin, justLoggedOut } = useAuth();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  // On wallet connect: try login without profile data first. If backend requires profile, then show form.
  useEffect(() => {
    const tryAutoLogin = async () => {
      if (!account) return;
      // Don't auto-login if user just logged out
      if (justLoggedOut) return;
      // Avoid looping
      if (loading) return;
      setError(null);
      try {
        setLoading(true);
        // Attempt login without email; backend will return requires_profile for new users
        await walletLogin({ wallet_address: account.address, email: '' });
        // Success → user is logged in; no need to show form
        setShowProfileForm(false);
      } catch (err: any) {
        if (err?.requires_profile) {
          setShowProfileForm(true);
        } else {
          // Show generic error but keep the option to complete profile
          setError('Wallet login failed. Please complete your profile.');
          setShowProfileForm(true);
        }
      } finally {
        setLoading(false);
      }
    };

    tryAutoLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.address, justLoggedOut]);

  // Disconnect wallet when user logs out
  useEffect(() => {
    if (justLoggedOut && wallet) {
      disconnect(wallet);
      setShowProfileForm(false);
      setProfileData({ email: '', first_name: '', last_name: '' });
      setError(null);
    }
  }, [justLoggedOut, wallet, disconnect]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setLoading(true);
    setError(null);

    try {
      const loginData: WalletLoginRequest = {
        wallet_address: account.address,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name,
      };

      await walletLogin(loginData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    if (wallet) {
      disconnect(wallet);
    }
    setShowProfileForm(false);
    setProfileData({ email: '', first_name: '', last_name: '' });
    setError(null);
  };

  if (showProfileForm && account) {
    return (
      <Paper elevation={3} sx={{ p: 4, maxWidth: 400, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom align="center">
          Complete Your Profile
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
          Wallet: {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleProfileSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={profileData.email}
            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="First Name"
            value={profileData.first_name}
            onChange={(e) => setProfileData({ ...profileData, first_name: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Last Name"
            value={profileData.last_name}
            onChange={(e) => setProfileData({ ...profileData, last_name: e.target.value })}
            margin="normal"
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleDisconnect}
              disabled={loading}
            >
              Cancel
            </Button>
          </Box>
        </form>
      </Paper>
    );
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        Connect Your Wallet
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose your preferred wallet to continue
      </Typography>

      <ConnectButton
        client={client}
        connectModal={{ size: "compact" }}
        wallets={wallets}
      />

      {account && !showProfileForm && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
            Wallet connected! Please complete your profile.
          </Typography>
          <Button
            variant="contained"
            onClick={() => setShowProfileForm(true)}
            size="small"
          >
            Complete Profile
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default WalletLogin;

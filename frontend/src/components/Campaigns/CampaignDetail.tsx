import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Campaign,
  Business,
  AttachMoney,
  People,
  CalendarToday,
  TrendingUp,
  Receipt,
  Add,
  Timeline,
  OpenInNew,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import apiService from '../../services/api';
import { Campaign as CampaignType, DonationCreate, CampaignStatus, UserRole } from '../../types';
import CampaignEventsList from './CampaignEventsList';
import CreateEventDialog from './CreateEventDialog';
import { getTransactionUrl } from '../../utils/blockchain';

const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [donateDialogOpen, setDonateDialogOpen] = useState(false);
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [donationError, setDonationError] = useState<string | null>(null);
  const [createEventDialogOpen, setCreateEventDialogOpen] = useState(false);

  const {
    data: campaign,
    isLoading: campaignLoading,
    error: campaignError,
  } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => apiService.getCampaign(id!),
    enabled: !!id,
  });

  const { data: donations, isLoading: donationsLoading } = useQuery({
    queryKey: ['campaign-donations', id],
    queryFn: () => apiService.getCampaignDonations(id!),
    enabled: !!id,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['campaign-stats', id],
    queryFn: () => apiService.getCampaignStats(id!),
    enabled: !!id,
  });

  const { data: tokens } = useQuery({
    queryKey: ['tokens'],
    queryFn: () => apiService.getTokens(),
  });

  const { data: utilization } = useQuery({
    queryKey: ['campaign-utilization', id],
    queryFn: () => apiService.getCampaignUtilization(id!),
    enabled: !!id,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => apiService.getCurrentUser(),
  });

  const donateMutation = useMutation({
    mutationFn: (donationData: DonationCreate) =>
      apiService.donateToCampaign(id!, donationData),
    onSuccess: () => {
      // Invalidate campaign-specific queries
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      queryClient.invalidateQueries({ queryKey: ['campaign-stats', id] });
      queryClient.invalidateQueries({ queryKey: ['campaign-donations', id] });
      
      // Invalidate dashboard and list queries
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['charities'] });
      queryClient.invalidateQueries({ queryKey: ['donation-stats'] });
      
      setDonationSuccess(true);
      setDonationError(null);
      reset({ amount: 0, token: '', token_quantity: 0 });
      setTimeout(() => {
        setDonateDialogOpen(false);
        setDonationSuccess(false);
      }, 2000);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          Object.values(error.response?.data || {}).flat().join(', ') ||
                          'Failed to process donation. Please try again.';
      setDonationError(errorMessage);
      setDonationSuccess(false);
    },
  });

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      amount: 0,
      token: '',
      token_quantity: 0,
    },
  });

  const donationType = watch('token');

  const onSubmit = (data: any) => {
    setDonationError(null);
    setDonationSuccess(false);

    // Validate inputs
    if (!donationType && (!data.amount || data.amount <= 0)) {
      setDonationError('Please enter a valid donation amount');
      return;
    }

    if (donationType && (!data.token_quantity || data.token_quantity <= 0)) {
      setDonationError('Please enter a valid token quantity');
      return;
    }

    const donationData: DonationCreate = {
      campaign: id!,
    };

    if (donationType && data.token_quantity) {
      donationData.token = data.token;
      donationData.token_quantity = Number(data.token_quantity);
    } else {
      donationData.amount = Number(data.amount);
    }

    donateMutation.mutate(donationData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'upcoming':
        return 'info';
      case 'completed':
        return 'success';
      case 'ended':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      case 'ended':
        return 'Ended';
      default:
        return 'Unknown';
    }
  };

  const canDonate = (status: string) => {
    return status === 'active';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (campaignLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (campaignError || !campaign) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Campaign not found or failed to load.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Back Button */}
      <Button
        onClick={() => navigate('/campaigns')}
        sx={{ mb: 2 }}
      >
        ← Back to Campaigns
      </Button>

      <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={3}>
        {/* Main Campaign Info */}
        <Box flex={2}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                <Box>
                  <Typography variant="h4" gutterBottom>
                    {campaign.title}
                  </Typography>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Business sx={{ mr: 1, color: 'text.secondary' }} />
                    <Typography variant="h6" color="text.secondary">
                      {campaign.charity.name}
                    </Typography>
                    <Chip
                      label={getStatusLabel(stats?.status || 'unknown')}
                      color={getStatusColor(stats?.status || 'unknown') as any}
                      sx={{ ml: 2 }}
                    />
                    {campaign.on_chain_id && campaign.transaction_hash && (
                      <Button
                        size="small"
                        startIcon={<OpenInNew />}
                        onClick={() => window.open(getTransactionUrl(campaign.transaction_hash!), '_blank')}
                        sx={{ ml: 2, minWidth: 'auto' }}
                      >
                        View on Sepolia
                      </Button>
                    )}
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AttachMoney />}
                  onClick={() => setDonateDialogOpen(true)}
                  disabled={!canDonate(stats?.status || 'unknown')}
                >
                  {canDonate(stats?.status || 'unknown') ? 'Donate Now' : 'Campaign Completed'}
                </Button>
              </Box>

              <Typography variant="body1" paragraph>
                {campaign.description}
              </Typography>

              {/* Progress */}
              <Box mb={3}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2" color="text.secondary">
                    Progress
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {campaign.progress_percentage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={campaign.progress_percentage}
                  sx={{ height: 12, borderRadius: 6, mb: 1 }}
                />
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="h5" color="primary">
                    {formatCurrency(campaign.raised_amount)}
                  </Typography>
                  <Typography variant="h5">
                    {formatCurrency(campaign.goal_amount)}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">
                    raised
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    goal
                  </Typography>
                </Box>
              </Box>

              {/* Campaign Details */}
              <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
                <Box flex="1" minWidth="150px" textAlign="center">
                  <Typography variant="h6" color="primary">
                    {stats?.total_donations || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Donations
                  </Typography>
                </Box>
                <Box flex="1" minWidth="150px" textAlign="center">
                  <Typography variant="h6" color="primary">
                    {stats?.unique_donors || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Unique Donors
                  </Typography>
                </Box>
                <Box flex="1" minWidth="150px" textAlign="center">
                  <Typography variant="h6" color="primary">
                    {stats?.days_remaining || 0}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Days Remaining
                  </Typography>
                </Box>
                <Box flex="1" minWidth="150px" textAlign="center">
                  <CalendarToday sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    Ends {formatDate(campaign.end_date)}
                  </Typography>
                </Box>
              </Box>

              {/* Campaign Timeline */}
              <Box>
                <Typography variant="h6" gutterBottom>
                  Campaign Timeline
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Started
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(campaign.start_date)}
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ color: 'text.secondary' }} />
                  <Box textAlign="right">
                    <Typography variant="body2" color="text.secondary">
                      Ends
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(campaign.end_date)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Sidebar */}
        <Box flex={1}>
          {/* Recent Donations */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Donations
              </Typography>
              
              {donationsLoading ? (
                <CircularProgress />
              ) : (
                <List>
                  {donations?.slice(0, 5).map((donation, index) => (
                    <React.Fragment key={donation.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            {donation.user_email?.charAt(0) || 'A'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body2" fontWeight="bold">
                                {donation.user_email} 
                              </Typography>
                              <Typography variant="body2" color="primary">
                                {donation.amount ? formatCurrency(donation.amount) : `${donation.token_quantity} tokens`}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              {donation.donation_timestamp && formatDateTime(donation.donation_timestamp)}
                            </Typography>
                          }
                        />
                      </ListItem>
                      {index < 4 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
              
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {/* Navigate to all donations */}}
                sx={{ mt: 2 }}
              >
                View All Donations
              </Button>
            </CardContent>
          </Card>

          {/* Fund Allocation Events - Only for completed/ended campaigns */}
          {(campaign?.status === CampaignStatus.COMPLETED || campaign?.status === CampaignStatus.ENDED) && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">
                    <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Fund Allocation
                  </Typography>
                  {currentUser?.role === UserRole.CHARITY_MANAGER && (
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setCreateEventDialogOpen(true)}
                      size="small"
                    >
                      Allocate Funds
                    </Button>
                  )}
                </Box>
                
                <CampaignEventsList
                  campaignId={id!}
                  isCharityManager={currentUser?.role === UserRole.CHARITY_MANAGER}
                  raisedAmount={campaign?.raised_amount || 0}
                />
              </CardContent>
            </Card>
          )}

          {/* Charity Info */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                About {campaign.charity.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {campaign.charity.description}
              </Typography>
              
              {campaign.charity.website && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => window.open(campaign.charity.website, '_blank')}
                  sx={{ mb: 1 }}
                >
                  Visit Website
                </Button>
              )}
              
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate(`/charities/${campaign.charity.id}`)}
              >
                View Charity
              </Button>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Donation Dialog */}
      <Dialog
        open={donateDialogOpen}
        onClose={() => setDonateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Make a Donation</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            {donationSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Donation successful! Thank you for your contribution.
              </Alert>
            )}
            
            {donationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {donationError}
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Donation Type</InputLabel>
              <Controller
                name="token"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="Donation Type"
                    onChange={(e) => {
                      field.onChange(e);
                      reset({ token: e.target.value, amount: 0, token_quantity: 0 });
                    }}
                  >
                    <MenuItem value="">
                      <em>Fiat Currency (USD)</em>
                    </MenuItem>
                    {tokens?.results?.map((token) => (
                      <MenuItem key={token.id} value={token.id}>
                        {token.name} ({token.token_id})
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>

            {!donationType ? (
              <Controller
                name="amount"
                control={control}
                rules={{
                  required: 'Donation amount is required',
                  min: { value: 1, message: 'Amount must be at least $1' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Amount (USD)"
                    type="number"
                    error={!!errors.amount}
                    helperText={errors.amount?.message}
                    placeholder="Enter amount (e.g., 50)"
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    }}
                    inputProps={{ min: 1, step: 1 }}
                  />
                )}
              />
            ) : (
              <Controller
                name="token_quantity"
                control={control}
                rules={{
                  required: 'Token quantity is required',
                  min: { value: 1, message: 'Quantity must be at least 1' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    label="Token Quantity"
                    type="number"
                    error={!!errors.token_quantity}
                    helperText={errors.token_quantity?.message}
                    placeholder="Enter token quantity (e.g., 10)"
                    inputProps={{ min: 1, step: 1 }}
                  />
                )}
              />
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDonateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={donateMutation.isPending}
              startIcon={donateMutation.isPending ? <CircularProgress size={20} /> : <AttachMoney />}
            >
              {donateMutation.isPending ? 'Processing...' : 'Donate'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Create Event Dialog */}
      <CreateEventDialog
        open={createEventDialogOpen}
        onClose={() => setCreateEventDialogOpen(false)}
        campaignId={id!}
        raisedAmount={campaign?.raised_amount || 0}
        utilization={utilization}
      />
    </Box>
  );
};

export default CampaignDetail;

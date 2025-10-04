import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
} from '@mui/material';
import {
  Campaign,
  Business,
  AttachMoney,
  TrendingUp,
  People,
  Receipt,
  Token,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: campaigns, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns', 'recent'],
    queryFn: () => apiService.getCampaigns({ ordering: '-created_at' }),
  });

  const { data: charities, isLoading: charitiesLoading } = useQuery({
    queryKey: ['charities'],
    queryFn: () => apiService.getCharities({ ordering: '-created_at' }),
  });

  const { data: donationStats, isLoading: statsLoading } = useQuery({
    queryKey: ['donation-stats'],
    queryFn: () => apiService.getMyDonationStats(),
    enabled: !!user,
  });

  const { data: transactionStats, isLoading: transactionStatsLoading } = useQuery({
    queryKey: ['transaction-stats'],
    queryFn: () => apiService.getTransactionStats(),
  });

  const statsCards = [
    {
      title: 'Total Campaigns',
      value: campaigns?.count || 0,
      icon: <Campaign />,
      color: '#1976d2',
      path: '/campaigns',
    },
    {
      title: 'Active Charities',
      value: charities?.count || 0,
      icon: <Business />,
      color: '#388e3c',
      path: '/charities',
    },
    {
      title: 'Total Donations',
      value: donationStats?.total_donations || 0,
      icon: <AttachMoney />,
      color: '#f57c00',
      path: '/donations',
    },
    {
      title: 'Blockchain Transactions',
      value: transactionStats?.total_transactions || 0,
      icon: <Token />,
      color: '#7b1fa2',
      path: '/transactions',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'upcoming':
        return 'info';
      case 'ended':
        return 'default';
      default:
        return 'default';
    }
  };

  const getCampaignStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start) return 'upcoming';
    if (now > end) return 'ended';
    return 'active';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.first_name || user?.email}!
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Here's what's happening in your charity platform
      </Typography>

      {/* Stats Cards */}
      <Box display="flex" flexWrap="wrap" gap={3} sx={{ mb: 4 }}>
        {statsCards.map((stat, index) => (
          <Box key={index} flex="1" minWidth="250px">
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' },
              }}
              onClick={() => navigate(stat.path)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="h6">
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stat.value.toLocaleString()}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3}>
        {/* Recent Campaigns */}
        <Box flex={2}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Recent Campaigns</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/campaigns')}
                >
                  View All
                </Button>
              </Box>
              
              {campaignsLoading ? (
                <LinearProgress />
              ) : (
                <List>
                  {campaigns?.results?.slice(0, 5).map((campaign, index) => {
                    const status = getCampaignStatus(campaign.start_date, campaign.end_date);
                    return (
                      <React.Fragment key={campaign.id}>
                        <ListItem
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/campaigns/${campaign.id}`)}
                        >
                          <ListItemAvatar>
                            <Avatar>
                              <Campaign />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={campaign.title}
                            secondary={
                              <Box>
                                <Typography variant="body2" color="text.secondary">
                                  {campaign.charity_name}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1} mt={1}>
                                  <LinearProgress
                                    variant="determinate"
                                    value={campaign.progress_percentage}
                                    sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                                  />
                                  <Typography variant="caption">
                                    {campaign.progress_percentage}%
                                  </Typography>
                                  <Chip
                                    label={status}
                                    color={getStatusColor(status) as any}
                                    size="small"
                                  />
                                </Box>
                                <Typography variant="caption" color="text.secondary">
                                  ${campaign.raised_amount.toLocaleString()} of ${campaign.goal_amount.toLocaleString()}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < 4 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* My Donation Stats */}
        <Box flex={1}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Donation Impact
              </Typography>
              
              {statsLoading ? (
                <LinearProgress />
              ) : (
                <Box>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AttachMoney sx={{ mr: 1, color: 'success.main' }} />
                    <Typography variant="h5">
                      ${donationStats?.total_amount_donated?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Donated
                  </Typography>
                  
                  <Box mt={2}>
                    <Typography variant="body2">
                      <strong>{donationStats?.total_donations || 0}</strong> donations made
                    </Typography>
                    <Typography variant="body2">
                      <strong>{donationStats?.campaigns_supported || 0}</strong> campaigns supported
                    </Typography>
                    <Typography variant="body2">
                      <strong>{donationStats?.charities_supported || 0}</strong> charities helped
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ mt: 2 }}
                    onClick={() => navigate('/campaigns')}
                  >
                    Make a Donation
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;

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
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search,
  Campaign,
  Business,
  AttachMoney,
  People,
  CalendarToday,
  FilterList,
  Add,
  OpenInNew,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import apiService from '../../services/api';
import { CampaignList as CampaignListType, CampaignStatus } from '../../types';
import { getTransactionUrl } from '../../utils/blockchain';

const CampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [progressFilter, setProgressFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['campaigns', { search, statusFilter, progressFilter, page }],
    queryFn: () =>
      apiService.getCampaigns({
        search: search || undefined,
        status: statusFilter as 'active' | 'upcoming' | 'ended' | undefined,
        progress: progressFilter as 'completed' | 'active' | undefined,
        ordering: '-created_at',
      }),
  });

  const getStatusColor = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.ACTIVE:
        return 'success';
      case CampaignStatus.UPCOMING:
        return 'info';
      case CampaignStatus.COMPLETED:
        return 'success';
      case CampaignStatus.ENDED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: CampaignStatus) => {
    switch (status) {
      case CampaignStatus.ACTIVE:
        return 'Active';
      case CampaignStatus.UPCOMING:
        return 'Upcoming';
      case CampaignStatus.COMPLETED:
        return 'Completed';
      case CampaignStatus.ENDED:
        return 'Ended';
      default:
        return 'Unknown';
    }
  };

  const canDonate = (status: CampaignStatus) => {
    return status === CampaignStatus.ACTIVE;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load campaigns. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Campaigns</Typography>
        {hasRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CHARITY_MANAGER]) && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/campaigns/new')}
          >
            Create Campaign
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
            <Box flex="1" minWidth="200px">
              <TextField
                fullWidth
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Box flex="1" minWidth="150px">
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="upcoming">Upcoming</MenuItem>
                  <MenuItem value="ended">Ended</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box flex="1" minWidth="150px">
              <FormControl fullWidth>
                <InputLabel>Progress</InputLabel>
                <Select
                  value={progressFilter}
                  label="Progress"
                  onChange={(e) => setProgressFilter(e.target.value)}
                >
                  <MenuItem value="">All Progress</MenuItem>
                  <MenuItem value="active">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box minWidth="120px">
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterList />}
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setProgressFilter('');
                }}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Campaigns Grid */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box display="flex" flexWrap="wrap" gap={3}>
            {campaigns?.results?.map((campaign) => {
              const canMakeDonation = canDonate(campaign.status);
              return (
                <Box key={campaign.id} flex="1" minWidth="300px" maxWidth="400px">
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => navigate(`/campaigns/${campaign.id}`)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                        <Typography variant="h6" component="h2" noWrap>
                          {campaign.title}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={getStatusLabel(campaign.status)}
                            color={getStatusColor(campaign.status) as any}
                            size="small"
                          />
                          {campaign.on_chain_id && campaign.transaction_hash && (
                            <Button
                              size="small"
                              startIcon={<OpenInNew />}
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(getTransactionUrl(campaign.transaction_hash!), '_blank');
                              }}
                              sx={{ minWidth: 'auto', p: 0.5 }}
                            >
                              Sepolia
                            </Button>
                          )}
                        </Box>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {campaign.description}
                      </Typography>

                      <Box display="flex" alignItems="center" mb={1}>
                        <Business sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {campaign.charity_name}
                        </Typography>
                      </Box>

                      <Box mb={2}>
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
                          sx={{ height: 8, borderRadius: 4 }}
                        />
                      </Box>

                      <Box display="flex" justifyContent="space-between" mb={2}>
                        <Box>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(campaign.raised_amount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            raised
                          </Typography>
                        </Box>
                        <Box textAlign="right">
                          <Typography variant="h6">
                            {formatCurrency(campaign.goal_amount)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            goal
                          </Typography>
                        </Box>
                      </Box>

                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" alignItems="center">
                          <People sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {campaign.donations_count} donors
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <CalendarToday sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            Ends {formatDate(campaign.end_date)}
                          </Typography>
                        </Box>
                      </Box>

                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<AttachMoney />}
                        disabled={!canMakeDonation}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/campaigns/${campaign.id}`);
                        }}
                      >
                        {canMakeDonation ? 'View & Donate' : 'View Campaign'}
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              );
            })}
          </Box>

          {/* Pagination */}
          {campaigns && campaigns.count > 0 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={Math.ceil(campaigns.count / 12)}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}

          {campaigns?.results?.length === 0 && (
            <Box textAlign="center" py={8}>
              <Campaign sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No campaigns found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search criteria or create a new campaign.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default CampaignsPage;

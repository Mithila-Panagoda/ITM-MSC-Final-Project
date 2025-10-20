import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Paper,
  CircularProgress,
  Button,
} from '@mui/material';
import {
  AttachMoney,
  CalendarToday,
  Person,
  Image as ImageIcon,
  Warning,
  CheckCircle,
  Cancel,
  OpenInNew,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import apiService from '../../services/api';
import { CampaignEvent, CampaignUtilization } from '../../types';
import { getTransactionUrl } from '../../utils/blockchain';

interface CampaignEventsListProps {
  campaignId: string;
  isCharityManager: boolean;
  raisedAmount: number;
}

const CampaignEventsList: React.FC<CampaignEventsListProps> = ({
  campaignId,
  isCharityManager,
  raisedAmount,
}) => {
  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
  } = useQuery({
    queryKey: ['campaign-events', campaignId],
    queryFn: () => apiService.getCampaignEvents(campaignId),
    enabled: !!campaignId,
  });

  const {
    data: utilization,
    isLoading: utilizationLoading,
  } = useQuery({
    queryKey: ['campaign-utilization', campaignId],
    queryFn: () => apiService.getCampaignUtilization(campaignId),
    enabled: !!campaignId,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle />;
      case 'PENDING':
        return <Warning />;
      case 'CANCELLED':
        return <Cancel />;
      default:
        return <Warning />;
    }
  };

  const getUtilizationColor = (percentage: any) => {
    const num = typeof percentage === 'number' && !isNaN(percentage) ? percentage : 0;
    if (num < 50) return 'error';
    if (num < 80) return 'warning';
    if (num < 95) return 'info';
    return 'success';
  };

  const getUtilizationMessage = (percentage: any) => {
    const num = typeof percentage === 'number' && !isNaN(percentage) ? percentage : 0;
    if (num < 50) return 'Funds are under-utilized. Consider allocating more funds to campaign activities.';
    if (num < 80) return 'Good fund utilization. Continue monitoring allocation.';
    if (num < 95) return 'Excellent fund utilization. Almost fully allocated.';
    return 'Funds are fully utilized. All campaign funds have been allocated.';
  };

  const safeFormatPercentage = (value: any) => {
    const num = typeof value === 'number' && !isNaN(value) ? value : 0;
    return num.toFixed(1);
  };

  const safeGetNumber = (value: any, fallback: number = 0) => {
    if (typeof value === 'number' && !isNaN(value)) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return !isNaN(parsed) ? parsed : fallback;
    }
    return fallback;
  };

  if (eventsLoading || utilizationLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (eventsError) {
    return (
      <Alert severity="error">
        Failed to load campaign events. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Utilization Metrics Card */}
      {utilization && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Fund Utilization Overview
            </Typography>
            
            <Box 
              display="grid" 
              gridTemplateColumns={{ xs: '1fr', md: 'repeat(4, 1fr)' }} 
              gap={3}
            >
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  ${safeGetNumber(raisedAmount).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Raised
                </Typography>
              </Box>
              
              <Box textAlign="center">
                <Typography variant="h4" color="success.main">
                  ${safeGetNumber(utilization.total_allocated).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Allocated
                </Typography>
              </Box>
              
              <Box textAlign="center">
                <Typography 
                  variant="h4" 
                  color={safeGetNumber(utilization.remaining_funds) > 0 ? 'info.main' : 'success.main'}
                >
                  ${safeGetNumber(utilization.remaining_funds).toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Remaining Funds
                </Typography>
              </Box>
              
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {safeFormatPercentage(utilization.utilization_percentage)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Utilization
                </Typography>
              </Box>
            </Box>

            {/* Utilization Progress Bar */}
            <Box mt={2}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Fund Utilization</Typography>
                <Typography variant="body2">
                  {safeFormatPercentage(utilization.utilization_percentage)}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={safeGetNumber(utilization.utilization_percentage)}
                color={getUtilizationColor(utilization.utilization_percentage)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {/* Utilization Message */}
            <Alert 
              severity={getUtilizationColor(utilization.utilization_percentage) as any}
              sx={{ mt: 2 }}
            >
              {getUtilizationMessage(utilization.utilization_percentage)}
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Events List */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Fund Allocation Events ({events?.length || 0})
            </Typography>
          </Box>

          {!events || events.length === 0 ? (
            <Box textAlign="center" py={4}>
              <AttachMoney sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No Fund Allocations Yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {isCharityManager 
                  ? 'Start allocating funds to campaign activities by creating your first event.'
                  : 'Fund allocation events will appear here once the charity manager starts allocating funds.'
                }
              </Typography>
            </Box>
          ) : (
            <List>
              {events.map((event, index) => (
                <React.Fragment key={event.id}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {event.image_url ? (
                          <img 
                            src={event.image_url} 
                            alt={event.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <ImageIcon />
                        )}
                      </Avatar>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6" component="span">
                            {event.title}
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip
                              icon={getStatusIcon(event.status)}
                              label={event.status}
                              color={getStatusColor(event.status) as any}
                              size="small"
                            />
                            <Typography variant="h6" color="primary">
                              ${safeGetNumber(event.amount).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {event.description}
                          </Typography>
                          
                          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <CalendarToday fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary">
                                {dayjs(event.event_date).format('MMM DD, YYYY')}
                              </Typography>
                            </Box>
                            
                            <Box display="flex" alignItems="center" gap={0.5}>
                              <Person fontSize="small" color="action" />
                              <Typography variant="caption" color="text.secondary">
                                {event.created_by_name}
                              </Typography>
                            </Box>
                            
                            {event.transaction_hash && (
                              <Button
                                size="small"
                                startIcon={<OpenInNew />}
                                onClick={() => window.open(getTransactionUrl(event.transaction_hash!), '_blank')}
                                sx={{ minWidth: 'auto', p: 0.5 }}
                              >
                                View on Sepolia
                              </Button>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  
                  {index < events.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CampaignEventsList;

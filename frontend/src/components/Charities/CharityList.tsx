import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  InputAdornment,
  Pagination,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Search,
  Business,
  Campaign,
  AttachMoney,
  Language,
  Email,
  Add,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import apiService from '../../services/api';

const CharitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: charities, isLoading, error } = useQuery({
    queryKey: ['charities', { search, page }],
    queryFn: () =>
      apiService.getCharities({
        search: search || undefined,
        ordering: '-created_at',
      }),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load charities. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Charities</Typography>
        {hasRole([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CHARITY_MANAGER]) && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/charities/new')}
          >
            Add Charity
          </Button>
        )}
      </Box>

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Search charities..."
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
        </CardContent>
      </Card>

      {/* Charities Grid */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box display="flex" flexWrap="wrap" gap={3}>
            {charities?.results?.map((charity) => (
              <Box key={charity.id} flex="1" minWidth="300px" maxWidth="400px">
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
                  onClick={() => navigate(`/charities/${charity.id}`)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          width: 56,
                          height: 56,
                          mr: 2,
                        }}
                      >
                        <Business />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="h2">
                          {charity.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {charity.contact_email}
                        </Typography>
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
                      {charity.description}
                    </Typography>

                    <Box display="flex" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center">
                        <Campaign sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {charity.campaigns_count} campaigns
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center">
                        <AttachMoney sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {formatCurrency(charity.total_raised)}
                        </Typography>
                      </Box>
                    </Box>

                    {charity.contract_address && (
                      <Chip
                        label="Blockchain Enabled"
                        color="success"
                        size="small"
                        sx={{ mb: 2 }}
                      />
                    )}

                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Campaign />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/charities/${charity.id}/campaigns`);
                        }}
                      >
                        Campaigns
                      </Button>
                      {charity.website && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Language />}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(charity.website, '_blank');
                          }}
                        >
                          Website
                        </Button>
                      )}
                    </Box>
                  </CardContent>
                  </Card>
                </Box>
              ))}
          </Box>

          {/* Pagination */}
          {charities && charities.count > 0 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={Math.ceil(charities.count / 12)}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}

          {charities?.results?.length === 0 && (
            <Box textAlign="center" py={8}>
              <Business sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No charities found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search criteria or add a new charity.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default CharitiesPage;

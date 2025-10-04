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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Search,
  Token,
  AttachMoney,
  TrendingUp,
  Business,
  Receipt,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

const TokensPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [charityFilter, setCharityFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: tokens, isLoading, error } = useQuery({
    queryKey: ['tokens', { search, charityFilter, page }],
    queryFn: () =>
      apiService.getTokens({
        search: search || undefined,
        charity: charityFilter || undefined,
        ordering: 'name',
      }),
  });

  const { data: charities } = useQuery({
    queryKey: ['charities'],
    queryFn: () => apiService.getCharities(),
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatLKR = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount);
  };

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load tokens. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Tokens</Typography>
        <Button
          variant="contained"
          startIcon={<Token />}
          onClick={() => navigate('/tokens/new')}
        >
          Create Token
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <Box flex="1" minWidth="200px">
              <TextField
                fullWidth
                placeholder="Search tokens..."
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
                <InputLabel>Charity</InputLabel>
                <Select
                  value={charityFilter}
                  label="Charity"
                  onChange={(e) => setCharityFilter(e.target.value)}
                >
                  <MenuItem value="">All Charities</MenuItem>
                  {charities?.results?.map((charity) => (
                    <MenuItem key={charity.id} value={charity.id}>
                      {charity.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box minWidth="120px">
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearch('');
                  setCharityFilter('');
                }}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tokens Grid */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box display="flex" flexWrap="wrap" gap={3}>
            {tokens?.results?.map((token) => (
              <Box key={token.id} flex="1" minWidth="300px" maxWidth="400px">
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
                  onClick={() => navigate(`/tokens/${token.id}`)}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar
                        sx={{
                          bgcolor: 'secondary.main',
                          width: 56,
                          height: 56,
                          mr: 2,
                        }}
                      >
                        <Token />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" component="h2">
                          {token.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ID: {token.token_id}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {token.description || 'No description available'}
                    </Typography>

                    <Box mb={2}>
                      <Typography variant="h6" color="primary">
                        {formatLKR(token.value_fiat_lkr)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Value per token (LKR)
                      </Typography>
                    </Box>

                    <Box display="flex" alignItems="center" mb={2}>
                      <Business sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {charities?.results?.find(c => c.id === token.charity)?.name || 'Unknown Charity'}
                      </Typography>
                    </Box>

                    <Box display="flex" gap={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<TrendingUp />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tokens/${token.id}/statistics`);
                        }}
                      >
                        Stats
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Receipt />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tokens/${token.id}/transactions`);
                        }}
                      >
                        Transactions
                      </Button>
                    </Box>
                  </CardContent>
                  </Card>
                </Box>
              ))}
          </Box>

          {/* Pagination */}
          {tokens && tokens.count > 0 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={Math.ceil(tokens.count / 12)}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}

          {tokens?.results?.length === 0 && (
            <Box textAlign="center" py={8}>
              <Token sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No tokens found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search criteria or create a new token.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default TokensPage;

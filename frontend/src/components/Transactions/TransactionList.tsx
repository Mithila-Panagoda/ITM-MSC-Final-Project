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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
} from '@mui/material';
import {
  Search,
  Receipt,
  TrendingUp,
  Business,
  Token,
  SwapHoriz,
  OpenInNew,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { getTransactionUrl, truncateAddress } from '../../utils/blockchain';

const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [tokenFilter, setTokenFilter] = useState('');
  const [charityFilter, setCharityFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data: transactions, isLoading, error } = useQuery({
    queryKey: ['transactions', { search, tokenFilter, charityFilter, addressFilter, page }],
    queryFn: () =>
      apiService.getTransactions({
        search: search || undefined,
        token: tokenFilter || undefined,
        charity: charityFilter || undefined,
        address: addressFilter || undefined,
        ordering: '-timestamp',
      }),
  });

  const { data: tokens } = useQuery({
    queryKey: ['tokens'],
    queryFn: () => apiService.getTokens(),
  });

  const { data: charities } = useQuery({
    queryKey: ['charities'],
    queryFn: () => apiService.getCharities(),
  });

  // Calculate stats from transactions data
  const stats = React.useMemo(() => {
    if (!transactions?.results) return null;
    
    const totalTransactions = transactions.count || 0;
    const totalVolume = transactions.results.reduce((sum, tx) => sum + tx.amount, 0);
    const uniqueAddresses = new Set([
      ...transactions.results.map(tx => tx.from_address).filter(Boolean),
      ...transactions.results.map(tx => tx.to_address).filter(Boolean)
    ]).size;
    
    // Count unique charities
    const uniqueCharities = new Set(transactions.results.map(tx => tx.charity_name)).size;
    
    return {
      total_transactions: totalTransactions,
      total_volume: totalVolume,
      unique_addresses: uniqueAddresses,
      top_tokens_by_transactions: [], // Empty array for now
      unique_charities: uniqueCharities
    };
  }, [transactions]);

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


  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load transactions. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Blockchain Transactions
      </Typography>

      {/* Stats Cards */}
      {stats && (
        <Box display="flex" flexWrap="wrap" gap={3} sx={{ mb: 4 }}>
          <Box flex="1" minWidth="250px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="h6">
                      Total Transactions
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.total_transactions.toLocaleString()}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Receipt />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box flex="1" minWidth="250px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="h6">
                      Total Volume
                    </Typography>
                    <Typography variant="h4" component="div">
                      {formatCurrency(stats.total_volume)}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <TrendingUp />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box flex="1" minWidth="250px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="h6">
                      Unique Addresses
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.unique_addresses.toLocaleString()}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'warning.main' }}>
                    <Business />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box flex="1" minWidth="250px">
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="text.secondary" gutterBottom variant="h6">
                      Active Charities
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.unique_charities}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <Business />
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" flexWrap="wrap" gap={2}>
            <Box flex="1" minWidth="200px">
              <TextField
                fullWidth
                placeholder="Search transactions..."
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
                <InputLabel>Token</InputLabel>
                <Select
                  value={tokenFilter}
                  label="Token"
                  onChange={(e) => setTokenFilter(e.target.value)}
                >
                  <MenuItem value="">All Tokens</MenuItem>
                  {tokens?.results?.map((token) => (
                    <MenuItem key={token.id} value={token.id}>
                      {token.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            <Box flex="1" minWidth="200px">
              <TextField
                fullWidth
                placeholder="Wallet address..."
                value={addressFilter}
                onChange={(e) => setAddressFilter(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SwapHoriz />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
          <Box mt={2}>
            <Button
              variant="outlined"
              onClick={() => {
                setSearch('');
                setTokenFilter('');
                setCharityFilter('');
                setAddressFilter('');
              }}
            >
              Clear Filters
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Card>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Hash</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Charity/Campaign</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions?.results?.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Chip
                          label={transaction.type.replace('_', ' ').toUpperCase()}
                          color={
                            transaction.type === 'donation' ? 'success' :
                            transaction.type === 'campaign_event' ? 'info' :
                            transaction.type === 'charity_registration' ? 'primary' :
                            transaction.type === 'campaign_creation' ? 'secondary' :
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontFamily="monospace">
                            {truncateAddress(transaction.transaction_hash)}
                          </Typography>
                          <Button
                            size="small"
                            startIcon={<OpenInNew />}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getTransactionUrl(transaction.transaction_hash), '_blank');
                            }}
                            sx={{ minWidth: 'auto', p: 0.5 }}
                          >
                            View
                          </Button>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {transaction.from_address ? truncateAddress(transaction.from_address) : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {transaction.to_address ? truncateAddress(transaction.to_address) : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {transaction.amount > 0 ? `$${transaction.amount.toLocaleString()}` : 'N/A'}
                          {transaction.token_quantity > 0 && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {transaction.token_quantity.toFixed(6)} ETH
                            </Typography>
                          )}
                          {transaction.type === 'campaign_creation' && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Goal: ${transaction.amount.toLocaleString()}
                            </Typography>
                          )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {transaction.charity_name}
                          </Typography>
                          {transaction.campaign_title && (
                            <Typography variant="caption" color="text.secondary">
                              {transaction.campaign_title}
                            </Typography>
                          )}
                          {transaction.event_title && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              Event: {transaction.event_title}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(transaction.timestamp).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.status}
                          color={
                            transaction.status === 'COMPLETED' ? 'success' :
                            transaction.status === 'PENDING' ? 'warning' :
                            transaction.status === 'FAILED' ? 'error' :
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Pagination */}
          {transactions && transactions.count > 0 && (
            <Box display="flex" justifyContent="center" mt={4}>
              <Pagination
                count={Math.ceil(transactions.count / 25)}
                page={page}
                onChange={(_, newPage) => setPage(newPage)}
                color="primary"
              />
            </Box>
          )}

          {transactions?.results?.length === 0 && (
            <Box textAlign="center" py={8}>
              <Receipt sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No transactions found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search criteria.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default TransactionsPage;

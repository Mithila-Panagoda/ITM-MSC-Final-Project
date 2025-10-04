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
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';

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

  const { data: stats } = useQuery({
    queryKey: ['transaction-stats'],
    queryFn: () => apiService.getTransactionStats(),
  });

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

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
                      {stats.total_volume.toLocaleString()}
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
                      Active Tokens
                    </Typography>
                    <Typography variant="h4" component="div">
                      {stats.top_tokens_by_transactions.length}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <Token />
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
                    <TableCell>Hash</TableCell>
                    <TableCell>Token</TableCell>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Charity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions?.results?.map((transaction) => (
                    <TableRow
                      key={transaction.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/transactions/${transaction.id}`)}
                    >
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {truncateAddress(transaction.transaction_hash)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                            <Token />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {transaction.token.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {transaction.token.token_id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {truncateAddress(transaction.from_address)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {truncateAddress(transaction.to_address)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {transaction.amount.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDateTime(transaction.timestamp)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.token.charity}
                        </Typography>
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

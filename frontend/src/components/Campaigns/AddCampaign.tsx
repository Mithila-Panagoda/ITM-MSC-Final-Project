import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Container,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Campaign,
  ArrowBack,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import apiService from '../../services/api';
import { Campaign as CampaignType } from '../../types';

interface CampaignFormData {
  title: string;
  description: string;
  goal_amount: number;
  charity_id: string;
  start_date: dayjs.Dayjs | null;
  end_date: dayjs.Dayjs | null;
}

const AddCampaign: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: charities } = useQuery({
    queryKey: ['charities'],
    queryFn: () => apiService.getCharities(),
  });

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CampaignFormData>({
    defaultValues: {
      title: '',
      description: '',
      goal_amount: 0,
      charity_id: '',
      start_date: dayjs(),
      end_date: dayjs().add(30, 'day'),
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: (campaignData: Partial<CampaignType>) => apiService.createCampaign(campaignData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      navigate('/campaigns');
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create campaign. Please try again.');
    },
  });

  const onSubmit = (data: CampaignFormData) => {
    setError(null);
    
    if (!data.start_date || !data.end_date) {
      setError('Start date and end date are required');
      return;
    }

    if (data.end_date.isBefore(data.start_date)) {
      setError('End date must be after start date');
      return;
    }

    const campaignData: Partial<CampaignType> = {
      title: data.title,
      description: data.description,
      goal_amount: data.goal_amount,
      charity_id: data.charity_id,
      start_date: data.start_date.toISOString(),
      end_date: data.end_date.toISOString(),
    };

    createCampaignMutation.mutate(campaignData);
  };

  const startDate = watch('start_date');

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container maxWidth="md">
        <Box
          sx={{
            marginTop: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Card sx={{ width: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <Campaign />
                </Avatar>
                <Box>
                  <Typography variant="h4" component="h1">
                    Create New Campaign
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start a new fundraising campaign
                  </Typography>
                </Box>
              </Box>

              <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/campaigns')}
                sx={{ mb: 3 }}
              >
                Back to Campaigns
              </Button>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Box display="flex" flexDirection="column" gap={3}>
                  {/* Campaign Title */}
                  <Box>
                    <Controller
                      name="title"
                      control={control}
                      rules={{ required: 'Campaign title is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Campaign Title"
                          error={!!errors.title}
                          helperText={errors.title?.message}
                          placeholder="Enter campaign title"
                        />
                      )}
                    />
                  </Box>

                  {/* Description */}
                  <Box>
                    <Controller
                      name="description"
                      control={control}
                      rules={{ required: 'Description is required' }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          multiline
                          rows={4}
                          label="Campaign Description"
                          error={!!errors.description}
                          helperText={errors.description?.message}
                          placeholder="Describe your campaign goals and how funds will be used"
                        />
                      )}
                    />
                  </Box>

                  {/* Charity and Goal Amount Row */}
                  <Box display="flex" flexWrap="wrap" gap={3}>
                    <Box flex="1" minWidth="300px">
                      <Controller
                        name="charity_id"
                        control={control}
                        rules={{ required: 'Please select a charity' }}
                        render={({ field }) => (
                          <FormControl fullWidth error={!!errors.charity_id}>
                            <InputLabel>Charity</InputLabel>
                            <Select
                              {...field}
                              label="Charity"
                            >
                              {charities?.results?.map((charity) => (
                                <MenuItem key={charity.id} value={charity.id}>
                                  {charity.name}
                                </MenuItem>
                              ))}
                            </Select>
                            {errors.charity_id && (
                              <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>
                                {errors.charity_id.message}
                              </Typography>
                            )}
                          </FormControl>
                        )}
                      />
                    </Box>

                    <Box flex="1" minWidth="300px">
                      <Controller
                        name="goal_amount"
                        control={control}
                        rules={{ 
                          required: 'Goal amount is required',
                          min: { value: 1, message: 'Goal amount must be greater than 0' }
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            label="Goal Amount (USD)"
                            type="number"
                            error={!!errors.goal_amount}
                            helperText={errors.goal_amount?.message}
                            placeholder="10000"
                            InputProps={{
                              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                            }}
                          />
                        )}
                      />
                    </Box>
                  </Box>

                  {/* Start and End Date Row */}
                  <Box display="flex" flexWrap="wrap" gap={3}>
                    <Box flex="1" minWidth="300px">
                      <Controller
                        name="start_date"
                        control={control}
                        rules={{ required: 'Start date is required' }}
                        render={({ field }) => (
                          <DateTimePicker
                            {...field}
                            label="Start Date"
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.start_date,
                                helperText: errors.start_date?.message,
                              },
                            }}
                          />
                        )}
                      />
                    </Box>

                    <Box flex="1" minWidth="300px">
                      <Controller
                        name="end_date"
                        control={control}
                        rules={{ required: 'End date is required' }}
                        render={({ field }) => (
                          <DateTimePicker
                            {...field}
                            label="End Date"
                            minDateTime={startDate || undefined}
                            slotProps={{
                              textField: {
                                fullWidth: true,
                                error: !!errors.end_date,
                                helperText: errors.end_date?.message,
                              },
                            }}
                          />
                        )}
                      />
                    </Box>
                  </Box>


                  {/* Submit Buttons */}
                  <Box>
                    <Box display="flex" gap={2} justifyContent="flex-end">
                      <Button
                        variant="outlined"
                        onClick={() => navigate('/campaigns')}
                        disabled={createCampaignMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        disabled={createCampaignMutation.isPending}
                        startIcon={createCampaignMutation.isPending ? <CircularProgress size={20} /> : <Campaign />}
                      >
                        {createCampaignMutation.isPending ? 'Creating...' : 'Create Campaign'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Container>
    </LocalizationProvider>
  );
};

export default AddCampaign;
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
} from '@mui/material';
import {
  Business,
  ArrowBack,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiService from '../../services/api';
import { Charity } from '../../types';

interface CharityFormData {
  name: string;
  description: string;
  website: string;
  contact_email: string;
}

const AddCharity: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CharityFormData>({
    defaultValues: {
      name: '',
      description: '',
      website: '',
      contact_email: '',
    },
  });

  const createCharityMutation = useMutation({
    mutationFn: (charityData: Partial<Charity>) => apiService.createCharity(charityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['charities'] });
      navigate('/charities');
    },
    onError: (error: any) => {
      setError(error.response?.data?.message || 'Failed to create charity. Please try again.');
    },
  });

  const onSubmit = (data: CharityFormData) => {
    setError(null);
    
    const charityData: Partial<Charity> = {
      name: data.name,
      description: data.description,
      contact_email: data.contact_email,
    };

    // Only include optional fields if they have values
    if (data.website) charityData.website = data.website;

    createCharityMutation.mutate(charityData);
  };

  return (
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
                <Business />
              </Avatar>
              <Box>
                <Typography variant="h4" component="h1">
                  Add New Charity
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Create a new charitable organization
                </Typography>
              </Box>
            </Box>

            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/charities')}
              sx={{ mb: 3 }}
            >
              Back to Charities
            </Button>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Box display="flex" flexDirection="column" gap={3}>
                {/* Charity Name */}
                <Box>
                  <Controller
                    name="name"
                    control={control}
                    rules={{ required: 'Charity name is required' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        label="Charity Name"
                        error={!!errors.name}
                        helperText={errors.name?.message}
                        placeholder="Enter charity name"
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
                        label="Description"
                        error={!!errors.description}
                        helperText={errors.description?.message}
                        placeholder="Describe the charity's mission and activities"
                      />
                    )}
                  />
                </Box>

                {/* Contact Email and Website Row */}
                <Box display="flex" flexWrap="wrap" gap={3}>
                  <Box flex="1" minWidth="300px">
                    <Controller
                      name="contact_email"
                      control={control}
                      rules={{ 
                        required: 'Contact email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address'
                        }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Contact Email"
                          type="email"
                          error={!!errors.contact_email}
                          helperText={errors.contact_email?.message}
                          placeholder="contact@charity.org"
                        />
                      )}
                    />
                  </Box>

                  <Box flex="1" minWidth="300px">
                    <Controller
                      name="website"
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Website (Optional)"
                          type="url"
                          placeholder="https://www.charity.org"
                          helperText="Optional: Official website URL"
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
                      onClick={() => navigate('/charities')}
                      disabled={createCharityMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={createCharityMutation.isPending}
                      startIcon={createCharityMutation.isPending ? <CircularProgress size={20} /> : <Business />}
                    >
                      {createCharityMutation.isPending ? 'Creating...' : 'Create Charity'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default AddCharity;
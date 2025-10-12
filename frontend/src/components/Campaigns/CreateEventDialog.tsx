import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Close,
  AttachMoney,
  CalendarToday,
  Image as ImageIcon,
  Upload,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import apiService from '../../services/api';
import { CampaignEventCreate, CampaignUtilization } from '../../types';

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
  raisedAmount: number;
  utilization?: CampaignUtilization;
}

const CreateEventDialog: React.FC<CreateEventDialogProps> = ({
  open,
  onClose,
  campaignId,
  raisedAmount,
  utilization,
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<CampaignEventCreate>({
    defaultValues: {
      title: '',
      description: '',
      amount: 0,
      event_date: new Date().toISOString(),
    },
    mode: 'onChange',
  });

  const watchedAmount = watch('amount') || 0;
  const safeRaisedAmount = raisedAmount || 0;
  const remainingFunds = utilization && typeof utilization.remaining_funds === 'number' 
    ? utilization.remaining_funds 
    : safeRaisedAmount;
  const currentUtilization = utilization && typeof utilization.utilization_percentage === 'number' 
    ? utilization.utilization_percentage 
    : 0;

  const createEventMutation = useMutation({
    mutationFn: (data: FormData) => apiService.createCampaignEvent(campaignId, data),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['campaign-events', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign-utilization', campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaign', campaignId] });
      
      // Reset form and close dialog
      reset();
      setSelectedImage(null);
      setImagePreview(null);
      onClose();
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const onSubmit = (data: CampaignEventCreate) => {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('amount', data.amount.toString());
    formData.append('event_date', data.event_date);
    
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    createEventMutation.mutate(formData);
  };

  const handleClose = () => {
    if (!createEventMutation.isPending) {
      reset();
      setSelectedImage(null);
      setImagePreview(null);
      onClose();
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
    if (num < 50) return 'Funds are under-utilized';
    if (num < 80) return 'Good utilization';
    if (num < 95) return 'Excellent utilization';
    return 'Fully utilized';
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

  const newUtilizationPercentage = watchedAmount > 0 && safeRaisedAmount > 0
    ? Math.min((safeGetNumber(utilization?.total_allocated) + watchedAmount) / safeRaisedAmount * 100, 100)
    : (currentUtilization || 0);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Allocate Campaign Funds</Typography>
            <IconButton onClick={handleClose} disabled={createEventMutation.isPending}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            {/* Utilization Overview */}
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" gutterBottom>
                Fund Utilization Overview
              </Typography>
              
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="body2">
                  Remaining Funds: <strong>${remainingFunds.toLocaleString()}</strong>
                </Typography>
                <Chip
                  label={`${safeFormatPercentage(currentUtilization)}% utilized`}
                  color={getUtilizationColor(currentUtilization) as any}
                  size="small"
                />
              </Box>
              
              <LinearProgress
                variant="determinate"
                value={typeof currentUtilization === 'number' && !isNaN(currentUtilization) ? currentUtilization : 0}
                color={getUtilizationColor(currentUtilization) as any}
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
              />
              
              <Typography variant="caption" color="text.secondary">
                {getUtilizationMessage(currentUtilization)}
              </Typography>
            </Paper>

            <Box display="flex" flexDirection="column" gap={3}>
              {/* Title */}
              <Controller
                name="title"
                control={control}
                rules={{ required: 'Title is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Event Title"
                    fullWidth
                    error={!!errors.title}
                    helperText={errors.title?.message}
                    placeholder="e.g., Medical supplies for children"
                  />
                )}
              />

              {/* Description */}
              <Controller
                name="description"
                control={control}
                rules={{ required: 'Description is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Event Description"
                    fullWidth
                    multiline
                    rows={4}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    placeholder="Describe what this fund allocation will be used for..."
                  />
                )}
              />

              {/* Amount */}
              <Controller
                name="amount"
                control={control}
                rules={{ 
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Amount must be greater than 0' },
                  max: { value: remainingFunds, message: `Amount cannot exceed remaining funds ($${remainingFunds.toLocaleString()})` }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Allocation Amount"
                    type="number"
                    fullWidth
                    error={!!errors.amount}
                    helperText={errors.amount?.message || `Maximum: $${remainingFunds.toLocaleString()}`}
                    InputProps={{
                      startAdornment: <AttachMoney />,
                    }}
                  />
                )}
              />

              {/* Real-time utilization preview */}
              {watchedAmount > 0 && (
                <Alert 
                  severity={newUtilizationPercentage > 95 ? 'warning' : 'info'}
                  sx={{ mt: 1 }}
                >
                  <Typography variant="body2">
                    After this allocation: {newUtilizationPercentage.toFixed(1)}% utilized
                    {newUtilizationPercentage > 95 && ' - Almost fully allocated!'}
                  </Typography>
                </Alert>
              )}

              {/* Event Date */}
              <Controller
                name="event_date"
                control={control}
                rules={{ required: 'Event date is required' }}
                render={({ field }) => (
                  <DatePicker
                    value={dayjs(field.value)}
                    onChange={(date) => field.onChange(date ? date.toISOString() : '')}
                    name={field.name}
                    label="Event Date"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.event_date,
                        helperText: errors.event_date?.message,
                      },
                    }}
                  />
                )}
              />

              {/* Image Upload */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Event Image (Optional)
                </Typography>
                
                {imagePreview ? (
                  <Box position="relative" display="inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: '100%',
                        maxWidth: 300,
                        height: 200,
                        objectFit: 'cover',
                        borderRadius: 8,
                      }}
                    />
                    <IconButton
                      onClick={removeImage}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0,0,0,0.7)',
                        },
                      }}
                    >
                      <Close />
                    </IconButton>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: 'grey.300',
                      borderRadius: 2,
                      p: 3,
                      textAlign: 'center',
                      cursor: 'pointer',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <ImageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Click to upload an image
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PNG, JPG up to 10MB
                    </Typography>
                  </Box>
                )}
                
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </Box>
            </Box>

            {/* Error Alert */}
            {createEventMutation.error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {createEventMutation.error.message || 'Failed to create event. Please try again.'}
              </Alert>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={handleClose} disabled={createEventMutation.isPending}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!isValid || createEventMutation.isPending || remainingFunds <= 0}
              startIcon={createEventMutation.isPending ? <CircularProgress size={16} /> : <AttachMoney />}
            >
              {createEventMutation.isPending ? 'Creating...' : 'Allocate Funds'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default CreateEventDialog;

import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  CircularProgress,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useTranslation } from './LocalizationProvider';

const CommandConfirmDialog = ({ 
  open, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText, 
  loading = false,
  danger = false,
  safetyWarning = null
}) => {
  const t = useTranslation();

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: '24px',
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          padding: 1,
          maxWidth: '400px'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 900, fontSize: '1.25rem' }}>
        {danger && <WarningAmberIcon sx={{ color: '#ef4444' }} />}
        {title}
      </DialogTitle>
      
      <DialogContent>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', mb: 2, lineHeight: 1.6 }}>
          {message}
        </Typography>

        {safetyWarning && (
          <Box sx={{ 
            p: 2, 
            borderRadius: '16px', 
            background: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1.5
          }}>
            <WarningAmberIcon sx={{ color: '#f87171', fontSize: '1.2rem', mt: 0.2 }} />
            <Typography sx={{ color: '#f87171', fontSize: '0.85rem', fontWeight: 600 }}>
              {safetyWarning}
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button 
          onClick={onClose} 
          disabled={loading}
          sx={{ 
            color: 'rgba(255,255,255,0.5)', 
            textTransform: 'none', 
            fontWeight: 800,
            '&:hover': { background: 'rgba(255,255,255,0.05)' }
          }}
        >
          {t('sharedCancel')}
        </Button>
        <Button 
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          sx={{ 
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 900,
            px: 3,
            backgroundColor: danger ? '#ef4444' : '#3b82f6',
            '&:hover': {
              backgroundColor: danger ? '#dc2626' : '#2563eb',
            }
          }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : (confirmText || t('sharedConfirm'))}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CommandConfirmDialog;

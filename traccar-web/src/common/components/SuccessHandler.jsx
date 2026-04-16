import {
  Snackbar,
  Alert,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { notificationsActions } from '../../store';
import { playSound } from '../util/sound';
import { useEffect } from 'react';

const SuccessHandler = () => {
  const dispatch = useDispatch();
  const notification = useSelector((state) => state.notifications.messages[0]);

  useEffect(() => {
    if (notification) {
      playSound('minimal');
    }
  }, [notification]);

  return (
    <Snackbar
      open={Boolean(notification)}
      autoHideDuration={4000}
      onClose={() => dispatch(notificationsActions.pop())}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        elevation={6}
        onClose={() => dispatch(notificationsActions.pop())}
        severity="success"
        variant="filled"
        sx={{ 
          borderRadius: 'var(--border-radius-card)', 
          background: 'rgba(16, 185, 129, 0.9)',
          backdropFilter: 'var(--glass-blur)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.2)',
          fontWeight: 700,
          color: '#fff',
          '& .MuiAlert-icon': { color: '#fff' }
        }}
      >
        {notification}
      </Alert>
    </Snackbar>
  );
};

export default SuccessHandler;

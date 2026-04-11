import { useState } from 'react';
import { Button, TextField, Typography, Snackbar, IconButton } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LoginLayout from './LoginLayout';
import { useTranslation } from '../common/components/LocalizationProvider';
import { snackBarDurationShortMs } from '../common/util/duration';
import { useCatch } from '../reactHelper';
import BackIcon from '../common/components/BackIcon';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  header: {
    display: 'flex',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.spacing(3),
    fontWeight: 500,
    marginLeft: theme.spacing(1),
    textTransform: 'uppercase',
  },
}));

const ResetPasswordPage = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const [searchParams] = useSearchParams();
  const token = searchParams.get('passwordReset');

  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);

  const isEmailValid = email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  const isPasswordValid = password.length >= 8;

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    setErrorText('');
    setLoading(true);

    try {
      if (!token) {
        if (!isEmailValid) throw new Error('Please enter a valid email address.');
        await fetchOrThrow('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } else {
        if (!isPasswordValid) throw new Error('Password must be at least 8 characters.');
        await fetchOrThrow('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        });
      }
      setSnackbarOpen(true);
    } catch (err) {
      setErrorText(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <LoginLayout>
      <div className={classes.container}>
        <div className={classes.header}>
          <IconButton sx={{ color: 'rgba(255,255,255,0.5)' }} onClick={() => navigate('/login')}>
            <BackIcon />
          </IconButton>
          <Typography variant="h5" sx={{ color: '#fff', fontWeight: 900, ml: 1 }}>
            {token ? 'Update Password' : 'Reset Password'}
          </Typography>
        </div>

        {errorText && (
          <Alert severity="error" sx={{ borderRadius: '12px' }}>{errorText}</Alert>
        )}

        {!token ? (
          <TextField
            required
            fullWidth
            type="email"
            label="Email Address"
            name="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#fff',
                '&:hover': { background: 'rgba(255, 255, 255, 0.08)' },
              },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
            }}
          />
        ) : (
          <TextField
            required
            fullWidth
            label="New Password"
            name="password"
            value={password}
            type="password"
            autoComplete="new-password"
            onChange={(event) => setPassword(event.target.value)}
            helperText="Minimum 8 characters"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#fff',
              },
              '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.4)' },
            }}
          />
        )}
        <Button
          variant="contained"
          fullWidth
          disabled={loading || (!token ? !isEmailValid : !isPasswordValid)}
          onClick={handleSubmit}
          sx={{
            borderRadius: '16px',
            py: 2,
            fontWeight: 900,
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
          }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : (token ? 'Update Password' : 'Send Reset Link')}
        </Button>
      </div>
      <Snackbar
        open={snackbarOpen}
        onClose={() => navigate('/login')}
        autoHideDuration={snackBarDurationShortMs}
        message={!token ? t('loginResetSuccess') : t('loginUpdateSuccess')}
      />
    </LoginLayout>
  );
};

export default ResetPasswordPage;

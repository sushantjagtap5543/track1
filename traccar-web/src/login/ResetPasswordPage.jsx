import {
  Button,
  TextField,
  Typography,
  Snackbar,
  IconButton,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import LoginLayout from './LoginLayout';
import { useTranslation } from '../common/components/LocalizationProvider';
import { snackBarDurationShortMs } from '../common/util/duration';
import { useCatch } from '../reactHelper';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  title: {
    color: '#fff',
    fontWeight: 900,
    fontSize: '2rem',
    letterSpacing: '-1px',
    textAlign: 'center',
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '0.9rem',
    fontWeight: 500,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
    color: 'rgba(255, 255, 255, 0.5)',
    '&:hover': {
      color: '#fff',
      background: 'rgba(255, 255, 255, 0.1)',
    },
  },
  input: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '16px',
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff',
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      },
      '&.Mui-focused': {
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
      },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
    '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.4)' },
  },
  actionButton: {
    borderRadius: '16px',
    padding: theme.spacing(2),
    fontWeight: 900,
    fontSize: '1rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
    '&:hover': {
      background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
    },
  },
}));

const ResetPasswordPage = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const t = useTranslation();

  const [searchParams] = useSearchParams();
  const token = searchParams.get('passwordReset');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorText, setErrorText] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const isEmailValid = email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  const isPasswordValid = password.length >= 8;

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    setErrorText('');
    setLoading(true);

    try {
      if (!token) {
        if (!isEmailValid) throw new Error('Security: Valid email required.');
        await fetchOrThrow('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } else {
        if (!isPasswordValid) throw new Error('Security: Password length requirement not met.');
        await fetchOrThrow('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, password }),
        });
      }
      setSnackbarOpen(true);
    } catch (err) {
      setErrorText(err.message || 'Cipher error during recovery attempt.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <LoginLayout>
      <IconButton className={classes.backButton} onClick={() => navigate('/login')}>
        <BackIcon />
      </IconButton>

      <Box
        component={motion.form}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={classes.container}
        onSubmit={handleSubmit}
      >
        <div className={classes.header}>
          <Typography className={classes.title}>
            {token ? 'Secure Recovery' : 'Account Recovery'}
          </Typography>
          <Typography className={classes.subText}>
            {token ? 'Establish new access credentials' : 'Enter registered email for decryption link'}
          </Typography>
        </div>

        {errorText && (
          <Alert severity="error" sx={{ 
            borderRadius: '16px', 
            background: 'rgba(239, 68, 68, 0.1)', 
            color: '#f87171',
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            {errorText}
          </Alert>
        )}

        {!token ? (
          <TextField
            required
            fullWidth
            type="email"
            label="Recovery Email Address"
            name="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            className={classes.input}
          />
        ) : (
          <TextField
            required
            fullWidth
            label="New Access Password"
            name="password"
            value={password}
            type="password"
            autoComplete="new-password"
            onChange={(event) => setPassword(event.target.value)}
            className={classes.input}
            helperText="Establish an 8+ character shield"
          />
        )}
        
        <Button
          variant="contained"
          fullWidth
          type="submit"
          disabled={loading || (!token ? !isEmailValid : !isPasswordValid)}
          className={classes.actionButton}
        >
          {loading ? <CircularProgress size={26} color="inherit" /> : (token ? 'Update Access' : 'Initiate Recovery')}
        </Button>
      </Box>

      <Snackbar
        open={snackbarOpen}
        onClose={() => navigate('/login')}
        autoHideDuration={snackBarDurationShortMs}
        message={!token ? 'Recovery protocols initiated. Check your email.' : 'Access credentials updated successfully.'}
      />
    </LoginLayout>
  );
};

export default ResetPasswordPage;

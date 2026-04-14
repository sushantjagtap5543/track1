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

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <LoginLayout>
      <IconButton className={classes.backButton} onClick={() => navigate('/login')}>
        <BackIcon />
      </IconButton>

      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={classes.container}
        sx={{ textAlign: 'center', py: 4 }}
      >
        <div className={classes.header}>
          <Typography className={classes.title}>
            Support Assistance
          </Typography>
          <Typography className={classes.subText}>
            Technical Support & Account Access
          </Typography>
        </div>

        <Box sx={{ 
          mt: 4, 
          p: 3, 
          borderRadius: '24px', 
          background: 'rgba(59, 130, 246, 0.05)',
          border: '1px solid rgba(59, 130, 246, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <Typography sx={{ color: '#fff', fontSize: '1.1rem', fontWeight: 600, mb: 1 }}>
            Support Team
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '1rem' }}>
            [Details will be added after testing]
          </Typography>
        </Box>
        
        <Button
          variant="outlined"
          fullWidth
          onClick={() => navigate('/login')}
          sx={{
            mt: 4,
            borderRadius: '16px',
            padding: theme.spacing(1.5),
            color: '#3b82f6',
            borderColor: 'rgba(59, 130, 246, 0.5)',
            '&:hover': {
              borderColor: '#3b82f6',
              background: 'rgba(59, 130, 246, 0.05)',
            }
          }}
        >
          Return to Secure Login
        </Button>
      </Box>
    </LoginLayout>
  );
};

export default ResetPasswordPage;

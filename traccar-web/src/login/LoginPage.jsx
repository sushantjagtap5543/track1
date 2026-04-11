import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
  Box,
  CircularProgress,
  Link,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { Visibility, VisibilityOff, EmailOutlined, LockOutlined } from '@mui/icons-material';
import { motion } from 'framer-motion';
import LoginLayout from './LoginLayout';
import { sessionActions } from '../store';
import { useCatch } from '../reactHelper';

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  title: {
    color: '#fff',
    fontWeight: 900,
    fontSize: '3rem',
    letterSpacing: '-2px',
    lineHeight: 1,
    textShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '1rem',
    fontWeight: 500,
    marginTop: theme.spacing(1),
  },
  input: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '16px',
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff',
      transition: 'all 0.3s ease',
      height: '60px',
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      },
      '&.Mui-focused': {
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.15)',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255, 255, 255, 0.5)',
      fontSize: '0.9rem',
    },
    '& .MuiInputLabel-root.Mui-focused': {
      color: '#3b82f6',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      border: 'none',
    },
  },
  loginButton: {
    borderRadius: '16px',
    padding: theme.spacing(2, 0),
    fontSize: '1.1rem',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    marginTop: theme.spacing(2),
    height: '60px',
    '&:hover': {
      background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
      transform: 'translateY(-3px)',
      boxShadow: '0 12px 35px rgba(59, 130, 246, 0.4)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(1),
  },
  link: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '0.85rem',
    fontWeight: 600,
    textDecoration: 'none',
    transition: 'color 0.2s ease',
    '&:hover': {
      color: '#fff',
    },
  },
  signupText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginTop: theme.spacing(4),
    fontSize: '0.9rem',
  },
  signupLink: {
    color: '#3b82f6',
    fontWeight: 800,
    textDecoration: 'none',
    marginLeft: theme.spacing(1),
    '&:hover': {
      textDecoration: 'underline',
      color: '#60a5fa',
    },
  },
}));

const Login = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorText('');
    try {
      // Step 1: Authenticate with Traccar (primary session for the tracking dashboard)
      const traccarResponse = await fetch('/api/session', {
        method: 'POST',
        body: new URLSearchParams(`email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`),
      });

      if (traccarResponse.ok) {
        const user = await traccarResponse.json();
        dispatch(sessionActions.updateUser(user));

        // Step 2: Also authenticate with SaaS API to get JWT for SaaS-specific features
        try {
          const saasResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, device: navigator.userAgent }),
          });
          if (saasResponse.ok) {
            const saasData = await saasResponse.json();
            if (saasData.token) localStorage.setItem('saasToken', saasData.token);
          }
        } catch (saasErr) {
          console.warn('[Login] SaaS token retrieval failed (non-fatal):', saasErr);
        }

        navigate('/');
      } else {
        const traccarErrorData = await traccarResponse.json().catch(() => ({}));
        if (traccarResponse.status === 401) {
          setErrorText('Invalid email or password.');
        } else if (traccarResponse.status === 403) {
          setErrorText(traccarErrorData.error || 'Your account has been suspended. Please contact support.');
        } else {
          setErrorText('Login failed. Please check your credentials or try again later.');
        }
      }
    } catch (e) {
      setErrorText('Unable to connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  });

  return (
    <LoginLayout>
      <Box
        component={motion.form}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={classes.container}
        onSubmit={handleSubmit}
      >
        <div className={classes.header}>
          <Typography className={classes.title}>Login</Typography>
          <Typography className={classes.subText}>Please sign in to continue</Typography>
        </div>

        {errorText && (
          <Alert severity="error" sx={{ borderRadius: '12px', mb: 1 }}>{errorText}</Alert>
        )}

        <TextField
          required
          fullWidth
          label="Email"
          name="email"
          type="email"
          value={email}
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          className={classes.input}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailOutlined sx={{ color: 'rgba(255,255,255,0.3)' }} />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          required
          fullWidth
          label="Password"
          name="password"
          value={password}
          type={showPassword ? 'text' : 'password'}
          autoComplete="current-password"
          onChange={(event) => setPassword(event.target.value)}
          className={classes.input}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlined sx={{ color: 'rgba(255,255,255,0.3)' }} />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.3)' }}>
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <div className={classes.footer}>
          <FormControlLabel
            control={<Checkbox sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#3b82f6' } }} />}
            label={<Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Remember me</Typography>}
          />
          <Link href="/reset-password" className={classes.link}>Forgot Password?</Link>
        </div>

        <Button
          variant="contained"
          fullWidth
          type="submit"
          disabled={loading || !email || !password}
          className={classes.loginButton}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
        </Button>

        <Typography className={classes.signupText}>
          Don&apos;t have an account?
          <Link onClick={() => navigate('/register')} component="button" type="button" className={classes.signupLink}>
            Register
          </Link>
        </Typography>
      </Box>
    </LoginLayout>
  );
};

export default Login;

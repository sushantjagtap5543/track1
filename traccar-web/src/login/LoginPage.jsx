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
      // Step 1: Authenticate with Traccar (Primary Session)
      const traccarResponse = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ email, password }).toString(),
      });

      if (traccarResponse.ok) {
        const user = await traccarResponse.json();
        
        // Step 2: Authenticate with SaaS API (JWT Session)
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
          console.warn('[GeoSurePath] SaaS auth sync failed (non-fatal):', saasErr);
        }

        dispatch(sessionActions.updateUser(user));
        navigate('/');
      } else {
        const errorData = await traccarResponse.json().catch(() => ({}));
        setErrorText(errorData.error || 'Invalid email or password. Please try again.');
      }
    } catch (e) {
      setErrorText('Connection failure. Please check if the GeoSurePath engine is running.');
    } finally {
      setLoading(false);
    }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <LoginLayout>
      <Box
        component={motion.form}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={classes.container}
        onSubmit={handleSubmit}
      >
        <motion.div className={classes.header} variants={itemVariants}>
          <Typography className={classes.title}>Sign In</Typography>
          <Typography className={classes.subText}>Elite Fleet Intelligence Engine</Typography>
        </motion.div>

        {errorText && (
          <motion.div variants={itemVariants}>
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: '16px', 
                mb: 1, 
                background: 'rgba(239, 68, 68, 0.1)', 
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              {errorText}
            </Alert>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <TextField
            required
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            className={classes.input}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlined sx={{ color: 'rgba(255,255,255,0.4)', mr: 1 }} />
                </InputAdornment>
              ),
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextField
            required
            fullWidth
            label="Security Password"
            name="password"
            value={password}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
            className={classes.input}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined sx={{ color: 'rgba(255,255,255,0.4)', mr: 1 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </motion.div>

        <motion.div className={classes.footer} variants={itemVariants}>
          <FormControlLabel
            control={<Checkbox sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#3b82f6' } }} />}
            label={<Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 500 }}>Remember Secure Session</Typography>}
          />
          <Link href="/reset-password" className={classes.link}>Recovery Access?</Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            variant="contained"
            fullWidth
            type="submit"
            disabled={loading || !email || !password}
            className={classes.loginButton}
          >
            {loading ? <CircularProgress size={26} color="inherit" /> : 'Authorize Access'}
          </Button>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Typography className={classes.signupText}>
            New to the platform?
            <Link onClick={() => navigate('/register')} component="button" type="button" className={classes.signupLink}>
              Create Elite Account
            </Link>
          </Typography>
        </motion.div>

        <motion.div variants={itemVariants} style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.5,
              background: 'rgba(46, 204, 113, 0.1)',
              border: '1px solid rgba(46, 204, 113, 0.2)',
              borderRadius: '30px',
              px: 3,
              py: 1,
              backdropFilter: 'blur(5px)',
            }}
          >
            <Box
              sx={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#2ecc71',
                boxShadow: '0 0 10px #2ecc71',
                animation: 'pulse-dot 2s infinite',
                '@keyframes pulse-dot': {
                  '0%': { opacity: 0.5, transform: 'scale(0.8)' },
                  '50%': { opacity: 1, transform: 'scale(1.2)' },
                  '100%': { opacity: 0.5, transform: 'scale(0.8)' },
                },
              }}
            />
            <Typography sx={{ color: '#2ecc71', fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px' }}>
              AIS140 COMPLIANT (RTO CERTIFIED)
            </Typography>
          </Box>
        </motion.div>
      </Box>
    </LoginLayout>
  );
};

export default Login;

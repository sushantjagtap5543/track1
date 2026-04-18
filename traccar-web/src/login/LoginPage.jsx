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
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';

import { motion } from 'framer-motion';
import { useTranslation } from '../common/components/LocalizationProvider';
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
      borderRadius: 'var(--premium-radius)',
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'var(--glass-blur)',
      border: '1px solid var(--glass-border)',
      color: '#fff',
      transition: 'all 0.3s ease',
      height: '56px',
      [theme.breakpoints.down('sm')]: {
        height: '50px',
      },

      '&:hover': {
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      },
      '&.Mui-focused': {
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        boxShadow: 'var(--primary-glow)',
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
    padding: theme.spacing(2, 0),
    marginTop: theme.spacing(2),
    height: '60px',
    borderRadius: 'var(--premium-radius)',
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
  forgotPassword: {
    color: '#3b82f6',
    fontSize: '0.85rem',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
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
  const t = useTranslation();

  const [email, setEmail] = useState(localStorage.getItem('rememberedEmail') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [errors, setErrors] = useState({});

  const [rememberMe, setRememberMe] = useState(false);

  React.useEffect(() => {
    document.title = `${t('loginLogin')} - GeoSurePath`;
    if (location.state?.email) {
      setEmail(location.state.email);
    }
    if (location.state?.registered) {
      setSuccessText(t('loginRegistrationSuccessful'));
    }
  }, [location.state?.email, location.state?.registered, t]);



  const validate = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = t('registrationEmailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('registrationEmailInvalid');
    }
    if (!password) {
      newErrors.password = t('registrationPasswordRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    setErrorText('');
    setErrors({});
    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const traccarResponse = await fetch('/api/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ email, password }).toString(),
      });

      if (traccarResponse.ok) {
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        const user = await traccarResponse.json();
        
        try {
          const saasResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, device: navigator.userAgent }),
          });
          if (saasResponse.ok) {
            const saasData = await saasResponse.json();
            if (saasData.token) localStorage.setItem('saasToken', saasData.token);
          } else {
             console.error('[GeoSurePath] SaaS auth sync failed with status:', saasResponse.status);
          }
        } catch (saasErr) {
          console.error('[GeoSurePath] SaaS auth sync connection error:', saasErr.message);
        }

        dispatch(sessionActions.updateUser(user));
        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      } else {
        let errorMsg = t('loginFailed');
        if (traccarResponse.status !== 401) {
          const textError = await traccarResponse.text().catch(() => '');
          try {
            const errorData = JSON.parse(textError);
            errorMsg = errorData.error || errorData.message || errorMsg;
          } catch (parseErr) {
            if (textError && textError.length < 100) {
              errorMsg = textError;
            }
          }
        }
        setErrorText(errorMsg);
      }
    } catch (e) {
      setErrorText(t('errorConnection'));
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
      <Link
        href="#login-form"
        sx={{
          position: 'absolute',
          left: '-9999px',
          top: 'auto',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          '&:focus': {
            position: 'fixed',
            top: '20px',
            left: '20px',
            width: 'auto',
            height: 'auto',
            padding: '10px 20px',
            background: '#3b82f6',
            color: '#fff',
            borderRadius: '8px',
            zIndex: 9999,
          }
        }}
      >
        Skip to Login Form
      </Link>

      <Box
        id="login-form"
        component={motion.form}

        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={classes.container}
        onSubmit={handleSubmit}
      >
        <motion.div className={classes.header} variants={itemVariants}>
          <Typography component="h2" className={classes.title} sx={{ textWrap: 'balance' }}>{t('loginTitle')}</Typography>
          <Typography className={classes.subText} sx={{ textWrap: 'balance' }}>{t('loginSubtitle')}</Typography>

        </motion.div>


        {successText && (
          <motion.div variants={itemVariants} aria-live="polite">
            <Alert 
              severity="success" 
              sx={{ 
                borderRadius: '16px', 
                mb: 1, 
                background: 'rgba(16, 185, 129, 0.1)', 
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}
            >
              {successText}
            </Alert>
          </motion.div>
        )}

        {errorText && (

          <motion.div variants={itemVariants} aria-live="assertive" id="auth-error-region">
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
            autoFocus
            fullWidth
            label={t('userEmail')}
            name="email"
            type="email"
            value={email}
            autoComplete="username"
            error={!!errors.email}
            helperText={errors.email}
            onChange={(event) => { 
                const value = event.target.value;
                setEmail(value); 
                if(errors.email) setErrors(prev => ({ ...prev, email: '' })); 
                if(errorText) setErrorText('');
            }}
            className={classes.input}
            slotProps={{
              input: {
                'aria-label': t('userEmail'),
                'aria-invalid': !!errors.email,
                'aria-errormessage': errors.email ? 'email-error' : undefined,
                startAdornment: (

                  <InputAdornment position="start">
                    <EmailOutlined sx={{ color: 'rgba(255,255,255,0.4)', mr: 1 }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextField
            required
            fullWidth
            label={t('userPassword')}
            name="password"
            value={password}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"

            error={!!errors.password}
            helperText={errors.password}
            onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors({...errors, password: ''}); if(errorText) setErrorText(''); }}
            className={classes.input}
            slotProps={{
              input: {
                'aria-label': t('userPassword'),
                'aria-invalid': !!errors.password,
                'aria-errormessage': errors.password ? 'password-error' : undefined,
                startAdornment: (

                  <InputAdornment position="start">
                    <LockOutlined sx={{ color: 'rgba(255,255,255,0.4)', mr: 1 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                    component={motion.button}
                    whileTap={{ scale: 0.9, rotate: 15 }}
                    aria-label={showPassword ? t('sharedHidePassword') || "Hide password" : t('sharedShowPassword') || "Show password"}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </motion.div>

        <motion.div className={classes.footer} variants={itemVariants}>
          <FormControlLabel
            sx={{ px: 1 }}
            control={
              <Checkbox 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#3b82f6' } }} 
              />
            }
            label={<Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', fontWeight: 500 }}>{t('userRemember')}</Typography>}
          />
          <Link className={classes.forgotPassword} onClick={() => navigate('/reset-password')}>
            {t('loginForgotPassword') || "Forgot password?"}
          </Link>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            component={motion.button}
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            className={classes.loginButton}
            disabled={loading}
            sx={{ 
              borderRadius: '16px', 
              fontWeight: 900, 
              fontSize: '1.1rem',
              letterSpacing: '1px',
              textTransform: 'none',
              boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)',
              '&:hover': {
                boxShadow: '0 12px 24px rgba(59, 130, 246, 0.4)',
              }
            }}
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? <CircularProgress size={26} color="inherit" /> : t('loginLogin')}
          </Button>
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
              {t('loginAis140')}
            </Typography>
          </Box>
        </motion.div>

        <motion.div variants={itemVariants} style={{ textAlign: 'center', marginTop: '16px' }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            {t('registerAlreadyHaveAccount') === "Already have an account?" ? "Don't have an account?" : t('registerAlreadyHaveAccount')}{' '}
            <Link 
              onClick={() => navigate('/register')} 
              sx={{ color: '#3b82f6', fontWeight: 700, cursor: 'pointer', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
            >
              {t('loginRegister')}
            </Link>
          </Typography>
        </motion.div>
      </Box>
    </LoginLayout>
  );
};

export default Login;

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Button,
  TextField,
  Typography,
  IconButton,
  Link,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Box,
  Alert,
  Collapse,
  Divider,
  InputAdornment,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import LoginLayout from './LoginLayout';
import { useCatch } from '../reactHelper';
import { sessionActions } from '../store';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import EmailOutlined from '@mui/icons-material/EmailOutlined';
import LockOutlined from '@mui/icons-material/LockOutlined';
import BackIcon from '@mui/icons-material/ArrowBack';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '../common/components/LocalizationProvider';

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1.5),
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
    fontSize: '2.5rem',
    letterSpacing: '-1.5px',
    lineHeight: 1.1,
    textShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  subText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '1rem',
    fontWeight: 500,
    textAlign: 'center',
    marginTop: theme.spacing(1),
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
    color: 'rgba(255, 255, 255, 0.5)',
    zIndex: 10,
  },
  input: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      background: 'rgba(255, 255, 255, 0.04)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: '#fff',
      transition: 'all 0.3s ease',
      '&:hover': {
        background: 'rgba(255, 255, 255, 0.08)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
      },
      height: '56px',
      [theme.breakpoints.down('sm')]: {
        height: '50px',
      },

      '&.Mui-focused': {
        background: 'rgba(255, 255, 255, 0.1)',
        border: '1px solid rgba(59, 130, 246, 0.5)',
        boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.15)',
      },
    },
    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#3b82f6' },
    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
    '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.4)' },
  },
  divider: {
    '&::before, &::after': {
      borderColor: 'rgba(255,255,255,0.1)',
    },
    color: 'rgba(255,255,255,0.3)',
    fontSize: '0.75rem',
    letterSpacing: '1px',
  },
  registerButton: {
    padding: theme.spacing(1.8, 0),
    marginTop: theme.spacing(1),
  },
  footer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: theme.spacing(1),
  },
  loginLink: {
    color: theme.palette.primary.light,
    fontWeight: 800,
    fontSize: '0.95rem',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  signupLink: {
    color: '#3b82f6',
    fontWeight: 800,
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    '&:hover': {
      textDecoration: 'underline',
      color: '#fff',
      textShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
    },
  },
}));

const Register = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  // Account fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useState(() => {
    document.title = `${t('loginRegister')} - GeoSurePath`;
  }, [t]);

  const validate = () => {

    let newErrors = {};
    if (!name.trim()) newErrors.name = t('registrationNameRequired');
    if (!email) {
      newErrors.email = t('registrationEmailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('registrationEmailInvalid');
    }
    if (phone && !/^\+?[0-9\s\-()]{7,15}$/.test(phone)) {
      newErrors.phone = t('registrationPhoneInvalid');
    }
    if (!password) {
      newErrors.password = t('registrationPasswordRequired');
    } else if (password.length < 8) {
      newErrors.password = t('registrationPasswordTooShort');
    }
    
    if (confirmPassword !== password) {
      newErrors.confirmPassword = t('registrationPasswordMismatch') || 'Passwords do not match';
    }
    
    if (!acceptedTerms) {
      newErrors.terms = t('registrationTermsRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setErrors({});

    if (!validate()) {
      setErrorText(t('registrationFixErrors'));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email,
        password,
      };
      if (phone.trim()) payload.phone = phone.trim();

      const response = await fetch('/api/saas/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccessText(t('registerSuccess'));
        setTimeout(() => {
          navigate('/login', { state: { registered: true, email }, replace: true });

        }, 1800);
      } else {
        let errorMsg = t('registrationFailed');
        const textError = await response.text().catch(() => '');
        try {
          const data = JSON.parse(textError);
          errorMsg = data.error || data.details?.[0] || data.message || errorMsg;
        } catch (parseErr) {
          if (textError) errorMsg = textError;
        }
        setErrorText(errorMsg);
        setLoading(false); // Reset loading on error
      }
    } catch (e) {
      console.error('[GeoSurePath] Registration Error:', e);
      setErrorText(t('registrationConnectionError'));
    } finally {
      setLoading(false);
    }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <LoginLayout>
      <Link
        href="#register-form"
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
        Skip to Registration Form
      </Link>

      <IconButton 
        className={classes.backButton} 
        onClick={() => navigate('/login')} 
        aria-label="Go back to login"
        component={motion.button}
        whileHover={{ x: -4 }}
      >
        <BackIcon />
      </IconButton>


      <Box
        id="register-form"
        component={motion.form}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={classes.container}
        onSubmit={handleSubmit}
      >
        <motion.div className={classes.header} variants={itemVariants}>
          <Typography component="h2" className={classes.title} sx={{ textWrap: 'balance' }}>{t('loginRegister')}</Typography>
          <Typography className={classes.subText} sx={{ textWrap: 'balance' }}>{t('registerCreateAccount')}</Typography>
        </motion.div>



        <AnimatePresence mode="wait">
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
          {successText && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              aria-live="polite"
            >
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
        </AnimatePresence>

        <motion.div variants={itemVariants}>
          <TextField
            required
            autoFocus
            fullWidth
            label={t('sharedName')}
            name="name"
            value={name}
            autoComplete="name"
            error={!!errors.name}
            helperText={errors.name}
            onChange={(e) => { setName(e.target.value); if(errors.name) setErrors({...errors, name: ''}); if(errorText) setErrorText(''); }}
            className={classes.input}
            slotProps={{
              input: {
                'aria-invalid': !!errors.name,
                'aria-errormessage': errors.name ? 'name-error' : undefined,
              },
            }}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <TextField
            required
            fullWidth
            type="email"
            label={t('userEmail')}
            name="email"
            value={email}
            autoComplete="username"

            error={!!errors.email}
            helperText={errors.email}
            onChange={(e) => { setEmail(e.target.value); if(errors.email) setErrors({...errors, email: ''}); if(errorText) setErrorText(''); }}
            className={classes.input}
            slotProps={{
              input: {
                'aria-invalid': !!errors.email,
                'aria-errormessage': errors.email ? 'email-error' : undefined,
              },
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextField
            fullWidth
            label={t('sharedPhone')}
            name="phone"
            value={phone}
            autoComplete="tel"
            error={!!errors.phone}
            helperText={errors.phone}
            onChange={(e) => { setPhone(e.target.value); if(errors.phone) setErrors({...errors, phone: ''}); if(errorText) setErrorText(''); }}
            className={classes.input}
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
            autoComplete="new-password"

            error={!!errors.password}
            helperText={errors.password || t('sharedPasswordLength')}
            onChange={(e) => { 
                const value = e.target.value;
                setPassword(value); 
                if(errors.password) setErrors(prev => ({...prev, password: ''})); 
                if (confirmPassword && value !== confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: t('registrationPasswordMismatch') || 'Passwords do not match' }));
                } else if (confirmPassword && value === confirmPassword) {
                    setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }
                if(errorText) setErrorText(''); 
            }}
            className={classes.input}
            slotProps={{
              input: {
                'aria-label': t('userPassword'),
                'aria-invalid': !!errors.password,
                'aria-errormessage': errors.password ? 'password-error' : undefined,
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

        <motion.div variants={itemVariants}>
          <TextField
            required
            fullWidth
            label={t('registrationConfirmPassword') || "Confirm Password"}
            name="confirmPassword"
            value={confirmPassword}
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"

            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            onChange={(e) => { 
                const value = e.target.value;
                setConfirmPassword(value); 
                if (value && value !== password) {
                    setErrors(prev => ({ ...prev, confirmPassword: t('registrationPasswordMismatch') || 'Passwords do not match' }));
                } else {
                    setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }
                if (errorText) setErrorText(''); 
            }}
            className={classes.input}
            slotProps={{
              input: {
                'aria-label': "Confirm Password",
                'aria-invalid': !!errors.confirmPassword,
                'aria-errormessage': errors.confirmPassword ? 'confirm-password-error' : undefined,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                      component={motion.button}
                      whileTap={{ scale: 0.9, rotate: 15 }}
                      aria-label={showConfirmPassword ? t('sharedHidePassword') || "Hide password" : t('sharedShowPassword') || "Show password"}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <FormControlLabel
            control={
              <Checkbox
                checked={acceptedTerms}
                onChange={(e) => { setAcceptedTerms(e.target.checked); if(errors.terms) setErrors({...errors, terms: ''}); if(errorText) setErrorText(''); }}
                sx={{ color: errors.terms ? '#f87171' : 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#3b82f6' } }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: errors.terms ? '#f87171' : 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                {t('registerTermsAgree')}
              </Typography>
            }
          />
          {errors.terms && <Typography variant="caption" sx={{ color: '#f87171', ml: 4, display: 'block', mt: -1 }}>{errors.terms}</Typography>}
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            component={motion.button}
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            className={classes.registerButton}
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
            {loading ? <CircularProgress size={26} color="inherit" /> : t('loginRegister')}
          </Button>
        </motion.div>

        <motion.div className={classes.footer} variants={itemVariants}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            {t('registerAlreadyHaveAccount')}{' '}
            <Link className={classes.loginLink} onClick={() => navigate('/login')} component="button" type="button">
              {t('loginLogin')}
            </Link>
          </Typography>
        </motion.div>
      </Box>
    </LoginLayout>
  );
};

export default Register;

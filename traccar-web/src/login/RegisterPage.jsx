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
import { Visibility, VisibilityOff, EmailOutlined, LockOutlined, ArrowBack as BackIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};
    if (!name.trim()) newErrors.name = 'Full name is required.';
    if (!email) {
      newErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (phone && !/^\+?[0-9\s\-()]{7,15}$/.test(phone)) {
      newErrors.phone = 'Please enter a valid phone number.';
    }
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!acceptedTerms) {
      newErrors.terms = 'You must accept the terms and conditions.';
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
      setErrorText('Please fix the errors in the form before submitting.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email,
        phone: phone || undefined,
        password,
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccessText('Account successfully created! Redirecting to login...');
        setTimeout(() => {
          navigate('/login', { state: { registered: true, email } });
        }, 1800);
      } else {
        let errorMsg = 'Registration failed. Please try again.';
        const textError = await response.text().catch(() => '');
        try {
          const data = JSON.parse(textError);
          errorMsg = data.error || data.details?.[0] || data.message || errorMsg;
        } catch (parseErr) {
          if (textError) errorMsg = textError;
        }
        setErrorText(errorMsg);
      }
    } catch (e) {
      console.error('[GeoSurePath] Registration Error:', e);
      setErrorText('Connection error. Please check if the server is running.');
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
      <IconButton className={classes.backButton} onClick={() => navigate('/login')}>
        <BackIcon />
      </IconButton>

      <Box
        component={motion.form}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className={classes.container}
        onSubmit={handleSubmit}
      >
        <motion.div className={classes.header} variants={itemVariants}>
          <Typography className={classes.title}>Register</Typography>
          <Typography className={classes.subText}>Create a new account</Typography>
        </motion.div>

        <AnimatePresence mode="wait">
          {(errorText || successText) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
            >
              <Alert 
                severity={errorText ? 'error' : 'success'} 
                sx={{ 
                  borderRadius: '16px', 
                  mb: 1,
                  background: errorText ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: errorText ? '#f87171' : '#34d399',
                  border: `1px solid ${errorText ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                }}
              >
                {errorText || successText}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div variants={itemVariants}>
          <TextField
            required
            fullWidth
            label="Full Name"
            name="name"
            value={name}
            autoComplete="name"
            error={!!errors.name}
            helperText={errors.name}
            onChange={(e) => { setName(e.target.value); if(errors.name) setErrors({...errors, name: ''}); }}
            className={classes.input}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <TextField
            required
            fullWidth
            type="email"
            label="Email Address"
            name="email"
            value={email}
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email}
            onChange={(e) => { setEmail(e.target.value); if(errors.email) setErrors({...errors, email: ''}); }}
            className={classes.input}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextField
            fullWidth
            label="Phone Number (Optional)"
            name="phone"
            value={phone}
            autoComplete="tel"
            error={!!errors.phone}
            helperText={errors.phone}
            onChange={(e) => { setPhone(e.target.value); if(errors.phone) setErrors({...errors, phone: ''}); }}
            className={classes.input}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextField
            required
            fullWidth
            label="Password"
            name="password"
            value={password}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password || 'Must be at least 8 characters long'}
            onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors({...errors, password: ''}); }}
            className={classes.input}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: 'rgba(255,255,255,0.4)' }}>
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
            label="Confirm Password"
            name="confirmPassword"
            value={confirmPassword}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); if(errors.confirmPassword) setErrors({...errors, confirmPassword: ''}); }}
            className={classes.input}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <FormControlLabel
            control={
              <Checkbox
                checked={acceptedTerms}
                onChange={(e) => { setAcceptedTerms(e.target.checked); if(errors.terms) setErrors({...errors, terms: ''}); }}
                sx={{ color: errors.terms ? '#f87171' : 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#3b82f6' } }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: errors.terms ? '#f87171' : 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                I agree to the Terms and Conditions
              </Typography>
            }
          />
          {errors.terms && <Typography variant="caption" sx={{ color: '#f87171', ml: 4, display: 'block', mt: -1 }}>{errors.terms}</Typography>}
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            variant="contained"
            fullWidth
            type="submit"
            disabled={loading}
            className={classes.registerButton}
          >
            {loading ? <CircularProgress size={26} color="inherit" /> : 'Create Account'}
          </Button>
        </motion.div>

        <motion.div className={classes.footer} variants={itemVariants}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Already have an account?{' '}
            <Link className={classes.loginLink} onClick={() => navigate('/login')} component="button" type="button">
              Sign In Here
            </Link>
          </Typography>
        </motion.div>
      </Box>
    </LoginLayout>
  );
};

export default Register;

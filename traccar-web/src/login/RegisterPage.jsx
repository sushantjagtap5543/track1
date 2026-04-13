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
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { Visibility, VisibilityOff, EmailOutlined, LockOutlined, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon, ArrowBack as BackIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2.5),
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
  vehicleToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    cursor: 'pointer',
    padding: theme.spacing(1.5, 2),
    borderRadius: '12px',
    border: '1px dashed rgba(59,130,246,0.4)',
    color: 'rgba(59,130,246,0.9)',
    background: 'rgba(59,130,246,0.05)',
    transition: 'all 0.2s ease',
    userSelect: 'none',
    '&:hover': {
      background: 'rgba(59,130,246,0.1)',
      border: '1px dashed rgba(59,130,246,0.7)',
    },
  },
  divider: {
    '&::before, &::after': {
      borderColor: 'rgba(255,255,255,0.1)',
    },
    color: 'rgba(255,255,255,0.3)',
    fontSize: '0.75rem',
    letterSpacing: '1px',
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing(2),
    left: theme.spacing(2),
    zIndex: 10,
    color: 'rgba(255, 255, 255, 0.5)',
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
  const [showVehicleFields, setShowVehicleFields] = useState(false);

  // Vehicle info
  const [vehicleName, setVehicleName] = useState('');
  const [deviceImei, setDeviceImei] = useState('');

  const isEmailValid = email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  const isPasswordValid = password.length >= 8;
  const isPasswordMatch = confirmPassword && password === confirmPassword;

  const isFormValid = () =>
    name.trim() &&
    isEmailValid &&
    isPasswordValid &&
    isPasswordMatch &&
    acceptedTerms &&
    (!showVehicleFields || (vehicleName.trim() && deviceImei.length === 15));

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');

    if (!isFormValid()) {
      if (!isPasswordValid) setErrorText('Security error: Password must be at least 8 characters.');
      else if (!isPasswordMatch) setErrorText('Security error: Passwords do not match.');
      else if (!acceptedTerms) setErrorText('Policy error: You must accept the terms and conditions.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email,
        phone: phone || undefined,
        password,
        vehicleName: showVehicleFields ? vehicleName.trim() : undefined,
        deviceImei: showVehicleFields ? deviceImei : undefined,
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccessText('Elite account initialized! Redirecting to secure login…');
        setTimeout(() => {
          navigate('/login', { state: { registered: true, email } });
        }, 1800);
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorText(data.error || data.details?.[0] || 'Registration deployment failed. Please try again.');
      }
    } catch (e) {
      console.error('[GeoSurePath] Registration Error:', e);
      setErrorText('Operational failure. Please verify the GeoSurePath engine is operational.');
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
          <Typography className={classes.subText}>Establish GeoSurePath Credentials</Typography>
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
            label="Full Operational Name"
            name="name"
            value={name}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
            className={classes.input}
          />
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <TextField
            required
            fullWidth
            type="email"
            label="Corporate Email Access"
            name="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            className={classes.input}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextField
            fullWidth
            label="Phone Contact (Optional)"
            name="phone"
            value={phone}
            autoComplete="tel"
            onChange={(e) => setPhone(e.target.value)}
            className={classes.input}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <TextField
            required
            fullWidth
            label="Access Password"
            name="password"
            value={password}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            className={classes.input}
            helperText="8+ character secure shield"
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
            label="Confirm Access Shield"
            name="confirmPassword"
            value={confirmPassword}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            error={!!confirmPassword && !isPasswordMatch}
            helperText={!!confirmPassword && !isPasswordMatch ? 'Shield mismatch detected' : ''}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={classes.input}
          />
        </motion.div>

        <Box 
          className={classes.vehicleToggle} 
          onClick={() => setShowVehicleFields(!showVehicleFields)}
          component={motion.div}
          variants={itemVariants}
          whileHover={{ scale: 1.02, background: 'rgba(59,130,246,0.1)' }}
          whileTap={{ scale: 0.98 }}
        >
          <DirectionsCarIcon />
          <Typography variant="body2" sx={{ fontWeight: 800, flexGrow: 1, letterSpacing: '0.5px' }}>
            Initialize First Fleet Vehicle
          </Typography>
          {showVehicleFields ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>

        <Collapse in={showVehicleFields}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1, pb: 2 }}>
            <TextField
              fullWidth
              label="Fleet Identifier (e.g. Unit 01)"
              value={vehicleName}
              onChange={(e) => setVehicleName(e.target.value)}
              className={classes.input}
            />
            <TextField
              fullWidth
              label="Hardware IMEI (15 digits)"
              value={deviceImei}
              onChange={(e) => setDeviceImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
              className={classes.input}
              helperText={deviceImei.length > 0 && deviceImei.length < 15 ? `${deviceImei.length}/15 digits entered` : ''}
            />
          </Box>
        </Collapse>

        <motion.div variants={itemVariants}>
          <FormControlLabel
            control={
              <Checkbox
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: '#3b82f6' } }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                Agree to GeoSurePath Operational Terms
              </Typography>
            }
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <Button
            variant="contained"
            fullWidth
            type="submit"
            disabled={loading || !isFormValid()}
            className={classes.registerButton}
          >
            {loading ? <CircularProgress size={26} color="inherit" /> : 'Establish Elite Account'}
          </Button>
        </motion.div>

        <motion.div className={classes.footer} variants={itemVariants}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Existing operative?{' '}
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

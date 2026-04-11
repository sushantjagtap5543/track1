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
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import LoginLayout from './LoginLayout';
import { useCatch } from '../reactHelper';
import { sessionActions } from '../store';
import BackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import { motion } from 'framer-motion';

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
    '&:hover': {
      color: theme.palette.primary.main,
      background: 'rgba(255, 255, 255, 0.1)',
      transform: 'translateX(-4px)',
    },
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
  registerButton: {
    borderRadius: '14px',
    padding: theme.spacing(1.8, 0),
    fontSize: '1.05rem',
    fontWeight: 900,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    boxShadow: '0 8px 25px rgba(59, 130, 246, 0.3)',
    transition: 'all 0.3s ease',
    marginTop: theme.spacing(1),
    '&:hover': {
      background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 35px rgba(59, 130, 246, 0.4)',
    },
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
    '&:hover': {
      textDecoration: 'underline',
      color: '#fff',
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

  // Optional vehicle fields
  const [showVehicle, setShowVehicle] = useState(false);
  const [vehicleName, setVehicleName] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [deviceImei, setDeviceImei] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  const isEmailValid = email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  const isPasswordValid = password.length >= 8;
  const isPasswordMatch = confirmPassword && password === confirmPassword;
  const isImeiValid = !showVehicle || (deviceImei.length === 15 && /^\d+$/.test(deviceImei));

  const isFormValid = () =>
    name.trim() &&
    isEmailValid &&
    isPasswordValid &&
    isPasswordMatch &&
    (!showVehicle || (vehicleName && deviceImei && isImeiValid)) &&
    acceptedTerms;

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');

    if (!isFormValid()) {
      if (!isPasswordValid) setErrorText('Password must be at least 8 characters.');
      else if (!isPasswordMatch) setErrorText('Passwords do not match.');
      else if (showVehicle && !isImeiValid) setErrorText('IMEI must be exactly 15 digits.');
      else if (!acceptedTerms) setErrorText('You must accept the terms and conditions.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        email,
        phone: phone || undefined,
        password,
        ...(showVehicle && {
          vehicleName,
          vehicleType: vehicleType || undefined,
          vehiclePlate: vehiclePlate || undefined,
          deviceImei,
        }),
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSuccessText('Account created successfully! Redirecting to login…');
        setTimeout(() => {
          navigate('/login', { state: { registered: true, email } });
        }, 1800);
      } else {
        setErrorText(data.error || 'Registration failed. Please try again.');
      }
    } catch (e) {
      setErrorText('Unable to connect to the server. Please check your connection.');
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={classes.container}
        onSubmit={handleSubmit}
      >
        <div className={classes.header}>
          <Typography className={classes.title}>Register</Typography>
          <Typography className={classes.subText}>Create your GeoSurePath account</Typography>
        </div>

        {errorText && (
          <Alert severity="error" sx={{ borderRadius: '8px' }}>{errorText}</Alert>
        )}
        {successText && (
          <Alert severity="success" sx={{ borderRadius: '8px' }}>{successText}</Alert>
        )}

        {/* Account Info */}
        <TextField
          required
          fullWidth
          label="Full Name"
          name="name"
          value={name}
          autoComplete="name"
          onChange={(e) => setName(e.target.value)}
          className={classes.input}
        />
        <TextField
          required
          fullWidth
          type="email"
          label="Email"
          name="email"
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
          className={classes.input}
        />
        <TextField
          fullWidth
          label="Phone (Optional)"
          name="phone"
          value={phone}
          autoComplete="tel"
          onChange={(e) => setPhone(e.target.value)}
          className={classes.input}
        />
        <TextField
          required
          fullWidth
          label="Password"
          name="password"
          value={password}
          type="password"
          autoComplete="new-password"
          onChange={(e) => setPassword(e.target.value)}
          className={classes.input}
          helperText="At least 8 characters"
        />
        <TextField
          required
          fullWidth
          label="Confirm Password"
          name="confirmPassword"
          value={confirmPassword}
          type="password"
          autoComplete="new-password"
          error={!!confirmPassword && !isPasswordMatch}
          helperText={!!confirmPassword && !isPasswordMatch ? 'Passwords do not match' : ''}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={classes.input}
        />

        {/* Optional Vehicle Section */}
        <Divider className={classes.divider}>OPTIONAL</Divider>

        <Box
          className={classes.vehicleToggle}
          onClick={() => setShowVehicle(!showVehicle)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowVehicle(!showVehicle)}
        >
          <DirectionsCarIcon fontSize="small" />
          <Typography sx={{ flex: 1, fontSize: '0.9rem', fontWeight: 600 }}>
            {showVehicle ? 'Hide Vehicle / Device Setup' : 'Add Vehicle & GPS Device (optional)'}
          </Typography>
          {showVehicle ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </Box>

        <Collapse in={showVehicle} unmountOnExit>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              fullWidth
              label="Vehicle Name"
              name="vehicleName"
              value={vehicleName}
              onChange={(e) => setVehicleName(e.target.value)}
              className={classes.input}
              placeholder="e.g. My Car"
            />
            <TextField
              fullWidth
              label="Vehicle Type"
              name="vehicleType"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className={classes.input}
              placeholder="e.g. Sedan, SUV, Truck"
            />
            <TextField
              fullWidth
              label="License Plate"
              name="vehiclePlate"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              className={classes.input}
            />
            <TextField
              fullWidth
              label="GPS Device IMEI"
              name="deviceImei"
              value={deviceImei}
              onChange={(e) => setDeviceImei(e.target.value)}
              className={classes.input}
              helperText="15-digit IMEI number printed on your GPS tracker"
            />
          </Box>
        </Collapse>

        <FormControlLabel
          control={
            <Checkbox
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              sx={{ color: 'rgba(255,255,255,0.4)', '&.Mui-checked': { color: '#3b82f6' } }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
              I agree to the Terms and Conditions
            </Typography>
          }
        />

        <Button
          variant="contained"
          fullWidth
          type="submit"
          disabled={loading || !isFormValid()}
          className={classes.registerButton}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
        </Button>

        <div className={classes.footer}>
          <Typography variant="body2" sx={{ color: '#fff' }}>
            Already have an account?{' '}
            <Link className={classes.loginLink} onClick={() => navigate('/login')} component="button" type="button">
              Login
            </Link>
          </Typography>
        </div>
      </Box>
    </LoginLayout>
  );
};

export default Register;

import { Box, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { motion } from 'framer-motion';
import { useTranslation } from '../common/components/LocalizationProvider';
import LogoImage from './LogoImage';


const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    height: '100dvh',
    width: '100vw',

    backgroundColor: '#020617',
    backgroundImage: 'linear-gradient(to right, rgba(2, 6, 23, 0.9), rgba(2, 6, 23, 0.5)), url(/geosurepath_login_bg.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      width: '140%',
      height: '140%',
      top: '-20%',
      left: '-20%',
    background: 'radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)',
      filter: 'blur(60px)',
      zIndex: 1,
      animation: 'moveBg 15s ease-in-out infinite alternate',
    },
    '@keyframes moveBg': {
      from: { transform: 'translate(0, 0) rotate(0deg)' },
      to: { transform: 'translate(3%, 3%) rotate(3deg)' },
    },
  },
  content: {
    display: 'flex',
    width: '100%',
    height: '100%',
    position: 'relative',
    zIndex: 10,
    [theme.breakpoints.down('md')]: {
      flexDirection: 'column',
      overflowY: 'auto',
    },
  },
  visualSide: {
    flex: 1.2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: theme.spacing(8),
    position: 'relative',
    background: 'rgba(15, 23, 42, 0.2)',
    backdropFilter: 'blur(3px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    [theme.breakpoints.down('md')]: {
      display: 'none',
    },
  },
  formSide: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(4),
    background: 'rgba(2, 6, 23, 0.1)',
    backdropFilter: 'blur(10px)',
    [theme.breakpoints.down('md')]: {
      flex: 'none',
      width: '100%',
      minHeight: '100%',
      backdropFilter: 'blur(20px)',
    },
  },
  tagline: {
    color: '#fff',
    fontWeight: 900,
    fontSize: '5.5rem',
    lineHeight: 0.95,
    marginBottom: theme.spacing(4),
    letterSpacing: '-5px',
    background: 'linear-gradient(to bottom, #fff 40%, rgba(59, 130, 246, 0.6) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    filter: 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))',
  },
  subTagline: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: '1.4rem',
    fontWeight: 500,
    maxWidth: '600px',
    lineHeight: 1.5,
    borderLeft: '3px solid #3b82f6',
    paddingLeft: theme.spacing(5),
    letterSpacing: '0.8px',
  },
  paper: {
    padding: theme.spacing(4, 3),
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    background: 'rgba(255, 255, 255, 0.02)',
    borderRadius: '32px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(12px)',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    position: 'relative',
    overflowY: 'auto',
    scrollbarGutter: 'stable',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%)',
      pointerEvents: 'none',
    },
  },
}));

const LoginLayout = ({ children }) => {
  const { classes } = useStyles();
  const theme = useTheme();
  const t = useTranslation();


  return (
    <Box component="main" className={classes.root}>
      <motion.div
        className={classes.content}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className={classes.visualSide}>
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 1.2, type: 'spring', damping: 20 }}
          >
            <LogoImage color="#fff" width={250} />
            <Typography
              component="h1"
              className={classes.tagline}
              sx={{ fontSize: '3.5rem', letterSpacing: '-2px', mb: 1 }}
            >

              GeoSurePath
            </Typography>
            <Typography
              variant="h5"
              sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 300, mb: 6, letterSpacing: '1px' }}
            >
              {t('loginTagline')}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, opacity: 0.8 }}>
              {[
                t('loginLiveTracking'),
                t('loginSecureAccess'),
                t('loginAdvancedAnalytics'),
              ].map((text, index) => (

                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#3b82f6',
                      boxShadow: '0 0 10px #3b82f6',
                    }}
                  />
                  <Typography
                    sx={{ color: '#fff', fontSize: '1rem', fontWeight: 500, letterSpacing: '0.5px' }}
                  >
                    {text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </motion.div>
        </div>
        <div className={classes.formSide}>
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 1, type: 'spring', stiffness: 80 }}
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
          >
            <Box className={classes.paper}>{children}</Box>
          </motion.div>
        </div>
      </motion.div>
    </Box>
  );
};

export default LoginLayout;

// traccar-web/src/other/AIInsightsPage.jsx
import React, { useState, useEffect } from 'react';
import { Typography, Container, Card, CardContent, CircularProgress, Box, Button, Divider } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { motion } from 'framer-motion';

const useStyles = makeStyles()((theme) => ({
  container: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
  },
  card: {
    background: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    color: '#fff',
    overflow: 'visible',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  icon: {
    color: '#38bdf8',
    fontSize: '2.5rem',
  },
  insightText: {
    fontSize: '1.2rem',
    lineHeight: 1.6,
    color: '#f1f5f9',
    fontStyle: 'italic',
  },
  gradientText: {
    background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 900,
  },
  footer: {
    marginTop: theme.spacing(4),
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    fontSize: '0.85rem',
  }
}));

const AIInsightsPage = () => {
  const { classes } = useStyles();
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsight = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token'); // or standard session
      const response = await fetch('/api/ai/insights', {
          headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch AI insights');
      const data = await response.json();
      setInsight(data.insight);
    } catch (err) {
      setError('AI Engine is currently optimizing. Please check back shortly.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsight();
  }, []);

  return (
    <Container className={classes.container} maxWidth="md">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Box className={classes.header}>
          <AutoAwesomeIcon className={classes.icon} />
          <Typography variant="h4" className={classes.gradientText}>
            GeoSure AI Insights
          </Typography>
        </Box>

        <Card className={classes.card}>
          <CardContent sx={{ p: 4 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress color="primary" />
              </Box>
            ) : error ? (
              <Typography color="error">{error}</Typography>
            ) : (
              <Box>
                <Typography className={classes.insightText}>
                  "{insight}"
                </Typography>
                <Divider sx={{ my: 3, opacity: 0.1 }} />
                <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                  Analyzed based on real-time fleet telemetry and historical patterns.
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
               <Button 
                variant="outlined" 
                onClick={fetchInsight}
                sx={{ borderRadius: '12px', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' }}
               >
                 Refresh Analysis
               </Button>
            </Box>
          </CardContent>
        </Card>

        <div className={classes.footer}>
          &copy; 2026 GeoSurePath Anti-Gravity Platform. AI insights are predictive and should be verified with operational data.
        </div>
      </motion.div>
    </Container>
  );
};

export default AIInsightsPage;

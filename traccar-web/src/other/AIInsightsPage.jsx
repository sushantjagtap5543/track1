import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Typography, Container, Card, CardContent, CircularProgress, Box, Button, Divider, Skeleton } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { motion, AnimatePresence } from 'framer-motion';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from '../settings/components/SettingsMenu';
import useSettingsStyles from '../settings/common/useSettingsStyles';

const AIInsightsPage = () => {
  const { classes: settingsClasses } = useSettingsStyles();
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInsight = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/insights');
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
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'AI Insights']}>
      <div className={settingsClasses.container}>
        <div className={settingsClasses.containerMain}>
          <Container maxWidth="md" sx={{ py: 4 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 5 }}>
                <Box sx={{
                  width: 56, height: 56, borderRadius: '18px',
                  background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 25px rgba(56, 189, 248, 0.5)',
                  position: 'relative',
                  '&::after': {
                      content: '""',
                      position: 'absolute', inset: -4,
                      borderRadius: '22px',
                      border: '2px solid rgba(56, 189, 248, 0.3)',
                      animation: 'pulse 2s infinite'
                  }
                }}>
                  <AutoAwesomeIcon sx={{ color: '#fff', fontSize: 32 }} />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ 
                    background: 'linear-gradient(90deg, #38bdf8 0%, #818cf8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 900,
                    fontSize: '2.4rem',
                    letterSpacing: '-0.03em'
                  }}>
                    GeoSure AI Insights
                  </Typography>
                  <Typography sx={{ color: '#64748b', fontWeight: 500 }}>
                    Powered by Anti-Gravity Intelligence Engine
                  </Typography>
                </Box>
              </Box>

              <Card sx={{ 
                background: 'rgba(30, 41, 59, 0.5)', 
                backdropFilter: 'blur(30px)', 
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '32px',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                overflow: 'visible',
                position: 'relative'
              }}>
                <CardContent sx={{ p: { xs: 3, md: 6 } }}>
                  <AnimatePresence mode="wait">
                    {loading ? (
                      <Box sx={{ py: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Skeleton variant="text" sx={{ fontSize: '1.5rem', bgcolor: 'rgba(255,255,255,0.05)' }} width="90%" />
                        <Skeleton variant="text" sx={{ fontSize: '1.5rem', bgcolor: 'rgba(255,255,255,0.05)' }} width="70%" />
                        <Skeleton variant="text" sx={{ fontSize: '1.5rem', bgcolor: 'rgba(255,255,255,0.05)' }} width="80%" />
                      </Box>
                    ) : error ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <Typography color="error" sx={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 600 }}>{error}</Typography>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Typography sx={{ 
                          fontSize: '1.6rem', lineHeight: 1.6, color: '#f8fafc', 
                          fontStyle: 'italic', fontWeight: 500,
                          textShadow: '0 0 30px rgba(56, 189, 248, 0.2)' 
                        }}>
                          "{insight}"
                        </Typography>
                        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.06)' }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                            <Typography variant="body2" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                Analysis Complete • Real-time Stream Active
                            </Typography>
                        </Box>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  <Box sx={{ mt: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#475569' }}>
                        * Insights are predictive and should be verified with operational data.
                    </Typography>
                    <Button 
                      variant="contained" 
                      onClick={fetchInsight}
                      disabled={loading}
                      sx={{ 
                        borderRadius: '16px', px: 4, py: 1.5,
                        background: 'rgba(56, 189, 248, 0.1)', 
                        color: '#38bdf8',
                        fontWeight: 800,
                        textTransform: 'none',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        '&:hover': {
                            background: '#38bdf8',
                            color: '#fff',
                            boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)'
                        }
                      }}
                    >
                      {loading ? 'Analyzing...' : 'Refresh Analysis'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              <Box sx={{ mt: 6, textAlign: 'center' }}>
                <Typography sx={{ color: '#334155', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em' }}>
                  &copy; 2026 GEOSUREPATH ANTI-GRAVITY PLATFORM • ALL RIGHTS RESERVED
                </Typography>
              </Box>
            </motion.div>
          </Container>
        </div>
      </div>
      <style>{`
        @keyframes pulse {
            0% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.05); opacity: 0.2; }
            100% { transform: scale(1); opacity: 0.5; }
        }
      `}</style>
    </PageLayout>
  );
};

export default AIInsightsPage;

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { makeStyles } from 'tss-react/mui';
import SettingsMenu from './components/SettingsMenu';
import PageLayout from '../common/components/PageLayout';
import useSettingsStyles from './common/useSettingsStyles';
import { useTranslation } from '../common/components/LocalizationProvider';
import fetchOrThrow from '../common/util/fetchOrThrow';

const useStyles = makeStyles()((theme) => ({
  container: {
    marginTop: theme.spacing(4),
    marginBottom: theme.spacing(4),
  },
  card: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'transform 0.3s ease, border-color 0.3s ease',
    '&:hover': {
      transform: 'translateY(-8px)',
      borderColor: theme.palette.primary.main,
    },
  },
  premiumCard: {
    borderColor: theme.palette.primary.main,
    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
  },
  price: {
    fontSize: '2.5rem',
    fontWeight: 900,
    margin: theme.spacing(2, 0),
    color: '#fff',
  },
  featureIcon: {
    color: theme.palette.primary.main,
  },
  historyPaper: {
    marginTop: theme.spacing(4),
    padding: theme.spacing(3),
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
  },
}));

const BillingPage = () => {
  const { classes: settingsClasses } = useSettingsStyles();
  const { classes } = useStyles();
  const t = useTranslation();
  const user = useSelector((state) => state.session.user);
  const server = useSelector((state) => state.session.server);
  const devices = useSelector((state) => state.devices.items);
  const deviceCount = Object.keys(devices).length || 1;
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const subRes = await fetch('/api/billing/subscription');
      if (subRes.ok) setSubscription(await subRes.json());

      const payRes = await fetch('/api/billing/history');
      if (payRes.ok) setPayments(await payRes.json());
    } catch (err) {
      setError('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    try {
      setError(null);
      const orderRes = await fetch('/api/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, deviceCount }),
      });

      if (!orderRes.ok) {
        const errorData = await orderRes.json();
        throw new Error(errorData.error || 'Order creation failed');
      }

      const order = await orderRes.json();

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_xxxx',
        amount: order.amount,
        currency: order.currency,
        name: 'GeoSurePath',
        description: `${plan.name} Subscription`,
        order_id: order.id,
        handler: async (response) => {
          const verifyRes = await fetch('/api/billing/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...response,
              planId: plan.id,
              deviceCount,
            }),
          });

          if (verifyRes.ok) {
            fetchData();
          } else {
            setError('Payment verification failed');
          }
        },
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || '',
        },
        theme: {
          color: '#3b82f6',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message);
    }
  };

  // Admin-configurable global pricing logic
  const getPlanPrice = (baseId, basePrice) => {
    const customPrice = server?.attributes[`billingPrice${baseId}`];
    return customPrice ? parseFloat(customPrice) : basePrice;
  };

  const plans = [
    {
      id: 'MONTHLY',
      name: 'Standard Monthly',
      price: getPlanPrice('MONTHLY', 200),
      period: 'month',
      features: ['Real-time tracking', 'Historical playbacks (30 days)', 'Email alerts', 'Included: GST, Server, Cloud, Services'],
    },
    {
      id: 'HALFYEARLY',
      name: 'Standard Half-Yearly',
      price: getPlanPrice('HALFYEARLY', 1000),
      period: '6 months',
      features: ['Everything in Monthly', 'Detailed Reports', 'Advanced Alerts', 'Included: GST, Server, Cloud, Services'],
    },
    {
      id: 'YEARLY',
      name: 'Standard Yearly',
      price: getPlanPrice('YEARLY', 2000),
      period: 'year',
      features: ['Everything in Half-Yearly', 'Engine Cut-off', 'Safe-parking zones', 'Included: GST, Server, Cloud, Services'],
      premium: true,
    },
  ];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#020617' }}><CircularProgress color="primary" /></Box>;

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'billingTitle']}>
      <div className={settingsClasses.container}>
        <div className={settingsClasses.containerMain}>
          <Container maxWidth="lg" sx={{ py: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Box sx={{
                width: 48, height: 48, borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(129,140,248,0.2) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
                border: '1px solid rgba(56,189,248,0.2)',
              }}>
                <ReceiptIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                  Billing & Subscriptions
                </Typography>
                <Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem' }}>
                  Manage your fleet subscriptions, payment methods, and transaction history.
                </Typography>
              </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 4, borderRadius: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</Alert>}

            {subscription && (
              <Box sx={{ 
                p: 3, mb: 4, borderRadius: '20px', 
                background: 'rgba(56, 189, 248, 0.1)', 
                border: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Subscription</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#f8fafc' }}>{subscription.planId || 'No Active Plan'}</Typography>
                  <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
                    Status: <Box component="span" sx={{ color: subscription.status === 'ACTIVE' ? '#10b981' : '#ef4444', fontWeight: 800 }}>{subscription.status}</Box>
                    {subscription.expiresAt && ` | Expires: ${new Date(subscription.expiresAt).toLocaleDateString()}`}
                  </Typography>
                </Box>
                {subscription.status === 'ACTIVE' && (
                  <Chip label="PRO PLAN" size="small" sx={{ background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)', color: '#fff', fontWeight: 900, fontSize: '0.7rem' }} />
                )}
              </Box>
            )}

            <Grid container spacing={3}>
              {plans.map((plan) => (
                <Grid item xs={12} md={4} key={plan.id}>
                  <Card className={`${classes.card} ${plan.premium ? classes.premiumCard : ''}`} sx={{ 
                    backgroundColor: 'rgba(30, 41, 59, 0.4)', 
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '24px',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-10px)',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)',
                        borderColor: '#38bdf8'
                    }
                  }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#f8fafc' }}>{plan.name}</Typography>
                      <Box sx={{ my: 3 }}>
                        <Typography component="span" variant="h3" sx={{ fontWeight: 900, color: '#fff' }}>₹{plan.price}</Typography>
                        <Typography component="span" variant="body2" sx={{ ml: 1, color: '#94a3b8', fontWeight: 600 }}>/dev/{plan.period}</Typography>
                        {deviceCount > 0 && (
                          <Typography variant="body2" sx={{ color: '#38bdf8', fontWeight: 700, mt: 1 }}>
                            Total: ₹{plan.price * deviceCount} for {deviceCount} {deviceCount === 1 ? 'device' : 'devices'}
                          </Typography>
                        )}
                      </Box>
                      <List sx={{ mb: 2 }}>
                        {plan.features.map((feature, i) => (
                          <ListItem key={i} disableGutters sx={{ py: 0.5 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}><CheckCircleIcon sx={{ color: '#10b981', fontSize: 18 }} /></ListItemIcon>
                            <ListItemText primary={feature} primaryTypographyProps={{ variant: 'body2', sx: { color: '#ffffff', fontWeight: 500 } }} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                    <CardActions sx={{ p: 3, pt: 0 }}>
                      <Button
                        fullWidth
                        variant={plan.premium ? "contained" : "outlined"}
                        sx={{ 
                          borderRadius: '16px', fontWeight: 800, py: 1.5,
                          textTransform: 'none',
                          background: plan.premium ? 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)' : 'rgba(255,255,255,0.03)',
                          borderColor: plan.premium ? 'transparent' : 'rgba(255,255,255,0.1)',
                          color: '#fff',
                          '&:hover': {
                              background: plan.premium ? 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)' : 'rgba(255,255,255,0.08)',
                              borderColor: '#38bdf8'
                          }
                        }}
                        onClick={() => handleSubscribe(plan)}
                      >
                        {subscription?.planId === plan.id ? 'Renew Plan' : 'Get Started'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Paper sx={{ 
              mt: 6, p: 4, borderRadius: '24px', 
              background: 'rgba(30, 41, 59, 0.4)', 
              border: '1px solid rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)'
            }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 4, color: '#f8fafc', fontWeight: 800 }}>
                <ReceiptIcon sx={{ color: '#818cf8' }} /> Transaction History
              </Typography>
              {payments.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                    <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>No transaction history found.</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {payments.map((payment, i) => (
                    <React.Fragment key={payment.id}>
                      <ListItem sx={{ py: 2.5, px: 0 }}>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography sx={{ fontWeight: 800, color: '#f8fafc', fontSize: '1rem' }}>₹{payment.amount}</Typography>
                                <Chip 
                                    label={payment.status} 
                                    size="small" 
                                    sx={{ 
                                        backgroundColor: payment.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: payment.status === 'COMPLETED' ? '#10b981' : '#ef4444',
                                        fontWeight: 900, fontSize: '0.65rem', borderRadius: '8px'
                                    }} 
                                />
                            </Box>
                          }
                          secondary={
                            <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', mt: 0.5 }}>
                                {new Date(payment.createdAt).toLocaleString()} | Transaction ID: <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{payment.transactionId || 'N/A'}</span>
                            </Typography>
                          }
                        />
                      </ListItem>
                      {i < payments.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Paper>
          </Container>
        </div>
      </div>
    </PageLayout>
  );
};

export default BillingPage;

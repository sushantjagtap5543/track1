import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { makeStyles } from 'tss-react/mui';
import SettingsMenu from './components/SettingsMenu';
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
  const { classes } = useStyles();
  const t = useTranslation();
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
      const orderRes = await fetch('/api/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: plan.price, planId: plan.id }),
      });

      if (!orderRes.ok) throw new Error('Order creation failed');

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
            }),
          });

          if (verifyRes.ok) {
            fetchData();
          } else {
            setError('Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
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

  const plans = [
    {
      id: 'STANDARD',
      name: 'Standard Plan',
      price: 2999,
      features: ['Real-time tracking', 'Historical playbacks (30 days)', 'Email alerts', 'Mobile App access'],
    },
    {
      id: 'PREMIUM',
      name: 'Premium Plan',
      price: 4999,
      features: ['Everything in Standard', 'Engine Cut-off', 'Safe-parking zones', 'Priority Support', 'Advanced Analytics'],
      premium: true,
    },
  ];

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <SettingsMenu />
      <Container className={classes.container} maxWidth="lg">
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 900, color: '#fff', mb: 4 }}>
          Billing & Subscriptions
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>}

        {subscription && (
          <Paper sx={{ p: 4, mb: 4, borderRadius: '16px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h6" color="primary" gutterBottom>Current Subscription</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{subscription.planId || 'No Active Plan'}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.7 }}>
                  Status: <Box component="span" sx={{ color: subscription.status === 'ACTIVE' ? '#10b981' : '#ef4444', fontWeight: 700 }}>{subscription.status}</Box>
                  {subscription.expiresAt && ` | Expires: ${new Date(subscription.expiresAt).toLocaleDateString()}`}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        <Grid container spacing={4}>
          {plans.map((plan) => (
            <Grid item xs={12} md={6} key={plan.id}>
              <Card className={`${classes.card} ${plan.premium ? classes.premiumCard : ''}`}>
                <CardContent>
                  <Typography variant="h5" color="textPrimary" sx={{ fontWeight: 800 }}>{plan.name}</Typography>
                  <Box className={classes.price}>
                    ₹{plan.price}<Typography component="span" variant="body2" sx={{ ml: 1, color: 'rgba(255,255,255,0.5)' }}>/year</Typography>
                  </Box>
                  <List>
                    {plan.features.map((feature, i) => (
                      <ListItem key={i} disableGutters>
                        <ListItemIcon sx={{ minWidth: 36 }}><CheckCircleIcon className={classes.featureIcon} fontSize="small" /></ListItemIcon>
                        <ListItemText primary={feature} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
                <CardActions sx={{ p: 3 }}>
                  <Button
                    fullWidth
                    variant={plan.premium ? "contained" : "outlined"}
                    color="primary"
                    size="large"
                    sx={{ borderRadius: '12px', fontWeight: 800, py: 1.5 }}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {subscription?.planId === plan.id ? 'Renew Now' : 'Upgrade Now'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Paper className={classes.historyPaper}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <ReceiptIcon /> Payment History
          </Typography>
          {payments.length === 0 ? (
            <Typography variant="body2" sx={{ opacity: 0.5, textAlign: 'center', py: 4 }}>No transaction history found.</Typography>
          ) : (
            <List sx={{ width: '100%' }}>
              {payments.map((payment, i) => (
                <React.Fragment key={payment.id}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemText
                      primary={`₹${payment.amount} - ${payment.status}`}
                      secondary={`${new Date(payment.createdAt).toLocaleString()} | ID: ${payment.transactionId || 'N/A'}`}
                      primaryTypographyProps={{ fontWeight: 700, color: payment.status === 'COMPLETED' ? '#10b981' : '#fff' }}
                    />
                  </ListItem>
                  {i < payments.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default BillingPage;

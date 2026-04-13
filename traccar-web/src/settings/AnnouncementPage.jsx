import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
  TextField,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import { useCatchCallback } from '../reactHelper';
import useSettingsStyles from './common/useSettingsStyles';
import SelectField from '../common/components/SelectField';
import { prefixString } from '../common/util/stringUtils';
import fetchOrThrow from '../common/util/fetchOrThrow';

import CampaignIcon from '@mui/icons-material/Campaign';
import { Paper, Box } from '@mui/material';

const AnnouncementPage = () => {
  const navigate = useNavigate();
  const { classes: settingsClasses } = useSettingsStyles();
  const t = useTranslation();

  const [users, setUsers] = useState([]);
  const [notificator, setNotificator] = useState();
  const [message, setMessage] = useState({});

  const handleSend = useCatchCallback(async () => {
    const query = new URLSearchParams();
    users.forEach((userId) => query.append('userId', userId));
    await fetchOrThrow(`/api/notifications/send/${notificator}?${query.toString()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    });
    navigate(-1);
  }, [users, notificator, message, navigate]);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['serverAnnouncement']}>
      <Box sx={{ p: 3, maxWidth: '800px', margin: '0 auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, ml: 1 }}>
            <Box sx={{
            width: 48, height: 48, borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(232, 121, 249, 0.2) 0%, rgba(192, 38, 211, 0.2) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
            border: '1px solid rgba(232, 121, 249, 0.2)',
            }}>
            <CampaignIcon sx={{ color: '#e879f9', fontSize: 28 }} />
            </Box>
            <Box>
            <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{t('serverAnnouncement')}</Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                Broadcast system-wide messages and alerts to all platform users.
            </Typography>
            </Box>
        </Box>

        <Paper sx={{ 
            p: 4, borderRadius: '24px', 
            background: 'rgba(30, 41, 59, 0.4)', 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
        }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
            <SelectField
              multiple
              fullWidth
              value={users}
              onChange={(e) => setUsers(e.target.value)}
              endpoint="/api/users"
              label={t('settingsUsers')}
            />
            <SelectField
              fullWidth
              value={notificator}
              onChange={(e) => setNotificator(e.target.value)}
              endpoint="/api/notifications/notificators?announcement=true"
              keyGetter={(it) => it.type}
              titleGetter={(it) => t(prefixString('notificator', it.type))}
              label={t('notificationNotificators')}
            />
          </Box>
          <TextField
            fullWidth
            value={message.subject || ''}
            onChange={(e) => setMessage({ ...message, subject: e.target.value })}
            label={t('sharedSubject')}
            sx={{ mb: 3 }}
          />
          <TextField
            fullWidth
            multiline
            rows={6}
            value={message.body || ''}
            onChange={(e) => setMessage({ ...message, body: e.target.value })}
            label={t('commandMessage')}
            sx={{ mb: 4 }}
          />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button 
                variant="outlined" 
                onClick={() => navigate(-1)}
                sx={{ 
                    borderRadius: '12px', px: 4, py: 1.2, fontWeight: 700,
                    borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8',
                    '&:hover': { borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.02)' }
                }}
            >
              {t('sharedCancel')}
            </Button>
            <Button
              variant="contained"
              onClick={handleSend}
              disabled={!notificator || !message.subject || !message.body}
              sx={{ 
                  borderRadius: '12px', px: 6, py: 1.2, fontWeight: 900,
                  background: 'linear-gradient(135deg, #e879f9 0%, #c026d3 100%)',
                  boxShadow: '0 8px 16px rgba(232, 121, 249, 0.25)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #d946ef 0%, #a21caf 100%)',
                  }
              }}
            >
              {t('commandSend')}
            </Button>
          </Box>
        </Paper>
      </Box>
    </PageLayout>
  );
};

export default AnnouncementPage;

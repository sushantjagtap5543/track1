import { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Button,
  TextField,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';
import InfoIcon from '@mui/icons-material/Info';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useTranslation, useTranslationKeys } from '../common/components/LocalizationProvider';
import EditItemView from './components/EditItemView';
import { prefixString, unprefixString } from '../common/util/stringUtils';
import SelectField from '../common/components/SelectField';
import SettingsMenu from './components/SettingsMenu';
import { useCatch } from '../reactHelper';
import useReportStyles from '../reports/common/useReportStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

const NotificationPage = () => {
  const { classes } = useReportStyles();
  const t = useTranslation();

  const [item, setItem] = useState();

  const alarms = useTranslationKeys((it) => it.startsWith('alarm')).map((it) => ({
    key: unprefixString('alarm', it),
    name: t(it),
  }));

  const testNotificators = useCatch(async () => {
    await Promise.all(
      item.notificators.split(/[, ]+/).map(async (notificator) => {
        await fetchOrThrow(`/api/notifications/test/${notificator}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
      }),
    );
  });

  const validate = () =>
    item &&
    item.type &&
    item.notificators &&
    (!item.notificators?.includes('command') || item.commandId);

  const customStyles = {
    accordion: {
      backgroundColor: 'rgba(30, 41, 59, 0.4)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px !important',
      boxShadow: 'none',
      marginBottom: '16px',
      overflow: 'hidden',
      '&:before': { display: 'none' },
    },
    accordionSummary: {
      padding: '8px 24px',
      '& .MuiAccordionSummary-expandIconWrapper': {
        color: '#94a3b8',
      },
      '&.Mui-expanded': {
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      }
    },
    details: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      padding: '24px',
    },
    textField: {
      '& .MuiOutlinedInput-root': {
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '12px',
        color: '#f8fafc !important',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '& fieldset': { border: 'none' },
        '& .MuiInputBase-input': { color: '#f8fafc !important' },
        '&:hover': { backgroundColor: 'rgba(15, 23, 42, 0.8)' },
        '&.Mui-focused': { boxShadow: '0 0 0 2px rgba(56, 189, 248, 0.2)' }
      },
      '& .MuiInputLabel-root': {
        color: '#94a3b8 !important',
        '&.Mui-focused': { color: '#38bdf8 !important' }
      }
    }
  };

  return (
    <EditItemView
      endpoint="notifications"
      item={item}
      setItem={setItem}
      validate={validate}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedNotification']}
    >
      {item && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, ml: 1 }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(129,140,248,0.2) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
              border: '1px solid rgba(56,189,248,0.2)',
            }}>
              <NotificationsIcon sx={{ color: '#38bdf8', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>
                {item.id ? 'Edit Notification' : 'New Notification'}
              </Typography>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                Define trigger conditions and delivery methods for this alert.
              </Typography>
            </Box>
          </Box>

          <Accordion sx={customStyles.accordion} defaultExpanded>
            <AccordionSummary sx={customStyles.accordionSummary} expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SettingsIcon sx={{ mr: 1.5, color: '#38bdf8', fontSize: 20 }} />
                <Typography sx={{ color: '#f8fafc', fontWeight: 700 }}>{t('sharedRequired')}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={customStyles.details}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <SelectField
                  sx={customStyles.textField}
                  value={item.type}
                  onChange={(e) => setItem({ ...item, type: e.target.value })}
                  endpoint="/api/notifications/types"
                  keyGetter={(it) => it.type}
                  titleGetter={(it) => t(prefixString('event', it.type))}
                  label={t('sharedType')}
                />
                <SelectField
                  multiple
                  sx={customStyles.textField}
                  value={item.notificators ? item.notificators.split(/[, ]+/) : []}
                  onChange={(e) => setItem({ ...item, notificators: e.target.value.join() })}
                  endpoint="/api/notifications/notificators"
                  keyGetter={(it) => it.type}
                  titleGetter={(it) => t(prefixString('notificator', it.type))}
                  label={t('notificationNotificators')}
                />
              </Box>

              {item.type === 'alarm' && (
                <SelectField
                  multiple
                  sx={customStyles.textField}
                  value={item.attributes && item.attributes.alarms ? item.attributes.alarms.split(/[, ]+/) : []}
                  onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, alarms: e.target.value.join() } })}
                  data={alarms}
                  keyGetter={(it) => it.key}
                  label={t('sharedAlarms')}
                />
              )}

              {item.notificators?.includes('command') && (
                <SelectField
                  sx={customStyles.textField}
                  value={item.commandId}
                  onChange={(e) => setItem({ ...item, commandId: Number(e.target.value) })}
                  endpoint="/api/commands"
                  titleGetter={(it) => it.description}
                  label={t('sharedSavedCommand')}
                />
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Verify your notification channel configuration before saving.
                </Typography>
                <Button
                  variant="contained"
                  onClick={testNotificators}
                  disabled={!item.notificators}
                  sx={{ 
                    borderRadius: '10px', textTransform: 'none', fontWeight: 700,
                    background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    '&:hover': { background: 'rgba(56, 189, 248, 0.2)' }
                  }}
                >
                  {t('sharedTestNotificators')}
                </Button>
              </Box>

              <FormControlLabel
                sx={{ color: '#f8fafc', ml: 0.5, '& .MuiCheckbox-root': { color: '#334155', '&.Mui-checked': { color: '#38bdf8' } } }}
                control={
                  <Checkbox
                    checked={item.always}
                    onChange={(e) => setItem({ ...item, always: e.target.checked })}
                  />
                }
                label={<Typography sx={{ fontSize: '0.85rem' }}>{t('notificationAlways')}</Typography>}
              />
            </AccordionDetails>
          </Accordion>

          <Accordion sx={customStyles.accordion}>
            <AccordionSummary sx={customStyles.accordionSummary} expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <InfoIcon sx={{ mr: 1.5, color: '#818cf8', fontSize: 20 }} />
                <Typography sx={{ color: '#f8fafc', fontWeight: 700 }}>{t('sharedExtra')}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={customStyles.details}>
              <TextField
                sx={customStyles.textField}
                fullWidth
                value={item.description || ''}
                onChange={(e) => setItem({ ...item, description: e.target.value })}
                label={t('sharedDescription')}
              />
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                <SelectField
                  sx={customStyles.textField}
                  value={item.calendarId}
                  onChange={(e) => setItem({ ...item, calendarId: Number(e.target.value) })}
                  endpoint="/api/calendars"
                  label={t('sharedCalendar')}
                />
                <FormControlLabel
                  sx={{ color: '#f8fafc', ml: 0.5, '& .MuiCheckbox-root': { color: '#334155', '&.Mui-checked': { color: '#818cf8' } } }}
                  control={
                    <Checkbox
                      checked={item.attributes && item.attributes.priority}
                      onChange={(e) => setItem({ ...item, attributes: { ...item.attributes, priority: e.target.checked } })}
                    />
                  }
                  label={<Typography sx={{ fontSize: '0.85rem' }}>{t('sharedPriority')}</Typography>}
                />
              </Box>

              {['geofenceEnter', 'geofenceExit'].includes(item.type) && (
                <SelectField
                  multiple
                  sx={customStyles.textField}
                  value={item.attributes?.geofenceIds ? item.attributes.geofenceIds.split(',') : []}
                  onChange={(e) => {
                    const geofenceIds = e.target.value.join();
                    const attributes = { ...item.attributes };
                    if (geofenceIds) attributes.geofenceIds = geofenceIds; else delete attributes.geofenceIds;
                    setItem({ ...item, attributes });
                  }}
                  endpoint="/api/geofences"
                  keyGetter={(it) => String(it.id)}
                  label={t('sharedGeofences')}
                />
              )}
            </AccordionDetails>
          </Accordion>

        </Box>
      )}
    </EditItemView>
  );
};

export default NotificationPage;

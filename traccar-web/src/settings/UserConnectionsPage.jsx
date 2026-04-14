import { useParams } from 'react-router-dom';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Container,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LinkIcon from '@mui/icons-material/Link';
import { Box } from '@mui/material';
import LinkField from '../common/components/LinkField';
import { useTranslation } from '../common/components/LocalizationProvider';
import SettingsMenu from './components/SettingsMenu';
import { formatNotificationTitle } from '../common/util/formatter';
import PageLayout from '../common/components/PageLayout';
import useSettingsStyles from './common/useSettingsStyles';

const UserConnectionsPage = () => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();

  const { id } = useParams();

  return (
    <PageLayout
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'settingsUser', 'sharedConnections']}
    >
      <div className={classes.container}>
        <div className={classes.containerMain}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, ml: 1, animation: 'slide-in-right 0.5s ease-out' }}>
            <Box sx={{
              width: 56, height: 56, borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(129, 140, 248, 0.25) 0%, rgba(56, 189, 248, 0.25) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2.5,
              border: '1px solid rgba(129, 140, 248, 0.3)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            }}>
              <LinkIcon sx={{ color: '#818cf8', fontSize: 32 }} />
            </Box>
            <Box>
              <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.025em', lineHeight: 1.2 }}>{t('sharedConnections')}</Typography>
              <Typography sx={{ color: '#cbd5e1', fontSize: '0.9rem', mt: 0.5 }}>
                Manage relationships and administrative links between system entities.
              </Typography>
            </Box>
          </Box>

          <Accordion defaultExpanded sx={{ background: 'rgba(15, 23, 42, 0.3)', backdropFilter: 'blur(10px)', borderRadius: '20px !important', border: '1px solid rgba(255, 255, 255, 0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#818cf8' }} />} sx={{ px: 3, py: 1 }}>
              <Typography sx={{ color: '#818cf8', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{t('sharedConnections')}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 3, pb: 4, pt: 0 }}>
            <LinkField
              endpointAll="/api/devices?all=true&excludeAttributes=true"
              endpointLinked={`/api/devices?userId=${id}&excludeAttributes=true`}
              baseId={id}
              keyBase="userId"
              keyLink="deviceId"
              titleGetter={(it) => `${it.name} (${it.uniqueId})`}
              label={t('deviceTitle')}
            />
            <LinkField
              endpointAll="/api/groups?all=true"
              endpointLinked={`/api/groups?userId=${id}`}
              baseId={id}
              keyBase="userId"
              keyLink="groupId"
              label={t('settingsGroups')}
            />
            <LinkField
              endpointAll="/api/geofences?all=true"
              endpointLinked={`/api/geofences?userId=${id}`}
              baseId={id}
              keyBase="userId"
              keyLink="geofenceId"
              label={t('sharedGeofences')}
            />
            <LinkField
              endpointAll="/api/notifications?all=true"
              endpointLinked={`/api/notifications?userId=${id}`}
              baseId={id}
              keyBase="userId"
              keyLink="notificationId"
              titleGetter={(it) => formatNotificationTitle(t, it, true)}
              label={t('sharedNotifications')}
            />
            <LinkField
              endpointAll="/api/calendars?all=true"
              endpointLinked={`/api/calendars?userId=${id}`}
              baseId={id}
              keyBase="userId"
              keyLink="calendarId"
              label={t('sharedCalendars')}
            />
            <LinkField
              endpointAll="/api/users?all=true&excludeAttributes=true"
              endpointLinked={`/api/users?userId=${id}&excludeAttributes=true`}
              baseId={id}
              keyBase="userId"
              keyLink="managedUserId"
              label={t('settingsUsers')}
            />
            <LinkField
              endpointAll="/api/attributes/computed?all=true"
              endpointLinked={`/api/attributes/computed?userId=${id}`}
              baseId={id}
              keyBase="userId"
              keyLink="attributeId"
              titleGetter={(it) => it.description}
              label={t('sharedComputedAttributes')}
            />
            <LinkField
              endpointAll="/api/drivers?all=true"
              endpointLinked={`/api/drivers?userId=${id}`}
              baseId={id}
              keyBase="userId"
              keyLink="driverId"
              titleGetter={(it) => `${it.name} (${it.uniqueId})`}
              label={t('sharedDrivers')}
            />
            <LinkField
              endpointAll="/api/commands?all=true"
              endpointLinked={`/api/commands?userId=${id}`}
              baseId={id}
              keyBase="userId"
              keyLink="commandId"
              titleGetter={(it) => it.description}
              label={t('sharedSavedCommands')}
            />
            <LinkField
              endpointAll="/api/maintenance?all=true"
              endpointLinked={`/api/maintenance?userId=${id}`}
              baseId={id}
              keyBase="userId"
              keyLink="maintenanceId"
              label={t('sharedMaintenance')}
            />
          </AccordionDetails>
        </Accordion>
        </div>
      </div>
    </PageLayout>
  );
};

export default UserConnectionsPage;

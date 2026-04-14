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
import useFeatures from '../common/util/useFeatures';
import useSettingsStyles from './common/useSettingsStyles';

const GroupConnectionsPage = () => {
  const { classes } = useSettingsStyles();
  const t = useTranslation();

  const { id } = useParams();

  const features = useFeatures();

  return (
    <PageLayout
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'groupDialog', 'sharedConnections']}
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
              endpointAll="/api/geofences"
              endpointLinked={`/api/geofences?groupId=${id}`}
              baseId={id}
              keyBase="groupId"
              keyLink="geofenceId"
              label={t('sharedGeofences')}
            />
            <LinkField
              endpointAll="/api/notifications"
              endpointLinked={`/api/notifications?groupId=${id}`}
              baseId={id}
              keyBase="groupId"
              keyLink="notificationId"
              titleGetter={(it) => formatNotificationTitle(t, it)}
              label={t('sharedNotifications')}
            />
            {!features.disableDrivers && (
              <LinkField
                endpointAll="/api/drivers"
                endpointLinked={`/api/drivers?groupId=${id}`}
                baseId={id}
                keyBase="groupId"
                keyLink="driverId"
                titleGetter={(it) => `${it.name} (${it.uniqueId})`}
                label={t('sharedDrivers')}
              />
            )}
            {!features.disableComputedAttributes && (
              <LinkField
                endpointAll="/api/attributes/computed"
                endpointLinked={`/api/attributes/computed?groupId=${id}`}
                baseId={id}
                keyBase="groupId"
                keyLink="attributeId"
                titleGetter={(it) => it.description}
                label={t('sharedComputedAttributes')}
              />
            )}
            {!features.disableSavedCommands && (
              <LinkField
                endpointAll="/api/commands"
                endpointLinked={`/api/commands?groupId=${id}`}
                baseId={id}
                keyBase="groupId"
                keyLink="commandId"
                titleGetter={(it) => it.description}
                label={t('sharedSavedCommands')}
              />
            )}
            {!features.disableMaintenance && (
              <LinkField
                endpointAll="/api/maintenance"
                endpointLinked={`/api/maintenance?groupId=${id}`}
                baseId={id}
                keyBase="groupId"
                keyLink="maintenanceId"
                label={t('sharedMaintenance')}
              />
            )}
          </AccordionDetails>
        </Accordion>
        </div>
      </div>
    </PageLayout>
  );
};

export default GroupConnectionsPage;

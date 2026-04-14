import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  IconButton,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import DeleteIcon from '@mui/icons-material/Delete';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { formatNotificationTitle, formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { eventsActions } from '../store';

const useStyles = makeStyles()((theme) => ({
  drawerPaper: {
    width: theme.dimensions.eventsDrawerWidth,
    backgroundColor: '#0f172a', // Deep slate background
    color: '#f1f5f9',
    borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
    zoom: '0.8',
  },
  toolbar: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
  },
  title: {
    flexGrow: 1,
    fontWeight: 800,
    fontSize: '1rem',
    color: '#f8fafc',
  },
  item: {
    margin: theme.spacing(0.2, 1.5),
    padding: theme.spacing(0.8, 1.5),
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      transform: 'translateX(-4px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
  },
  primaryText: {
    fontWeight: 700,
    fontSize: '0.85rem',
    color: '#f1f5f9',
  },
  secondaryText: {
    fontSize: '0.7rem',
    color: '#64748b',
    fontWeight: 500,
  },
  deleteIcon: {
    color: 'rgba(255, 255, 255, 0.3)',
    '&:hover': {
      color: '#ef4444',
    },
  },
}));

const EventsDrawer = ({ open, onClose }) => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const devices = useSelector((state) => state.devices.items);

  const events = useSelector((state) => state.events.items);

  const formatType = (event) =>
    formatNotificationTitle(t, {
      type: event.type,
      attributes: {
        alarms: event.attributes.alarm,
      },
    });

  return (
    <Drawer 
      anchor="right" 
      open={open} 
      onClose={onClose}
      PaperProps={{ className: classes.drawerPaper }}
    >
      <Toolbar className={classes.toolbar} disableGutters>
        <Typography variant="h6" className={classes.title}>
          {t('reportEvents')}
        </Typography>

        <Button
          variant="contained"
          size="small"
          startIcon={<NotificationsActiveIcon />}
          sx={{ mr: 2, bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', fontWeight: 800, border: '1px solid rgba(245, 158, 11, 0.4)', '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.4)' } }}
          onClick={() => {
            const traccarEventTypes = [
               { type: 'deviceOnline' }, { type: 'deviceOffline' }, { type: 'deviceMoving' },
               { type: 'deviceStopped' }, { type: 'deviceOverspeed' }, { type: 'geofenceEnter' },
               { type: 'geofenceExit' }, { type: 'ignitionOn' }, { type: 'ignitionOff' },
               { type: 'alarm', attributes: { alarm: 'sos' } },
               { type: 'alarm', attributes: { alarm: 'vibration' } },
               { type: 'alarm', attributes: { alarm: 'movement' } },
               { type: 'alarm', attributes: { alarm: 'lowBattery' } },
               { type: 'alarm', attributes: { alarm: 'powerCut' } },
               { type: 'alarm', attributes: { alarm: 'tow' } },
               { type: 'alarm', attributes: { alarm: 'hardAcceleration' } },
               { type: 'alarm', attributes: { alarm: 'hardBraking' } },
               { type: 'alarm', attributes: { alarm: 'hardCornering' } },
               { type: 'alarm', attributes: { alarm: 'fatigueDriving' } },
               { type: 'alarm', attributes: { alarm: 'jamming' } },
               { type: 'maintenance' }
            ];
            
            const activeDeviceId = Object.keys(devices)[0] || 0;
            
            // Dispatch 20+ alerts sequentially to test popups, details and sound.
            traccarEventTypes.forEach((ev, i) => {
               setTimeout(() => {
                 window.dispatchEvent(new CustomEvent('sim_events', { 
                   detail: [{ ...ev, id: Date.now() + i, deviceId: activeDeviceId, eventTime: new Date().toISOString() }] 
                 }));
               }, i * 2000); // Deploy an event every 2 seconds to allow popups and sound verification
            });
          }}
        >
          TEST 20+ ALERTS
        </Button>

        <IconButton
          size="small"
          color="inherit"
          onClick={() => dispatch(eventsActions.deleteAll())}
          sx={{ color: 'rgba(255,255,255,0.4)', '&:hover': { color: '#ef4444' } }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Toolbar>
      <List sx={{ mt: 1 }}>
        {events.map((event) => (
          <ListItemButton
            key={event.id}
            onClick={() => navigate(`/event/${event.id}`)}
            disabled={!event.id}
            className={classes.item}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                  <Typography className={classes.primaryText} noWrap sx={{ flexBasis: '70%' }}>
                    {`${devices[event.deviceId]?.name} • ${formatType(event)}`}
                  </Typography>
                  <Typography className={classes.secondaryText} sx={{ flexBasis: '25%', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {formatTime(event.eventTime, 'seconds')}
                  </Typography>
                </Box>
              }
            />
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                dispatch(eventsActions.delete(event));
              }}
              className={classes.deleteIcon}
              sx={{ ml: 1 }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
};

export default EventsDrawer;

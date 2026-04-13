import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import {
  IconButton,
  Tooltip,
  Avatar,
  ListItemAvatar,
  ListItemText,
  ListItemButton,
  Typography,
  Stack,
  Box,
} from '@mui/material';
import BatteryFullIcon from '@mui/icons-material/BatteryFull';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import Battery60Icon from '@mui/icons-material/Battery60';
import BatteryCharging60Icon from '@mui/icons-material/BatteryCharging60';
import Battery20Icon from '@mui/icons-material/Battery20';
import BatteryCharging20Icon from '@mui/icons-material/BatteryCharging20';
import ErrorIcon from '@mui/icons-material/Error';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SecurityIcon from '@mui/icons-material/Security';
import LocalParkingIcon from '@mui/icons-material/LocalParking';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import FenceIcon from '@mui/icons-material/Fence';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { devicesActions } from '../store';
import {
  formatAlarm,
  formatBoolean,
  formatPercentage,
  formatStatus,
  getStatusColor,
} from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { useAdministrator } from '../common/util/permissions';
import EngineIcon from '../resources/images/data/engine.svg?react';
import { useAttributePreference } from '../common/util/preferences';
import GeofencesValue from '../common/components/GeofencesValue';
import DriverValue from '../common/components/DriverValue';
import MotionBar from './components/MotionBar';
import fetchOrThrow from '../common/util/fetchOrThrow';

dayjs.extend(relativeTime);

const useStyles = makeStyles()((theme) => ({
  item: {
    margin: theme.spacing(0.5, 1.5),
    padding: theme.spacing(1.2, 1.5),
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.3)',
    },
    '&.Mui-selected': {
      backgroundColor: 'rgba(59, 130, 246, 0.08) !important',
      borderLeft: `4px solid ${theme.palette.primary.main}`,
      borderColor: 'rgba(59, 130, 246, 0.2)',
      '& .MuiListItemAvatar-root .MuiAvatar-root': {
        boxShadow: `0 0 20px ${theme.palette.primary.main}55`,
        borderColor: theme.palette.primary.main,
      },
    },
  },
  avatar: {
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    width: '44px',
    height: '44px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
  },
  icon: {
    width: '26px',
    height: '26px',
    filter: 'brightness(0) invert(1)',
  },
  statusBadge: {
    fontWeight: 900,
    textTransform: 'uppercase',
    fontSize: '0.55rem',
    letterSpacing: '0.08em',
    padding: '2px 8px',
    borderRadius: '2000px', // Capsule style
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  actionButton: {
    padding: '4px 8px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      transform: 'scale(1.05)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '& svg': {
       fontSize: '15px',
    }
  },
  batteryLevel: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: '2px 8px',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    '& svg': { fontSize: '12px' },
    '& span': { fontSize: '0.6rem', marginLeft: '4px', fontWeight: 600, color: '#94a3b8' }
  },
  success: { color: '#10b981' }, // Tailwind emerald-500
  warning: { color: '#f59e0b' }, // Tailwind amber-500
  error: { color: '#ef4444' }, // Tailwind red-500
  neutral: { color: 'rgba(255, 255, 255, 0.35)' },
  ignitionActive: { 
    color: '#fbbf24', 
    filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.6))',
  },
}));

const DeviceRow = ({ devices, index, style }) => {
  const { classes, cx } = useStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const admin = useAdministrator();
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const item = devices[index];
  const position = useSelector((state) => state.session.positions[item.id]);

  const devicePrimary = useAttributePreference('devicePrimary', 'name');
  const deviceSecondary = useAttributePreference('deviceSecondary', '');

  const resolveFieldValue = (field) => {
    if (field === 'geofenceIds') {
      const geofenceIds = position?.geofenceIds;
      return geofenceIds?.length ? <GeofencesValue geofenceIds={geofenceIds} /> : null;
    }
    if (field === 'driverUniqueId') {
      const driverUniqueId = position?.attributes?.driverUniqueId;
      return driverUniqueId ? <DriverValue driverUniqueId={driverUniqueId} /> : null;
    }
    if (field === 'motion') {
      return <MotionBar deviceId={item.id} />;
    }
    return item[field];
  };

  const primaryValue = resolveFieldValue(devicePrimary);
  const secondaryValue = resolveFieldValue(deviceSecondary);



  const handleIgnitionToggle = async (e) => {
    e.stopPropagation();
    const action = position?.attributes?.ignition ? 'engineStop' : 'engineResume';
    if (window.confirm(`Are you sure you want to ${action === 'engineStop' ? 'BLOCK' : 'RESUME'} engine for ${item.name}?`)) {
      try {
        const response = await fetch('/api/saas/vehicles/engine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ vehicleId: item.id, action }),
        });
        
        if (response.status === 404 || !response.ok) {
           throw new Error('Fallback to standard command');
        }
        
        alert('Engine command processed via Elite Engine.');
      } catch (err) {
        // Fallback: Use standard Traccar Command API
        try {
          await fetchOrThrow('/api/commands/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              deviceId: item.id, 
              type: action === 'engineStop' ? 'engineStop' : 'engineResume',
              attributes: {} 
            }),
          });
          alert('Engine command sent via Standard Relay.');
        } catch (relayErr) {
          alert('ALL COMMAND RELAYS FAILED: ' + relayErr.message);
        }
      }
    }
  };

  const handleSafeParkingToggle = async (e) => {
    e.stopPropagation();
    const enable = !item.attributes?.safeParking;
    try {
      const response = await fetch('/api/saas/vehicles/safe-parking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vehicleId: item.id, 
          enable,
          lat: position?.latitude,
          lng: position?.longitude,
          radius: 50
        }),
      });

      if (!response.ok) throw new Error('SaaS Safe Parking unavailable');
      
      alert(`Safe Parking ${enable ? 'Enabled' : 'Disabled'}`);
    } catch (err) {
       // Fallback: Local Tagging in Traccar Attributes
       try {
         const attributes = { ...(item.attributes || {}), safeParking: enable };
         await fetchOrThrow(`/api/devices/${item.id}`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ ...item, attributes }),
         });
         alert(`Safe Parking tagged locally: ${enable ? 'ON' : 'OFF'}`);
       } catch (tagErr) {
         alert('Safe Parking activation failed: ' + tagErr.message);
       }
    }
  };

  return (
    <div style={style}>
      <ListItemButton
        disableRipple
        key={item.id}
        onClick={() => dispatch(devicesActions.selectId(item.id))}
        disabled={!admin && item.disabled}
        selected={selectedDeviceId === item.id}
        className={cx(classes.item, selectedDeviceId === item.id && classes.selected)}
      >
        <ListItemAvatar>
          <Avatar className={classes.avatar}>
            <img className={classes.icon} src={mapIcons[mapIconKey(item.category)]} alt="" />
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                {primaryValue}
              </Typography>
              <Typography className={cx(classes.statusBadge, classes[getStatusColor(item.status)])}>
                {formatStatus(item.status, t)}
              </Typography>
            </Box>
          }
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden' }}>
              {position && (
                <>
                  <Stack direction="row" spacing={0.8} alignItems="center">
                    <Tooltip title="Ignition">
                      <Box className={classes.actionButton} onClick={handleIgnitionToggle}>
                        <PowerSettingsNewIcon className={position.attributes.ignition ? classes.ignitionActive : classes.neutral} />
                        <Typography variant="caption" sx={{ ml: 0.5, fontWeight: 800, fontSize: '0.55rem', color: position.attributes.ignition ? '#fbbf24' : 'rgba(255,255,255,0.4)' }}>
                          {position.attributes.ignition ? 'ON' : 'OFF'}
                        </Typography>
                      </Box>
                    </Tooltip>

                    <Tooltip title={!position.attributes.ignition ? 'Engine Stopped' : (position.speed > 1 ? 'Moving' : 'Idling')}>
                      <Box className={classes.actionButton}>
                        {!position.attributes.ignition ? (
                          <StopIcon className={classes.error} />
                        ) : (
                          position.speed > 1 ? <PlayArrowIcon className={classes.success} /> : <PauseIcon className={classes.warning} />
                        )}
                      </Box>
                    </Tooltip>

                    <Tooltip title="Safe Parking">
                      <IconButton className={classes.actionButton} onClick={handleSafeParkingToggle} sx={{ p: '4px' }}>
                        <SecurityIcon className={item.attributes?.safeParking ? classes.success : classes.neutral} />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={`Geofences${position.geofenceIds?.length ? ` (${position.geofenceIds.length})` : ''}`}>
                      <Box className={classes.actionButton}>
                        <FenceIcon className={position.geofenceIds?.length ? classes.success : classes.neutral} />
                      </Box>
                    </Tooltip>
                  </Stack>

                  {position.attributes.hasOwnProperty('batteryLevel') && (
                    <Box className={classes.batteryLevel}>
                      {position.attributes.batteryLevel > 30 ? <BatteryFullIcon className={classes.success} /> : <Battery20Icon className={classes.error} />}
                      <span>{position.attributes.batteryLevel}%</span>
                    </Box>
                  )}
                </>
              )}

              {item.lastUpdate && item.status !== 'online' && (
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.6rem', ml: 'auto', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {dayjs(item.lastUpdate).fromNow()}
                </Typography>
              )}
            </Box>
          }
        />

      </ListItemButton>
    </div>
  );
};

export default DeviceRow;

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector, connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Snackbar, Box, Typography, Button } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { makeStyles } from 'tss-react/mui';
import { devicesActions, sessionActions } from './store';
import { useCatchCallback, useEffectAsync } from './reactHelper';
import { snackBarDurationLongMs } from './common/util/duration';
import alarm from './resources/alarm.mp3';
import { eventsActions } from './store/events';
import useFeatures from './common/util/useFeatures';
import { useAttributePreference } from './common/util/preferences';
import {
  handleNativeNotificationListeners,
  nativePostMessage,
} from './common/components/NativeInterface';
import fetchOrThrow from './common/util/fetchOrThrow';

const logoutCode = 4000;

const SocketController = () => {
  const { cx } = makeStyles()(() => ({}))();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const authenticated = useSelector((state) => Boolean(state.session.user));
  const includeLogs = useSelector((state) => state.session.includeLogs);
  const geofences = useSelector((state) => state.geofences.items);
  const devices = useSelector((state) => state.devices.items);

  const socketRef = useRef();
  const reconnectTimeoutRef = useRef();

  const clearReconnectTimeout = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const [notifications, setNotifications] = useState([]);

  const soundEvents = useAttributePreference('soundEvents', '');
  const soundAlarms = useAttributePreference('soundAlarms', 'sos');

  const features = useFeatures();

  const handleEvents = useCallback(
    (events) => {
      if (!features.disableEvents) {
        dispatch(eventsActions.add(events));
      }
      
      const soundEventsArray = soundEvents ? soundEvents.split(',') : [];
      const soundAlarmsArray = soundAlarms ? soundAlarms.split(',') : [];

      const shouldPlaySound = events.some((event) => {
        if (soundEventsArray.includes('all')) return true;
        if (event.type === 'alarm') {
          return soundAlarmsArray.includes('all') || soundAlarmsArray.includes(event.attributes.alarm || 'sos');
        }
        return soundEventsArray.includes(event.type);
      });

      if (shouldPlaySound) {
        new Audio(alarm).play().catch(() => {});
      }

      setNotifications((prev) => [
        ...prev,
        ...events.map((event) => {
          const device = devices[event.deviceId];
          const deviceName = device?.name || 'Unknown Vehicle';
          const isAis140 = device?.category === 'ais140';
          const vrn = device?.attributes?.vrn;
          let customMessage = event.attributes.message || `The vehicle ${deviceName}${vrn ? ` (${vrn})` : ''} generated a ${event.type} event.`;
          
          if (event.type === 'geofenceEnter' || event.type === 'geofenceExit') {
            const geofenceName = geofences[event.geofenceId]?.name || 'Unknown Zone';
            const action = event.type === 'geofenceEnter' ? 'entered' : 'exited';
            customMessage = `${deviceName}${vrn ? ` (${vrn})` : ''} ${action} geofence "${geofenceName}".`;
          } else if (event.type === 'alarm' || event.type === 'sos') {
            const alarmType = event.attributes.alarm || event.type;
            customMessage = `ALERT: ${alarmType.toUpperCase()} on vehicle ${deviceName}${vrn ? ` [${vrn}]` : ''}. Immediate action required.`;
          } else if (!event.attributes.message) {
             customMessage = `The vehicle ${deviceName}${vrn ? ` (${vrn})` : ''} generated a ${event.type} event.`;
          }

          return {
            id: event.id + Date.now(), // Unique key
            type: event.type,
            title: (event.type === 'alarm' || event.type === 'sos') 
              ? (isAis140 ? 'AIS140 PANIC' : 'Critical Alert') 
              : (event.type.includes('geofence') ? 'Geofence Activity' : 'System Notification'),
            message: customMessage,
            isAis140,
            show: true,
          };
        })
      ].slice(-10)); // Keep last 10
    },
    [features, dispatch, soundEvents, soundAlarms, geofences, devices],
  );

  const connectSocket = () => {
    clearReconnectTimeout();
    if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
      socketRef.current.close();
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/api/socket`);
    socketRef.current = socket;

    socket.onopen = () => {
      dispatch(sessionActions.updateSocket(true));
    };

    socket.onclose = async (event) => {
      dispatch(sessionActions.updateSocket(false));
      if (event.code !== logoutCode) {
        try {
          const devicesResponse = await fetch('/api/devices');
          if (devicesResponse.ok) {
            dispatch(devicesActions.update(await devicesResponse.json()));
          }
          const positionsResponse = await fetch('/api/positions');
          if (positionsResponse.ok) {
            dispatch(sessionActions.updatePositions(await positionsResponse.json()));
          }
          if (devicesResponse.status === 401 || positionsResponse.status === 401) {
            navigate('/login');
          }
        } catch {
          // ignore errors
        }
        clearReconnectTimeout();
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          connectSocket();
        }, 60000);
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.devices) {
        dispatch(devicesActions.update(data.devices));
      }
      if (data.positions) {
        dispatch(sessionActions.updatePositions(data.positions));
      }
      if (data.events) {
        handleEvents(data.events);
      }
      if (data.logs) {
        dispatch(sessionActions.updateLogs(data.logs));
      }
    };
  };

  useEffect(() => {
    socketRef.current?.send(JSON.stringify({ logs: includeLogs }));
  }, [includeLogs]);

  useEffectAsync(async () => {
    if (authenticated) {
      const response = await fetchOrThrow('/api/devices');
      dispatch(devicesActions.refresh(await response.json()));
      nativePostMessage('authenticated');
      connectSocket();
      return () => {
        clearReconnectTimeout();
        socketRef.current?.close(logoutCode);
      };
    }
    return null;
  }, [authenticated]);

  const handleNativeNotification = useCatchCallback(
    async (message) => {
      const eventId = message.data.eventId;
      if (eventId) {
        const response = await fetch(`/api/events/${eventId}`);
        if (response.ok) {
          const event = await response.json();
          const eventWithMessage = {
            ...event,
            attributes: { ...event.attributes, message: message.notification.body },
          };
          handleEvents([eventWithMessage]);
        }
      }
    },
    [handleEvents],
  );

  useEffect(() => {
    handleNativeNotificationListeners.add(handleNativeNotification);
    return () => handleNativeNotificationListeners.delete(handleNativeNotification);
  }, [handleNativeNotification]);

  useEffect(() => {
    if (!authenticated) return;
    const reconnectIfNeeded = () => {
      const socket = socketRef.current;
      if (!socket || socket.readyState === WebSocket.CLOSED) {
        connectSocket();
      } else if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send('{}');
        } catch {
          // test connection
        }
      }
    };
    const onVisibility = () => {
      if (!document.hidden) {
        reconnectIfNeeded();
      }
    };
    window.addEventListener('online', reconnectIfNeeded);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('online', reconnectIfNeeded);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [authenticated]);

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={notification.show}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          autoHideDuration={snackBarDurationLongMs}
          onClose={() => setNotifications(notifications.filter((e) => e.id !== notification.id))}
        >
          <Box
            className={cx('premium-snack', (notification.type === 'alarm' || notification.type === 'sos') && 'critical-alert')}
            sx={{
              p: 2,
              minWidth: '320px',
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              background: (notification.type === 'alarm' || notification.type === 'sos') 
                ? (notification.isAis140 ? 'rgba(220, 38, 38, 0.95)' : 'rgba(15, 23, 42, 0.9)')
                : 'rgba(15, 23, 42, 0.9)',
              color: '#fff',
              border: notification.isAis140 ? '2px solid #fff' : 'none',
              boxShadow: notification.isAis140 ? '0 0 20px rgba(220, 38, 38, 0.5)' : 'none',
              animation: notification.isAis140 ? 'pulse 1s infinite' : 'none',
              '@keyframes pulse': {
                '0%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.02)' },
                '100%': { transform: 'scale(1)' },
              },
            }}
          >
            <Box
              sx={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: (notification.type === 'alarm' || notification.type === 'sos') ? 'rgba(255, 255, 255, 0.2)' : 'rgba(56, 189, 248, 0.2)',
              }}
            >
              {(notification.type === 'alarm' || notification.type === 'sos') ? (
                <ErrorIcon sx={{ color: '#fff', fontSize: '28px' }} />
              ) : (
                <AutoAwesomeIcon sx={{ color: '#38bdf8' }} />
              )}
            </Box>
            <Box flex={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {notification.title}
                </Typography>
                {notification.isAis140 && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      background: '#fff', 
                      color: '#dc2626', 
                      px: 1, 
                      borderRadius: '4px', 
                      fontWeight: 800,
                      fontSize: '10px'
                    }}
                  >
                    RTO VALIDATED
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" sx={{ color: (notification.type === 'alarm' || notification.type === 'sos') ? '#fff' : 'rgba(255,255,255,0.7)', display: 'block', lineHeight: 1.4, fontWeight: 500 }}>
                {notification.message}
              </Typography>
              {notification.isAis140 && (notification.type === 'alarm' || notification.type === 'sos') && (
                <Button 
                  variant="contained" 
                  size="small" 
                  fullWidth 
                  sx={{ 
                    mt: 1.5, 
                    py: 0.5, 
                    fontSize: '10px', 
                    fontWeight: 900, 
                    background: '#fff', 
                    color: '#dc2626',
                    '&:hover': { background: '#f8d7da' }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotifications(notifications.filter((n) => n.id !== notification.id));
                    // Future: Send acknowledgment to API
                  }}
                >
                  ACKNOWLEDGE SOS (LOG EVENT)
                </Button>
              )}
            </Box>
          </Box>
        </Snackbar>
      ))}
    </>
  );
};

export default connect()(SocketController);

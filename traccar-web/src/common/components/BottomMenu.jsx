import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Menu,
  MenuItem,
  Typography,
  Badge,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';

import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import MapIcon from '@mui/icons-material/Map';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

import { sessionActions } from '../../store';
import { useTranslation } from './LocalizationProvider';
import { useRestriction } from '../util/permissions';
import { nativePostMessage } from './NativeInterface';

const useStyles = makeStyles()((theme) => ({
  root: {
    background: 'rgba(2, 6, 23, 0.8)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    transition: 'all 0.3s ease',
  },
  navigation: {
    background: 'transparent',
    height: theme.dimensions.bottomBarHeight,
    '& .MuiBottomNavigationAction-root': {
      color: 'rgba(255, 255, 255, 0.4)',
      transition: 'all 0.2s ease',
      minWidth: 0,
      '&.Mui-selected': {
        color: '#3b82f6',
        '& .MuiSvgIcon-root': {
          transform: 'translateY(-2px)',
          filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))',
        },
      },
      '&:hover': {
        color: 'rgba(255, 255, 255, 0.8)',
      },
    },
  },
  badge: {
    '& .MuiBadge-badge': {
      backgroundColor: '#ef4444',
      boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
    },
  },
}));

const BottomMenu = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const t = useTranslation();

  const readonly = useRestriction('readonly');
  const disableReports = useRestriction('disableReports');
  const devices = useSelector((state) => state.devices.items);
  const user = useSelector((state) => state.session.user);
  const socket = useSelector((state) => state.session.socket);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);

  const [anchorEl, setAnchorEl] = useState(null);

  const currentSelection = () => {
    if (location.pathname === `/settings/user/${user.id}`) {
      return 'account';
    }
    if (location.pathname.startsWith('/settings')) {
      return 'settings';
    }
    if (location.pathname.startsWith('/reports')) {
      return 'reports';
    }
    if (location.pathname === '/') {
      return 'map';
    }
    return null;
  };

  const handleAccount = () => {
    setAnchorEl(null);
    navigate(`/settings/user/${user.id}`);
  };

  const handleLogout = async () => {
    setAnchorEl(null);

    const notificationToken = window.localStorage.getItem('notificationToken');
    if (notificationToken && !user.readonly) {
      window.localStorage.removeItem('notificationToken');
      const tokens = user.attributes.notificationTokens?.split(',') || [];
      if (tokens.includes(notificationToken)) {
        const updatedUser = {
          ...user,
          attributes: {
            ...user.attributes,
            notificationTokens:
              tokens.length > 1
                ? tokens.filter((it) => it !== notificationToken).join(',')
                : undefined,
          },
        };
        await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedUser),
        });
      }
    }

    await fetch('/api/session', { method: 'DELETE' });
    nativePostMessage('logout');
    navigate('/login');
    dispatch(sessionActions.updateUser(null));
  };

  const handleSelection = (event, value) => {
    switch (value) {
      case 'map':
        navigate('/');
        break;
      case 'reports': {
        let id = selectedDeviceId;
        if (id == null) {
          const deviceIds = Object.keys(devices);
          if (deviceIds.length === 1) {
            id = deviceIds[0];
          }
        }

        if (id != null) {
          navigate(`/reports/combined?deviceId=${id}`);
        } else {
          navigate('/reports/combined');
        }
        break;
      }
      case 'settings':
        navigate('/settings/preferences?menu=true');
        break;
      case 'account':
        setAnchorEl(event.currentTarget);
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  return (
    <Paper square className={classes.root}>
      <BottomNavigation
        value={currentSelection()}
        onChange={handleSelection}
        showLabels
        className={classes.navigation}
      >
        <BottomNavigationAction
          label={t('mapTitle')}
          icon={
            <Badge
              className={classes.badge}
              color="error"
              variant="dot"
              overlap="circular"
              invisible={socket !== false}
            >
              <MapIcon />
            </Badge>
          }
          value="map"
        />
        {!disableReports && (
          <BottomNavigationAction
            label={t('reportTitle')}
            icon={<DescriptionIcon />}
            value="reports"
          />
        )}
        <BottomNavigationAction
          label={t('settingsTitle')}
          icon={<SettingsIcon />}
          value="settings"
        />
        {readonly ? (
          <BottomNavigationAction
            label={t('loginLogout')}
            icon={<ExitToAppIcon />}
            value="logout"
          />
        ) : (
          <BottomNavigationAction label={t('settingsUser')} icon={<PersonIcon />} value="account" />
        )}
      </BottomNavigation>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            background: 'rgba(15, 23, 42, 0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            mt: -1,
          },
        }}
      >
        <MenuItem onClick={handleAccount}>
          <Typography color="#fff" sx={{ fontWeight: 600 }}>{t('settingsUser')}</Typography>
        </MenuItem>
        <MenuItem onClick={() => { setAnchorEl(null); navigate('/ai-insights'); }}>
          <AutoAwesomeIcon sx={{ color: '#38bdf8', mr: 2, fontSize: '20px' }} />
          <Typography color="#38bdf8" sx={{ fontWeight: 600 }}>GeoSure AI</Typography>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Typography color="#ef4444" sx={{ fontWeight: 600 }}>{t('loginLogout')}</Typography>
        </MenuItem>
      </Menu>
    </Paper>
  );
};

export default BottomMenu;

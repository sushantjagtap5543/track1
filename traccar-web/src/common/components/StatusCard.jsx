import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Rnd } from 'react-rnd';
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Menu,
  MenuItem,
  CardMedia,
  TableFooter,
  Link,
  Tooltip,
  Box,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import CloseIcon from '@mui/icons-material/Close';
import RouteIcon from '@mui/icons-material/Route';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PendingIcon from '@mui/icons-material/Pending';

import { useTranslation } from './LocalizationProvider';
import RemoveDialog from './RemoveDialog';
import PositionValue from './PositionValue';
import { useDeviceReadonly, useRestriction } from '../util/permissions';
import usePositionAttributes from '../attributes/usePositionAttributes';
import { devicesActions } from '../../store';
import { useCatch, useCatchCallback } from '../../reactHelper';
import { useAttributePreference } from '../util/preferences';
import fetchOrThrow from '../util/fetchOrThrow';

const useStyles = makeStyles()((theme, { desktopPadding }) => ({
  card: {
    pointerEvents: 'auto',
    width: theme.dimensions.popupMaxWidth,
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    backdropFilter: 'blur(30px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
  media: {
    height: theme.dimensions.popupImageHeight,
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  mediaButton: {
    color: theme.palette.common.white,
    mixBlendMode: 'difference',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(2, 2, 1, 2),
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
  },
  content: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    maxHeight: theme.dimensions.cardContentMaxHeight,
    overflow: 'auto',
  },
  icon: {
    width: '25px',
    height: '25px',
    filter: 'brightness(0) invert(1)',
  },
  table: {
    '& .MuiTableCell-sizeSmall': {
      paddingLeft: 0,
      paddingRight: 0,
      borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
    },
    '& .MuiTableCell-sizeSmall:first-of-type': {
      paddingRight: theme.spacing(1),
    },
  },
  cell: {
    borderBottom: 'none',
  },
  actions: {
    justifyContent: 'space-between',
    padding: theme.spacing(1, 2),
    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    '& .MuiIconButton-root': {
      color: 'rgba(255, 255, 255, 0.5)',
      transition: 'all 0.2s',
      border: '1px solid transparent',
      borderRadius: '8px',
      '&:hover': {
        color: '#f8fafc',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }
    },
    '& .MuiIconButton-colorError': {
      color: 'rgba(239, 68, 68, 0.7)',
      '&:hover': { color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }
    },
    '& .MuiIconButton-colorSecondary': {
      color: 'rgba(16, 185, 129, 0.7)',
      '&:hover': { color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }
    }
  },
  root: {
    pointerEvents: 'none',
    position: 'fixed',
    zIndex: 5,
    left: '50%',
    [theme.breakpoints.up('md')]: {
      left: `calc(50% + ${desktopPadding} / 2)`,
      bottom: theme.spacing(3),
    },
    [theme.breakpoints.down('md')]: {
      left: '50%',
      bottom: `calc(${theme.spacing(3)} + ${theme.dimensions.bottomBarHeight}px)`,
    },
    transform: 'translateX(-50%)',
  },
}));

const StatusRow = ({ name, content }) => {
  const { classes } = useStyles({ desktopPadding: 0 });

  return (
    <TableRow>
      <TableCell className={classes.cell}>
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem', fontWeight: 500 }}>{name}</Typography>
      </TableCell>
      <TableCell className={classes.cell}>
        <Typography variant="body2" sx={{ color: '#f8fafc', fontSize: '0.85rem', fontWeight: 600 }}>
          {content}
        </Typography>
      </TableCell>
    </TableRow>
  );
};

const StatusCard = ({ deviceId, position, onClose, disableActions, desktopPadding = 0 }) => {
  const { classes } = useStyles({ desktopPadding });
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();

  const readonly = useRestriction('readonly');
  const deviceReadonly = useDeviceReadonly();

  const shareDisabled = useSelector((state) => state.session.server.attributes.disableShare);
  const user = useSelector((state) => state.session.user);
  const device = useSelector((state) => state.devices.items[deviceId]);

  const deviceImage = device?.attributes?.deviceImage;

  const positionAttributes = usePositionAttributes(t);
  const positionItems = useAttributePreference(
    'positionItems',
    'fixTime,address,speed,totalDistance',
  );

  const navigationAppLink = useAttributePreference('navigationAppLink');
  const navigationAppTitle = useAttributePreference('navigationAppTitle');

  const [anchorEl, setAnchorEl] = useState(null);

  const [removing, setRemoving] = useState(false);

  const handleRemove = useCatch(async (removed) => {
    if (removed) {
      const response = await fetchOrThrow('/api/devices');
      dispatch(devicesActions.refresh(await response.json()));
    }
    setRemoving(false);
  });

  const handleGeofence = useCatchCallback(async () => {
    const newItem = {
      name: t('sharedGeofence'),
      area: `CIRCLE (${position.latitude} ${position.longitude}, 50)`,
    };
    const response = await fetchOrThrow('/api/geofences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });
    const item = await response.json();
    await fetchOrThrow('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: position.deviceId, geofenceId: item.id }),
    });
    navigate(`/settings/geofence/${item.id}`);
  }, [navigate, position]);

  return (
    <>
      <div className={classes.root}>
        {device && (
          <Rnd
            default={{ x: 0, y: 0, width: 'auto', height: 'auto' }}
            enableResizing={false}
            dragHandleClassName="draggable-header"
            style={{ position: 'relative' }}
          >
            <Card elevation={3} className={classes.card}>
              {deviceImage ? (
                <CardMedia
                  className={`${classes.media} draggable-header`}
                  image={`/api/media/${device.uniqueId}/${deviceImage}`}
                >
                  <IconButton size="small" onClick={onClose} onTouchStart={onClose}>
                    <CloseIcon fontSize="small" className={classes.mediaButton} />
                  </IconButton>
                </CardMedia>
              ) : (
                <div className={`${classes.header} draggable-header`}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f8fafc' }}>
                      {device.name}
                    </Typography>
                    {position && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {position.attributes.alarm?.includes('sos') && (
                          <Box sx={{ 
                            px: 1, 
                            py: 0.25, 
                            backgroundColor: '#ef4444', 
                            borderRadius: '6px',
                            animation: 'pulse 1.5s infinite',
                            '@keyframes pulse': {
                              '0%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
                              '70%': { transform: 'scale(1.05)', boxShadow: '0 0 0 10px rgba(239, 68, 68, 0)' },
                              '100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
                            }
                          }}>
                            <Typography variant="caption" sx={{ fontWeight: 900, color: '#fff', fontSize: '0.65rem' }}>
                              SOS ALERT
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1, 
                          px: 1, 
                          py: 0.25, 
                          backgroundColor: position.attributes.ignition ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '6px',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                           <Typography variant="caption" sx={{ fontWeight: 800, color: position.attributes.ignition ? '#22c55e' : 'rgba(255,255,255,0.3)', fontSize: '0.65rem' }}>
                             {position.attributes.ignition ? 'IGNITION ON' : 'IGNITION OFF'}
                           </Typography>
                        </Box>
                        {(position.attributes.fuelLevel !== undefined || position.attributes.fuel !== undefined) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                             <Box sx={{ 
                               width: '30px', 
                               height: '6px', 
                               backgroundColor: 'rgba(255,255,255,0.1)', 
                               borderRadius: '3px',
                               overflow: 'hidden'
                             }}>
                                <Box sx={{ 
                                  width: `${position.attributes.fuelLevel || (position.attributes.fuel % 100)}%`, 
                                  height: '100%', 
                                  backgroundColor: (position.attributes.fuelLevel || 100) > 20 ? '#38bdf8' : '#ef4444' 
                                }} />
                             </Box>
                             <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>
                               FUEL
                             </Typography>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Box>
                  <IconButton size="small" onClick={onClose} onTouchStart={onClose} sx={{ color: 'rgba(255,255,255,0.4)' }}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </div>
              )}
              {position && (
                <CardContent className={classes.content}>
                  <Table size="small" classes={{ root: classes.table }}>
                    <TableBody>
                      {positionItems
                        .split(',')
                        .filter(
                          (key) =>
                            position.hasOwnProperty(key) || (position.attributes && position.attributes.hasOwnProperty(key)),
                        )
                        .map((key) => (
                          <StatusRow
                            key={key}
                            name={positionAttributes[key]?.name || key}
                            content={
                              <PositionValue
                                position={position}
                                property={position.hasOwnProperty(key) ? key : null}
                                attribute={position.hasOwnProperty(key) ? null : key}
                              />
                            }
                          />
                        ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={2} className={classes.cell}>
                          <Typography variant="body2">
                            <Link component={RouterLink} to={`/position/${position.id}`} sx={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600, fontSize: '0.85rem', '&:hover': { color: '#7dd3fc' } }}>
                              {t('sharedShowDetails')}
                            </Link>
                          </Typography>
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CardContent>
              )}
              <CardActions classes={{ root: classes.actions }} disableSpacing>
                <Tooltip title={t('sharedExtra')}>
                  <IconButton
                    color="secondary"
                    onClick={(e) => setAnchorEl(e.currentTarget)}
                    disabled={!position}
                  >
                    <PendingIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('reportReplay')}>
                  <IconButton
                    onClick={() => navigate(`/replay?deviceId=${deviceId}`)}
                    disabled={disableActions || !position}
                  >
                    <RouteIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('commandTitle')}>
                  <IconButton
                    onClick={() => navigate(`/settings/device/${deviceId}/command`)}
                    disabled={disableActions}
                  >
                    <SendIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('sharedEdit')}>
                  <IconButton
                    onClick={() => navigate(`/settings/device/${deviceId}`)}
                    disabled={disableActions || deviceReadonly}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('sharedRemove')}>
                  <IconButton
                    color="error"
                    onClick={() => setRemoving(true)}
                    disabled={disableActions || deviceReadonly}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Rnd>
        )}
      </div>
      {position && (
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          slotProps={{
            paper: {
              sx: {
                backgroundColor: 'rgba(15, 23, 42, 0.96) !important',
                backdropFilter: 'blur(30px) !important',
                border: '1px solid rgba(255, 255, 255, 0.1) !important',
                borderRadius: '16px !important',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7) !important',
                mt: 1.5,
                minWidth: '200px',
                '& .MuiList-root': {
                  padding: '8px',
                },
              },
            },
          }}
        >
          {!readonly && (
            <MenuItem onClick={handleGeofence} sx={{ borderRadius: '10px', mb: 0.5 }}>
              <Typography sx={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.85rem' }}>{t('sharedCreateGeofence')}</Typography>
            </MenuItem>
          )}
          {[
            { id: 'google', title: t('linkGoogleMaps'), link: `https://www.google.com/maps/search/?api=1&query=${position.latitude}%2C${position.longitude}` },
            { id: 'apple', title: t('linkAppleMaps'), link: `http://maps.apple.com/?ll=${position.latitude},${position.longitude}` },
            { id: 'street', title: t('linkStreetView'), link: `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${position.latitude}%2C${position.longitude}&heading=${position.course}` },
          ].map((item) => (
            <MenuItem
              key={item.id}
              component="a"
              target="_blank"
              href={item.link}
              sx={{ borderRadius: '10px', mb: 0.5 }}
            >
              <Typography sx={{ color: '#f1f5f9', fontWeight: 500, fontSize: '0.85rem' }}>{item.title}</Typography>
            </MenuItem>
          ))}
          {navigationAppTitle && (
            <MenuItem
              component="a"
              target="_blank"
              href={navigationAppLink
                .replace('{latitude}', position.latitude)
                .replace('{longitude}', position.longitude)}
              sx={{ borderRadius: '10px', mb: 0.5 }}
            >
              <Typography sx={{ color: '#f1f5f9', fontWeight: 500, fontSize: '0.85rem' }}>{navigationAppTitle}</Typography>
            </MenuItem>
          )}
          {!shareDisabled && !user.temporary && (
            <MenuItem onClick={() => navigate(`/settings/device/${deviceId}/share`)} sx={{ borderRadius: '10px' }}>
              <Typography sx={{ color: '#10b981', fontWeight: 800, fontSize: '0.85rem' }}>{t('sharedShare')}</Typography>
            </MenuItem>
          )}
        </Menu>
      )}
      <RemoveDialog
        open={removing}
        endpoint="devices"
        itemId={deviceId}
        onResult={(removed) => handleRemove(removed)}
      />
    </>
  );
};

export default StatusCard;

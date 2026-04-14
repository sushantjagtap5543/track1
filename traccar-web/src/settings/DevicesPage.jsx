import { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  Button,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Chip,
  Tooltip,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import DevicesIcon from '@mui/icons-material/Devices';
import RouterIcon from '@mui/icons-material/Router';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import DownloadIcon from '@mui/icons-material/Download';
import { useTheme } from '@mui/material/styles';
import { useEffectAsync, useScrollToLoad, pageSize } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader from './components/SearchHeader';
import { formatAddress, formatStatus, formatTime } from '../common/util/formatter';
import { useDeviceReadonly, useManager } from '../common/util/permissions';
import { usePreference } from '../common/util/preferences';
import useSettingsStyles from './common/useSettingsStyles';
import useReportStyles from '../reports/common/useReportStyles';
import DeviceUsersValue from './components/DeviceUsersValue';
import usePersistedState from '../common/util/usePersistedState';
import fetchOrThrow from '../common/util/fetchOrThrow';
import AddressValue from '../common/components/AddressValue';
import exportExcel from '../common/util/exportExcel';

const DevicesPage = () => {
  const { classes: settingsClasses } = useSettingsStyles();
  const { classes } = useReportStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const t = useTranslation();

  const groups = useSelector((state) => state.groups.items);
  const manager = useManager();
  const deviceReadonly = useDeviceReadonly();
  const coordinateFormat = usePreference('coordinateFormat');
  const positions = useSelector((state) => state.session.positions);

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showAll, setShowAll] = usePersistedState('showAllDevices', false);
  const [loading, setLoading] = useState(false);

  const loadItems = async (offset) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ all: showAll, limit: pageSize, offset });
      if (searchKeyword) query.append('keyword', searchKeyword);
      const response = await fetchOrThrow(`/api/devices?${query.toString()}`);
      const data = await response.json();
      setItems((previous) => (offset ? [...previous, ...data] : data));
      setHasMore(data.length >= pageSize);
    } finally {
      setLoading(false);
    }
  };

  const { sentinelRef, hasMore, setHasMore } = useScrollToLoad(() => loadItems(items.length));

  useEffectAsync(async () => {
    setItems([]);
    await loadItems(0);
  }, [timestamp, showAll, searchKeyword]);

  const stats = useMemo(() => {
    if (!items.length) return null;
    return {
      total: items.length,
      online: items.filter((i) => i.status === 'online').length,
      offline: items.filter((i) => i.status === 'offline' || !i.status).length,
    };
  }, [items]);

  const handleExport = async () => {
    const data = items.map((item) => ({
      [t('sharedName')]: item.name,
      [t('deviceIdentifier')]: item.uniqueId,
      [t('groupParent')]: item.groupId ? groups[item.groupId]?.name : null,
      [t('sharedPhone')]: item.phone,
      [t('deviceModel')]: item.model,
      [t('deviceContact')]: item.contact,
      [t('userExpirationTime')]: formatTime(item.expirationTime, 'date'),
      [t('deviceStatus')]: formatStatus(item.status, t),
      [t('deviceLastUpdate')]: formatTime(item.lastUpdate, 'minutes'),
      [t('positionAddress')]: positions[item.id]
        ? formatAddress(positions[item.id], coordinateFormat)
        : '',
    }));
    const sheets = new Map();
    sheets.set(t('deviceTitle'), data);
    await exportExcel(t('deviceTitle'), 'devices.xlsx', sheets, theme);
  };
  const actionConnections = {
    key: 'connections',
    title: t('sharedConnections'),
    icon: <LinkIcon fontSize="small" />,
    handler: (deviceId) => navigate(`/settings/device/${deviceId}/connections`),
  };

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'deviceTitle']}>
      <div className={settingsClasses.container}>
        <div className={settingsClasses.containerMain}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, px: 2, pt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                width: 48, height: 48, borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(129, 140, 248, 0.2) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
                border: '1px solid rgba(56,189,248,0.2)',
              }}>
                <DevicesIcon sx={{ color: '#38bdf8', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                  {t('deviceTitle')}
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                  Manage and monitor your hardware fleet with real-time status tracking.
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                    variant="outlined" 
                    startIcon={<DownloadIcon />}
                    onClick={handleExport}
                    sx={{ 
                      borderRadius: '12px', borderColor: 'rgba(255,255,255,0.1)', color: '#94a3b8',
                      textTransform: 'none', px: 2, '&:hover': { borderColor: 'rgba(255,255,255,0.3)', color: '#f8fafc' }
                    }}
                >
                    {t('reportExport')}
                </Button>
                <FormControlLabel
                    control={
                        <Switch
                            checked={showAll}
                            onChange={(e) => setShowAll(e.target.checked)}
                            size="small"
                            sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': { color: '#38bdf8' },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#38bdf8' }
                            }}
                        />
                    }
                    label={<Typography sx={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}>{t('notificationAlways')}</Typography>}
                    labelPlacement="start"
                    disabled={!manager}
                />
            </Box>
          </Box>

          {stats && !loading && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3, mb: 4 }}>
              <div className={classes.statCard}>
                <RouterIcon className={classes.statIcon} sx={{ color: '#818cf8' }} />
                <Typography className={classes.statLabel}>{t('deviceTitle')}</Typography>
                <Typography className={classes.statValue}>{stats.total}</Typography>
              </div>
              <div className={classes.statCard}>
                <OnlinePredictionIcon className={classes.statIcon} sx={{ color: '#10b981' }} />
                <Typography className={classes.statLabel}>{t('deviceStatusOnline')}</Typography>
                <Typography className={classes.statValue}>{stats.online}</Typography>
              </div>
              <div className={classes.statCard}>
                <CloudOffIcon className={classes.statIcon} sx={{ color: '#ef4444' }} />
                <Typography className={classes.statLabel}>{t('deviceStatusOffline')}</Typography>
                <Typography className={classes.statValue}>{stats.offline}</Typography>
              </div>
            </Box>
          )}

          <Box sx={{ mb: 2 }}>
            <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Table className={classes.table} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'rgba(15, 23, 42, 0.9) !important', zIndex: 11 }}>{t('sharedName')}</TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(15, 23, 42, 0.9) !important', zIndex: 11 }}>{t('deviceIdentifier')}</TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(15, 23, 42, 0.9) !important', zIndex: 11 }}>{t('sharedPhone')}</TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(15, 23, 42, 0.9) !important', zIndex: 11 }}>{t('deviceModel')}</TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(15, 23, 42, 0.9) !important', zIndex: 11 }}>{t('deviceStatus')}</TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(15, 23, 42, 0.9) !important', zIndex: 11 }}>{t('positionAddress')}</TableCell>
                  {manager && <TableCell sx={{ backgroundColor: 'rgba(15, 23, 42, 0.9) !important', zIndex: 11 }}>{t('settingsUsers')}</TableCell>}
                  <TableCell sx={{ backgroundColor: 'rgba(15, 23, 42, 0.9) !important', zIndex: 11, width: '1%' }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading ? (
                    items.length > 0 ? (
                        items.map((item) => (
                            <TableRow key={item.id} className={classes.tableRow}>
                                <TableCell>
                                    <Typography sx={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</Typography>
                                    <Typography sx={{ color: '#64748b', fontSize: '0.75rem' }}>{item.groupId ? groups[item.groupId]?.name : t('groupParent')}</Typography>
                                </TableCell>
                                <TableCell>
                                    <code style={{ color: '#38bdf8', fontSize: '0.8rem', backgroundColor: 'rgba(56,189,248,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                                        {item.uniqueId}
                                    </code>
                                </TableCell>
                                <TableCell sx={{ color: '#94a3b8' }}>{item.phone || '—'}</TableCell>
                                <TableCell sx={{ color: '#94a3b8' }}>{item.model || '—'}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={formatStatus(item.status, t)} 
                                        size="small"
                                        sx={{ 
                                            backgroundColor: item.status === 'online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: item.status === 'online' ? '#10b981' : '#ef4444',
                                            fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', borderRadius: '8px'
                                        }}
                                    />
                                </TableCell>
                                <TableCell sx={{ maxWidth: 200 }}>
                                    {positions[item.id] ? (
                                        <Typography noWrap sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                                            <AddressValue
                                                latitude={positions[item.id].latitude}
                                                longitude={positions[item.id].longitude}
                                                originalAddress={positions[item.id]?.address}
                                            />
                                        </Typography>
                                    ) : (
                                        <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>Location missing</Typography>
                                    )}
                                </TableCell>
                                {manager && (
                                    <TableCell>
                                        <DeviceUsersValue deviceId={item.id} />
                                    </TableCell>
                                )}
                                <TableCell padding="none">
                                    <CollectionActions
                                        itemId={item.id}
                                        editPath="/settings/device"
                                        endpoint="devices"
                                        setTimestamp={setTimestamp}
                                        customActions={[actionConnections]}
                                        readonly={deviceReadonly}
                                    />
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={manager ? 8 : 7} align="center">
                                <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                    <DevicesIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.05)' }} />
                                    <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>No Devices Found</Typography>
                                </Box>
                            </TableCell>
                        </TableRow>
                    )
                ) : (
                    <TableShimmer columns={manager ? 8 : 7} />
                )}
              </TableBody>
            </Table>
            {hasMore && <div ref={sentinelRef} />}
          </Box>
        </div>
      </div>
      <CollectionFab editPath="/settings/device" />
    </PageLayout>
  );
};

export default DevicesPage;

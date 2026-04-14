import { useState, useMemo } from 'react';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CampaignIcon from '@mui/icons-material/Campaign';
import SendIcon from '@mui/icons-material/Send';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { IconButton, Chip, Box, Typography, Table, TableRow, TableCell, TableHead, TableBody, Tooltip } from '@mui/material';
import { useEffectAsync, useScrollToLoad, pageSize } from '../reactHelper';
import { prefixString } from '../common/util/stringUtils';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader from './components/SearchHeader';
import useReportStyles from '../reports/common/useReportStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

const NotificationsPage = () => {
  const { classes } = useReportStyles();
  const t = useTranslation();

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const loadItems = async (offset) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ limit: pageSize, offset });
      if (searchKeyword) query.append('keyword', searchKeyword);
      const response = await fetchOrThrow(`/api/notifications?${query.toString()}`);
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
  }, [timestamp, searchKeyword]);

  const stats = useMemo(() => {
    if (!items.length) return null;
    return {
      total: items.length,
      notificators: new Set(items.flatMap((i) => (i.notificators ? i.notificators.split(/[, ]+/) : []))).size,
      always: items.filter((i) => i.always).length,
    };
  }, [items]);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedNotifications']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>
          {/* Header Section */}
          <div className={classes.header}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(129,140,248,0.2) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
                border: '1px solid rgba(56,189,248,0.2)',
              }}>
                <NotificationsIcon sx={{ color: '#38bdf8', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                  {t('sharedNotifications')}
                </Typography>
                <Typography sx={{ color: '#64748b', fontSize: '0.8rem' }}>
                  Configure automated alerts for device fleet events and security geofences.
                </Typography>
              </Box>
            </Box>
          </div>

          {/* Stat Cards */}
          {stats && !loading && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2.5, mb: 4 }}>
              <div className={classes.statCard}>
                <CampaignIcon className={classes.statIcon} sx={{ color: '#38bdf8' }} />
                <Typography className={classes.statLabel}>Active Alerts</Typography>
                <Typography className={classes.statValue}>{stats.total}</Typography>
              </div>
              <div className={classes.statCard}>
                <SendIcon sx={{ color: '#818cf8', mb: 1 }} />
                <Typography className={classes.statLabel}>Notificators</Typography>
                <Typography className={classes.statValue}>{stats.notificators}</Typography>
              </div>
              <div className={classes.statCard}>
                <EventAvailableIcon sx={{ color: '#34d399', mb: 1 }} />
                <Typography className={classes.statLabel}>Always Active</Typography>
                <Typography className={classes.statValue}>{stats.always}</Typography>
              </div>
            </Box>
          )}

          {/* Search Table */}
          <Box sx={{ mb: 2 }}>
            <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
          </Box>
          
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Table className={classes.table} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>
                    {t('sharedDescription')}
                  </TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>
                    {t('notificationType')}
                  </TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>
                    {t('notificationAlways')}
                  </TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>
                    {t('notificationNotificators')}
                  </TableCell>
                  <TableCell sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', Width: '1%', zIndex: 11 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading ? (
                  items.length > 0 ? (
                    items.map((item) => (
                      <TableRow key={item.id} className={classes.tableRow}>
                        <TableCell>
                          <Typography sx={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>
                            {item.description || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={t(prefixString('event', item.type))} 
                            size="small" 
                            sx={{ 
                              backgroundColor: 'rgba(56, 189, 248, 0.1)', 
                              color: '#38bdf8', 
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              border: '1px solid rgba(56, 189, 248, 0.2)',
                              borderRadius: '8px'
                            }} 
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={item.always ? t('sharedYes') : t('sharedNo')} 
                            size="small"
                            sx={{ 
                              backgroundColor: item.always ? 'rgba(52, 211, 153, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                              color: item.always ? '#34d399' : '#94a3b8',
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              borderRadius: '8px'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap' }}>
                            {(item.notificators || '').split(/[, ]+/).filter(Boolean).map((n) => (
                              <Tooltip key={n} title={t(prefixString('notificator', n))}>
                                <Chip 
                                  label={n.toUpperCase()} 
                                  variant="outlined" 
                                  size="small"
                                  sx={{ borderColor: 'rgba(255,255,255,0.1)', color: '#64748b', fontSize: '0.65rem', fontWeight: 900 }}
                                />
                              </Tooltip>
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell padding="none">
                          <CollectionActions
                            itemId={item.id}
                            editPath="/settings/notification"
                            endpoint="notifications"
                            setTimestamp={setTimestamp}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <NotificationsIcon sx={{ fontSize: 52, color: 'rgba(56, 189, 248, 0.2)' }} />
                          <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>No Notifications Configured</Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableShimmer columns={5} />
                )}
              </TableBody>
            </Table>
            {hasMore && <div ref={sentinelRef} />}
          </Box>
        </div>
      </div>
      <CollectionFab editPath="/settings/notification" />
    </PageLayout>
  );
};

export default NotificationsPage;

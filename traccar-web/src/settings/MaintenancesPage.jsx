import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Table, TableRow, TableCell, TableHead, TableBody, Chip, Paper, Button, Avatar } from '@mui/material';
import BuildIcon from '@mui/icons-material/Build';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import SpeedIcon from '@mui/icons-material/Speed';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';
import { useEffectAsync, useScrollToLoad, pageSize } from '../reactHelper';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { formatDistance, formatSpeed } from '../common/util/formatter';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import SettingsMenu from './components/SettingsMenu';
import CollectionFab from './components/CollectionFab';
import CollectionActions from './components/CollectionActions';
import TableShimmer from '../common/components/TableShimmer';
import SearchHeader from './components/SearchHeader';
import useReportStyles from '../reports/common/useReportStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { prefixString } from '../common/util/stringUtils';

const MaintenancesPage = () => {
  const { classes } = useReportStyles();
  const t = useTranslation();
  const navigate = useNavigate();

  const positionAttributes = usePositionAttributes(t);

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const speedUnit = useAttributePreference('speedUnit');
  const distanceUnit = useAttributePreference('distanceUnit');

  const loadItems = async (offset) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ limit: pageSize, offset });
      if (searchKeyword) {
        query.append('keyword', searchKeyword);
      }
      const response = await fetchOrThrow(`/api/maintenance?${query.toString()}`);
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
      distance: items.filter((i) => i.type === 'totalDistance').length,
      hours: items.filter((i) => i.type === 'hours').length,
    };
  }, [items]);

  const convertAttribute = (key, start, value) => {
    const attribute = positionAttributes[key];
    if (key.endsWith('Time')) {
      if (start) {
        return dayjs(value).locale('en').format('YYYY-MM-DD');
      }
      return `${value / 86400000} ${t('sharedDays')}`;
    }
    if (attribute && attribute.dataType) {
      switch (attribute.dataType) {
        case 'speed':
          return formatSpeed(value, speedUnit, t);
        case 'distance':
          return formatDistance(value, distanceUnit, t);
        case 'hours':
          return `${value / 3600000} ${t('sharedHours')}`;
        default:
          return value;
      }
    }

    return value;
  };

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedMaintenance']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, px: 2, pt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                width: 48, height: 48, borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(248, 113, 113, 0.2) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
                border: '1px solid rgba(234, 179, 8, 0.2)',
                }}>
                <BuildIcon sx={{ color: '#eab308', fontSize: 28 }} />
                </Box>
                <Box>
                <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>{t('sharedMaintenance')}</Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>
                    Track service intervals and equipment maintenance schedules for fleet reliability.
                </Typography>
                </Box>
            </Box>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/settings/maintenance')}
                sx={{ 
                    borderRadius: '12px', fontWeight: 900, px: 3, py: 1.2,
                    background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
                    boxShadow: '0 8px 16px rgba(234, 179, 8, 0.25)',
                    textTransform: 'none',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #ca8a04 0%, #d97706 100%)',
                        boxShadow: '0 10px 20px rgba(234, 179, 8, 0.4)'
                    }
                }}
            >
                {t('sharedAdd')}
            </Button>
          </Box>

          {/* Stat Cards */}
          {stats && !loading && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2.5, mb: 4, px: 2 }}>
              <div className={classes.statCard}>
                <PrecisionManufacturingIcon className={classes.statIcon} sx={{ color: '#38bdf8' }} />
                <Typography className={classes.statLabel}>Schedules</Typography>
                <Typography className={classes.statValue}>{stats.total}</Typography>
              </div>
              <div className={classes.statCard}>
                <SpeedIcon sx={{ color: '#818cf8', mb: 1 }} />
                <Typography className={classes.statLabel}>Distance Based</Typography>
                <Typography className={classes.statValue}>{stats.distance}</Typography>
              </div>
              <div className={classes.statCard}>
                <HistoryIcon sx={{ color: '#34d399', mb: 1 }} />
                <Typography className={classes.statLabel}>Hour Based</Typography>
                <Typography className={classes.statValue}>{stats.hours}</Typography>
              </div>
            </Box>
          )}

          {/* Search Header */}
          <Box sx={{ mb: 2, px: 2 }}>
            <SearchHeader keyword={searchKeyword} setKeyword={setSearchKeyword} />
          </Box>

          <Paper sx={{ 
            mx: 2, mb: 2, borderRadius: '20px', 
            background: 'rgba(30, 41, 59, 0.4)', 
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
            backdropFilter: 'blur(20px)'
          }}>
            <Table sx={{ '& .MuiTableCell-root': { borderColor: 'rgba(255,255,255,0.05)', py: 2 } }}>
              <TableHead sx={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <TableRow>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedName')}</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sharedType')}</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('maintenanceStart')}</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('maintenancePeriod')}</TableCell>
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }} align="right">{t('sharedActions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading ? (
                    items.length > 0 ? (
                        items.map((item) => (
                        <TableRow key={item.id} hover sx={{ '&:hover': { backgroundColor: 'rgba(255,255,255,0.02) !important' } }}>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Box sx={{ 
                                        width: 32, height: 32, borderRadius: '8px',
                                        background: 'rgba(234, 179, 8, 0.1)', 
                                        color: '#eab308', fontSize: '0.8rem', fontWeight: 800,
                                        border: '1px solid rgba(234, 179, 8, 0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {item.name?.charAt(0).toUpperCase() || 'M'}
                                    </Box>
                                    <Typography sx={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell sx={{ color: '#94a3b8' }}>{t(prefixString('sharedType', item.type))}</TableCell>
                            <TableCell sx={{ color: '#cbd5e1' }}>{convertAttribute(item.type, true, item.start)}</TableCell>
                            <TableCell sx={{ color: '#cbd5e1' }}>{convertAttribute(item.type, false, item.period)}</TableCell>
                            <TableCell align="right">
                            <CollectionActions
                                endpoint="maintenance"
                                itemId={item.id}
                                refreshEndpoint="maintenance"
                                editPath="/settings/maintenance"
                            />
                            </TableCell>
                        </TableRow>
                    ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={5} align="center">
                            <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <BuildIcon sx={{ fontSize: 52, color: 'rgba(234, 179, 8, 0.2)' }} />
                            <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>No Maintenance Tasks Found</Typography>
                            </Box>
                        </TableCell>
                        </TableRow>
                    )
                ) : (
                  <TableShimmer columns={5} endAction />
                )}
              </TableBody>
            </Table>
            {hasMore && <div ref={sentinelRef} />}
          </Paper>
        </div>
      </div>
      <CollectionFab editPath="/settings/maintenance" />
    </PageLayout>
  );
};

export default MaintenancesPage;

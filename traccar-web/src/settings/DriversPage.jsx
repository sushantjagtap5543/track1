import { useState, useMemo } from 'react';
import { Box, Typography, Table, TableRow, TableCell, TableHead, TableBody, Chip, Paper } from '@mui/material';
import BadgeIcon from '@mui/icons-material/Badge';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import { useEffectAsync, useScrollToLoad, pageSize } from '../reactHelper';
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

const DriversPage = () => {
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
      if (searchKeyword) {
        query.append('keyword', searchKeyword);
      }
      const response = await fetchOrThrow(`/api/drivers?${query.toString()}`);
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
      identified: items.filter((i) => i.uniqueId).length,
    };
  }, [items]);

  return (
    <PageLayout menu={<SettingsMenu />} breadcrumbs={['settingsTitle', 'sharedDrivers']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>
          {/* Header Section */}
          <div className={classes.header}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, p: 3 }}>
              <Box sx={{
                width: 40, height: 40, borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(129,140,248,0.2) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 2,
                border: '1px solid rgba(56,189,248,0.2)',
              }}>
                <AssignmentIndIcon sx={{ color: '#38bdf8', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                  {t('sharedDrivers')}
                </Typography>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  Manage personnel, driver identifiers, and RFID authentication tokens.
                </Typography>
              </Box>
            </Box>
          </div>

          {/* Stat Cards */}
          {stats && !loading && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2.5, mb: 4 }}>
              <div className={classes.statCard}>
                <AssignmentIndIcon className={classes.statIcon} sx={{ color: '#38bdf8' }} />
                <Typography className={classes.statLabel}>Active Drivers</Typography>
                <Typography className={classes.statValue}>{stats.total}</Typography>
              </div>
              <div className={classes.statCard}>
                <BadgeIcon sx={{ color: '#818cf8', mb: 1 }} />
                <Typography className={classes.statLabel}>Unique IDs</Typography>
                <Typography className={classes.statValue}>{stats.identified}</Typography>
              </div>
              <div className={classes.statCard}>
                <RadioButtonCheckedIcon sx={{ color: '#34d399', mb: 1 }} />
                <Typography className={classes.statLabel}>Verified Status</Typography>
                <Typography className={classes.statValue}>100%</Typography>
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
                  <TableCell sx={{ color: '#94a3b8', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('deviceIdentifier')}</TableCell>
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
                                        background: 'rgba(56, 189, 248, 0.1)', 
                                        color: '#38bdf8', fontSize: '0.8rem', fontWeight: 800,
                                        border: '1px solid rgba(56, 189, 248, 0.2)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {item.name?.charAt(0).toUpperCase() || 'U'}
                                    </Box>
                                    <Typography sx={{ color: '#f8fafc', fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>{item.uniqueId}</TableCell>
                            <TableCell align="right">
                            <CollectionActions
                                endpoint="drivers"
                                itemId={item.id}
                                refreshEndpoint="drivers"
                                editPath="/settings/driver"
                            />
                            </TableCell>
                        </TableRow>
                    ))
                    ) : (
                        <TableRow>
                        <TableCell colSpan={3} align="center">
                            <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <AssignmentIndIcon sx={{ fontSize: 52, color: 'rgba(56, 189, 248, 0.2)' }} />
                            <Typography sx={{ color: '#94a3b8', fontWeight: 600 }}>No Drivers Found</Typography>
                            </Box>
                        </TableCell>
                        </TableRow>
                    )
                ) : (
                  <TableShimmer columns={3} endAction />
                )}
              </TableBody>
            </Table>
            {hasMore && <div ref={sentinelRef} />}
          </Paper>
        </div>
      </div>
      <CollectionFab editPath="/settings/driver" />
    </PageLayout>
  );
};

export default DriversPage;

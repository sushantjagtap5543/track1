import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Table, TableRow, TableCell, TableHead, TableBody, Typography, Box } from '@mui/material';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import PeopleIcon from '@mui/icons-material/People';
import DevicesIcon from '@mui/icons-material/Devices';
import StorageIcon from '@mui/icons-material/Storage';
import { formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ReportFilter from './components/ReportFilter';
import usePersistedState from '../common/util/usePersistedState';
import ColumnSelect from './components/ColumnSelect';
import { useCatch } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import fetchOrThrow from '../common/util/fetchOrThrow';

const columnsArray = [
  ['captureTime', 'statisticsCaptureTime'],
  ['activeUsers', 'statisticsActiveUsers'],
  ['activeDevices', 'statisticsActiveDevices'],
  ['requests', 'statisticsRequests'],
  ['messagesReceived', 'statisticsMessagesReceived'],
  ['messagesStored', 'statisticsMessagesStored'],
  ['mailSent', 'notificatorMail'],
  ['smsSent', 'notificatorSms'],
  ['geocoderRequests', 'statisticsGeocoder'],
  ['geolocationRequests', 'statisticsGeolocation'],
];
const columnsMap = new Map(columnsArray);

const StatisticsPage = () => {
  const { classes } = useReportStyles();
  const t = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();

  const [columns, setColumns] = usePersistedState('statisticsColumns', [
    'captureTime',
    'activeUsers',
    'activeDevices',
    'messagesStored',
  ]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchParams.get('from') || !searchParams.get('to')) {
        const from = new Date();
        from.setHours(0, 0, 0, 0);
        const to = new Date();
        to.setHours(23, 59, 59, 999);
        const newParams = new URLSearchParams(searchParams);
        newParams.set('from', from.toISOString());
        newParams.set('to', to.toISOString());
        setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const onShow = useCatch(async ({ from, to }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ from, to });
      const response = await fetchOrThrow(`/api/statistics?${query.toString()}`);
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  });

  const latestItem = items.length > 0 ? items[items.length - 1] : null;

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'statisticsTitle']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>

          {/* Filter Panel */}
          <div className={classes.header}>
            <ReportFilter onShow={onShow} deviceType="none" loading={loading}>
              <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
            </ReportFilter>
          </div>

          {/* Stat Cards */}
          {latestItem && !loading && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2.5, mb: 4 }}>
              <div className={classes.statCard}>
                <PeopleIcon className={classes.statIcon} />
                <Typography className={classes.statLabel}>{t('statisticsActiveUsers')}</Typography>
                <Typography className={classes.statValue}>{latestItem.activeUsers ?? '—'}</Typography>
              </div>
              <div className={classes.statCard}>
                <DevicesIcon sx={{ color: '#34d399', mb: 1 }} />
                <Typography className={classes.statLabel}>{t('statisticsActiveDevices')}</Typography>
                <Typography className={classes.statValue}>{latestItem.activeDevices ?? '—'}</Typography>
              </div>
              <div className={classes.statCard}>
                <StorageIcon sx={{ color: '#818cf8', mb: 1 }} />
                <Typography className={classes.statLabel}>{t('statisticsMessagesStored')}</Typography>
                <Typography className={classes.statValue}>{latestItem.messagesStored ?? '—'}</Typography>
              </div>
              <div className={classes.statCard}>
                <QueryStatsIcon sx={{ color: '#f59e0b', mb: 1 }} />
                <Typography className={classes.statLabel}>{t('statisticsRequests')}</Typography>
                <Typography className={classes.statValue}>{latestItem.requests ?? '—'}</Typography>
              </div>
            </Box>
          )}

          {/* Table */}
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Table className={classes.table} stickyHeader>
              <TableHead>
                <TableRow>
                  {columns.map((key) => (
                    <TableCell
                      key={key}
                      sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}
                    >
                      {t(columnsMap.get(key))}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading ? (
                  items.length > 0 ? (
                    items.map((item) => (
                      <TableRow key={item.id} className={classes.tableRow}>
                        {columns.map((key) => (
                          <TableCell key={key}>
                            <Typography className={classes.eventText}>
                              {key === 'captureTime' ? formatTime(item[key], 'date') : item[key] ?? '—'}
                            </Typography>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center">
                        <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <QueryStatsIcon sx={{ fontSize: 52, color: 'rgba(56, 189, 248, 0.2)' }} />
                          <Typography sx={{ color: '#475569', fontWeight: 600, fontSize: '1rem' }}>
                            No Statistics Available
                          </Typography>
                          <Typography sx={{ color: '#334155', fontSize: '0.85rem', maxWidth: 340, textAlign: 'center' }}>
                            Select a date range and click{' '}
                            <strong style={{ color: '#38bdf8' }}>Show</strong> to load platform statistics.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableShimmer columns={columns.length} />
                )}
              </TableBody>
            </Table>
          </Box>
        </div>
      </div>
    </PageLayout>
  );
};

export default StatisticsPage;

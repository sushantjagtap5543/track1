import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  Table,
  TableRow,
  TableCell,
  TableHead,
  TableBody,
  IconButton,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useEffectAsync } from '../reactHelper';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import TableShimmer from '../common/components/TableShimmer';
import RemoveDialog from '../common/components/RemoveDialog';
import useReportStyles from './common/useReportStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';

const TYPE_CONFIG = {
  events: { label: 'reportEvents', color: '#fb7185', bg: 'rgba(251,113,133,0.12)' },
  route: { label: 'reportPositions', color: '#818cf8', bg: 'rgba(129,140,248,0.12)' },
  summary: { label: 'reportSummary', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)' },
  trips: { label: 'reportTrips', color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  stops: { label: 'reportStops', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
};

const ScheduledPage = () => {
  const { classes } = useReportStyles();
  const t = useTranslation();

  const calendars = useSelector((state) => state.calendars.items);

  const [timestamp, setTimestamp] = useState(Date.now());
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState();

  useEffectAsync(async () => {
    setLoading(true);
    try {
      const response = await fetchOrThrow('/api/reports');
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  }, [timestamp]);

  const formatType = (type) => {
    const config = TYPE_CONFIG[type];
    if (!config) return type;
    return (
      <Chip
        label={t(config.label)}
        size="small"
        sx={{
          color: config.color,
          backgroundColor: config.bg,
          fontWeight: 700,
          fontSize: '0.7rem',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          border: `1px solid ${config.color}33`,
          borderRadius: '8px',
          height: 26,
        }}
      />
    );
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportScheduled']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>

          {/* Page Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 4,
              pb: 3,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(56,189,248,0.2) 0%, rgba(129,140,248,0.2) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(56,189,248,0.2)',
              }}
            >
              <ScheduleIcon sx={{ color: '#38bdf8', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography
                sx={{
                  color: '#f8fafc',
                  fontWeight: 800,
                  fontSize: '1.4rem',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {t('reportScheduled')}
              </Typography>
              <Typography sx={{ color: '#64748b', fontSize: '0.82rem', mt: 0.3 }}>
                {items.length > 0
                  ? `${items.length} scheduled ${items.length === 1 ? 'report' : 'reports'}`
                  : 'Manage your automated report schedule'}
              </Typography>
            </Box>
          </Box>

          {/* Stat Cards */}
          {!loading && items.length > 0 && (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 2.5,
                mb: 4,
              }}
            >
              <Box
                className={classes.statCard}
                sx={{ padding: '20px 24px' }}
              >
                <AssessmentIcon sx={{ color: '#38bdf8', mb: 1 }} />
                <Typography className={classes.statLabel}>Total Scheduled</Typography>
                <Typography className={classes.statValue}>{items.length}</Typography>
              </Box>
              <Box
                className={classes.statCard}
                sx={{ padding: '20px 24px' }}
              >
                <CalendarMonthIcon sx={{ color: '#34d399', mb: 1 }} />
                <Typography className={classes.statLabel}>Calendars in Use</Typography>
                <Typography className={classes.statValue}>
                  {new Set(items.map((i) => i.calendarId)).size}
                </Typography>
              </Box>
              <Box
                className={classes.statCard}
                sx={{ padding: '20px 24px' }}
              >
                <ScheduleIcon sx={{ color: '#818cf8', mb: 1 }} />
                <Typography className={classes.statLabel}>Report Types</Typography>
                <Typography className={classes.statValue}>
                  {new Set(items.map((i) => i.type)).size}
                </Typography>
              </Box>
            </Box>
          )}

          {/* Table */}
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Table className={classes.table} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9) !important',
                      backdropFilter: 'blur(8px)',
                      zIndex: 11,
                    }}
                  >
                    {t('sharedType')}
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9) !important',
                      backdropFilter: 'blur(8px)',
                      zIndex: 11,
                    }}
                  >
                    {t('sharedDescription')}
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9) !important',
                      backdropFilter: 'blur(8px)',
                      zIndex: 11,
                    }}
                  >
                    {t('sharedCalendar')}
                  </TableCell>
                  <TableCell
                    className={classes.columnAction}
                    sx={{
                      backgroundColor: 'rgba(30, 41, 59, 0.9) !important',
                      backdropFilter: 'blur(8px)',
                      zIndex: 11,
                    }}
                  />
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading ? (
                  items.length > 0 ? (
                    items.map((item) => (
                      <TableRow key={item.id} className={classes.tableRow}>
                        <TableCell>{formatType(item.type)}</TableCell>
                        <TableCell>
                          <Typography className={classes.deviceName} sx={{ fontSize: '0.9rem' }}>
                            {item.description || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography className={classes.eventText}>
                            {calendars[item.calendarId]?.name || `Calendar #${item.calendarId}`}
                          </Typography>
                        </TableCell>
                        <TableCell className={classes.columnAction} padding="none">
                          <div className={classes.columnActionContainer}>
                            <IconButton
                              size="small"
                              onClick={() => setRemovingId(item.id)}
                              sx={{
                                color: '#64748b',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  color: '#fb7185',
                                  backgroundColor: 'rgba(251, 113, 133, 0.1)',
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Box
                          sx={{
                            py: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                          }}
                        >
                          <ScheduleIcon sx={{ fontSize: 52, color: 'rgba(56, 189, 248, 0.2)' }} />
                          <Typography sx={{ color: '#475569', fontWeight: 600, fontSize: '1rem' }}>
                            No Scheduled Reports
                          </Typography>
                          <Typography
                            sx={{ color: '#334155', fontSize: '0.85rem', maxWidth: 340, textAlign: 'center' }}
                          >
                            Schedule reports from any report page by clicking{' '}
                            <strong style={{ color: '#38bdf8' }}>Show</strong> and selecting the{' '}
                            <em>Schedule</em> option.
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                ) : (
                  <TableShimmer columns={4} endAction />
                )}
              </TableBody>
            </Table>
          </Box>
        </div>
      </div>

      <RemoveDialog
        style={{ transform: 'none' }}
        open={!!removingId}
        endpoint="reports"
        itemId={removingId}
        onResult={(removed) => {
          setRemovingId(null);
          if (removed) {
            setTimestamp(Date.now());
          }
        }}
      />
    </PageLayout>
  );
};

export default ScheduledPage;

import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Table, TableRow, TableCell, TableHead, TableBody,
  Typography, Box, Chip,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import CreateIcon from '@mui/icons-material/Create';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import HistoryIcon from '@mui/icons-material/History';
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

  export const updateReportParams = (searchParams, setSearchParams, key, values) => {
  const newParams = new URLSearchParams(searchParams);
  newParams.delete(key);
  newParams.delete('from');
  newParams.delete('to');
  values.forEach((value) => newParams.append(key, value));
  setSearchParams(newParams, { replace: true });
};

const columnsArray = [
  ['actionTime', 'positionServerTime'],
  ['address', 'positionAddress'],
  ['userId', 'settingsUser'],
  ['actionType', 'sharedActionType'],
  ['objectType', 'sharedObjectType'],
  ['objectId', 'sharedId'],
];
const columnsMap = new Map(columnsArray);

const ACTION_CONFIG = {
  create: { color: '#34d399', bg: 'rgba(52,211,153,0.12)', icon: <CreateIcon sx={{ fontSize: 14 }} /> },
  update: { color: '#38bdf8', bg: 'rgba(56,189,248,0.12)', icon: <EditIcon sx={{ fontSize: 14 }} /> },
  delete: { color: '#fb7185', bg: 'rgba(251,113,133,0.12)', icon: <DeleteOutlineIcon sx={{ fontSize: 14 }} /> },
  login:  { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: <LoginIcon sx={{ fontSize: 14 }} /> },
  logout: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  icon: <LogoutIcon sx={{ fontSize: 14 }} /> },
};

const OBJECT_COLORS = {
  device:       '#38bdf8',
  user:         '#818cf8',
  geofence:     '#34d399',
  notification: '#f59e0b',
  group:        '#fb7185',
};

const AuditPage = () => {
  const { classes } = useReportStyles();
  const t = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();

  const [columns, setColumns] = usePersistedState('auditColumns', [
    'actionTime',
    'userId',
    'actionType',
    'objectType',
  ]);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(false);

  const onShow = useCatch(async ({ from, to }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ from, to });
      const [auditRes, usersRes] = await Promise.all([
        fetchOrThrow(`/api/audit?${query.toString()}`),
        fetchOrThrow('/api/users').catch(() => ({ json: () => [] })),
      ]);
      const auditData = await auditRes.json();
      const usersData = await usersRes.json();
      const usersMap = {};
      (Array.isArray(usersData) ? usersData : []).forEach((u) => { usersMap[u.id] = u; });
      setUsers(usersMap);
      setItems(Array.isArray(auditData) ? auditData : []);
    } finally {
      setLoading(false);
    }
  });

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

  const stats = useMemo(() => {
    if (!items.length) return null;
    const byType = {};
    items.forEach((item) => { byType[item.actionType] = (byType[item.actionType] || 0) + 1; });
    return {
      total: items.length,
      byType,
      uniqueUsers: new Set(items.map((i) => i.userId)).size,
      uniqueObjects: new Set(items.map((i) => `${i.objectType}:${i.objectId}`)).size,
    };
  }, [items]);

  const renderCell = (item, key) => {
    const value = item[key];

    switch (key) {
      case 'actionTime':
        return (
          <Typography sx={{ color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
            {formatTime(value, 'minutes')}
          </Typography>
        );

      case 'userId': {
        const user = users[value];
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PersonIcon sx={{ color: '#fff', fontSize: 15 }} />
            </Box>
            <Typography className={classes.deviceName} sx={{ fontSize: '0.85rem' }}>
              {user?.name || user?.email || `User #${value}`}
            </Typography>
          </Box>
        );
      }

      case 'actionType': {
        const config = ACTION_CONFIG[value?.toLowerCase()] || { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', icon: null };
        return (
          <Chip
            icon={config.icon}
            label={value || '—'}
            size="small"
            sx={{
              color: config.color,
              backgroundColor: config.bg,
              border: `1px solid ${config.color}33`,
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.72rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              height: 26,
              '& .MuiChip-icon': { color: config.color },
            }}
          />
        );
      }

      case 'objectType': {
        const color = OBJECT_COLORS[value?.toLowerCase()] || '#94a3b8';
        return (
          <Typography sx={{
            color, fontSize: '0.78rem', fontWeight: 700,
            backgroundColor: `${color}15`, display: 'inline-block',
            padding: '2px 10px', borderRadius: '6px', letterSpacing: '0.06em',
          }}>
            {value || '—'}
          </Typography>
        );
      }

      case 'address':
        return (
          <Typography sx={{ color: '#64748b', fontSize: '0.78rem', fontFamily: 'monospace' }}>
            {value || '—'}
          </Typography>
        );

      default:
        return <Typography className={classes.eventText}>{value ?? '—'}</Typography>;
    }
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportAudit']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>

          {/* Filter */}
          <div className={classes.header}>
            <ReportFilter onShow={onShow} deviceType="none" loading={loading}>
              <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
            </ReportFilter>
          </div>

          {/* Stat Cards */}
          {stats && !loading && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2.5, mb: 4 }}>
              <div className={classes.statCard}>
                <HistoryIcon className={classes.statIcon} />
                <Typography className={classes.statLabel}>Total Actions</Typography>
                <Typography className={classes.statValue}>{stats.total}</Typography>
              </div>
              <div className={classes.statCard}>
                <PersonIcon sx={{ color: '#818cf8', mb: 1 }} />
                <Typography className={classes.statLabel}>Active Users</Typography>
                <Typography className={classes.statValue}>{stats.uniqueUsers}</Typography>
              </div>
              <div className={classes.statCard}>
                <CreateIcon sx={{ color: '#34d399', mb: 1 }} />
                <Typography className={classes.statLabel}>Creates</Typography>
                <Typography className={classes.statValue}>{stats.byType.create || 0}</Typography>
              </div>
              <div className={classes.statCard}>
                <DeleteOutlineIcon sx={{ color: '#fb7185', mb: 1 }} />
                <Typography className={classes.statLabel}>Deletes</Typography>
                <Typography className={classes.statValue}>{stats.byType.delete || 0}</Typography>
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
                          <TableCell key={key}>{renderCell(item, key)}</TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center">
                        <Box sx={{ py: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                          <SecurityIcon sx={{ fontSize: 52, color: 'rgba(56, 189, 248, 0.2)' }} />
                          <Typography sx={{ color: '#475569', fontWeight: 600, fontSize: '1rem' }}>
                            No Audit Records Found
                          </Typography>
                          <Typography sx={{ color: '#334155', fontSize: '0.85rem', maxWidth: 340, textAlign: 'center' }}>
                            Select a date range and click{' '}
                            <strong style={{ color: '#38bdf8' }}>Show</strong> to load the platform audit trail.
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

export default AuditPage;

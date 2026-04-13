import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
  Typography,
  Box
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import { useTheme } from '@mui/material/styles';
import {
  formatDistance,
  formatSpeed,
  formatVolume,
  formatTime,
  formatNumericHours,
} from '../common/util/formatter';
import ReportFilter, { updateReportParams } from './components/ReportFilter';
import { useAttributePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import usePersistedState from '../common/util/usePersistedState';
import ColumnSelect from './components/ColumnSelect';
import { useCatch } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import scheduleReport from './common/scheduleReport';
import fetchOrThrow from '../common/util/fetchOrThrow';
import exportExcel from '../common/util/exportExcel';
import { deviceEquality } from '../common/util/deviceEquality';

const columnsArray = [
  ['startTime', 'reportStartDate'],
  ['distance', 'sharedDistance'],
  ['startOdometer', 'reportStartOdometer'],
  ['endOdometer', 'reportEndOdometer'],
  ['averageSpeed', 'reportAverageSpeed'],
  ['maxSpeed', 'reportMaximumSpeed'],
  ['engineHours', 'reportEngineHours'],
  ['startHours', 'reportStartEngineHours'],
  ['endHours', 'reportEndEngineHours'],
  ['spentFuel', 'reportSpentFuel'],
];
const columnsMap = new Map(columnsArray);

const SummaryReportPage = () => {
  const navigate = useNavigate();
  const { classes } = useReportStyles();
  const t = useTranslation();
  const theme = useTheme();

  const [searchParams, setSearchParams] = useSearchParams();

  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));

  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [columns, setColumns] = usePersistedState('summaryColumns', [
    'startTime',
    'distance',
    'averageSpeed',
  ]);
  const daily = searchParams.get('daily') === 'true';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const query = new URLSearchParams({ from, to, daily });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    setLoading(true);
    try {
      const response = await fetchOrThrow(`/api/reports/summary?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  });

  const stats = useMemo(() => {
    if (items.length === 0) return null;
    const totalDistance = items.reduce((acc, item) => acc + item.distance, 0);
    const avgSpeed = items.reduce((acc, item) => acc + item.averageSpeed, 0) / items.length;
    const maxSpeed = Math.max(...items.map((item) => item.maxSpeed));
    const totalEngineHours = items.reduce((acc, item) => acc + item.engineHours, 0);
    const totalFuel = items.reduce((acc, item) => acc + item.spentFuel, 0);

    return {
      distance: formatDistance(totalDistance, distanceUnit, t),
      avgSpeed: formatSpeed(avgSpeed, speedUnit, t),
      maxSpeed: formatSpeed(maxSpeed, speedUnit, t),
      engineHours: totalEngineHours > 0 ? formatNumericHours(totalEngineHours, t) : null,
      fuel: totalFuel > 0 ? formatVolume(totalFuel, volumeUnit, t) : null,
    };
  }, [items, distanceUnit, speedUnit, volumeUnit, t]);

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

  const onExport = useCatch(async () => {
    const rows = [];
    const deviceHeader = t('sharedDevice');
    items.forEach((item) => {
      const row = { [deviceHeader]: devices[item.deviceId].name };
      columns.forEach((key) => {
        const header = t(columnsMap.get(key));
        row[header] = formatValue(item, key);
      });
      rows.push(row);
    });
    if (rows.length === 0) {
      return;
    }
    const titleKey = daily ? 'reportDaily' : 'reportSummary';
    const title = t(titleKey);
    const sheets = new Map([[title, rows]]);
    await exportExcel(title, 'summary.xlsx', sheets, theme);
  });

  const onSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'summary';
    report.attributes.daily = daily;
    await scheduleReport(deviceIds, groupIds, report);
    navigate('/reports/scheduled');
  });

  const formatValue = (item, key) => {
    const value = item[key];
    switch (key) {
      case 'deviceId':
        return devices[value]?.name || value;
      case 'startTime':
        return formatTime(value, 'date');
      case 'startOdometer':
      case 'endOdometer':
      case 'distance':
        return formatDistance(value, distanceUnit, t);
      case 'averageSpeed':
      case 'maxSpeed':
        return value > 0 ? formatSpeed(value, speedUnit, t) : null;
      case 'engineHours':
      case 'startHours':
      case 'endHours':
        return value > 0 ? formatNumericHours(value, t) : null;
      case 'spentFuel':
        return value > 0 ? formatVolume(value, volumeUnit, t) : null;
      default:
        return value;
    }
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportSummary']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter
              onShow={onShow}
              onExport={onExport}
              onSchedule={onSchedule}
              deviceType="multiple"
              loading={loading}
            >
              <div className={classes.filterItem}>
                <FormControl fullWidth>
                  <InputLabel>{t('sharedType')}</InputLabel>
                  <Select
                    label={t('sharedType')}
                    value={daily}
                    onChange={(e) =>
                      updateReportParams(searchParams, setSearchParams, 'daily', [
                        String(e.target.value),
                      ])
                    }
                  >
                    <MenuItem value={false}>{t('reportSummary')}</MenuItem>
                    <MenuItem value>{t('reportDaily')}</MenuItem>
                  </Select>
                </FormControl>
              </div>
              <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
            </ReportFilter>
          </div>

          {stats && !loading && (
            <div className={classes.statCards}>
              <div className={classes.statCard}>
                <TimelineIcon className={classes.statIcon} />
                <Typography className={classes.statLabel}>{t('sharedDistance')}</Typography>
                <Typography className={classes.statValue}>{stats.distance}</Typography>
              </div>
              <div className={classes.statCard}>
                <SpeedIcon className={classes.statIcon} />
                <Typography className={classes.statLabel}>{t('reportAverageSpeed')}</Typography>
                <Typography className={classes.statValue}>{stats.avgSpeed}</Typography>
              </div>
              {stats.engineHours && (
                <div className={classes.statCard}>
                  <TimerIcon className={classes.statIcon} />
                  <Typography className={classes.statLabel}>{t('reportEngineHours')}</Typography>
                  <Typography className={classes.statValue}>{stats.engineHours}</Typography>
                </div>
              )}
              {stats.fuel && (
                <div className={classes.statCard}>
                  <LocalGasStationIcon className={classes.statIcon} />
                  <Typography className={classes.statLabel}>{t('reportSpentFuel')}</Typography>
                  <Typography className={classes.statValue}>{stats.fuel}</Typography>
                </div>
              )}
            </div>
          )}

          <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            <Table className={classes.table} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>{t('sharedDevice')}</TableCell>
                  {columns.map((key) => (
                    <TableCell key={key} sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>{t(columnsMap.get(key))}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading ? (
                  items.map((item) => (
                    <TableRow key={`${item.deviceId}_${Date.parse(item.startTime)}`} className={classes.tableRow}>
                      <TableCell>
                        <Typography className={classes.deviceName}>
                          {devices[item.deviceId]?.name || item.deviceId}
                        </Typography>
                      </TableCell>
                      {columns.map((key) => (
                        <TableCell key={key}>
                          <Typography className={classes.eventText}>
                            {formatValue(item, key)}
                          </Typography>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableShimmer columns={columns.length + 1} />
                )}
                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length + 1} align="center">
                      <Typography sx={{ color: '#f8fafc', py: 8, fontSize: '0.9rem', fontWeight: 500 }}>
                        {t('sharedNoData')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>
        </div>
      </div>
    </PageLayout>
  );
};

export default SummaryReportPage;

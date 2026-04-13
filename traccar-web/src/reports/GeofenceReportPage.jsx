import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography, Box } from '@mui/material';
import { formatNumericHours, formatTime } from '../common/util/formatter';
import ReportFilter, { updateReportParams } from './components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ColumnSelect from './components/ColumnSelect';
import usePersistedState from '../common/util/usePersistedState';
import { useCatch } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import fetchOrThrow from '../common/util/fetchOrThrow';
import SelectField from '../common/components/SelectField';
import exportExcel from '../common/util/exportExcel';
import scheduleReport from './common/scheduleReport';
import { deviceEquality } from '../common/util/deviceEquality';

const columnsArray = [
  ['geofenceId', 'sharedGeofence'],
  ['startTime', 'reportStartTime'],
  ['endTime', 'reportEndTime'],
  ['duration', 'reportDuration'],
];
const columnsMap = new Map(columnsArray);

const GeofenceReportPage = () => {
  const navigate = useNavigate();
  const { classes } = useReportStyles();
  const t = useTranslation();
  const theme = useTheme();

  const [searchParams, setSearchParams] = useSearchParams();
  const geofenceIds = useMemo(() => searchParams.getAll('geofenceId').map(Number), [searchParams]);

  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));
  const geofences = useSelector((state) => state.geofences.items);

  const [columns, setColumns] = usePersistedState('geofenceColumns', [
    'geofenceId',
    'startTime',
    'endTime',
  ]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    geofenceIds.forEach((geofenceId) => query.append('geofenceId', geofenceId));
    setLoading(true);
    try {
      const response = await fetchOrThrow(`/api/reports/geofences?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      setItems(await response.json());
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

  const onExport = useCatch(async () => {
    const sheets = new Map();
    items.forEach((item) => {
      const deviceName = devices[item.deviceId]?.name || `Device ${item.deviceId}`;
      if (!sheets.has(deviceName)) {
        sheets.set(deviceName, []);
      }
      const row = {};
      columns.forEach((key) => {
        const header = t(columnsMap.get(key));
        row[header] = formatValue(item, key);
      });
      sheets.get(deviceName).push(row);
    });
    await exportExcel(t('sharedGeofences'), 'geofences.xlsx', sheets, theme);
  });

  const onSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'geofences';
    if (geofenceIds.length > 0) {
      report.attributes.geofenceIds = geofenceIds.join(',');
    }
    await scheduleReport(deviceIds, groupIds, report);
    navigate('/reports/scheduled');
  });

  const formatValue = (item, key) => {
    switch (key) {
      case 'geofenceId':
        return geofences[item.geofenceId]?.name || item.geofenceId;
      case 'startTime':
      case 'endTime':
        return formatTime(item[key], 'minutes');
      case 'duration':
        return formatNumericHours(Date.parse(item.endTime) - Date.parse(item.startTime), t);
      default:
        return item[key];
    }
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'sharedGeofences']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter onShow={onShow} onExport={onExport} onSchedule={onSchedule} deviceType="multiple" loading={loading}>
              <div className={classes.filterItem}>
                <SelectField
                  label={t('sharedGeofences')}
                  value={geofenceIds}
                  onChange={(e) =>
                    updateReportParams(searchParams, setSearchParams, 'geofenceId', e.target.value)
                  }
                  endpoint="/api/geofences"
                  multiple
                  singleLine
                  fullWidth
                />
              </div>
              <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
            </ReportFilter>
          </div>
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
                    <TableRow
                      key={`${item.deviceId}_${item.geofenceId}_${item.startTime}_${item.endTime}`}
                      className={classes.tableRow}
                    >
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

export default GeofenceReportPage;

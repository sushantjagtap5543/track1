import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Link,
  Typography,
  Box,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import PlaceIcon from '@mui/icons-material/Place';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { formatAddress, formatSpeed, formatTime } from '../common/util/formatter';
import ReportFilter, { updateReportParams } from './components/ReportFilter';
import { prefixString, unprefixString } from '../common/util/stringUtils';
import { useTranslation, useTranslationKeys } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import usePersistedState from '../common/util/usePersistedState';
import ColumnSelect from './components/ColumnSelect';
import { useCatch, useEffectAsync } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import TableShimmer from '../common/components/TableShimmer';
import { useAttributePreference, usePreference } from '../common/util/preferences';
import scheduleReport from './common/scheduleReport';
import SelectField from '../common/components/SelectField';
import fetchOrThrow from '../common/util/fetchOrThrow';
import exportExcel from '../common/util/exportExcel';
import AddressValue from '../common/components/AddressValue';
import { deviceEquality } from '../common/util/deviceEquality';

const columnsArray = [
  ['eventTime', 'positionFixTime'],
  ['type', 'sharedType'],
  ['geofenceId', 'sharedGeofence'],
  ['maintenanceId', 'sharedMaintenance'],
  ['address', 'positionAddress'],
  ['attributes', 'commandData'],
];
const columnsMap = new Map(columnsArray);

const EventReportPage = () => {
  const navigate = useNavigate();
  const { classes } = useReportStyles();
  const t = useTranslation();
  const theme = useTheme();

  const [searchParams, setSearchParams] = useSearchParams();

  const devices = useSelector(
    (state) => state.devices.items,
    deviceEquality(['id', 'name', 'uniqueId']),
  );
  const geofences = useSelector((state) => state.geofences.items);

  const speedUnit = useAttributePreference('speedUnit');
  const coordinateFormat = usePreference('coordinateFormat');

  const [allEventTypes, setAllEventTypes] = useState([['allEvents', 'eventAll']]);

  const alarms = useTranslationKeys((it) => it.startsWith('alarm')).map((it) => ({
    key: unprefixString('alarm', it),
    name: t(it),
  }));

  const [columns, setColumns] = usePersistedState('eventColumns', [
    'eventTime',
    'type',
    'address',
    'attributes',
  ]);
  const eventTypes = useMemo(() => searchParams.getAll('eventType'), [searchParams]);
  const alarmTypes = useMemo(() => searchParams.getAll('alarmType'), [searchParams]);
  const [items, setItems] = useState([]);
  const [positions, setPositions] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventTypes.length) {
      updateReportParams(searchParams, setSearchParams, 'eventType', ['allEvents']);
    }
  }, [searchParams, setSearchParams, eventTypes]);

  useEffectAsync(async () => {
    const response = await fetchOrThrow('/api/notifications/types');
    const types = await response.json();
    setAllEventTypes([
      ...allEventTypes,
      ...types.map((it) => [it.type, prefixString('event', it.type)]),
    ]);
  }, []);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    eventTypes.forEach((it) => query.append('type', it));
    if (eventTypes[0] !== 'allEvents' && eventTypes.includes('alarm')) {
      alarmTypes.forEach((it) => query.append('alarm', it));
    }
    setLoading(true);
    try {
      const response = await fetchOrThrow(`/api/reports/events?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const events = await response.json();
      setItems(events);
      const positionIds = Array.from(
        new Set(events.map((event) => event.positionId).filter((id) => id)),
      );
      const positionsMap = {};
      if (positionIds.length > 0) {
        const positionsQuery = new URLSearchParams();
        positionIds.slice(0, 128).forEach((id) => positionsQuery.append('id', id));
        const positionsResponse = await fetchOrThrow(`/api/positions?${positionsQuery.toString()}`);
        const positionsArray = await positionsResponse.json();
        positionsArray.forEach((p) => (positionsMap[p.id] = p));
      }
      setPositions(positionsMap);
    } finally {
      setLoading(false);
    }
  });

  const stats = useMemo(() => {
    if (items.length === 0) return null;
    const alarmCount = items.filter((item) => item.type === 'alarm').length;
    const geofenceCount = items.filter((item) => item.type.includes('Geofence')).length;

    return {
      total: items.length,
      alarms: alarmCount,
      geofences: geofenceCount,
    };
  }, [items]);

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
      const deviceName = devices[item.deviceId]?.name || t('sharedUnknown');
      if (!sheets.has(deviceName)) {
        sheets.set(deviceName, []);
      }
      const row = {};
      columns.forEach((key) => {
        const header = t(columnsMap.get(key));
        if (key === 'attributes' && item.type === 'media') {
          row[header] = item.attributes.file;
        } else if (key === 'address') {
          const position = positions[item.positionId];
          row[header] = position ? formatAddress(position, coordinateFormat) : '';
        } else {
          row[header] = formatValue(item, key, true);
        }
      });
      sheets.get(deviceName).push(row);
    });
    await exportExcel(t('reportEvents'), 'events.xlsx', sheets, theme);
  });

  const onSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'events';
    if (eventTypes[0] !== 'allEvents') {
      report.attributes.types = eventTypes.join(',');
    }
    await scheduleReport(deviceIds, groupIds, report);
    navigate('/reports/scheduled');
  });

  const formatValue = (item, key, plain = false) => {
    const value = item[key];
    switch (key) {
      case 'deviceId':
        return devices[value]?.name || t('sharedUnknown');
      case 'eventTime':
        return formatTime(value, 'seconds');
      case 'type':
        if (plain) return t(prefixString('event', value));
        return (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              sx={{ 
                color: '#f8fafc',
                backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                padding: '2px 10px', 
                borderRadius: '2000px',
                fontSize: '0.7rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 0 10px rgba(255, 255, 255, 0.05)'
              }}
            >
              {t(prefixString('event', value))}
            </Typography>
          </Box>
        );
      case 'geofenceId':
        if (value > 0) {
          const geofence = geofences[value];
          return geofence && geofence.name;
        }
        return null;
      case 'maintenanceId':
        return value > 0 ? value : null;
      case 'address': {
        const position = positions[item.positionId];
        if (position) {
          return (
            <AddressValue
              latitude={position.latitude}
              longitude={position.longitude}
              originalAddress={position.address}
            />
          );
        }
        return '';
      }
      case 'attributes':
        switch (item.type) {
          case 'alarm':
            return t(prefixString('alarm', item.attributes.alarm));
          case 'deviceOverspeed':
            return formatSpeed(item.attributes.speed, speedUnit, t);
          case 'driverChanged':
            return item.attributes.driverUniqueId;
          case 'media':
            return (
              <Link
                href={`/api/media/${devices[item.deviceId]?.uniqueId}/${item.attributes.file}`}
                target="_blank"
                sx={{ color: '#3b82f6', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
              >
                {item.attributes.file}
              </Link>
            );
          case 'commandResult':
            return item.attributes.result;
          default:
            return '';
        }
      default:
        return value;
    }
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportEvents']}>
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
                  <InputLabel>{t('reportEventTypes')}</InputLabel>
                  <Select
                    label={t('reportEventTypes')}
                    value={eventTypes}
                    onChange={(e, child) => {
                      let values = e.target.value;
                      const clicked = child.props.value;
                      if (values.includes('allEvents') && values.length > 1) {
                        values = [clicked];
                      }
                      updateReportParams(searchParams, setSearchParams, 'eventType', values);
                    }}
                    multiple
                  >
                    {allEventTypes.map(([key, string]) => (
                      <MenuItem key={key} value={key}>
                        {t(string)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              {eventTypes[0] !== 'allEvents' && eventTypes.includes('alarm') && (
                <div className={classes.filterItem}>
                  <SelectField
                    multiple
                    singleLine
                    value={alarmTypes}
                    onChange={(e) =>
                      updateReportParams(searchParams, setSearchParams, 'alarmType', e.target.value)
                    }
                    data={alarms}
                    keyGetter={(it) => it.key}
                    label={t('sharedAlarms')}
                    fullWidth
                  />
                </div>
              )}
              <ColumnSelect columns={columns} setColumns={setColumns} columnsArray={columnsArray} />
            </ReportFilter>
          </div>

          {stats && !loading && (
            <div className={classes.statCards}>
              <div className={classes.statCard}>
                <NotificationsIcon className={classes.statIcon} />
                <Typography className={classes.statLabel}>{t('reportEvents')}</Typography>
                <Typography className={classes.statValue}>{stats.total}</Typography>
              </div>
              <div className={classes.statCard}>
                <NewReleasesIcon className={classes.statIcon} sx={{ color: '#f43f5e' }} />
                <Typography className={classes.statLabel}>{t('sharedAlarms')}</Typography>
                <Typography className={classes.statValue}>{stats.alarms}</Typography>
              </div>
              <div className={classes.statCard}>
                <PlaceIcon className={classes.statIcon} sx={{ color: '#10b981' }} />
                <Typography className={classes.statLabel}>{t('sharedGeofences')}</Typography>
                <Typography className={classes.statValue}>{stats.geofences}</Typography>
              </div>
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
                    <TableRow key={item.id} className={classes.tableRow}>
                      <TableCell>
                        <Typography className={classes.deviceName}>
                          {devices[item.deviceId]?.name || t('sharedUnknown')}
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

export default EventReportPage;

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography, Box } from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import RouteIcon from '@mui/icons-material/Route';
import TimelineIcon from '@mui/icons-material/Timeline';
import SpeedIcon from '@mui/icons-material/Speed';
import TimerIcon from '@mui/icons-material/Timer';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import {
  formatAddress,
  formatDistance,
  formatSpeed,
  formatVolume,
  formatTime,
  formatNumericHours,
} from '../common/util/formatter';
import ReportFilter from './components/ReportFilter';
import { useAttributePreference, usePreference } from '../common/util/preferences';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import ColumnSelect from './components/ColumnSelect';
import usePersistedState from '../common/util/usePersistedState';
import { useCatch, useEffectAsync } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import AddressValue from '../common/components/AddressValue';
import TableShimmer from '../common/components/TableShimmer';
import MapMarkers from '../map/MapMarkers';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import scheduleReport from './common/scheduleReport';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import exportExcel from '../common/util/exportExcel';
import { deviceEquality } from '../common/util/deviceEquality';

const columnsArray = [
  ['startTime', 'reportStartTime'],
  ['startOdometer', 'reportStartOdometer'],
  ['startAddress', 'reportStartAddress'],
  ['endTime', 'reportEndTime'],
  ['endOdometer', 'reportEndOdometer'],
  ['endAddress', 'reportEndAddress'],
  ['distance', 'sharedDistance'],
  ['averageSpeed', 'reportAverageSpeed'],
  ['maxSpeed', 'reportMaximumSpeed'],
  ['duration', 'reportDuration'],
  ['spentFuel', 'reportSpentFuel'],
  ['driverName', 'sharedDriver'],
];
const columnsMap = new Map(columnsArray);

const TripReportPage = () => {
  const navigate = useNavigate();
  const { classes } = useReportStyles();
  const t = useTranslation();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));

  const distanceUnit = useAttributePreference('distanceUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');
  const coordinateFormat = usePreference('coordinateFormat');

  const [columns, setColumns] = usePersistedState('tripColumns', [
    'startTime',
    'endTime',
    'distance',
    'averageSpeed',
  ]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [route, setRoute] = useState(null);

  const createMarkers = () => [
    {
      latitude: selectedItem.startLat,
      longitude: selectedItem.startLon,
      image: 'start-success',
    },
    {
      latitude: selectedItem.endLat,
      longitude: selectedItem.endLon,
      image: 'finish-error',
    },
  ];

  useEffectAsync(async () => {
    if (selectedItem) {
      const query = new URLSearchParams({
        deviceId: selectedItem.deviceId,
        from: selectedItem.startTime,
        to: selectedItem.endTime,
      });
      const response = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      setRoute(await response.json());
    } else {
      setRoute(null);
    }
  }, [selectedItem]);
  
  const stats = useMemo(() => {
    if (items.length === 0) return null;
    const totalDistance = items.reduce((acc, item) => acc + item.distance, 0);
    const avgSpeed = items.reduce((acc, item) => acc + item.averageSpeed, 0) / items.length;
    const maxSpeed = Math.max(...items.map((item) => item.maxSpeed));
    const totalDuration = items.reduce((acc, item) => acc + item.duration, 0);
    const totalFuel = items.reduce((acc, item) => acc + item.spentFuel, 0);

    return {
      distance: formatDistance(totalDistance, distanceUnit, t),
      avgSpeed: formatSpeed(avgSpeed, speedUnit, t),
      maxSpeed: formatSpeed(maxSpeed, speedUnit, t),
      duration: formatNumericHours(totalDuration, t),
      fuel: totalFuel > 0 ? formatVolume(totalFuel, volumeUnit, t) : null,
    };
  }, [items, distanceUnit, speedUnit, volumeUnit, t]);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    setLoading(true);
    try {
      const response = await fetchOrThrow(`/api/reports/trips?${query.toString()}`, {
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
      const deviceName = devices[item.deviceId]?.name || item.deviceId;
      if (!sheets.has(deviceName)) {
        sheets.set(deviceName, []);
      }
      const row = {};
      columns.forEach((key) => {
        const header = t(columnsMap.get(key));
        if (key === 'startAddress') {
          row[header] = formatAddress(
            {
              address: item.startAddress,
              latitude: item.startLat,
              longitude: item.startLon,
            },
            coordinateFormat,
          );
        } else if (key === 'endAddress') {
          row[header] = formatAddress(
            {
              address: item.endAddress,
              latitude: item.endLat,
              longitude: item.endLon,
            },
            coordinateFormat,
          );
        } else {
          row[header] = formatValue(item, key);
        }
      });
      sheets.get(deviceName).push(row);
    });
    await exportExcel(t('reportTrips'), 'trips.xlsx', sheets, theme);
  });

  const onSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'trips';
    await scheduleReport(deviceIds, groupIds, report);
    navigate('/reports/scheduled');
  });

  const navigateToReplay = (item) => {
    navigate({
      pathname: '/replay',
      search: new URLSearchParams({
        from: item.startTime,
        to: item.endTime,
        deviceId: item.deviceId,
      }).toString(),
    });
  };

  const formatValue = (item, key) => {
    const value = item[key];
    switch (key) {
      case 'deviceId':
        return devices[value]?.name || value;
      case 'startTime':
      case 'endTime':
        return formatTime(value, 'minutes');
      case 'startOdometer':
      case 'endOdometer':
      case 'distance':
        return formatDistance(value, distanceUnit, t);
      case 'averageSpeed':
      case 'maxSpeed':
        return value > 0 ? formatSpeed(value, speedUnit, t) : null;
      case 'duration':
        return formatNumericHours(value, t);
      case 'spentFuel':
        return value > 0 ? formatVolume(value, volumeUnit, t) : null;
      case 'startAddress':
        return (
          <AddressValue
            latitude={item.startLat}
            longitude={item.startLon}
            originalAddress={value}
          />
        );
      case 'endAddress':
        return (
          <AddressValue latitude={item.endLat} longitude={item.endLon} originalAddress={value} />
        );
      default:
        return value;
    }
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportTrips']}>
      <div className={classes.container}>
        {selectedItem && (
          <div className={classes.containerMap}>
            <MapView>
              <MapGeofence />
              {route && (
                <>
                  <MapRoutePath positions={route} />
                  <MapMarkers markers={createMarkers()} />
                  <MapCamera positions={route} />
                </>
              )}
            </MapView>
            <MapScale />
          </div>
        )}
        <div className={classes.containerMain}>
          <div className={classes.header}>
            <ReportFilter
              onShow={onShow}
              onExport={onExport}
              onSchedule={onSchedule}
              deviceType="multiple"
              loading={loading}
            >
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
              <div className={classes.statCard}>
                <TimerIcon className={classes.statIcon} />
                <Typography className={classes.statLabel}>{t('reportDuration')}</Typography>
                <Typography className={classes.statValue}>{stats.duration}</Typography>
              </div>
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
                  <TableCell className={classes.columnAction} sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }} />
                  <TableCell sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>{t('sharedDevice')}</TableCell>
                  {columns.map((key) => (
                    <TableCell key={key} sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>{t(columnsMap.get(key))}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading ? (
                  items.map((item) => (
                    <TableRow key={`${item.deviceId}_${item.startTime}`} className={classes.tableRow}>
                      <TableCell className={classes.columnAction} padding="none">
                        <div className={classes.columnActionContainer}>
                          {selectedItem === item ? (
                            <IconButton size="small" onClick={() => setSelectedItem(null)}>
                              <GpsFixedIcon fontSize="small" sx={{ color: '#38bdf8' }} />
                            </IconButton>
                          ) : (
                            <IconButton size="small" onClick={() => setSelectedItem(item)}>
                              <LocationSearchingIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton size="small" onClick={() => navigateToReplay(item)}>
                            <RouteIcon fontSize="small" />
                          </IconButton>
                        </div>
                      </TableCell>
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
                  <TableShimmer columns={columns.length + 2} startAction />
                )}
                {!loading && items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={columns.length + 2} align="center">
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

export default TripReportPage;

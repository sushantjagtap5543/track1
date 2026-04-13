import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { IconButton, Table, TableBody, TableCell, TableHead, TableRow, Typography, Box } from '@mui/material';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import PanToolIcon from '@mui/icons-material/PanTool';
import TimerIcon from '@mui/icons-material/Timer';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import {
  formatAddress,
  formatDistance,
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
import { useCatch } from '../reactHelper';
import useReportStyles from './common/useReportStyles';
import MapPositions from '../map/MapPositions';
import MapView from '../map/core/MapView';
import MapCamera from '../map/MapCamera';
import AddressValue from '../common/components/AddressValue';
import TableShimmer from '../common/components/TableShimmer';
import MapGeofence from '../map/MapGeofence';
import scheduleReport from './common/scheduleReport';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import exportExcel from '../common/util/exportExcel';
import { deviceEquality } from '../common/util/deviceEquality';

const columnsArray = [
  ['startTime', 'reportStartTime'],
  ['startOdometer', 'positionOdometer'],
  ['address', 'positionAddress'],
  ['endTime', 'reportEndTime'],
  ['duration', 'reportDuration'],
  ['engineHours', 'reportEngineHours'],
  ['spentFuel', 'reportSpentFuel'],
];
const columnsMap = new Map(columnsArray);

const StopReportPage = () => {
  const navigate = useNavigate();
  const { classes } = useReportStyles();
  const t = useTranslation();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const devices = useSelector((state) => state.devices.items, deviceEquality(['id', 'name']));

  const distanceUnit = useAttributePreference('distanceUnit');
  const volumeUnit = useAttributePreference('volumeUnit');
  const coordinateFormat = usePreference('coordinateFormat');

  const [columns, setColumns] = usePersistedState('stopColumns', [
    'startTime',
    'endTime',
    'startOdometer',
    'address',
  ]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const onShow = useCatch(async ({ deviceIds, groupIds, from, to }) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    groupIds.forEach((groupId) => query.append('groupId', groupId));
    setLoading(true);
    try {
      const response = await fetchOrThrow(`/api/reports/stops?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      setItems(await response.json());
    } finally {
      setLoading(false);
    }
  });

  const stats = useMemo(() => {
    if (items.length === 0) return null;
    const totalDuration = items.reduce((acc, item) => acc + item.duration, 0);
    const totalFuel = items.reduce((acc, item) => acc + item.spentFuel, 0);

    return {
      count: items.length,
      duration: formatNumericHours(totalDuration, t),
      fuel: totalFuel > 0 ? formatVolume(totalFuel, volumeUnit, t) : null,
    };
  }, [items, t, volumeUnit]);

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
        if (key === 'address') {
          row[header] = formatAddress(item, coordinateFormat);
        } else {
          row[header] = formatValue(item, key);
        }
      });
      sheets.get(deviceName).push(row);
    });
    await exportExcel(t('reportStops'), 'stops.xlsx', sheets, theme);
  });

  const onSchedule = useCatch(async (deviceIds, groupIds, report) => {
    report.type = 'stops';
    await scheduleReport(deviceIds, groupIds, report);
    navigate('/reports/scheduled');
  });

  const formatValue = (item, key) => {
    const value = item[key];
    switch (key) {
      case 'deviceId':
        return devices[value]?.name || value;
      case 'startTime':
      case 'endTime':
        return formatTime(value, 'minutes');
      case 'startOdometer':
        return formatDistance(value, distanceUnit, t);
      case 'duration':
        return formatNumericHours(value, t);
      case 'engineHours':
        return value > 0 ? formatNumericHours(value, t) : null;
      case 'spentFuel':
        return value > 0 ? formatVolume(value, volumeUnit, t) : null;
      case 'address':
        return (
          <AddressValue
            latitude={item.latitude}
            longitude={item.longitude}
            originalAddress={value}
          />
        );
      default:
        return value;
    }
  };

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportStops']}>
      <div className={classes.container}>
        {selectedItem && (
          <div className={classes.containerMap}>
            <MapView>
              <MapGeofence />
              <MapPositions
                positions={[
                  {
                    deviceId: selectedItem.deviceId,
                    fixTime: selectedItem.startTime,
                    latitude: selectedItem.latitude,
                    longitude: selectedItem.longitude,
                  },
                ]}
                titleField="fixTime"
              />
            </MapView>
            <MapScale />
            <MapCamera latitude={selectedItem.latitude} longitude={selectedItem.longitude} />
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
                <PanToolIcon className={classes.statIcon} />
                <Typography className={classes.statLabel}>{t('reportStops')}</Typography>
                <Typography className={classes.statValue}>{stats.count}</Typography>
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
                <TableCell className={classes.columnAction} />
                <TableCell sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>{t('sharedDevice')}</TableCell>
                {columns.map((key) => (
                  <TableCell key={key} sx={{ backgroundColor: 'rgba(30, 41, 59, 0.9) !important', backdropFilter: 'blur(8px)', zIndex: 11 }}>{t(columnsMap.get(key))}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading ? (
                items.map((item) => (
                  <TableRow key={item.positionId} className={classes.tableRow}>
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

export default StopReportPage;

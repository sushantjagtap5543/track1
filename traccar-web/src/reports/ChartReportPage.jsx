import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FormControl, InputLabel, Select, MenuItem, useTheme, Box, Typography } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import RouteIcon from '@mui/icons-material/Route';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import {
  Brush,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import ReportFilter from './components/ReportFilter';
import { formatTime } from '../common/util/formatter';
import { useTranslation } from '../common/components/LocalizationProvider';
import PageLayout from '../common/components/PageLayout';
import ReportsMenu from './components/ReportsMenu';
import usePositionAttributes from '../common/attributes/usePositionAttributes';
import { useCatch } from '../reactHelper';
import { useAttributePreference } from '../common/util/preferences';
import {
  altitudeFromMeters,
  distanceFromMeters,
  speedFromKnots,
  speedToKnots,
  volumeFromLiters,
} from '../common/util/converter';
import useReportStyles from './common/useReportStyles';
import fetchOrThrow from '../common/util/fetchOrThrow';
import TableShimmer from '../common/components/TableShimmer';

const StatCard = ({ icon, label, value, color = '#38bdf8' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      p: 3,
      borderRadius: '20px',
      backgroundColor: 'rgba(30, 41, 59, 0.5)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.08)',
      transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      '&:hover': {
        backgroundColor: 'rgba(59, 130, 246, 0.12)',
        borderColor: `${color}55`,
        transform: 'translateY(-4px)',
        boxShadow: `0 16px 32px rgba(0,0,0,0.35)`,
      },
    }}
  >
    <Box sx={{ color, mb: 0.5, display: 'flex', alignItems: 'center' }}>{icon}</Box>
    <Typography sx={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
      {label}
    </Typography>
    <Typography sx={{ color: '#f8fafc', fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
      {value || '—'}
    </Typography>
  </Box>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <Box
      sx={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '12px',
        p: 2,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem', mb: 1 }}>
        {formatTime(label, 'seconds')}
      </Typography>
      {payload.map((entry) => (
        <Box key={entry.dataKey} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color }} />
          <Typography sx={{ color: '#f8fafc', fontSize: '0.8rem', fontWeight: 600 }}>
            {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}`}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const ChartReportPage = () => {
  const { classes } = useReportStyles();
  const theme = useTheme();
  const t = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const positionAttributes = usePositionAttributes(t);

  const distanceUnit = useAttributePreference('distanceUnit');
  const altitudeUnit = useAttributePreference('altitudeUnit');
  const speedUnit = useAttributePreference('speedUnit');
  const volumeUnit = useAttributePreference('volumeUnit');

  const [items, setItems] = useState([]);
  const [types, setTypes] = useState(['speed']);
  const [selectedTypes, setSelectedTypes] = useState(['speed']);
  const [timeType, setTimeType] = useState('fixTime');
  const [loading, setLoading] = useState(false);

  // Auto-default to 'today' if from/to are missing
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

  const values = useMemo(
    () => items.map((it) => selectedTypes.map((type) => it[type]).filter((v) => v != null)).flat(),
    [items, selectedTypes],
  );
  const minValue = values.length ? Math.min(...values) : 0;
  const maxValue = values.length ? Math.max(...values) : 100;
  const valueRange = maxValue - minValue;

  const statMaxSpeed = useMemo(() => {
    if (!items.length) return null;
    const maxSpeed = Math.max(...items.map((it) => it.speed || 0).filter((v) => !isNaN(v)));
    return maxSpeed > 0 ? `${maxSpeed.toFixed(1)} ${speedUnit || 'km/h'}` : null;
  }, [items, speedUnit]);

  const statAvgSpeed = useMemo(() => {
    if (!items.length) return null;
    const speeds = items.map((it) => it.speed || 0).filter((v) => v > 0);
    if (!speeds.length) return null;
    const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    return `${avg.toFixed(1)} ${speedUnit || 'km/h'}`;
  }, [items, speedUnit]);

  const statDuration = useMemo(() => {
    if (!items.length) return null;
    const first = items[0]?.[timeType];
    const last = items[items.length - 1]?.[timeType];
    if (!first || !last) return null;
    const diffMs = last - first;
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    return hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
  }, [items, timeType]);

  const statPoints = items.length > 0 ? `${items.length}` : null;

  const onShow = useCatch(async ({ deviceIds, from, to }) => {
    const query = new URLSearchParams({ from, to });
    deviceIds.forEach((deviceId) => query.append('deviceId', deviceId));
    setLoading(true);
    try {
      const response = await fetchOrThrow(`/api/reports/route?${query.toString()}`, {
        headers: { Accept: 'application/json' },
      });
      const positions = await response.json();
      const keySet = new Set();
      const keyList = [];
      const formattedPositions = positions.map((position) => {
        const data = { ...position, ...position.attributes };
        const formatted = {};
        formatted.fixTime = dayjs(position.fixTime).valueOf();
        formatted.deviceTime = dayjs(position.deviceTime || position.fixTime).valueOf();
        formatted.serverTime = dayjs(position.serverTime || position.fixTime).valueOf();
        Object.keys(data)
          .filter((key) => !['id', 'deviceId'].includes(key))
          .forEach((key) => {
            const value = data[key];
            if (typeof value === 'number') {
              keySet.add(key);
              const definition = positionAttributes[key] || {};
              switch (definition.dataType) {
                case 'speed':
                  formatted[key] = speedFromKnots(
                    key === 'obdSpeed' ? speedToKnots(value, 'kmh') : value,
                    speedUnit,
                  ).toFixed(2);
                  break;
                case 'altitude':
                  formatted[key] = altitudeFromMeters(value, altitudeUnit).toFixed(2);
                  break;
                case 'distance':
                  formatted[key] = distanceFromMeters(value, distanceUnit).toFixed(2);
                  break;
                case 'volume':
                  formatted[key] = volumeFromLiters(value, volumeUnit).toFixed(2);
                  break;
                case 'hours':
                  formatted[key] = (value / 1000).toFixed(2);
                  break;
                default:
                  formatted[key] = value;
                  break;
              }
            }
          });
        return formatted;
      });
      Object.keys(positionAttributes).forEach((key) => {
        if (keySet.has(key)) {
          keyList.push(key);
          keySet.delete(key);
        }
      });
      setTypes([...keyList, ...keySet]);
      setItems(formattedPositions);
    } finally {
      setLoading(false);
    }
  });

  const colorPalette = [
    '#38bdf8',
    '#818cf8',
    '#fb7185',
    '#f59e0b',
    '#34d399',
    '#a78bfa',
    '#94a3b8',
  ];

  return (
    <PageLayout menu={<ReportsMenu />} breadcrumbs={['reportTitle', 'reportChart']}>
      <div className={classes.container}>
        <div className={classes.containerMain}>
          {/* Filter Panel */}
          <div className={classes.header}>
            <ReportFilter onShow={onShow} deviceType="single" loading={loading}>
              <div className={classes.filterItem}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#94a3b8', '&.Mui-focused': { color: '#38bdf8' } }}>
                    {t('reportChartType')}
                  </InputLabel>
                  <Select
                    label={t('reportChartType')}
                    value={selectedTypes}
                    onChange={(e) => setSelectedTypes(e.target.value)}
                    multiple
                    disabled={!items.length}
                    sx={{
                      color: '#f8fafc',
                      backgroundColor: 'rgba(15,23,42,0.6)',
                      borderRadius: '12px',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#38bdf8' },
                      '.MuiSelect-icon': { color: '#94a3b8' },
                    }}
                  >
                    {types.map((key) => (
                      <MenuItem key={key} value={key} sx={{ color: '#f8fafc', backgroundColor: 'rgba(15,23,42,0.95)' }}>
                        {positionAttributes[key]?.name || key}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </div>
              <div className={classes.filterItem}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#94a3b8', '&.Mui-focused': { color: '#38bdf8' } }}>
                    {t('reportTimeType')}
                  </InputLabel>
                  <Select
                    label={t('reportTimeType')}
                    value={timeType}
                    onChange={(e) => setTimeType(e.target.value)}
                    disabled={!items.length}
                    sx={{
                      color: '#f8fafc',
                      backgroundColor: 'rgba(15,23,42,0.6)',
                      borderRadius: '12px',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.25)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#38bdf8' },
                      '.MuiSelect-icon': { color: '#94a3b8' },
                    }}
                  >
                    <MenuItem value="fixTime" sx={{ color: '#f8fafc', backgroundColor: 'rgba(15,23,42,0.95)' }}>{t('positionFixTime')}</MenuItem>
                    <MenuItem value="deviceTime" sx={{ color: '#f8fafc', backgroundColor: 'rgba(15,23,42,0.95)' }}>{t('positionDeviceTime')}</MenuItem>
                    <MenuItem value="serverTime" sx={{ color: '#f8fafc', backgroundColor: 'rgba(15,23,42,0.95)' }}>{t('positionServerTime')}</MenuItem>
                  </Select>
                </FormControl>
              </div>
            </ReportFilter>
          </div>

          {/* Stat Cards */}
          {items.length > 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2.5, mb: 3 }}>
              <StatCard icon={<SpeedIcon />} label="Max Speed" value={statMaxSpeed} color="#38bdf8" />
              <StatCard icon={<RouteIcon />} label="Avg Speed" value={statAvgSpeed} color="#818cf8" />
              <StatCard icon={<AccessTimeIcon />} label="Duration" value={statDuration} color="#fb7185" />
              <StatCard icon={<BatteryChargingFullIcon />} label="Data Points" value={statPoints} color="#34d399" />
            </Box>
          )}

          {/* Chart */}
          {loading && (
            <Box sx={{ p: 4, backgroundColor: 'rgba(30,41,59,0.4)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
              <Typography sx={{ color: '#94a3b8', mb: 2, fontSize: '0.85rem' }}>Loading chart data…</Typography>
              <Box sx={{ opacity: 0.6 }}>
                <TableShimmer columns={4} />
              </Box>
            </Box>
          )}

          {!loading && items.length > 0 && (
            <Box
              sx={{
                flex: 1,
                minHeight: '420px',
                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.06)',
                p: 3,
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* Chart Title */}
              <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', mb: 2.5 }}>
                {selectedTypes.map((t) => positionAttributes[t]?.name || t).join(' / ')} Chart
              </Typography>

              <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={items} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                  <defs>
                    {selectedTypes.map((type, index) => (
                      <linearGradient key={type} id={`gradient_${type}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={colorPalette[index % colorPalette.length]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={colorPalette[index % colorPalette.length]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>

                  <CartesianGrid
                    stroke="rgba(255,255,255,0.05)"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    stroke="#475569"
                    dataKey={timeType}
                    type="number"
                    tickFormatter={(value) => formatTime(value, 'time')}
                    domain={['dataMin', 'dataMax']}
                    scale="time"
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#475569"
                    type="number"
                    tickFormatter={(value) => value.toFixed(1)}
                    domain={[
                      Math.max(0, minValue - valueRange / 5),
                      maxValue + valueRange / 5,
                    ]}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                        {positionAttributes[value]?.name || value}
                      </span>
                    )}
                  />
                  <Brush
                    dataKey={timeType}
                    height={24}
                    stroke="rgba(255,255,255,0.1)"
                    fill="rgba(15,23,42,0.8)"
                    travellerWidth={6}
                    tickFormatter={() => ''}
                  />
                  {selectedTypes.map((type, index) => (
                    <Area
                      key={type}
                      type="monotone"
                      dataKey={type}
                      name={type}
                      stroke={colorPalette[index % colorPalette.length]}
                      strokeWidth={2.5}
                      fill={`url(#gradient_${type})`}
                      dot={false}
                      activeDot={{ r: 5, strokeWidth: 0, fill: colorPalette[index % colorPalette.length] }}
                      connectNulls
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          )}

          {/* Empty State */}
          {!loading && items.length === 0 && (
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                backgroundColor: 'rgba(30, 41, 59, 0.3)',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.06)',
                p: 8,
                minHeight: '300px',
              }}
            >
              <RouteIcon sx={{ fontSize: 56, color: 'rgba(56, 189, 248, 0.25)' }} />
              <Typography sx={{ color: '#475569', fontWeight: 600, fontSize: '1rem' }}>
                No Data Available
              </Typography>
              <Typography sx={{ color: '#334155', fontSize: '0.85rem', textAlign: 'center', maxWidth: 340 }}>
                Select a device and click <strong style={{ color: '#38bdf8' }}>Show</strong> to visualize route telemetry data on the chart.
              </Typography>
            </Box>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default ChartReportPage;

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box, IconButton, Slider, Typography, Tooltip, LinearProgress, Chip,
} from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import TuneIcon from '@mui/icons-material/Tune';
import DownloadIcon from '@mui/icons-material/Download';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SpeedIcon from '@mui/icons-material/Speed';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RouteIcon from '@mui/icons-material/Route';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MapView from '../map/core/MapView';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapPositions from '../map/MapPositions';
import { formatTime, formatSpeed, formatDistance } from '../common/util/formatter';
import ReportFilter, { updateReportParams } from '../reports/components/ReportFilter';
import { useTranslation } from '../common/components/LocalizationProvider';
import { useCatch } from '../reactHelper';
import MapCamera from '../map/MapCamera';
import MapGeofence from '../map/MapGeofence';
import StatusCard from '../common/components/StatusCard';
import MapScale from '../map/MapScale';
import fetchOrThrow from '../common/util/fetchOrThrow';
import MapOverlay from '../map/overlay/MapOverlay';
import { useAttributePreference } from '../common/util/preferences';

const useStyles = makeStyles()((theme) => ({
  root: {
    height: '100%',
    position: 'relative',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 3,
    left: 0,
    top: 0,
    margin: theme.spacing(1.5),
    width: theme.dimensions.drawerWidthDesktop,
    gap: theme.spacing(1.5),
    [theme.breakpoints.down('md')]: {
      width: '100%',
      margin: 0,
    },
  },
}));

// Glass card wrapper
const GlassCard = ({ children, sx = {} }) => (
  <Box
    sx={{
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      backdropFilter: 'blur(20px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      overflow: 'hidden',
      ...sx,
    }}
  >
    {children}
  </Box>
);

const StatPill = ({ icon, label, value, color = '#38bdf8' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: '6px 12px', borderRadius: '10px', backgroundColor: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
    <Box sx={{ color, display: 'flex' }}>{icon}</Box>
    <Box>
      <Typography sx={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', lineHeight: 1 }}>{label}</Typography>
      <Typography sx={{ color: '#f8fafc', fontSize: '0.82rem', fontWeight: 700, lineHeight: 1.3 }}>{value || '—'}</Typography>
    </Box>
  </Box>
);

const SPEEDS = [0.5, 1, 2, 4, 8];

const ReplayPage = () => {
  const t = useTranslation();
  const { classes } = useStyles();
  const navigate = useNavigate();
  const timerRef = useRef();

  const [searchParams, setSearchParams] = useSearchParams();
  const defaultDeviceId = useSelector((state) => state.devices.selectedId);

  const speedUnit = useAttributePreference('speedUnit');
  const distanceUnit = useAttributePreference('distanceUnit');

  const [positions, setPositions] = useState([]);
  const [index, setIndex] = useState(0);
  const [selectedDeviceId, setSelectedDeviceId] = useState(defaultDeviceId);
  const [showCard, setShowCard] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const loaded = Boolean(from && to && !loading && positions.length);

  const deviceName = useSelector((state) => {
    if (selectedDeviceId) {
      return state.devices.items[selectedDeviceId]?.name || `Device ${selectedDeviceId}`;
    }
    return null;
  });

  const currentPosition = positions[index];
  const progress = positions.length > 1 ? (index / (positions.length - 1)) * 100 : 0;

  // Auto-default to today if from/to missing
  useEffect(() => {
    if (!from || !to) {
      const f = new Date();
      f.setHours(0, 0, 0, 0);
      const t = new Date();
      t.setHours(23, 59, 59, 999);
      const newParams = new URLSearchParams(searchParams);
      newParams.set('from', f.toISOString());
      newParams.set('to', t.toISOString());
      setSearchParams(newParams, { replace: true });
    }
  }, [from, to, searchParams, setSearchParams]);

  useEffect(() => {
    if (!from && !to) setPositions([]);
  }, [from, to]);

  useEffect(() => {
    if (playing && positions.length > 0) {
      timerRef.current = setInterval(() => {
        setIndex((i) => i + 1);
      }, 500 / speedMultiplier);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [playing, positions, speedMultiplier]);

  useEffect(() => {
    if (index >= positions.length - 1) {
      clearInterval(timerRef.current);
      setPlaying(false);
    }
  }, [index, positions]);

  const onPointClick = useCallback((_, idx) => setIndex(idx), []);
  const onMarkerClick = useCallback((positionId) => setShowCard(!!positionId), []);

  const onShow = useCatch(async ({ deviceIds, from, to }) => {
    const deviceId = deviceIds.find(() => true);
    setLoading(true);
    setSelectedDeviceId(deviceId);
    const query = new URLSearchParams({ deviceId, from, to });
    try {
      const response = await fetchOrThrow(`/api/positions?${query.toString()}`);
      setIndex(0);
      setPlaying(false);
      const data = await response.json();
      setPositions(data);
      if (!data.length) throw Error(t('sharedNoData'));
    } finally {
      setLoading(false);
    }
  });

  const handleDownload = () => {
    const query = new URLSearchParams({ deviceId: selectedDeviceId, from, to });
    window.location.assign(`/api/positions/kml?${query.toString()}`);
  };

  return (
    <div className={classes.root}>
      {/* Full-page map */}
      <MapView>
        <MapOverlay />
        <MapGeofence />
        <MapRoutePath positions={positions} />
        <MapRoutePoints positions={positions} onClick={onPointClick} showSpeedControl />
        {index < positions.length && (
          <MapPositions
            positions={[positions[index]]}
            onMarkerClick={onMarkerClick}
            titleField="fixTime"
          />
        )}
      </MapView>
      <MapScale />
      <MapCamera positions={positions} />

      {/* Sidebar */}
      <div className={classes.sidebar}>

        {/* Header Card */}
        <GlassCard>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: '12px 16px' }}>
            <IconButton
              size="small"
              onClick={() => navigate(-1)}
              sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc', backgroundColor: 'rgba(255,255,255,0.08)' } }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography sx={{ color: '#f8fafc', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.01em' }}>
                {t('reportReplay')}
              </Typography>
              {deviceName && (
                <Typography sx={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 600 }}>
                  {deviceName}
                </Typography>
              )}
            </Box>
            {loaded && (
              <>
                <Tooltip title="Download KML">
                  <IconButton
                    size="small"
                    onClick={handleDownload}
                    sx={{ color: '#94a3b8', '&:hover': { color: '#38bdf8' } }}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Change filter">
                  <IconButton
                    size="small"
                    onClick={() => updateReportParams(searchParams, setSearchParams, 'ignore', [])}
                    sx={{ color: '#94a3b8', '&:hover': { color: '#38bdf8' } }}
                  >
                    <TuneIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>

          {/* Loading bar */}
          {loading && (
            <LinearProgress
              sx={{
                height: 2,
                backgroundColor: 'rgba(56,189,248,0.15)',
                '& .MuiLinearProgress-bar': { backgroundColor: '#38bdf8' },
              }}
            />
          )}
        </GlassCard>

        {/* Filter card (shown when no data) */}
        {!loaded && (
          <GlassCard>
            <Box sx={{ p: 2 }}>
              <ReportFilter onShow={onShow} deviceType="single" loading={loading} />
            </Box>
          </GlassCard>
        )}

        {/* Controls card (shown when data loaded) */}
        {loaded && (
          <GlassCard>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

              {/* Progress slider */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Progress
                  </Typography>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: 600 }}>
                    {index + 1} / {positions.length}
                  </Typography>
                </Box>
                <Slider
                  max={positions.length - 1}
                  step={null}
                  marks={positions.map((_, i) => ({ value: i }))}
                  value={index}
                  onChange={(_, i) => setIndex(i)}
                  sx={{
                    color: '#38bdf8',
                    height: 4,
                    '& .MuiSlider-thumb': {
                      width: 14,
                      height: 14,
                      backgroundColor: '#38bdf8',
                      boxShadow: '0 0 0 4px rgba(56,189,248,0.2)',
                      '&:hover': { boxShadow: '0 0 0 6px rgba(56,189,248,0.3)' },
                    },
                    '& .MuiSlider-track': { border: 'none' },
                    '& .MuiSlider-rail': { backgroundColor: 'rgba(255,255,255,0.1)' },
                    '& .MuiSlider-mark': { backgroundColor: 'rgba(255,255,255,0.15)', width: 2, height: 2 },
                  }}
                />
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    mt: 0.5,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    '& .MuiLinearProgress-bar': {
                      background: 'linear-gradient(90deg, #38bdf8, #818cf8)',
                      borderRadius: 1,
                    },
                  }}
                />
              </Box>

              {/* Playback controls */}
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="First">
                  <IconButton
                    size="small"
                    onClick={() => { setIndex(0); setPlaying(false); }}
                    sx={{ color: '#64748b', '&:hover': { color: '#f8fafc' } }}
                  >
                    <SkipPreviousIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Step Back">
                  <IconButton
                    size="small"
                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                    disabled={playing || index <= 0}
                    sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' }, '&.Mui-disabled': { color: '#334155' } }}
                  >
                    <FastRewindIcon />
                  </IconButton>
                </Tooltip>
                <IconButton
                  onClick={() => setPlaying(!playing)}
                  disabled={index >= positions.length - 1}
                  sx={{
                    mx: 0.5,
                    width: 44,
                    height: 44,
                    backgroundColor: playing ? 'rgba(56,189,248,0.15)' : 'rgba(56,189,248,0.9)',
                    color: playing ? '#38bdf8' : '#0b1120',
                    borderRadius: '50%',
                    border: playing ? '1px solid rgba(56,189,248,0.4)' : 'none',
                    '&:hover': {
                      backgroundColor: playing ? 'rgba(56,189,248,0.25)' : '#38bdf8',
                      transform: 'scale(1.08)',
                    },
                    '&.Mui-disabled': { backgroundColor: 'rgba(255,255,255,0.05)', color: '#334155' },
                    transition: 'all 0.2s ease',
                  }}
                >
                  {playing ? <PauseIcon /> : <PlayArrowIcon />}
                </IconButton>
                <Tooltip title="Step Forward">
                  <IconButton
                    size="small"
                    onClick={() => setIndex((i) => Math.min(positions.length - 1, i + 1))}
                    disabled={playing || index >= positions.length - 1}
                    sx={{ color: '#94a3b8', '&:hover': { color: '#f8fafc' }, '&.Mui-disabled': { color: '#334155' } }}
                  >
                    <FastForwardIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Last">
                  <IconButton
                    size="small"
                    onClick={() => { setIndex(positions.length - 1); setPlaying(false); }}
                    sx={{ color: '#64748b', '&:hover': { color: '#f8fafc' } }}
                  >
                    <SkipNextIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Speed multiplier */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                <Typography sx={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Speed:
                </Typography>
                {SPEEDS.map((s) => (
                  <Chip
                    key={s}
                    label={`${s}x`}
                    size="small"
                    onClick={() => setSpeedMultiplier(s)}
                    sx={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      backgroundColor: speedMultiplier === s ? 'rgba(56,189,248,0.2)' : 'rgba(30,41,59,0.6)',
                      color: speedMultiplier === s ? '#38bdf8' : '#64748b',
                      border: speedMultiplier === s ? '1px solid rgba(56,189,248,0.4)' : '1px solid rgba(255,255,255,0.06)',
                      '&:hover': { backgroundColor: 'rgba(56,189,248,0.15)', color: '#38bdf8' },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </GlassCard>
        )}

        {/* Live stats card */}
        {loaded && currentPosition && (
          <GlassCard>
            <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography sx={{ color: '#475569', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', px: 0.5 }}>
                Current Position
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                <StatPill
                  icon={<SpeedIcon sx={{ fontSize: 16 }} />}
                  label="Speed"
                  value={`${currentPosition.speed?.toFixed(1) || 0} km/h`}
                  color="#38bdf8"
                />
                <StatPill
                  icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
                  label="Time"
                  value={formatTime(currentPosition.fixTime, 'time')}
                  color="#818cf8"
                />
                <StatPill
                  icon={<GpsFixedIcon sx={{ fontSize: 16 }} />}
                  label="Lat"
                  value={currentPosition.latitude?.toFixed(5)}
                  color="#34d399"
                />
                <StatPill
                  icon={<GpsFixedIcon sx={{ fontSize: 16 }} />}
                  label="Lon"
                  value={currentPosition.longitude?.toFixed(5)}
                  color="#34d399"
                />
              </Box>
              <StatPill
                icon={<RouteIcon sx={{ fontSize: 16 }} />}
                label="Total Distance"
                value={`${((currentPosition.attributes?.totalDistance || 0) / 1000).toFixed(2)} km`}
                color="#f59e0b"
              />

              {/* Fix time bar */}
              <Box sx={{ px: 0.5, pt: 0.5 }}>
                <Typography sx={{ color: '#334155', fontSize: '0.68rem', mb: 0.5 }}>
                  {formatTime(currentPosition.fixTime, 'seconds')}
                </Typography>
              </Box>
            </Box>
          </GlassCard>
        )}
      </div>

      {/* Status card popup */}
      {showCard && index < positions.length && (
        <StatusCard
          deviceId={selectedDeviceId}
          position={positions[index]}
          onClose={() => setShowCard(false)}
          disableActions
        />
      )}
    </div>
  );
};

export default ReplayPage;

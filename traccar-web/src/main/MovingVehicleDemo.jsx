import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
  Stack,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CloseIcon from '@mui/icons-material/Close';
import ErrorIcon from '@mui/icons-material/Error';
import MapIcon from '@mui/icons-material/Map';
import FenceIcon from '@mui/icons-material/Fence';
import { sessionActions, devicesActions } from '../store';
import { eventsActions } from '../store/events';

const ROUTES = [
  {
    id: 1,
    name: 'Mumbai Express',
    category: 'car',
    path: [
      { lat: 19.0760, lng: 72.8777 },
      { lat: 19.0820, lng: 72.8830 },
      { lat: 19.0900, lng: 72.8900 },
      { lat: 19.1000, lng: 72.9000 },
      { lat: 19.1100, lng: 72.9100 },
    ],
  },
  {
    id: 2,
    name: 'Delhi Cruiser',
    category: 'truck',
    path: [
      { lat: 28.6139, lng: 77.2090 },
      { lat: 28.6200, lng: 77.2150 },
      { lat: 28.6300, lng: 77.2250 },
      { lat: 28.6400, lng: 77.2350 },
      { lat: 28.6500, lng: 77.2450 },
    ],
  },
  {
    id: 3,
    name: 'Bengaluru Tech-Line',
    category: 'bus',
    path: [
      { lat: 12.9716, lng: 77.5946 },
      { lat: 12.9800, lng: 77.6000 },
      { lat: 12.9900, lng: 77.6100 },
      { lat: 13.0000, lng: 77.6200 },
      { lat: 13.0100, lng: 77.6300 },
    ],
  },
  {
    id: 4,
    name: 'Hyderabad Sultan',
    category: 'motorcycle',
    path: [
      { lat: 17.3850, lng: 78.4867 },
      { lat: 17.3950, lng: 78.4950 },
      { lat: 17.4050, lng: 78.5050 },
      { lat: 17.4150, lng: 78.5150 },
      { lat: 17.4250, lng: 78.5250 },
    ],
  },
  {
    id: 5,
    name: 'Pune Hills',
    category: 'pickup',
    path: [
      { lat: 18.5204, lng: 73.8567 },
      { lat: 18.5300, lng: 73.8650 },
      { lat: 18.5400, lng: 73.8750 },
      { lat: 18.5500, lng: 73.8850 },
      { lat: 18.5600, lng: 73.8950 },
    ],
  },
];

const calculateCourse = (p1, p2) => {
  const y = Math.sin((p2.lng - p1.lng) * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180));
  const x = Math.cos(p1.lat * (Math.PI / 180)) * Math.sin(p2.lat * (Math.PI / 180)) -
    Math.sin(p1.lat * (Math.PI / 180)) * Math.cos(p2.lat * (Math.PI / 180)) * Math.cos((p2.lng - p1.lng) * (Math.PI / 180));
  return (Math.atan2(y, x) * (180 / Math.PI) + 360) % 360;
};

const MovingVehicleDemo = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isRunning, setIsRunning] = useState(true);
  const [step, setStep] = useState(0);
  const timerRef = useRef();

  const mockPositionsRef = useRef(ROUTES.map((route) => ({
    id: 1000 + route.id,
    deviceId: 1000 + route.id,
    fixTime: new Date().toISOString(),
    latitude: route.path[0].lat,
    longitude: route.path[0].lng,
    speed: 0,
    course: 0,
    attributes: {
      ignition: true,
      batteryLevel: 95,
      fuelLevel: 80,
    },
  })));

  const mockDevices = ROUTES.map((route) => ({
    id: 1000 + route.id,
    name: route.name,
    uniqueId: `DEMO-${route.id}`,
    status: 'online',
    category: route.category,
    lastUpdate: new Date().toISOString(),
  }));

  const updateSimulation = useCallback(() => {
    setStep((s) => {
      const nextStep = (s + 1) % 100; // Total 100 interpolation steps for smoothness
      
      const newPositions = mockPositionsRef.current.map((pos, index) => {
        const route = ROUTES[index];
        const path = route.path;
        
        // Accurate segment logic
        const segmentCount = path.length - 1;
        const totalSimSteps = 100;
        const segmentProgress = nextStep / (totalSimSteps / segmentCount);
        const currentSegment = Math.floor(segmentProgress);
        const t = segmentProgress - currentSegment;

        const p1 = path[currentSegment % path.length];
        const p2 = path[(currentSegment + 1) % path.length];

        const lat = p1.lat + (p2.lat - p1.lat) * t;
        const lng = p1.lng + (p2.lng - p1.lng) * t;
        
        const speed = 40 + Math.random() * 20; // 40-60 km/h
        const course = calculateCourse(p1, p2);

        return {
          ...pos,
          fixTime: new Date().toISOString(),
          latitude: lat,
          longitude: lng,
          speed: speed / 1.852, // km/h to knots
          course,
          attributes: {
            ...pos.attributes,
            batteryLevel: Math.max(10, pos.attributes.batteryLevel - 0.01),
            fuelLevel: Math.max(5, pos.attributes.fuelLevel - 0.05),
          },
        };
      });

      mockPositionsRef.current = newPositions;
      dispatch(sessionActions.updatePositions(newPositions));
      
      // Random Event Triggering
      if (nextStep % 25 === 0) {
        const randomVehicle = mockDevices[Math.floor(Math.random() * mockDevices.length)];
        const eventType = nextStep === 50 ? 'alarm' : (nextStep === 75 ? 'geofenceEnter' : 'deviceMoving');
        
        const event = {
          id: Date.now(),
          deviceId: randomVehicle.id,
          type: eventType,
          eventTime: new Date().toISOString(),
          attributes: eventType === 'alarm' ? { alarm: 'sos' } : {},
          geofenceId: eventType === 'geofenceEnter' ? 1 : null,
        };
        
        dispatch(eventsActions.add([event]));
      }

      return nextStep;
    });
  }, [dispatch, mockDevices]);

  useEffect(() => {
    dispatch(devicesActions.update(mockDevices));
    if (isRunning) {
      timerRef.current = setInterval(updateSimulation, 2000);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, updateSimulation, dispatch, mockDevices]);

  const handleManualSOS = () => {
    const randomVehicle = mockDevices[Math.floor(Math.random() * mockDevices.length)];
    dispatch(eventsActions.add([{
      id: Date.now(),
      deviceId: randomVehicle.id,
      type: 'sos',
      eventTime: new Date().toISOString(),
      attributes: { alarm: 'sos', message: 'Manual SOS triggered by simulation console.' },
    }]));
  };

  return (
    <Box sx={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, backgroundColor: 'rgba(15, 23, 42, 0.98)', color: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="h5" sx={{ fontWeight: 900, background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            DEMO: LIVE FLEET SIMULATOR
          </Typography>
          <Chip label="DUMMY DATA - 100% ACCURATE CALCS" size="small" sx={{ bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontWeight: 800, border: '1px solid rgba(56, 189, 248, 0.2)' }} />
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" color="error" startIcon={<ErrorIcon />} onClick={handleManualSOS} sx={{ fontWeight: 800 }}>TRIGGER SOS</Button>
          <Button variant="outlined" startIcon={<FenceIcon />} onClick={() => updateSimulation()} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.2)' }}>TRIGGER GEOFENCE</Button>
          <IconButton onClick={() => setIsRunning(!isRunning)} sx={{ color: '#fff' }}>
            {isRunning ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>
          <IconButton onClick={() => navigate('/')} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Paper sx={{ p: 3, bgcolor: 'rgba(30, 41, 59, 0.5)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>VEHICLE NAME</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>LATITUDE / LONGITUDE</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>SPEED (km/h)</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>COURSE / ANGLE</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>STATUS</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 800 }}>FUEL / BATTERY</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {mockPositionsRef.current.map((pos, idx) => (
                  <TableRow key={pos.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                    <TableCell>
                      <Typography sx={{ fontWeight: 800, color: '#f1f5f9' }}>{ROUTES[idx].name}</Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{ROUTES[idx].category}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', color: '#38bdf8' }}>
                      {pos.latitude.toFixed(6)} , {pos.longitude.toFixed(6)}
                    </TableCell>
                    <TableCell>
                      <Chip label={`${(pos.speed * 1.852).toFixed(1)} km/h`} size="small" sx={{ fontWeight: 900, bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#312e81' }} />
                    </TableCell>
                    <TableCell sx={{ color: '#94a3b8' }}>{Math.round(pos.course)}°</TableCell>
                    <TableCell>
                      <Chip label="MOVING" size="small" sx={{ fontWeight: 900, bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Box sx={{ width: '40px', height: '16px', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                           <Box sx={{ width: `${pos.attributes.fuelLevel}%`, height: '100%', bgcolor: '#38bdf8' }} />
                        </Box>
                        <Box sx={{ width: '40px', height: '16px', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: '4px', position: 'relative', overflow: 'hidden' }}>
                           <Box sx={{ width: `${pos.attributes.batteryLevel}%`, height: '100%', bgcolor: pos.attributes.batteryLevel > 20 ? '#22c55e' : '#ef4444' }} />
                        </Box>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        <Paper sx={{ mt: 3, p: 3, bgcolor: 'rgba(30, 41, 59, 0.5)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 800 }}>Simulation Controls</Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={() => navigate('/')} startIcon={<MapIcon />}>View Demo on Map</Button>
              <Button variant="outlined" onClick={() => {
                setStep(0);
                mockPositionsRef.current = mockPositionsRef.current.map((pos, idx) => ({
                    ...pos,
                    latitude: ROUTES[idx].path[0].lat,
                    longitude: ROUTES[idx].path[0].lng,
                }));
              }} startIcon={<RestartAltIcon />}>Reset Simulation</Button>
            </Stack>
            <Typography variant="body2" sx={{ mt: 2, color: 'rgba(255,255,255,0.4)' }}>
              This demo bypasses the backend and directly modifies the Redux store. It simulates 5 active vehicles across India. 
              The map positions, status list, and notification popups will all respond to this simulated data as if it were real.
            </Typography>
        </Paper>
      </Box>
    </Box>
  );
};

export default MovingVehicleDemo;

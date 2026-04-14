import express from 'express';
import { getTrips, getStops, getSummary, getCombined, getEvents, getGeofences, getHistory } from '../controllers/reportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/trips', getTrips);
router.get('/stops', getStops);
router.get('/summary', getSummary);
router.get('/combined', getCombined);
router.get('/events', getEvents);
router.get('/geofences', getGeofences);
router.get('/history', getHistory);

export default router;

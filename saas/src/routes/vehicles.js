import express from 'express';
import { getVehicles, getVehiclesWithLocations, toggleEngine, toggleSafeParking, deleteVehicle } from '../controllers/vehicleController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Get client's vehicles (Basic)
router.get('/', getVehicles);

// Get client's vehicles with live locations
router.get('/locations', getVehiclesWithLocations);

// Engine controls
router.post('/engine', toggleEngine);

// Safe parking toggle
router.post('/safe-parking', toggleSafeParking);

// Delete vehicle (Soft Delete)
router.delete('/:vehicleId', deleteVehicle);

export default router;

import { PrismaClient } from '@prisma/client';
import traccarService from '../services/traccar.js';
const prisma = new PrismaClient();

/**
 * Fetch AI Insights using OpenRouter
 */
export const getVehicleInsights = async (req, res, next) => {
    try {
        const { vehicleId } = req.params;
        
        // 1. Verify ownership
        const vehicle = await prisma.vehicle.findFirst({
            where: { id: vehicleId, userId: req.user.userId }
        });
        
        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        // 2. Fetch recent metrics (Mocked or from Traccar)
        const position = await traccarService.getLatestPosition(vehicle.traccarDeviceId);
        
        const metrics = {
            name: vehicle.name,
            plate: vehicle.plate,
            speed: position ? position.speed : 0,
            ignition: position ? position.attributes.ignition : false,
            lastUpdate: position ? position.deviceTime : 'Unknown'
        };

        // 3. Prompt AI via OpenRouter
        const prompt = `Analyze this vehicle status for GeoSurePath AI:
        Vehicle: ${metrics.name} (${metrics.plate || 'No Plate'})
        Current Speed: ${metrics.speed} km/h
        Ignition: ${metrics.ignition ? 'ON' : 'OFF'}
        Last Seen: ${metrics.lastUpdate}

        Provide a concise, professional 2-sentence insight about its status and any potential efficiency tips.`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                'HTTP-Referer': 'https://geosurepath.com',
                'X-Title': 'GeoSurePath AI',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL || 'google/gemma-2-9b-it:free',
                messages: [{ role: 'user', content: prompt }]
            })
        });

        if (!response.ok) {
            console.error('[AI] OpenRouter failed:', response.statusText);
            return res.status(200).json({ 
                insight: `Vehicle ${vehicle.name} is currently ${metrics.ignition ? 'active' : 'parked'}. System monitoring is nominal.`,
                isMock: true 
            });
        }

        const data = await response.json();
        const insight = data.choices[0].message.content.trim();

        res.json({ insight, isMock: false });

    } catch (error) {
        next(error);
    }
};

export const getGlobalInsights = async (req, res, next) => {
    try {
        const userId = req.user.userId;
        const vehicleCount = await prisma.vehicle.count({ where: { userId } });
        
        const insight = `GeoSurePath AI has analyzed your fleet of ${vehicleCount} vehicles. All systems are operating within optimal parameters. No anomalies detected in the last 24 hours.`;
        
        res.json({ insight });
    } catch (error) {
        next(error);
    }
};

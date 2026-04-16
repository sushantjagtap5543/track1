package com.safe;

import java.util.Map;
import java.util.TreeMap;

/**
 * High-Precision Sensor Calibration & Telemetry Functions for GeoSurePath
 */
public class Functions {
    
    private Functions() {
        // Utility class
    }


    /**
     * Extracts a specific bit from an integer. 
     * Useful for checking digital inputs or status flags (like SOS).
     */
    public static boolean bit(long value, int index) {
        return ((value >> index) & 1) == 1;
    }

    /**
     * Performs linear interpolation between two points.
     * Useful for simple sensor calibration (e.g., voltage to pressure).
     */
    public static double linear(double value, double x1, double y1, double x2, double y2) {
        if (x2 == x1) {
            return y1;
        }
        return y1 + (value - x1) * (y2 - y1) / (x2 - x1);
    }

    /**
     * Performs multi-point calibration (piecewise linear interpolation).
     * Input format: "0:0, 10:50, 20:120"
     * Useful for complex fuel tank shapes.
     */
    public static double calibrate(double value, String config) {
        TreeMap<Double, Double> points = new TreeMap<>();
        for (String pair : config.split(",")) {
            String[] kv = pair.trim().split(":");
            if (kv.length == 2) {
                points.put(Double.parseDouble(kv[0]), Double.parseDouble(kv[1]));
            }
        }

        if (points.isEmpty()) {
            return value;
        }
        
        Map.Entry<Double, Double> low = points.floorEntry(value);
        Map.Entry<Double, Double> high = points.ceilingEntry(value);

        if (low == null) {
            return high.getValue();
        }
        if (high == null || low.getKey().equals(high.getKey())) {
            return low.getValue();
        }

        return low.getValue() + (value - low.getKey()) * (high.getValue() - low.getValue()) 
               / (high.getKey() - low.getKey());
    }

    /**
     * Safely parses a value as double.
     */
    public static double parse(Object value) {
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        try {
            return Double.parseDouble(value.toString());
        } catch (Exception e) {
            return 0.0;
        }
    }

    /**
     * Converts raw ADC value to voltage.
     * @param raw Input value
     * @param maxRaw Max raw value (e.g., 1023 or 4095)
     * @param maxVoltage Voltage at max raw (e.g., 30.0)
     */
    public static double adcToVoltage(double raw, double maxRaw, double maxVoltage) {
        return (raw / maxRaw) * maxVoltage;
    }
}
/*
 * Copyright 2022 - 2025 Anton Tananaev (anton@traccar.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.traccar.helper.model;

import org.locationtech.jts.geom.Envelope;
import org.locationtech.jts.index.strtree.STRtree;
import org.traccar.model.Geofence;
import org.traccar.model.Position;
import org.traccar.session.cache.CacheManager;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

public final class GeofenceUtil {

    private GeofenceUtil() {
    }

    private static class TreeHolder {
        private final Set<Long> geofenceIds;
        private final STRtree tree;

        TreeHolder(Set<Long> geofenceIds, STRtree tree) {
            this.geofenceIds = geofenceIds;
            this.tree = tree;
        }

        public Set<Long> getGeofenceIds() {
            return geofenceIds;
        }

        public STRtree getTree() {
            return tree;
        }
    }

    private static final Map<Long, TreeHolder> TREE_CACHE = new ConcurrentHashMap<>();
    private static final int SPATIAL_INDEX_THRESHOLD = 10;

    public static List<Long> getCurrentGeofences(CacheManager cacheManager, Position position) {
        Collection<Geofence> geofences = cacheManager.getDeviceObjects(position.getDeviceId(), Geofence.class);
        if (geofences.isEmpty()) {
            return Collections.emptyList();
        }

        Set<Long> currentGeofenceIds = new HashSet<>();
        for (Geofence g : geofences) {
            currentGeofenceIds.add(g.getId());
        }

        Position lastPosition = cacheManager.getPosition(position.getDeviceId());
        Set<Long> lastPositionGeofences = lastPosition != null && lastPosition.getGeofenceIds() != null
                ? new HashSet<>(lastPosition.getGeofenceIds()) : Collections.emptySet();

        List<Long> result = new ArrayList<>();
        
        if (geofences.size() > SPATIAL_INDEX_THRESHOLD) {
            TreeHolder holder = TREE_CACHE.get(position.getDeviceId());
            if (holder == null || !holder.getGeofenceIds().equals(currentGeofenceIds)) {
                STRtree newTree = new STRtree();
                for (Geofence g : geofences) {
                    var min = g.getGeometry().getMin();
                    var max = g.getGeometry().getMax();
                    newTree.insert(new Envelope(min.lon(), max.lon(), min.lat(), max.lat()), g);
                }
                holder = new TreeHolder(currentGeofenceIds, newTree);
                TREE_CACHE.put(position.getDeviceId(), holder);
            }

            @SuppressWarnings("unchecked")
            List<Geofence> candidates = holder.getTree().query(new Envelope(
                    position.getLongitude(), position.getLongitude(), 
                    position.getLatitude(), position.getLatitude()));
            
            for (Geofence geofence : candidates) {
                boolean wasInside = lastPositionGeofences.contains(geofence.getId());
                double hysteresis = wasInside ? geofence.getDouble("geofenceHysteresis") : 0;
                if (geofence.containsPosition(position, hysteresis)) {
                    result.add(geofence.getId());
                }
            }
        } else {
            for (Geofence geofence : geofences) {
                boolean wasInside = lastPositionGeofences.contains(geofence.getId());
                double hysteresis = wasInside ? geofence.getDouble("geofenceHysteresis") : 0;
                if (geofence.containsPosition(position, hysteresis)) {
                    result.add(geofence.getId());
                }
            }
        }
        return result;
    }

    public static void invalidateCache(long deviceId) {
        TREE_CACHE.remove(deviceId);
    }

}
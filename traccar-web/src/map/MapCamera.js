import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { map } from './core/MapView';

const MapCamera = ({ latitude, longitude, positions, coordinates }) => {
  useEffect(() => {
    if (coordinates || positions) {
      const allCoords = coordinates || positions.map((item) => [item.longitude, item.latitude]);
      const validCoords = allCoords.filter((c) => c[0] !== 0 || c[1] !== 0);
      
      if (validCoords.length) {
        const bounds = validCoords.reduce(
          (bounds, item) => bounds.extend(item),
          new maplibregl.LngLatBounds(validCoords[0], validCoords[0]),
        );
        const canvas = map.getCanvas();
        map.fitBounds(bounds, {
          padding: Math.min(canvas.width, canvas.height) * 0.1,
          duration: 0,
        });
      }
    } else {

      map.jumpTo({
        center: [longitude, latitude],
        zoom: Math.max(map.getZoom(), 10),
      });
    }
  }, [latitude, longitude, positions, coordinates]);

  return null;
};

export default MapCamera;

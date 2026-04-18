import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { googleProtocol } from 'maplibre-google-maps';
import { useRef, useLayoutEffect, useEffect, useState, useMemo } from 'react';
import { useTheme } from '@mui/material';
import { SwitcherControl } from '../switcher/switcher';
import { useAttributePreference, usePreference } from '../../common/util/preferences';
import usePersistedState, { savePersistedState } from '../../common/util/usePersistedState';
import { mapImages } from './preloadImages';
import useMapStyles from './useMapStyles';
import { useEffectAsync } from '../../reactHelper';

const element = document.createElement('div');
element.style.width = '100%';
element.style.height = '100%';
element.style.boxSizing = 'initial';

maplibregl.addProtocol('google', googleProtocol);

let internalMap = null;
let mapSupported = true;

try {
  if (maplibregl.supported()) {
    internalMap = new maplibregl.Map({
      container: element,
      attributionControl: false,
      dragRotate: true,
      touchZoomRotate: true,
      bearingSnap: 0,
      crossSourceCollisions: false,
    });
  } else {
    mapSupported = false;
  }
} catch (e) {
  console.error('WebGL initialization failed', e);
  mapSupported = false;
}

export const map = new Proxy({}, {
  get(target, prop) {
    if (internalMap) {
      const value = internalMap[prop];
      return typeof value === 'function' ? value.bind(internalMap) : value;
    }
    return (...args) => {
      console.warn(`Map method ${prop} called but map is not available`);
      if (prop === 'getCenter') return { lng: 0, lat: 0, toArray: () => [0, 0] };
      if (prop === 'getZoom') return 0;
      if (prop === 'getCanvas') return { style: {}, width: 0, height: 0, addEventListener: () => {}, removeEventListener: () => {} };
      if (prop === 'getSource' || prop === 'getLayer') return null;
      if (prop === 'getBounds') return { getSouthWest: () => ({ lng: 0, lat: 0 }), getNorthEast: () => ({ lng: 0, lat: 0 }) };
      if (prop === 'queryRenderedFeatures' || prop === 'querySourceFeatures') return [];
      if (prop === 'getStyle') return { layers: [] };
      return null;
    };
  }
});


let ready = false;
const readyListeners = new Set();

const addReadyListener = (listener) => {
  readyListeners.add(listener);
  listener(ready);
};

const removeReadyListener = (listener) => {
  readyListeners.delete(listener);
};

const updateReadyValue = (value) => {
  ready = value;
  readyListeners.forEach((listener) => listener(value));
};

const initMap = async () => {
  if (ready) return;
  if (!map.hasImage('background')) {
    Object.entries(mapImages).forEach(([key, value]) => {
      map.addImage(key, value, {
        pixelRatio: window.devicePixelRatio,
      });
    });
  }
};

const MapView = ({ children }) => {
  const theme = useTheme();

  const containerRef = useRef(null);

  const [mapReady, setMapReady] = useState(false);

  const mapStyles = useMapStyles();
  const activeMapStyles = useAttributePreference(
    'activeMapStyles',
    'locationIqStreets,locationIqDark,googleHybrid,esriSatellite,osm,carto,openTopoMap,stadiaSmooth',
  );
  const [defaultMapStyle] = usePersistedState(
    'selectedMapStyle',
    usePreference('map', 'locationIqStreets'),
  );
  const mapboxAccessToken = useAttributePreference('mapboxAccessToken');
  const maxZoom = useAttributePreference('web.maxZoom');

  const switcher = useMemo(
    () =>
      new SwitcherControl(
        () => updateReadyValue(false),
        (styleId) => savePersistedState('selectedMapStyle', styleId),
        () => {
          map.once('styledata', () => {
            const waiting = () => {
              if (!map.loaded()) {
                setTimeout(waiting, 33);
              } else {
                initMap();
                updateReadyValue(true);
              }
            };
            waiting();
          });
        },
      ),
    [],
  );

  useEffectAsync(async () => {
    if (theme.direction === 'rtl') {
      maplibregl.setRTLTextPlugin('/mapbox-gl-rtl-text.js');
    }
  }, [theme.direction]);

  useEffect(() => {
    const attribution = new maplibregl.AttributionControl({ compact: true });
    const navigation = new maplibregl.NavigationControl();
    map.addControl(attribution, theme.direction === 'rtl' ? 'bottom-left' : 'bottom-right');
    map.addControl(navigation, theme.direction === 'rtl' ? 'top-left' : 'top-right');
    map.addControl(switcher, theme.direction === 'rtl' ? 'top-left' : 'top-right');
    return () => {
      map.removeControl(switcher);
      map.removeControl(navigation);
      map.removeControl(attribution);
    };
  }, [theme.direction, switcher]);

  useEffect(() => {
    if (maxZoom) {
      map.setMaxZoom(maxZoom);
    }
  }, [maxZoom]);

  useEffect(() => {
    maplibregl.accessToken = mapboxAccessToken;
  }, [mapboxAccessToken]);

  useEffect(() => {
    const filteredStyles = mapStyles.filter((s) => s.available && activeMapStyles.includes(s.id));
    const styles = filteredStyles.length ? filteredStyles : mapStyles.filter((s) => s.id === 'osm');
    switcher.updateStyles(styles, defaultMapStyle);
  }, [mapStyles, defaultMapStyle, activeMapStyles, switcher]);

  useEffect(() => {
    const listener = (ready) => setMapReady(ready);
    addReadyListener(listener);
    return () => {
      removeReadyListener(listener);
    };
  }, []);

  useLayoutEffect(() => {
    const currentEl = containerRef.current;
    currentEl.appendChild(element);
    map.resize();
    return () => {
      currentEl.removeChild(element);
    };
  }, [containerRef]);

  if (!mapSupported) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#f8fafc',
        flexDirection: 'column',
        gap: '1.5rem',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ 
          fontSize: '3rem', 
          background: 'rgba(239, 68, 68, 0.1)', 
          color: '#ef4444', 
          width: '80px', 
          height: '80px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          borderRadius: '50%',
          marginBottom: '1rem'
        }}>
          !
        </div>
        <h2 style={{ margin: 0, color: '#ef4444' }}>Map Support Unavailable</h2>
        <p style={{ maxWidth: '400px', margin: 0, opacity: 0.8, lineHeight: 1.6 }}>
          WebGL is required to display the map but is currently disabled or not supported in your browser.
        </p>
        <p style={{ fontSize: '0.875rem', color: '#38bdf8', cursor: 'help' }}>
          Try enabling hardware acceleration in your browser settings.
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }} ref={containerRef}>
      {mapReady && children}
    </div>
  );
};

export default MapView;

// src/screens/NavigateScreen.js

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Animated, Dimensions,
  ActivityIndicator, Platform, PanResponder,
} from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/MaterialIcons'; // Added for consistent icons
import * as Location from 'expo-location';
import { colors } from '../theme/colors';

const { height } = Dimensions.get('window');

// ── Sheet snap points ─────────────────────────────────────────────
const SNAP = {
  collapsed: height * 0.78,
  half:      height * 0.52,
  expanded:  height * 0.18,
};

// ─── Helpers ──────────────────────────────────────────────────────

function getLandmarkEmoji(tags) {
  if (tags.tourism === 'museum') return '🏛️';
  if (tags.tourism === 'monument') return '🗿';
  if (tags.tourism === 'attraction') return '⭐';
  if (tags.tourism === 'artwork') return '🎨';
  if (tags.tourism === 'viewpoint') return '🔭';
  if (tags.tourism === 'zoo') return '🦁';
  if (tags.tourism === 'aquarium') return '🐠';
  if (tags.tourism === 'theme_park') return '🎡';
  if (tags.tourism === 'gallery') return '🖼️';
  if (tags.historic === 'castle') return '🏰';
  if (tags.historic === 'ruins') return '🏚️';
  if (tags.historic === 'monument') return '🗿';
  if (tags.historic === 'memorial') return '🕊️';
  if (tags.historic === 'shrine') return '⛩️';
  if (tags.amenity === 'place_of_worship') {
    if (tags.religion === 'muslim') return '🕌';
    if (tags.religion === 'buddhist') return '☸️';
    if (tags.building === 'mosque') return '🕌';
    if (tags.building === 'temple') return '⛩️';
    return '⛪';
  }
  if (tags.amenity === 'theatre' || tags.amenity === 'cinema') return '🎭';
  if (tags.amenity === 'library') return '📚';
  if (tags.leisure === 'park') return '🌳';
  if (tags.leisure === 'garden') return '🌸';
  if (tags.leisure === 'stadium') return '🏟️';
  if (tags.leisure === 'nature_reserve') return '🌿';
  if (tags.natural === 'peak' || tags.natural === 'volcano') return '⛰️';
  if (tags.natural === 'beach') return '🏖️';
  if (tags.natural === 'cave_entrance') return '🕳️';
  if (tags.building === 'cathedral' || tags.building === 'church') return '⛪';
  if (tags.building === 'mosque') return '🕌';
  if (tags.building === 'temple' || tags.building === 'shrine') return '⛩️';
  return '📍';
}

function getLandmarkType(tags) {
  if (tags.tourism === 'museum') return 'Museum';
  if (tags.tourism === 'monument') return 'Monument';
  if (tags.tourism === 'attraction') return 'Attraction';
  if (tags.tourism === 'artwork') return 'Artwork';
  if (tags.tourism === 'viewpoint') return 'Viewpoint';
  if (tags.tourism === 'zoo') return 'Zoo';
  if (tags.tourism === 'aquarium') return 'Aquarium';
  if (tags.tourism === 'theme_park') return 'Theme Park';
  if (tags.tourism === 'gallery') return 'Gallery';
  if (tags.historic === 'castle') return 'Castle';
  if (tags.historic === 'ruins') return 'Historic Ruins';
  if (tags.historic === 'monument') return 'Monument';
  if (tags.historic === 'memorial') return 'Memorial';
  if (tags.historic === 'shrine') return 'Shrine';
  if (tags.historic) return 'Historic Site';
  if (tags.amenity === 'place_of_worship') return 'Place of Worship';
  if (tags.amenity === 'theatre') return 'Theatre';
  if (tags.amenity === 'cinema') return 'Cinema';
  if (tags.amenity === 'library') return 'Library';
  if (tags.leisure === 'park') return 'Park';
  if (tags.leisure === 'garden') return 'Garden';
  if (tags.leisure === 'stadium') return 'Stadium';
  if (tags.leisure === 'nature_reserve') return 'Nature Reserve';
  if (tags.natural === 'peak') return 'Mountain Peak';
  if (tags.natural === 'beach') return 'Beach';
  if (tags.natural === 'cave_entrance') return 'Cave';
  if (tags.building === 'cathedral') return 'Cathedral';
  if (tags.building === 'church') return 'Church';
  if (tags.building === 'mosque') return 'Mosque';
  if (tags.building === 'temple') return 'Temple';
  return 'Landmark';
}

function getLandmarkCategory(tags) {
  if (tags.tourism === 'museum' || tags.historic) return 'history';
  if (tags.tourism === 'attraction' || tags.tourism === 'viewpoint') return 'attraction';
  if (tags.leisure === 'park' || tags.natural) return 'nature';
  if (tags.amenity === 'place_of_worship') return 'culture';
  return 'attraction';
}

function getDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  const meters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (meters < 1000) return { text: `${Math.round(meters)}m`, meters, minutes: Math.round(meters / 80) };
  return { text: `${(meters / 1000).toFixed(1)}km`, meters, minutes: Math.round(meters / 80) };
}

function getBearing(lat1, lng1, lat2, lng2) {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const y = Math.sin(dLng) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
    Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLng);
  const deg = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

// ── OSRM turn icon helper ─────────────────────────────────────────
function getTurnIcon(modifier) {
  if (!modifier) return '⬆️';
  if (modifier.includes('left')) return modifier.includes('sharp') ? '↰' : modifier.includes('slight') ? '↖️' : '⬅️';
  if (modifier.includes('right')) return modifier.includes('sharp') ? '↱' : modifier.includes('slight') ? '↗️' : '➡️';
  if (modifier === 'uturn') return '🔄';
  return '⬆️';
}

// ─── OSRM Routing ─────────────────────────────────────────────────

async function fetchRoute(fromLat, fromLng, toLat, toLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true&annotations=false`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes?.length) {
      return { coords: [[fromLat, fromLng], [toLat, toLng]], steps: [] };
    }

    const route = data.routes[0];

    // Convert [lng, lat] → [lat, lng] for Leaflet
    const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);

    // Flatten all steps from all legs
    const steps = route.legs.flatMap(leg =>
      leg.steps
        .filter(step => step.maneuver?.type !== 'depart' || step.name)
        .map(step => ({
          instruction: buildInstruction(step),
          distance: step.distance < 1000
            ? `${Math.round(step.distance)}m`
            : `${(step.distance / 1000).toFixed(1)}km`,
          duration: `${Math.round(step.duration / 60)} min`,
          icon: getTurnIcon(step.maneuver?.modifier),
          type: step.maneuver?.type,
        }))
        .filter(step => step.instruction)
    );

    return {
      coords,
      steps,
      totalDistance: route.distance,
      totalDuration: route.duration,
    };
  } catch {
    // Network error — fall back to straight line, no steps
    return { coords: [[fromLat, fromLng], [toLat, toLng]], steps: [] };
  }
}

function buildInstruction(step) {
  const type = step.maneuver?.type;
  const modifier = step.maneuver?.modifier;
  const name = step.name ? `onto ${step.name}` : '';

  if (type === 'depart') return step.name ? `Start on ${step.name}` : '';
  if (type === 'arrive') return 'Arrive at destination';
  if (type === 'turn') {
    if (modifier?.includes('left')) return `Turn left ${name}`.trim();
    if (modifier?.includes('right')) return `Turn right ${name}`.trim();
    return `Continue ${name}`.trim();
  }
  if (type === 'continue') return `Continue ${name}`.trim();
  if (type === 'new name') return `Continue ${name}`.trim();
  if (type === 'roundabout') return `Take the roundabout ${name}`.trim();
  if (type === 'rotary') return `Take the rotary ${name}`.trim();
  if (type === 'fork') {
    if (modifier?.includes('left')) return `Keep left ${name}`.trim();
    if (modifier?.includes('right')) return `Keep right ${name}`.trim();
  }
  if (type === 'merge') return `Merge ${name}`.trim();
  if (type === 'end of road') {
    if (modifier?.includes('left')) return `Turn left at end of road ${name}`.trim();
    if (modifier?.includes('right')) return `Turn right at end of road ${name}`.trim();
  }
  return step.name ? `Head towards ${step.name}` : '';
}

// ─── Overpass API ─────────────────────────────────────────────────

async function fetchNearbyLandmarks(lat, lng, radius = 5000) {
  // Try multiple Overpass API mirrors in case one is down
  const OVERPASS_MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  ];

  // Simplified, broader query that's more reliable
  const query = `
    [out:json][timeout:30];
    (
      node["tourism"](around:${radius},${lat},${lng});
      node["historic"](around:${radius},${lat},${lng});
      node["amenity"~"place_of_worship|library|theatre|cinema|museum"](around:${radius},${lat},${lng});
      node["leisure"~"park|nature_reserve|garden|stadium"](around:${radius},${lat},${lng});
      node["natural"~"peak|beach|cave_entrance"](around:${radius},${lat},${lng});
      way["tourism"](around:${radius},${lat},${lng});
      way["historic"](around:${radius},${lat},${lng});
      way["leisure"~"park|nature_reserve|garden"](around:${radius},${lat},${lng});
    );
    out geom 50;
  `;

  let data = null;
  let lastError = null;

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(mirror, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
      });
      
      if (!res.ok) {
        lastError = `Server error: ${res.status}`;
        continue;
      }
      
      data = await res.json();
      
      if (data?.elements?.length > 0) {
        break; // got results, stop trying mirrors
      }
    } catch (err) {
      lastError = err.message;
      continue;
    }
  }

  // If no data from Overpass, return empty with a message to debug
  if (!data?.elements?.length) {
    console.log('No landmarks fetched. Last error:', lastError);
    return [];
  }

  return data.elements
    .filter(el => el.tags?.name) // must have a name
    .map(el => {
      // Handle both node and way elements
      let elLat, elLng;
      
      if (el.lat && el.lon) {
        // Node element
        elLat = el.lat;
        elLng = el.lon;
      } else if (el.center?.lat && el.center?.lon) {
        // Way element with center
        elLat = el.center.lat;
        elLng = el.center.lon;
      } else if (el.geometry && el.geometry.length > 0) {
        // Way element - use first coordinate
        const first = el.geometry[0];
        elLat = first.lat;
        elLng = first.lon;
      }
      
      if (!elLat || !elLng) return null;

      const dist = getDistance(lat, lng, elLat, elLng);
      return {
        id: el.id,
        name: el.tags.name,
        type: getLandmarkType(el.tags),
        emoji: getLandmarkEmoji(el.tags),
        category: getLandmarkCategory(el.tags),
        lat: elLat,
        lng: elLng,
        distance: dist.text,
        meters: dist.meters,
        time: `${dist.minutes} min`,
      };
    })
    .filter(Boolean) // remove nulls
    .filter((el, i, arr) => arr.findIndex(e => e.name === el.name) === i) // dedupe by name
    .sort((a, b) => a.meters - b.meters)
    .slice(0, 20);
}

// ─── Map HTML ──────────────────────────────────────────────────────

function buildMapHTML(userLat, userLng, landmarks, selected, routeCoords) {
  const markerJS = landmarks.map(p => `
    L.marker([${p.lat},${p.lng}],{
      icon:L.divIcon({
        className:'',
        html:'<div style="background:${selected?.id === p.id ? '#1a73e8' : '#fff'};border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-size:17px;box-shadow:0 2px 8px rgba(0,0,0,0.18);border:2px solid ${selected?.id === p.id ? '#1a73e8' : '#ddd'}">${p.emoji}</div>',
        iconSize:[36,36],iconAnchor:[18,18]
      })
    }).addTo(map).on('click',function(){
      window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'select',id:${p.id}}));
    });
  `).join('');

  // Draw real OSRM route if available, else straight dashed line
  const routeJS = selected
    ? routeCoords?.length > 2
      ? `
        if(window._route) map.removeLayer(window._route);
        window._route = L.polyline(${JSON.stringify(routeCoords)}, {
          color:'#1a73e8', weight:5, opacity:0.85, lineJoin:'round', lineCap:'round'
        }).addTo(map);
        map.fitBounds(window._route.getBounds(), {
          paddingTopLeft:[40,120], paddingBottomRight:[40,80]
        });
      `
      : `
        if(window._route) map.removeLayer(window._route);
        window._route = L.polyline([[${userLat},${userLng}],[${selected.lat},${selected.lng}]], {
          color:'#1a73e8', weight:4, opacity:0.8, dashArray:'8,12'
        }).addTo(map);
        map.fitBounds([[${userLat},${userLng}],[${selected.lat},${selected.lng}]], {
          paddingTopLeft:[40,100], paddingBottomRight:[40,60]
        });
      `
    : `
        if(window._route){ map.removeLayer(window._route); window._route=null; }
        map.setView([${userLat},${userLng}],15);
      `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{width:100%;height:100%;background:#f0ede8}
       .leaflet-tile-pane{filter:saturate(0.65) brightness(1.05)}
  </style>
</head>
<body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:false});
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',{maxZoom:19,subdomains:'abcd'}).addTo(map);
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',{maxZoom:19,subdomains:'abcd',opacity:0.55}).addTo(map);

L.circle([${userLat},${userLng}],{radius:50,color:'#1a73e8',fillColor:'#1a73e8',fillOpacity:0.07,weight:1,opacity:0.25}).addTo(map);

L.marker([${userLat},${userLng}],{
  icon:L.divIcon({
    className:'',
    html:'<div style="width:22px;height:22px;background:#1a73e8;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 8px rgba(26,115,232,0.55)"></div>',
    iconSize:[22,22],iconAnchor:[11,11]
  }),zIndexOffset:1000
}).addTo(map);

${markerJS}
${routeJS}

function onMsg(e){
  try{
    var d=JSON.parse(e.data);
    if(d.type==='recenter') map.setView([d.lat,d.lng],15,{animate:true});
  }catch(err){}
}
document.addEventListener('message',onMsg);
window.addEventListener('message',onMsg);
</script>
</body>
</html>`;
}

// ─── Category filters ──────────────────────────────────────────────
// UPDATED: Using MaterialIcons like ExploreScreen for consistency
const CATEGORIES = [
  { key: 'all',        label: 'All',        icon: 'explore' },
  { key: 'attraction', label: 'Attractions', icon: 'star' },
  { key: 'history',    label: 'History',     icon: 'history-edu' },
  { key: 'nature',     label: 'Nature',      icon: 'landscape' },
  { key: 'culture',    label: 'Culture',     icon: 'account-balance' },
];

// ─── Main Component ────────────────────────────────────────────────

export default function NavigateScreen() {
  const [userLocation, setUserLocation] = useState(null);
  const [heading, setHeading] = useState(0);
  const [landmarks, setLandmarks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  // ── NEW: routing state ──
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeSteps, setRouteSteps] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showSteps, setShowSteps] = useState(false);

  const webViewRef = useRef(null);
  const locationSub = useRef(null);
  const headingSub = useRef(null);

  // ── Draggable sheet ──
  const sheetY = useRef(new Animated.Value(SNAP.half)).current;
  const lastSnap = useRef(SNAP.half);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6,
      onPanResponderGrant: () => {
        sheetY.stopAnimation(v => { lastSnap.current = v; });
        sheetY.setOffset(lastSnap.current);
        sheetY.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        const next = lastSnap.current + g.dy;
        if (next >= SNAP.expanded && next <= SNAP.collapsed) sheetY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        sheetY.flattenOffset();
        const cur = lastSnap.current + g.dy;
        let target;
        if (g.vy < -0.5) target = SNAP.expanded;
        else if (g.vy > 0.5) target = SNAP.collapsed;
        else {
          target = Object.values(SNAP)
            .map(s => ({ s, d: Math.abs(cur - s) }))
            .sort((a, b) => a.d - b.d)[0].s;
        }
        lastSnap.current = target;
        Animated.spring(sheetY, { toValue: target, tension: 70, friction: 13, useNativeDriver: false }).start();
      },
    })
  ).current;

  const snapSheet = (point) => {
    lastSnap.current = SNAP[point];
    Animated.spring(sheetY, { toValue: SNAP[point], tension: 70, friction: 13, useNativeDriver: false }).start();
  };

  // ── Nav banner animation ──
  const bannerH = useRef(new Animated.Value(0)).current;
  const bannerOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (selected) {
      Animated.parallel([
        Animated.spring(bannerH, { toValue: 72, tension: 65, friction: 11, useNativeDriver: false }),
        Animated.timing(bannerOp, { toValue: 1, duration: 200, useNativeDriver: false }),
      ]).start();
      snapSheet('half');
    } else {
      Animated.parallel([
        Animated.spring(bannerH, { toValue: 0, tension: 65, friction: 11, useNativeDriver: false }),
        Animated.timing(bannerOp, { toValue: 0, duration: 150, useNativeDriver: false }),
      ]).start();
    }
  }, [selected]);

  // ── Init location + landmarks ──
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        let lat, lng;
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        } else {
          lat = 14.5995; lng = 120.9842; // Manila fallback
        }
        setUserLocation({ lat, lng });
        const nearby = await fetchNearbyLandmarks(lat, lng);
        setLandmarks(nearby);
      } catch {
        setError('Could not load landmarks. Check your connection.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Live GPS watch ──
  useEffect(() => {
    if (!userLocation) return;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      locationSub.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 8 },
        (loc) => setUserLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude })
      );
      headingSub.current = await Location.watchHeadingAsync((h) =>
        setHeading(Math.round(h.trueHeading || h.magHeading || 0))
      );
    })();
    return () => { locationSub.current?.remove(); headingSub.current?.remove(); };
  }, [!!userLocation]);

  // ── NEW: fetch OSRM route when a place is selected ──
  useEffect(() => {
    if (!selected || !userLocation) {
      setRouteCoords([]);
      setRouteSteps([]);
      setActiveStep(0);
      setShowSteps(false);
      return;
    }

    setRouteLoading(true);
    fetchRoute(userLocation.lat, userLocation.lng, selected.lat, selected.lng)
      .then(({ coords, steps }) => {
        setRouteCoords(coords);
        setRouteSteps(steps);
        setActiveStep(0);
      })
      .finally(() => setRouteLoading(false));
  }, [selected?.id]);

  // ── NEW: advance active step as user walks ──
  useEffect(() => {
    if (!routeSteps.length || !userLocation || activeStep >= routeSteps.length) return;
    // Simple threshold: if user is within ~30m of the current step's target coord, advance
    const nextCoord = routeCoords[Math.min(activeStep + 1, routeCoords.length - 1)];
    if (!nextCoord) return;
    const dist = getDistance(userLocation.lat, userLocation.lng, nextCoord[0], nextCoord[1]);
    if (dist.meters < 30) setActiveStep(prev => Math.min(prev + 1, routeSteps.length - 1));
  }, [userLocation]);

  const handleSelect = useCallback((place) => {
    setSelected(prev => prev?.id === place.id ? null : place);
  }, []);

  const handleMapMessage = useCallback((event) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'select') {
        const found = landmarks.find(l => l.id === msg.id);
        if (found) handleSelect(found);
      }
    } catch {}
  }, [landmarks, handleSelect]);

  const handleRecenter = () => {
    if (!userLocation) return;
    webViewRef.current?.postMessage(
      JSON.stringify({ type: 'recenter', lat: userLocation.lat, lng: userLocation.lng })
    );
  };

  const filtered = activeCategory === 'all'
    ? landmarks
    : landmarks.filter(l => l.category === activeCategory);

  const dirText = selected && userLocation
    ? getBearing(userLocation.lat, userLocation.lng, selected.lat, selected.lng)
    : '';

  const currentStep = routeSteps[activeStep];

  // ─── Loading / Error ───────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.centered}>
        <View style={s.loadCard}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadTitle}>Finding your location</Text>
          <Text style={s.loadSub}>Discovering nearby landmarks…</Text>
        </View>
      </View>
    );
  }
  if (error) {
    return (
      <View style={s.centered}>
        <Icon name="warning" size={44} color={colors.muted} />
        <Text style={s.errText}>{error}</Text>
      </View>
    );
  }

  const mapHTML = userLocation
    ? buildMapHTML(userLocation.lat, userLocation.lng, landmarks, selected, routeCoords)
    : '';

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* ── Full-screen map ── */}
      <View style={StyleSheet.absoluteFill}>
        {userLocation && (
          <WebView
            ref={webViewRef}
            source={{ html: mapHTML }}
            style={StyleSheet.absoluteFill}
            javaScriptEnabled
            domStorageEnabled
            originWhitelist={['*']}
            onMessage={handleMapMessage}
            scrollEnabled={false}
          />
        )}
      </View>

      {/* ── GPS Badge ── */}
      <View style={s.gpsBadge}>
        <View style={s.gpsDot} />
        <Text style={s.gpsText}>Live GPS</Text>
      </View>

      {/* ── Map controls ── */}
      <View style={s.mapControls}>
        <TouchableOpacity style={s.mapBtn} onPress={handleRecenter}>
          <Icon name="my-location" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={s.mapBtn}>
          <Animated.Text 
            style={[
              s.compassN, 
              { 
                transform: [{ rotate: `${-heading}deg` }],
                color: colors.danger
              }
            ]}
          >
            N
          </Animated.Text>
        </View>
      </View>

      {/* ── Nav banner (shows when place selected) ── */}
      <Animated.View
        style={[s.navCard, { height: bannerH, opacity: bannerOp }]}
        pointerEvents={selected ? 'auto' : 'none'}
      >
        {selected && (
          <View style={s.navInner}>
            <View style={s.navEmojiWrap}>
              {routeLoading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={{ fontSize: 22 }}>{selected.emoji}</Text>
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.navName} numberOfLines={1}>{selected.name}</Text>
              <Text style={s.navSub}>
                Head <Text style={s.navDir}>{dirText}</Text>
                {'  ·  '}{selected.distance}{'  ·  '}~{selected.time} walk
              </Text>
            </View>
            {/* Toggle step-by-step directions */}
            {routeSteps.length > 0 && (
              <TouchableOpacity style={s.stepsToggle} onPress={() => setShowSteps(v => !v)}>
                <Icon 
                  name={showSteps ? "expand-less" : "expand-more"} 
                  size={16} 
                  color="#fff" 
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={s.navEnd} onPress={() => setSelected(null)}>
              <Icon name="close" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>

      {/* ── NEW: Turn-by-turn step panel ── */}
      {selected && showSteps && routeSteps.length > 0 && (
        <View style={s.stepPanel}>
          {/* Current step */}
          <View style={s.stepCurrent}>
            <Text style={s.stepIcon}>{currentStep?.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.stepInstruction}>{currentStep?.instruction}</Text>
              <Text style={s.stepMeta}>{currentStep?.distance}  ·  {currentStep?.duration}</Text>
            </View>
          </View>

          {/* Step progress bar */}
          <View style={s.stepBar}>
            {routeSteps.map((_, i) => (
              <View
                key={i}
                style={[
                  s.stepDot,
                  i < activeStep && s.stepDotDone,
                  i === activeStep && s.stepDotActive,
                ]}
              />
            ))}
          </View>

          {/* Scroll list of all steps */}
          <ScrollView style={s.stepList} showsVerticalScrollIndicator={false}>
            {routeSteps.map((step, i) => (
              <TouchableOpacity
                key={i}
                style={[s.stepRow, i === activeStep && s.stepRowActive]}
                onPress={() => setActiveStep(i)}
              >
                <Text style={s.stepRowIcon}>{step.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.stepRowText, i === activeStep && s.stepRowTextActive]} numberOfLines={2}>
                    {step.instruction}
                  </Text>
                  <Text style={s.stepRowMeta}>{step.distance}</Text>
                </View>
                {i < activeStep && <Icon name="check" size={14} color={colors.success} style={s.stepDoneCheck} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Draggable Bottom Sheet ── */}
      <Animated.View style={[s.sheet, { top: sheetY }]}>

        {/* Drag handle */}
        <View style={s.dragZone} {...panResponder.panHandlers}>
          <View style={s.handle} />

          <View style={s.sheetHead}>
            <View>
              <Text style={s.sheetTitle}>Nearby</Text>
              <Text style={s.sheetSub}>{filtered.length} places · sorted by distance</Text>
            </View>
            <View style={s.liveRow}>
              <View style={s.liveDot} />
              <Text style={s.liveTxt}>Updating</Text>
            </View>
          </View>

          {/* UPDATED: Category filter with MaterialIcons */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.catWrap}
            style={{ maxHeight: 44, marginBottom: 10 }}
          >
            {CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[s.chip, isActive && s.chipOn]}
                  onPress={() => setActiveCategory(cat.key)}
                >
                  <Icon 
                    name={cat.icon} 
                    size={16} 
                    color={isActive ? 'black' : colors.ink} 
                  />
                  <Text style={[s.chipLbl, isActive && s.chipLblOn]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Scrollable list */}
        {filtered.length === 0 ? (
          <View style={s.empty}>
            <Icon name="search-off" size={36} color={colors.muted} />
            <Text style={s.emptyTxt}>No landmarks in this category nearby.</Text>
          </View>
        ) : (
          <ScrollView
            style={s.list}
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {filtered.map((place, idx) => {
              const on = selected?.id === place.id;
              return (
                <TouchableOpacity
                  key={place.id}
                  style={[s.card, on && s.cardOn]}
                  onPress={() => handleSelect(place)}
                  activeOpacity={0.78}
                >
                  <View style={[s.rank, on && s.rankOn]}>
                    <Text style={[s.rankTxt, on && s.rankTxtOn]}>{idx + 1}</Text>
                  </View>
                  <View style={[s.cardEmoji, on && s.cardEmojiOn]}>
                    <Text style={{ fontSize: 22 }}>{place.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardName} numberOfLines={1}>{place.name}</Text>
                    <Text style={s.cardType}>{place.type}</Text>
                  </View>
                  <View style={s.cardRight}>
                    <Text style={[s.cardDist, on && s.cardDistOn]}>{place.distance}</Text>
                    <Text style={s.cardTime}>{place.time}</Text>
                    <View style={[s.goBtn, on && s.goBtnOn]}>
                      <Icon 
                        name={on ? "check" : "navigate-next"} 
                        size={14} 
                        color={on ? colors.white : colors.muted}
                        style={s.goTxtIcon}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0ede8' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f2f7' },
  loadCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 32,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 6,
  },
  loadTitle: { fontFamily: 'Syne_700Bold', fontSize: 16, color: colors.ink, marginTop: 8 },
  loadSub: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted },
  errText: { fontFamily: 'DMSans_400Regular', fontSize: 14, color: colors.muted, textAlign: 'center', paddingHorizontal: 32 },

  gpsBadge: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 36, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.93)',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, zIndex: 20,
  },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  gpsText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: colors.ink },
  mapControls: {
    position: 'absolute', top: Platform.OS === 'ios' ? 52 : 32, right: 16,
    gap: 8, zIndex: 20,
  },
  mapBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  compassN: { fontFamily: 'Syne_700Bold', fontSize: 14 },

  // Nav card
  navCard: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    left: 12, right: 12,
    backgroundColor: colors.primary,
    borderRadius: 18, overflow: 'hidden',
    zIndex: 25,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 12,
  },
  navInner: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 12, gap: 10,
  },
  navEmojiWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  navName: { fontFamily: 'Syne_700Bold', fontSize: 14, color: '#fff', marginBottom: 3 },
  navSub: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  navDir: { fontFamily: 'Syne_700Bold', color: '#fff' },
  stepsToggle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  navEnd: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Step panel ──
  stepPanel: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 190 : 170,
    left: 12, right: 12,
    backgroundColor: '#fff',
    borderRadius: 18,
    maxHeight: height * 0.35,
    zIndex: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 10,
  },
  stepCurrent: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14,
    backgroundColor: colors.primaryLight,
    borderBottomWidth: 1, borderBottomColor: '#e0e8fb',
  },
  stepIcon: { fontSize: 26, width: 36, textAlign: 'center' },
  stepInstruction: { fontFamily: 'Syne_700Bold', fontSize: 14, color: colors.ink },
  stepMeta: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 },

  // Progress dots
  stepBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8, gap: 4,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f5',
  },
  stepDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#e0e0e5', flex: 1, maxWidth: 20,
  },
  stepDotDone: { backgroundColor: colors.primary, opacity: 0.4 },
  stepDotActive: { backgroundColor: colors.primary, height: 8, borderRadius: 4 },

  // Steps list
  stepList: { maxHeight: height * 0.22 },
  stepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  stepRowActive: { backgroundColor: '#f0f5ff' },
  stepRowIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  stepRowText: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.ink },
  stepRowTextActive: { fontFamily: 'DMSans_500Medium', color: colors.primary },
  stepRowMeta: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: colors.muted, marginTop: 2 },
  stepDoneCheck: { marginLeft: 4 },

  // Sheet
  sheet: {
    position: 'absolute', left: 0, right: 0,
    bottom: -60,
    backgroundColor: '#f2f2f7',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 16,
    zIndex: 15,
  },
  dragZone: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    backgroundColor: '#f2f2f7', zIndex: 2, paddingBottom: 4,
  },
  handle: {
    width: 36, height: 4, backgroundColor: colors.muted,
    borderRadius: 2, alignSelf: 'center', marginTop: 10, marginBottom: 14,
  },
  sheetHead: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, marginBottom: 12,
  },
  sheetTitle: { fontFamily: 'Syne_800ExtraBold', fontSize: 22, color: colors.ink },
  sheetSub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: colors.muted, marginTop: 2 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.success },
  liveTxt: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.success },

  // UPDATED: Category chips - consistent with ExploreScreen design
  catWrap: { paddingHorizontal: 20, gap: 8, paddingRight: 20 },
  chip: {
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 6,
    backgroundColor: '#fff', 
    borderRadius: 20,
    paddingHorizontal: 16, 
    paddingVertical: 10,
    borderWidth: 1.5, 
    borderColor: '#e5e5ea',
    minHeight: 36,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, 
    shadowRadius: 4, 
    elevation: 2,
  },
  chipOn: { 
    backgroundColor: colors.primary, 
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
  },
  chipLbl: { 
    fontFamily: 'DMSans_500Medium', 
    fontSize: 12, 
    color: colors.ink 
  },
  chipLblOn: { 
    color: 'black' 
  },

  list: { flex: 1, paddingHorizontal: 16, paddingTop: 4 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyTxt: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: colors.muted, textAlign: 'center' },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16,
    padding: 14, marginBottom: 10, gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  cardOn: { borderColor: colors.primary, backgroundColor: '#fafcff' },
  rank: {
    position: 'absolute', top: 8, left: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: '#f2f2f7',
    alignItems: 'center', justifyContent: 'center',
  },
  rankOn: { backgroundColor: colors.primary },
  rankTxt: { fontFamily: 'Syne_700Bold', fontSize: 9, color: colors.muted },
  rankTxtOn: { color: 'ink' },
  cardEmoji: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: '#f2f2f7',
    alignItems: 'center', justifyContent: 'center',
  },
  cardEmojiOn: { backgroundColor: colors.primaryLight },
  cardName: { fontFamily: 'Syne_700Bold', fontSize: 14, color: colors.ink },
  cardType: { fontFamily: 'DMSans_400Regular', fontSize: 11, color: colors.muted, marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardDist: { fontFamily: 'Syne_700Bold', fontSize: 13, color: colors.ink },
  cardDistOn: { color: colors.primary },
  cardTime: { fontFamily: 'DMSans_400Regular', fontSize: 10, color: colors.muted },
  goBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#f2f2f7',
    alignItems: 'center', justifyContent: 'center',
  },
  goBtnOn: { backgroundColor: colors.primary },
  goTxtIcon: {
    fontFamily: 'Syne_700Bold'
  }
});
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const passengerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const dropIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => { map.setView(center, 16); }, [center, map]);
  return null;
};

const MapComponent = ({ drivers = [], activeRide = null, userLocation = null, height = '400px', routePreview = [] }) => {
  const defaultCenter = [29.8668, 77.8963];

  const previewPoints = Array.isArray(routePreview) && routePreview.length > 1
    ? routePreview.map((point) => [point[0], point[1]])
    : [];

  const ridePoints = activeRide
    ? [
        [activeRide.pickupLocation.coordinates.lat, activeRide.pickupLocation.coordinates.lng],
        [activeRide.dropLocation.coordinates.lat, activeRide.dropLocation.coordinates.lng],
      ]
    : [];

  const routePoints = previewPoints.length > 0 ? previewPoints : ridePoints;

  const getCenter = (points, fallback) => {
    if (!points.length) return fallback;
    const totalLat = points.reduce((sum, point) => sum + point[0], 0);
    const totalLng = points.reduce((sum, point) => sum + point[1], 0);
    return [totalLat / points.length, totalLng / points.length];
  };

  const center = getCenter(
    routePoints,
    userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter
  );

  return (
    <MapContainer center={center} zoom={15} style={{ height, width: '100%', borderRadius: '12px' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <RecenterMap center={center} />

      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={passengerIcon}>
          <Popup>Your Location</Popup>
        </Marker>
      )}

      {routePoints.length > 1 && (
        <Polyline
          positions={routePoints}
          pathOptions={{ color: '#2563eb', weight: 6, opacity: 0.8, dashArray: '8 6' }}
        />
      )}

      {routePoints.length > 1 && (
        <>
          <Marker position={routePoints[0]} icon={pickupIcon}>
            <Popup>Pickup</Popup>
          </Marker>
          <Marker position={routePoints[routePoints.length - 1]} icon={dropIcon}>
            <Popup>Drop</Popup>
          </Marker>
        </>
      )}

      {drivers.map((driver) => (
        driver.currentLocation?.coordinates[0] !== 0 && (
          <Marker
            key={driver._id}
            position={[driver.currentLocation.coordinates[1], driver.currentLocation.coordinates[0]]}
            icon={driverIcon}
          >
            <Popup>
              <strong>{driver.name}</strong><br />
              ⭐ {driver.averageRating || 'New'}<br />
              {driver.vehicleInfo?.vehicleType}
            </Popup>
          </Marker>
        )
      ))}

      {activeRide && (
        <>
          <Marker
            position={[activeRide.pickupLocation.coordinates.lat, activeRide.pickupLocation.coordinates.lng]}
            icon={pickupIcon}
          >
            <Popup>Pickup: {activeRide.pickupLocation.name}</Popup>
          </Marker>
          <Marker
            position={[activeRide.dropLocation.coordinates.lat, activeRide.dropLocation.coordinates.lng]}
          >
            <Popup>Drop: {activeRide.dropLocation.name}</Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
};

export default MapComponent;
"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

interface MapProps {
  latitude: number;
  longitude: number;
  label?: string;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function MapComponent({ latitude, longitude, label }: MapProps) {
  const [position, setPosition] = useState<[number, number]>([latitude, longitude]);
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    setPosition([latitude, longitude]);
  }, [latitude, longitude]);

  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          setPosition([newPos.lat, newPos.lng]);
        }
      },
    }),
    [],
  );

  return (
    <div className="w-full h-64 rounded-xl overflow-hidden border border-gray-700 my-4 z-0 relative">
      <MapContainer 
        center={position} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <ChangeView center={position} zoom={15} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker 
          draggable={true}
          eventHandlers={eventHandlers}
          position={position} 
          ref={markerRef}
          icon={icon}
        >
          <Popup>
            <div className="text-sm min-w-[120px]">
              {label && <div className="font-bold mb-1">{label}</div>}
              <div className="text-gray-600 text-xs font-mono">
                Lat: {position[0].toFixed(5)}<br/>
                Lng: {position[1].toFixed(5)}
              </div>
              <div className="text-[10px] text-blue-500 mt-1 italic">Pin is draggable</div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

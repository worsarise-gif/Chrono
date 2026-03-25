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
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent({ latitude, longitude, label }: MapProps) {
  const [position, setPosition] = useState<[number, number]>([latitude, longitude]);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
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
    <div className="w-full h-80 rounded-2xl overflow-hidden border border-gray-800 my-6 z-0 relative shadow-2xl group">
      <div className="absolute top-3 right-3 z-[1000] flex gap-2">
        <button 
          onClick={() => setMapType('street')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${mapType === 'street' ? 'bg-white text-black shadow-lg' : 'bg-black/50 text-white backdrop-blur-md hover:bg-black/70'}`}
        >
          Street
        </button>
        <button 
          onClick={() => setMapType('satellite')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${mapType === 'satellite' ? 'bg-white text-black shadow-lg' : 'bg-black/50 text-white backdrop-blur-md hover:bg-black/70'}`}
        >
          Satellite
        </button>
      </div>

      <MapContainer 
        center={position} 
        zoom={15} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <ChangeView center={position} zoom={15} />
        {mapType === 'street' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
        ) : (
          <TileLayer
            attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}
        <Marker 
          draggable={true}
          eventHandlers={eventHandlers}
          position={position} 
          ref={markerRef}
          icon={icon}
        >
          <Popup className="custom-popup">
            <div className="p-1 min-w-[140px]">
              {label && <div className="font-bold text-sm mb-1 text-gray-900">{label}</div>}
              <div className="text-gray-500 text-[11px] font-mono leading-tight">
                <span className="text-blue-500">LAT</span> {position[0].toFixed(6)}<br/>
                <span className="text-blue-500">LNG</span> {position[1].toFixed(6)}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[10px] text-gray-400 italic">Draggable Pin</span>
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${position[0]},${position[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

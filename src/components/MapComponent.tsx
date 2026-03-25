"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocateFixed, Copy, Check, Navigation } from 'lucide-react';

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
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

export default function MapComponent({ latitude, longitude, label }: MapProps) {
  const [position, setPosition] = useState<[number, number]>([latitude, longitude]);
  const [copied, setCopied] = useState(false);
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

  const handleLocateMe = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => console.error("Error getting location:", err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const handleCopy = useCallback(() => {
    const text = `${position[0].toFixed(6)}, ${position[1].toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [position]);

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden border border-gray-800 my-6 z-0 relative group shadow-2xl">
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
            <div className="text-sm min-w-[160px] font-sans">
              {label && <div className="font-bold text-gray-900 mb-1.5 leading-tight">{label}</div>}
              <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 mb-2">
                <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-0.5">Coordinates</div>
                <div className="text-gray-900 text-xs font-mono font-medium">
                  {position[0].toFixed(6)}, {position[1].toFixed(6)}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-blue-600 font-semibold">
                <Navigation size={10} />
                <span>Pin is draggable to refine location</span>
              </div>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      {/* Floating Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-[400]">
        <button 
          onClick={handleLocateMe}
          className="w-10 h-10 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-lg flex items-center justify-center transition-all active:scale-95 border border-gray-200"
          title="My Location"
        >
          <LocateFixed size={20} />
        </button>
        <button 
          onClick={handleCopy}
          className="w-10 h-10 bg-white hover:bg-gray-50 text-gray-700 rounded-xl shadow-lg flex items-center justify-center transition-all active:scale-95 border border-gray-200"
          title="Copy Coordinates"
        >
          {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
        </button>
      </div>

      {/* Bottom Label Overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-[400] pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[11px] font-medium inline-flex items-center gap-2 border border-white/10 shadow-xl">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span>Refine the marker position by dragging the pin</span>
        </div>
      </div>
    </div>
  );
}

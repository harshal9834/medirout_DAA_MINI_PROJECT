import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GraphNode, GraphRoad } from '../types/graph';
import { Shield, Hospital, Building2, MapPin } from 'lucide-react';

interface GeoLogisticsMapProps {
  nodes: GraphNode[];
  roads: GraphRoad[];
  sourceId: string;
  destinationId: string;
  shortestPath: string[];
  onSelectDestination?: (id: string) => void;
}

export const GeoLogisticsMap: React.FC<GeoLogisticsMapProps> = ({
  nodes,
  roads,
  sourceId,
  destinationId,
  shortestPath,
  onSelectDestination,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on default coordinate (approx SF medical corridor)
    const map = L.map(mapContainerRef.current, {
      center: [37.775, -122.42],
      zoom: 13,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | MediRoute AI',
      maxZoom: 19,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    layersRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers and polylines when nodes, roads, or shortest path change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layers = layersRef.current;
    if (!map || !layers) return;

    layers.clearLayers();

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const shortestEdges = new Set<string>();
    for (let i = 0; i < shortestPath.length - 1; i++) {
      shortestEdges.add(`${shortestPath[i]}->${shortestPath[i + 1]}`);
      shortestEdges.add(`${shortestPath[i + 1]}->${shortestPath[i]}`);
    }

    const boundsLatLngs: L.LatLngTuple[] = [];

    // 1. Draw roads
    roads.forEach(road => {
      const u = nodeMap.get(road.from);
      const v = nodeMap.get(road.to);
      if (!u?.geoCoordinates || !v?.geoCoordinates) return;

      const isShortest =
        shortestEdges.has(`${road.from}->${road.to}`) ||
        shortestEdges.has(`${road.to}->${road.from}`);

      const polyline = L.polyline(
        [
          [u.geoCoordinates.lat, u.geoCoordinates.lng],
          [v.geoCoordinates.lat, v.geoCoordinates.lng],
        ],
        {
          color: isShortest ? '#10b981' : '#64748b',
          weight: isShortest ? 6 : 3,
          opacity: isShortest ? 0.95 : 0.6,
          dashArray: isShortest ? undefined : !road.bidirectional ? '6, 6' : undefined,
        }
      );

      polyline.bindTooltip(`${road.name || 'Road'}: ${road.distance} km`, {
        sticky: true,
        className: 'bg-slate-900 text-white text-xs px-2 py-1 rounded shadow',
      });

      layers.addLayer(polyline);
    });

    // 2. Draw nodes / markers
    nodes.forEach(node => {
      if (!node.geoCoordinates) return;
      boundsLatLngs.push([node.geoCoordinates.lat, node.geoCoordinates.lng]);

      const isSource = node.id === sourceId;
      const isDestination = node.id === destinationId;
      const isOnPath = shortestPath.includes(node.id);

      let pinColor = '#3b82f6'; // blue
      let iconSymbol = '⌂';
      let pinLabel = 'Warehouse';

      if (node.type === 'hospital') {
        pinColor = '#e11d48'; // red/rose
        iconSymbol = '✚';
        pinLabel = 'Hospital';
      } else if (node.type === 'junction') {
        pinColor = '#64748b'; // slate
        iconSymbol = '●';
        pinLabel = 'Junction';
      }

      if (isSource) pinColor = '#2563eb';
      if (isDestination) pinColor = '#059669';

      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            background-color: ${pinColor};
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 3px solid ${isOnPath ? '#34d399' : '#ffffff'};
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: bold;
            font-size: 13px;
          ">
            ${node.id}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([node.geoCoordinates.lat, node.geoCoordinates.lng], {
        icon: customIcon,
      });

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 text-slate-800 text-xs font-sans';
      popupContent.innerHTML = `
        <div style="font-weight: bold; font-size: 14px; margin-bottom: 2px;">${node.name} (${node.id})</div>
        <div style="color: #64748b; margin-bottom: 6px;">${node.type.toUpperCase()} • ${node.description || 'Facility'}</div>
        ${node.beds ? `<div style="margin-bottom: 4px;"><strong>Beds:</strong> ${node.beds} | <strong>Urgency:</strong> ${node.urgency || 'Standard'}</div>` : ''}
        ${node.contactNumber ? `<div style="margin-bottom: 6px; color: #0284c7;">${node.contactNumber}</div>` : ''}
      `;

      if (node.type === 'hospital' && onSelectDestination) {
        const btn = document.createElement('button');
        btn.innerText = 'Set as Destination';
        btn.className =
          'mt-2 w-full py-1 px-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition cursor-pointer';
        btn.onclick = () => {
          onSelectDestination(node.id);
          marker.closePopup();
        };
        popupContent.appendChild(btn);
      }

      marker.bindPopup(popupContent);
      layers.addLayer(marker);
    });

    if (boundsLatLngs.length > 0) {
      map.fitBounds(L.latLngBounds(boundsLatLngs), { padding: [50, 50] });
    }
  }, [nodes, roads, sourceId, destinationId, shortestPath, onSelectDestination]);

  return (
    <div className="relative w-full h-[540px] sm:h-[620px] rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      <div ref={mapContainerRef} className="w-full h-full z-10" />
      <div className="absolute bottom-4 left-4 z-20 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 shadow text-xs font-medium text-slate-700 flex items-center space-x-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>OpenStreetMap Live GIS Grid • Highlighting Dijkstra Route</span>
      </div>
    </div>
  );
};

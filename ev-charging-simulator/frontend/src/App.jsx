// App.js - COMPLETE VERSION WITH SCROLLING FIX
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Battery, Zap, MapPin, Navigation, Clock, Car, AlertCircle, MessageSquare, Send, X, Wifi, Users, Target, ZoomIn, ZoomOut, Move } from 'lucide-react';

// Throttle function to limit how often a function can be called
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Enhanced Map View Component with Performance Optimizations
const MapView = ({ network, userLocation, userNode, recommendations, onLocationSelect, selectedStation }) => {
  const canvasRef = useRef(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [activeRoute, setActiveRoute] = useState(null);
  const [viewState, setViewState] = useState({
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
  });


  // Add scroll prevention - FIXED VERSION
useEffect(() => {
  const handleWheel = (e) => {
    // Only prevent default if we're actually over the canvas
    const canvas = canvasRef.current;
    if (canvas && canvas.contains(e.target)) {
      e.preventDefault();
    }
  };

  // Use capture phase to catch the event early
  document.addEventListener('wheel', handleWheel, { passive: false, capture: true });
  
  return () => {
    document.removeEventListener('wheel', handleWheel, { capture: true });
  };
}, []);

  // Fetch active route when a station is selected
  useEffect(() => {
    if (selectedStation) {
      fetch(`http://localhost:8000/api/active-route/${selectedStation.id}`)
        .then(response => response.json())
        .then(data => {
          setActiveRoute(data);
        })
        .catch(error => {
          console.error('Error fetching active route:', error);
          setActiveRoute(null);
        });
    } else {
      setActiveRoute(null);
    }
  }, [selectedStation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let animationId;
    let isMounted = true;
    let lastRenderTime = 0;
    const FPS = 60;
    const frameInterval = 1000 / FPS;

    const updateCanvasSize = () => {
      if (!isMounted) return;
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    updateCanvasSize();
    const resizeHandler = throttle(updateCanvasSize, 250);
    window.addEventListener('resize', resizeHandler);

    const ctx = canvas.getContext('2d');

    const animate = (currentTime) => {
      if (!isMounted) return;
      
      if (currentTime - lastRenderTime < frameInterval) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      lastRenderTime = currentTime;

      const width = canvas.width;
      const height = canvas.height;

      if (width === 0 || height === 0) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      // Clear canvas efficiently
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Apply zoom and pan transformations
      ctx.save();
      ctx.translate(viewState.offsetX, viewState.offsetY);
      ctx.scale(viewState.scale, viewState.scale);

      // Draw grid - only if scale is appropriate
      if (viewState.scale > 0.3) {
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1 / viewState.scale;
        const gridSize = 40;
        for (let i = -Math.abs(viewState.offsetX); i < width * 2; i += gridSize) {
          ctx.beginPath();
          ctx.moveTo(i, -Math.abs(viewState.offsetY));
          ctx.lineTo(i, height * 2);
          ctx.stroke();
        }
        for (let i = -Math.abs(viewState.offsetY); i < height * 2; i += gridSize) {
          ctx.beginPath();
          ctx.moveTo(-Math.abs(viewState.offsetX), i);
          ctx.lineTo(width * 2, i);
          ctx.stroke();
        }
      }

      // Calculate bounds for all stations
      const stations = network.stations || [];
      if (stations.length === 0) {
        ctx.restore();
        animationId = requestAnimationFrame(animate);
        return;
      }

      const lats = stations.map(s => s.location.lat);
      const lons = stations.map(s => s.location.lon);
      const latRange = [Math.min(...lats), Math.max(...lats)];
      const lonRange = [Math.min(...lons), Math.max(...lons)];
      
      // Add padding to ranges
      const latPadding = (latRange[1] - latRange[0]) * 0.1;
      const lonPadding = (lonRange[1] - lonRange[0]) * 0.1;
      latRange[0] -= latPadding;
      latRange[1] += latPadding;
      lonRange[0] -= lonPadding;
      lonRange[1] += lonPadding;
      
      const toCanvasX = (lon) => ((lon - lonRange[0]) / (lonRange[1] - lonRange[0])) * (width - 100) + 50;
      const toCanvasY = (lat) => height - (((lat - latRange[0]) / (latRange[1] - latRange[0])) * (height - 100) + 50);

      // Draw INACTIVE roads (gray/transparent)
      (network.roads || []).forEach(road => {
        // Skip if this road is part of active route
        if (activeRoute && activeRoute.active_roads) {
          const isActive = activeRoute.active_roads.some(activeRoad => 
            (activeRoad.from === road.from && activeRoad.to === road.to) ||
            (activeRoad.from === road.to && activeRoad.to === road.from)
          );
          if (isActive) return;
        }

        const from = network.stations.find(s => s.id === road.from);
        const to = network.stations.find(s => s.id === road.to);
        
        if (!from || !to) return;

        const x1 = toCanvasX(from.location.lon);
        const y1 = toCanvasY(from.location.lat);
        const x2 = toCanvasX(to.location.lon);
        const y2 = toCanvasY(to.location.lat);

        // INACTIVE ROAD STYLING - Gray and transparent
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2 / viewState.scale;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Draw ACTIVE route roads (green highlighted path)
      if (activeRoute && activeRoute.active_roads) {
        activeRoute.active_roads.forEach(activeRoad => {
          const from = network.stations.find(s => s.id === activeRoad.from);
          const to = network.stations.find(s => s.id === activeRoad.to);
          
          if (!from || !to) return;

          const x1 = toCanvasX(from.location.lon);
          const y1 = toCanvasY(from.location.lat);
          const x2 = toCanvasX(to.location.lon);
          const y2 = toCanvasY(to.location.lat);

          // ACTIVE ROAD STYLING - Green and prominent
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 6 / viewState.scale;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          // Add glow effect for active roads
          ctx.strokeStyle = '#10B981';
          ctx.lineWidth = 12 / viewState.scale;
          ctx.globalAlpha = 0.3;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.globalAlpha = 1;

          // Add animated dots along the active route (only if scale is appropriate)
          if (viewState.scale > 0.5) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const steps = Math.floor(distance / 30);
            
            for (let i = 0; i < steps; i++) {
              const progress = ((Date.now() / 1000) * 0.5 + i * 0.2) % 1;
              const x = x1 + dx * progress;
              const y = y1 + dy * progress;
              
              ctx.fillStyle = '#10B981';
              ctx.globalAlpha = 0.8;
              ctx.beginPath();
              ctx.arc(x, y, 3 / viewState.scale, 0, Math.PI * 2);
              ctx.fill();
              ctx.globalAlpha = 1;
            }
          }
        });
      }

      // Draw normal nodes (small and subtle)
      (network.stations || []).forEach(station => {
        if (!station.isEVStation) {
          const x = toCanvasX(station.location.lon);
          const y = toCanvasY(station.location.lat);
          
          ctx.fillStyle = '#4b5563';
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.arc(x, y, 4 / viewState.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;

          ctx.strokeStyle = '#6b7280';
          ctx.lineWidth = 1 / viewState.scale;
          ctx.beginPath();
          ctx.arc(x, y, 4 / viewState.scale, 0, Math.PI * 2);
          ctx.stroke();

          // Node ID label - only if zoomed in enough
          if (viewState.scale > 0.5) {
            ctx.fillStyle = '#9ca3af';
            ctx.font = `${9 / viewState.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(station.id, x, y + 12 / viewState.scale);
          }
        }
      });

      // Draw EV stations
      (network.stations || []).forEach(station => {
        if (station.isEVStation) {
          const x = toCanvasX(station.location.lon);
          const y = toCanvasY(station.location.lat);
          
          const available = station.availablePoints;
          const total = station.totalPoints;
          const ratio = available / total;

          // Highlight selected station
          const isSelected = selectedStation && selectedStation.id === station.id;

          // Glow effect - enhanced for selected station
          if (viewState.scale > 0.3) {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, isSelected ? 40 / viewState.scale : 25 / viewState.scale);
            if (isSelected) {
              gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
              gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
            } else if (ratio > 0.6) {
              gradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
              gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
            } else if (ratio > 0.3) {
              gradient.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
              gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
            } else {
              gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
              gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(x - (isSelected ? 40 : 25) / viewState.scale, y - (isSelected ? 40 : 25) / viewState.scale, 
                        (isSelected ? 80 : 50) / viewState.scale, (isSelected ? 80 : 50) / viewState.scale);
          }

          // Station circle
          ctx.fillStyle = isSelected ? '#3b82f6' : 
                         ratio > 0.6 ? '#10b981' : 
                         ratio > 0.3 ? '#f59e0b' : '#ef4444';
          ctx.beginPath();
          ctx.arc(x, y, isSelected ? 16 / viewState.scale : 12 / viewState.scale, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = isSelected ? 3 / viewState.scale : 2 / viewState.scale;
          ctx.stroke();

          // Charging icon
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${isSelected ? 16 : 14 / viewState.scale}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', x, y);

          // Station name - only if zoomed in enough
          if (viewState.scale > 0.5) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${isSelected ? 12 : 10 / viewState.scale}px Arial`;
            const shortName = station.name.split(' ')[0];
            ctx.fillText(shortName, x, y + (isSelected ? 25 : 20) / viewState.scale);
            
            ctx.font = `${isSelected ? 10 : 9 / viewState.scale}px Arial`;
            ctx.fillText(`${available}/${total}`, x, y + (isSelected ? 38 : 32) / viewState.scale);
          }
        }
      });

      // Draw user location
      const userStation = network.stations.find(s => s.id === userNode);
      if (userStation) {
        const userX = toCanvasX(userStation.location.lon);
        const userY = toCanvasY(userStation.location.lat);
        
        const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
        const userGradient = ctx.createRadialGradient(userX, userY, 0, userX, userY, 25 * pulse / viewState.scale);
        userGradient.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
        userGradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
        
        ctx.fillStyle = userGradient;
        ctx.fillRect(userX - 25 / viewState.scale, userY - 25 / viewState.scale, 50 / viewState.scale, 50 / viewState.scale);

        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(userX, userY, 8 / viewState.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / viewState.scale;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${12 / viewState.scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📍', userX, userY);
      }

      ctx.restore();
      
      if (isMounted) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      isMounted = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', resizeHandler);
    };
  }, [network, userLocation, userNode, viewState, activeRoute, selectedStation]);

  // Mouse event handlers for panning
  const handleMouseDown = (event) => {
    if (event.button === 0) {
      setViewState(prev => ({
        ...prev,
        isDragging: true,
        lastMouseX: event.clientX,
        lastMouseY: event.clientY
      }));
    }
  };

  const handleMouseMove = useCallback(throttle((event) => {
    if (viewState.isDragging) {
      const deltaX = event.clientX - viewState.lastMouseX;
      const deltaY = event.clientY - viewState.lastMouseY;
      
      setViewState(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY,
        lastMouseX: event.clientX,
        lastMouseY: event.clientY
      }));
    }
  }, 16), [viewState.isDragging, viewState.lastMouseX, viewState.lastMouseY]);

  const handleMouseUp = () => {
    setViewState(prev => ({ ...prev, isDragging: false }));
  };

  // Wheel handler for zooming with scroll prevention
  const handleWheel = useCallback(throttle((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const worldX = (mouseX - viewState.offsetX) / viewState.scale;
    const worldY = (mouseY - viewState.offsetY) / viewState.scale;
    
    const zoomFactor = 0.1;
    const newScale = event.deltaY < 0 
      ? viewState.scale * (1 + zoomFactor) 
      : viewState.scale * (1 - zoomFactor);
    
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    
    const newOffsetX = mouseX - worldX * clampedScale;
    const newOffsetY = mouseY - worldY * clampedScale;
    
    setViewState(prev => ({
      ...prev,
      scale: clampedScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    }));
  }, 16), [viewState]);

  // Zoom controls
  const zoomIn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const worldX = (centerX - viewState.offsetX) / viewState.scale;
    const worldY = (centerY - viewState.offsetY) / viewState.scale;
    
    const newScale = Math.min(5, viewState.scale * 1.2);
    
    const newOffsetX = centerX - worldX * newScale;
    const newOffsetY = centerY - worldY * newScale;
    
    setViewState(prev => ({
      ...prev,
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    }));
  };

  const zoomOut = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const worldX = (centerX - viewState.offsetX) / viewState.scale;
    const worldY = (centerY - viewState.offsetY) / viewState.scale;
    
    const newScale = Math.max(0.1, viewState.scale * 0.8);
    
    const newOffsetX = centerX - worldX * newScale;
    const newOffsetY = centerY - worldY * newScale;
    
    setViewState(prev => ({
      ...prev,
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    }));
  };

  const resetView = () => {
    setViewState({
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0
    });
  };

  const handleCanvasClick = (e) => {
    if (!isSelectingLocation) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const x = (e.clientX - rect.left - viewState.offsetX) / viewState.scale;
    const y = (e.clientY - rect.top - viewState.offsetY) / viewState.scale;

    const stations = network.stations || [];
    const lats = stations.map(s => s.location.lat);
    const lons = stations.map(s => s.location.lon);
    const latRange = [Math.min(...lats), Math.max(...lats)];
    const lonRange = [Math.min(...lons), Math.max(...lons)];
    
    const width = canvas.width;
    const height = canvas.height;
    
    const toMapLon = (canvasX) => ((canvasX - 50) / (width - 100)) * (lonRange[1] - lonRange[0]) + lonRange[0];
    const toMapLat = (canvasY) => latRange[1] - ((canvasY - 50) / (height - 100)) * (latRange[1] - latRange[0]);
    
    const clickedLon = toMapLon(x);
    const clickedLat = toMapLat(y);

    let closestNode = null;
    let minDistance = Infinity;

    network.stations?.forEach(station => {
      const distance = Math.sqrt(
        Math.pow(station.location.lat - clickedLat, 2) + 
        Math.pow(station.location.lon - clickedLon, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestNode = station;
      }
    });

    if (closestNode && minDistance < 0.005) {
      onLocationSelect(closestNode.id);
      setIsSelectingLocation(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden" style={{ touchAction: 'none' }}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full cursor-grab"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ 
          cursor: viewState.isDragging ? 'grabbing' : (isSelectingLocation ? 'crosshair' : 'grab'),
          touchAction: 'none'
        }}
      />
      
      {/* Active Route Info */}
      {activeRoute && (
        <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm text-white px-4 py-3 rounded-lg border border-green-500/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-bold text-green-400">Active Route to {selectedStation?.name}</span>
          </div>
          <div className="text-xs space-y-1">
            <div>Distance: {activeRoute.total_distance?.toFixed(1)} km</div>
            <div>Time: ~{Math.ceil(activeRoute.total_time)} min</div>
            <div>Path: {activeRoute.path?.join(' → ')}</div>
          </div>
        </div>
      )}
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-black/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-gray-800">
        <button
          onClick={() => setIsSelectingLocation(!isSelectingLocation)}
          className={`flex items-center gap-2 text-sm transition ${
            isSelectingLocation ? 'text-yellow-400' : 'text-white'
          }`}
        >
          <Target className="w-4 h-4" />
          {isSelectingLocation ? 'Selecting Location...' : 'Set Location'}
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="bg-black/90 hover:bg-gray-900 text-white p-2 rounded-lg border border-gray-800 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={zoomOut}
          className="bg-black/90 hover:bg-gray-900 text-white p-2 rounded-lg border border-gray-800 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={resetView}
          className="bg-black/90 hover:bg-gray-900 text-white p-2 rounded-lg border border-gray-800 transition"
          title="Reset View"
        >
          <Move className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-gray-800">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>EV Station</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
            <span>Road Node</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            <span>Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-green-500 rounded-full"></div>
            <span>Active Route</span>
          </div>
        </div>
      </div>

      {/* Zoom Level Display */}
      <div className="absolute top-16 left-4 bg-black/90 text-white px-3 py-1 rounded-lg text-sm border border-gray-800">
        Zoom: {Math.round(viewState.scale * 100)}%
      </div>

      {isSelectingLocation && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-lg p-4 text-yellow-100 text-sm backdrop-blur-sm">
            Click on any node to set as your current location
          </div>
        </div>
      )}
    </div>
  );
};

// Optimized Graph Visualization Component
const GraphVisualization = ({ network, userLocation, userNode, recommendations }) => {
  const canvasRef = useRef(null);
  const [viewState, setViewState] = useState({
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
  });

 // Add scroll prevention - FIXED VERSION
useEffect(() => {
  const handleWheel = (e) => {
    // Only prevent default if we're actually over the canvas
    const canvas = canvasRef.current;
    if (canvas && canvas.contains(e.target)) {
      e.preventDefault();
    }
  };

  // Use capture phase to catch the event early
  document.addEventListener('wheel', handleWheel, { passive: false, capture: true });
  
  return () => {
    document.removeEventListener('wheel', handleWheel, { capture: true });
  };
}, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    let animationId;
    let isMounted = true;
    let lastRenderTime = 0;
    const FPS = 60;
    const frameInterval = 1000 / FPS;

    const updateCanvasSize = () => {
      if (!isMounted) return;
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    updateCanvasSize();
    const resizeHandler = throttle(updateCanvasSize, 250);
    window.addEventListener('resize', resizeHandler);

    const ctx = canvas.getContext('2d');

    const animate = (currentTime) => {
      if (!isMounted) return;
      
      if (currentTime - lastRenderTime < frameInterval) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      lastRenderTime = currentTime;

      const width = canvas.width;
      const height = canvas.height;

      if (width === 0 || height === 0) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      // Clear canvas efficiently
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Apply transformations
      ctx.save();
      ctx.translate(viewState.offsetX, viewState.offsetY);
      ctx.scale(viewState.scale, viewState.scale);

      const stations = network.stations || [];
      if (stations.length === 0) {
        ctx.restore();
        animationId = requestAnimationFrame(animate);
        return;
      }

      // Calculate path scores for optimal path coloring
      const pathScores = {};
      if (recommendations && recommendations.length > 0) {
        recommendations.forEach((rec, index) => {
          const score = rec.score;
          const stationId = rec.station.id;
          pathScores[stationId] = {
            score: score,
            rank: index,
            color: index === 0 ? '#10b981' : 
                   index === 1 ? '#22c55e' :
                   index === 2 ? '#f59e0b' :
                   index === 3 ? '#ef4444' : '#6b7280'
          };
        });
      }

      // Use force-directed layout
      const positions = {};
      const angleStep = (Math.PI * 2) / stations.length;
      const radius = Math.min(width, height) * 0.35;
      const centerX = width / 2;
      const centerY = height / 2;

      stations.forEach((station, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const stationRadius = radius * (0.8 + Math.random() * 0.4);
        positions[station.id] = {
          x: centerX + Math.cos(angle) * stationRadius,
          y: centerY + Math.sin(angle) * stationRadius
        };
      });

      // Draw roads with optimal path coloring - TRANSPARENT NORMAL ROADS
      (network.roads || []).forEach(road => {
        const from = positions[road.from];
        const to = positions[road.to];
        
        if (!from || !to) return;

        let isOptimalPath = false;
        let pathColor = 'transparent'; // Transparent for normal roads
        
        if (pathScores[road.from] || pathScores[road.to]) {
          const fromScore = pathScores[road.from]?.score || 0;
          const toScore = pathScores[road.to]?.score || 0;
          const maxScore = Math.max(fromScore, toScore);
          
          if (maxScore > 0.2) {
            isOptimalPath = true;
            if (maxScore > 0.8) pathColor = '#10b981';
            else if (maxScore > 0.6) pathColor = '#22c55e';
            else if (maxScore > 0.4) pathColor = '#f59e0b';
            else if (maxScore > 0.2) pathColor = '#ef4444';
          }
        }

        const traffic = road.trafficLevel;
        let finalColor = pathColor;
        
        if (traffic > 2.0) {
          finalColor = '#ef4444';
        } else if (traffic > 1.5 && !isOptimalPath) {
          finalColor = '#f59e0b';
        }

        // Skip drawing if it's a transparent normal road
        if (finalColor === 'transparent') return;

        ctx.strokeStyle = finalColor;
        ctx.lineWidth = Math.max(1, 6 / traffic) / viewState.scale;
        ctx.globalAlpha = 0.8;
        
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Add animated particles only for optimal paths
        if (isOptimalPath && viewState.scale > 0.5) {
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const steps = Math.max(3, Math.floor(distance / 40));
          
          for (let i = 0; i < steps; i++) {
            const t = ((Date.now() / 1000 + i / steps) % 1);
            const x = from.x + dx * t;
            const y = from.y + dy * t;
            
            ctx.fillStyle = pathColor;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(x, y, 2 / viewState.scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      });

      // Draw stations
      stations.forEach(station => {
        const pos = positions[station.id];
        
        if (station.isEVStation) {
          const available = station.availablePoints;
          const total = station.totalPoints;
          const ratio = available / total;

          const pathInfo = pathScores[station.id];
          const isRecommended = !!pathInfo;

          // EV Station glow
          if (viewState.scale > 0.3) {
            const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 35 / viewState.scale);
            if (isRecommended) {
              gradient.addColorStop(0, `${pathInfo.color}80`);
              gradient.addColorStop(1, `${pathInfo.color}00`);
            } else if (ratio > 0.6) {
              gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
              gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
            } else if (ratio > 0.3) {
              gradient.addColorStop(0, 'rgba(245, 158, 11, 0.5)');
              gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
            } else {
              gradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
              gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
            }
            
            ctx.fillStyle = gradient;
            ctx.fillRect(pos.x - 35 / viewState.scale, pos.y - 35 / viewState.scale, 70 / viewState.scale, 70 / viewState.scale);
          }

          // EV Station circle
          ctx.fillStyle = isRecommended ? pathInfo.color : 
                         ratio > 0.6 ? '#10b981' : 
                         ratio > 0.3 ? '#f59e0b' : '#ef4444';
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 18 / viewState.scale, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3 / viewState.scale;
          ctx.stroke();

          // Charging icon
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${14 / viewState.scale}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', pos.x, pos.y);

          // Station info
          if (viewState.scale > 0.5) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${10 / viewState.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(`${available}/${total}`, pos.x, pos.y + 15 / viewState.scale);
          }

          // Recommendation badge
          if (isRecommended && viewState.scale > 0.5) {
            ctx.fillStyle = pathInfo.color;
            ctx.beginPath();
            ctx.arc(pos.x + 15 / viewState.scale, pos.y - 15 / viewState.scale, 8 / viewState.scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${7 / viewState.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${pathInfo.rank + 1}`, pos.x + 15 / viewState.scale, pos.y - 15 / viewState.scale);
          }
        } else {
          // Normal node
          ctx.fillStyle = '#4b5563';
          ctx.globalAlpha = 0.7;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 8 / viewState.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;

          ctx.strokeStyle = '#6b7280';
          ctx.lineWidth = 1.5 / viewState.scale;
          ctx.stroke();

          if (viewState.scale > 0.8) {
            ctx.fillStyle = '#9ca3af';
            ctx.font = `bold ${9 / viewState.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(station.id, pos.x, pos.y);
          }
        }
      });

      // Draw user location
      if (positions[userNode]) {
        const pos = positions[userNode];
        
        const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
        const userGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 25 * pulse / viewState.scale);
        userGradient.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
        userGradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
        
        ctx.fillStyle = userGradient;
        ctx.fillRect(pos.x - 25 / viewState.scale, pos.y - 25 / viewState.scale, 50 / viewState.scale, 50 / viewState.scale);

        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 10 / viewState.scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 / viewState.scale;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${12 / viewState.scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('📍', pos.x, pos.y);
      }

      ctx.restore();
      
      if (isMounted) {
        animationId = requestAnimationFrame(animate);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      isMounted = false;
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', resizeHandler);
    };
  }, [network, userLocation, userNode, recommendations, viewState]);

  // Mouse event handlers
  const handleMouseDown = (event) => {
    if (event.button === 0) {
      setViewState(prev => ({
        ...prev,
        isDragging: true,
        lastMouseX: event.clientX,
        lastMouseY: event.clientY
      }));
    }
  };

  const handleMouseMove = useCallback(throttle((event) => {
    if (viewState.isDragging) {
      const deltaX = event.clientX - viewState.lastMouseX;
      const deltaY = event.clientY - viewState.lastMouseY;
      
      setViewState(prev => ({
        ...prev,
        offsetX: prev.offsetX + deltaX,
        offsetY: prev.offsetY + deltaY,
        lastMouseX: event.clientX,
        lastMouseY: event.clientY
      }));
    }
  }, 16), [viewState.isDragging, viewState.lastMouseX, viewState.lastMouseY]);

  const handleMouseUp = () => {
    setViewState(prev => ({ ...prev, isDragging: false }));
  };

  // Wheel handler for zooming with scroll prevention
  const handleWheel = useCallback(throttle((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const worldX = (mouseX - viewState.offsetX) / viewState.scale;
    const worldY = (mouseY - viewState.offsetY) / viewState.scale;
    
    const zoomFactor = 0.1;
    const newScale = event.deltaY < 0 
      ? viewState.scale * (1 + zoomFactor) 
      : viewState.scale * (1 - zoomFactor);
    
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    
    const newOffsetX = mouseX - worldX * clampedScale;
    const newOffsetY = mouseY - worldY * clampedScale;
    
    setViewState(prev => ({
      ...prev,
      scale: clampedScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    }));
  }, 16), [viewState]);

  const zoomIn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const worldX = (centerX - viewState.offsetX) / viewState.scale;
    const worldY = (centerY - viewState.offsetY) / viewState.scale;
    
    const newScale = Math.min(5, viewState.scale * 1.2);
    
    const newOffsetX = centerX - worldX * newScale;
    const newOffsetY = centerY - worldY * newScale;
    
    setViewState(prev => ({
      ...prev,
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    }));
  };

  const zoomOut = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const worldX = (centerX - viewState.offsetX) / viewState.scale;
    const worldY = (centerY - viewState.offsetY) / viewState.scale;
    
    const newScale = Math.max(0.1, viewState.scale * 0.8);
    
    const newOffsetX = centerX - worldX * newScale;
    const newOffsetY = centerY - worldY * newScale;
    
    setViewState(prev => ({
      ...prev,
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    }));
  };

  const resetView = () => {
    setViewState({
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0
    });
  };

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden" style={{ touchAction: 'none' }}>
      <canvas 
        ref={canvasRef} 
        className="w-full h-full cursor-grab"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ 
          cursor: viewState.isDragging ? 'grabbing' : 'grab',
          touchAction: 'none'
        }}
      />
      
      {/* Graph Info */}
      <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-gray-800">
        <div className="text-xs space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-green-500"></div>
            <span>Optimal Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-lime-500"></div>
            <span>Good Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-yellow-500"></div>
            <span>Average Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-red-500"></div>
            <span>Poor Path</span>
          </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={zoomIn}
          className="bg-black/90 hover:bg-gray-900 text-white p-2 rounded-lg border border-gray-800 transition"
          title="Zoom In"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={zoomOut}
          className="bg-black/90 hover:bg-gray-900 text-white p-2 rounded-lg border border-gray-800 transition"
          title="Zoom Out"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={resetView}
          className="bg-black/90 hover:bg-gray-900 text-white p-2 rounded-lg border border-gray-800 transition"
          title="Reset View"
        >
          <Move className="w-5 h-5" />
        </button>
      </div>

      {/* Zoom Level Display */}
      <div className="absolute bottom-4 left-4 bg-black/90 text-white px-3 py-1 rounded-lg text-sm border border-gray-800">
        Zoom: {Math.round(viewState.scale * 100)}%
      </div>
    </div>
  );
};

// AI Chat Component
const AIChat = ({ isOpen, onClose, chatMessages, userInput, setUserInput, onSend }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <div className="pointer-events-auto w-96 h-[500px] bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-2xl border border-cyan-500/30 overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-cyan-700 to-blue-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">AI Assistant</h3>
              <div className="flex items-center gap-1 text-xs text-cyan-100">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Online</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-2xl px-4 py-3 max-w-xs ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-br from-cyan-600 to-blue-600 text-white' 
                  : 'bg-gray-800 text-gray-100 border border-gray-700'
              }`}>
                <p className="text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-gray-800 p-3 flex gap-2 bg-gray-900">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSend()}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={onSend}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-4 py-2 rounded-xl hover:from-cyan-700 hover:to-blue-700 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Component with Performance Optimizations
const EVChargingApp = () => {
  const [network, setNetwork] = useState({ stations: [], roads: [], vehicles: [] });
  const [currentView, setCurrentView] = useState('map');
  const [userLocation, setUserLocation] = useState({ lat: 21.1500, lon: 79.1000 });
  const [userNode, setUserNode] = useState('S1');
  const [userBattery, setUserBattery] = useState(65);
  const [recommendations, setRecommendations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hello! I\'m your EV charging assistant. I can help you find the best charging station based on your current location and battery level. How can I help you today?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [ws, setWs] = useState(null);

  // Optimized WebSocket connection with throttling
  useEffect(() => {
    const throttledSetNetwork = throttle((data) => {
      setNetwork(prev => {
        if (JSON.stringify(prev) === JSON.stringify(data)) {
          return prev;
        }
        return data;
      });
    }, 100);

    const throttledSetRecommendations = throttle((data) => {
      setRecommendations(prev => {
        if (JSON.stringify(prev) === JSON.stringify(data.recommendations)) {
          return prev;
        }
        return data.recommendations;
      });
    }, 100);

    const websocket = new WebSocket('ws://localhost:8000/ws');
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'simulation_update') {
          setUserBattery(data.batteryLevel);
          setUserLocation(data.userLocation);
          setUserNode(data.userNode);
          throttledSetNetwork(data.network);
          throttledSetRecommendations(data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      websocket.close();
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [networkResponse, recommendationsResponse] = await Promise.all([
          fetch('http://localhost:8000/api/network'),
          fetch('http://localhost:8000/api/recommendations')
        ]);

        const [networkData, recommendationsData] = await Promise.all([
          networkResponse.json(),
          recommendationsResponse.json()
        ]);

        setNetwork(networkData);
        setRecommendations(recommendationsData.recommendations);
        setUserLocation(recommendationsData.userLocation);
        setUserNode(recommendationsData.userNode);
        setUserBattery(recommendationsData.batteryLevel);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, []);

  const handleLocationSelect = async (nodeId) => {
    try {
      const response = await fetch('http://localhost:8000/api/set-location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ node_id: nodeId }),
      });
      
      const result = await response.json();
      if (result.success) {
        setUserLocation(result.location);
        setUserNode(result.node);
      } else {
        console.error('Failed to set location:', result.message);
      }
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const handleStationSelect = (station) => {
    setSelectedStation(station);
  };

  const handleClearRoute = () => {
    setSelectedStation(null);
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    const newMessages = [...chatMessages, { role: 'user', text: userInput }];
    setChatMessages(newMessages);
    setUserInput('');
    
    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userInput }),
      });
      
      const data = await response.json();
      setChatMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        text: 'Sorry, I encountered an error. Please try again.' 
      }]);
    }
  };

  const getTrafficColor = (traffic) => {
    if (traffic < 1.5) return 'text-green-400';
    if (traffic < 2.0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getBatteryColor = (battery) => {
    if (battery > 50) return 'from-green-600 to-green-700';
    if (battery > 20) return 'from-yellow-600 to-yellow-700';
    return 'from-red-600 to-red-700';
  };

  // Calculate network statistics
  const evStations = network.stations?.filter(s => s.isEVStation) || [];
  const normalNodes = network.stations?.filter(s => !s.isEVStation) || [];
  const activeVehicles = network.vehicles?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black overflow-auto">
      <div className="container mx-auto p-4">
        <div className="bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-cyan-500/20">
          <div className="bg-gradient-to-r from-cyan-700 via-blue-800 to-indigo-800 p-6 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                  <Zap className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Smart EV Network</h1>
                  <p className="text-cyan-200">AI-Powered Charging Solutions</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentView('map')}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${
                    currentView === 'map' 
                      ? 'bg-white text-blue-700 font-bold' 
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                  Map View
                </button>
                <button
                  onClick={() => setCurrentView('graph')}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${
                    currentView === 'graph' 
                      ? 'bg-white text-blue-700 font-bold' 
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  <Zap className="w-5 h-5" />
                  Graph View
                </button>
              </div>
            </div>
          </div>

          {/* Clear Route Button */}
          {selectedStation && (
            <div className="absolute top-24 right-6 z-10">
              <button
                onClick={handleClearRoute}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg"
              >
                <X className="w-4 h-4" />
                Clear Route
              </button>
            </div>
          )}

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 p-6 bg-gradient-to-br from-gray-900 to-gray-800">
            {/* Sidebar */}
            <div className="xl:col-span-1 space-y-4">
              <div className={`bg-gradient-to-br ${getBatteryColor(userBattery)} rounded-2xl p-6 text-white shadow-xl border border-gray-700`}>
                <div className="flex items-center gap-2 mb-4">
                  <Car className="w-6 h-6" />
                  <h2 className="text-xl font-bold">Your Vehicle</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Battery Level</span>
                      <span className="text-3xl font-bold">{userBattery}%</span>
                    </div>
                    <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${userBattery}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Battery className="w-4 h-4" />
                        <span>~{(userBattery * 3.5).toFixed(0)} km</span>
                      </div>
                      <span className="text-xs opacity-90">-1% per minute</span>
                    </div>
                  </div>

                  {userBattery < 20 && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-start gap-2 animate-pulse border border-red-400/30">
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-bold">Low Battery!</div>
                        <div className="text-xs opacity-90">Please charge soon</div>
                      </div>
                    </div>
                  )}

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="font-semibold">Current Location</span>
                    </div>
                    <div className="text-xs opacity-90 font-mono">
                      {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
                    </div>
                    <div className="text-xs text-cyan-300 mt-1">
                      Current Node: {userNode}
                    </div>
                    <div className="text-xs text-cyan-300">
                      Click "Set Location" on map to change
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-5 border border-gray-600 shadow-xl">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  Network Stats
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center text-gray-300">
                    <span>EV Stations</span>
                    <span className="font-bold text-cyan-400">{evStations.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Road Nodes</span>
                    <span className="font-bold text-cyan-400">{normalNodes.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Active Roads</span>
                    <span className="font-bold text-cyan-400">{network.roads?.length || 0}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Active Vehicles</span>
                    <span className="font-bold text-cyan-400">{activeVehicles}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-300">
                    <span>Total Chargers</span>
                    <span className="font-bold text-cyan-400">
                      {evStations.reduce((sum, s) => sum + s.totalPoints, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="xl:col-span-4 space-y-4">
              {/* Map/Graph View */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-1 border border-gray-700 h-[70vh] min-h-[600px] overflow-hidden">
                {currentView === 'map' ? (
                  <MapView 
                    network={network} 
                    userLocation={userLocation}
                    userNode={userNode}
                    recommendations={recommendations}
                    onLocationSelect={handleLocationSelect}
                    selectedStation={selectedStation}
                  />
                ) : (
                  <GraphVisualization 
                    network={network} 
                    userLocation={userLocation}
                    userNode={userNode}
                    recommendations={recommendations}
                  />
                )}
              </div>

              {/* AI Recommendations */}
              <div className="bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 backdrop-blur-sm rounded-2xl p-4 border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Navigation className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-xl font-bold text-white">AI Recommendations</h2>
                  {selectedStation && (
                    <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full ml-2">
                      Navigating to: {selectedStation.name}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {recommendations.slice(0, 4).map((rec, idx) => {
                    const isTop = idx === 0;
                    const isSelected = selectedStation && selectedStation.id === rec.station.id;
                    
                    return (
                      <div
                        key={rec.station.id}
                        onClick={() => handleStationSelect(rec.station)}
                        className={`bg-gray-800/80 backdrop-blur-sm rounded-xl border-2 ${
                          isSelected 
                            ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
                            : isTop 
                            ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' 
                            : 'border-gray-700'
                        } p-4 hover:border-cyan-500 transition cursor-pointer`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-white">
                                {rec.station.name}
                              </h3>
                              {isSelected && (
                                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                                  SELECTED
                                </span>
                              )}
                              {isTop && !isSelected && (
                                <span className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                                  BEST
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {rec.details.distance.toFixed(1)} km
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                ~{Math.ceil(rec.details.travelTime)} min
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-3xl font-bold ${
                              isSelected ? 'text-blue-400' : 'text-emerald-400'
                            }`}>
                              {(rec.score * 100).toFixed(0)}
                            </div>
                            <div className="text-xs text-gray-400">AI Score</div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-2">
                            <div className="text-xs text-gray-400 mb-1">Available</div>
                            <div className="text-xl font-bold text-blue-400">
                              {rec.details.available}/{rec.details.total}
                            </div>
                          </div>
                          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-2">
                            <div className="text-xs text-gray-400 mb-1">Traffic</div>
                            <div className={`text-xl font-bold ${getTrafficColor(rec.details.trafficLevel)}`}>
                              {rec.details.trafficLevel < 1.5 ? 'Low' : rec.details.trafficLevel < 2.0 ? 'Med' : 'High'}
                            </div>
                          </div>
                          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-2">
                            <div className="text-xs text-gray-400 mb-1">Wait</div>
                            <div className="text-xl font-bold text-cyan-400">
                              {Math.ceil(rec.details.predictedWaitTime)}m
                            </div>
                          </div>
                        </div>

                        {/* Navigation Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStationSelect(rec.station);
                          }}
                          className={`w-full mt-3 py-2 rounded-lg font-bold transition ${
                            isSelected
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {isSelected ? '✓ Route Active' : 'Navigate Here'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => setChatOpen(!chatOpen)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-full shadow-2xl hover:scale-110 transition flex items-center justify-center z-40 animate-pulse border border-cyan-400/30"
      >
        <MessageSquare className="w-8 h-8" />
      </button>

      <AIChat 
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        chatMessages={chatMessages}
        userInput={userInput}
        setUserInput={setUserInput}
        onSend={handleSendMessage}
      />
    </div>
  );
};

export default EVChargingApp;
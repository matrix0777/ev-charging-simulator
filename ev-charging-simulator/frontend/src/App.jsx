
// // App.js - UPDATED FOR NEW BACKEND
// import React, { useState, useEffect, useRef } from 'react';
// import { Battery, Zap, MapPin, Navigation, Clock, Car, AlertCircle, MessageSquare, Send, X, Wifi, Users, Target, ZoomIn, ZoomOut, Move } from 'lucide-react';

// // Enhanced Map View Component with Zoom/Pan
// const MapView = ({ network, userLocation, userNode, recommendations, onLocationSelect }) => {
//   const canvasRef = useRef(null);
//   const [isSelectingLocation, setIsSelectingLocation] = useState(false);
//   const [viewState, setViewState] = useState({
//     scale: 1.0,
//     offsetX: 0,
//     offsetY: 0,
//     isDragging: false,
//     lastMouseX: 0,
//     lastMouseY: 0
//   });

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
    
//     const updateCanvasSize = () => {
//       const container = canvas.parentElement;
//       canvas.width = container.clientWidth;
//       canvas.height = container.clientHeight;
//     };

//     updateCanvasSize();
//     window.addEventListener('resize', updateCanvasSize);

//     const ctx = canvas.getContext('2d');

//     const animate = () => {
//       const width = canvas.width;
//       const height = canvas.height;

//       // Clear canvas with transformations
//       ctx.save();
//       ctx.setTransform(1, 0, 0, 1, 0, 0);
//       ctx.fillStyle = '#0f172a';
//       ctx.fillRect(0, 0, width, height);
//       ctx.restore();

//       // Apply zoom and pan transformations
//       ctx.save();
//       ctx.translate(viewState.offsetX, viewState.offsetY);
//       ctx.scale(viewState.scale, viewState.scale);

//       // Draw grid
//       ctx.strokeStyle = '#1e293b';
//       ctx.lineWidth = 1 / viewState.scale;
//       const gridSize = 40;
//       for (let i = -Math.abs(viewState.offsetX); i < width * 2; i += gridSize) {
//         ctx.beginPath();
//         ctx.moveTo(i, -Math.abs(viewState.offsetY));
//         ctx.lineTo(i, height * 2);
//         ctx.stroke();
//       }
//       for (let i = -Math.abs(viewState.offsetY); i < height * 2; i += gridSize) {
//         ctx.beginPath();
//         ctx.moveTo(-Math.abs(viewState.offsetX), i);
//         ctx.lineTo(width * 2, i);
//         ctx.stroke();
//       }

//       // Calculate bounds for all stations
//       const stations = network.stations || [];
//       if (stations.length === 0) {
//         ctx.restore();
//         requestAnimationFrame(animate);
//         return;
//       }

//       const lats = stations.map(s => s.location.lat);
//       const lons = stations.map(s => s.location.lon);
//       const latRange = [Math.min(...lats), Math.max(...lats)];
//       const lonRange = [Math.min(...lons), Math.max(...lons)];
      
//       // Add padding to ranges
//       const latPadding = (latRange[1] - latRange[0]) * 0.1;
//       const lonPadding = (lonRange[1] - lonRange[0]) * 0.1;
//       latRange[0] -= latPadding;
//       latRange[1] += latPadding;
//       lonRange[0] -= lonPadding;
//       lonRange[1] += lonPadding;
      
//       const toCanvasX = (lon) => ((lon - lonRange[0]) / (lonRange[1] - lonRange[0])) * (width - 100) + 50;
//       const toCanvasY = (lat) => height - (((lat - latRange[0]) / (latRange[1] - latRange[0])) * (height - 100) + 50);

//       // Draw roads
//       (network.roads || []).forEach(road => {
//         const from = network.stations.find(s => s.id === road.from);
//         const to = network.stations.find(s => s.id === road.to);
        
//         if (!from || !to) return;

//         const x1 = toCanvasX(from.location.lon);
//         const y1 = toCanvasY(from.location.lat);
//         const x2 = toCanvasX(to.location.lon);
//         const y2 = toCanvasY(to.location.lat);

//         const traffic = road.trafficLevel;
//         let color = '#10b981';
//         if (traffic > 2.0) color = '#ef4444';
//         else if (traffic > 1.5) color = '#f59e0b';

//         ctx.strokeStyle = color;
//         ctx.lineWidth = Math.max(1, 4 / traffic) / viewState.scale;
//         ctx.globalAlpha = 0.7;
//         ctx.beginPath();
//         ctx.moveTo(x1, y1);
//         ctx.lineTo(x2, y2);
//         ctx.stroke();
//         ctx.globalAlpha = 1;
//       });

//       // Draw normal nodes (small and subtle) with clear labels
//       (network.stations || []).forEach(station => {
//         if (!station.isEVStation) {
//           const x = toCanvasX(station.location.lon);
//           const y = toCanvasY(station.location.lat);
          
//           ctx.fillStyle = '#64748b';
//           ctx.globalAlpha = 0.6;
//           ctx.beginPath();
//           ctx.arc(x, y, 4 / viewState.scale, 0, Math.PI * 2);
//           ctx.fill();
//           ctx.globalAlpha = 1;

//           ctx.strokeStyle = '#94a3b8';
//           ctx.lineWidth = 1 / viewState.scale;
//           ctx.beginPath();
//           ctx.arc(x, y, 4 / viewState.scale, 0, Math.PI * 2);
//           ctx.stroke();

//           // Node ID label (only show when zoomed in)
//           if (viewState.scale > 0.5) {
//             ctx.fillStyle = '#cbd5e1';
//             ctx.font = `${9 / viewState.scale}px Arial`;
//             ctx.textAlign = 'center';
//             ctx.textBaseline = 'middle';
//             ctx.fillText(station.id, x, y + 12 / viewState.scale);
//           }
//         }
//       });

//       // Draw EV stations (large and prominent)
//       (network.stations || []).forEach(station => {
//         if (station.isEVStation) {
//           const x = toCanvasX(station.location.lon);
//           const y = toCanvasY(station.location.lat);
          
//           const available = station.availablePoints;
//           const total = station.totalPoints;
//           const ratio = available / total;

//           // Glow effect
//           if (viewState.scale > 0.3) {
//             const gradient = ctx.createRadialGradient(x, y, 0, x, y, 25 / viewState.scale);
//             if (ratio > 0.6) {
//               gradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
//               gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
//             } else if (ratio > 0.3) {
//               gradient.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
//               gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
//             } else {
//               gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
//               gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
//             }
            
//             ctx.fillStyle = gradient;
//             ctx.fillRect(x - 25 / viewState.scale, y - 25 / viewState.scale, 50 / viewState.scale, 50 / viewState.scale);
//           }

//           // Station circle
//           ctx.fillStyle = ratio > 0.6 ? '#10b981' : ratio > 0.3 ? '#f59e0b' : '#ef4444';
//           ctx.beginPath();
//           ctx.arc(x, y, 12 / viewState.scale, 0, Math.PI * 2);
//           ctx.fill();

//           ctx.strokeStyle = '#ffffff';
//           ctx.lineWidth = 2 / viewState.scale;
//           ctx.stroke();

//           // Charging icon
//           ctx.fillStyle = '#ffffff';
//           ctx.font = `bold ${14 / viewState.scale}px Arial`;
//           ctx.textAlign = 'center';
//           ctx.textBaseline = 'middle';
//           ctx.fillText('⚡', x, y);

//           // Station name (only show when zoomed in)
//           if (viewState.scale > 0.5) {
//             ctx.fillStyle = '#ffffff';
//             ctx.font = `bold ${10 / viewState.scale}px Arial`;
//             const shortName = station.name.split(' ')[0];
//             ctx.fillText(shortName, x, y + 20 / viewState.scale);
            
//             ctx.font = `${9 / viewState.scale}px Arial`;
//             ctx.fillText(`${available}/${total}`, x, y + 32 / viewState.scale);
//           }
//         }
//       });

//       // Draw user location
//       const userStation = network.stations.find(s => s.id === userNode);
//       if (userStation) {
//         const userX = toCanvasX(userStation.location.lon);
//         const userY = toCanvasY(userStation.location.lat);
        
//         const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
//         const userGradient = ctx.createRadialGradient(userX, userY, 0, userX, userY, 25 * pulse / viewState.scale);
//         userGradient.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
//         userGradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
        
//         ctx.fillStyle = userGradient;
//         ctx.fillRect(userX - 25 / viewState.scale, userY - 25 / viewState.scale, 50 / viewState.scale, 50 / viewState.scale);

//         ctx.fillStyle = '#ec4899';
//         ctx.beginPath();
//         ctx.arc(userX, userY, 8 / viewState.scale, 0, Math.PI * 2);
//         ctx.fill();

//         ctx.strokeStyle = '#ffffff';
//         ctx.lineWidth = 2 / viewState.scale;
//         ctx.stroke();

//         ctx.fillStyle = '#ffffff';
//         ctx.font = `bold ${12 / viewState.scale}px Arial`;
//         ctx.textAlign = 'center';
//         ctx.textBaseline = 'middle';
//         ctx.fillText('📍', userX, userY);
//       }

//       ctx.restore();

//       requestAnimationFrame(animate);
//     };

//     const animationId = requestAnimationFrame(animate);
//     return () => {
//       cancelAnimationFrame(animationId);
//       window.removeEventListener('resize', updateCanvasSize);
//     };
//   }, [network, userLocation, userNode, viewState]);

//   // Mouse event handlers for panning
//   const handleMouseDown = (event) => {
//     if (event.button === 0) {
//       setViewState(prev => ({
//         ...prev,
//         isDragging: true,
//         lastMouseX: event.clientX,
//         lastMouseY: event.clientY
//       }));
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (viewState.isDragging) {
//       const deltaX = event.clientX - viewState.lastMouseX;
//       const deltaY = event.clientY - viewState.lastMouseY;
      
//       setViewState(prev => ({
//         ...prev,
//         offsetX: prev.offsetX + deltaX,
//         offsetY: prev.offsetY + deltaY,
//         lastMouseX: event.clientX,
//         lastMouseY: event.clientY
//       }));
//     }
//   };

//   const handleMouseUp = () => {
//     setViewState(prev => ({ ...prev, isDragging: false }));
//   };

//   // Wheel handler for zooming
//   const handleWheel = (event) => {
//     event.preventDefault();
//     const zoomFactor = 0.1;
//     const newScale = event.deltaY < 0 
//       ? viewState.scale * (1 + zoomFactor) 
//       : viewState.scale * (1 - zoomFactor);
    
//     const clampedScale = Math.max(0.1, Math.min(5, newScale));
    
//     setViewState(prev => ({
//       ...prev,
//       scale: clampedScale
//     }));
//   };

//   // Zoom controls
//   const zoomIn = () => {
//     setViewState(prev => ({
//       ...prev,
//       scale: Math.min(5, prev.scale * 1.2)
//     }));
//   };

//   const zoomOut = () => {
//     setViewState(prev => ({
//       ...prev,
//       scale: Math.max(0.1, prev.scale * 0.8)
//     }));
//   };

//   const resetView = () => {
//     setViewState({
//       scale: 1.0,
//       offsetX: 0,
//       offsetY: 0,
//       isDragging: false,
//       lastMouseX: 0,
//       lastMouseY: 0
//     });
//   };

//   const handleCanvasClick = (e) => {
//     if (!isSelectingLocation) return;

//     const canvas = canvasRef.current;
//     const rect = canvas.getBoundingClientRect();
    
//     // Adjust for zoom and pan
//     const x = (e.clientX - rect.left - viewState.offsetX) / viewState.scale;
//     const y = (e.clientY - rect.top - viewState.offsetY) / viewState.scale;

//     // Convert click coordinates to map coordinates
//     const stations = network.stations || [];
//     const lats = stations.map(s => s.location.lat);
//     const lons = stations.map(s => s.location.lon);
//     const latRange = [Math.min(...lats), Math.max(...lats)];
//     const lonRange = [Math.min(...lons), Math.max(...lons)];
    
//     const width = canvas.width;
//     const height = canvas.height;
    
//     const toMapLon = (canvasX) => ((canvasX - 50) / (width - 100)) * (lonRange[1] - lonRange[0]) + lonRange[0];
//     const toMapLat = (canvasY) => latRange[1] - ((canvasY - 50) / (height - 100)) * (latRange[1] - latRange[0]);
    
//     const clickedLon = toMapLon(x);
//     const clickedLat = toMapLat(y);

//     // Find the closest node
//     let closestNode = null;
//     let minDistance = Infinity;

//     network.stations?.forEach(station => {
//       const distance = Math.sqrt(
//         Math.pow(station.location.lat - clickedLat, 2) + 
//         Math.pow(station.location.lon - clickedLon, 2)
//       );
      
//       if (distance < minDistance) {
//         minDistance = distance;
//         closestNode = station;
//       }
//     });

//     if (closestNode && minDistance < 0.005) {
//       onLocationSelect(closestNode.id);
//       setIsSelectingLocation(false);
//     }
//   };

//   return (
//     <div className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden">
//       <canvas 
//         ref={canvasRef} 
//         className="w-full h-full cursor-grab"
//         onClick={handleCanvasClick}
//         onMouseDown={handleMouseDown}
//         onMouseMove={handleMouseMove}
//         onMouseUp={handleMouseUp}
//         onMouseLeave={handleMouseUp}
//         onWheel={handleWheel}
//         style={{ cursor: viewState.isDragging ? 'grabbing' : (isSelectingLocation ? 'crosshair' : 'grab') }}
//       />
      
//       {/* Map Controls */}
//       <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
//         <div className="flex items-center gap-2 text-sm">
//           <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
//           <span>Live Network Status</span>
//         </div>
//       </div>
      
//       <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
//         <button
//           onClick={() => setIsSelectingLocation(!isSelectingLocation)}
//           className={`flex items-center gap-2 text-sm transition ${
//             isSelectingLocation ? 'text-yellow-400' : 'text-white'
//           }`}
//         >
//           <Target className="w-4 h-4" />
//           {isSelectingLocation ? 'Selecting Location...' : 'Set Location'}
//         </button>
//       </div>

//       {/* Zoom Controls */}
//       <div className="absolute bottom-4 right-4 flex flex-col gap-2">
//         <button
//           onClick={zoomIn}
//           className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg transition"
//           title="Zoom In"
//         >
//           <ZoomIn className="w-5 h-5" />
//         </button>
//         <button
//           onClick={zoomOut}
//           className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg transition"
//           title="Zoom Out"
//         >
//           <ZoomOut className="w-5 h-5" />
//         </button>
//         <button
//           onClick={resetView}
//           className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg transition"
//           title="Reset View"
//         >
//           <Move className="w-5 h-5" />
//         </button>
//       </div>

//       <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
//         <div className="text-xs space-y-1">
//           <div className="flex items-center gap-2">
//             <div className="w-3 h-3 bg-green-500 rounded-full"></div>
//             <span>EV Station</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
//             <span>Road Node</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
//             <span>Your Location</span>
//           </div>
//         </div>
//       </div>

//       {/* Zoom Level Display */}
//       <div className="absolute top-16 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
//         Zoom: {Math.round(viewState.scale * 100)}%
//       </div>

//       {isSelectingLocation && (
//         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
//           <div className="bg-yellow-500/20 border-2 border-yellow-400 rounded-lg p-4 text-yellow-100 text-sm backdrop-blur-sm">
//             Click on any node to set as your current location
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Enhanced Graph Visualization Component with Zoom/Pan
// const GraphVisualization = ({ network, userLocation, userNode, recommendations }) => {
//   const canvasRef = useRef(null);
//   const [viewState, setViewState] = useState({
//     scale: 1.0,
//     offsetX: 0,
//     offsetY: 0,
//     isDragging: false,
//     lastMouseX: 0,
//     lastMouseY: 0
//   });

//   useEffect(() => {
//     const canvas = canvasRef.current;
//     if (!canvas) return;
    
//     const updateCanvasSize = () => {
//       const container = canvas.parentElement;
//       canvas.width = container.clientWidth;
//       canvas.height = container.clientHeight;
//     };

//     updateCanvasSize();
//     window.addEventListener('resize', updateCanvasSize);

//     const ctx = canvas.getContext('2d');

//     const animate = () => {
//       const width = canvas.width;
//       const height = canvas.height;

//       // Clear canvas with transformations
//       ctx.save();
//       ctx.setTransform(1, 0, 0, 1, 0, 0);
//       ctx.fillStyle = '#0a0a0a';
//       ctx.fillRect(0, 0, width, height);
//       ctx.restore();

//       // Apply transformations
//       ctx.save();
//       ctx.translate(viewState.offsetX, viewState.offsetY);
//       ctx.scale(viewState.scale, viewState.scale);

//       const stations = network.stations || [];
//       if (stations.length === 0) {
//         ctx.restore();
//         requestAnimationFrame(animate);
//         return;
//       }

//       // Calculate path scores for optimal path coloring
//       const pathScores = {};
//       if (recommendations && recommendations.length > 0) {
//         recommendations.forEach((rec, index) => {
//           const score = rec.score;
//           const stationId = rec.station.id;
//           pathScores[stationId] = {
//             score: score,
//             rank: index,
//             color: index === 0 ? '#10b981' : 
//                    index === 1 ? '#22c55e' :
//                    index === 2 ? '#f59e0b' :
//                    index === 3 ? '#ef4444' : '#6b7280'
//           };
//         });
//       }

//       // Use force-directed layout
//       const positions = {};
//       const angleStep = (Math.PI * 2) / stations.length;
//       const radius = Math.min(width, height) * 0.35;
//       const centerX = width / 2;
//       const centerY = height / 2;

//       stations.forEach((station, i) => {
//         const angle = i * angleStep - Math.PI / 2;
//         const stationRadius = radius * (0.8 + Math.random() * 0.4);
//         positions[station.id] = {
//           x: centerX + Math.cos(angle) * stationRadius,
//           y: centerY + Math.sin(angle) * stationRadius
//         };
//       });

//       // Draw roads with optimal path coloring
//       (network.roads || []).forEach(road => {
//         const from = positions[road.from];
//         const to = positions[road.to];
        
//         if (!from || !to) return;

//         // Determine if this road is part of an optimal path
//         let pathColor = '#374151';
        
//         if (pathScores[road.from] || pathScores[road.to]) {
//           const fromScore = pathScores[road.from]?.score || 0;
//           const toScore = pathScores[road.to]?.score || 0;
//           const maxScore = Math.max(fromScore, toScore);
          
//           if (maxScore > 0.8) pathColor = '#10b981';
//           else if (maxScore > 0.6) pathColor = '#22c55e';
//           else if (maxScore > 0.4) pathColor = '#f59e0b';
//           else if (maxScore > 0.2) pathColor = '#ef4444';
//         }

//         const traffic = road.trafficLevel;
//         let finalColor = pathColor;
        
//         if (traffic > 2.0) {
//           finalColor = '#ef4444';
//         } else if (traffic > 1.5 && pathColor === '#374151') {
//           finalColor = '#f59e0b';
//         }

//         ctx.strokeStyle = finalColor;
//         ctx.lineWidth = Math.max(2, 8 / traffic) / viewState.scale;
//         ctx.globalAlpha = 0.8;
//         ctx.beginPath();
//         ctx.moveTo(from.x, from.y);
//         ctx.lineTo(to.x, to.y);
//         ctx.stroke();
//         ctx.globalAlpha = 1;

//         // Add animated particles for optimal paths
//         if (pathColor !== '#374151' && viewState.scale > 0.5) {
//           const dx = to.x - from.x;
//           const dy = to.y - from.y;
//           const steps = 6;
          
//           for (let i = 0; i < steps; i++) {
//             const t = ((Date.now() / 1000 + i / steps) % 1);
//             const x = from.x + dx * t;
//             const y = from.y + dy * t;
            
//             ctx.fillStyle = pathColor;
//             ctx.globalAlpha = 0.7;
//             ctx.beginPath();
//             ctx.arc(x, y, 3 / viewState.scale, 0, Math.PI * 2);
//             ctx.fill();
//             ctx.globalAlpha = 1;
//           }
//         }
//       });

//       // Draw stations
//       stations.forEach(station => {
//         const pos = positions[station.id];
        
//         if (station.isEVStation) {
//           const available = station.availablePoints;
//           const total = station.totalPoints;
//           const ratio = available / total;

//           // Check if this is a recommended station
//           const pathInfo = pathScores[station.id];
//           const isRecommended = !!pathInfo;

//           // EV Station glow with recommendation color
//           if (viewState.scale > 0.3) {
//             const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 35 / viewState.scale);
//             if (isRecommended) {
//               gradient.addColorStop(0, `${pathInfo.color}80`);
//               gradient.addColorStop(1, `${pathInfo.color}00`);
//             } else if (ratio > 0.6) {
//               gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
//               gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
//             } else if (ratio > 0.3) {
//               gradient.addColorStop(0, 'rgba(245, 158, 11, 0.5)');
//               gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
//             } else {
//               gradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)');
//               gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
//             }
            
//             ctx.fillStyle = gradient;
//             ctx.fillRect(pos.x - 35 / viewState.scale, pos.y - 35 / viewState.scale, 70 / viewState.scale, 70 / viewState.scale);
//           }

//           // EV Station circle
//           ctx.fillStyle = isRecommended ? pathInfo.color : 
//                          ratio > 0.6 ? '#10b981' : 
//                          ratio > 0.3 ? '#f59e0b' : '#ef4444';
//           ctx.beginPath();
//           ctx.arc(pos.x, pos.y, 18 / viewState.scale, 0, Math.PI * 2);
//           ctx.fill();

//           ctx.strokeStyle = '#ffffff';
//           ctx.lineWidth = 3 / viewState.scale;
//           ctx.stroke();

//           // Station info
//           if (viewState.scale > 0.5) {
//             ctx.fillStyle = '#ffffff';
//             ctx.font = `bold ${12 / viewState.scale}px Arial`;
//             ctx.textAlign = 'center';
//             ctx.textBaseline = 'middle';
//             ctx.fillText(station.id, pos.x, pos.y - 6 / viewState.scale);
            
//             ctx.font = `${10 / viewState.scale}px Arial`;
//             ctx.fillText(`${available}/${total}`, pos.x, pos.y + 8 / viewState.scale);
//           }

//           // Recommendation badge
//           if (isRecommended && viewState.scale > 0.5) {
//             ctx.fillStyle = pathInfo.color;
//             ctx.beginPath();
//             ctx.arc(pos.x + 15 / viewState.scale, pos.y - 15 / viewState.scale, 8 / viewState.scale, 0, Math.PI * 2);
//             ctx.fill();
            
//             ctx.fillStyle = '#ffffff';
//             ctx.font = `bold ${8 / viewState.scale}px Arial`;
//             ctx.fillText(`${pathInfo.rank + 1}`, pos.x + 15 / viewState.scale, pos.y - 14 / viewState.scale);
//           }
//         } else {
//           // Normal node (smaller)
//           ctx.fillStyle = '#64748b';
//           ctx.beginPath();
//           ctx.arc(pos.x, pos.y, 10 / viewState.scale, 0, Math.PI * 2);
//           ctx.fill();

//           ctx.strokeStyle = '#94a3b8';
//           ctx.lineWidth = 2 / viewState.scale;
//           ctx.stroke();

//           // Node ID
//           if (viewState.scale > 0.5) {
//             ctx.fillStyle = '#cbd5e1';
//             ctx.font = `bold ${10 / viewState.scale}px Arial`;
//             ctx.textAlign = 'center';
//             ctx.textBaseline = 'middle';
//             ctx.fillText(station.id, pos.x, pos.y);
//           }
//         }
//       });

//       // Draw user location
//       if (positions[userNode]) {
//         const pos = positions[userNode];
        
//         // User location pulse effect
//         const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
//         const userGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 25 * pulse / viewState.scale);
//         userGradient.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
//         userGradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
        
//         ctx.fillStyle = userGradient;
//         ctx.fillRect(pos.x - 25 / viewState.scale, pos.y - 25 / viewState.scale, 50 / viewState.scale, 50 / viewState.scale);

//         ctx.fillStyle = '#ec4899';
//         ctx.beginPath();
//         ctx.arc(pos.x, pos.y, 8 / viewState.scale, 0, Math.PI * 2);
//         ctx.fill();

//         ctx.strokeStyle = '#ffffff';
//         ctx.lineWidth = 2 / viewState.scale;
//         ctx.stroke();

//         ctx.fillStyle = '#ffffff';
//         ctx.font = `bold ${12 / viewState.scale}px Arial`;
//         ctx.textAlign = 'center';
//         ctx.textBaseline = 'middle';
//         ctx.fillText('📍', pos.x, pos.y);
//       }

//       ctx.restore();

//       requestAnimationFrame(animate);
//     };

//     const animationId = requestAnimationFrame(animate);
//     return () => {
//       cancelAnimationFrame(animationId);
//       window.removeEventListener('resize', updateCanvasSize);
//     };
//   }, [network, userLocation, userNode, recommendations, viewState]);

//   // Mouse event handlers for panning
//   const handleMouseDown = (event) => {
//     if (event.button === 0) {
//       setViewState(prev => ({
//         ...prev,
//         isDragging: true,
//         lastMouseX: event.clientX,
//         lastMouseY: event.clientY
//       }));
//     }
//   };

//   const handleMouseMove = (event) => {
//     if (viewState.isDragging) {
//       const deltaX = event.clientX - viewState.lastMouseX;
//       const deltaY = event.clientY - viewState.lastMouseY;
      
//       setViewState(prev => ({
//         ...prev,
//         offsetX: prev.offsetX + deltaX,
//         offsetY: prev.offsetY + deltaY,
//         lastMouseX: event.clientX,
//         lastMouseY: event.clientY
//       }));
//     }
//   };

//   const handleMouseUp = () => {
//     setViewState(prev => ({ ...prev, isDragging: false }));
//   };

//   // Wheel handler for zooming
//   const handleWheel = (event) => {
//     event.preventDefault();
//     const zoomFactor = 0.1;
//     const newScale = event.deltaY < 0 
//       ? viewState.scale * (1 + zoomFactor) 
//       : viewState.scale * (1 - zoomFactor);
    
//     const clampedScale = Math.max(0.1, Math.min(5, newScale));
    
//     setViewState(prev => ({
//       ...prev,
//       scale: clampedScale
//     }));
//   };

//   // Zoom controls
//   const zoomIn = () => {
//     setViewState(prev => ({
//       ...prev,
//       scale: Math.min(5, prev.scale * 1.2)
//     }));
//   };

//   const zoomOut = () => {
//     setViewState(prev => ({
//       ...prev,
//       scale: Math.max(0.1, prev.scale * 0.8)
//     }));
//   };

//   const resetView = () => {
//     setViewState({
//       scale: 1.0,
//       offsetX: 0,
//       offsetY: 0,
//       isDragging: false,
//       lastMouseX: 0,
//       lastMouseY: 0
//     });
//   };

//   return (
//     <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
//       <canvas 
//         ref={canvasRef} 
//         className="w-full h-full cursor-grab"
//         onMouseDown={handleMouseDown}
//         onMouseMove={handleMouseMove}
//         onMouseUp={handleMouseUp}
//         onMouseLeave={handleMouseUp}
//         onWheel={handleWheel}
//         style={{ cursor: viewState.isDragging ? 'grabbing' : 'grab' }}
//       />
      
//       {/* Graph Info */}
//       <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
//         <div className="text-xs space-y-2">
//           <div className="flex items-center gap-2">
//             <div className="w-3 h-1 bg-green-500"></div>
//             <span>Optimal Path</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-3 h-1 bg-lime-500"></div>
//             <span>Good Path</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-3 h-1 bg-yellow-500"></div>
//             <span>Average Path</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-3 h-1 bg-red-500"></div>
//             <span>Poor Path</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-3 h-1 bg-gray-500"></div>
//             <span>Normal Road</span>
//           </div>
//         </div>
//       </div>

//       {/* Zoom Controls */}
//       <div className="absolute bottom-4 right-4 flex flex-col gap-2">
//         <button
//           onClick={zoomIn}
//           className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg transition"
//           title="Zoom In"
//         >
//           <ZoomIn className="w-5 h-5" />
//         </button>
//         <button
//           onClick={zoomOut}
//           className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg transition"
//           title="Zoom Out"
//         >
//           <ZoomOut className="w-5 h-5" />
//         </button>
//         <button
//           onClick={resetView}
//           className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg transition"
//           title="Reset View"
//         >
//           <Move className="w-5 h-5" />
//         </button>
//       </div>

//       {/* Zoom Level Display */}
//       <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
//         Zoom: {Math.round(viewState.scale * 100)}%
//       </div>
//     </div>
//   );
// };

// // AI Chat Component (unchanged)
// const AIChat = ({ isOpen, onClose, chatMessages, userInput, setUserInput, onSend }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
//       <div className="pointer-events-auto w-96 h-[500px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-cyan-500/30 overflow-hidden flex flex-col">
//         <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
//               <MessageSquare className="w-6 h-6 text-white" />
//             </div>
//             <div>
//               <h3 className="font-bold text-white">AI Assistant</h3>
//               <div className="flex items-center gap-1 text-xs text-cyan-100">
//                 <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
//                 <span>Online</span>
//               </div>
//             </div>
//           </div>
//           <button 
//             onClick={onClose}
//             className="text-white hover:bg-white/20 p-2 rounded-lg transition"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>
        
//         <div className="flex-1 overflow-y-auto p-4 space-y-3">
//           {chatMessages.map((msg, idx) => (
//             <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
//               <div className={`rounded-2xl px-4 py-3 max-w-xs ${
//                 msg.role === 'user' 
//                   ? 'bg-gradient-to-br from-cyan-500 to-blue-500 text-white' 
//                   : 'bg-slate-700/50 text-gray-100 border border-slate-600'
//               }`}>
//                 <p className="text-sm">{msg.text}</p>
//               </div>
//             </div>
//           ))}
//         </div>
        
//         <div className="border-t border-slate-700 p-3 flex gap-2 bg-slate-800/50">
//           <input
//             type="text"
//             value={userInput}
//             onChange={(e) => setUserInput(e.target.value)}
//             onKeyPress={(e) => e.key === 'Enter' && onSend()}
//             placeholder="Ask me anything..."
//             className="flex-1 px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
//           />
//           <button
//             onClick={onSend}
//             className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-cyan-600 hover:to-blue-600 transition"
//           >
//             <Send className="w-5 h-5" />
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// // Main Component with Improved Layout
// const EVChargingApp = () => {
//   const [network, setNetwork] = useState({ stations: [], roads: [], vehicles: [] });
//   const [currentView, setCurrentView] = useState('map');
//   const [userLocation, setUserLocation] = useState({ lat: 21.1500, lon: 79.1000 });
//   const [userNode, setUserNode] = useState('S1');
//   const [userBattery, setUserBattery] = useState(65);
//   const [recommendations, setRecommendations] = useState([]);
//   const [chatOpen, setChatOpen] = useState(false);
//   const [chatMessages, setChatMessages] = useState([
//     { role: 'assistant', text: 'Hello! I\'m your EV charging assistant. I can help you find the best charging station based on your current location and battery level. How can I help you today?' }
//   ]);
//   const [userInput, setUserInput] = useState('');
//   const [ws, setWs] = useState(null);

//   // WebSocket connection
//   useEffect(() => {
//     const websocket = new WebSocket('ws://localhost:8000/ws');
    
//     websocket.onopen = () => {
//       console.log('WebSocket connected');
//       setWs(websocket);
//     };

//     websocket.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         if (data.type === 'simulation_update') {
//           setUserBattery(data.batteryLevel);
//           setUserLocation(data.userLocation);
//           setUserNode(data.userNode);
//           setNetwork(data.network);
//           setRecommendations(data.recommendations);
//         }
//       } catch (error) {
//         console.error('Error parsing WebSocket message:', error);
//       }
//     };

//     websocket.onclose = () => {
//       console.log('WebSocket disconnected');
//       setWs(null);
//     };

//     websocket.onerror = (error) => {
//       console.error('WebSocket error:', error);
//     };

//     return () => {
//       websocket.close();
//     };
//   }, []);

//   // Fetch initial data
//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         const networkResponse = await fetch('http://localhost:8000/api/network');
//         const networkData = await networkResponse.json();
//         setNetwork(networkData);

//         const recommendationsResponse = await fetch('http://localhost:8000/api/recommendations');
//         const recommendationsData = await recommendationsResponse.json();
//         setRecommendations(recommendationsData.recommendations);
//         setUserLocation(recommendationsData.userLocation);
//         setUserNode(recommendationsData.userNode);
//         setUserBattery(recommendationsData.batteryLevel);
//       } catch (error) {
//         console.error('Error fetching initial data:', error);
//       }
//     };

//     fetchInitialData();
//   }, []);

//   const handleLocationSelect = async (nodeId) => {
//     try {
//       const response = await fetch('http://localhost:8000/api/set-location', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ node_id: nodeId }),
//       });
      
//       const result = await response.json();
//       if (result.success) {
//         setUserLocation(result.location);
//         setUserNode(result.node);
//       } else {
//         console.error('Failed to set location:', result.message);
//       }
//     } catch (error) {
//       console.error('Error updating location:', error);
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!userInput.trim()) return;
    
//     const newMessages = [...chatMessages, { role: 'user', text: userInput }];
//     setChatMessages(newMessages);
//     setUserInput('');
    
//     try {
//       const response = await fetch('http://localhost:8000/api/chat', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ query: userInput }),
//       });
      
//       const data = await response.json();
//       setChatMessages(prev => [...prev, { role: 'assistant', text: data.response }]);
//     } catch (error) {
//       console.error('Error sending chat message:', error);
//       setChatMessages(prev => [...prev, { 
//         role: 'assistant', 
//         text: 'Sorry, I encountered an error. Please try again.' 
//       }]);
//     }
//   };

//   const getTrafficColor = (traffic) => {
//     if (traffic < 1.5) return 'text-green-600';
//     if (traffic < 2.0) return 'text-yellow-600';
//     return 'text-red-600';
//   };

//   const getBatteryColor = (battery) => {
//     if (battery > 50) return 'from-green-500 to-green-600';
//     if (battery > 20) return 'from-yellow-500 to-yellow-600';
//     return 'from-red-500 to-red-600';
//   };

//   // Calculate network statistics
//   const evStations = network.stations?.filter(s => s.isEVStation) || [];
//   const normalNodes = network.stations?.filter(s => !s.isEVStation) || [];
//   const activeVehicles = network.vehicles?.length || 0;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 overflow-auto">
//       <div className="container mx-auto p-4">
//         <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-cyan-500/20">
//           <div className="bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden">
//             <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20"></div>
//             <div className="relative flex items-center justify-between">
//               <div className="flex items-center gap-4">
//                 <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
//                   <Zap className="w-8 h-8" />
//                 </div>
//                 <div>
//                   <h1 className="text-3xl font-bold">Smart EV Network</h1>
//                   <p className="text-cyan-100">AI-Powered Charging Solutions</p>
//                 </div>
//               </div>
              
//               <div className="flex items-center gap-3">
//                 <button
//                   onClick={() => setCurrentView('map')}
//                   className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${
//                     currentView === 'map' 
//                       ? 'bg-white text-blue-600 font-bold' 
//                       : 'bg-white/20 text-white hover:bg-white/30'
//                   }`}
//                 >
//                   <MapPin className="w-5 h-5" />
//                   Map View
//                 </button>
//                 <button
//                   onClick={() => setCurrentView('graph')}
//                   className={`px-4 py-2 rounded-xl flex items-center gap-2 transition ${
//                     currentView === 'graph' 
//                       ? 'bg-white text-blue-600 font-bold' 
//                       : 'bg-white/20 text-white hover:bg-white/30'
//                   }`}
//                 >
//                   <Zap className="w-5 h-5" />
//                   Graph View
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* Improved Main Content Layout */}
//           <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 p-6">
//             {/* Sidebar - Smaller width */}
//             <div className="xl:col-span-1 space-y-4">
//               <div className={`bg-gradient-to-br ${getBatteryColor(userBattery)} rounded-2xl p-6 text-white shadow-xl`}>
//                 <div className="flex items-center gap-2 mb-4">
//                   <Car className="w-6 h-6" />
//                   <h2 className="text-xl font-bold">Your Vehicle</h2>
//                 </div>
                
//                 <div className="space-y-4">
//                   <div>
//                     <div className="flex items-center justify-between mb-2">
//                       <span className="text-sm font-semibold">Battery Level</span>
//                       <span className="text-3xl font-bold">{userBattery}%</span>
//                     </div>
//                     <div className="w-full h-3 bg-white/30 rounded-full overflow-hidden">
//                       <div 
//                         className="h-full bg-white transition-all duration-300"
//                         style={{ width: `${userBattery}%` }}
//                       ></div>
//                     </div>
//                     <div className="flex items-center justify-between mt-2 text-sm">
//                       <div className="flex items-center gap-1">
//                         <Battery className="w-4 h-4" />
//                         <span>~{(userBattery * 3.5).toFixed(0)} km</span>
//                       </div>
//                       <span className="text-xs opacity-90">-1% per minute</span>
//                     </div>
//                   </div>

//                   {userBattery < 20 && (
//                     <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-start gap-2 animate-pulse">
//                       <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
//                       <div className="text-sm">
//                         <div className="font-bold">Low Battery!</div>
//                         <div className="text-xs opacity-90">Please charge soon</div>
//                       </div>
//                     </div>
//                   )}

//                   <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
//                     <div className="flex items-center gap-2 text-sm mb-2">
//                       <MapPin className="w-4 h-4" />
//                       <span className="font-semibold">Current Location</span>
//                     </div>
//                     <div className="text-xs opacity-90 font-mono">
//                       {userLocation.lat.toFixed(4)}, {userLocation.lon.toFixed(4)}
//                     </div>
//                     <div className="text-xs text-cyan-300 mt-1">
//                       Current Node: {userNode}
//                     </div>
//                     <div className="text-xs text-cyan-300">
//                       Click "Set Location" on map to change
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-5 border border-slate-600 shadow-xl">
//                 <h3 className="text-white font-bold mb-3 flex items-center gap-2">
//                   <Wifi className="w-5 h-5" />
//                   Network Stats
//                 </h3>
//                 <div className="space-y-3 text-sm">
//                   <div className="flex justify-between items-center text-gray-300">
//                     <span>EV Stations</span>
//                     <span className="font-bold text-cyan-400">{evStations.length}</span>
//                   </div>
//                   <div className="flex justify-between items-center text-gray-300">
//                     <span>Road Nodes</span>
//                     <span className="font-bold text-cyan-400">{normalNodes.length}</span>
//                   </div>
//                   <div className="flex justify-between items-center text-gray-300">
//                     <span>Active Roads</span>
//                     <span className="font-bold text-cyan-400">{network.roads?.length || 0}</span>
//                   </div>
//                   <div className="flex justify-between items-center text-gray-300">
//                     <span>Active Vehicles</span>
//                     <span className="font-bold text-cyan-400">{activeVehicles}</span>
//                   </div>
//                   <div className="flex justify-between items-center text-gray-300">
//                     <span>Total Chargers</span>
//                     <span className="font-bold text-cyan-400">
//                       {evStations.reduce((sum, s) => sum + s.totalPoints, 0)}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Main Content Area - Larger width */}
//             <div className="xl:col-span-4 space-y-4">
//               {/* Map/Graph View - Much larger */}
//               <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-1 border border-slate-700 h-[70vh] min-h-[600px] overflow-hidden">
//                 {currentView === 'map' ? (
//                   <MapView 
//                     network={network} 
//                     userLocation={userLocation}
//                     userNode={userNode}
//                     recommendations={recommendations}
//                     onLocationSelect={handleLocationSelect}
//                   />
//                 ) : (
//                   <GraphVisualization 
//                     network={network} 
//                     userLocation={userLocation}
//                     userNode={userNode}
//                     recommendations={recommendations}
//                   />
//                 )}
//               </div>

//               {/* AI Recommendations */}
//               <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl p-4 border border-emerald-500/30">
//                 <div className="flex items-center gap-2 mb-3">
//                   <Navigation className="w-6 h-6 text-emerald-400" />
//                   <h2 className="text-xl font-bold text-white">AI Recommendations</h2>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
//                   {recommendations.slice(0, 4).map((rec, idx) => {
//                     const isTop = idx === 0;
                    
//                     return (
//                       <div
//                         key={rec.station.id}
//                         className={`bg-slate-800/70 backdrop-blur-sm rounded-xl border-2 ${
//                           isTop ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-slate-600'
//                         } p-4 hover:border-cyan-500 transition cursor-pointer`}
//                       >
//                         <div className="flex items-start justify-between mb-3">
//                           <div className="flex-1">
//                             <div className="flex items-center gap-2 mb-1">
//                               <h3 className="text-lg font-bold text-white">
//                                 {rec.station.name}
//                               </h3>
//                               {isTop && (
//                                 <span className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
//                                   BEST
//                                 </span>
//                               )}
//                             </div>
//                             <div className="flex items-center gap-4 text-sm text-gray-400">
//                               <span className="flex items-center gap-1">
//                                 <MapPin className="w-4 h-4" />
//                                 {rec.details.distance.toFixed(1)} km
//                               </span>
//                               <span className="flex items-center gap-1">
//                                 <Clock className="w-4 h-4" />
//                                 ~{Math.ceil(rec.details.distance / 50 * 60 * rec.details.trafficLevel)} min
//                               </span>
//                             </div>
//                           </div>
//                           <div className="text-right">
//                             <div className="text-3xl font-bold text-emerald-400">
//                               {(rec.score * 100).toFixed(0)}
//                             </div>
//                             <div className="text-xs text-gray-400">AI Score</div>
//                           </div>
//                         </div>

//                         <div className="grid grid-cols-3 gap-2">
//                           <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-2">
//                             <div className="text-xs text-gray-400 mb-1">Available</div>
//                             <div className="text-xl font-bold text-blue-400">
//                               {rec.details.available}/{rec.details.total}
//                             </div>
//                           </div>
//                           <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-2">
//                             <div className="text-xs text-gray-400 mb-1">Traffic</div>
//                             <div className={`text-xl font-bold ${getTrafficColor(rec.details.trafficLevel)}`}>
//                               {rec.details.trafficLevel < 1.5 ? 'Low' : rec.details.trafficLevel < 2.0 ? 'Med' : 'High'}
//                             </div>
//                           </div>
//                           <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-2">
//                             <div className="text-xs text-gray-400 mb-1">Wait</div>
//                             <div className="text-xl font-bold text-cyan-400">
//                               {Math.ceil(rec.details.predictedWaitTime)}m
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <button
//         onClick={() => setChatOpen(!chatOpen)}
//         className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 text-white rounded-full shadow-2xl hover:scale-110 transition flex items-center justify-center z-40 animate-pulse"
//       >
//         <MessageSquare className="w-8 h-8" />
//       </button>

//       <AIChat 
//         isOpen={chatOpen}
//         onClose={() => setChatOpen(false)}
//         chatMessages={chatMessages}
//         userInput={userInput}
//         setUserInput={setUserInput}
//         onSend={handleSendMessage}
//       />
//     </div>
//   );
// };

// export default EVChargingApp;









// App.js - DARK THEME VERSION
import React, { useState, useEffect, useRef } from 'react';
import { Battery, Zap, MapPin, Navigation, Clock, Car, AlertCircle, MessageSquare, Send, X, Wifi, Users, Target, ZoomIn, ZoomOut, Move } from 'lucide-react';

// Enhanced Map View Component with Zoom/Pan - DARK THEME
const MapView = ({ network, userLocation, userNode, recommendations, onLocationSelect }) => {
  const canvasRef = useRef(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [viewState, setViewState] = useState({
    scale: 1.0,
    offsetX: 0,
    offsetY: 0,
    isDragging: false,
    lastMouseX: 0,
    lastMouseY: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const ctx = canvas.getContext('2d');

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas with transformations - DARKER BACKGROUND
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#0a0a0a'; // Darker background
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Apply zoom and pan transformations
      ctx.save();
      ctx.translate(viewState.offsetX, viewState.offsetY);
      ctx.scale(viewState.scale, viewState.scale);

      // Draw grid - DARKER GRID
      ctx.strokeStyle = '#1a1a1a'; // Darker grid
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

      // Calculate bounds for all stations
      const stations = network.stations || [];
      if (stations.length === 0) {
        ctx.restore();
        requestAnimationFrame(animate);
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

      // Draw roads
      (network.roads || []).forEach(road => {
        const from = network.stations.find(s => s.id === road.from);
        const to = network.stations.find(s => s.id === road.to);
        
        if (!from || !to) return;

        const x1 = toCanvasX(from.location.lon);
        const y1 = toCanvasY(from.location.lat);
        const x2 = toCanvasX(to.location.lon);
        const y2 = toCanvasY(to.location.lat);

        const traffic = road.trafficLevel;
        let color = '#10b981';
        if (traffic > 2.0) color = '#ef4444';
        else if (traffic > 1.5) color = '#f59e0b';

        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, 4 / traffic) / viewState.scale;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      // Draw normal nodes (small and subtle) with clear labels
      (network.stations || []).forEach(station => {
        if (!station.isEVStation) {
          const x = toCanvasX(station.location.lon);
          const y = toCanvasY(station.location.lat);
          
          ctx.fillStyle = '#4b5563'; // Darker gray
          ctx.globalAlpha = 0.6;
          ctx.beginPath();
          ctx.arc(x, y, 4 / viewState.scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;

          ctx.strokeStyle = '#6b7280'; // Darker border
          ctx.lineWidth = 1 / viewState.scale;
          ctx.beginPath();
          ctx.arc(x, y, 4 / viewState.scale, 0, Math.PI * 2);
          ctx.stroke();

          // Node ID label (only show when zoomed in)
          if (viewState.scale > 0.5) {
            ctx.fillStyle = '#9ca3af'; // Lighter text for contrast
            ctx.font = `${9 / viewState.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(station.id, x, y + 12 / viewState.scale);
          }
        }
      });

      // Draw EV stations (large and prominent)
      (network.stations || []).forEach(station => {
        if (station.isEVStation) {
          const x = toCanvasX(station.location.lon);
          const y = toCanvasY(station.location.lat);
          
          const available = station.availablePoints;
          const total = station.totalPoints;
          const ratio = available / total;

          // Glow effect
          if (viewState.scale > 0.3) {
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, 25 / viewState.scale);
            if (ratio > 0.6) {
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
            ctx.fillRect(x - 25 / viewState.scale, y - 25 / viewState.scale, 50 / viewState.scale, 50 / viewState.scale);
          }

          // Station circle
          ctx.fillStyle = ratio > 0.6 ? '#10b981' : ratio > 0.3 ? '#f59e0b' : '#ef4444';
          ctx.beginPath();
          ctx.arc(x, y, 12 / viewState.scale, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / viewState.scale;
          ctx.stroke();

          // Charging icon
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${14 / viewState.scale}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', x, y);

          // Station name (only show when zoomed in)
          if (viewState.scale > 0.5) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${10 / viewState.scale}px Arial`;
            const shortName = station.name.split(' ')[0];
            ctx.fillText(shortName, x, y + 20 / viewState.scale);
            
            ctx.font = `${9 / viewState.scale}px Arial`;
            ctx.fillText(`${available}/${total}`, x, y + 32 / viewState.scale);
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

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [network, userLocation, userNode, viewState]);

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

  const handleMouseMove = (event) => {
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
  };

  const handleMouseUp = () => {
    setViewState(prev => ({ ...prev, isDragging: false }));
  };

  // Wheel handler for zooming
  const handleWheel = (event) => {
    event.preventDefault();
    const zoomFactor = 0.1;
    const newScale = event.deltaY < 0 
      ? viewState.scale * (1 + zoomFactor) 
      : viewState.scale * (1 - zoomFactor);
    
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    
    setViewState(prev => ({
      ...prev,
      scale: clampedScale
    }));
  };

  // Zoom controls
  const zoomIn = () => {
    setViewState(prev => ({
      ...prev,
      scale: Math.min(5, prev.scale * 1.2)
    }));
  };

  const zoomOut = () => {
    setViewState(prev => ({
      ...prev,
      scale: Math.max(0.1, prev.scale * 0.8)
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
    
    // Adjust for zoom and pan
    const x = (e.clientX - rect.left - viewState.offsetX) / viewState.scale;
    const y = (e.clientY - rect.top - viewState.offsetY) / viewState.scale;

    // Convert click coordinates to map coordinates
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

    // Find the closest node
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
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full cursor-grab"
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: viewState.isDragging ? 'grabbing' : (isSelectingLocation ? 'crosshair' : 'grab') }}
      />
      
      {/* Map Controls - DARKER */}
      <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg border border-gray-800">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live Network Status</span>
        </div>
      </div>
      
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

      {/* Zoom Controls - DARKER */}
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
        </div>
      </div>

      {/* Zoom Level Display - DARKER */}
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

// Enhanced Graph Visualization Component with Zoom/Pan - DARK THEME
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    const ctx = canvas.getContext('2d');

    const animate = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas with transformations - DARKER
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#050505'; // Even darker
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // Apply transformations
      ctx.save();
      ctx.translate(viewState.offsetX, viewState.offsetY);
      ctx.scale(viewState.scale, viewState.scale);

      const stations = network.stations || [];
      if (stations.length === 0) {
        ctx.restore();
        requestAnimationFrame(animate);
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

      // Draw roads with optimal path coloring
      (network.roads || []).forEach(road => {
        const from = positions[road.from];
        const to = positions[road.to];
        
        if (!from || !to) return;

        // Determine if this road is part of an optimal path
        let pathColor = '#1f2937'; // Darker gray
        
        if (pathScores[road.from] || pathScores[road.to]) {
          const fromScore = pathScores[road.from]?.score || 0;
          const toScore = pathScores[road.to]?.score || 0;
          const maxScore = Math.max(fromScore, toScore);
          
          if (maxScore > 0.8) pathColor = '#10b981';
          else if (maxScore > 0.6) pathColor = '#22c55e';
          else if (maxScore > 0.4) pathColor = '#f59e0b';
          else if (maxScore > 0.2) pathColor = '#ef4444';
        }

        const traffic = road.trafficLevel;
        let finalColor = pathColor;
        
        if (traffic > 2.0) {
          finalColor = '#ef4444';
        } else if (traffic > 1.5 && pathColor === '#1f2937') {
          finalColor = '#f59e0b';
        }

        ctx.strokeStyle = finalColor;
        ctx.lineWidth = Math.max(2, 8 / traffic) / viewState.scale;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Add animated particles for optimal paths
        if (pathColor !== '#1f2937' && viewState.scale > 0.5) {
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const steps = 6;
          
          for (let i = 0; i < steps; i++) {
            const t = ((Date.now() / 1000 + i / steps) % 1);
            const x = from.x + dx * t;
            const y = from.y + dy * t;
            
            ctx.fillStyle = pathColor;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(x, y, 3 / viewState.scale, 0, Math.PI * 2);
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

          // Check if this is a recommended station
          const pathInfo = pathScores[station.id];
          const isRecommended = !!pathInfo;

          // EV Station glow with recommendation color
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

          // Station info
          if (viewState.scale > 0.5) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${12 / viewState.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(station.id, pos.x, pos.y - 6 / viewState.scale);
            
            ctx.font = `${10 / viewState.scale}px Arial`;
            ctx.fillText(`${available}/${total}`, pos.x, pos.y + 8 / viewState.scale);
          }

          // Recommendation badge
          if (isRecommended && viewState.scale > 0.5) {
            ctx.fillStyle = pathInfo.color;
            ctx.beginPath();
            ctx.arc(pos.x + 15 / viewState.scale, pos.y - 15 / viewState.scale, 8 / viewState.scale, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${8 / viewState.scale}px Arial`;
            ctx.fillText(`${pathInfo.rank + 1}`, pos.x + 15 / viewState.scale, pos.y - 14 / viewState.scale);
          }
        } else {
          // Normal node (smaller)
          ctx.fillStyle = '#4b5563'; // Darker gray
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 10 / viewState.scale, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#6b7280'; // Darker border
          ctx.lineWidth = 2 / viewState.scale;
          ctx.stroke();

          // Node ID
          if (viewState.scale > 0.5) {
            ctx.fillStyle = '#d1d5db'; // Lighter text for contrast
            ctx.font = `bold ${10 / viewState.scale}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(station.id, pos.x, pos.y);
          }
        }
      });

      // Draw user location
      if (positions[userNode]) {
        const pos = positions[userNode];
        
        // User location pulse effect
        const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
        const userGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 25 * pulse / viewState.scale);
        userGradient.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
        userGradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
        
        ctx.fillStyle = userGradient;
        ctx.fillRect(pos.x - 25 / viewState.scale, pos.y - 25 / viewState.scale, 50 / viewState.scale, 50 / viewState.scale);

        ctx.fillStyle = '#ec4899';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 8 / viewState.scale, 0, Math.PI * 2);
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

      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [network, userLocation, userNode, recommendations, viewState]);

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

  const handleMouseMove = (event) => {
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
  };

  const handleMouseUp = () => {
    setViewState(prev => ({ ...prev, isDragging: false }));
  };

  // Wheel handler for zooming
  const handleWheel = (event) => {
    event.preventDefault();
    const zoomFactor = 0.1;
    const newScale = event.deltaY < 0 
      ? viewState.scale * (1 + zoomFactor) 
      : viewState.scale * (1 - zoomFactor);
    
    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    
    setViewState(prev => ({
      ...prev,
      scale: clampedScale
    }));
  };

  // Zoom controls
  const zoomIn = () => {
    setViewState(prev => ({
      ...prev,
      scale: Math.min(5, prev.scale * 1.2)
    }));
  };

  const zoomOut = () => {
    setViewState(prev => ({
      ...prev,
      scale: Math.max(0.1, prev.scale * 0.8)
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
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full cursor-grab"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{ cursor: viewState.isDragging ? 'grabbing' : 'grab' }}
      />
      
      {/* Graph Info - DARKER */}
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
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-gray-600"></div>
            <span>Normal Road</span>
          </div>
        </div>
      </div>

      {/* Zoom Controls - DARKER */}
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

      {/* Zoom Level Display - DARKER */}
      <div className="absolute bottom-4 left-4 bg-black/90 text-white px-3 py-1 rounded-lg text-sm border border-gray-800">
        Zoom: {Math.round(viewState.scale * 100)}%
      </div>
    </div>
  );
};

// AI Chat Component - DARK THEME
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

// Main Component with DARK THEME
const EVChargingApp = () => {
  const [network, setNetwork] = useState({ stations: [], roads: [], vehicles: [] });
  const [currentView, setCurrentView] = useState('map');
  const [userLocation, setUserLocation] = useState({ lat: 21.1500, lon: 79.1000 });
  const [userNode, setUserNode] = useState('S1');
  const [userBattery, setUserBattery] = useState(65);
  const [recommendations, setRecommendations] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hello! I\'m your EV charging assistant. I can help you find the best charging station based on your current location and battery level. How can I help you today?' }
  ]);
  const [userInput, setUserInput] = useState('');
  const [ws, setWs] = useState(null);

  // WebSocket connection
  useEffect(() => {
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
          setNetwork(data.network);
          setRecommendations(data.recommendations);
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
        const networkResponse = await fetch('http://localhost:8000/api/network');
        const networkData = await networkResponse.json();
        setNetwork(networkData);

        const recommendationsResponse = await fetch('http://localhost:8000/api/recommendations');
        const recommendationsData = await recommendationsResponse.json();
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

          {/* Improved Main Content Layout - DARKER */}
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 p-6 bg-gradient-to-br from-gray-900 to-gray-800">
            {/* Sidebar - Smaller width */}
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

            {/* Main Content Area - Larger width */}
            <div className="xl:col-span-4 space-y-4">
              {/* Map/Graph View - Much larger */}
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-1 border border-gray-700 h-[70vh] min-h-[600px] overflow-hidden">
                {currentView === 'map' ? (
                  <MapView 
                    network={network} 
                    userLocation={userLocation}
                    userNode={userNode}
                    recommendations={recommendations}
                    onLocationSelect={handleLocationSelect}
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

              {/* AI Recommendations - DARKER */}
              <div className="bg-gradient-to-br from-emerald-600/20 to-cyan-600/20 backdrop-blur-sm rounded-2xl p-4 border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-3">
                  <Navigation className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-xl font-bold text-white">AI Recommendations</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {recommendations.slice(0, 4).map((rec, idx) => {
                    const isTop = idx === 0;
                    
                    return (
                      <div
                        key={rec.station.id}
                        className={`bg-gray-800/80 backdrop-blur-sm rounded-xl border-2 ${
                          isTop ? 'border-emerald-500 shadow-lg shadow-emerald-500/20' : 'border-gray-700'
                        } p-4 hover:border-cyan-500 transition cursor-pointer`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-bold text-white">
                                {rec.station.name}
                              </h3>
                              {isTop && (
                                <span className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
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
                                ~{Math.ceil(rec.details.distance / 50 * 60 * rec.details.trafficLevel)} min
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-emerald-400">
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



































# main.py - IMPROVED AI NAVIGATOR WITH OPTIMAL STATION SELECTION
import asyncio
import json
import random
import time
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Charging Station Class
class ChargingStation:
    def __init__(self, id: str, name: str, lat: float, lon: float, total_points: int, fast_chargers: int, regular_chargers: int, grid_x: int = 0, grid_y: int = 0):
        self.id = id
        self.name = name
        self.location = {"lat": lat, "lon": lon}
        self.total_points = total_points
        self.fast_chargers = fast_chargers
        self.regular_chargers = regular_chargers
        self.is_ev_station = True
        self.grid_x = grid_x
        self.grid_y = grid_y
        self.type = "station"
        self.usage_pattern = random.uniform(0.4, 0.7)  # Reduced usage pattern
        self.availablePoints = total_points
        self.last_availability_update = datetime.now()
        self.reliability_score = random.uniform(0.7, 0.95)  # Station reliability

# Normal Node Class
class RoadNode:
    def __init__(self, id: str, lat: float, lon: float, grid_x: int = 0, grid_y: int = 0):
        self.id = id
        self.name = f"Node_{id}"
        self.location = {"lat": lat, "lon": lon}
        self.is_ev_station = False
        self.total_points = 0
        self.fast_chargers = 0
        self.regular_chargers = 0
        self.grid_x = grid_x
        self.grid_y = grid_y
        self.type = "location"
        self.availablePoints = 0

# Charging Point Class
class ChargingPoint:
    def __init__(self, station_id: str, point_id: str, is_fast: bool):
        self.station_id = station_id
        self.point_id = point_id
        self.is_fast = is_fast
        self.occupied = False
        self.vehicle = None
        self.occupation_start = None
        self.charging_duration = 0
        self.max_charging_time = 0

    def occupy(self, vehicle_model: str, current_battery: int, target_battery: int = 100):
        self.occupied = True
        self.charging_duration = self.calculate_charging_time(current_battery, target_battery)
        self.max_charging_time = self.charging_duration * random.uniform(1.0, 1.3)  # Add some buffer
        
        self.vehicle = {
            "model": vehicle_model,
            "current_battery": current_battery,
            "target_battery": target_battery,
            "start_time": datetime.now().timestamp() * 1000,
            "estimated_time": self.charging_duration
        }
        self.occupation_start = datetime.now()

    def calculate_charging_time(self, current: int, target: int) -> float:
        battery_to_charge = target - current
        charge_rate = 4 if self.is_fast else 1.5
        base_time = (battery_to_charge / charge_rate) * 2
        # Add some randomness but cap maximum charging time
        return min(5, base_time * random.uniform(0.8, 1.2))

    def release(self):
        self.occupied = False
        self.vehicle = None
        self.occupation_start = None
        self.charging_duration = 0
        self.max_charging_time = 0

    def should_release(self) -> bool:
        """Check if this charging point should be released based on charging time"""
        if not self.occupied or not self.occupation_start:
            return False
        
        current_time = datetime.now()
        time_occupied = (current_time - self.occupation_start).total_seconds() / 60  # minutes
        
        # Release if charging is complete or max time exceeded
        return time_occupied >= self.charging_duration

# Road Class
class Road:
    def __init__(self, from_station: str, to_station: str, distance: float, base_traffic: float = 1.0):
        self.from_station = from_station
        self.to_station = to_station
        self.distance = distance
        self.base_traffic = base_traffic
        self.current_traffic = base_traffic

    def get_weight(self) -> float:
        return self.distance * self.current_traffic

    def get_travel_time(self, avg_speed: float = 50) -> float:
        effective_speed = avg_speed / self.current_traffic
        return (self.distance / effective_speed) * 60

# Vehicle Class
class Vehicle:
    def __init__(self, id: str, current_node: str, target_station: str, battery_level: int):
        self.id = id
        self.current_node = current_node
        self.target_station = target_station
        self.battery_level = battery_level
        self.path = []
        self.is_moving = False
        self.last_move_time = datetime.now()
        self.charging_time_multiplier = random.uniform(0.8, 1.2)

    def move_to_next_node(self):
        if self.path and len(self.path) > 1:
            self.current_node = self.path[1]
            self.path = self.path[1:]
            self.battery_level = max(0, self.battery_level - random.randint(1, 3))
            self.last_move_time = datetime.now()
            return True
        return False

# EV Charging Network
class EVChargingNetwork:
    def __init__(self):
        self.stations = {}
        self.roads = {}
        self.charging_points = {}
        self.vehicles = {}
        self.vehicle_models = [
            "Tesla Model 3", "Nissan Leaf", "Chevrolet Bolt", 
            "BMW i3", "Hyundai Kona", "Tata Nexon EV", "Audi e-tron",
            "Mercedes EQC", "Ford Mustang Mach-E", "Volkswagen ID.4"
        ]

    def add_station(self, station):
        self.stations[station.id] = station
        
        if hasattr(station, 'is_ev_station') and station.is_ev_station:
            points = []
            for i in range(station.fast_chargers):
                points.append(ChargingPoint(station.id, f"F{i + 1}", True))
            for i in range(station.regular_chargers):
                points.append(ChargingPoint(station.id, f"R{i + 1}", False))
            self.charging_points[station.id] = points

    def add_road(self, from_station: str, to_station: str, distance: float, traffic: float = 1.0):
        key = f"{from_station}-{to_station}"
        reverse_key = f"{to_station}-{from_station}"
        self.roads[key] = Road(from_station, to_station, distance, traffic)
        self.roads[reverse_key] = Road(to_station, from_station, distance, traffic)

    def get_available_points(self, station_id: str) -> List[ChargingPoint]:
        points = self.charging_points.get(station_id, [])
        return [p for p in points if not p.occupied]

    def get_occupied_points(self, station_id: str) -> List[ChargingPoint]:
        points = self.charging_points.get(station_id, [])
        return [p for p in points if p.occupied]

    def calculate_distance(self, loc1: Dict, loc2: Dict) -> float:
        R = 6371
        lat1 = math.radians(loc1["lat"])
        lon1 = math.radians(loc1["lon"])
        lat2 = math.radians(loc2["lat"])
        lon2 = math.radians(loc2["lon"])
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c

    def find_shortest_path(self, start_node: str, end_node: str) -> List[str]:
        if start_node not in self.stations or end_node not in self.stations:
            return [start_node]
            
        distances = {node: float('inf') for node in self.stations}
        previous = {node: None for node in self.stations}
        distances[start_node] = 0
        unvisited = set(self.stations.keys())
        
        while unvisited:
            current = min(unvisited, key=lambda node: distances[node])
            unvisited.remove(current)
            
            if current == end_node:
                break
                
            for road_key, road in self.roads.items():
                if road.from_station == current and road.to_station in unvisited:
                    neighbor = road.to_station
                    alt = distances[current] + road.get_weight()
                    if alt < distances[neighbor]:
                        distances[neighbor] = alt
                        previous[neighbor] = current
        
        path = []
        current = end_node
        while current is not None:
            path.append(current)
            current = previous[current]
        
        return path[::-1] if path else [start_node]

    def add_vehicle(self, start_node: str, target_station: str, battery_level: int):
        vehicle_id = f"V{len(self.vehicles) + 1}"
        vehicle = Vehicle(vehicle_id, start_node, target_station, battery_level)
        vehicle.path = self.find_shortest_path(start_node, target_station)
        vehicle.is_moving = True
        self.vehicles[vehicle_id] = vehicle
        return vehicle

    def update_charging_stations_availability(self):
        """Dynamically update charging station availability - RELEASE AND OCCUPY POINTS SMARTLY"""
        current_time = datetime.now()
        
        for station_id, points in self.charging_points.items():
            station = self.stations[station_id]
            occupied_count = 0
            available_count = 0
            
            # First, release points that have completed charging
            for point in points:
                if point.occupied and point.should_release():
                    point.release()
                    print(f"Released charging point {point.point_id} at station {station_id}")
            
            # Count current availability
            for point in points:
                if point.occupied:
                    occupied_count += 1
                else:
                    available_count += 1
            
            # Smart occupancy management - prevent all points from being occupied
            total_points = len(points)
            
            # If station is getting too full, reduce new occupations
            if occupied_count / total_points > 0.8:  # If 80% occupied
                occupation_probability = 0.01  # Very low chance of new occupation
            elif occupied_count / total_points > 0.6:  # If 60% occupied
                occupation_probability = 0.02  # Low chance of new occupation
            else:
                occupation_probability = 0.03 * station.usage_pattern  # Normal chance
            
            # Occupy some points based on dynamic probability
            for point in points:
                if not point.occupied and random.random() < occupation_probability:
                    model = random.choice(self.vehicle_models)
                    battery = random.randint(10, 40)
                    point.occupy(model, battery, random.randint(50, 65))             # Target lower battery to reduce occupation time (((((no of Ev stations will be occupied more often)))))
                    print(f"Occupied charging point {point.point_id} at station {station_id}")
            
            # Ensure at least some points are always available
            final_available = len([p for p in points if not p.occupied])
            if final_available == 0 and total_points > 0:
                # Force release one random point to maintain availability
                occupied_points = [p for p in points if p.occupied]
                if occupied_points:
                    point_to_release = random.choice(occupied_points)
                    point_to_release.release()
                    print(f"FORCE RELEASED charging point {point_to_release.point_id} at station {station_id} to maintain availability")
            
            # Update station's available points count
            station.availablePoints = len([p for p in points if not p.occupied])
            station.last_availability_update = current_time

# IMPROVED SMART ROUTING AI WITH OPTIMAL STATION SELECTION
class SmartRoutingAI:
    def __init__(self, network: EVChargingNetwork):
        self.network = network
        self.last_recommendation_time = {}
        self.station_popularity = {}

    def calculate_station_score(self, station_id: str, user_location: Dict, user_battery: float, user_node: str) -> Dict:
        """Calculate optimal station score with improved weighting algorithm"""
        station = self.network.stations[station_id]
        
        if not hasattr(station, 'is_ev_station') or not station.is_ev_station:
            return {"score": 0, "details": {}}
        
        # Get real-time data
        available = len(self.network.get_available_points(station_id))
        total_points = station.total_points
        
        # Calculate distance and travel metrics
        straight_distance = self.network.calculate_distance(user_location, station.location)
        
        # Calculate actual travel distance and time using pathfinding
        path = self.network.find_shortest_path(user_node, station_id)
        travel_distance, travel_time, avg_traffic = self.calculate_travel_metrics(path)
        
        # Use actual travel distance instead of straight line
        actual_distance = travel_distance if travel_distance > 0 else straight_distance
        
        # SCORE COMPONENTS WITH OPTIMAL WEIGHTS
        
        # 1. AVAILABILITY SCORE (35%) - Prioritize stations with available chargers
        if total_points > 0:
            availability_ratio = available / total_points
            # Exponential scoring to strongly favor stations with more available chargers
            availability_score = availability_ratio ** 0.9 # Exponential favor for higher availability
        else:
            availability_score = 0
        
        # 2. DISTANCE SCORE (30%) - Strong preference for closer stations
        max_reasonable_distance = 25  # km - beyond this, score drops significantly
        if actual_distance <= max_reasonable_distance:
            distance_score = 1 - (actual_distance / max_reasonable_distance) ** 0.9  # Favor closer stations more
        else:
            distance_score = 0.1  # Very low score for distant stations
        
        # 3. TRAVEL TIME SCORE (20%) - Consider traffic conditions
        max_reasonable_time = 30  # minutes
        if travel_time > 0 and travel_time <= max_reasonable_time:
            travel_time_score = 1 - (travel_time / max_reasonable_time) ** 0.8
        else:
            travel_time_score = 0.1
        
        # 4. WAIT TIME SCORE (10%) - Consider current queue
        occupied_points = self.network.get_occupied_points(station_id)
        predicted_wait_time = self.predict_wait_time(occupied_points)
        max_wait = 20  # minutes
        wait_score = max(0, 1 - (predicted_wait_time / max_wait) ** 1.2) if predicted_wait_time > 0 else 1.0
        
        # 5. RELIABILITY SCORE (5%) - Station reliability and popularity
        reliability_score = getattr(station, 'reliability_score', 0.8)
        
        # URGENCY-BASED WEIGHT ADJUSTMENT
        if user_battery < 15:  # Critical battery
            # Emergency mode: prioritize availability and distance equally
            weights = [0.40, 0.40, 0.15, 0.05, 0.00]
        elif user_battery < 25:  # Low battery
            # Priority mode: balance availability and distance
            weights = [0.35, 0.35, 0.20, 0.08, 0.02]
        else:  # Normal battery
            # Normal mode: balanced approach
            weights = [0.35, 0.30, 0.20, 0.10, 0.05]
        
        # Calculate final score
        final_score = (
            availability_score * weights[0] +
            distance_score * weights[1] +
            travel_time_score * weights[2] +
            wait_score * weights[3] +
            reliability_score * weights[4]
        )
        
        # Penalize stations with no available chargers but don't eliminate them completely
        if available == 0:
            final_score *= 0.3  # Reduce score but don't zero it
        
        # Ensure score is within bounds
        final_score = max(0, min(1.0, final_score))
        
        return {
            "score": final_score,
            "details": {
                "distance": actual_distance,
                "travelTime": travel_time,
                "available": available,
                "total": total_points,
                "predictedWaitTime": predicted_wait_time,
                "trafficLevel": avg_traffic,
                "path": path,
                "availabilityScore": availability_score,
                "distanceScore": distance_score,
                "travelTimeScore": travel_time_score,
                "waitScore": wait_score
            }
        }

    def calculate_travel_metrics(self, path: List[str]) -> tuple:
        """Calculate actual travel distance, time, and average traffic for a path"""
        if len(path) < 2:
            return 0, 0, 1.0
        
        total_distance = 0
        total_time = 0
        total_traffic = 0
        segment_count = 0
        
        for i in range(len(path) - 1):
            road_key = f"{path[i]}-{path[i+1]}"
            if road_key in self.network.roads:
                road = self.network.roads[road_key]
                total_distance += road.distance
                total_time += road.get_travel_time()
                total_traffic += road.current_traffic
                segment_count += 1
        
        avg_traffic = total_traffic / segment_count if segment_count > 0 else 1.0
        return total_distance, total_time, avg_traffic

    def predict_wait_time(self, occupied_points: List[ChargingPoint]) -> float:
        """Predict wait time based on current charging sessions"""
        if not occupied_points:
            return 0
        
        current_time = datetime.now().timestamp() * 1000
        remaining_times = []
        
        for point in occupied_points:
            if point.vehicle:
                elapsed = (current_time - point.vehicle["start_time"]) / 60000  # minutes
                remaining_time = max(0, point.vehicle["estimated_time"] - elapsed)
                remaining_times.append(remaining_time)
        
        if not remaining_times:
            return 0
        
        # Use 75th percentile to account for outliers
        remaining_times.sort()
        index = min(len(remaining_times) - 1, int(len(remaining_times) * 0.75))
        return remaining_times[index]

    def get_sorted_recommendations(self, user_location: Dict, user_battery: float, user_node: str) -> List[Dict]:
        """Get optimally sorted station recommendations"""
        recommendations = []
        
        # First, filter stations by reasonable distance
        candidate_stations = []
        for station_id, station in self.network.stations.items():
            if hasattr(station, 'is_ev_station') and station.is_ev_station:
                distance = self.network.calculate_distance(user_location, station.location)
                # Only consider stations within 30km for normal battery, 40km for low battery
                max_distance = 40 if user_battery < 25 else 30
                if distance <= max_distance:
                    candidate_stations.append(station_id)
        
        # Calculate scores for candidate stations
        for station_id in candidate_stations:
            result = self.calculate_station_score(station_id, user_location, user_battery, user_node)
            if result["score"] > 0.1:  # Minimum threshold
                station = self.network.stations[station_id]
                recommendations.append({
                    "station": {
                        "id": station.id,
                        "name": station.name,
                        "location": station.location,
                        "totalPoints": station.total_points,
                        "fastChargers": station.fast_chargers,
                        "regularChargers": station.regular_chargers,
                        "isEVStation": True
                    },
                    **result
                })
        
        # Sort by score (descending) and return top 5
        sorted_recommendations = sorted(recommendations, key=lambda x: x["score"], reverse=True)
        
        # Update popularity tracking
        for rec in sorted_recommendations[:3]:
            station_id = rec["station"]["id"]
            self.station_popularity[station_id] = self.station_popularity.get(station_id, 0) + 1
        
        return sorted_recommendations[:5]

    def get_optimal_route(self, user_node: str, station_id: str) -> Dict:
        """Get optimal route to station with detailed metrics"""
        path = self.network.find_shortest_path(user_node, station_id)
        distance, travel_time, avg_traffic = self.calculate_travel_metrics(path)
        
        return {
            "path": path,
            "total_distance": distance,
            "total_time": travel_time,
            "average_traffic": avg_traffic,
            "waypoints": len(path) - 1
        }

# FastAPI Application
app = FastAPI(title="EV Charging Station Simulation")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
network = EVChargingNetwork()
ai_engine = SmartRoutingAI(network)

def initialize_network():
    print("Initializing proper grid-based network...")
    
    # Create 15 EV Stations
    ev_stations = [
        # Central area (closer stations)
        ChargingStation('S1', 'Downtown PowerHub', 21.1520, 79.0980, 8, 4, 4, 3, 3),
        ChargingStation('S2', 'Central Plaza Charge', 21.1500, 79.1020, 6, 3, 3, 4, 4),
        ChargingStation('S3', 'Metro Station EV', 21.1480, 79.1000, 10, 5, 5, 3, 5),
        
        # Northern area
        ChargingStation('S4', 'Northgate Charging', 21.1620, 79.0950, 6, 3, 3, 2, 1),
        ChargingStation('S5', 'University Power', 21.1580, 79.0900, 8, 4, 4, 1, 2),
        
        # Southern area
        ChargingStation('S6', 'Southside Charge', 21.1420, 79.1000, 7, 3, 4, 4, 6),
        ChargingStation('S7', 'Mall Parking EV', 21.1400, 79.0950, 9, 5, 4, 2, 7),
        
        # Eastern area
        ChargingStation('S8', 'Eastgate Power', 21.1500, 79.1150, 8, 4, 4, 6, 4),
        ChargingStation('S9', 'Highway East EV', 21.1450, 79.1200, 12, 8, 4, 7, 5),
        
        # Western area
        ChargingStation('S10', 'Westgate Charging', 21.1500, 79.0850, 7, 3, 4, 1, 4),
        ChargingStation('S11', 'Old Town EV', 21.1480, 79.0800, 5, 2, 3, 0, 5),
        
        # Additional stations
        ChargingStation('S12', 'Airport EV Zone', 21.1650, 79.1050, 10, 6, 4, 5, 1),
        ChargingStation('S13', 'Stadium Charge', 21.1600, 79.1100, 8, 4, 4, 6, 2),
        ChargingStation('S14', 'Hospital EV', 21.1550, 79.1150, 6, 3, 3, 5, 3),
        ChargingStation('S15', 'Business Park', 21.1350, 79.0900, 8, 4, 4, 1, 7),
    ]
    
    # Create grid-based normal nodes (7x7 grid for better structure)
    normal_nodes = []
    
    grid_size = 10  # 7x7 grid
    lat_start, lat_end = 21.1300, 21.1700
    lon_start, lon_end = 79.0750, 79.1250
    
    lat_step = (lat_end - lat_start) / (grid_size - 1)
    lon_step = (lon_end - lon_start) / (grid_size - 1)
    
    node_counter = 1
    
    # Create grid nodes
    for i in range(grid_size):
        for j in range(grid_size):
            # Add some randomness to make it look more natural
            lat_variation = random.uniform(-0.001, 0.001)
            lon_variation = random.uniform(-0.001, 0.001)
            
            lat = lat_start + i * lat_step + lat_variation
            lon = lon_start + j * lon_step + lon_variation
            
            node_id = f"N{node_counter}"
            normal_nodes.append(RoadNode(node_id, lat, lon, j, i))
            node_counter += 1
    
    print(f"Created {len(ev_stations)} EV stations and {len(normal_nodes)} normal nodes")
    
    # Add all stations and nodes to network
    for station in ev_stations:
        network.add_station(station)
    
    for node in normal_nodes:
        network.add_station(node)
    
    # Create proper grid connections (like a real map)
    all_nodes = {**{s.id: s for s in ev_stations}, **{n.id: n for n in normal_nodes}}
    
    # Connect nodes in grid pattern (each node connects to neighbors)
    for node_id, node in all_nodes.items():
        current_x = node.grid_x
        current_y = node.grid_y
        
        # Define possible neighbors (right, left, down, up)
        neighbors = [
            (current_x + 1, current_y),  # right
            (current_x - 1, current_y),  # left  
            (current_x, current_y + 1),  # down
            (current_x, current_y - 1),  # up
        ]
        
        # Also add diagonal connections for more natural map (optional)
        if random.random() > 0.7:  # 30% chance for diagonal connections
            neighbors.extend([
                (current_x + 1, current_y + 1),  # down-right
                (current_x - 1, current_y + 1),  # down-left
            ])
        
        connected_count = 0
        max_connections = random.randint(2, 4)  # Each node connects to 2-4 neighbors
        
        for nx, ny in neighbors:
            if connected_count >= max_connections:
                break
                
            # Find node at this grid position
            neighbor_node = next((n for n in all_nodes.values() if n.grid_x == nx and n.grid_y == ny), None)
            
            if neighbor_node and neighbor_node.id != node_id:
                # Check if road already exists
                road_key = f"{node_id}-{neighbor_node.id}"
                reverse_key = f"{neighbor_node.id}-{node_id}"
                
                if road_key not in network.roads and reverse_key not in network.roads:
                    distance = network.calculate_distance(node.location, neighbor_node.location)
                    # Add some traffic variation based on location
                    base_traffic = 1.0 + random.uniform(-0.2, 0.3)
                    
                    network.add_road(node_id, neighbor_node.id, distance, base_traffic)
                    connected_count += 1
    
    print(f"Network created with {len(network.roads)//2} roads (proper grid structure)")
    
    # Verify connectivity
    test_path = network.find_shortest_path('N1', 'S1')
    print(f"Test path from N1 to S1: {len(test_path)} nodes")
    
    return True

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        disconnected_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"WebSocket error: {e}")
                disconnected_connections.append(connection)
        
        for connection in disconnected_connections:
            self.disconnect(connection)

manager = ConnectionManager()

# Global simulation state
simulation_state = {
    "battery_level": 65,
    "user_location": {"lat": 21.1500, "lon": 79.1000},
    "user_node": "S1",
    "last_update": datetime.now().isoformat(),
    "is_location_locked": False
}

def get_active_route_roads(user_node: str, station_id: str):
    """Helper function to get active roads for a route"""
    path = network.find_shortest_path(user_node, station_id)
    active_roads = []
    
    for i in range(len(path) - 1):
        from_node = path[i]
        to_node = path[i + 1]
        
        # Find the road between these nodes
        road_key = f"{from_node}-{to_node}"
        reverse_key = f"{to_node}-{from_node}"
        
        road = network.roads.get(road_key) or network.roads.get(reverse_key)
        
        if road:
            active_roads.append({
                "from": from_node,
                "to": to_node,
                "distance": road.distance,
                "travelTime": road.get_travel_time(),
                "trafficLevel": road.current_traffic,
                "isActive": True,  # This marks it as the active route
                "segmentIndex": i
            })
    
    return active_roads

@app.get("/")
async def read_root():
    return {"message": "EV Charging Station Simulation API"}

@app.get("/api/network")
async def get_network():
    """Return full network data - ALL ROADS ARE INACTIVE BY DEFAULT"""
    nodes_data = []
    
    for node_id, node in network.stations.items():
        points = network.charging_points.get(node_id, [])
        available = len([p for p in points if not p.occupied])
        
        # Update the station's available points
        if hasattr(node, 'is_ev_station') and node.is_ev_station:
            node.availablePoints = available
        
        node_data = {
            "id": node.id,
            "name": node.name,
            "location": node.location,
            "type": "station" if getattr(node, 'is_ev_station', False) else "location",
            "availablePoints": available,
            "totalPoints": node.total_points,
            "fastChargers": getattr(node, 'fast_chargers', 0),
            "regularChargers": getattr(node, 'regular_chargers', 0),
            "isEVStation": getattr(node, 'is_ev_station', False),
            "x": getattr(node, 'grid_x', 0),
            "y": getattr(node, 'grid_y', 0)
        }
        nodes_data.append(node_data)
    
    roads_data = []
    for road_key, road in network.roads.items():
        if road.from_station < road.to_station:  # Avoid duplicates
            roads_data.append({
                "from": road.from_station,
                "to": road.to_station,
                "distance": road.distance,
                "trafficLevel": road.current_traffic,
                "travelTime": road.get_travel_time(),
                "isActive": False  # CRITICAL: All roads inactive by default
            })
    
    vehicles_data = []
    for vehicle_id, vehicle in network.vehicles.items():
        vehicles_data.append({
            "id": vehicle.id,
            "currentNode": vehicle.current_node,
            "targetStation": vehicle.target_station,
            "batteryLevel": vehicle.battery_level,
            "path": vehicle.path,
            "isMoving": vehicle.is_moving
        })
    
    return {
        "stations": nodes_data,
        "roads": roads_data,
        "vehicles": vehicles_data,
        "totalNodes": len(nodes_data),
        "totalStations": len([n for n in nodes_data if n["type"] == "station"]),
        "totalRoads": len(roads_data),
        "totalVehicles": len(network.vehicles),
        "grid": {"width": 7, "height": 7}
    }

@app.get("/api/recommendations")
async def get_recommendations():
    """Get AI recommendations for charging stations"""
    user_location = simulation_state["user_location"]
    battery_level = simulation_state["battery_level"]
    user_node = simulation_state["user_node"]
    
    recommendations = ai_engine.get_sorted_recommendations(user_location, battery_level, user_node)
    
    enhanced_recommendations = []
    for rec in recommendations:
        # Get optimal route details
        route_details = ai_engine.get_optimal_route(user_node, rec["station"]["id"])
        
        # Get active roads for visualization
        active_roads = get_active_route_roads(user_node, rec["station"]["id"])
        
        enhanced_rec = {
            **rec,
            "route": route_details,
            "active_roads": active_roads  # Add active roads for visualization
        }
        enhanced_recommendations.append(enhanced_rec)
    
    return {
        "userLocation": user_location,
        "userNode": user_node,
        "batteryLevel": battery_level,
        "recommendations": enhanced_recommendations,
        "urgency": "critical" if battery_level < 15 else "low" if battery_level < 25 else "normal"
    }

@app.get("/api/active-route/{station_id}")
async def get_active_route(station_id: str):
    """Get active route with highlighted path for visualization"""
    user_node = simulation_state["user_node"]
    
    if station_id not in network.stations:
        return {"error": "Station not found"}
    
    # Get the optimal route
    route_details = ai_engine.get_optimal_route(user_node, station_id)
    
    # Get active roads for the optimal path
    active_roads = get_active_route_roads(user_node, station_id)
    
    return {
        "station_id": station_id,
        "user_node": user_node,
        "path": route_details["path"],
        "active_roads": active_roads,
        "total_distance": route_details["total_distance"],
        "total_time": route_details["total_time"],
        "waypoints": len(route_details["path"]) - 1
    }

@app.get("/api/optimal-route/{station_id}")
async def get_optimal_route(station_id: str):
    """Get optimal route to specific station"""
    user_node = simulation_state["user_node"]
    
    if station_id not in network.stations:
        return {"error": "Station not found"}
    
    route_details = ai_engine.get_optimal_route(user_node, station_id)
    
    return {
        "station_id": station_id,
        "user_node": user_node,
        "route": route_details
    }

@app.post("/api/set-location")
async def set_user_location(location_data: dict):
    """Set user location manually by node ID"""
    node_id = location_data.get("node_id")
    if node_id in network.stations:
        node = network.stations[node_id]
        simulation_state["user_location"] = node.location
        simulation_state["user_node"] = node_id
        simulation_state["is_location_locked"] = True
        
        return {
            "success": True,
            "message": f"Location set to {node.name}",
            "location": simulation_state["user_location"],
            "node": node_id
        }
    else:
        return {"success": False, "message": "Node not found"}

@app.post("/api/chat")
async def chatbot_query(data: dict):
    """Handle chatbot queries"""
    query = data.get("query", "").lower()
    battery_level = simulation_state["battery_level"]
    user_node = simulation_state["user_node"]
    
    response = ""
    
    if any(word in query for word in ["find", "station", "charge"]):
        recommendations = ai_engine.get_sorted_recommendations(
            simulation_state["user_location"], battery_level, user_node
        )
        if recommendations:
            best = recommendations[0]
            urgency = "I strongly recommend going immediately" if battery_level < 15 else "I recommend going soon" if battery_level < 25 else "You can visit"
            response = f"{urgency} to {best['station']['name']}. It has {best['details']['available']} chargers available, is {best['details']['distance']:.1f} km away ({best['details']['travelTime']:.0f} min drive). Score: {best['score']:.2f}/1.00"
        else:
            response = "I couldn't find any suitable charging stations nearby. Try expanding your search range or check back in a few minutes."
    
    elif any(word in query for word in ["battery", "range"]):
        estimated_range = battery_level * 3.5
        response = f"Your battery is at {battery_level}% (~{estimated_range:.0f} km range). {'🚨 CRITICAL: Charge immediately!' if battery_level < 15 else '⚠️ LOW: Find a station soon!' if battery_level < 25 else '✅ OK: You have sufficient range.'}"
    
    elif any(word in query for word in ["traffic", "busy"]):
        recommendations = ai_engine.get_sorted_recommendations(
            simulation_state["user_location"], battery_level, user_node
        )
        if recommendations:
            best = recommendations[0]
            traffic_status = "light 🟢" if best['details']['trafficLevel'] < 1.3 else "moderate 🟡" if best['details']['trafficLevel'] < 1.8 else "heavy 🔴"
            response = f"Route to {best['station']['name']} has {traffic_status} traffic. Travel time: {best['details']['travelTime']:.0f} minutes."
        else:
            response = "I couldn't retrieve traffic information at the moment."
    
    elif any(word in query for word in ["wait", "available"]):
        recommendations = ai_engine.get_sorted_recommendations(
            simulation_state["user_location"], battery_level, user_node
        )
        if recommendations:
            best = recommendations[0]
            wait_text = f"Estimated wait: {best['details']['predictedWaitTime']:.0f} min" if best['details']['predictedWaitTime'] > 0 else "No wait expected! 🎉"
            response = f"{best['station']['name']}: {best['details']['available']}/{best['details']['total']} chargers free. {wait_text}"
        else:
            response = "Most stations are currently busy. I recommend trying stations slightly further away."
    
    elif any(word in query for word in ["best", "recommend"]):
        recommendations = ai_engine.get_sorted_recommendations(
            simulation_state["user_location"], battery_level, user_node
        )
        if recommendations:
            best = recommendations[0]
            response = f"🏆 Best option: {best['station']['name']} (Score: {best['score']:.2f}/1.00)\n"
            response += f"📍 Distance: {best['details']['distance']:.1f} km\n"
            response += f"⏱️ Travel time: {best['details']['travelTime']:.0f} min\n"
            response += f"🔌 Available: {best['details']['available']}/{best['details']['total']} chargers\n"
            response += f"🚦 Traffic: {'Light' if best['details']['trafficLevel'] < 1.3 else 'Moderate' if best['details']['trafficLevel'] < 1.8 else 'Heavy'}"
        else:
            response = "No optimal stations found. Please try again later."
    
    else:
        response = "I can help you: 🔌 Find charging stations, 📊 Check battery range, 🚦 Get traffic info, ⏱️ Check wait times, 🏆 Get best recommendations. Try: 'Find me a station' or 'How's my battery?'"
    
    return {"query": query, "response": response}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received message: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        print("Client disconnected")

# Enhanced simulation background task
async def run_simulation():
    last_battery_update = datetime.now()
    last_vehicle_spawn = datetime.now()
    last_availability_update = datetime.now()
    
    while True:
        try:
            current_time = datetime.now()
            
            # Update battery level
            if (current_time - last_battery_update).total_seconds() >= 60:
                if simulation_state["battery_level"] > 5:
                    simulation_state["battery_level"] = max(5, simulation_state["battery_level"] - random.randint(1, 2))
                last_battery_update = current_time
                simulation_state["last_update"] = current_time.isoformat()
            
            # Update location automatically if not locked
            if not simulation_state["is_location_locked"] and random.random() < 0.03:
                # Move to a connected neighbor node
                current_node = simulation_state["user_node"]
                connected_nodes = []
                
                for road_key, road in network.roads.items():
                    if road.from_station == current_node:
                        connected_nodes.append(road.to_station)
                
                if connected_nodes:
                    new_node = random.choice(connected_nodes)
                    simulation_state["user_location"] = network.stations[new_node].location
                    simulation_state["user_node"] = new_node
            
            # DYNAMIC CHARGING STATION AVAILABILITY MANAGEMENT
            if (current_time - last_availability_update).total_seconds() >= 5:  # Update every 5 seconds
                network.update_charging_stations_availability()
                last_availability_update = current_time
            
            # Update vehicle movements
            vehicles_to_remove = []
            for vehicle_id, vehicle in network.vehicles.items():
                if vehicle.is_moving and (current_time - vehicle.last_move_time).total_seconds() >= 10:
                    if not vehicle.move_to_next_node():
                        vehicle.is_moving = False
                        if vehicle.current_node in network.charging_points:
                            available_points = network.get_available_points(vehicle.current_node)
                            if available_points:
                                point = random.choice(available_points)
                                point.occupy(f"Vehicle_{vehicle_id}", vehicle.battery_level, 100)
                                print(f"Vehicle {vehicle_id} started charging at {vehicle.current_node}")
                        vehicles_to_remove.append(vehicle_id)
            
            # Remove completed vehicles
            for vehicle_id in vehicles_to_remove:
                if vehicle_id in network.vehicles:
                    del network.vehicles[vehicle_id]
            
            # Spawn new vehicles
            if (current_time - last_vehicle_spawn).total_seconds() >= 8 and len(network.vehicles) < 12:
                normal_nodes = [node_id for node_id, node in network.stations.items() 
                              if not node.is_ev_station]
                ev_stations = [node_id for node_id, node in network.stations.items() 
                             if node.is_ev_station]
                
                if normal_nodes and ev_stations:
                    start_node = random.choice(normal_nodes)
                    target_station = random.choice(ev_stations)
                    battery = random.randint(15, 50)
                    network.add_vehicle(start_node, target_station, battery)
                    last_vehicle_spawn = current_time
            
            # Dynamic traffic updates
            if random.random() < 0.3:
                for road in network.roads.values():
                    change = random.uniform(-0.2, 0.3)
                    road.current_traffic = max(0.5, min(3.0, road.base_traffic + change))
            
            # Prepare update message
            network_data = await get_network()
            recommendations_data = await get_recommendations()
            
            update_data = {
                "type": "simulation_update",
                "batteryLevel": simulation_state["battery_level"],
                "userLocation": simulation_state["user_location"],
                "userNode": simulation_state["user_node"],
                "network": network_data,
                "recommendations": recommendations_data["recommendations"],
                "timestamp": simulation_state["last_update"]
            }
            
            await manager.broadcast(update_data)
            
        except Exception as e:
            print(f"Simulation error: {e}")
        
        await asyncio.sleep(3)

@app.on_event("startup")
async def startup_event():
    if not network.stations:
        initialize_network()
    
    print("Enhanced grid-based network initialized:")
    ev_count = sum(1 for station in network.stations.values() if getattr(station, 'is_ev_station', False))
    normal_count = len(network.stations) - ev_count
    print(f"  - EV Stations: {ev_count}")
    print(f"  - Normal Nodes: {normal_count}")
    print(f"  - Total Roads: {len([r for r in network.roads.values() if r.from_station < r.to_station])}")
    
    # Calculate average connections per node
    connections_per_node = {}
    for node_id in network.stations:
        connections = sum(1 for road in network.roads.values() if road.from_station == node_id)
        connections_per_node[node_id] = connections
    
    avg_connections = sum(connections_per_node.values()) / len(connections_per_node)
    print(f"  - Average connections per node: {avg_connections:.1f}")
    
    # Start simulation task
    asyncio.create_task(run_simulation())
    print("Enhanced simulation started")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
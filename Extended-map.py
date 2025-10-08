def initialize_network():
    print("Initializing EXPANSIVE NATURAL MAP with wide spacing...")
    
    # Create EV Stations with MUCH wider spacing across a larger area
    ev_stations = [
        # Downtown Core (spread out)
        ChargingStation('S1', 'City Center PowerHub', 21.1500, 79.0800, 12, 6, 6),
        ChargingStation('S2', 'Central Plaza EV', 21.1550, 79.0850, 8, 4, 4),
        ChargingStation('S3', 'Financial District Charge', 21.1450, 79.0750, 10, 5, 5),
        
        # North-West Sector (spread out)
        ChargingStation('S4', 'University EV Center', 21.1700, 79.0700, 10, 5, 5),
        ChargingStation('S5', 'Tech Park Power', 21.1750, 79.0650, 14, 8, 6),
        ChargingStation('S6', 'Research Campus EV', 21.1650, 79.0600, 8, 4, 4),
        
        # North-East Sector (far apart)
        ChargingStation('S7', 'Airport EV Terminal', 21.1800, 79.1000, 16, 10, 6),
        ChargingStation('S8', 'Cargo District EV', 21.1850, 79.0950, 8, 4, 4),
        ChargingStation('S9', 'Business Park Charge', 21.1750, 79.1050, 10, 5, 5),
        
        # South-West Sector (spread out)
        ChargingStation('S10', 'Old Town Square EV', 21.1300, 79.0650, 7, 3, 4),
        ChargingStation('S11', 'Heritage District', 21.1250, 79.0700, 6, 2, 4),
        ChargingStation('S12', 'Marketplace Charge', 21.1200, 79.0600, 9, 4, 5),
        
        # South-East Sector (wide spacing)
        ChargingStation('S13', 'Eastgate Community EV', 21.1350, 79.1000, 11, 6, 5),
        ChargingStation('S14', 'Highway Oasis EV', 21.1300, 79.1100, 15, 9, 6),
        ChargingStation('S15', 'Suburban Plaza EV', 21.1400, 79.1150, 9, 4, 5),
        
        # Northern Outer Ring (very spread out)
        ChargingStation('S16', 'Northern Gateway EV', 21.1950, 79.0850, 8, 4, 4),
        ChargingStation('S17', 'Hilltop EV Station', 21.1900, 79.0750, 6, 3, 3),
        
        # Southern Outer Ring (far apart)
        ChargingStation('S18', 'Southern Outpost EV', 21.1100, 79.0900, 7, 3, 4),
        ChargingStation('S19', 'Coastal EV Bay', 21.1150, 79.1000, 8, 4, 4),
        
        # Eastern Outer Ring
        ChargingStation('S20', 'Eastern Frontier EV', 21.1500, 79.1250, 10, 5, 5),
        ChargingStation('S21', 'Rural East EV', 21.1400, 79.1300, 6, 3, 3),
        
        # Western Outer Ring
        ChargingStation('S22', 'Western Plains EV', 21.1450, 79.0500, 8, 4, 4),
        ChargingStation('S23', 'Industrial EV Hub', 21.1550, 79.0450, 10, 5, 5),
        
        # Additional strategic locations
        ChargingStation('S24', 'Crossroads EV', 21.1600, 79.0900, 9, 4, 5),
        ChargingStation('S25', 'Central North EV', 21.1650, 79.0850, 7, 3, 4),
    ]
    
    # Create nodes with WIDE spacing across large area
    normal_nodes = []
    node_counter = 1
    
    # MUCH larger map area - 15km x 12km coverage
    lat_start, lat_end = 21.1000, 21.2000  # 11km north-south
    lon_start, lon_end = 79.0400, 79.1350  # 10.5km east-west
    
    print(f"Map Area: {lat_end-lat_start:.3f}° lat × {lon_end-lon_start:.3f}° lon")
    print("(~12km × 11km real distance)")
    
    # Generate urban core nodes (wider spread)
    urban_nodes = 60
    print(f"Generating {urban_nodes} urban nodes (wider spread)...")
    for i in range(urban_nodes):
        # Wider urban spread around downtown
        lat = 21.1500 + random.gauss(0, 0.010)  # ~1km spread (increased from 500m)
        lon = 79.0800 + random.gauss(0, 0.010)
        
        # Ensure within bounds
        lat = max(lat_start, min(lat_end, lat))
        lon = max(lon_start, min(lon_end, lon))
        
        node_id = f"U{node_counter}"
        normal_nodes.append(RoadNode(node_id, lat, lon))
        node_counter += 1
    
    # Generate university area nodes (spread out)
    university_nodes = 35
    print(f"Generating {university_nodes} university nodes...")
    for i in range(university_nodes):
        lat = 21.1700 + random.gauss(0, 0.008)  # Wider spread
        lon = 79.0700 + random.gauss(0, 0.008)
        
        lat = max(lat_start, min(lat_end, lat))
        lon = max(lon_start, min(lon_end, lon))
        
        node_id = f"E{node_counter}"
        normal_nodes.append(RoadNode(node_id, lat, lon))
        node_counter += 1
    
    # Generate airport area nodes (spread out)
    airport_nodes = 25
    print(f"Generating {airport_nodes} airport nodes...")
    for i in range(airport_nodes):
        lat = 21.1800 + random.gauss(0, 0.007)
        lon = 79.1000 + random.gauss(0, 0.007)
        
        lat = max(lat_start, min(lat_end, lat))
        lon = max(lon_start, min(lon_end, lon))
        
        node_id = f"A{node_counter}"
        normal_nodes.append(RoadNode(node_id, lat, lon))
        node_counter += 1
    
    # Generate widespread suburban nodes
    suburban_nodes = 80
    print(f"Generating {suburban_nodes} widespread suburban nodes...")
    for i in range(suburban_nodes):
        # Much wider suburban spread
        lat = 21.1500 + random.uniform(-0.025, 0.025)  # Increased from 0.015
        lon = 79.0800 + random.uniform(-0.025, 0.025)
        
        lat = max(lat_start, min(lat_end, lat))
        lon = max(lon_start, min(lon_end, lon))
        
        node_id = f"S{node_counter}"
        normal_nodes.append(RoadNode(node_id, lat, lon))
        node_counter += 1
    
    # Generate very spread out rural nodes
    rural_nodes = 60
    print(f"Generating {rural_nodes} very spread out rural nodes...")
    for i in range(rural_nodes):
        # Very wide rural spread
        lat = 21.1500 + random.uniform(-0.040, 0.040)  # Increased from 0.025
        lon = 79.0800 + random.uniform(-0.035, 0.035)
        
        lat = max(lat_start, min(lat_end, lat))
        lon = max(lon_start, min(lon_end, lon))
        
        node_id = f"R{node_counter}"
        normal_nodes.append(RoadNode(node_id, lat, lon))
        node_counter += 1
    
    print(f"✅ Created {len(ev_stations)} EV stations and {len(normal_nodes)} normal nodes")
    print(f"📏 Average EV station spacing: {calculate_average_ev_spacing(ev_stations):.1f} km")
    
    # Add all stations and nodes to network
    all_nodes = []
    for station in ev_stations:
        network.add_station(station)
        all_nodes.append(station)
    
    for node in normal_nodes:
        network.add_station(node)
        all_nodes.append(node)
    
    print("🛣️ Building EXPANSIVE road network with longer connections...")
    
    connection_count = 0
    
    # 1. Connect EV stations to nearby nodes with INCREASED range
    print("Phase 1: Connecting EV stations to local nodes (3km range)...")
    for ev_station in ev_stations:
        nearby_nodes = []
        
        for node in all_nodes:
            if node.id != ev_station.id and not (hasattr(node, 'is_ev_station') and node.is_ev_station):
                distance = network.calculate_distance(ev_station.location, node.location)
                if distance <= 3.0:  # INCREASED from 2.0km to 3.0km
                    nearby_nodes.append((node, distance))
        
        nearby_nodes.sort(key=lambda x: x[1])
        connections_to_make = min(5, len(nearby_nodes))  # Reduced from 6 to avoid over-connection
        
        for i in range(connections_to_make):
            if i < len(nearby_nodes):
                other_node, distance = nearby_nodes[i]
                road_key = f"{ev_station.id}-{other_node.id}"
                reverse_key = f"{other_node.id}-{ev_station.id}"
                
                if road_key not in network.roads and reverse_key not in network.roads:
                    network.add_road(ev_station.id, other_node.id, distance, 1.0)
                    connection_count += 1
    
    # 2. Connect nodes with INCREASED range for wider spacing
    print("Phase 2: Creating local node networks (2km range)...")
    for node in all_nodes:
        if hasattr(node, 'is_ev_station') and node.is_ev_station:
            continue
            
        nearby_nodes = []
        
        for other_node in all_nodes:
            if other_node.id != node.id:
                distance = network.calculate_distance(node.location, other_node.location)
                if distance <= 2.0:  # INCREASED from 1.5km to 2.0km
                    nearby_nodes.append((other_node, distance))
        
        nearby_nodes.sort(key=lambda x: x[1])
        connections_to_make = min(4, len(nearby_nodes))
        
        for i in range(connections_to_make):
            if i < len(nearby_nodes):
                other_node, distance = nearby_nodes[i]
                road_key = f"{node.id}-{other_node.id}"
                reverse_key = f"{other_node.id}-{node.id}"
                
                if road_key not in network.roads and reverse_key not in network.roads:
                    network.add_road(node.id, other_node.id, distance, 1.0)
                    connection_count += 1
    
    # 3. Connect EV stations to each other with MUCH INCREASED range
    print("Phase 3: Creating EV backbone network (8km range)...")
    ev_to_ev_connections = 0
    for i, ev1 in enumerate(ev_stations):
        for j, ev2 in enumerate(ev_stations):
            if i < j:  # Avoid duplicate connections
                distance = network.calculate_distance(ev1.location, ev2.location)
                if distance <= 8.0:  # INCREASED from 5.0km to 8.0km
                    road_key = f"{ev1.id}-{ev2.id}"
                    if road_key not in network.roads:
                        network.add_road(ev1.id, ev2.id, distance, 1.0)
                        connection_count += 1
                        ev_to_ev_connections += 1
    
    # 4. Add strategic longer connections to ensure connectivity
    print("Phase 4: Adding strategic long-distance connections...")
    long_connections = 0
    for i in range(50):  # Add strategic long connections
        node1 = random.choice(all_nodes)
        node2 = random.choice(all_nodes)
        
        if node1.id != node2.id:
            distance = network.calculate_distance(node1.location, node2.location)
            
            # Connect nodes that are between 3km and 6km apart (longer range)
            if 3.0 <= distance <= 6.0:
                road_key = f"{node1.id}-{node2.id}"
                reverse_key = f"{node2.id}-{node1.id}"
                
                if road_key not in network.roads and reverse_key not in network.roads:
                    network.add_road(node1.id, node2.id, distance, 1.0)
                    connection_count += 1
                    long_connections += 1
    
    total_roads = len([r for r in network.roads.values() if r.from_station < r.to_station])
    print(f"✅ EXPANSIVE ROAD NETWORK COMPLETE: {total_roads} total roads")
    print(f"   - EV-to-local: {connection_count - ev_to_ev_connections - long_connections} roads")
    print(f"   - EV-to-EV: {ev_to_ev_connections} roads") 
    print(f"   - Long-distance: {long_connections} roads")
    
    # COMPREHENSIVE CONNECTIVITY TEST WITH WIDER RANGES
    print("\n" + "="*60)
    print("EXPANSIVE NETWORK CONNECTIVITY REPORT")
    print("="*60)
    
    test_points = [
        ('S1', 'Downtown Core', '🏙️'),
        ('S4', 'University District', '🎓'),
        ('S7', 'Airport Area', '✈️'),
        ('S10', 'Old Town', '🏛️'),
        ('S13', 'Eastern Suburbs', '🏘️'),
        ('S16', 'Northern Gateway', '🌄'),
        ('S18', 'Southern Outpost', '🏜️'),
        ('S20', 'Eastern Frontier', '🌅'),
        ('S22', 'Western Plains', '🌾'),
        ('U1', 'Urban Node', '📍'),
        ('R1', 'Rural Node', '📍'),
    ]
    
    print("\n🌍 Wide-Area Connectivity (12km range check):")
    for test_id, location_name, emoji in test_points:
        if test_id in network.stations:
            test_node = network.stations[test_id]
            reachable_ev = 0
            closest_stations = []
            
            for station_id, station in network.stations.items():
                if hasattr(station, 'is_ev_station') and station.is_ev_station and station_id != test_id:
                    distance = network.calculate_distance(test_node.location, station.location)
                    if distance <= 12.0:  # INCREASED range check
                        path = network.find_shortest_path(test_id, station_id)
                        if len(path) > 1:
                            reachable_ev += 1
                            # Calculate path distance
                            path_dist = 0
                            for i in range(len(path) - 1):
                                road_key = f"{path[i]}-{path[i+1]}"
                                if road_key in network.roads:
                                    path_dist += network.roads[road_key].distance
                            closest_stations.append((station_id, distance, path_dist))
            
            closest_stations.sort(key=lambda x: x[1])
            
            # Assess connectivity for this expansive map
            if reachable_ev >= 8:
                status = "🟢 EXCELLENT"
            elif reachable_ev >= 5:
                status = "🟡 GOOD"
            elif reachable_ev >= 3:
                status = "🟠 FAIR"
            else:
                status = "🔴 POOR"
            
            print(f"{emoji} {location_name}: {status} - {reachable_ev} EV stations reachable")
            
            # Show closest station info
            if closest_stations:
                closest_id, straight_dist, path_dist = closest_stations[0]
                efficiency = path_dist / straight_dist if straight_dist > 0 else 1.0
                print(f"     Nearest: {closest_id} - {straight_dist:.1f}km straight → {path_dist:.1f}km route ({efficiency:.1f}x)")
    
    print(f"\n📊 EXPANSIVE NETWORK SUMMARY:")
    print(f"   🔌 EV Stations: {len(ev_stations)} across wide area")
    print(f"   📍 Total Nodes: {len(all_nodes)} with generous spacing")
    print(f"   🛣️ Total Roads: {total_roads}")
    print(f"   📏 Map Size: ~12km × 11km")
    print(f"   🔗 Avg EV Spacing: {calculate_average_ev_spacing(ev_stations):.1f} km")
    
    # Test long-distance routes
    print(f"\n🧪 Long-Distance Route Tests:")
    long_routes = [
        ('S1', 'S7', 'Downtown to Airport'),
        ('S10', 'S20', 'Old Town to Eastern Frontier'),
        ('S16', 'S18', 'Northern to Southern'),
        ('S22', 'S13', 'Western to Eastern'),
    ]
    
    for from_id, to_id, route_name in long_routes:
        if from_id in network.stations and to_id in network.stations:
            path = network.find_shortest_path(from_id, to_id)
            if len(path) > 1:
                distance = 0
                for i in range(len(path) - 1):
                    road_key = f"{path[i]}-{path[i+1]}"
                    if road_key in network.roads:
                        distance += network.roads[road_key].distance
                straight_dist = network.calculate_distance(
                    network.stations[from_id].location,
                    network.stations[to_id].location
                )
                print(f"   ✅ {route_name}: {straight_dist:.1f}km straight → {distance:.1f}km route ({len(path)-1} segments)")
            else:
                print(f"   ❌ {route_name}: No path found")
    
    print("="*60)
    print("🚀 EXPANSIVE NETWORK READY - Optimal for long-range AI navigation!")
    print("="*60)
    
    return True

def calculate_average_ev_spacing(ev_stations):
    """Calculate average distance between EV stations"""
    if len(ev_stations) < 2:
        return 0
    
    total_distance = 0
    count = 0
    
    for i, ev1 in enumerate(ev_stations):
        for j, ev2 in enumerate(ev_stations):
            if i < j:
                distance = network.calculate_distance(ev1.location, ev2.location)
                total_distance += distance
                count += 1
    
    return total_distance / count if count > 0 else 0








# FOR PREV APP (NO of NODES aND EVS)

# def initialize_network():
#     print("Initializing proper grid-based network...")
    
#     # Create 15 EV Stations
#     ev_stations = [
#         # Central area (closer stations)
#         ChargingStation('S1', 'Downtown PowerHub', 21.1520, 79.0980, 8, 4, 4, 3, 3),
#         ChargingStation('S2', 'Central Plaza Charge', 21.1500, 79.1020, 6, 3, 3, 4, 4),
#         ChargingStation('S3', 'Metro Station EV', 21.1480, 79.1000, 10, 5, 5, 3, 5),
        
#         # Northern area
#         ChargingStation('S4', 'Northgate Charging', 21.1620, 79.0950, 6, 3, 3, 2, 1),
#         ChargingStation('S5', 'University Power', 21.1580, 79.0900, 8, 4, 4, 1, 2),
        
#         # Southern area
#         ChargingStation('S6', 'Southside Charge', 21.1420, 79.1000, 7, 3, 4, 4, 6),
#         ChargingStation('S7', 'Mall Parking EV', 21.1400, 79.0950, 9, 5, 4, 2, 7),
        
#         # Eastern area
#         ChargingStation('S8', 'Eastgate Power', 21.1500, 79.1150, 8, 4, 4, 6, 4),
#         ChargingStation('S9', 'Highway East EV', 21.1450, 79.1200, 12, 8, 4, 7, 5),
        
#         # Western area
#         ChargingStation('S10', 'Westgate Charging', 21.1500, 79.0850, 7, 3, 4, 1, 4),
#         ChargingStation('S11', 'Old Town EV', 21.1480, 79.0800, 5, 2, 3, 0, 5),
        
#         # Additional stations
#         ChargingStation('S12', 'Airport EV Zone', 21.1650, 79.1050, 10, 6, 4, 5, 1),
#         ChargingStation('S13', 'Stadium Charge', 21.1600, 79.1100, 8, 4, 4, 6, 2),
#         ChargingStation('S14', 'Hospital EV', 21.1550, 79.1150, 6, 3, 3, 5, 3),
#         ChargingStation('S15', 'Business Park', 21.1350, 79.0900, 8, 4, 4, 1, 7),
#     ]
    
#     # Create grid-based normal nodes (7x7 grid for better structure)
#     normal_nodes = []
    
#     grid_size = 10  # 7x7 grid
#     lat_start, lat_end = 21.1300, 21.1700
#     lon_start, lon_end = 79.0750, 79.1250
    
#     lat_step = (lat_end - lat_start) / (grid_size - 1)
#     lon_step = (lon_end - lon_start) / (grid_size - 1)
    
#     node_counter = 1
    
#     # Create grid nodes
#     for i in range(grid_size):
#         for j in range(grid_size):
#             # Add some randomness to make it look more natural
#             lat_variation = random.uniform(-0.001, 0.001)
#             lon_variation = random.uniform(-0.001, 0.001)
            
#             lat = lat_start + i * lat_step + lat_variation
#             lon = lon_start + j * lon_step + lon_variation
            
#             node_id = f"N{node_counter}"
#             normal_nodes.append(RoadNode(node_id, lat, lon, j, i))
#             node_counter += 1
    
#     print(f"Created {len(ev_stations)} EV stations and {len(normal_nodes)} normal nodes")
    
#     # Add all stations and nodes to network
#     for station in ev_stations:
#         network.add_station(station)
    
#     for node in normal_nodes:
#         network.add_station(node)
    
#     # Create proper grid connections (like a real map)
#     all_nodes = {**{s.id: s for s in ev_stations}, **{n.id: n for n in normal_nodes}}
    
#     # Connect nodes in grid pattern (each node connects to neighbors)
#     for node_id, node in all_nodes.items():
#         current_x = node.grid_x
#         current_y = node.grid_y
        
#         # Define possible neighbors (right, left, down, up)
#         neighbors = [
#             (current_x + 1, current_y),  # right
#             (current_x - 1, current_y),  # left  
#             (current_x, current_y + 1),  # down
#             (current_x, current_y - 1),  # up
#         ]
        
#         # Also add diagonal connections for more natural map (optional)
#         if random.random() > 0.7:  # 30% chance for diagonal connections
#             neighbors.extend([
#                 (current_x + 1, current_y + 1),  # down-right
#                 (current_x - 1, current_y + 1),  # down-left
#             ])
        
#         connected_count = 0
#         max_connections = random.randint(2, 4)  # Each node connects to 2-4 neighbors
        
#         for nx, ny in neighbors:
#             if connected_count >= max_connections:
#                 break
                
#             # Find node at this grid position
#             neighbor_node = next((n for n in all_nodes.values() if n.grid_x == nx and n.grid_y == ny), None)
            
#             if neighbor_node and neighbor_node.id != node_id:
#                 # Check if road already exists
#                 road_key = f"{node_id}-{neighbor_node.id}"
#                 reverse_key = f"{neighbor_node.id}-{node_id}"
                
#                 if road_key not in network.roads and reverse_key not in network.roads:
#                     distance = network.calculate_distance(node.location, neighbor_node.location)
#                     # Add some traffic variation based on location
#                     base_traffic = 1.0 + random.uniform(-0.2, 0.3)
                    
#                     network.add_road(node_id, neighbor_node.id, distance, base_traffic)
#                     connected_count += 1
    
#     print(f"Network created with {len(network.roads)//2} roads (proper grid structure)")
    
#     # Verify connectivity
#     test_path = network.find_shortest_path('N1', 'S1')
#     print(f"Test path from N1 to S1: {len(test_path)} nodes")
    
#     return True
import urllib.request
import urllib.parse
import time
import random
import math

# OsmAnd protocol usually listens on 5055 by default in Traccar
SERVER_URL = "http://localhost:5055"
DEVICE_ID = "1234567890"  # Replace with your device's identifier / IMEI

# Realistic starting coordinates (Near GeoSurePath HQ concept)
BASE_LAT = 18.5204
BASE_LON = 73.8567

class GPSSimulator:
    def __init__(self, device_id):
        self.device_id = device_id
        self.lat = BASE_LAT
        self.lon = BASE_LON
        self.speed = 0.0
        self.course = 0
        self.altitude = 50.0
        self.battery = 100.0

    def move(self):
        # Simulate acceleration/deceleration
        target_speed = random.uniform(20, 80) # km/h
        self.speed += (target_speed - self.speed) * 0.1
        
        # Simluate course change
        self.course = (self.course + random.randint(-15, 15)) % 360
        
        # Calculate new position based on speed and course
        # roughly: 1 deg lat = 111km, 1 deg lon = 111km * cos(lat)
        dist_per_sec = (self.speed / 3600.0) # km per second
        # 5 second intervals
        dist = dist_per_sec * 5
        
        angle_rad = math.radians(self.course)
        self.lat += (dist / 111.0) * math.cos(angle_rad)
        self.lon += (dist / (111.0 * math.cos(math.radians(self.lat)))) * math.sin(angle_rad)
        
        self.battery = max(5.0, self.battery - random.uniform(0.01, 0.05))

    def get_url(self):
        timestamp = int(time.time())
        # Add attributes like battery and alarm (occasionally)
        alarm_str = "&alarm=sos" if random.random() < 0.05 else ""
        return (f"{SERVER_URL}/?id={self.device_id}&lat={self.lat:.6f}&lon={self.lon:.6f}"
                f"&timestamp={timestamp}&altitude={self.altitude:.1f}&speed={self.speed:.2f}"
                f"&course={self.course}&batteryLevel={int(self.battery)}{alarm_str}")

def send_data(url):
    try:
        print(f"Pinching: {url}")
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            return response.status == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    print(f"--- GeoSurePath Premium Data Feed Simulator ---")
    print(f"Target: {SERVER_URL} | Device: {DEVICE_ID}")
    sim = GPSSimulator(DEVICE_ID)
    
    try:
        while True:
            sim.move()
            url = sim.get_url()
            success = send_data(url)
            if not success:
                print("!! Backend unreachable. Retrying in 5s...")
            time.sleep(5)
    except KeyboardInterrupt:
        print("\nSimulator stopped.")

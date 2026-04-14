import urllib.request
import urllib.error
import random
import time
import threading
from datetime import datetime

# Configuration
TRACCAR_HOST = "127.0.0.1"
TRACCAR_PORT = 5055 # OsmAnd port
NUM_DEVICES = 25
INTERVAL = 5 # seconds

def simulate_device(index):
    device_id = f"sim_{index:04d}"
    
    # Starting location somewhere in NYC
    lat = 40.7128 + (random.random() - 0.5) * 0.1
    lon = -74.0060 + (random.random() - 0.5) * 0.1
    
    ignition = True
    speed = 0
    while True:
        try:
            # Move slightly
            if ignition:
                lat += (random.random() - 0.5) * 0.001
                lon += (random.random() - 0.5) * 0.001
                speed = random.randint(10, 100) # km/h
            else:
                speed = 0
            
            timestamp = int(time.time())
            
            # Randomly toggle ignition every ~20 cycles
            if random.random() < 0.05:
                ignition = not ignition
                
            # Randomly trigger an alarm (like sos or speeding)
            alarm = ""
            if random.random() < 0.05:
                alarms = ["sos", "overspeed", "hardAcceleration", "hardBraking"]
                alarm = random.choice(alarms)
                
            url = f"http://{TRACCAR_HOST}:{TRACCAR_PORT}/?id={device_id}&lat={lat}&lon={lon}&speed={speed}&timestamp={timestamp}&ignition={'true' if ignition else 'false'}"
            if alarm:
                url += f"&alarm={alarm}"
            
            req = urllib.request.Request(url, method="GET")
            response = urllib.request.urlopen(req, timeout=2)
            if response.status != 200:
                print(f"Error for device {device_id}: Code {response.status}")
                
        except Exception as e:
            pass # ignore timeouts
        
        time.sleep(INTERVAL)

def main():
    print(f"Starting simulation of {NUM_DEVICES} devices with alerts and ignition...")
    threads = []
    for i in range(1, NUM_DEVICES + 1):
        t = threading.Thread(target=simulate_device, args=(i,))
        t.daemon = True
        t.start()
        threads.append(t)
        time.sleep(0.05) # Delay to prevent spike

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Stopping simulation.")

if __name__ == "__main__":
    main()

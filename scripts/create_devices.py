import urllib.request
import urllib.error
import json
import base64
import time

# HTTP Basic Auth: admin@example.com / admin -> Traccar default or local Mock admin
auth_string = 'admin@example.com:admin'
base64_auth = base64.b64encode(auth_string.encode('utf-8')).decode('utf-8')

def create_device(index):
    unique_id = f"sim_{index:04d}"
    name = f"Test_Vehicle_{index}"
    url = "http://127.0.0.1:8082/api/devices"
    
    data = {"name": name, "uniqueId": unique_id}
    data_bytes = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(url, data=data_bytes, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Basic {base64_auth}")
    
    try:
        response = urllib.request.urlopen(req)
        if response.status in [200, 201]:
            print(f"Created device: {name} ({unique_id})")
    except urllib.error.HTTPError as e:
        if e.code == 400:
            print(f"Device likely exists: {name} ({unique_id}) - Error: {e.read().decode('utf-8')}")
        else:
            print(f"Failed to create {name}: {e.code} - {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error creating {name}: {e}")

if __name__ == "__main__":
    print("Creating 25 simulation devices...")
    for i in range(1, 26):
        create_device(i)
        time.sleep(0.1)
    print("Device creation finished.")

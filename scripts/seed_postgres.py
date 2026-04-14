import psycopg2

def run():
    conn = psycopg2.connect(
        dbname="geosurepath",
        user="geosurepath",
        password="change-this-to-something-long-and-random",
        host="127.0.0.1",
        port="5432"
    )
    cur = conn.cursor()
    
    print("Checking for tc_devices or devices table...")
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
    tables = [r[0] for r in cur.fetchall()]
    print("Tables in public schema:", tables)
    
    device_table = "tc_devices" if "tc_devices" in tables else "devices"
    
    print(f"Using {device_table} for insertion.")
    
    for i in range(1, 26):
        name = f"Test_Vehicle_{i}"
        uniqueid = f"sim_{i:04d}"
        
        # Check if exists
        cur.execute(f"SELECT id FROM {device_table} WHERE uniqueid = %s", (uniqueid,))
        if cur.fetchone() is None:
            cur.execute(f"INSERT INTO {device_table} (name, uniqueid) VALUES (%s, %s)", (name, uniqueid))
            print(f"Inserted {name}")
        else:
            print(f"Already exists {name}")
            
    conn.commit()
    cur.close()
    conn.close()
    print("Done seeding.")

if __name__ == "__main__":
    run()

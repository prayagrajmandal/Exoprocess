from app.services.tms import fetch_all
import json

def check_schema():
    print("Columns in vehicle_assignments:")
    rows = fetch_all("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'vehicle_assignments'
    """)
    for row in rows:
        print(f"- {row['column_name']} ({row['data_type']})")

    print("\nColumns in gate_passes:")
    rows = fetch_all("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'gate_passes'
    """)
    for row in rows:
        print(f"- {row['column_name']} ({row['data_type']})")

if __name__ == "__main__":
    check_schema()

from app.services.tms import fetch_all
import json

def check_data():
    print("Top 5 vehicle_assignments:")
    rows = fetch_all("SELECT id, delivery_id, challan_number FROM vehicle_assignments LIMIT 5")
    for row in rows:
        print(f"ID: {row['id']}, Delivery: {row['delivery_id']}, Challan: {row['challan_number']}")

if __name__ == "__main__":
    check_data()

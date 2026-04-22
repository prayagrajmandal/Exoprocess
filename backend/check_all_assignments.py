from app.services.tms import fetch_all
import json

def check_data():
    rows = fetch_all("SELECT id, delivery_id, challan_number FROM vehicle_assignments")
    print(f"Total assignments: {len(rows)}")
    with_challan = [r for r in rows if r['challan_number']]
    print(f"Assignments with challan number: {len(with_challan)}")
    for row in with_challan:
        print(f"ID: {row['id']}, Delivery: {row['delivery_id']}, Challan: {row['challan_number']}")

if __name__ == "__main__":
    check_data()

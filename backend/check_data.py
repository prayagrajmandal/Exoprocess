from app.services.tms import fetch_all
import json

def check_data():
    print("Top 5 gate_passes:")
    rows = fetch_all("SELECT gate_pass_number, challan_number, order_id FROM gate_passes LIMIT 5")
    for row in rows:
        print(f"GP: {row['gate_pass_number']}, Challan: {row['challan_number']}, Order: {row['order_id']}")

if __name__ == "__main__":
    check_data()

from app.services.tms import fetch_all, fetch_one, execute
from datetime import datetime, timezone

def sync():
    print("Fetching existing vehicle assignments...")
    assignments = fetch_all("SELECT * FROM vehicle_assignments")
    print(f"Found {len(assignments)} assignments.")

    count = 0
    for assignment in assignments:
        gp_num = assignment.get("gate_pass_id")
        if not gp_num:
            continue
            
        print(f"Syncing {gp_num} for delivery {assignment.get('delivery_id')}...")
        
        # Find IDs
        v_row = fetch_one("SELECT id FROM vehicles WHERE vehicle_number = %s LIMIT 1", (assignment.get("assigned_vehicle_id"),))
        d_row = fetch_one("SELECT id FROM drivers WHERE driver_code = %s LIMIT 1", (assignment.get("assigned_driver_id"),))
        o_row = fetch_one("SELECT id FROM orders WHERE order_number = %s LIMIT 1", (assignment.get("delivery_id"),))
        org_row = fetch_one("SELECT id FROM organizations WHERE name = %s LIMIT 1", (assignment.get("organization"),))
        
        execute(
            """
            INSERT INTO gate_passes (
                gate_pass_number, organization_id, order_id, vehicle_id, driver_id, 
                gate_status, remarks, security_person_name, created_at, updated_at
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (gate_pass_number) DO UPDATE SET
                organization_id = EXCLUDED.organization_id,
                order_id = EXCLUDED.order_id,
                vehicle_id = EXCLUDED.vehicle_id,
                driver_id = EXCLUDED.driver_id,
                remarks = EXCLUDED.remarks,
                security_person_name = EXCLUDED.security_person_name,
                updated_at = NOW()
            """,
            (
                gp_num,
                org_row["id"] if org_row else None,
                o_row["id"] if o_row else None,
                v_row["id"] if v_row else None,
                d_row["id"] if d_row else None,
                (assignment.get("gate_pass_status") or "Pending").lower(),
                assignment.get("notes") or "Auto-synced from Vehicle Assignment",
                assignment.get("assigned_by") or "System",
                assignment.get("created_at") or datetime.now(timezone.utc),
                datetime.now(timezone.utc)
            )
        )
        count += 1

    print(f"Successfully synced {count} assignments to gate_passes.")

if __name__ == "__main__":
    sync()

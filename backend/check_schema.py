from app.services.tms import fetch_all, ensure_custom_tables
import json

def check_schema():
    ensure_custom_tables()
    columns = fetch_all("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'vehicle_assignments'
    """)
    print("Columns in vehicle_assignments:")
    for col in columns:
        print(f"- {col['column_name']}: {col['data_type']}")

    constraints = fetch_all("""
        SELECT conname, contype 
        FROM pg_constraint 
        WHERE conrelid = 'vehicle_assignments'::regclass
    """)
    print("\nConstraints in vehicle_assignments:")
    for con in constraints:
        print(f"- {con['conname']}: {con['contype']}")

if __name__ == "__main__":
    check_schema()

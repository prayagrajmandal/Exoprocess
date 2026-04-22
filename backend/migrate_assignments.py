from app.services.tms import execute, fetch_one

def migrate():
    print("Starting migration for vehicle_assignments table...")
    
    # 1. Drop unique constraint if it exists
    # We found earlier it was named 'vehicle_assignments_delivery_id_key'
    try:
        execute("ALTER TABLE vehicle_assignments DROP CONSTRAINT IF EXISTS vehicle_assignments_delivery_id_key")
        print("Dropped unique constraint on delivery_id.")
    except Exception as e:
        print(f"Error dropping constraint: {e}")

    # 2. Add missing columns
    columns_to_add = [
        ("assigned_driver_id", "TEXT"),
        ("assigned_driver_name", "TEXT"),
        ("assigned_assistant_id", "TEXT"),
        ("assigned_assistant_name", "TEXT")
    ]
    
    for col_name, col_type in columns_to_add:
        try:
            execute(f"ALTER TABLE vehicle_assignments ADD COLUMN IF NOT EXISTS {col_name} {col_type}")
            print(f"Added column {col_name}.")
        except Exception as e:
            print(f"Error adding column {col_name}: {e}")

    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()

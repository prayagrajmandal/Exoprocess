from app.services.tms import fetch_all
import json

def list_tables():
    print("Listing all tables:")
    rows = fetch_all("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    for row in rows:
        print(f"- {row['table_name']}")

if __name__ == "__main__":
    list_tables()

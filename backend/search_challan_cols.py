from app.services.tms import fetch_all
import json

def search_challan_cols():
    print("Searching for columns with 'challan' in all tables:")
    # Using %% to escape % for psycopg
    rows = fetch_all("""
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE column_name LIKE '%%challan%%'
    """)
    for row in rows:
        print(f"- {row['table_name']}.{row['column_name']}")

if __name__ == "__main__":
    search_challan_cols()

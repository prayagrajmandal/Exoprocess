from app.services.tms import fetch_all
import json

def check_invoices_schema():
    print("Columns in invoices:")
    rows = fetch_all("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'invoices'
    """)
    for row in rows:
        print(f"- {row['column_name']} ({row['data_type']})")

if __name__ == "__main__":
    check_invoices_schema()

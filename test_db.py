import psycopg

DATABASE_URL="postgresql://neondb_owner:npg_pwGbV4XDa6uA@ep-lucky-thunder-amhett3y-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

print("Connecting...")
try:
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            print("Row:", cur.fetchone())
    print("Success")
except Exception as e:
    print(f"Error: {e}")

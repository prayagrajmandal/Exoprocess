import time
from app.services.tms import fetch_one

start = time.time()
fetch_one("SELECT 1")
print("Query 1:", time.time() - start)

start = time.time()
fetch_one("SELECT 1")
print("Query 2:", time.time() - start)

start = time.time()
for _ in range(10):
    fetch_one("SELECT 1")
print("10 Queries:", time.time() - start)

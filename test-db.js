const { Client } = require('pg');
const fs = require('fs');

let dbUrl = '';
try {
  const env = fs.readFileSync('.env.local', 'utf8');
  const match = env.match(/DATABASE_URL="([^"]+)"/);
  if (match) dbUrl = match[1];
} catch (e) {}

if (!dbUrl) {
  console.error("Could not find DATABASE_URL in .env.local");
  process.exit(1);
}

console.log("Attempting to connect to:", dbUrl.split('@')[1] || "Database...");

const client = new Client({ connectionString: dbUrl });
client.connect()
  .then(() => {
    console.log("✅ Database connected successfully!");
    return client.query('SELECT current_database(), current_user, now()');
  })
  .then(res => {
    console.log("📝 Query successful!");
    console.log("Database:", res.rows[0].current_database);
    console.log("User:", res.rows[0].current_user);
    console.log("Server Time:", res.rows[0].now);
    client.end();
  })
  .catch(err => {
    console.error("❌ Connection failed:", err.message);
    process.exit(1);
  });

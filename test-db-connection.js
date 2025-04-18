const { Client } = require("pg");
require("dotenv").config({ path: ".env.local" });

async function testConnection() {
  console.log("Database URL:", process.env.DATABASE_URL);

  // Create a client with SSL options
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // Less secure but helps with initial troubleshooting
    },
  });

  try {
    console.log("Attempting to connect to the database...");
    await client.connect();
    console.log("Successfully connected to the PostgreSQL database!");

    // Test a simple query
    const result = await client.query("SELECT NOW() as current_time");
    console.log("Current database time:", result.rows[0].current_time);

    await client.end();
  } catch (error) {
    console.error("Error connecting to the database:", error);
    console.error(
      "Connection details (without password):",
      process.env.DATABASE_URL.replace(/:[^:]*@/, ":***@")
    );
  }
}

testConnection();

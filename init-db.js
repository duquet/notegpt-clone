const { Pool } = require("pg");
const fs = require("fs");
const dotenv = require("dotenv");

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

async function initializeDatabase() {
  // Create a connection pool
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("Connecting to database...");

    // Read the schema SQL file
    const schemaSql = fs.readFileSync("./db-schema.sql", "utf8");

    console.log("Initializing database schema...");

    // Execute the schema SQL
    await pool.query(schemaSql);

    console.log("Database initialization completed successfully!");

    // Test query to confirm tables were created
    const tables = await pool.query(`
      SELECT tablename 
      FROM pg_catalog.pg_tables 
      WHERE schemaname = 'public';
    `);

    console.log("Created tables:");
    tables.rows.forEach((table) => {
      console.log(`- ${table.tablename}`);
    });
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the initialization
initializeDatabase();

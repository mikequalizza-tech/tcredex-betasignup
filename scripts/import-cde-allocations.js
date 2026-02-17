// Import 2025 NMTC CDE Allocation Winners into database
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Read .env.local manually without dotenv
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
envContent.split("\n").forEach((line) => {
  if (!line || line.trim().startsWith("#")) return;
  const idx = line.indexOf("=");
  if (idx > 0) {
    const key = line.substring(0, idx).trim();
    const value = line.substring(idx + 1).trim();
    process.env[key] = value;
  }
});

// Simple CSV parser
function parseCSV(content) {
  const lines = content.split("\n");
  const headers = parseCSVLine(lines[0]);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

// Parse allocation amount from string like "$70,000,000"
function parseAmount(amountStr) {
  if (!amountStr) return 0;
  return parseInt(amountStr.replace(/[$,]/g, ""), 10) || 0;
}

// Map service area to array format
function mapServiceArea(serviceArea) {
  if (!serviceArea) return "national";
  const lower = serviceArea.toLowerCase();
  if (lower.includes("national")) return "national";
  if (lower.includes("statewide")) return "statewide";
  if (lower.includes("multi-state")) return "regional";
  if (lower.includes("local")) return "local";
  return "regional";
}

async function importCDEs() {
  const csvPath = path.join(
    __dirname,
    "..",
    "..",
    "tracts",
    "2025_NMTC_allocates.csv",
  );

  if (!fs.existsSync(csvPath)) {
    console.error("CSV file not found:", csvPath);
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf8");
  const rows = parseCSV(csvContent);

  console.log(`Found ${rows.length} CDE allocations to import`);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      const name = row["ALLOCATEE"]?.trim();
      const controllingEntity = row["CONTROLLING ENTITY"]?.trim();
      const city = row["CITY"]?.trim();
      const state = row["STATE"]?.trim();
      const serviceArea = row["SERVICE AREA"]?.trim();
      const amount = parseAmount(row["AMOUNT"]);
      const strategyTag = row["STRATEGY TAG"]?.trim();

      if (!name) {
        console.log("Skipping row with no name");
        skipped++;
        continue;
      }

      try {
        // Check if organization already exists
        const existingOrg = await client.query(
          `SELECT id FROM organizations WHERE LOWER(name) = LOWER($1)`,
          [name],
        );

        let orgId;

        if (existingOrg.rows.length > 0) {
          orgId = existingOrg.rows[0].id;
          console.log(`  Org exists: ${name}`);
        } else {
          // Create slug from name
          const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .substring(0, 100);

          // Create new organization
          const orgResult = await client.query(
            `INSERT INTO organizations (name, slug, type, city, state)
             VALUES ($1, $2, 'cde', $3, $4)
             RETURNING id`,
            [name, slug, city, state],
          );
          orgId = orgResult.rows[0].id;
          console.log(`  Created org: ${name}`);
        }

        // Check if CDE record already exists
        const existingCDE = await client.query(
          `SELECT id FROM cdes WHERE organization_id = $1`,
          [orgId],
        );

        if (existingCDE.rows.length > 0) {
          // Update existing CDE with 2025 allocation info
          await client.query(
            `UPDATE cdes SET
               total_allocation = $2,
               remaining_allocation = $2,
               service_area_type = $3,
               parent_organization = $4,
               primary_states = CASE WHEN $5 = 'statewide' THEN ARRAY[$6] ELSE primary_states END
             WHERE organization_id = $1`,
            [
              orgId,
              amount,
              mapServiceArea(serviceArea),
              controllingEntity !== "(Self-Managed)" ? controllingEntity : null,
              serviceArea?.toLowerCase(),
              state,
            ],
          );
          console.log(
            `  Updated CDE: ${name} - $${(amount / 1000000).toFixed(0)}M`,
          );
        } else {
          // Create new CDE record
          await client.query(
            `INSERT INTO cdes (
               organization_id,
               total_allocation,
               remaining_allocation,
               service_area_type,
               parent_organization,
               primary_states,
               year_established,
               mission_statement
             ) VALUES ($1, $2, $2, $3, $4, $5, 2025, $6)`,
            [
              orgId,
              amount,
              mapServiceArea(serviceArea),
              controllingEntity !== "(Self-Managed)" ? controllingEntity : null,
              serviceArea?.toLowerCase() === "statewide" ? [state] : null,
              `NMTC allocation recipient (${strategyTag || "Standard"})`,
            ],
          );
          console.log(
            `  Created CDE: ${name} - $${(amount / 1000000).toFixed(0)}M`,
          );
        }

        imported++;
      } catch (err) {
        console.error(`  Error importing ${name}:`, err.message);
        errors++;
      }
    }

    await client.query("COMMIT");

    console.log("\n=== Import Summary ===");
    console.log(`Imported: ${imported}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log("Done!");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Import failed:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

importCDEs().catch(console.error);

import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ override: true });

async function runMigration() {
  console.log("Starting database migration script...");

  try {
    // Make sure we have a config file or fallback to specifying it
    const configPath = fs.existsSync('./src/db/drizzle.config.ts') 
       ? './src/db/drizzle.config.ts' 
       : 'drizzle.config.ts';
       
    console.log(`Using config at: ${configPath}`);
    console.log("Running Drizzle Kit push to Supabase...");
    
    execSync(`npx drizzle-kit push --config=${configPath}`, {
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    console.log("Schema pushed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

runMigration();

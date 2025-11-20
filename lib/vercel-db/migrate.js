/**
 * Database migration script for Vercel Postgres
 *
 * This script initializes the database schema.
 * Run this once after creating your Vercel Postgres database.
 *
 * Usage:
 *   node lib/vercel-db/migrate.js
 *
 * Or run the SQL directly in Vercel dashboard.
 */

const { sql } = require('@vercel/postgres');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    console.log('🔄 Starting database migration...');

    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Split by statement (simple approach - works for our schema)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`\n[${i + 1}/${statements.length}] Executing...`);

      try {
        await sql.query(statement);
        console.log('✅ Success');
      } catch (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists')) {
          console.log('⚠️  Already exists, skipping');
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Database migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Sync data from POS using the sync API');
    console.log('2. Deploy your application to Vercel');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('\nTroubleshooting:');
    console.error('- Verify POSTGRES_URL environment variable is set');
    console.error('- Check Vercel dashboard for database connection');
    console.error('- You can also run schema.sql manually in Vercel dashboard');
    process.exit(1);
  }
}

// Run migration
migrate();

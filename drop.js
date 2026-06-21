const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('DROP TABLE IF EXISTS meals, orders, reviews, users CASCADE')
  .then(() => { console.log('Dropped tables'); process.exit(0); })
  .catch(console.error);

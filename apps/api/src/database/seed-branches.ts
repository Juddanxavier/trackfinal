import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    const orgResult = await pool.query(
      "SELECT id, name FROM organisations WHERE name ILIKE '%lanka%'",
    );

    if (orgResult.rows.length === 0) {
      console.log('No Sri Lanka org found');
      return;
    }

    const sriLankaId = orgResult.rows[0].id;
    console.log('Sri Lanka org:', sriLankaId, orgResult.rows[0].name);

    const branches = [
      { name: 'Colombo', city: 'Colombo' },
      { name: 'Kandy', city: 'Kandy' },
      { name: 'Galle', city: 'Galle' },
      { name: 'Jaffna', city: 'Jaffna' },
      { name: 'Negombo', city: 'Negombo' },
      { name: 'Anuradhapura', city: 'Anuradhapura' },
      { name: 'Kurunegala', city: 'Kurunegala' },
      { name: 'Ratnapura', city: 'Ratnapura' },
      { name: 'Matale', city: 'Matale' },
    ];

    for (const b of branches) {
      await pool.query(
        `INSERT INTO branches (organisation_id, name, city, country_code, is_active) 
         VALUES ($1, $2, $3, 'LK', true)`,
        [sriLankaId, b.name, b.city],
      );
      console.log('Created branch:', b.name);
    }

    console.log('Done! Created 9 branches');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

main();

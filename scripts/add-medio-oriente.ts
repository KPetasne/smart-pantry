/**
 * Simple script to add Medio Oriente country to existing countries table
 */

import 'dotenv/config';
import { query } from '../lib/db';

async function addMedioOriente() {
  try {
    console.log('🌍 Adding Medio Oriente to countries table...\n');
    
    // Insert Medio Oriente country
    const result = await query(
      `INSERT INTO countries (code, name, flag_emoji) 
       VALUES ($1, $2, $3)
       ON CONFLICT (code) DO NOTHING
       RETURNING *`,
      ['ME', 'Medio Oriente', '🌍']
    );

    if (result.length > 0) {
      console.log('✅ Medio Oriente added successfully!');
      console.log(`   Code: ${result[0].code}`);
      console.log(`   Name: ${result[0].name}`);
    } else {
      console.log('ℹ️  Medio Oriente already exists in the database.');
    }

    // Verify all countries
    const allCountries = await query('SELECT code, name, flag_emoji FROM countries ORDER BY name');
    console.log('\n📊 All countries in database:');
    allCountries.forEach(country => {
      console.log(`   ${country.flag_emoji} ${country.code}: ${country.name}`);
    });

    console.log('\n✅ Operation completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding Medio Oriente:', error);
    process.exit(1);
  }
}

// Run script
addMedioOriente();

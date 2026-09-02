const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length > 0) {
        process.env[key.trim()] = vals.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Read data/turkey-cities.ts content
const turkeyCitiesFile = fs.readFileSync(path.resolve(process.cwd(), 'data/turkey-cities.ts'), 'utf-8');
const match = turkeyCitiesFile.match(/export const turkeyCities: TurkeyCity\[\] = (\[[\s\S]*?\]);/);
if (!match) {
  console.error('Could not find turkeyCities in data/turkey-cities.ts');
  process.exit(1);
}

let cities;
try {
  cities = eval(match[1]);
} catch (e) {
  console.error('Failed to parse turkeyCities', e);
  process.exit(1);
}

async function main() {
  console.log(`Seeding ${cities.length} cities...`);
  const payload = cities.map(c => ({
    name: c.name,
    slug: c.slug,
    region: c.region,
    description: c.description,
    lat: c.lat,
    lng: c.lng,
    population: c.population,
    is_active: true,
  }));

  const { error } = await supabase.from('cities').upsert(payload, { onConflict: 'slug' });
  if (error) {
    console.error('Error seeding cities:', error.message);
  } else {
    console.log('✅ 81 Cities successfully seeded!');
  }
}

main().catch(console.error);

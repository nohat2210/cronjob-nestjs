import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const locationPath = join(__dirname, 'location_seeds.json');
const assetPath = join(__dirname, 'asset_seeds.json');

function readJSONData(path: string) {
  const rawData = readFileSync(path, 'utf-8');
  return JSON.parse(rawData);
}

async function main() {
  const locationsData = readJSONData(locationPath);
  const assetsData = readJSONData(assetPath);
  await prisma.$transaction(async (tx) => {
    const createdLocations = await tx.location.createManyAndReturn({
      data: locationsData,
      skipDuplicates: true,
    });
    const createdAssets = await tx.asset.createManyAndReturn({
      data: assetsData,
      skipDuplicates: true,
    });
    console.log('[Created Locations]:', createdLocations);
    console.log('[Created Assets]:', createdAssets);
  });
  console.log('All data has been processed.');
}

main()
  .catch((e) => {
    console.error('Error during processing:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

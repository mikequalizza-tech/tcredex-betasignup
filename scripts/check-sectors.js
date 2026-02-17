const data = require("../../cdes-merged-import-preview.json");
const withSectors = data.filter(
  (d) => d.target_sectors && d.target_sectors.length > 0,
);
const without = data.filter(
  (d) => !d.target_sectors || d.target_sectors.length === 0,
);
console.log("With sectors:", withSectors.length, "/", data.length);
console.log("Without sectors:", without.length);
if (without.length > 0) {
  console.log("\nCDEs still missing sectors:");
  const finDist = {};
  without.forEach((d) => {
    const f = d.predominant_financing || "(null)";
    finDist[f] = (finDist[f] || 0) + 1;
  });
  Object.entries(finDist)
    .sort((a, b) => b[1] - a[1])
    .forEach(([v, c]) => console.log(`  (${c}) ${v}`));
}
console.log("\nSector distribution:");
const sectorCounts = {};
data.forEach((d) =>
  (d.target_sectors || []).forEach(
    (s) => (sectorCounts[s] = (sectorCounts[s] || 0) + 1),
  ),
);
Object.entries(sectorCounts)
  .sort((a, b) => b[1] - a[1])
  .forEach(([s, c]) => console.log(`  ${s}: ${c}`));

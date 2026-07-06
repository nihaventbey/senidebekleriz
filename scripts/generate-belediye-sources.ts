import { writeFileSync } from "fs";
import { join } from "path";
import { buildBelediyeSources } from "../lib/ingest/belediye-sources";

const path = join(process.cwd(), "data", "belediye-sources.json");
const sources = buildBelediyeSources();
writeFileSync(path, `${JSON.stringify(sources, null, 2)}\n`);
console.log(`Wrote ${sources.length} belediye sources to ${path}`);

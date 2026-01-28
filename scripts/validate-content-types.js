const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const API_DIR = path.join(ROOT, 'src', 'api');

function findSchemas(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // look for content-types/*/schema.json
      const ctDir = path.join(full, 'content-types');
      if (fs.existsSync(ctDir) && fs.statSync(ctDir).isDirectory()) {
        const ctEntries = fs.readdirSync(ctDir, { withFileTypes: true });
        for (const ct of ctEntries) {
          const schemaPath = path.join(ctDir, ct.name, 'schema.json');
          if (fs.existsSync(schemaPath)) {
            results.push(schemaPath);
          }
        }
      }
    }
  }
  return results;
}

function validateSchema(schemaPath, knownUIDs) {
  const errors = [];
  let data;
  try {
    const raw = fs.readFileSync(schemaPath, 'utf8');
    data = JSON.parse(raw);
  } catch (e) {
    errors.push(`Invalid JSON: ${e.message}`);
    return errors;
  }
  if (!data.kind || !['collectionType', 'singleType'].includes(data.kind)) {
    errors.push(`Missing or invalid kind: ${data.kind}`);
  }
  if (!data.info || typeof data.info !== 'object') {
    errors.push('Missing info object');
  } else {
    const { singularName, pluralName, displayName } = data.info;
    if (!singularName || !pluralName || !displayName) {
      errors.push('info must include singularName, pluralName, displayName');
    }
  }
  if (!data.attributes || typeof data.attributes !== 'object') {
    errors.push('Missing attributes object');
  } else {
    for (const [attrName, attr] of Object.entries(data.attributes)) {
      if (!attr || typeof attr !== 'object') {
        errors.push(`Attribute ${attrName} invalid object`);
        continue;
      }
      if (attr.type === 'relation') {
        if (!attr.target || typeof attr.target !== 'string') {
          errors.push(`Relation ${attrName} missing target`);
        } else if (!knownUIDs.has(attr.target)) {
          errors.push(`Relation ${attrName} targets unknown UID: ${attr.target}`);
        }
      }
    }
  }
  return errors;
}

function main() {
  const schemaPaths = findSchemas(API_DIR);
  const knownUIDs = new Set(schemaPaths.map((p) => {
    const ctName = path.basename(path.dirname(p)); // name under content-types
    const apiName = path.basename(path.dirname(path.dirname(path.dirname(p)))); // src/api/<name>
    return `api::${apiName}.${ctName}`;
  }));
  const report = [];
  for (const schemaPath of schemaPaths) {
    const errs = validateSchema(schemaPath, knownUIDs);
    if (errs.length) {
      report.push({ schemaPath, errs });
    }
  }
  if (report.length === 0) {
    console.log('All content-type schemas look valid.');
  } else {
    console.log('Found issues in content-type schemas:');
    for (const item of report) {
      console.log(`\n- ${path.relative(ROOT, item.schemaPath)}`);
      for (const e of item.errs) console.log(`  * ${e}`);
    }
    process.exitCode = 1;
  }
}

main();

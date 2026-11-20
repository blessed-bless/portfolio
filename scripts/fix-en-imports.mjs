import fs from 'node:fs';

for (const file of ['src/pages/en/work/index.astro', 'src/pages/en/work/[slug].astro']) {
  let s = fs.readFileSync(file, 'utf8');
  s = s.replaceAll("from '../../../../", "from '../../../");
  // work lib imports may have been missed earlier
  if (file.includes('[slug]') && !s.includes("from '../../../lib/work'")) {
    s = s.replace(
      "import {\n  getCaseEntries,\n  getWorkEntry,\n  nextCaseSlug,\n  renderWork,\n  toProject,\n} from '../../../../lib/work';",
      "import {\n  getCaseEntries,\n  getWorkEntry,\n  nextCaseSlug,\n  renderWork,\n  toProject,\n} from '../../../lib/work';",
    );
  }
  fs.writeFileSync(file, s);
  console.log(file, '->', (s.match(/from '\.\.\/\.\.\/\.\.\//g) || []).length, 'triples');
}

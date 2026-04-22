const fs = require('fs');
const files = [
  'app/login/page.tsx',
  'app/(dashboard)/superadmin/page.tsx',
  'lib/auth.ts',
  'hooks/use-user-directory.ts',
  'hooks/use-organizations.ts',
  'hooks/use-auth.ts',
  'app/(dashboard)/admin/page.tsx',
  'package.json'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split(/\r?\n/);
  let out = [];
  let inOurs = false;
  let inTheirs = false;

  for (let line of lines) {
    if (line.startsWith('<<<<<<< HEAD')) {
      inOurs = true;
      continue;
    }
    if (line.startsWith('=======')) {
      inOurs = false;
      inTheirs = true;
      continue;
    }
    if (line.startsWith('>>>>>>> ')) {
      inTheirs = false;
      continue;
    }
    if (inOurs) {
      out.push(line);
    } else if (!inTheirs) {
      out.push(line);
    }
  }
  fs.writeFileSync(file, out.join('\n'));
}
console.log('Done resolving!');

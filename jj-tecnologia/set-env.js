const fs = require('fs');

const targetPath = './src/environments/environment.ts';

const envFileContent = `
export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.SUPABASE_KEY}',
};
`;

fs.writeFileSync(targetPath, envFileContent);
console.log('Environment file generated.');
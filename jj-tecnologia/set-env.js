const fs = require('fs');

const targetPath = './src/environments/environment.ts';
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'SET' : 'NOT SET');
const envFileContent = `
export const environment = {
  production: true,
  supabaseUrl: '${process.env.SUPABASE_URL}',
  supabaseKey: '${process.env.SUPABASE_KEY}',
};
`;

fs.writeFileSync(targetPath, envFileContent);
console.log('Environment file generated.');
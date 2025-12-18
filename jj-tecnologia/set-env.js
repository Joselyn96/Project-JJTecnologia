// const fs = require('fs');

// const targetPath = './src/environments/environment.ts';

// // Coloca tus credenciales REALES aquí
// const supabaseUrl = process.env.SUPABASE_URL || 'https://zlblrmelaalhdguylxty.supabase.co';
// const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsYmxybWVsYWFsaGRndXlseHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MjkyMDUsImV4cCI6MjA3NTAwNTIwNX0.G7lLxMow9eXTLbYQbS8EV-UK8HgxmGOTbtLL1sEK0LI';

// console.log('SUPABASE_URL:', supabaseUrl);
// console.log('SUPABASE_KEY:', supabaseKey ? 'SET' : 'NOT SET');

// const envFileContent = `
// export const environment = {
//   production: true,
//   supabaseUrl: '${supabaseUrl}',
//   supabaseKey: '${supabaseKey}',
// };
// `;

// fs.writeFileSync(targetPath, envFileContent);
// console.log('Environment file generated.');
import { writeFileSync } from "fs";

const targetPath = "./src/environments/environment.ts";

const envFileContent = `
export const environment = {
  production: false,
  supabaseUrl: '${process.env['SUPABASE_URL']}',
  supabaseKey: '${process.env['SUPABASE_KEY']}'
};
`;

writeFileSync(targetPath, envFileContent);
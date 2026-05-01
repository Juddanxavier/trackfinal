const { execSync } = require('child_process');
process.env.CI = 'true';
try {
  execSync('npx drizzle-kit push', { 
    stdio: 'inherit',
    cwd: process.cwd(),
    env: { ...process.env, CI: 'true' }
  });
} catch (e) {
  console.log('Done or error');
}
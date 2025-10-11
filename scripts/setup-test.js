const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Setting up test environment...');

// Create test .env file if it doesn't exist
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
  console.log('📄 Creating .env file from .env.example');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ .env file created');
}

// Install dependencies if node_modules doesn't exist
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
}

// Run environment setup
console.log('⚙️  Setting up environment variables...');
require('./load-env');
console.log('✅ Environment setup complete');

console.log('\n🚀 Setup complete! You can now run the app with:');
console.log('   npm start');
console.log('\nOr test Firebase connection with:');
console.log('   npm run test:firebase');

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const envExamplePath = path.join(__dirname, '..', '.env.example');
const envPath = path.join(__dirname, '..', '.env.local');

// Verificar si ya existe un archivo .env.local
if (fs.existsSync(envPath)) {
  rl.question('El archivo .env.local ya existe. ¿Deseas sobrescribirlo? (s/n): ', (answer) => {
    if (answer.toLowerCase() !== 's') {
      console.log('Operación cancelada por el usuario.');
      rl.close();
      return;
    }
    createEnvFile();
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  // Leer el archivo .env.example
  const envExample = fs.readFileSync(envExamplePath, 'utf8');
  
  // Crear el archivo .env.local
  fs.writeFileSync(envPath, envExample);
  
  console.log('✅ Archivo .env.local creado exitosamente.');
  console.log('Por favor, actualiza los valores en el archivo .env.local con tus credenciales.');
  console.log('Ubicación del archivo:', envPath);
  
  // Verificar si hay valores por defecto que necesiten ser actualizados
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('your_')) {
    console.log('\n⚠️  Advertencia: Hay valores por defecto que necesitan ser actualizados.');
  }
  
  rl.close();
}

import 'dotenv/config';
import { query } from '../lib/db';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

type LogFunction = (message: string) => void;

// Function to create admin user programmatically (for API use)
export async function createAdminUser(
  username: string,
  password: string,
  log: LogFunction = console.log
): Promise<{ success: boolean; message: string }> {
  try {
    // Check if user already exists
    const existing = await query(
      'SELECT id FROM admin_users WHERE username = $1',
      [username]
    );

    if (existing.length > 0) {
      return { success: false, message: 'Username already exists' };
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    await query(
      'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    log(`✅ Admin user '${username}' created successfully`);
    return { success: true, message: 'User created successfully' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    log(`❌ Error creating admin user: ${message}`);
    return { success: false, message };
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let password = '';
    
    const onData = (char: string) => {
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl-D
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl-C
          process.exit();
          break;
        case '\u007f': // Backspace
        case '\b':
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    };
    
    stdin.on('data', onData);
  });
}

async function initAdmin() {
  try {
    console.log('=== Inicialización de Usuario Admin ===\n');

    // Check if admin users already exist
    const existing = await query<{ count: string }>(
      'SELECT COUNT(*) as count FROM admin_users'
    );

    const count = parseInt(existing[0].count);

    if (count > 0) {
      console.log(`⚠️  Ya existen ${count} usuario(s) admin en la base de datos.`);
      const continueAnyway = await question('¿Deseas crear otro usuario de todos modos? (s/n): ');
      
      if (continueAnyway.toLowerCase() !== 's' && continueAnyway.toLowerCase() !== 'si') {
        console.log('Operación cancelada.');
        rl.close();
        process.exit(0);
      }
      console.log('');
    }

    // Get username
    let username = '';
    while (!username) {
      username = await question('Nombre de usuario: ');
      username = username.trim();
      
      if (!username) {
        console.log('El nombre de usuario no puede estar vacío.\n');
      } else if (username.length < 3) {
        console.log('El nombre de usuario debe tener al menos 3 caracteres.\n');
        username = '';
      } else {
        // Check if username exists
        const userExists = await query(
          'SELECT id FROM admin_users WHERE username = $1',
          [username]
        );
        
        if (userExists.length > 0) {
          console.log(`El usuario "${username}" ya existe. Elige otro nombre.\n`);
          username = '';
        }
      }
    }

    // Get password
    let password = '';
    let passwordConfirm = '';
    
    while (!password || password !== passwordConfirm) {
      password = await questionHidden('Contraseña: ');
      
      if (!password || password.length < 6) {
        console.log('La contraseña debe tener al menos 6 caracteres.\n');
        password = '';
        continue;
      }
      
      passwordConfirm = await questionHidden('Confirmar contraseña: ');
      
      if (password !== passwordConfirm) {
        console.log('Las contraseñas no coinciden. Intenta nuevamente.\n');
        password = '';
        passwordConfirm = '';
      }
    }

    // Hash password
    console.log('\nCreando usuario...');
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    await query(
      'INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)',
      [username, passwordHash]
    );

    console.log(`\n✅ Usuario admin "${username}" creado exitosamente!\n`);
    console.log('Ahora puedes iniciar sesión en /admin/login');

    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error al crear usuario admin:', error);
    rl.close();
    process.exit(1);
  }
}

initAdmin();

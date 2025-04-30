// Script to create the folder structure for database migrations
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Define the directories to create
const directories = [
  'drizzle/keepdoc',
  'drizzle/customer',
  'drizzle/realsamui'
];

// Check if a directory exists, if not create it
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  } else {
    console.log(`Directory already exists: ${dirPath}`);
  }
};

// Create a .gitkeep file in the directory to ensure it's tracked by Git
const createGitKeep = (dirPath) => {
  const gitKeepPath = path.join(dirPath, '.gitkeep');
  if (!fs.existsSync(gitKeepPath)) {
    fs.writeFileSync(gitKeepPath, '');
    console.log(`Created .gitkeep file in: ${dirPath}`);
  }
};

// Main function
const main = () => {
  console.log('Setting up migration folders...');
  
  // Ensure the base drizzle directory exists
  ensureDirectoryExists(path.join(rootDir, 'drizzle'));
  
  // Create each database-specific directory
  directories.forEach(dir => {
    const fullPath = path.join(rootDir, dir);
    ensureDirectoryExists(fullPath);
    createGitKeep(fullPath);
  });
  
  console.log('Migration folders setup complete!');
};

// Run the script
main(); 
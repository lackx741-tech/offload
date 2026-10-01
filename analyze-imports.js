const fs = require('fs');
const path = require('path');

const srcPath = path.join(__dirname, 'src');
const libPath = path.join(srcPath, 'lib');
const apiPath = path.join(srcPath, 'app', 'api');
const componentsPath = path.join(srcPath, 'components');

const results = {
  libFiles: {},
  apiEndpoints: {},
  componentImports: {},
  unusedLibFiles: []
};

// Get all lib files
function getLibFiles() {
  if (!fs.existsSync(libPath)) return [];
  return fs.readdirSync(libPath)
    .filter(f => (f.endsWith('.ts') || f.endsWith('.tsx')) && !f.includes('.bak') && !f.includes('.save'))
    .map(f => f.replace(/\.(ts|tsx)$/, ''));
}

// Search for imports of lib files
function findLibImports() {
  const libFiles = getLibFiles();
  
  const searchPaths = [apiPath, componentsPath, path.join(srcPath, 'app')];
  
  libFiles.forEach(libFile => {
    results.libFiles[libFile] = {
      importedIn: [],
      count: 0
    };
  });

  searchPaths.forEach(searchPath => {
    if (!fs.existsSync(searchPath)) return;
    
    walkDir(searchPath, (filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      
      libFiles.forEach(libFile => {
        // Check for various import patterns
        const patterns = [
          new RegExp(`from\\s+['"]\\.*/lib/${libFile}['"]`, 'g'),
          new RegExp(`from\\s+['"]\\.*/lib/${libFile}\\.(ts|tsx)['"]`, 'g'),
          new RegExp(`import\\s+.*from\\s+['"]\\.*/lib/${libFile}['"]`, 'g')
        ];
        
        if (patterns.some(p => p.test(content))) {
          const rel = path.relative(srcPath, filePath);
          results.libFiles[libFile].importedIn.push(rel);
          results.libFiles[libFile].count++;
        }
      });
    });
  });
}

// Get API endpoints
function getApiEndpoints() {
  if (!fs.existsSync(apiPath)) return;
  
  walkDir(apiPath, (filePath) => {
    if (filePath.endsWith('route.ts')) {
      const rel = path.relative(srcPath, filePath);
      results.apiEndpoints[rel] = {
        imports: []
      };
      
      const content = fs.readFileSync(filePath, 'utf8');
      const importMatches = content.match(/from\s+['"].*lib\/[^'"]+['"]/g) || [];
      results.apiEndpoints[rel].imports = importMatches;
    }
  });
}

// Utility to walk directory
function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return;
  
  fs.readdirSync(dir).forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.')) {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      callback(filePath);
    }
  });
}

// Run analysis
console.log('🔍 Analyzing imports...\n');

getApiEndpoints();
findLibImports();

// Find unused files
const libFiles = getLibFiles();
libFiles.forEach(file => {
  if (results.libFiles[file].count === 0) {
    results.unusedLibFiles.push(file);
  }
});

// Output results
console.log('='.repeat(80));
console.log('📊 LIB FILES ANALYSIS');
console.log('='.repeat(80));

Object.entries(results.libFiles).forEach(([file, data]) => {
  const status = data.count === 0 ? '❌ UNUSED' : `✅ USED (${data.count}x)`;
  console.log(`\n${status} - ${file}.ts`);
  
  if (data.importedIn.length > 0) {
    console.log('   Imported in:');
    data.importedIn.slice(0, 5).forEach(loc => {
      console.log(`   • ${loc}`);
    });
    if (data.importedIn.length > 5) {
      console.log(`   • ... and ${data.importedIn.length - 5} more`);
    }
  }
});

console.log('\n' + '='.repeat(80));
console.log('🗑️  UNUSED LIB FILES (Can be deleted):');
console.log('='.repeat(80));

if (results.unusedLibFiles.length === 0) {
  console.log('✅ All lib files are being used!');
} else {
  results.unusedLibFiles.forEach(file => {
    console.log(`❌ ${file}.ts`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('🔌 API ENDPOINTS & THEIR IMPORTS');
console.log('='.repeat(80));

Object.entries(results.apiEndpoints).forEach(([endpoint, data]) => {
  console.log(`\n📍 ${endpoint}`);
  if (data.imports.length > 0) {
    data.imports.forEach(imp => {
      console.log(`   → ${imp}`);
    });
  } else {
    console.log('   (no lib imports)');
  }
});

console.log('\n' + '='.repeat(80));
console.log('✅ Analysis complete! Copy the output above and send it to me.');
console.log('='.repeat(80));

// Helper file for quick fixes
const fs = require('fs');

function fixFile(filePath, searchStr, replaceStr) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(searchStr, replaceStr);
    fs.writeFileSync(filePath, newContent);
    console.log(`Fixed ${filePath}`);
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error);
  }
}

module.exports = { fixFile };


import fs from 'fs';
const content = fs.readFileSync('c:\\Users\\felip\\OneDrive\\Documentos\\finance\\src\\presentation\\pages\\LancamentosPage.tsx', 'utf8');
let braceCount = 0;
let parenCount = 0;
let inString = null;
for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (inString) {
        if (char === inString && content[i-1] !== '\\') inString = null;
        continue;
    }
    if (char === '"' || char === "'" || char === '`') inString = char;
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
}
console.log('Braces:', braceCount);
console.log('Parens:', parenCount);

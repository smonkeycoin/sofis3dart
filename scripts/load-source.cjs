const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const modules = new Map();
module.exports = function loadSource(file) {
  const absolute = path.resolve(root, file);
  if (modules.has(absolute)) return modules.get(absolute).exports;
  const sourceModule = { exports: {} };
  modules.set(absolute, sourceModule);
  const compiled = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
  } }).outputText;
  const localRequire = name => {
    if (name === 'server-only') return {};
    if (!name.startsWith('@/')) return require(name);
    const stem = path.join(root, name.slice(2));
    const target = ['.ts', '.tsx'].map(ext => stem + ext).find(file => fs.existsSync(file));
    if (!target) throw Error('Source import not found');
    return loadSource(target);
  };
  new Function('require', 'module', 'exports', compiled)(localRequire, sourceModule, sourceModule.exports);
  return sourceModule.exports;
};

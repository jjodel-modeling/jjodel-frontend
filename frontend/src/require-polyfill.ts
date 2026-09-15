// Polyfill per require() nel browser
(window as any).require = function(module: string) {
  console.warn(`Module '${module}' requested via require(), returning empty object`);
  return {};
};

// Polyfill per module.exports
if (typeof (window as any).module === 'undefined') {
  (window as any).module = { exports: {} };
}

export {};

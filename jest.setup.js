// Jest setup file
// Add any global test setup here

// Polyfill for Blob in jsdom environment if needed
if (typeof Blob === 'undefined') {
  global.Blob = class Blob {
    constructor(parts = [], options = {}) {
      this.parts = parts;
      this.type = options.type || '';
      this.size = parts.reduce((acc, part) => {
        if (typeof part === 'string') {
          return acc + part.length;
        }
        return acc + (part?.length || 0);
      }, 0);
    }
  };
}
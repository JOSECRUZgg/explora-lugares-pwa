import './config.js';
export const apiURL = path => new URL(path, self.PWA_API_BASE || location.origin).href;

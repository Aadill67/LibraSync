/**
 * Centralized API configuration for LibraSync.
 *
 * VITE_API_URL should be the full API base including /api suffix:
 *   e.g. "https://librasync.onrender.com/api"
 *
 * SERVER_URL is the server root (no /api), used for static files like
 * profile photos and uploads.
 */

// Full API endpoint (used by axios)
export const API_URL = import.meta.env.VITE_API_URL || 'https://librasync.onrender.com/api';

// Server root — strip trailing "/api" so we can reach /uploads/*
export const SERVER_URL = (() => {
  const url = import.meta.env.VITE_API_URL || '';
  if (url) {
    // Remove trailing /api or /api/
    return url.replace(/\/api\/?$/, '');
  }
  // Local dev — Vite proxy handles it, so use relative paths
  return '';
})();

/**
 * Build a full URL for a static file hosted on the backend server.
 * e.g. getServerFileUrl('/uploads/profiles/abc.jpg')
 *   → "https://librasync.onrender.com/uploads/profiles/abc.jpg"  (prod)
 *   → "/uploads/profiles/abc.jpg"                                 (dev)
 */
export const getServerFileUrl = (path) => {
  if (!path) return null;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SERVER_URL}${cleanPath}`;
};

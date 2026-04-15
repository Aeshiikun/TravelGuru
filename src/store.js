// src/store.js
// Simple shared global store — no Redux needed.
// Import { addScan, getScan, getStats } in any screen.

let _scans = []; // { landmark, time, fromFlag, toFlag }
let _saved = []; // landmark ids
let _listeners = [];

function notify() {
  _listeners.forEach(fn => fn());
}

export function subscribe(fn) {
  _listeners.push(fn);
  return () => { _listeners = _listeners.filter(l => l !== fn); };
}

// ── Scans ──────────────────────────────────────────────────────
export function addScan(landmark) {
  const now = new Date();
  const timeStr = formatTime(now);
  _scans = [
    { landmark, time: timeStr, timestamp: now.getTime() },
    ..._scans.filter(s => s.landmark.name !== landmark.name),
  ].slice(0, 50); // keep last 50
  notify();
}

export function getScans() {
  return _scans;
}

export function getRecentScans(limit = 5) {
  return _scans.slice(0, limit);
}

// ── Saved ──────────────────────────────────────────────────────
export function toggleSaved(landmarkName) {
  if (_saved.includes(landmarkName)) {
    _saved = _saved.filter(n => n !== landmarkName);
  } else {
    _saved = [..._saved, landmarkName];
  }
  notify();
}

export function isSaved(landmarkName) {
  return _saved.includes(landmarkName);
}

export function getSaved() {
  return _saved;
}

// ── Stats ──────────────────────────────────────────────────────
export function getStats() {
  const countries = new Set(
    _scans.map(s => s.landmark?.location?.split(',').pop()?.trim()).filter(Boolean)
  );
  return {
    scanned: _scans.length,
    countries: countries.size,
    saved: _saved.length,
  };
}

// ── Helpers ────────────────────────────────────────────────────
function formatTime(date) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${time}`;
}
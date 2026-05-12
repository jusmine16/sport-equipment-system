/**
 * API helper for Sport Equipment Borrowing System
 */
const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh');
}

function getAuthHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function api(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };
  const body = options.body && typeof options.body === 'object' && !(options.body instanceof FormData)
    ? JSON.stringify(options.body) : options.body;
  const res = await fetch(url, { ...options, headers, body });
  let data = {};
  try {
    const text = await res.text();
    data = text ? JSON.parse(text) : {};
  } catch (_) {}
  if (!res.ok) {
    const err = new Error(data.error || data.detail || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function register(data) {
  return api('/register/', { method: 'POST', body: data });
}

async function login(username, password) {
  return api('/login/', {
    method: 'POST',
    body: { username, password },
  });
}

async function getUser() {
  return api('/user/');
}

async function getEquipment(search = '', category = '') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  const q = params.toString();
  return api(`/equipment/${q ? '?' + q : ''}`);
}

async function createEquipment(data) {
  return api('/equipment/', { method: 'POST', body: data });
}

async function updateEquipment(id, data) {
  return api(`/equipment/${id}/`, { method: 'PUT', body: data });
}

async function deleteEquipment(id) {
  return api(`/equipment/${id}/`, { method: 'DELETE' });
}

async function createBorrow(items) {
  return api('/borrow/', { method: 'POST', body: { items } });
}

async function getBorrows() {
  return api('/borrow/');
}

async function approveBorrow(id) {
  return api(`/borrow/${id}/approve/`, { method: 'PUT', body: {} });
}

async function rejectBorrow(id, notes = '') {
  return api(`/borrow/${id}/reject/`, { method: 'PUT', body: { notes } });
}

async function returnEquipment(data) {
  return api('/return/', { method: 'POST', body: data });
}

async function getTransactions() {
  return api('/transactions/');
}

async function getReports() {
  return api('/reports/');
}

function isLoggedIn() {
  return !!getToken();
}

function redirectToLogin() {
  if (!isLoggedIn()) {
    window.location.href = '/static/login.html';
  }
}

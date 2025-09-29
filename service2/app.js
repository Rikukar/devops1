const express = require('express');
const fs = require('fs');
const { execSync } = require('child_process');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const VSTORAGE_PATH = "/vstorage";
const STORAGE_URL = "http://storage:8200/log";

// Get current UTC timestamp in ISO 8601
function isoUTCNow() {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

// Calculate container uptime in hours
function uptimeHours() {
  try {
    const data = fs.readFileSync('/proc/uptime', 'utf8');
    const seconds = parseFloat(data.split(' ')[0]);
    return Math.round((seconds / 3600) * 100) / 100;
  } catch (e) {
    return 0;
  }
}

// Calculate free disk space on root
function freeRootMB() {
  try {
    const out = execSync("df --output=avail -BM / | tail -1").toString().trim();
    const matches = out.match(/(\d+)/);
    if (matches) return parseInt(matches[1]); // MB
  } catch (e) {
    console.error("Error checking free disk on root:", e);
  }
  return 0;
}

// Build the record
function makeRecord() {
  return `${isoUTCNow()}: uptime ${uptimeHours()} hours, free disk in root: ${freeRootMB()} MBytes`;
}

// Append record to vStorage log file
async function appendVstorage(record) {
  try {
    if (!fs.existsSync(VSTORAGE_PATH)) fs.writeFileSync(VSTORAGE_PATH, '');
    fs.appendFileSync(VSTORAGE_PATH, record + "\n");
  } catch (e) {
    console.error("append vstorage error:", e);
  }
}

// POST record to storage service
async function postToStorage(record) {
  try {
    await fetch(STORAGE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: record
    });
  } catch (e) {
    console.error("post to storage failed:", e);
  }
}

// /status endpoint
app.get('/status', async (req, res) => {
  const rec = makeRecord();
  await postToStorage(rec);
  await appendVstorage(rec);
  res.set('Content-Type', 'text/plain');
  res.send(rec);
});

// Start server
app.listen(8300, '0.0.0.0', () => {
  console.log('service2 listening on 8300');
});
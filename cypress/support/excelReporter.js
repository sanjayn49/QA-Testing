const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const reportsDir = path.join(__dirname, '..', 'reports');
const filePath = path.join(reportsDir, 'test-results.xlsx');

let workbook;
let worksheet;
let initialized = false;

function ensureReportsDir() {
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
}

function formatWorksheet() {
  if (!worksheet) {
    return;
  }

  worksheet.getColumn(1).width = 15; // Test ID
  worksheet.getColumn(2).width = 40; // Feature
  worksheet.getColumn(3).width = 15; // Status
  worksheet.getColumn(4).width = 50; // Failure Reason
  worksheet.getColumn(5).width = 25; // Timestamp

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };
}

async function ensureWorkbook() {
  if (initialized) {
    return;
  }

  ensureReportsDir();
  workbook = new ExcelJS.Workbook();

  if (fs.existsSync(filePath)) {
    workbook = await workbook.xlsx.readFile(filePath);
    worksheet = workbook.getWorksheet('Test Results') || workbook.addWorksheet('Test Results');
  } else {
    worksheet = workbook.addWorksheet('Test Results');
    worksheet.addRow(['Test ID', 'Feature', 'Status', 'Failure Reason', 'Timestamp']);
  }

  formatWorksheet();
  initialized = true;
}

async function logTestResult({ testId, feature, status, failureReason = '' }) {
  await ensureWorkbook();
  const timestamp = new Date().toISOString();
  worksheet.addRow([testId, feature, status, failureReason, timestamp]);
  formatWorksheet();
  await workbook.xlsx.writeFile(filePath);
  return null;
}

async function finalizeWorkbook() {
  if (!initialized) {
    return null;
  }

  await workbook.xlsx.writeFile(filePath);
  return null;
}

module.exports = {
  logTestResult,
  finalizeWorkbook,
};
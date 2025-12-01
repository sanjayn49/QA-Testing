const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '..', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const filePath = path.join(reportsDir, 'test-results.xlsx');
let workbook = new ExcelJS.Workbook();
let worksheet;

// Initialize or load existing workbook
async function initWorkbook() {
  if (fs.existsSync(filePath)) {
    workbook = await workbook.xlsx.readFile(filePath);
    worksheet = workbook.getWorksheet('Test Results') || workbook.addWorksheet('Test Results');
  } else {
    worksheet = workbook.addWorksheet('Test Results');
    // Add headers
    worksheet.addRow(['Test ID', 'Feature', 'Status', 'Failure Reason', 'Timestamp']);
  }
  return worksheet;
}

// Format the worksheet
function formatWorksheet() {
  // Set column widths
  worksheet.getColumn(1).width = 15; // Test ID
  worksheet.getColumn(2).width = 40; // Feature
  worksheet.getColumn(3).width = 15; // Status
  worksheet.getColumn(4).width = 50; // Failure Reason
  worksheet.getColumn(5).width = 25; // Timestamp

  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' }
  };
}

// Save test result to Excel
async function saveTestResult(testId, feature, status, failureReason = '') {
  const timestamp = new Date().toISOString();
  worksheet.addRow([testId, feature, status, failureReason, timestamp]);
  formatWorksheet();
  await workbook.xlsx.writeFile(filePath);
}

// Initialize before tests run
before(async () => {
  await initWorkbook();
  formatWorksheet();
  await workbook.xlsx.writeFile(filePath);
});

// Save after all tests
after(() => {
  return workbook.xlsx.writeFile(filePath);
});

module.exports = { saveTestResult };

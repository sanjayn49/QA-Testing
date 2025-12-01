# QA Automation Testing Framework

A Cypress-based end-to-end testing framework for web applications, featuring custom commands for QR code scanning and asset management.

## 🚀 Features

- **End-to-End Testing**: Automated browser testing using Cypress
- **QR Code Scanning**: Custom command for QR code verification
- **Asset Management**: Test cases for asset CRUD operations
- **Modern JavaScript**: Written in modern ES6+ JavaScript
- **CI/CD Ready**: Configuration for continuous integration

## 🛠️ Prerequisites

- Node.js (v14+)
- npm (v6+)
- Google Chrome or Chromium browser

## 🏗️ Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/sanjayn49/QA-Testing.git
   cd QA-Testing
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Install QR code scanning library (required for asset tests):
   ```bash
   npm install jsqr
   ```

4. Install Cypress:
   ```bash
   npx cypress install
   ```

## 🧪 Running Tests

### Run all tests in headless mode
```bash
npx cypress run
```

### Open Cypress Test Runner
```bash
npx cypress open
```

### Run specific test file
```bash
npx cypress run --spec "cypress/e2e/h_assets.cy.js"
```

## 📁 Project Structure

```
cypress/
├── e2e/                  # Test files
│   ├── h_assets.cy.js    # Asset management tests
│   └── j_floorplan.cy.js # Floorplan tests
├── fixtures/             # Test data
├── support/              # Custom commands
│   └── commands.js       # Custom Cypress commands
└── screenshots/          # Test screenshots (gitignored)
```

## 🔧 Custom Commands

- `cy.scanQrFromScreen()`: Captures and decodes QR codes
- `cy.login()`: Handles authentication
- `cy.createAsset()`: Creates a new test asset

## 🧩 Dependencies

- Cypress (v15.7.0+)
- jsQR: For QR code scanning (install with `npm install jsqr`)
- canvas: For image processing


## 🧹 Cleanup

The framework automatically cleans up test artifacts:
- Screenshots after test completion
- Test data after test runs

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request



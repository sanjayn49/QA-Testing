// cypress.config.js
const { defineConfig } = require('cypress');
const fs = require('fs');
const path = require('path');
const jsQR = require('jsqr');
const { createCanvas, loadImage } = require('canvas');

// Load the reporter if it exists
let reporter;
try {
  const reporterPath = path.join(__dirname, 'cypress', 'support', 'excelReporter.js');
  if (fs.existsSync(reporterPath)) {
    reporter = require(reporterPath);
  }
} catch (e) {
  console.warn('Could not load excelReporter:', e.message);
}

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://nextgenfiredeskqa.atvisai.in/',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    setupNodeEvents(on, config) {
      on('task', {
        readQrCode(filePath) {
          return new Promise((resolve) => {
            loadImage(filePath).then((image) => {
              const canvas = createCanvas(image.width, image.height);
              const ctx = canvas.getContext('2d');
              ctx.drawImage(image, 0, 0);

              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              
              // Try multiple inversion attempts
              const code = jsQR(
                imageData.data,
                imageData.width,
                imageData.height,
                {
                  inversionAttempts: 'attemptBoth', // Try both inverted and non-inverted
                }
              );

              if (code) {
                resolve(code.data);
              } else {
                // Try again with different options
                const code2 = jsQR(
                  imageData.data,
                  imageData.width,
                  imageData.height,
                  {
                    inversionAttempts: 'onlyInvert',
                  }
                );
                
                if (code2) {
                  resolve(code2.data);
                } else {
                  resolve(null);
                }
              }
            }).catch((err) => {
              console.log('Error loading image:', err);
              resolve(null);
            });
          });
        },
        fileExists(filePath) {
          const fs = require('fs');
          return fs.existsSync(filePath);
        },
        // Only set up reporter tasks if reporter was loaded
        logTestResult: (payload) => {
            if (typeof reporter.logTestResult === 'function') {
              return reporter.logTestResult(payload);
            }
            return null;
          },
          deleteFile: (filepath) => {
            return new Promise((resolve) => {
              fs.unlink(filepath, (err) => {
                if (err) {
                  console.log('❌ Could not delete file:', filepath);
                  console.log('Error:', err.message);
                  return resolve(false);
                }
                console.log('🗑 Deleted file:', filepath);
                resolve(true);
              });
            });
          }
        });

      // Excel reporting after spec
      if (reporter) {
        on('after:spec', async () => {
          await reporter.finalizeWorkbook()
        });
      }

      return config;
    },
    experimentalRunAllSpecs: true,
    defaultCommandTimeout: 10000,
    viewportWidth: 1920,
    viewportHeight: 1080,
  },
})
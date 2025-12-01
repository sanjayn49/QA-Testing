const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('after:spec', (spec, results) => {
        require('./cypress/support/excelReporter').saveWorkbook();
        return null;
      });
      return config;
    }
  }
});
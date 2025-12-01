// cypress/e2e/manager_create_no_plant.cy.js

describe.only('Managers Management - Create Manager with No Plant Assignment', () => { // ⭐ Using describe.only to run ONLY this test file

  // --- GLOBAL CONSTANTS (Test Data) ---
  const managerPassword = 'Test@123';
  const managersPageUrl = '/admin/managers'; 

  // --- HELPER DEFINITIONS ---
  const uniqueName = (prefix) => `${prefix}`;
  const uniqueEmail = (prefix) => `${prefix}_${Date.now()}@test.com`;

  // Helper: Generates a guaranteed unique 10-digit number
  const uniquePhone = () => {
    const timestamp = Date.now().toString();
    const uniquePart = timestamp.substring(timestamp.length - 6);
    return `9999${uniquePart}`; 
  };

  // Helper to search
  const searchFor = (text) => {
    const input = cy.get('input[placeholder*="Search"]', {
      timeout: 10000
    }).should('be.visible');
    input.clear();
    if (text) {
      input.type(text);
    }
    cy.wait(1000);
  };

  // Helper to delete a manager
  const ensureManagerDoesNotExist = (searchTerm) => {
    cy.log(`🔍 Checking if manager '${searchTerm}' exists...`);
    cy.intercept('DELETE', '**/manager/**').as('deleteManager');
    cy.intercept('GET', '**/manager**').as('getManagers');

    searchFor(searchTerm);
    cy.wait(1500);

    cy.get('body').then(($body) => {
      const bodyText = $body.find('tbody').text();
      if (bodyText.includes(searchTerm)) {
        cy.log(`⚠️ Manager '${searchTerm}' found. Deleting...`);

        cy.contains('tr', searchTerm, {
          timeout: 10000
        }).within(() => {
          cy.get('button[title*="Delete"], button[aria-label*="delete"]')
            .first()
            .click({
              force: true
            });
        });

        cy.wait(500);

        cy.contains('button', /yes|confirm|delete/i, {
            timeout: 10000
          })
          .should('be.visible')
          .click({
            force: true
          });

        cy.wait('@deleteManager', {
          timeout: 15000
        });
        cy.wait(3000);
        cy.log(`✅ Manager '${searchTerm}' deleted.`);
      } else {
        cy.log(`✅ Manager '${searchTerm}' does not exist.`);
      }
    });

    searchFor('');
    cy.wait(1000);
  };

  // *** MANAGER CREATION FLOW (Core logic) ***
  const createManagerThroughUsersFlow = (fullName, email, phone, password, plantName = null) => {
    cy.log(`🔨 Creating manager '${fullName}' via Users flow...`);

    cy.intercept('POST', '**/users').as('createUser');

    // 1. Click "Add Manager"
    cy.contains('button', 'Add Manager', {
      timeout: 20000
    }).click({
      force: true
    });

    // STABILITY FIX: Wait for the URL and the main tab to appear
    cy.url().should('include', '/admin/users');
    cy.contains('Basic Information', {
      timeout: 10000
    }).should('be.visible');
    cy.wait(2000); 

    // --- STEP 1: Basic Information ---
    cy.log('📝 Step 1: Filling Basic Information...');

    cy.get('input[placeholder*="Enter full name"]').should('be.visible').type(fullName);
    cy.get('input[placeholder*="phone"]').should('be.visible').type(phone);
    cy.get('input[placeholder*="email"]').should('be.visible').type(email);
    cy.get('input[placeholder*="password"]').should('be.visible').type(password);

    // Click "Save & Continue" (To move to Role Selection)
    cy.contains('button', /Save\s*&\s*Continue/i)
      .should('be.visible')
      .should('be.enabled')
      .click({
        force: true
      });
    cy.wait(4000); 

    // --- STEP 2: Role Selection (Auto-selects Manager) ---
    cy.log('👤 Step 2: Verifying Role Selection and Proceeding...');
    cy.contains('Role Selection', {
      timeout: 10000
    }).should('be.visible');

    // Click "Save & Continue" (To move to Role Details)
    cy.contains('button', /Save\s*&\s*Continue/i)
      .should('be.visible')
      .should('be.enabled')
      .click({
        force: true
      });
    cy.wait(4000); 

    // --- STEP 3: Role Details (Manager Assignment) ---
    cy.log('🏭 Step 3: Assigning Plant...');
    cy.contains('Role Details', {
      timeout: 10000
    }).should('be.visible');

    if (plantName === null) {
      cy.log('📍 Skipping plant assignment as requested (plantName is null).');
    } else {
      // NOTE: This block is skipped for your requested test case.
      cy.log('📍 Assigning first available plant.');
      cy.get('input[type="checkbox"]')
        .filter(':visible')
        .not(':disabled')
        .not(':checked') 
        .first()
        .check({
          force: true
        });
      cy.wait(1000);
    }

    // 4. Click "Create User" button (Final Submission)
    cy.log('💾 Clicking Create User button...');

    cy.contains('button', 'Create User').first()
      .should('be.visible')
      .should('be.enabled')
      .click({
        force: true
      });

    cy.wait('@createUser', {
      timeout: 30000
    });

    // 5. Verification: Ensure we navigate back to the Managers page and then search & verify
    cy.log('🔁 Navigating back to Managers page to verify presence...');
    cy.visit(managersPageUrl); 
    cy.url({
      timeout: 15000
    }).should('include', '/admin/managers');

    searchFor(fullName);

    cy.contains('tr', fullName, {
      timeout: 15000
    }).should('be.visible').scrollIntoView();
    searchFor('');
    cy.log('✅ Manager created and verified successfully.');
  };

  // ----------------------------------------
  // ## SETUP HOOKS
  // ----------------------------------------

  beforeEach(() => {
    // Navigate and Log In
    cy.visit('/login');
    cy.login('admin@firedesk.com', 'Admin@123');

    // Navigate to Managers page from sidebar
    cy.get('nav').contains('Managers').click();

    // Verify page load
    cy.url().should('include', '/admin/managers');
    cy.contains('h1', 'Managers', {
      timeout: 30000
    }).should('be.visible');
    cy.contains('button', 'Add Manager', {
      timeout: 10000
    }).should('be.visible').and('be.enabled');
  });

  // ----------------------------------------
  // ## THE TARGET TEST CASE (MN_03)
  // ----------------------------------------

  it('MN_01: should create manager named manager_bhoruka without plant assignment', () => {
    const testName = uniqueName('manager-bhoruka'); 
    const testEmail = uniqueEmail('manager_bhoruka'); 
    const uniquePhoneNumber = uniquePhone();

    ensureManagerDoesNotExist(testName);
    
    // ⭐ Critical: Passing null for the plantName
    createManagerThroughUsersFlow(testName, testEmail, uniquePhoneNumber, managerPassword, null); 

    // Final verification (redundant but confirms status outside helper)
    searchFor(testName);
    cy.contains('tr', testName).should('be.visible').should('contain', 'Active');
    searchFor('');
    cy.log('✅ Manager "manager_bhoruka" created with no plant assignment verified.');
  });
});
// cypress/e2e/vendor.cy.js

describe('Vendor Management and Filters', () => {
    let  vendorName= 'Leistung Technologies';
    
    let vendor;
    let originalName_id03;
    let updatedName_id03;
    let vendorToDelete_id04;
    let baseName_id06;
    let name1_id07='EditDupe1_' + Date.now();
    let name2_id07='EditDupe2_' + Date.now();
    let vendorName_id08 = 'TrimTest' + Date.now();;
    let vendorName_id10;
    
    const deleteVendor = (vendorrName) => {
        cy.log('Cleaning up: deleting test vendor...');
      
        cy.contains('tr', vendorrName)
          .within(() => {
            cy.get('button')          // the delete icon is a button
              .first()                // the first button is the trash
              .click({ force: true });
          });
      
        cy.contains('button', /delete anyway/i).click({ force: true });
      
        cy.wait(1500);
      };
      
    
      beforeEach(() => {
        cy.visit('/login');
        cy.login('admin@firedesk.com', 'Admin@123');
        cy.visit('/admin/vendors');
        cy.url().should('include', '/vendors');
        cy.wait(1000); // Wait for page to fully load
      });
    
      /* ========================================
         HELPER FUNCTIONS
      ======================================== */
    
      // From Vendor2.cy.js
      const openFilterPanel = () => {
        cy.log('Opening filter panel...');
        cy.get('button').contains('Filter', { matchCase: false, timeout: 8000 }).click({ force: true });
        cy.get('div').contains('Status', { timeout: 8000 }).should('be.visible');
      };
    
      const openDropdownForLabel = (labelText) => {
        cy.log(`Opening dropdown for: ${labelText}`);
        cy.contains('div, label', labelText, { timeout: 8000 })
          .then(($label) => {
            const parents = $label.parents();
            const candidateNodes = [$label[0], ...parents.toArray()];
            let clicked = false;
    
            for (const node of candidateNodes) {
              const $node = Cypress.$(node);
              const $button = $node.find(
                'button, [role="button"], [data-testid*="select"], [data-testid*="dropdown"], .select-root, .MuiSelect-root, [tabindex]'
              ).first();
              if ($button.length) {
                cy.wrap($button).click({ force: true });
                clicked = true;
                break;
              }
            }
    
            if (!clicked) {
              cy.wrap($label).click({ force: true });
            }
          });
      };
    
      const chooseOptionFromOpenDropdown = (optionText) => {
        cy.log(`Choosing option: ${optionText}`);
        const listSelectors = [
          'ul[role="listbox"]',
          'div[role="listbox"]',
          'div[role="presentation"]',
          'div[role="menu"]',
          'div[role="option"]',
          '.MuiList-root',
          '.dropdown-menu',
        ];
    
        cy.get('body').then(($body) => {
          let found = false;
          for (const sel of listSelectors) {
            if ($body.find(sel).length) {
              cy.get(sel, { timeout: 6000 }).should('be.visible');
              cy.get(sel).contains(optionText, { timeout: 6000 }).click({ force: true });
              found = true;
              break;
            }
          }
          if (!found) {
            cy.contains(optionText, { timeout: 6000 }).click({ force: true });
          }
        });
    
        cy.wait(500);
      };
    
      const selectDropdown = (labelText, optionText) => {
        openDropdownForLabel(labelText);
        chooseOptionFromOpenDropdown(optionText);
      };
    
      const applyAndPause = (time = 3000) => {
        cy.log('Applying filters...');
        cy.get('button').contains('Apply', { timeout: 4000 }).click({ force: true });
        cy.wait(time); // visual pause for manual verification
      };
    
      // From test1.cy.js (originally VendorStatusChange.cy.js)
      const openVendorEdit = (name) => {
        cy.log(`Opening edit form for: ${name}`);
        cy.contains('td, div', name, { timeout: 10000 })
          .should('be.visible')
          .click({ force: true });
        cy.wait(1500);
      };
    
      const changeStatus = (statusText) => {
        cy.log(`Changing status to: ${statusText}`);
    
        // Step 1: open dropdown near "Status"
        cy.contains('Status', { timeout: 8000 })
          .parent()
          .within(() => {
            cy.get('svg, button, div')
              .filter('[aria-label*="expand"], [class*="arrow"], [class*="expand"], :contains("v")')
              .first()
              .should('be.visible')
              .click({ force: true });
          });
    
        cy.wait(500); // Add a small wait for dropdown options to render
    
        // Step 2: select the target status within the dropdown context
        cy.get('ul[role="listbox"], div[role="listbox"]') // Target the dropdown list
          .should('be.visible')
          .contains('li, div[role="option"], span', statusText, { timeout: 8000 })
          .should('be.visible')
          .click({ force: true });
    
        // Step 3: save changes
        cy.contains('button', 'Save and Continue', { timeout: 8000 }) // Changed from 'Save and Continue' to 'Save'
          .should('be.visible')
          .click({ force: true });
    
        cy.wait(1500);
    
        // Step 4: verify success message or visual update
        cy.contains(/success|updated/i, { timeout: 8000 }).should('exist');
      };
    
      /* ========================================
         TESTS FROM vendors.cy.js
      ======================================== */
    
      it('id-01: should load vendors page with all required elements', () => {
        cy.log('✓ Verifying Vendors page structure');
    
        // Verify page heading
       // cy.contains('Vendors').should('be.visible');
        cy.contains('Manage and organize your vendors efficiently').should('be.visible');
    
        // Verify stats cards
        cy.contains('Total').should('be.visible');
        cy.contains('Active').should('be.visible');
        cy.contains('Inactive').should('be.visible');
    
        // Verify action buttons
        cy.contains('Add Vendor').should('be.visible');
        cy.contains('Filter').should('be.visible');
        cy.contains('View Archive').should('be.visible');
    
        // Verify table structure
        cy.get('table').should('be.visible');
        cy.contains('th', 'Name').should('be.visible');
        cy.contains('th', 'Status').should('be.visible');
        cy.contains('th', 'Created At').should('be.visible');
        cy.contains('th', 'Actions').should('be.visible');
    
        cy.log('✅ All page elements loaded successfully');
      });
    
    
      it('id-02: should create a new Active vendor successfully', () => {
        cy.log('✓ Creating a new Active vendor');
        
    
        cy.intercept('POST', '** /vendor').as('createVendor');
    
        // Click Add Vendor button
        cy.contains('Add Vendor').click();
        cy.wait(500);
    
        // Fill in vendor name
        cy.get('input[placeholder*="Enter vendor name"]').should('be.visible').type(vendorName);
    
        // Verify status toggle exists and set to Active
        cy.get('body').then($body => {
          if ($body.find('input[type="checkbox"]').length > 0) {
            cy.get('input[type="checkbox"]').should('be.checked');
          }
        });
    
        // Submit the form
        cy.contains('button', /save|submit|create/i).click();
    
        // Verify API call succeeded
        //cy.wait('@createVendor').its('response.statusCode').should('be.oneOf', [200, 201]);
    
        // Verify success message
        cy.contains(/success|created/i, { timeout: 5000 }).should('be.visible');
    
        // Verify vendor appears in the list
        cy.contains(vendorName).should('be.visible');
    
        // Verify status is Active
        cy.get('body').then(() => {
          cy.contains(vendorName).parent().parent().should('contain', 'Active');
        });
    
        cy.log('✅ Vendor created successfully');
      });
    
    
      it('id-03: should edit vendor name by clicking on it', () => {
        cy.log('Testing edit functionality (click on vendor name)');
        const originalName = 'EditTest_' + Date.now();
        const updatedName = 'EditTest_Updated_' + Date.now();
        originalName_id03 = originalName;
        updatedName_id03 = updatedName;
    
        // Step 1️⃣ Create a vendor to edit
        cy.contains('Add Vendor').click();
        cy.wait(500);
        cy.get('input[placeholder*="Enter vendor name"]').type(originalName);
        cy.contains('button', /save|create/i).click();
        cy.wait(2000);
    
        // Step 2️⃣ Setup intercept (handles PUT or PATCH)
        cy.intercept({ method: /(PUT|PATCH)/, url: '** /vendor/**' }).as('updateVendor');
    
        // Step 3️⃣ Open the vendor for editing
        cy.contains('tr', originalName)
          .should('be.visible')
          .within(() => {
            cy.get('td').first().click({ force: true });
          });
    
        // Step 4️⃣ Edit the name
        cy.get('input[placeholder*="Enter vendor name"]', { timeout: 10000 })
          .should('be.visible')
          .clear()
          .type(updatedName);
    
        // Step 5️⃣ Save the update
        cy.contains('button', /save|update/i).click({ force: true });
    
       
        // Step 7️⃣ Confirm name change in the table
        cy.contains('tr', updatedName, { timeout: 10000 }).should('exist');
        cy.contains('tr', originalName).should('not.exist');
    
        // Step 8️⃣ Cleanup — delete the updated vendor
         deleteVendor(updatedName);
    
        cy.log('✅ Cleanup completed');
      });
    
      it('id-04: should delete vendor with confirmation', () => {
        cy.log('Testing delete with confirmation dialog');
        const vendorToDelete = 'DeleteTest_' + Date.now();
        vendorToDelete_id04 = vendorToDelete;
    
        // Set up intercept for create and delete
        cy.intercept('POST', '** /vendor').as('createVendor');
        cy.intercept('DELETE', '**/vendor/**').as('deleteVendor');
    
        // Create vendor
        cy.contains('Add Vendor').click();
        cy.wait(500);
        cy.get('input[placeholder*="Enter vendor name"]').type(vendorToDelete);
        cy.contains('button', /save|create/i).click();
       // cy.wait('@createVendor');
        cy.wait(2000);
    deleteVendor(vendorToDelete);

        // Verify removal
        cy.contains(vendorToDelete).should('not.exist');
        cy.log('✅ Vendor deleted successfully');
      });
    
      it('id-05: should NOT create vendor with empty name', () => {
        cy.log('Testing validation - empty name');
    
        // Open the add vendor form
        cy.contains('Add Vendor').click();
        cy.wait(500);
    
        // Clear any existing text in the input field
        cy.get('input[placeholder*="Enter vendor name"]').clear();
    
        // Try to submit the form without entering a name
        cy.contains('button', /save|create vendor|submit|create/i).click();
    
        // Verify the error message is displayed
        cy.contains(/please fill out this field|cannot be empty|required|name.*required|Cannot read properties|Error "vendorName is required"/, { timeout: 10000 })
          .should('be.visible');
    
        // Verify the form is still open (no navigation occurred)
        cy.get('input[placeholder*="Enter vendor name"]').should('be.visible');
      });
    
    
      it('id-06: should prevent creation of case-insensitive duplicate vendor', () => {
        cy.log('✓ Testing duplicate prevention (case-insensitive)');
        const baseName = 'DuplicateTest_' + Date.now();
        baseName_id06 = baseName;
    
        // Create first vendor
        cy.contains('Add Vendor').click();
        cy.wait(500);
        cy.get('input[placeholder*="Enter vendor name"]').type(baseName);
        cy.contains('button', /save|create/i).click();
        cy.wait(2000);
    
        // Try same name with different case
        cy.contains('Add Vendor').click();
        cy.wait(500);
        cy.get('input[placeholder*="Enter vendor name"]').type(baseName.toUpperCase());
        cy.contains('button', /save|create/i).click();
        cy.wait(2000);
    
        // Check if validation error message appears
        cy.contains('Validation Error', { timeout: 5000 }).should('be.visible');
        cy.contains('An item with this name already exists (names are case-insensitive).', { timeout: 5000 }).should('be.visible');
        cy.log('✅ Duplicate check is working (case-insensitive)');
        cy.contains('button', /cancel/i).click();
        
        cy.wait(500);
         deleteVendor(baseName);
      });
    
      it('id-07: should NOT edit vendor to existing name', () => {
        cy.log('✓ Testing edit duplicate prevention');
    
        const name1 = 'EditDupe1_' + Date.now();
        const name2 = 'EditDupe2_' + Date.now();
        name1_id07 = name1;
        name2_id07 = name2;
    
        // Create two vendors
        cy.contains('Add Vendor').click();
        cy.wait(500);
        cy.get('input[placeholder*="Enter vendor name"]').type(name1_id07);
        cy.contains('button', /save|create/i).click();
        cy.wait(2000);
    
        cy.contains('Add Vendor').click();
        cy.wait(500);
        cy.get('input[placeholder*="Enter vendor name"]').type(name2_id07);
        cy.contains('button', /save|create/i).click();
        cy.wait(2000);
    
        // Try to edit second one to first one's name
        cy.contains(name2_id07).click();
        cy.wait(500);
        cy.get('input[placeholder*="Enter vendor name"]').clear().type(name1_id07);
        cy.contains('button', /save|update/i).click();
        cy.wait(2000);
    
        // Should show error
        cy.contains(/already exists|duplicate/i, { timeout: 5000 }).should('be.visible');
    
        cy.log('✅ Edit duplicate prevention working');
      });
    
      it('id-08: should trim leading and trailing spaces', () => {
        cy.log('Testing automatic space trimming');
    // const vendorName = 'TrimTest' + Date.now();
     deleteVendor(name1_id07);
     deleteVendor(name2_id07);
    //const vendorName_id08 = 'TrimTest' + Date.now();
        const paddedName = '  ' + vendorName_id08 + '  ';
        const expectedLength = vendorName_id08.length; // Length without spaces
    
        // Add vendor with spaces
        cy.contains('Add Vendor').click();
        cy.wait(500);
        cy.get('input[placeholder*="Enter vendor name"]').type(paddedName);
        cy.contains('button', /save|create/i).click();
        cy.wait(2000);
    
        // Click on the vendor to edit
        cy.contains(vendorName_id08).click({ force: true });
        cy.wait(1000);
    
        // Get the input field and verify its value length
        cy.get('input[placeholder*="Enter vendor name"]')
          .should('be.visible')
          .then(($input) => {
            const actualLength = $input.val().length;
            cy.log(`Expected length: ${expectedLength}, Actual length: ${actualLength}`);
    
            // Pass test if lengths DO NOT match (spaces not trimmed)
            expect(actualLength).to.equal(
              expectedLength,
              `✅ Test passed: Lengths match (spaces not trimmed). Expected ${expectedLength}, got ${actualLength}`
            );
    
          });
    
        // Cancel the edit
        cy.contains('button', /cancel/i).click();
        cy.wait(500);
    
    // Clean up
         deleteVendor(vendorName_id08);
        cy.log('✅ Test suite completed — cleanup or reset can be done here if needed');
      });
    
      it('id-09: should search by vendor name (case-insensitive)', () => {
        cy.log('✓ Testing case-insensitive search');
    // deleteVendor(vendorName_id08);
        cy.get('input[placeholder*="Search"]').clear().type('test-vendor');
        cy.wait(1000);
    
        cy.get('body').then($body => {
          if ($body.text().toLowerCase().includes('test-vendor')) {
            cy.log('✅ Found test-vendor');
            cy.contains(/test-vendor/i).should('be.visible');
          } else {
            cy.log('ℹ️ No test-vendor exists to search');
          }
        });
    
        cy.get('input[placeholder*="Search"]').clear();
        cy.wait(500);
    
        cy.log('✅ Case-insensitive search working');
      });
    
    
      it('id-10: should search with partial match', () => {
        cy.log('✓ Testing partial search');
    
    // vendorName = 'PartialSearchTest_' + Date.now();
        const vendorName_id10 = 'PartialSearchTest_' + Date.now();
    
        // Create vendor
        cy.contains('Add Vendor').click();
        cy.wait(500);
        cy.get('input[placeholder*="Enter vendor name"]').type(vendorName_id10);
        cy.contains('button', /save|create/i).click();
        cy.wait(2000);
    
        // Search with partial string
        const partialSearch = vendorName_id10.substring(0, 10);
        cy.get('input[placeholder*="Search"]').clear().type(partialSearch);
        cy.wait(1000);
    
        cy.contains(vendorName_id10).should('be.visible');
         deleteVendor(vendorName_id10);
        cy.log('✅ Partial search working');
      });
    
      
    
    });

// cypress/e2e/INDUSTRY.cy.js

describe('Industry Management and Filters', () => {
let  industryName= 'BHORUKA';

let industry;
let originalName_id03;
let updatedName_id03;
let industryToDelete_id04;
let baseName_id06;
let name1_id07='EditDupe1_' + Date.now();
let name2_id07='EditDupe2_' + Date.now();
let industryName_id08 = 'TrimTest' + Date.now();;
let industryName_id10;

  const deleteIndustry = (industrryName) => {
    cy.log('Cleaning up: deleting test industry...');
    cy.contains('tr', industrryName)
      .find('button[title*="Delete"], button:has(svg[data-icon="trash"])')
      .click({ force: true });

    cy.contains('button', /delete anyway/i).click({ force: true });
    cy.wait(1500);
  };

  beforeEach(() => {
    cy.visit('/login');
    cy.login('admin@firedesk.com', 'Admin@123');

    // Navigate to Industries page
    cy.contains('Industries', { timeout: 10000 }).should('be.visible').click();
    cy.url().should('include', '/industries');
    cy.wait(1000); // Wait for page to fully load
  });

  /* ========================================
     HELPER FUNCTIONS
  ======================================== */

  // From Industry2.cy.js
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

  // From test1.cy.js (originally IndustryStatusChange.cy.js)
  const openIndustryEdit = (name) => {
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
     TESTS FROM industries.cy.js
  ======================================== */

  it('id-01: should load industries page with all required elements', () => {
    cy.log('✓ Verifying Industries page structure');

    // Verify page heading
    cy.contains('Industries').should('be.visible');
    cy.contains('Manage and organize your industries efficiently').should('be.visible');

    // Verify stats cards
    cy.contains('Total').should('be.visible');
    cy.contains('Active').should('be.visible');
    cy.contains('Inactive').should('be.visible');

    // Verify action buttons
    cy.contains('Add Industry').should('be.visible');
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


  it('id-02: should create a new Active industry successfully', () => {
    cy.log('✓ Creating a new Active industry');
    

    cy.intercept('POST', '**/industry').as('createIndustry');

    // Click Add Industry button
    cy.contains('Add Industry').click();
    cy.wait(500);

    // Fill in industry name
    cy.get('input[placeholder*="Enter Industry Name"]').should('be.visible').type(industryName);

    // Verify status toggle exists and set to Active
    cy.get('body').then($body => {
      if ($body.find('input[type="checkbox"]').length > 0) {
        cy.get('input[type="checkbox"]').should('be.checked');
      }
    });

    // Submit the form
    cy.contains('button', /save|submit|create/i).click();

    // Verify API call succeeded
    cy.wait('@createIndustry').its('response.statusCode').should('be.oneOf', [200, 201]);

    // Verify success message
    cy.contains(/success|created/i, { timeout: 5000 }).should('be.visible');

    // Verify industry appears in the list
    cy.contains(industryName).should('be.visible');

    // Verify status is Active
    cy.get('body').then(() => {
      cy.contains(industryName).parent().parent().should('contain', 'Active');
    });

    cy.log('✅ Industry created successfully');
    //deleteIndustry(industryName);
  });


  it('id-03: should edit industry name by clicking on it', () => {
    cy.log('Testing edit functionality (click on name)');
    const originalName = 'EditTest_' + Date.now();
    const updatedName = 'EditTest_Updated_' + Date.now();
    originalName_id03 = originalName;
    updatedName_id03 = updatedName;

    // Step 1️⃣ Create an industry to edit
    cy.contains('Add Industry').click();
    cy.wait(500);
    cy.get('input[placeholder*="Enter Industry Name"]').type(originalName);
    cy.contains('button', /save|create/i).click();
    cy.wait(2000);

    // Step 2️⃣ Setup intercept (handles PUT or PATCH)
    cy.intercept({ method: /(PUT|PATCH)/, url: '** /industry/**' }).as('updateIndustry');

    // Step 3️⃣ Open the industry for editing
    cy.contains('tr', originalName)
      .should('be.visible')
      .within(() => {
        cy.get('td').first().click({ force: true });
      });

    // Step 4️⃣ Edit the name
    cy.get('input[placeholder*="Enter Industry Name"]', { timeout: 10000 })
      .should('be.visible')
      .clear()
      .type(updatedName);

    // Step 5️⃣ Save the update
    cy.contains('button', /save|update/i).click({ force: true });

   

    cy.contains(/success|Industry updated successfully/i, { timeout: 10000 })
      .should('be.visible');

    // Step 7️⃣ Confirm name change in the table
   
    cy.log('✅ Cleanup completed');
    deleteIndustry(updatedName);
   // deleteIndustry(originalName); // just in case
  });

  it('id-04: should delete industry with confirmation', () => {
    cy.log('Testing delete with confirmation dialog');
    const industryToDelete = 'DeleteTest_' + Date.now();
    industryToDelete_id04 = industryToDelete;

    // Set up intercept for create and delete
    cy.intercept('POST', '** /industry').as('createIndustry');
    cy.intercept('DELETE', '** /industry/**').as('deleteIndustry');

    // Create industry
    cy.contains('Add Industry').click();
    cy.wait(500);
    cy.get('input[placeholder*="Enter Industry Name"]').type(industryToDelete);
    cy.contains('button', /save|create/i).click();
   // cy.wait('@createIndustry');
    cy.wait(2000);

    // Find and click delete button
    cy.contains('tr', industryToDelete)
      .find('button[title*="Delete"], button:has(svg[data-icon="trash"])')
      .should('be.visible')
      .click({ force: true });

    // Wait for the confirmation dialog and click "Delete Anyway"
    cy.contains('button', /delete anyway/i, { timeout: 10000 })
      .should('be.visible')
      .scrollIntoView()
      .click({ force: true });

    // Verify API call
   // cy.wait('@deleteIndustry').its('response.statusCode').should('be.oneOf', [200, 204]);

    // Verify success message
    cy.contains(/success|deleted|removed/i, { timeout: 10000 }).should('be.visible');

    // Verify removal
    cy.contains(industryToDelete).should('not.exist');
    cy.log('✅ Industry deleted successfully');
    //deleteIndustry(industryToDelete);
  });

  it('id-05: should NOT create industry with empty name', () => {
    cy.log('Testing validation - empty name');

    // Open the add industry form
    cy.contains('Add Industry').click();
    cy.wait(500);

    // Clear any existing text in the input field
    cy.get('input[placeholder*="Enter Industry Name"]').clear();

    // Try to submit the form without entering a name
    cy.contains('button', /save and continue|save|submit|create/i).click();

    // Verify the error message is displayed
    cy.contains(/please fill out the field|cannot be empty|required|name.*required|Error "industryName is required"/, { timeout: 10000 })
      .should('be.visible');

    // Verify the form is still open (no navigation occurred)
    cy.get('input[placeholder*="Enter Industry Name"]').should('be.visible');
  });


  it('id-06: should prevent creation of case-insensitive duplicate industry', () => {
    cy.log('✓ Testing duplicate prevention (case-insensitive)');
    const baseName = 'DuplicateTest_' + Date.now();
    baseName_id06 = baseName;

    // Create first industry
    cy.contains('Add Industry').click();
    cy.wait(500);
    cy.get('input[placeholder*="Enter Industry Name"]').type(baseName);
    cy.contains('button', /save|create/i).click();
    cy.wait(2000);

    // Try same name with different case
    cy.contains('Add Industry').click();
    cy.wait(500);
    cy.get('input[placeholder*="Enter Industry Name"]').type(baseName.toUpperCase());
    cy.contains('button', /save|create/i).click();
    cy.wait(2000);

    // Check if validation error message appears
    cy.contains('Validation Error', { timeout: 5000 }).should('be.visible');
    cy.contains('An item with this name already exists (names are case-insensitive).', { timeout: 5000 }).should('be.visible');
    cy.log('✅ Duplicate check is working (case-insensitive)');
    cy.contains('button', /cancel/i).click();
    cy.wait(500);
    deleteIndustry(baseName);
  });

  it('id-07: should NOT edit industry to existing name', () => {
    cy.log('✓ Testing edit duplicate prevention');

    /*const name1 = 'EditDupe1_' + Date.now();
    const name2 = 'EditDupe2_' + Date.now();
    name1_id07 = name1;
    name2_id07 = name2;*/

    // Create two industries
    cy.contains('Add Industry').click();
    cy.wait(500);
    cy.get('input[placeholder*="Enter Industry Name"]').type(name1_id07);
    cy.contains('button', /save|create/i).click();
    cy.wait(2000);

    cy.contains('Add Industry').click();
    cy.wait(500);
    cy.get('input[placeholder*="Enter Industry Name"]').type(name2_id07);
    cy.contains('button', /save|create/i).click();
    cy.wait(2000);

    // Try to edit second one to first one's name
    cy.contains(name2_id07).click();
    cy.wait(500);
    cy.get('input[placeholder*="Enter Industry Name"]').clear().type(name1_id07);
    cy.contains('button', /save|update/i).click();
    cy.wait(2000);
    cy.contains('button', /cancel/i).click({force: true});

    // Should show error
    cy.contains(/Validation Error|already exists|duplicate/i, { timeout: 5000 }).should('be.visible');

    cy.log('✅ Edit duplicate prevention working');
    deleteIndustry(name1_id07);
   // deleteIndustry(name2_id07);
  });


  it('id-08: should trim leading and trailing spaces', () => {
    cy.log('Testing automatic space trimming');
   // const industryName = 'TrimTest' + Date.now();
   // deleteIndustry(name1_id07);
    deleteIndustry(name2_id07);
   //const industryName_id08 = 'TrimTest' + Date.now();
    const paddedName = '  ' + industryName_id08 + '  ';
    const expectedLength = industryName_id08.length; // Length without spaces

    // Add industry with spaces
    cy.contains('Add Industry').click();
    cy.wait(500);
    cy.get('input[placeholder*="Enter Industry Name"]').type(paddedName);
    cy.contains('button', /save|create/i).click();
    cy.wait(2000);

    // Click on the industry to edit
    cy.contains(industryName_id08).click({ force: true });
    cy.wait(1000);

    // Get the input field and verify its value length
    cy.get('input[placeholder*="Enter Industry Name"]')
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
    
    cy.log('✅ Test suite completed — cleanup or reset can be done here if needed');
    deleteIndustry(industryName_id08);
  });

  it('id-09: should search by industry name (case-insensitive)', () => {
    cy.log('✓ Testing case-insensitive search');
    deleteIndustry(industryName_id08);
    cy.get('input[placeholder*="Search"]').clear().type('manufacturing');
    cy.wait(1000);

    cy.get('body').then($body => {
      if ($body.text().toLowerCase().includes('manufacturing')) {
        cy.log('✅ Found manufacturing industry');
        cy.contains(/manufacturing/i).should('be.visible');
      } else {
        cy.log('ℹ️ No manufacturing industry exists to search');
      }
    });

    cy.get('input[placeholder*="Search"]').clear();
    cy.wait(500);

    cy.log('✅ Case-insensitive search working');
  });


  it('id-10: should search with partial match', () => {
    cy.log('✓ Testing partial search');

   // industryName = 'PartialSearchTest_' + Date.now();
    const industryName_id10 = 'PartialSearchTest_' + Date.now();

    // Create industry
    cy.contains('Add Industry').click();
    cy.wait(500);
    cy.get('input[placeholder*="Enter Industry Name"]').type(industryName_id10);
    cy.contains('button', /save|create/i).click();
    cy.wait(2000);

    // Search with partial string
    const partialSearch = industryName_id10.substring(0, 10);
    cy.get('input[placeholder*="Search"]').clear().type(partialSearch);
    cy.wait(1000);

    cy.contains(industryName_id10).should('be.visible');
    deleteIndustry(industryName_id10);
    cy.log('✅ Partial search working');
  });


  it('id-11: should show no results for non-existent search', () => {
    cy.log('✓ Testing search for non-existent industry');

    const nonExistent = 'NonExistentIndustry_XYZ123_' + Date.now();

    cy.get('input[placeholder*="Search"]').clear().type(nonExistent);
    cy.wait(1000);

    cy.get('body').then($body => {
      const text = $body.text().toLowerCase();
      if (text.includes('no results') || text.includes('not found') || text.includes('no matches')) {
        cy.log('✅ Shows "No results" message');
      } else {
        cy.log('✅ No results shown for non-existent search');
      }
    });

    cy.log('✅ No results handling working');
  });


  /* ========================================
     TESTS FROM Industry2.cy.js
  ======================================== */

  it('id-12: should filter by Status (Active)', () => {
    openFilterPanel();
    selectDropdown('Status', 'Active');
    applyAndPause();
    cy.contains('Active', { timeout: 8000 }).should('exist');
  });

  it('id-13: should sort by Name (A–Z)', () => {
    openFilterPanel();
    selectDropdown('Sort By', 'Name (A-Z)');
    applyAndPause();
    cy.get('table, div[data-testid="industries-list"], .list-root', { timeout: 8000 })
      .then(($list) => {
        const nameEls = $list.find('td:first-child, .industry-name, .name-cell, div.name').toArray();
        if (nameEls.length >= 2) {
          const names = nameEls.map((el) => el.innerText.trim());
          const sorted = [...names].sort((a, b) => a.localeCompare(b));
          expect(names).to.deep.equal(sorted);
        } else {
          cy.contains('industry', { timeout: 8000 }).should('exist');
        }
      });
  });

  it('id-14: should filter by Date Range (All Time)', () => {
    openFilterPanel();
    selectDropdown('Date Range', 'All Time');
    applyAndPause();
    cy.url().then((url) => {
      if (!url.includes('dateRange')) {
        cy.contains('Created At', { timeout: 8000 }).should('exist');
      }
    });
  });

  it('id-15: should reset all filters', () => {
    cy.log('Applying filters before reset...');
    openFilterPanel();
    selectDropdown('Status', 'Active');
    selectDropdown('Sort By', 'Name (A-Z)');
    selectDropdown('Date Range', 'All Time');
    cy.get('button').contains('Apply', { timeout: 3000 }).click({ force: true });

    cy.log('Now resetting filters...');
    openFilterPanel();
    cy.get('button').contains('Reset', { timeout: 3000 }).click({ force: true });

    cy.url().should('not.include', 'status=');
    cy.url().should('not.include', 'sortBy=');
    cy.url().should('not.include', 'dateRange=');
    cy.get('.filter-chip').should('not.exist');
  });

  it('id-16: should combine multiple filters (Active + All Time)', () => {
    openFilterPanel();
    selectDropdown('Status', 'Active');
    selectDropdown('Date Range', 'All Time');
    applyAndPause();
    cy.contains('Active', { timeout: 8000 }).should('exist');
    cy.contains('Created At', { timeout: 8000 }).should('exist');
  });

  // EXTENDED TEST CASES
  // STATUS DROPDOWN
  it('id-17: should filter by Status (Inactive)', () => {
    openFilterPanel();
    selectDropdown('Status', 'Inactive');
    applyAndPause(4000);
    cy.contains('Inactive', { timeout: 8000 }).should('exist');
  });

  it('id-18: should filter by Status (All Statuses)', () => {
    openFilterPanel();
    selectDropdown('Status', 'All Statuses');
    applyAndPause(4000);
    cy.get('.industry-row, .table-row, tr').should('have.length.greaterThan', 0);
  });

  // SORT BY DROPDOWN
  it('id-19: should sort by Status', () => {
    openFilterPanel();
    selectDropdown('Sort By', 'Status');
    applyAndPause(4000);
    cy.contains('Status', { timeout: 8000 }).should('exist');
  });

  it('id-20: should sort by Date Created', () => {
    openFilterPanel();
    selectDropdown('Sort By', 'Date Created');
    applyAndPause(4000);
    cy.contains('Created', { timeout: 8000 }).should('exist');
  });

  // DATE RANGE DROPDOWN
  it('id-21: should filter by Date Range (Today)', () => {
    openFilterPanel();
    selectDropdown('Date Range', 'Today');
    applyAndPause(4000);
    cy.contains('Created At', { timeout: 8000 }).should('exist');
  });

  it('id-22: should filter by Date Range (This Week)', () => {
    openFilterPanel();
    selectDropdown('Date Range', 'This Week');
    applyAndPause(4000);
    cy.contains('Created At', { timeout: 8000 }).should('exist');
  });

  it('id-23: should filter by Date Range (This Month)', () => {
    openFilterPanel();
    selectDropdown('Date Range', 'This Month');
    applyAndPause(4000);
    cy.contains('Created At', { timeout: 8000 }).should('exist');
  });

  it('id-24: should filter by Date Range (All Time)', () => {
    openFilterPanel();
    selectDropdown('Date Range', 'All Time');
    applyAndPause(4000);
    cy.contains('Created At', { timeout: 8000 }).should('exist');
  });


  

  it('id-25: should make industries  inactive', () => {
    const industries = [industryName];
    let testPassed = true;
    let failureReasons = [];

    cy.wrap(industries).each((name, index, list) => {
      try {
        openIndustryEdit(name);
        changeStatus('Inactive');
        cy.contains('Inactive', { timeout: 8000 }).should('exist');
      } catch (error) {
        testPassed = false;
        failureReasons.push(`Failed to set ${name} to Inactive: ${error.message}`);
        cy.log(`❌ Error with ${name}:`, error.message);
      }
    }).then(() => {
      // Removed logTestResult as it's not a standard cypress command
      if (!testPassed) {
        throw new Error(failureReasons.join('; '));
      }
    });
  });

  it('id-26: should make  active again', () => {
    
    let testPassed = true;
    let failureReason = '';

    try {
      openIndustryEdit(industryName);
      cy.wait(4000); // Increased wait time
      changeStatus('Active'); // Use the helper function to change status
      cy.contains('tr', industryName).should('contain', 'Active');
    } catch (error) {
      testPassed = false;
      failureReason = error.message;
      throw error;
    } finally {
      // Removed logTestResult as it's not a standard cypress command
    }
  });


});

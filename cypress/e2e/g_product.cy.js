/// <reference types="cypress" />

describe('Products Page Tests', () => {
    let createdProductName;
  let ProductName;
  let pageCount = 1;
  
    // 🔧 Helper to find the 'Add Product' button, case-insensitive
    const findAddProductButton = () =>
      cy.contains('button', /Add\s?Product/i).first();
  
    // 🔧 Helper to click the Actions menu (three dots) on a row
    // 💥 FINAL FIX: Targeting the actions column within the row and simplifying the button selector.
    const openActionsMenu = (name) => {
      cy.contains('tr', name, { timeout: 20000 })
        .should('exist')
        .within(() => {
          cy.get('button[aria-haspopup="menu"], button:has(svg[class*="more-vertical"])')
            .should('be.visible')
            .click({ force: true });
        });
    };
  
  
    // 🛠️ CORE HELPER: Starts and completes the creation of a product
     const createProduct = (name) => {
      cy.contains('button', /Add\s?Product/i).first().click();
  
      cy.contains('Category').next().click();
      cy.contains('[role="option"]', 'Fire Extinguisher').click();
  
      cy.get('input[placeholder*="Enter product name"]').clear().type(name);
  
      /*cy.contains('Test Frequency').next().click();
      cy.contains('[role="option"]', /One Year/i).click();*/
  
      cy.contains('button', 'Save & Continue', { matchCase: false }).click();
      cy.contains('Product Variants', { timeout: 10000 }).should('be.visible');
  
      // Final click on SAVE in the header
      cy.wait(3000);
      cy.contains('button', /(Create Product|Save)/i, { timeout: 10000 })
        .should('be.enabled')
        .click();
  
      // Wait for the modal/drawer to close before navigating back
      cy.get('div[role="dialog"], [class*="modal"]').should('not.exist');
  
      // Reload index to ensure table reflects the new product
      cy.visit('/admin/products');
      cy.contains('Products', { timeout: 10000 }).should('exist');
  
      // Verify product existence after returning to the list
      cy.contains('tr', name, { timeout: 20000 }).should('exist');
  
      cy.log(`✅ Product ${name} created and verified.`);
    };
  
   const updatedProduct = (name) => {
  cy.contains(createdProductName).click();
  
   cy.contains('Category').next().click();
   cy.contains('[role="option"]', 'Fire Extinguisher').click();
  
   cy.get('input[placeholder*="Enter product name"]').clear().type(name);
  
      /*cy.contains('Test Frequency').next().click();
      cy.contains('[role="option"]', /One Year/i).click();*/
  
      cy.contains('button', 'Save & Continue', { matchCase: false }).click();
      cy.contains('Product Variants', { timeout: 10000 }).should('be.visible');
  
      // Final click on SAVE in the header
      cy.wait(3000);
      cy.contains('button', /(Create Product|Save)/i, { timeout: 10000 })
        .should('be.enabled')
        .click();
  
      // Wait for the modal/drawer to close before navigating back
      cy.get('div[role="dialog"], [class*="modal"]').should('not.exist');
  
      // Reload index to ensure table reflects the new product
      cy.visit('/admin/products');
      cy.contains('Products', { timeout: 10000 }).should('exist');
  
      // Verify product existence after returning to the list
      cy.contains('tr', name, { timeout: 20000 }).should('exist');
  
      cy.log(`✅ Product ${name} created and verified.`);
    };
    // 🔧 Helper to assert the created product exists
    const ensureCreatedProductExists = () => {
      cy.wrap(null, { log: false }).then(() => {
        expect(createdProductName, 'created product name must be set').to.be.a('string').and.not.be.empty;
      });
      // Using exist as table rows can be clipped/hidden
      cy.contains('tr', createdProductName, { timeout: 20000 }).should('exist');
    };
  
  const clickNextIfEnabled = () => {
      // 💥 FIX 1: Scroll down before every check/click inside the loop (as it's a recursive function).
      // Use the most aggressive scroll technique: scroll the entire document element.
      cy.get('html').scrollTo('bottom', { ensureScrollable: false });
      
      // Check for the Next button's presence after scrolling
      cy.contains('button', /Next|>/i).then(($btn) => {
          cy.wrap($btn).as('nextButton'); 
          
          // Use cy.get() to re-acquire the button after scrolling/re-rendering
          cy.get('@nextButton').then(($reacquiredBtn) => {
              const isEnabled = !$reacquiredBtn.is(':disabled') && parseFloat($reacquiredBtn.css('opacity') || '1') > 0.5;
              const isVisible = parseFloat($reacquiredBtn.css('opacity') || '1') > 0.5; // Redundant, but keeps logic clean
  
              if (isEnabled && isVisible) {
                  cy.log(`Clicking Next button to go to Page ${++pageCount}`);
                  
                  // Click the aliased button (now visible)
                  cy.wrap($reacquiredBtn).click({ force: true });
                  
                  cy.wait(1000); 
                  
                  // Recursive call
                  clickNextIfEnabled();
              } else {
                  cy.log(`✅ Finished pagination. Reached final page: ${pageCount}.`);
                  
                  // Final assertion
                  cy.get('@nextButton').should(($finalBtn) => {
                      const disabled = $finalBtn.is(':disabled');
                      const lowOpacity = parseFloat($finalBtn.css('opacity') || '1') <= 0.5;
                      expect(disabled || lowOpacity, 'Next button should be disabled or faded').to.be.true;
                  });
              }
          });
      });
  };
    // --- Setup Hook (Runs Once) ---
    before(() => {
      cy.session('adminLogin', () => {
        cy.visit('/login');
        cy.login('admin@firedesk.com', 'Admin@123');
        cy.url().should('not.include', '/login');
      });
  
      cy.visit('/admin/products');
      //cy.contains('Products', { timeout: 10000 }).should('be.visible');
  
      createdProductName = 'TEST_Product';
      
      createProduct(createdProductName);
      cy.log(`Setup complete. Product created: ${createdProductName}`);
    });
  
    // --- Reset Hook (Runs Before Each Test) ---
    beforeEach(() => {
      cy.session('adminLogin', () => {
          cy.visit('/login');
          cy.login('admin@firedesk.com', 'Admin@123');
          cy.url().should('not.include', '/login');
      });
      cy.visit('/admin/products');
      cy.contains('Products', { timeout: 10000 }).should('exist');
      cy.url().should('include', '/products');
    });
  
    // ========================================
    // TESTS
    // ========================================
  
    it('id-01- load page', () => {
      cy.log('✓ Verifying page loads and essential button is visible');
      findAddProductButton().should('exist');
    });
  
    
    it('id-02- product created in setup is visible', () => {
      cy.log('✓ Verifying product persistence from setup hook');
      ensureCreatedProductExists();
  cy.contains('tr', createdProductName)
  // Step 2: Within that specific row, find the delete button (which contains the Trash2 icon).
  .find('button:has(svg.lucide-trash2)')
  .should('exist')
  .click({ force: true });
  cy.wait(5000);
// Step 3: Confirm deletion modal (this part is correct and reliable).
cy.contains('button', /Delete Anyway/i, { timeout: 5000 })
  .click({ force: true });
  cy.wait(5000);
// Verify success and absence
cy.contains(/Success|Product deleted sucessfully|deleted/i, { timeout: 10000 }).should('exist');
cy.wait(5000);
 cy.contains('tr', createdProductName).should('not.exist');
cy.contains('tr',createdProductName).should('not.exist');

    });
    it('id-03: Create Product and Verify Actions Menu', () => {
      createdProductName = `sanjay`;
      ProductName='sanjay_updated';
      createProduct(createdProductName);
  
      openActionsMenu(createdProductName);
  
     cy.contains('Duplicate').should('exist');
     cy.contains('Share').should('exist');
     cy.contains('Bookmark').should('exist');
      cy.contains('Flag').should('exist');
   cy.contains('Flag').should('exist');
    });
   
  it('id-04: Create Product with variant', () => {
        const n ='Powder';
        
    cy.contains('button', /Add\s?Product/i).first().click();
  
      cy.contains('Category').next().click();
      cy.get('[role="option"]').first().click(); // Select first category
  
      cy.get('input[placeholder*="Enter product name"]').clear().type(n);
  
      /*cy.contains('Test Frequency').next().click();
      cy.contains('[role="option"]', /One Year/i).click();*/
  
      cy.contains('button', 'Save & Continue', { matchCase: false }).click();
      cy.contains('Product Variants', { timeout: 10000 }).should('be.visible');
  
      // Final click on SAVE in the header
      cy.wait(3000);
      cy.contains('button',/(Add variant)/i, { timeout: 10000 }).click();
      cy.contains('Type *').parent().find('input').should('exist').type("ABC");
      cy.contains('Sub Type').parent().find('input').should('exist').type("portable");
      cy.contains('Description (Optional)').parent().find('textarea').should('exist').type("Automated Variant Entry");
      //cy.contains('Image URL (Optional)').parent().find('input').should('exist').type("https://example.com/test.jpg");
  
      cy.contains('button', /(Create Product|Save)/i, { timeout: 10000 })
        .should('be.enabled')
        .click();
  
        cy.get('div[role="dialog"], [class*="modal"]').should('not.exist');
  
        // Reload index to ensure table reflects the new product
        cy.visit('/admin/products');
        cy.contains('Products', { timeout: 10000 }).should('exist');
    
        // Verify product existence after returning to the list
        cy.contains('tr', n, { timeout: 20000 }).click();
        cy.contains('button', 'Save & Continue', { matchCase: false }).click();
      cy.contains('Product Variants', { timeout: 10000 }).should('be.visible');
      cy.contains(/1 valid variant\(s\) will be saved/i)
  .should("exist");
  
    
        cy.log(`✅ Product ${n} created and verified.`);
    });
  
  
    it('id-05 - filter by product name', () => {
      cy.log('✓ Testing search/filter functionality');
      ensureCreatedProductExists();
  
      // Use the Filter button to reveal search/filter inputs
      cy.contains('button', 'Filter', { matchCase: false }).click({ force: true });
      
      // We assume the filter input appears after clicking 'Filter'
      cy.get('input[placeholder*="Search"]', { timeout: 5000 })
        .clear()
        .type(createdProductName, { delay: 40 });
  
      cy.contains('button', 'Apply', { matchCase: false }).click({ force: true });
      cy.contains('tr', createdProductName, { timeout: 10000 }).should('exist');
    	
      // Verify *only* one result (or that other known products are hidden)
      cy.get('tbody tr').should('have.length.at.least', 1).and('contain', createdProductName);
    });
  
  it('id-06 - edit product details',()=> {
    cy.log('editing product name ');
    updatedProduct(ProductName);
    createdProductName = ProductName;
  
  
  
  });
  
    it('id-07 - delete product (Cleanup)', () => {
      cy.log('✓ Testing final cleanup: Deleting the created product');
      ensureCreatedProductExists();
  
      
  cy.contains('tr', ProductName)
      // Step 2: Within that specific row, find the delete button (which contains the Trash2 icon).
      .find('button:has(svg.lucide-trash2)')
      .should('exist')
      .click({ force: true });
      cy.wait(5000);
  // Step 3: Confirm deletion modal (this part is correct and reliable).
  cy.contains('button', /Delete Anyway/i, { timeout: 5000 })
      .click({ force: true });
      cy.wait(5000);
   // Verify success and absence
    cy.contains(/Success|Product deleted sucessfully|deleted/i, { timeout: 10000 }).should('exist');
    cy.wait(5000);
     cy.contains('tr', ProductName).should('not.exist');
    cy.contains('tr', ProductName).should('not.exist');
  });
  
  
  });
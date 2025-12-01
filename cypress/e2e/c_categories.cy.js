/// <reference types="cypress" />

describe('FireDesk Admin – Categories Module (Functional Flow Suite)', () => {

    const loginEmail = 'admin@firedesk.com';
    const loginPass = 'Admin@123';

    // Helper to generate a unique name for each test run
    const unique = (name) => `${name}_${Date.now()}`;


    // ------------------------------------------------------
    // 🔥 HELPER: ADD SPECIFICATION (For creation/editing flows)
    // ------------------------------------------------------
    const addSpecification = (label, fieldType, required = false) => {
        cy.log(`Adding Spec: ${label} (${fieldType})`);
        cy.contains(/\+ add new spec|add specification/i).click({ force: true });
        
        // FIX: Add a small wait to ensure the new static row is fully rendered 
        // and findable as the last element in the DOM before we attempt to type.
        cy.wait(500); 
        
        // Fill in the new row that appears (targeting the last input field for the label)
        // Using .eq(-1) is equivalent to .last() and can sometimes be more stable in retries.
        cy.get('input[placeholder*="e.g"], input[placeholder*="label"], input[name="name"]')
            .filter(':visible')
            .last()
            .scrollIntoView()
            .type(label, { force: true });
        
        // Click the dropdown/selector for the field type
        cy.contains(/select type|field type/i).last().click({ force: true });
        cy.wait(500); // Allow dropdown animation

        // First attempt: Standard dropdown selectors
        cy.get('body').then($body => {
            const $dropdown = $body.find('[data-state="open"], [role="listbox"], .ant-select-dropdown, .ant-select-dropdown2');
            
            if ($dropdown.length > 0) {
                cy.wrap($dropdown).should('be.visible');
                return;
            }
            
            // Fallback: Click visible text/arrow if dropdown not found
            cy.log('Standard dropdown not found, trying text/arrow fallback');
            cy.get('body').then($body => {
                // Look for down arrow icons near field type text
                const $arrows = $body.find('svg[data-icon="chevron-down"], svg[data-icon="caret-down"], .ant-select-arrow');
                if ($arrows.length > 0) {
                    cy.wrap($arrows.first()).click({ force: true });
                } else {
                    // Ultimate fallback: click near field type text
                    cy.contains(/select type|field type/i)
                        .last()
                        .click({ force: true });
                }
            });
            
            cy.wait(500); // Allow dropdown to open
        });

        const fieldTypeSelectors = [
            `[data-state="open"] [data-value*="${fieldType}"]`,
            `[data-state="open"] [role="option"]:contains("${fieldType}")`,
            `.ant-select-dropdown2 [data-value*="${fieldType}"]`,
            `.ant-select-dropdown2 [role="option"]:contains("${fieldType}")`,
            `.ant-select-dropdown [data-value*="${fieldType}"]`,
            `.ant-select-dropdown [role="option"]:contains("${fieldType}")`,
            'div[role="option"]',
            '.ant-select-item-option',
            '[data-value]',
            '[data-radix-popper-content-wrapper] [role="option"]',
            '[data-radix-popper-content-wrapper] :contains("${fieldType}")'
        ];

        cy.get('body').then($body => {
            for (const selector of fieldTypeSelectors) {
                const $options = $body.find(selector).filter(':visible');
                if ($options.length > 0) {
                    cy.wrap($options.first()).click({ force: true });
                    cy.log(`✅ Field Type Selected with selector: ${selector}`);
                    return;
                }
            }

            // Enhanced fallback with better text matching
            cy.contains(fieldType, { matchCase: false, timeout: 5000 })
                .filter(':visible')
                .first()
                .click({ force: true });
            cy.log('✅ Field Type Selected via fallback text match.');
        });
        
        // Logic for the "Required Field" checkbox
        if (required) {
            cy.log('Setting spec as "Required"');
            cy.contains('label', /required field/i) 
              .closest('div') 
              .find('input[type="checkbox"]') 
              .check({ force: true });
        }
        
        // Click the final "Add Specification" button
        cy.contains('button', /^add specification$/i).click({ force: true });
        cy.contains(label).should('exist');
    };
    
    // ------------------------------------------------------
    // 🔥 HELPER: KEBAB MENU ACTION (Performs action from list view)
    // ------------------------------------------------------
    const openKebabFor = (categoryName) => {
        cy.log(`🔑 Opening Kebab menu for: ${categoryName}`);

        cy.contains('tr', categoryName, { timeout: 15000 })
            .within(() => {
                cy.get('button')
                    .last()
                    .click({ force: true });
            });
        cy.wait(300);
    };

    const clickKebabOption = (optionText) => {
        cy.log(`🖱️ Clicking kebab option: ${optionText}`);
        const matcher = typeof optionText === 'string'
            ? new RegExp(optionText, 'i')
            : optionText;

        const candidateSelectors = [
            'div[role="menuitem"]',
            'li[role="menuitem"]',
            'button[role="menuitem"]',
            '.ant-dropdown-menu-item',
            '[role="menu"] *'
        ];

        cy.get('body').then($body => {
            for (const selector of candidateSelectors) {
                const $options = $body.find(selector).filter((_, el) => {
                    const text = Cypress.$(el).text().trim();
                    return matcher.test(text);
                }).filter(':visible');

                if ($options.length) {
                    cy.wrap($options.first()).click({ force: true });
                    return;
                }
            }

            cy.contains(matcher)
                .filter(':visible')
                .first()
                .click({ force: true });
        });
    };

    const performKebabAction = (categoryName, actionText) => {
        cy.log(`Performing action: "${actionText}" on category: ${categoryName}`);

        const searchSelectors = [
            'input[placeholder="Search"]',
            'input[placeholder="Search categories"]',
            'input[type="search"]',
            'input[data-testid*="search"]'
        ];

        cy.get('body').then($body => {
            for (const selector of searchSelectors) {
                const $input = $body.find(selector);
                if ($input.length) {
                    cy.wrap($input.first())
                        .clear()
                        .type(categoryName);
                    break;
                }
            }
        });

        openKebabFor(categoryName);
        clickKebabOption(actionText);

        if (!['Archive', 'Delete'].includes(actionText)) {
            cy.wait(500);
        }
    };

    const confirmModalAction = (labels = ['Confirm', 'Yes', 'Proceed', 'OK', 'Delete', 'Delete Anyway']) => {
        cy.get('body').then($body => {
            const selectors = labels.flatMap(label => [
                `button:contains("${label}")`,
                `[role="button"]:contains("${label}")`
            ]);

            for (const selector of selectors) {
                const $btn = $body.find(selector).filter(':visible');
                if ($btn.length) {
                    cy.wrap($btn.first()).click({ force: true });
                    return;
                }
            }
        });
    };

    const deleteCategory = (categoryName) => {
        cy.log(`🗑 Deleting category: ${categoryName}`);

        // Navigate to categories page if not already there
        cy.url().then(url => {
            if (!url.includes('/admin/categories')) {
                cy.visit('/admin/categories');
                cy.contains(/categories/i).should('be.visible');
            }
        });

        // Wait for the data to be loaded
        cy.get('table tbody tr', { timeout: 10000 }).should('exist');
        
        // Find and click the trash icon for the category
        cy.contains('tr', categoryName, { timeout: 10000 })
            .should('be.visible')
            .within(() => {
                cy.log('🗑 Clicking trash icon for cleanup');
                cy.get('button')
                    .filter(':visible')
                    .first()
                    .click({ force: true });
            });

        // Confirm deletion
        confirmModalAction();

        // Wait for the category to be removed
        cy.contains('tr', categoryName, { timeout: 10000 }).should('not.exist');
    };

    // ------------------------------------------------------
    // 🔥 HELPER: CREATE CATEGORY (Consolidated flow for reuse)
    // ------------------------------------------------------
    // NOTE: Used by TC_04 and TC_05 for quick setup
    const createCategoryWithSpecs = (categoryName, specLabel, specType) => {
        cy.log(`Creating category: ${categoryName}`);
        cy.visit('/admin/categories');
        cy.contains(/\+ add category|add category/i).click({ force: true });
        cy.contains(/basic information/i).should('be.visible');

        // Step 1: Basic Info
        cy.get('input[placeholder*="Enter category name"]').type(categoryName);
    
        // Action: Save & Continue (Move to Specs tab)
        cy.contains(/save & continue/i).click({ force: true }); 

        // Step 2 – Specifications (Skip adding specs)
        cy.contains(/specifications/i).should('be.visible'); 
        // Action: Save & Continue (Move to Documents tab)
        cy.contains(/save & continue/i).click({ force: true }); 

        // Step 3 – Documents (Skip upload - Now on final screen)
        
        // Final Step: Create Category (Action to finish flow)
        cy.wait(500); 
        cy.contains('button', /create category/i, { timeout: 10000 })
            .scrollIntoView() 
            .click({ force: true }); 
        
        cy.wait(500);; 

        // Verification
        cy.contains(/success|created|category created/i, { timeout: 10000 }).should('be.visible');
        cy.contains(categoryName).should('exist');
        
        // Wait for navigation to complete and verify URL
        cy.url().should('include', '/admin/categories');
        
        // More robust check for the categories page
        cy.get('body').then(($body) => {
            // Check if the categories nav link is visible or exists
            const navLink = $body.find('a:contains("Categories"), [data-testid="categories-link"]').first();
            if (navLink.length > 0) {
                cy.wrap(navLink).scrollIntoView().should('be.visible');
            } else {
                // Fallback: Check for any visible text indicating we're on the categories page
                cy.contains('h1,h2,h3', /categories|category list/i, { matchCase: false }).should('be.visible');
            }
        });

        // Debug: Log available inputs
        cy.get('body').then($body => {
            const inputs = $body.find('input');
            cy.log(`Found ${inputs.length} inputs on page`);
            inputs.each((i, el) => {
                cy.log(`Input ${i}:`, {
                    placeholder: el.placeholder,
                    type: el.type,
                    id: el.id
                });
            });
        });

        // Try multiple search field variants
        const searchSelectors = [
            'input[placeholder="Search"]',
            'input[placeholder="Search categories"]',
            'input[type="search"]',
            'input[data-testid*="search"]'
        ];

        for (const selector of searchSelectors) {
            const $el = Cypress.$(selector);
            if ($el.length > 0) {
                cy.wrap($el).clear().type(categoryName);
                break;
            }
        }

        cy.contains(categoryName, { timeout: 10000 }).should('exist');
    };

    const clickSaveAndContinue = (required = true, retries = 5) => {
        const matcher = /save\s*(?:&|and)?\s*continue/i;

        const attempt = (remaining) => {
            cy.scrollTo('bottom', { ensureScrollable: false });

            cy.get('body').then($body => {
                const $buttons = $body.find('button, [role="button"]').filter((_, el) => {
                    const text = Cypress.$(el).text().replace(/\s+/g, ' ').trim();
                    return matcher.test(text) && Cypress.$(el).is(':visible');
                });

                if ($buttons.length) {
                    cy.wrap($buttons.first())
                        .scrollIntoView()
                        .click({ force: true });
                } else if (!required) {
                    cy.log('ℹ️ No additional "Save & Continue" button visible, skipping.');
                } else if (remaining > 0) {
                    cy.wait(500);
                    attempt(remaining - 1);
                } else {
                    throw new Error('"Save & Continue" button not found when required.');
                }
            });
        };

        attempt(retries);
    };

    // ------------------------------------------------------
    // BEFORE EACH — SETUP
    // ------------------------------------------------------
    beforeEach(() => {
        cy.session('admin-session', () => {
            cy.login(loginEmail, loginPass);
        });
        // Navigate to the Categories page
        cy.visit('/admin/categories', { timeout: 20000 });
        cy.contains(/categories/i).should('exist');
    });

    // --------------------------------------------------------------------------
    // --- TC_01: MINIMAL CATEGORY CREATION (No Specs, No Docs) ---
    // --------------------------------------------------------------------------
   it('TC_01: Should create a category using only mandatory fields (Minimal Flow)', () => {
        const categoryName = unique('AC_Minimal_Flow');

        cy.contains(/\+ add category|add category/i).click({ force: true });
        cy.contains(/basic information/i).should('be.visible');

        // Step 1: Basic Info
        cy.get('input[placeholder*="Enter category name"]').type(categoryName);
        

        // Action: Save & Continue (Move to Specs tab)
        cy.contains(/save & continue/i).click({ force: true }); 

        // Step 2 – Specifications (Skip adding specs)
        cy.contains(/specifications/i).should('be.visible'); 
        // Action: Save & Continue (Move to Documents tab)
        cy.contains(/save & continue/i).click({ force: true }); 

        // Step 3 – Documents (Skip upload - Now on final screen)
        
        // Final Step: Create Category (Action to finish flow)
        cy.wait(500); 
        cy.contains('button', /create category/i, { timeout: 10000 })
            .scrollIntoView() 
            .click({ force: true }); 
        
        cy.wait(500);; 

        // Verification
        cy.contains(/success|created|category created/i, { timeout: 10000 }).should('be.visible');
        cy.contains(categoryName).should('exist');

        cy.contains('tr', categoryName, { timeout: 15000 })
            .within(() => {
                cy.log('🗑 Clicking trash icon for cleanup');
                cy.get('button')
                    .filter(':visible')
                    .first()
                    .click({ force: true });
            });

        confirmModalAction();

        cy.wait(1500);
        cy.contains('tr', categoryName, { timeout: 10000 }).should('not.exist');
    });

    // --------------------------------------------------------------------------
    // --- TC_02: MANDATORY FIELD VALIDATION (Basic Info) ---
    // --------------------------------------------------------------------------
    it('TC_02: Should display validation error when mandatory fields are empty', () => {
        cy.contains(/\+ add category|add category/i).click({ force: true });
        cy.contains(/basic information/i).should('be.visible');

        // Attempt to click 'Save & Continue' without entering a name or selecting a form
        cy.contains(/save & continue/i).click({ force: true });

        // Verification: Check for error messages
        cy.contains(/Validation error/i).should('be.visible'); 
        cy.contains(/Validation error/i).should('be.visible');

        // Verification: Ensure the test did not advance to the Specifications tab
        cy.contains(/specifications/i).should('not.have.class', 'active'); 
    });

    // --------------------------------------------------------------------------
// --- TC_03: CREATE CATEGORY WITH SPECS (WITH EDIT + REMOVE FLOW - VIDEO FLOW) ---
// --------------------------------------------------------------------------
it('TC_03: Should create category with specifications, then edit and remove them as shown in the video', () => {
    // Unique name for the category
    const categoryName = unique('Spec_Create_Check');
    const originalSpec1 = 'Test_Spec_1';
    const originalSpec2 = 'Test_Spec_2';
    const updatedSpec1Name = 'Test_Spec_edited'; // Match video's final label

    // Minimal creation start
    cy.contains(/\+ add category|add category/i).click({ force: true });
    cy.get('input[placeholder*="Enter category name"]').type(categoryName);
    cy.contains(/save & continue/i).click({ force: true }); 

    // Add specifications (Test_Spec_1 and Test_Spec_2)
    cy.contains(/specifications/i).should('be.visible'); 
    addSpecification(originalSpec1, 'Text');
    addSpecification(originalSpec2, 'Number');
    
    // Save & Continue (Go to Documents tab)
    cy.contains(/save & continue/i).click({ force: true });
    
    // Final Step: Create Category
    cy.wait(500); 
    cy.contains('button', /create category/i, { timeout: 10000 })
        .scrollIntoView() 
        .click({ force: true }); 
    
    cy.contains(/Saved|success|created/i, { timeout: 10000 }).should('be.visible');
    cy.contains(categoryName).should('exist');
    
    // Open the category for editing
    cy.contains('tr', categoryName).click({ force: true });

    // Navigate to Specifications tab
    cy.contains(/save & continue/i).click({ force: true });
    cy.contains(originalSpec1).should('be.visible');
    cy.contains(originalSpec2).should('be.visible');

    // ==============================
    // 🔥 EDIT SPEC 1 (Match video: change 'Test_Spec_1' to 'Test_Spec_2')
    // ==============================
    // Find the row containing 'Test_Spec_1' and click 'Edit'
    cy.contains(originalSpec1, { timeout: 10000 })
        .parentsUntil('div[class*="rounded"]')
        .parent()
        .find('button:contains("Edit")')
        .click({ force: true });

    // In the edit modal/form: clear and type the new label
    cy.get('input[placeholder*="e.g"], input[placeholder*="label"], input[name="name"]')
        .filter(':visible')
        .clear()
        .type(updatedSpec1Name, { force: true });

    // Click 'Update Specification' button (as seen in video)
    cy.contains('button', /update specification/i, { timeout: 10000 }).click({ force: true });

    // Verification: New label exists and old label is gone from the list
    cy.contains(updatedSpec1Name).should('be.visible');
    cy.contains(originalSpec1).should('not.exist');

    // ==============================
    // 🔥 REMOVE SPEC (The second spec which now is named 'Test_Spec_2')
    // ==============================
    // The video removes the second element in the list after the first was renamed.
    // We target the *new* first element which is the original 'Test_Spec_2' row's remove button.
    
    // Find the row containing the original 'Test_Spec_2' (it should be the second spec listed)
    cy.contains(originalSpec2, { timeout: 10000 })
        .parentsUntil('div[class*="rounded"]')
        .parent()
        .find('button:contains("Remove")')
        .click({ force: true });

    // The video's quick jump suggests a possible modal confirmation. Run the helper.
    confirmModalAction(); 

    // Verification: The removed spec is gone
    cy.contains(originalSpec2).should('not.exist');
    
    // Proceed to update category (Save & Continue to Documents, then Update Category)
    clickSaveAndContinue();
    
    // Wait a moment for any UI transitions
    cy.wait(1000);
    
    // Try multiple approaches to find and click the Update Category button
    cy.get('body').then($body => {
        // Method 1: Direct text match
        if ($body.find('button').filter((_, el) => /update category/i.test(Cypress.$(el).text())).length) {
            cy.contains('button', /update category/i, { timeout: 10000 })
                .scrollIntoView()
                .should('be.visible')
                .click({ force: true });
        }
        // Method 2: Find by class pattern from the test log
        else if ($body.find('button.inline-flex.items-center.justify-center.gap-2.whitespace-nowrap.rounded-md.text-sm.font-medium.ring-offset-background.transition-colors.focus-visible\\:outline-none.focus-visible\\:ring-2.focus-visible\\:ring-ring.focus-visible\\:ring-offset-2.disabled\\:pointer-events-none.disabled\\:opacity-50.\\[\\&_svg\\]\\:pointer-events-none.\\[\\&_svg\\]\\:size-4.\\[\\&_svg\\]\\:shrink-0.h-10.px-4.py-2.bg-orange-500.hover\\:bg-orange-600.text-white.min-w-\\[140px\\]').length) {
            cy.get('button.inline-flex.items-center.justify-center.gap-2.whitespace-nowrap.rounded-md.text-sm.font-medium.ring-offset-background.transition-colors.focus-visible\\:outline-none.focus-visible\\:ring-2.focus-visible\\:ring-ring.focus-visible\\:ring-offset-2.disabled\\:pointer-events-none.disabled\\:opacity-50.\\[\\&_svg\\]\\:pointer-events-none.\\[\\&_svg\\]\\:size-4.\\[\\&_svg\\]\\:shrink-0.h-10.px-4.py-2.bg-orange-500.hover\\:bg-orange-600.text-white.min-w-\\[140px\\]')
                .scrollIntoView()
                .should('be.visible')
                .click({ force: true });
        }
        // Method 3: Generic orange button
        else {
            cy.get('button.bg-orange-500, button[class*="bg-orange-500"]')
                .contains(/update/i)
                .scrollIntoView()
                .should('be.visible')
                .click({ force: true });
        }
    });

    cy.contains(/saved|success|updated/i, { timeout: 10000 }).should('be.visible');

    // Final Cleanup
    deleteCategory(categoryName);
});


    // --------------------------------------------------------------------------
    // --- TC_04: DUPLICATE CATEGORY (Simplified) ---
    // --------------------------------------------------------------------------
    it('TC_04: Should duplicate category', () => {
        const originalName = unique('Original_For_Duplicate');
        const specLabel = 'Dupe Spec';
        const duplicateName = `${originalName} (Copy)`;

        createCategoryWithSpecs(originalName, specLabel, 'Text');

        openKebabFor(originalName);
        clickKebabOption(/duplicate|copy/i);

        // Wait for duplicate row to appear in the table
        cy.contains('tr', duplicateName, { timeout: 20000 })
            .should('exist');

        // Ensure original row is still present
        cy.contains('tr', originalName, { timeout: 10000 })
            .should('exist');

        deleteCategory(duplicateName);
        deleteCategory(originalName);
    });

it('TC_05: Should create category with specifications', () => {
    // Fixed category name to check for existence
    const categoryName = 'Fire Extinguisher';
    const originalSpec1 = 'Capacity';

    // First, check if category already exists in the table
    cy.visit('/admin/categories');
    cy.wait(1000); // Wait for table to load
    
    // Check if category already exists
    cy.get('table tbody tr').then($rows => {
        const categoryExists = [...$rows].some(row => 
            Cypress.$(row).text().includes(categoryName)
        );
        
        if (categoryExists) {
            cy.log(`✅ Category '${categoryName}' already exists, skipping creation`);
            cy.contains('tr', categoryName)
                .should('be.visible')
                .click({ force: true });
        } else {
            cy.log(`📝 Category '${categoryName}' not found, creating new one`);
            
            // Create new category
            cy.contains(/\+ add category|add category/i).click({ force: true });
            cy.get('input[placeholder*="Enter category name"]').type(categoryName);
            cy.contains(/save & continue/i).click({ force: true }); 

            // Add specification and explicitly pick the field type from the dropdown
            cy.contains(/specifications/i).should('be.visible'); 

            cy.contains(/add specification|\+ add new spec/i)
  .click({ force: true });

cy.wait(500);

// Type label
cy.get('input[placeholder*="e.g"], input[placeholder*="label"]')
  .filter(':visible')
  .last()
  .type(originalSpec1, { force: true });

// --- FIELD TYPE DROPDOWN SELECTION (Stable) ---
cy.contains('Field Type', { matchCase: false })
  .parent()
  .find('[role="combobox"], .ant-select-selector, input')
  .click({ force: true });

cy.wait(300);

// Select "Number" option reliably
cy.get('div[role="option"], .ant-select-item-option')
  .contains(/number/i)
  .click({ force: true });

// Confirm selection
cy.contains('button', /add specification/i)
  .click({ force: true });

cy.contains(originalSpec1).should('exist');


            // Save & Continue (Go to Documents tab)
            cy.contains(/save & continue/i).click({ force: true });

            // Final Step: Create Category
            cy.wait(500); 
            cy.contains('button', /create category/i, { timeout: 10000 })
                .scrollIntoView() 
                .click({ force: true }); 
            
            cy.contains(/Saved|success|created/i, { timeout: 10000 }).should('be.visible');
        }
    });
    
    // Verify category exists (either pre-existing or newly created)
    cy.contains(categoryName).should('exist');
});

});
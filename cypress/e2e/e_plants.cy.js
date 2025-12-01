/// <reference types="cypress" />

describe("Plants Management - Create Plant Flow", () => {

  let uniqueName;
  let newName;
    const typeByPlaceholder = (placeholder, value) => {
        cy.get(`[placeholder="${placeholder}"]`, { timeout: 15000 })
          .should('be.visible')
          .clear({ force: true })
          .type(value, { force: true });
    };

    const loginAndGoToPlants = () => {
        // cy.session("adminLogin", () => {
            cy.visit("/login");
            cy.login("admin@firedesk.com", "Admin@123");
            cy.url().should("not.include", "/login");
        // });

        // ✅ WAIT FOR TABLE API (fix for Add Plant not found)
        cy.intercept("GET", "**/plants**").as("getPlants");
        cy.visit("/admin/plants");

        // Ensure page loaded
        cy.contains("Add Plant", { timeout: 15000 }).should("be.visible");
    };

    beforeEach(() => {
        loginAndGoToPlants();
    });

    it("PLANT_01: Should create a new Plant across all 5 tabs", () => {

         uniqueName = "Auto test";
const s='Select City';
        cy.intercept("POST", "**/plants").as("createPlant");

        // ✅ CLICK ADD PLANT (with retry & stable selectors)
        cy.contains("button", "Add Plant", { timeout: 15000 })
          .scrollIntoView()
          .should("be.enabled")
          .click({ force: true });

        cy.wait(2000); // Add a wait to allow the new page to render

        // Wait for modal to appear
        cy.contains("label", "Plant Name *", { timeout: 15000 })
          .should("be.visible");

        // TAB 1: BASIC INFO
        typeByPlaceholder("e.g., Factory A", uniqueName); // FIX: Updated placeholder
        typeByPlaceholder("e.g., 112 Industrial Road, Near Metro Station", "112 Industrial Layout"); 
        // FIX: Updated placeholder
        cy.contains("Select Managers").click({ force: true });
        cy.get("[role='option']").contains('manager-bhoruka').click({ force: true });

        // STATE
        cy.contains("Select State").click({ force: true });
        cy.contains("Karnataka").click({ force: true });

        // CITY
       // AntD style
       cy.wait(3000);
       cy.contains("Select City").click({ force: true });
       cy.wait(2000);
cy.contains(/^Banga/i)   // partial match
  .click({ force: true });

     



// take a screenshot of the open dropdown to inspect visually
cy.screenshot('dropdown-open-debug', { capture: 'runner' });


/*cy.contains("Select City").click({ force: true });
        cy.get("[role='option']").contains('Kochi').click({ force: true });*/

        // INDUSTRY
        cy.contains("Select Industry").click({ force: true });
        cy.get("[role='option']").contains('BHORUKA').click({ force: true });

        cy.contains("Select Categories").click({ force: true });
        cy.get("[role='option']").contains('Fire Extinguisher').click({ force: true });

        cy.contains("Save & Continue").click({ force: true });
        cy.wait(2000); // Add a wait to allow the next tab to render
        
        // TAB 2: Premises
        cy.window().then((win) => {
          win.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
        // FIX: Using window.scrollTo for top

        //cy.get('Building Count').then($el => $el[0].scrollIntoView({ block: 'start', inline: 'nearest' }));

        //cy.contains("Building Count", { timeout: 10000 }).should("be.visible");
        cy.get('input[placeholder="Enter number"]').eq(0).clear().type("1"); // Main Buildings
        cy.get('input[placeholder="Enter number"]').eq(1).clear().type("0"); // Sub Buildings

        // Click Add Building button (Re-enabled)
        cy.wait(1000); // Adding a small wait for stability before checking enabled state
      //  cy.contains("button", "Add Building", { timeout: 10000 }).should("be.enabled").click({ force: true });

        // Fill Building Details
        typeByPlaceholder("e.g., Block A", "CeNSE");
        typeByPlaceholder("e.g., 5", "2"); // Number of Floors
        typeByPlaceholder("e.g., 20", "250"); // Building Height (Mtrs)

        // Add Floor 1 (Strictly as per your manual changes)
         // User's explicit wait
        typeByPlaceholder("e.g., Ground Floor", "ground"); // Floor Name
        cy.contains("Select usage").click({ force: true });
        cy.get("[role='option']").first().click({ force: true }); // Floor Usage
        typeByPlaceholder("e.g., 1000", "5000"); // Floor Area (Sq.Mtrs)
        cy.contains("Select wing").click({ force: true });
        cy.get("[role='option']").first().click({ force: true }); // Wing

        // Add Floor 2 (Strictly as per your manual changes)
        cy.contains("button", "Add Floor", { timeout: 15000 })
            .should("be.enabled")
            .click({ force: true });
        cy.wait(3000);
        typeByPlaceholder("e.g., Ground Floor", "first"); // Floor Name
        cy.contains("Select usage").click({ force: true });
        cy.get("[role='option']").first().click({ force: true }); // Floor Usage
        typeByPlaceholder("e.g., 1000", "4000"); // Floor Area (Sq.Mtrs)
        cy.contains("Select wing").click({ force: true });
        cy.get("[role='option']").first().click({ force: true }); // Wing
        cy.contains("button", "Add Floor", { timeout: 15000 })
            .should("be.enabled")
            .click({ force: true });
        cy.wait(3000); // User's explicit wait

        // Click "Add Building" after adding floors (This should be the second "Add Building" click for this tab)
        cy.wait(1000); // Adding a small wait for stability before checking enabled state
        cy.contains("button", "Add Building", { timeout: 10000 }).should("be.enabled").click({ force: true });

        // Proceed with Save & Continue clicks
        cy.wait(1000); // Adding a small wait for stability before checking enabled state
        cy.contains("Save & Continue").should("be.enabled").click({ force: true }); // After Tab 2
        cy.wait(2000); // Re-added wait for stability
        
        // TAB 3
        cy.window().then((win) => { win.scrollTo(0, 0); }); // FIX: Using window.scrollTo for top
        //cy.contains("Fire Safety").should("be.visible");
        cy.wait(1000); // Adding a small wait for stability before checking enabled state
        cy.contains("Save & Continue").should("be.enabled").click({ force: true });
        cy.wait(2000); // Re-added wait for stability

        // TAB 4 (Updated assertion)
      //  cy.contains("Fire NOC").should("be.visible"); // Changed from Staircase Details
        cy.wait(1000); // Adding a small wait for stability before checking enabled state
        cy.contains("Save & Continue").should("be.enabled").click({ force: true });
        cy.wait(2000); // Re-added wait for stability
        
        // New step for FireDesk Edge Device
       // cy.contains("FireDesk Edge Device").should("be.visible");
        cy.wait(1000); // Adding a small wait for stability before checking enabled state
        cy.contains("Save & Continue").should("be.enabled").click({ force: true });
        cy.wait(2000); // Re-added wait for stability

        // TAB 5 (Updated assertion)
      //  cy.contains("Floor Layout Files").should("be.visible"); // Changed from Lift Details
        cy.wait(1000); // Adding a small wait for stability before checking enabled state
        cy.contains("Save & Continue").should("be.enabled").click({ force: true });
        cy.wait(2000); // Re-added wait for stability

        // last scheduler step
        cy.contains("Scheduler Setup").should("be.visible");
        cy.wait(1000); // Adding a small wait for stability before checking enabled state
        cy.contains("button", "Add Category", { timeout: 15000 }).should("be.enabled").click({ force: true });
        cy.wait(2000); // Wait for category form to appear

        // Category dropdown
        cy.contains("Select Category").click({ force: true });
        cy.get("[role='option']").contains('Fire Extinguisher').click({ force: true });

        cy.contains("Start Date")
  .parent()
  .find("input[type='date']")
  .clear()
  .type("2025-11-27");
  
cy.contains("End Date")
  .parent()
  .find("input[type='date']")
  .clear()
  .type("2025-12-10");

        // Inspection Frequency - Select Daily checkbox
        cy.contains("Inspection").parent().contains("Daily").click({ force: true });

        // Testing Frequency - Select Daily checkbox
        cy.contains("Testing").parent().contains("Weekly").click({ force: true });

        // Maintenance Frequency - Select Daily checkbox
        cy.contains("Maintenance").parent().contains("Quarterly").click({ force: true });
        // Final Create Plant
        cy.wait(1000); // Adding a small wait for stability before checking enabled state
        cy.contains("Create Plant").should("be.enabled").click({ force: true });

        
        cy.contains(/Success[\s:-]*Plant created successfully/i, { timeout: 15000 })
  .should("be.visible");


        // CHECK TABLE FOR NEW PLANT
        cy.visit("/admin/plants");
        cy.contains(uniqueName, { timeout: 20000 }).should("exist");
    });

    it("PLANT_02: edit the plant", () => {

      newName ="Bhoruka Banglore";

     cy.intercept("POST", "**/plants").as("createPlant");

     // ✅ CLICK ADD PLANT (with retry & stable selectors)
     cy.contains("tr", uniqueName, { timeout: 15000 })
       .click({ force: true });

     cy.wait(2000); // Add a wait to allow the new page to render

     // Wait for modal to appear
    

     // TAB 1: BASIC INFO
     cy.get('input[value="Auto test"]')
  .should('be.visible')
  .clear()
  .type(newName);

     cy.contains("Save & Continue").click({ force: true });
     cy.wait(2000); 

     cy.contains("Save & Continue").should("be.enabled").click({ force: true }); // After Tab 2
     cy.wait(2000);

     
     // Click the upload box
     cy.contains(/Click to upload/i)
     .scrollIntoView()
     .should("be.visible")
     .click({ force: true });
   

// Upload a PDF/PNG/JPG from fixtures
cy.get('input[type="file"]').attachFile("test1.png");
// Adding a small wait for stability before checking enabled state
     cy.contains("Save & Continue").should("be.enabled").click({ force: true });
     cy.wait(2000); // Re-added wait for stability

     // TAB 4 (Updated assertion)
     // Adding a small wait for stability before checking enabled state
     cy.contains("Save & Continue").should("be.enabled").click({ force: true });
     cy.wait(2000); // Re-added wait for stability
     
     // New step for FireDesk Edge Device
     // Adding a small wait for stability before checking enabled state
     cy.contains("Save & Continue").should("be.enabled").click({ force: true });
     cy.wait(2000); // Re-added wait for stability

     // TAB 5 (Updated assertion)
     // Adding a small wait for stability before checking enabled state
     cy.contains("Save & Continue").should("be.enabled").click({ force: true });
     cy.wait(2000); // Re-added wait for stability

     // last scheduler step
     // Adding a small wait for stability before checking enabled state
     
     // Final Create Plant
      // Adding a small wait for stability before checking enabled state
     cy.contains("Update Plant").should("be.enabled").click({ force: true });

     
     cy.contains(/Success[\s:-]*Plant updated successfully/i, { timeout: 15000 })
.should("be.visible");


     // CHECK TABLE FOR NEW PLANT
     cy.visit("/admin/plants");
     cy.contains(newName, { timeout: 20000 }).should("exist");
 });

    it('plant-03 - delete plant (Cleanup)', () => {
          cy.log('✓ Testing final cleanup: Deleting the created product');
    const n='Auto test';
    uniqueName = "Auto test";

        cy.intercept("POST", "**/plants").as("createPlant");

        // ✅ CLICK ADD PLANT (with retry & stable selectors)
        cy.contains("button", "Add Plant", { timeout: 15000 })
          .scrollIntoView()
          .should("be.enabled")
          .click({ force: true });

        cy.wait(2000); // Add a wait to allow the new page to render

        // Wait for modal to appear
        cy.contains("label", "Plant Name *", { timeout: 15000 })
          .should("be.visible");

        // TAB 1: BASIC INFO
        typeByPlaceholder("e.g., Factory A", uniqueName); // FIX: Updated placeholder
        typeByPlaceholder("e.g., 112 Industrial Road, Near Metro Station", "112 Industrial Layout"); 
        // FIX: Updated placeholder
        cy.contains("Select Managers").click({ force: true });
        cy.get("[role='option']").contains('manager-bhoruka').click({ force: true });

        // STATE
        cy.contains("Select State").click({ force: true });
        cy.contains("Kerala").click({ force: true });

        // CITY
       // AntD style
       cy.wait(3000);
       cy.contains("Select City").click({ force: true });
       cy.wait(2000);
cy.contains(/^Kochi/i)   // partial match
  .click({ force: true });
     



// take a screenshot of the open dropdown to inspect visually
cy.screenshot('dropdown-open-debug', { capture: 'runner' });


/*cy.contains("Select City").click({ force: true });
        cy.get("[role='option']").contains('Kochi').click({ force: true });*/

        // INDUSTRY
        cy.contains("Select Industry").click({ force: true });
        cy.get("[role='option']").first().click({ force: true });

        cy.contains("Select Categories").click({ force: true });
        cy.contains("Fire Extinguisher").click({ force: true });

        cy.contains("Save & Continue").click({ force: true });
        cy.wait(2000); // Add a wait to allow the next tab to render
        
        // TAB 2: Premises
        cy.window().then((win) => {
          win.scrollTo({
            top: 0,
            behavior: 'smooth'
          });
        });
        // FIX: Using window.scrollTo for top

        

       
        cy.contains("Save & Continue").should("be.enabled").click({ force: true }); // After Tab 2
        cy.wait(2000); // Re-added wait for stability
        
        // TAB 3
        cy.window().then((win) => { win.scrollTo(0, 0); }); // FIX: Using window.scrollTo for top
        //cy.contains("Fire Safety").should("be.visible");
        cy.wait(1000); // Adding a small wait for stability before checking enabled state
        cy.contains("Save & Continue").should("be.enabled").click({ force: true });
        cy.wait(2000); // Re-added wait for stability

        // TAB 4 (Updated assertion)
      //  cy.contains("Fire NOC").should("be.visible"); // Changed from Staircase Details
        cy.wait(1000); // Adding a small wait for stability before checking enabled state
        cy.contains("Save & Continue").should("be.enabled").click({ force: true });
        cy.wait(2000); // Re-added wait for stability
        
        // New step for FireDesk Edge Device
       // cy.contains("FireDesk Edge Device").should("be.visible");
        cy.wait(1000); // Adding a small wait for stability before checking enabled state
        cy.contains("Save & Continue").should("be.enabled").click({ force: true });
        cy.wait(2000); // Re-added wait for stability

        // TAB 5 (Updated assertion)
      //  cy.contains("Floor Layout Files").should("be.visible"); // Changed from Lift Details
        cy.wait(1000); // Adding a small wait for stability before checking enabled state
        cy.contains("Save & Continue").should("be.enabled").click({ force: true });
        cy.wait(2000); // Re-added wait for stability

        // last scheduler step
        cy.contains("Scheduler Setup").should("be.visible");
        cy.wait(1000); 
        cy.contains("Create Plant").should("be.enabled").click({ force: true });
        
        cy.contains(/Success[\s:-]*Plant created successfully/i, { timeout: 15000 })
  .should("be.visible");


        // CHECK TABLE FOR NEW PLANT
        cy.visit("/admin/plants");
        cy.contains(n, { timeout: 20000 }).should("exist");
// Scroll the real scrollable container
cy.get('div')
  .filter((i, el) => el.scrollWidth > el.clientWidth)
  .first()
  .scrollTo('right', { ensureScrollable: false });

cy.contains('tr',n)
  .find('button:has(svg.lucide-trash2)')
  .scrollIntoView()
  .should('be.visible')
  .click({ force: true });

      // Step 3: Confirm deletion modal (this part is correct and reliable).
      cy.contains('button', /Delete Anyway/i, { timeout: 5000 })
          .click({ force: true });
          cy.wait(5000);
       // Verify success and absence
        cy.contains(/Success|Product deleted sucessfully|deleted/i, { timeout: 10000 }).should('exist');
        cy.wait(5000);
         cy.contains('tr', n).should('not.exist');
        cy.contains('tr', n).should('not.exist');
      });

});

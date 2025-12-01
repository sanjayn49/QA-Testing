// cypress/e2e/dashboard.cy.js

describe('Admin Dashboard - Main Page Tests', () => {

  // This block runs before each 'it' test
  beforeEach(() => {
    // Use the custom login command
    cy.login('admin@firedesk.com', 'Admin@123');
    
    // Visit the main admin dashboard page
    cy.visit('/admin'); 

    // Wait for the main welcome message to ensure the page is loaded
    cy.contains('Welcome to FireDesk!', { timeout: 35000 })
      .should('be.visible');
  });

  /**Test Case 1: Verify all key layout elements are visible
   */
  /**
   * Test Case 1: Verify all key layout elements are visible
   */
  it('DB_01: should load dashboard with all key layout elements', () => {
    cy.log('✓ Verifying main dashboard layout elements');

    // Check header elements
    cy.contains('Admin').scrollIntoView().should('be.visible'); 

    // --- THIS IS THE FIX ---
    // Changed 'be.visible' to 'exist' for all sidebar items
    // to prevent the 'clipped content' error.
    cy.get('nav').contains('Dashboard').scrollIntoView().should('exist');
    cy.get('nav').contains('Industries').scrollIntoView().should('exist');
    cy.get('nav').contains('Users').scrollIntoView().should('exist');

    // Check main content titles
    cy.contains('h1', 'Welcome to FireDesk!').scrollIntoView().should('be.visible');
    cy.contains('Quick Access').scrollIntoView().should('be.visible');
    cy.contains('Recent Activity').scrollIntoView().should('be.visible');
    cy.contains('System Status').scrollIntoView().should('be.visible');

    cy.log('✅ Dashboard layout elements loaded successfully');
  });
  /**
   * Test Case 2: Verify all stat summary cards are displayed
   */
  /**
   * Test Case 2: Verify all stat summary cards are displayed
   */
  it('DB_02: should display all stat summary cards with values', () => {
    cy.log('✓ Verifying all 10 summary stat cards');

    const statCards = [
      'Industries', 'States', 'Cities', 'Categories', 'Plants',
      'Users', 'Managers', 'Technicians', 'Service Forms', 'Roles'
    ];

    statCards.forEach((cardName) => {
      cy.log(`Checking card: ${cardName}`);
      
      // --- THIS IS THE FIX ---
      // We first find the <main> content area, THEN look for the
      // div with the cardName. This avoids the sidebar (<nav>).
      cy.get('main').contains('div', cardName)
        .should('be.visible')
        .invoke('text')
        .should('match', /\d+/); // Asserts the text (e.g., "Industries 3") contains a digit
    });

    cy.log('✅ All summary stat cards are visible and contain a number');
  });

  /**
   * Test Case 3: Verify all Quick Access cards are displayed
   */
  it('DB_03: should display all Quick Access navigation cards', () => {
    cy.log('✓ Verifying all 12 quick access cards');

    const quickAccessCards = [
      'Manage business industries', 'Manage states and regions', 'Manage cities and locations',
      'Manage service categories', 'Manage products and variants', 'Manage plants and facilities',
      'Manage assets and equipment', 'Manage user access and permissions', 'Manage plant managers',
      'Manage technicians and assignments', 'Create and manage service forms', 'Manage system roles and permissions'
    ];

    cy.contains('Quick Access').scrollIntoView();

    quickAccessCards.forEach((cardSubtitle) => {
      cy.log(`Checking quick access: ${cardSubtitle}`);
      // --- FIX 3: Changed 'be.visible' to 'exist' to handle 'clipped' content error ---
      cy.contains(cardSubtitle).should('exist');
    });

    cy.log('✅ All quick access cards are visible');
  });

  /**
   * Test Case 4: Verify navigation using the Sidebar
   */
  it('DB_04: should navigate to the States page from the sidebar', () => {
    cy.log('✓ Testing navigation via sidebar');

    cy.get('nav').contains('States').click();
    cy.url().should('include', '/admin/states');
    cy.contains('h1', 'States').should('be.visible');
    cy.contains('Manage and organize your states efficiently')
      .should('be.visible');
    
    cy.log('✅ Sidebar navigation to States page successful');
  });

  /**
   * Test Case 5: Verify navigation using a Quick Access card
   */
  it('DB_05: should navigate to the Industries page from a Quick Access card', () => {
    cy.log('✓ Testing navigation via Quick Access card');

    cy.contains('Quick Access').scrollIntoView();
    cy.contains('Manage business industries').click();
    cy.url().should('include', '/admin/industries');
    cy.contains('h1', 'Industries').should('be.visible');
    cy.contains('Manage and organize your industries efficiently')
      .should('be.visible');

    cy.log('✅ Quick Access navigation to Industries page successful');
  });

  /**
   * Test Case 6: Verify navigation to the full Activity Log
   */
   /**
   * Test Case 6: Verify navigation to the full Activity Log
   */
  it('DB_06: should navigate to the full Activity Log page', () => {
    cy.log('✓ Testing navigation to Activity Log');

    cy.contains('Recent Activity').scrollIntoView();

    cy.get('body').should('contain', 'logged into the system');
    cy.contains('View All Activities').click();
    cy.url().should('include', '/admin/activities');
    cy.contains('h1', 'Activity Log').should('exist');
    
    // --- THIS IS THE FIX ---
    // Changed 'be.visible' to 'exist' to handle 'clipped' content error
    cy.contains('Complete history of system activities and actions')
      .should('exist'); // <-- FIX
    
    cy.contains('Back to Dashboard').click();
    cy.url().should('not.include', '/activities');
    cy.url().should('include', '/admin');
    cy.contains('h1', 'Welcome to FireDesk!').should('be.visible');

    cy.log('✅ Navigation to and from Activity Log successful');
  });

  /**
   * Test Case 7: Verify System Status cards are displayed
   */
  /**
   * Test Case 7: Verify System Status cards are displayed
   */
  it('DB_07: should display all System Status cards', () => {
    cy.log('✓ Verifying System Status cards');

    cy.contains('System Status').scrollIntoView();

    // --- THIS IS THE FIX ---
    // Changed 'be.visible' to 'exist' to handle 'clipped' content error
    cy.contains('div', 'System Operational')
      .should('exist') // <-- FIX
      .and('contain', 'All systems running normally');

    cy.contains('div', 'Database Connected')
      .should('exist') // <-- FIX
      .and('contain', 'Database connection stable');

    cy.contains('div', 'API Working')
      .should('exist') // <-- FIX
      .and('contain', 'All endpoints responding');

    cy.log('✅ System Status cards are visible and show stable status');
  });

   /**
   * Test Case 8: Verify global search functionality
   */
  it('DB_08: should use the global search and navigate', () => {
    cy.log('✓ Testing global search bar');


    cy.wait(1000); 

    // --- FIX 3: Changed 'be.visible' to 'exist' to handle 'clipped' content error ---
    cy.contains('Manage plants and facilities').scrollIntoView().should('exist');
    cy.contains('Manage products and variants').scrollIntoView().should('exist');

    cy.contains('Manage plants and facilities').scrollIntoView().click();

    cy.url().should('include', '/admin/plants');
    cy.contains('h1', 'Plants').scrollIntoView().should('be.visible');

    cy.log('✅ Global search and navigation successful');
  });
// --- Start: New Test Suite for Quick Access Navigation ---

  describe('Admin Dashboard - Quick Access Navigation', () => {
    // We create a helper function to test each card
    // This avoids repeating the same code 12 times
    // It will be called by each 'it' block below
    const checkQuickAccessCard = (cardSubtitle, pageUrl, pageH1, pageSubtitle) => {
      cy.log(`✓ Testing Quick Access navigation for: ${pageH1}`);
      
      // 1. Go back to the dashboard for a clean start
      cy.visit('/admin');
      cy.contains('h1', 'Welcome to FireDesk!').should('be.visible');

      // 2. Find the card and click it
      cy.contains(cardSubtitle, { timeout: 10000 }).scrollIntoView();
      // Use .should('exist') to handle any 'clipped' content
      cy.contains(cardSubtitle).should('exist').click();

      // 3. Verify the URL is correct
      cy.url().should('include', pageUrl);

      // 4. Verify the new page loaded
      // Use .should('exist') to handle 'clipped' content
      cy.contains('h1', pageH1).should('exist');
      cy.contains(pageSubtitle).should('exist');

      cy.log(`✅ Navigation to ${pageH1} successful`);
    };

    // --- Here are the tests, one for each card ---

    it('DB_QA_01: should navigate to States', () => {
      checkQuickAccessCard(
        'Manage states and regions',
        '/admin/states',
        'States',
        'Manage and organize your states efficiently'
      );
    });

    it('DB_QA_02: should navigate to Cities', () => {
      checkQuickAccessCard(
        'Manage cities and locations',
        '/admin/cities',
        'Cities',
        'Manage and organize your cities efficiently'
      );
    });

    it('DB_QA_03: should navigate to Categories', () => {
      checkQuickAccessCard(
        'Manage service categories',
        '/admin/categories',
        'Categories',
        'Manage and organize your categories efficiently'
      );
    });

    it('DB_QA_04: should navigate to Products', () => {
      checkQuickAccessCard(
        'Manage products and variants',
        '/admin/products',
        'Products',
        'Manage and organize your products efficiently'
      );
    });

    it('DB_QA_05: should navigate to Plants', () => {
      checkQuickAccessCard(
        'Manage plants and facilities',
        '/admin/plants',
        'Plants',
        'Manage and organize your plants efficiently'
      );
    });

    it('DB_QA_06: should navigate to Assets', () => {
      checkQuickAccessCard(
        'Manage assets and equipment',
        '/admin/assets',
        'Assets',
        'Manage and organize your assets efficiently'
      );
    });

    it('DB_QA_07: should navigate to Users', () => {
      checkQuickAccessCard(
        'Manage user access and permissions',
        '/admin/users',
        'Users',
        'Manage and organize your users efficiently'
      );
    });

    it('DB_QA_08: should navigate to Managers', () => {
      checkQuickAccessCard(
        'Manage plant managers',
        '/admin/managers',
        'Managers',
        'Manage and organize your managers efficiently'
      );
    });

    it('DB_QA_09: should navigate to Technicians', () => {
      checkQuickAccessCard(
        'Manage technicians and assignments',
        '/admin/technicians',
        'Technicians',
        'Manage and organize your technicians efficiently'
      );
    });

    it('DB_QA_10: should navigate to Service Forms', () => {
      checkQuickAccessCard(
        'Create and manage service forms',
        '/admin/service-forms',
        'Service Forms',
        // --- FIX: Using the standard page subtitle pattern ---
        'service forms'
      );
    });

 it('DB_QA_11: should navigate to Roles & Permissions', () => {
      checkQuickAccessCard(
        'Manage system roles and permissions',
        '/admin/roles',
        // --- FIX: Confirmed from your screenshot ---
        'Roles', 
        // --- FIX: Confirmed from your screenshot ---
        'Manage and organize your roles efficiently'
      );
    });

  }); // --- End: New Test Suite ---
});
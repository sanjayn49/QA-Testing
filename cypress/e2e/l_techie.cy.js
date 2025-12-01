describe('Technician CRUD - All Operations', () => {
  const BASE = 'https://nextgenfiredeskqa.atvisai.in';

  // Helper function to generate random values with proper names
  const generateRandomData = (type = 'inHouse') => {
    const timestamp = Date.now();
    // Proper person names
    const firstNames = ['John', 'Michael', 'Robert', 'James', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth', 'Kevin'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${firstName} ${lastName}`;
    
    // Generate phone starting with 6, 7, 8, or 9
    const firstDigit = [6, 7, 8, 9][Math.floor(Math.random() * 4)];
    const remainingDigits = String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
    const phone = `${firstDigit}${remainingDigits}`;
    
    return {
      name: fullName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}_${timestamp}@test.com`,
      phone: phone,
      password: 'Test@12345',
      type: type
    };
  };

  it('Complete CRUD: Create In House, Create Third Party, View, Update, Delete', () => {
    // LOGIN
    cy.visit(`${BASE}/admin`);
    cy.get('input[type="email"]').type('admin@firedesk.com');
    cy.get('input[type="password"]').type('Admin@123');
    cy.get('button[type="submit"]').click();
    cy.url({ timeout: 10000 }).should('include', '/admin');
    cy.wait(2000);
    
    // ===== CREATE IN HOUSE TECHNICIAN =====
    cy.log('📝 CREATING IN HOUSE TECHNICIAN');
    cy.visit(`${BASE}/admin/technicians`);
    cy.contains('button', 'Add Technician').click();
    cy.wait(1500);
    
    // Generate random data for In House technician
    let inHouseData = generateRandomData('inHouse');
    
    // Fill Basic Info
    cy.get('#name').type(inHouseData.name, { delay: 30 });
    cy.get('#email').type(inHouseData.email, { delay: 30 });
    cy.get('#phone').type(inHouseData.phone, { delay: 30 });
    cy.get('#password').type(inHouseData.password, { delay: 30 });
    cy.wait(500);
    
    // Save & Continue - First button
    cy.contains('button', 'Save & Continue').scrollIntoView().should('be.enabled').click({ force: true });
    cy.wait(2000);
    
    // Role Selection - Continue - Second button
    cy.contains('button', 'Save & Continue').scrollIntoView().should('be.enabled').click({ force: true });
    cy.wait(1500);
    
    // Role Details - Select In House
    cy.contains('label', 'Technician Type').parent().find('[role="combobox"]').click({ force: true });
    cy.wait(500);
    cy.get('[role="option"]').contains('In House').click({ force: true });
    cy.wait(1000);
    
    // For In House - Select ONE plant from dropdown
    cy.log('Selecting plant for In House technician');
    cy.contains('label', 'Plant').parent().find('[role="combobox"]').click({ force: true });
    cy.wait(1000);
    cy.get('[role="option"]', { timeout: 5000 }).should('have.length.greaterThan', 0);
    cy.get('[role="option"]').first().click({ force: true });
    cy.wait(700);
    
    // Select Categories (optional)
    cy.log('Selecting categories for In House');
    cy.get('input[type="checkbox"]').first().check({ force: true });
    cy.wait(500);
    
    // Fill Experience and Specialization - MUST be done BEFORE Create User click
    cy.log('Filling experience and specialization');
    cy.get('input[placeholder*="e.g"], input[aria-label*="e.g"]').eq(0).scrollIntoView().should('be.visible').clear().type('4', { delay: 30 });
    cy.wait(300);
    cy.get('input[placeholder*="e.g"], input[aria-label*="e.g"]').eq(1).scrollIntoView().should('be.visible').clear().type('Electrical Systems', { delay: 30 });
    cy.wait(1000);
    
    // Create User - Scroll into view and click
    cy.log('Clicking Create User button');
    cy.contains('button', 'Create User').scrollIntoView().should('be.visible').should('be.enabled').click({ force: true });
    cy.wait(3000);
    
    // Verify In House created - Navigate to technicians page to verify
    cy.visit(`${BASE}/admin/technicians`);
    cy.wait(1500);
    cy.get('table tbody').should('contain', inHouseData.name);
    cy.log('✅ IN HOUSE TECHNICIAN CREATED');
    
    // ===== CREATE THIRD PARTY TECHNICIAN =====
    cy.log('📝 CREATING THIRD PARTY TECHNICIAN');
    cy.visit(`${BASE}/admin/technicians`);
    cy.wait(1000);
    cy.contains('button', 'Add Technician').click();
    cy.wait(1500);
    
    // Generate random data for Third Party technician
    let thirdPartyData = generateRandomData('thirdParty');
    
    // Fill Basic Info
    cy.get('#name').type(thirdPartyData.name, { delay: 30 });
    cy.get('#email').type(thirdPartyData.email, { delay: 30 });
    cy.get('#phone').type(thirdPartyData.phone, { delay: 30 });
    cy.get('#password').type(thirdPartyData.password, { delay: 30 });
    cy.wait(500);
    
    // Save & Continue - First button
    cy.contains('button', 'Save & Continue').scrollIntoView().should('be.enabled').click({ force: true });
    cy.wait(2000);
    
    // Role Selection - Continue - Second button
    cy.contains('button', 'Save & Continue').scrollIntoView().should('be.enabled').click({ force: true });
    cy.wait(1500);
    
    // Role Details - Select Third Party
    cy.contains('label', 'Technician Type').parent().find('[role="combobox"]').click({ force: true });
    cy.wait(500);
    cy.get('[role="option"]').contains('Third Party').click({ force: true });
    cy.wait(500);
    
    // For Third Party - Select Vendor
    cy.log('Selecting vendor for Third Party technician');
    cy.contains('label', 'Select Vendor').parent().find('[role="combobox"]').click({ force: true });
    cy.wait(500);
    cy.get('[role="option"]').first().click({ force: true });
    cy.wait(500);
    
    // For Third Party - Select MULTIPLE plants
    cy.log('Selecting multiple plants for Third Party technician');
    cy.contains('label', 'Assign Plants').parent().find('input[type="checkbox"]').eq(0).check({ force: true });
    cy.wait(400);
    cy.contains('label', 'Assign Plants').parent().find('input[type="checkbox"]').eq(1).check({ force: true });
    cy.wait(500);
    
    // Assign Managers to selected plants
    cy.log('Assigning managers to plants');
    cy.contains('label', 'Assign Manager per Plant').parent().find('[role="combobox"]').eq(0).click({ force: true });
    cy.wait(500);
    cy.get('[role="option"]').first().click({ force: true });
    cy.wait(300);
    
    cy.contains('label', 'Assign Manager per Plant').parent().find('[role="combobox"]').eq(1).click({ force: true });
    cy.wait(500);
    cy.get('[role="option"]').first().click({ force: true });
    cy.wait(500);
    
    // Select Categories (optional)
    cy.log('Selecting categories');
    cy.contains('label', 'Assign Categories').parent().find('input[type="checkbox"]').first().check({ force: true });
    cy.wait(500);
    
    // Fill Experience and Specialization - MUST be done BEFORE Create User click
    cy.log('Filling experience and specialization');
    cy.get('input[placeholder*="e.g"], input[aria-label*="e.g"]').eq(0).scrollIntoView().should('be.visible').clear().type('5', { delay: 30 });
    cy.wait(300);
    cy.get('input[placeholder*="e.g"], input[aria-label*="e.g"]').eq(1).scrollIntoView().should('be.visible').clear().type('Electrical Systems', { delay: 30 });
    cy.wait(1000);
    
    // Create User - Scroll into view and click
    cy.log('Clicking Create User button');
    cy.contains('button', 'Create User').scrollIntoView().should('be.visible').should('be.enabled').click({ force: true });
    cy.wait(3000);
    
    // Verify Third Party created - Navigate to technicians page to verify
    cy.visit(`${BASE}/admin/technicians`);
    cy.wait(1500);
    cy.get('table tbody').should('contain', thirdPartyData.name);
    cy.log('✅ THIRD PARTY TECHNICIAN CREATED');
    
    // ===== UPDATE - EDIT TECHNICIAN =====
    cy.log('✏️ UPDATING TECHNICIAN');
    cy.get('table tbody tr').first().click({ force: true });
    cy.wait(1500);
    let updatedData = generateRandomData('update');
    cy.get('#name').clear().type(updatedData.name, { delay: 30 });
    cy.wait(500);
    
    // Click Save & Continue button - may show warning, ignore and click again
    cy.contains('button', 'Save & Continue').scrollIntoView().should('be.visible').click({ force: true });
    cy.wait(1000);
    
    // If warning appears, click Save & Continue again
    cy.get('body').then(($body) => {
      if ($body.text().includes('Warning') || $body.text().includes('warning')) {
        cy.contains('button', 'Save & Continue').click({ force: true });
        cy.wait(1500);
      }
    });
    
    cy.wait(2000);
    cy.log('✅ TECHNICIAN UPDATED');
    
    // ===== DELETE - REMOVE TECHNICIAN =====
    cy.log('🗑️ DELETING TECHNICIAN');
    cy.visit(`${BASE}/admin/technicians`);
    cy.wait(1500);
    // Find the first row and click the red dustbin delete icon
    cy.get('table tbody tr').first().find('button').filter(':has(svg), [class*="red"], [class*="delete"]').first().click({ force: true });
    cy.wait(1500);
    // Click the "Delete Anyway" button in the confirmation dialog
    cy.contains('button', 'Delete Anyway').scrollIntoView().should('be.visible').click({ force: true });
    cy.wait(2000);
    cy.log('✅ TECHNICIAN DELETED');
    
    cy.log('✅✅✅ ALL CRUD OPERATIONS COMPLETED ✅✅✅');
  });
});
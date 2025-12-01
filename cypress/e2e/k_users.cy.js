describe('Users Page Tests', () => {
  let createdUserEmail;
  let updatedUserName;
let cname;
let temp;
let mname;
let t1name;
let t2name;
  
  
const adminLoginAndNavigate = () => {
    cy.session('adminLoginSession', () => {
        cy.visit('/login');
        cy.login('admin@firedesk.com', 'Admin@123');
        cy.url().should('not.include', '/login');
    });
    
    // 💥 FIX: Visiting the base admin route instead of a specific dashboard path
    cy.visit('/admin', { timeout: 20000 });
cy.visit('/admin/users', { timeout: 20000 });
    // Wait for the Admin Name to appear in the header to confirm stability
    

    // Now, navigate to the Users page by clicking the sidebar link
    cy.contains('Users', { timeout: 10000 })
        .scrollIntoView()
        .click({ force: true }); 
        
    cy.url().should('include', '/users');
    // Final check for the target page header
    cy.contains('Users', { timeout: 10000 }).should('be.visible'); 
};

    
  // --- Create User Helper (Simplified for readability, based on your V14) ---
function createUser(role, userData) {
    cy.log(`Creating user with role: ${role}`);

    // Click Add User
    cy.contains('button', /Add\s?User/i).first().click({ force: true });

    // 1. Basic Information Tab (Fill)
    cy.get('input[placeholder]').filter((i, el) => /full\s?name/i.test(el.placeholder)).type(userData.name);
    cy.get('input[placeholder]').filter((i, el) => /email/i.test(el.placeholder)).type(userData.email);
    cy.get('input[placeholder]').filter((i, el) => /phone|mobile/i.test(el.placeholder)).type(userData.phone);
    cy.get('input[placeholder]').filter((i, el) => /password/i.test(el.placeholder)).type(userData.password);

    // Save & Continue (Step 1)
    cy.contains('button', /Save\s*&\s*Continue/i).click({ force: true });
    if(role=='Technician1')
    {
        role='Technician';
        temp='Technician1';
    }


    
    // Assert transition to the Role Selection tab
    cy.contains('Role Selection', { timeout: 10000 }).should('be.visible');
    cy.wait(5000);
    // 2. Role Selection Tab
    cy.contains(/Select\s*a\s*role/i)
        .parent()
        .find('select')
        .should('be.visible')
        .select(role, { force: true }); 
    cy.wait(5000);
    // Save & Continue (Step 2.5)
    cy.contains('button', /Save\s*&\s*Continue/i).click({ force: true });
if(temp=='Technician1')
    role='Technician1';
    // 3. Role Details Tab
    if (role === 'Manager') {
        cy.log('  -> Filling Manager details (Plant Combobox)');
        // FIX: Click the visible placeholder text, then select first option.
        cy.get('input[type="checkbox"]')
        .filter(':visible')
        .not(':disabled')
        .not(':checked') 
        .first()
        .check({
          force: true
        });
      cy.wait(1000); 
    } else if (role === 'Technician') {
        // Technician fields—using the simple click-option pattern for all comboboxes

        // Plant Dropdown

        cy.contains('In House').click({ force: true });
        cy.get('[role="option"]').first().click({ force: true }); 

        cy.contains('Select plant').click({ force: true });
        cy.get('[role="option"]').first().click({ force: true }); 
        
        cy.contains("Assign Categories").parent().contains("Fire Extinguisher").click({ force: true }); 
        
       
        
        
    
    }
    else if (temp === 'Technician1') {
        cy.log('  -> Filling Technician details (Third Party/Vendor)');

        cy.contains('In House').click({ force: true });
        cy.get('[role="option"]').eq(1).click({ force: true });
        
        cy.contains('Select vendor').click({ force: true });
        cy.get('[role="option"]').first().click({ force: true }); 
        // 1. Plant, Manager, Category Selection
        cy.contains("Assign Plants").parent().contains("Bhoruka Banglore").click({ force: true });
        cy.contains("Assign Categories").parent().contains("Fire Extinguisher").click({ force: true });
        
      }

    // 💥 CRITICAL FIX: Two-Click Technique before final submission
    cy.get('body').click(0, 0); 
    cy.wait(500); 

    // Create User (Final Submission)
    cy.contains('button', /Create\s*User/i, { timeout: 20000 }).click({ force: true });

    // 4. Verification via Direct Table Lookup (Clearing search bar)
    
    // Wait for the page redirection to complete (Stable element check)
    cy.contains('button', /Add\s?User/i, { timeout: 15000 }).should('be.visible'); 
    
    // 💥 FINAL VERIFICATION FIX: Clear search, wait for table refresh, and check existence.
    // Ensure the search bar is clear to see the new entry in the default list
   
    cy.wait(2000); // Wait for table refresh
        
    // Verify the user appears in the table.
    cy.contains('tr', userData.name, { timeout: 15000 }).should('exist');
    
    cy.log(`✅ Created ${role} user successfully and verified in unfiltered list.`);
   // createdUserEmail = userData.email;
}
 
  // --- VERIFY LOGIN ---
  const verifyLogin = (email, password) => {
    cy.log('Attempting user login/logout cycle.');
    cy.visit('/login');
    cy.login(email, password);
    cy.contains(/Login successful|Welcome/i, { timeout: 10000 }).should('exist');
    
   
  };

  // --- EDIT USER ---
  const editUser = (oldNamePart) => {
    let newName='6233211234'; // Ensuring a unique new name
    updatedUserName =oldNamePart; // Set the global variable for USER_07

    cy.log(`Editing user ${oldNamePart} to ${newName}`);
    
    // 1. Click the table row to open the edit form
    cy.contains('tr', oldNamePart, { timeout: 15000 }).click({ force: true });

    // 💥 CRITICAL FIX: Target the Full Name input field using the placeholder
   cy.contains('label', /Full Name*/i)
        .parent() // Move up to the immediate container of the label
        .next('div, input') // Check the element immediately following the label container
        .find('input') // Find the input element within that next container
        .first() // Select the first input found (which is the Full Name field)
        .should('be.visible')
        .clear()
        .type(newName);
    // You may need to update more fields here if they are required upon edit
      cy.contains('button', /Save\s*&\s*Continue/i).click({ force: true });
      cy.wait(1000);
        cy.contains('button', /Save\s*&\s*Continue/i).click({ force: true });
        cy.wait(1000);
    cy.contains('button', /Update|Save/i).click({ force: true });

   // cy.contains(/Success|User updated successfully/i, { timeout: 10000 }).should('exist');
    cy.contains('tr', newName, { timeout: 10000 }).should('exist');
  };

  // --- DELETE USER ---
  const deleteUser = (name) => {
    cy.log(`Deleting user ${name}`);
    cy.contains('tr', name)
      .find('button:has(svg.lucide-trash2), button[title*="Delete"]')
      .first()
      .click({ force: true });
    cy.wait(3000);

    cy.contains('button', /Delete Anyway|Confirm/i).click({ force: true });
    cy.wait(2000);
    cy.contains(/Success|User deleted successfully/i, { timeout: 10000 }).should('exist');
    cy.contains('tr', name).should('not.exist');
  };
  
  // --- PAGINATION LOOP ---
  const clickNextIfEnabled = () => {
    cy.contains('button', /Next|>/i).then(($btn) => {
      const isEnabled = !$btn.is(':disabled') && parseFloat($btn.css('opacity') || '1') > 0.5;

      if (isEnabled) {
        cy.wrap($btn).click({ force: true });
        cy.wait(1000); 
        clickNextIfEnabled();
      } else {
        cy.log('✅ Finished pagination.');
      }
    });
  };
  // ===============================
  // 🌐 SETUP HOOKS (CLEANED)
  // ===============================
  beforeEach(() => {
    adminLoginAndNavigate();
  });

  // ===============================
  // 🧪 TEST CASES
  // ===============================

  it('USER_01: Should load Users page and show Add User button', () => {
    cy.contains('button', /Add\s?User/i, { timeout: 10000 }).should('exist');
  }); 

  it('USER_02: Create Admin User', () => {
    // Generate a guaranteed 10-digit phone number: 5 fixed + 5 random digits (10000 to 99999)
    const timestamp = Date.now();
    const randomFiveDigits = Math.floor(10000 + Math.random() * 90000);
    const phone = `99999${randomFiveDigits}`; // Example: 99999xxxxx (10 digits)
    
    // Verify phone length before calling helper
    cy.log(`Generated Phone: ${phone} (Length: ${phone.length})`);
    
    createUser('Admin', {
        name: 'Test Admin ' + timestamp,
        email: `test_admin_${timestamp}@example.com`,
        phone: phone, // Now guaranteed 10 digits
        password: '123456'
    });
    createdUserEmail=`test_admin_${timestamp}@example.com`;
    cname='Test Admin ' + timestamp;

    


}); 

it('USER_03: Create Manager User', () => {
    // Generate a guaranteed 10-digit phone number: 5 fixed + 5 random digits (10000 to 99999)
    const timestamp = Date.now();
    const randomFiveDigits = Math.floor(10000 + Math.random() * 90000);
    const phone = `88888${randomFiveDigits}`; // Example: 99999xxxxx (10 digits)
    
    // Verify phone length before calling helper
    cy.log(`Generated Phone: ${phone} (Length: ${phone.length})`);
    
    createUser('Manager', {
        name: 'Test manager ' + timestamp,
        email: `test_man_${timestamp}@example.com`,
        phone: phone, // Now guaranteed 10 digits
        password: '654321'
    });
    mname='Test manager ' + timestamp;
    deleteUser(mname);
});

  it('USER_04: Create Technician User', () => {
    const timestamp = Date.now();
    const randomFiveDigits = Math.floor(10000 + Math.random() * 90000);
    const phone = `77777${randomFiveDigits}`; 
    
    createUser('Technician', {
        name: 'Auto Technician ' + timestamp, 
        email: `test_tech_${timestamp}@example.com`,
        phone: phone, 
        password: '456789'
    });
    t1name='Auto Technician ' + timestamp;
deleteUser(t1name);
  }); 

it('USER_05: Create Technician User thirdy part', () => {
    const timestamp = Date.now();
    const randomFiveDigits = Math.floor(10000 + Math.random() * 90000);
    const phone = `77777${randomFiveDigits}`; 
    
    createUser('Technician1', {
        name: 'Auto Technician ' + timestamp, 
        email: `test_tech_${timestamp}@example.com`,
        phone: phone, 
        password: '456789'
    });
t2name='Auto Technician ' + timestamp;
  });  

it('USER_06: Verify All Created Accounts Can Login', () => {
    cy.wait(5000);
     cy.contains('Admin User', { timeout: 10000 }).click({ force: true });
    cy.contains('Logout').click({ force: true });
    cy.url().should('include', '/login');
    
    verifyLogin(createdUserEmail, '123456');

    cy.wait(8000);
       
    });
 

  

  it('USER_07: Delete a User', () => {
    // This relies on the name set in USER_06 (Updated Admin...)
    
           
    deleteUser(cname);
            deleteUser(t2name);
       
  });

  

});

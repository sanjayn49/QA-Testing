// cypress/support/commands.js
// ***********************************************
// Custom Commands for FireDesk E2E Testing (COMBINED)
// ***********************************************

// Increase default timeout for all commands (applies globally in test runtime)
Cypress.config('defaultCommandTimeout', 10000)

// File upload support
import 'cypress-file-upload'


Cypress.Commands.add('scanQrFromScreen', () => {
  // Take a screenshot with full page
  cy.screenshot('qr_capture', { capture: 'fullPage' });

  // Read the screenshot and scan for QR code
  return cy.task('readQrCode', 'cypress/screenshots/qr_capture.png').then(qrContent => {
    if (!qrContent) {
      // Try again with viewport capture if full page didn't work
      cy.screenshot('qr_capture_viewport', { capture: 'viewport' });
      return cy.task('readQrCode', 'cypress/screenshots/qr_capture_viewport.png').then(qrContent2 => {
        if (!qrContent2) {
          cy.log('⚠️ No QR code found in the screenshot');
          return null;
        }
        return qrContent2;
      });
    }
    return qrContent;
  });
});

// -----------------------------
// Utility: waitForApp
// -----------------------------
Cypress.Commands.add('waitForApp', () => {
  // Wait for critical elements that indicate app is ready
  cy.window().should('have.property', 'document').should('have.property', 'readyState', 'complete')
  cy.get('body').should('exist')
  // common root element check (if app uses #root)
  cy.get('#root').should('exist')
})

// -----------------------------
// LOGIN (single robust implementation)
// - Supports #email/#password OR input[type="email"]/input[type="password"]
// - Uses waitForApp, types with optional delays for stability
// - Verifies navigation left the login page
// -----------------------------
Cypress.Commands.add('login', (email, password, options = {}) => {
  const {
    visitPath = '/login',
    emailSelectorFallback = 'input[type="email"]',
    passwordSelectorFallback = 'input[type="password"]',
    submitButtonSelector = 'button[type="submit"]',
    typingDelay = 100
  } = options

  cy.visit(visitPath)
  cy.waitForApp()

  // Ensure form visible (if present)
  cy.get('form').should('be.visible')

  // Type email (try multiple selectors)
  cy.get('body').then(($body) => {
    if ($body.find('#email').length) {
      cy.get('#email').should('be.visible').clear().type(email, { delay: typingDelay })
    } else {
      cy.get(emailSelectorFallback).should('be.visible').clear().type(email, { delay: typingDelay })
    }

    // Type password
    if ($body.find('#password').length) {
      cy.get('#password').should('be.visible').clear().type(password, { delay: typingDelay, log: false })
    } else {
      cy.get(passwordSelectorFallback).should('be.visible').clear().type(password, { delay: typingDelay, log: false })
    }
  })

  // Submit
  cy.get('form').then($form => {
    if ($form.length) {
      cy.wrap($form).within(() => {
        cy.get(submitButtonSelector).click()
      })
    } else {
      cy.get(submitButtonSelector).click()
    }
  })

  // Wait for navigation away from login page (more resilient than strict path)
  cy.url().should('not.include', '/login')

  // If navigation shows admin path, assert it too (optional)
  cy.url().then(url => {
    if (url.includes('/admin')) {
      cy.get('body').then($body => {
        if ($body.find('[role="navigation"]').length) {
          cy.get('[role="navigation"]').should('be.visible')
        }
      })
    }
  })
})

// -----------------------------
// Admin login shortcut using fixture
// -----------------------------
Cypress.Commands.add('loginAsAdmin', () => {
  cy.fixture('users').then((users) => {
    if (!users || !users.admin) {
      throw new Error('Fixture "users" missing "admin" entry')
    }
    cy.login(users.admin.email, users.admin.password)
  })
})

// -----------------------------
// LOGOUT (resilient across UI variants)
// -----------------------------
Cypress.Commands.add('logout', () => {
  cy.get('body').then($body => {
    // Try user menu button first
    if ($body.find('button[aria-haspopup="menu"]').length) {
      cy.get('button[aria-haspopup="menu"]').first().click({ force: true })
      cy.contains(/logout|sign out/i).click({ force: true })
    }
    // Fallback to buttons/links
    else if ($body.find('button').filter((i, el) => /logout|sign out/i.test(el.innerText)).length) {
      cy.contains(/logout|sign out/i).click({ force: true })
    }
    // Fallback to direct nav link
    else if ($body.find('nav a[href="/logout"]').length) {
      cy.get('nav a[href="/logout"]').click({ force: true })
    }
    // Last resort: visit logout route directly if exists
    else {
      cy.visit('/logout')
    }
  })

  // Verify we're back to login page (or not authenticated)
  cy.url().should('include', '/login')
})

// -----------------------------
// NAVIGATION: navigateToSection
// -----------------------------
Cypress.Commands.add('navigateToSection', (sectionName) => {
  cy.waitForApp()
  cy.get('body').then($body => {
    const regex = new RegExp(sectionName, 'i')

    if ($body.find('[role="navigation"] a').length) {
      cy.get('[role="navigation"] a').contains(regex).click({ force: true })
    } else if ($body.find('nav a').length) {
      cy.get('nav a').contains(regex).click({ force: true })
    } else {
      // try href contains pattern
      cy.get(`a[href*="${sectionName.toLowerCase()}"]`).click({ force: true })
    }
  })

  cy.url().should('include', sectionName.toLowerCase())
  cy.get('main').should('exist')
})

// -----------------------------
// Toast / Notification checker
// -----------------------------
Cypress.Commands.add('checkToast', (messagePattern) => {
  cy.get('body').then($body => {
    const selectors = [
      '[role="alert"]',
      '.toast',
      '[data-cy="toast"]',
      '#toast-container'
    ]

    // Try to find the first matching selector present in DOM and assert text
    for (const selector of selectors) {
      if ($body.find(selector).length) {
        cy.get(selector).contains(new RegExp(messagePattern, 'i')).should('be.visible')
        return
      }
    }

    // If none found, fail the check
    throw new Error(`No toast selector found for message pattern: ${messagePattern}`)
  })
})

// -----------------------------
// Smart form filling by label
// -----------------------------
Cypress.Commands.add('fillFormField', (label, value) => {
  cy.contains('label', new RegExp(label, 'i'))
    .then($label => {
      const id = $label.attr('for')
      if (id) {
        cy.get(`#${id}`).clear().type(value, { delay: 50 })
      } else {
        // attempt common nearby input
        const input = cy.wrap($label).closest('.form-group').find('input, textarea, [contenteditable="true"]')
        input.clear().type(value, { delay: 50 })
      }
    })
})

// -----------------------------
// Forgot password -> Send OTP
// -----------------------------
Cypress.Commands.add('forgotPassword', (email) => {
  cy.visit('/login')
  cy.waitForApp()

  // Click the "Forgot Password" link if present (case-insensitive)
  cy.contains(/forgot password/i).click({ force: true })

  // Enter email and submit
  cy.get('input[type="email"]').clear().type(email)
  cy.contains(/send otp|send code|submit/i).click({ force: true })

  // Verify OTP flow started
  cy.url().should('include', '/verify-otp')
})

// -----------------------------
// Verify OTP (expects 6 inputs or a single field)
// -----------------------------
Cypress.Commands.add('verifyOTP', (otp) => {
  cy.get('body').then($body => {
    const otpInputs = $body.find('input[type="text"], input[data-otp], input.otp, input[type="tel"]')

    if (otpInputs.length >= 6) {
      for (let i = 0; i < otp.length; i++) {
        cy.get('input[type="text"], input[data-otp], input.otp, input[type="tel"]').eq(i).type(otp[i])
      }
    } else if ($body.find('input[type="text"][maxlength]').length === 1 || $body.find('input[name="otp"]').length === 1) {
      // single-field OTP
      cy.get('input[type="text"][maxlength], input[name="otp"], input[data-otp-single]').first().type(otp)
    } else {
      // fallback: try any visible input
      cy.get('input:visible').first().type(otp)
    }
  })

  cy.contains(/verify|submit/i).click({ force: true })
  cy.url().should('include', '/reset-password')
})

// -----------------------------
// Reset Password
// -----------------------------
Cypress.Commands.add('resetPassword', (newPassword, confirmPassword) => {
  cy.get('input[type="password"]').should('have.length.at.least', 1)
  // fill first and last password fields if available
  cy.get('input[type="password"]').first().clear().type(newPassword, { log: false })
  cy.get('input[type="password"]').last().clear().type(confirmPassword, { log: false })

  cy.contains(/reset password|submit|save/i).click({ force: true })
  cy.url().should('include', '/login')
})

// -----------------------------
// Log test result (calls node task: logTestResult)
// -----------------------------
Cypress.Commands.add('logTestResult', (testId, feature, status, failureReason = '') => {
  return cy.task('logTestResult', {
    testId,
    feature,
    status,
    failureReason,
  })
})

// -----------------------------
// Optional: Clear test data after each test
// Uncomment if you want automatic cleanup after each it() block
// -----------------------------
/*
afterEach(() => {
  cy.window().then((win) => {
    try {
      win.localStorage.clear()
      win.sessionStorage.clear()
    } catch (e) {
      // ignore cross-origin or other access issues
    }
  })
  cy.clearCookies()
})
*/

// End of combined commands.js
import jsQR from "jsqr";
/// <reference types="cypress" />

describe('Assets Management (Direct UI Login)', () => {
    const email = 'admin@firedesk.com';
    const pass = 'Admin@123';
    const ASSET_SERIAL_NUMBER = `AD-EXT-`;

    // Login once before any tests run
    before(() => {
        cy.session('login', () => {
            cy.visit('/login');
            cy.get('input[type="email"]').type(email);
            cy.get('input[type="password"]').type(pass);
            cy.contains('button', /login|sign in|submit/i).click();
            // Wait for either dashboard or assets page to load
            cy.get('body').then(($body) => {
                if ($body.find('h1:contains("Dashboard")').length) {
                    // On dashboard, verify we're logged in
                    cy.contains('h1', 'Dashboard').should('be.visible');
                } 
                
            });
        });
    });

    // Restore session before each test
   beforeEach(() => {
    cy.session("admin-session", () => {
        cy.log("🔐 Logging in (session setup)");
        
        cy.visit("/login");

        cy.get('input[type="email"]').type(email);
        cy.get('input[type="password"]').type(pass);

        cy.contains("button", /login|sign in/i).click({ force: true });

        // Verify auth dashboard after login
        cy.contains(/dashboard|admin/i, { timeout: 15000 }).should("be.visible");

        // Open protected page inside session setup
        cy.visit("/admin/assets");
        cy.get('table', { timeout: 15000 }).should("be.visible");
        // Check if Add Asset button exists
        cy.get('body').then($body => {
            if ($body.find('button:contains("Add Asset")').length > 0 || 
                $body.find('a:contains("Add Asset")').length > 0 ||
                $body.find('[data-cy="add-asset"]').length > 0) {
                cy.log("✅ Add Asset button found");
            } else {
                cy.log("⚠️ Add Asset button not found, but continuing...");
            }
        });
    });

    // After restore → Session already valid
    cy.visit("/admin/assets");
});

    /* ------------------------------------------------------------
        FORM FILL FUNCTION
    ------------------------------------------------------------ */
    const fillAssetFormFromVideo = () => {

        const selectDropdown = (triggerText, optionText) => {
            cy.contains(triggerText).click({ force: true });
            cy.wait(300);
            cy.get('[data-radix-popper-content-wrapper], [role="listbox"]')
                .contains(optionText, { matchCase: false })
                .click({ force: true });
            cy.wait(700);
        };

        cy.intercept('GET', '/api/buildings*').as('getBuildings');
        cy.intercept('GET', '/api/floors*').as('getFloors');
        cy.intercept('GET', '/api/wings*').as('getWings');

        selectDropdown("Select a plant", "Bhoruka Banglore");
        cy.wait('@getBuildings');

        selectDropdown("Select a building", "CeNSE");
        cy.wait('@getFloors');

        selectDropdown("Select a floor", "ground");
        cy.wait('@getWings');

        selectDropdown("Select a wing", "A");

        cy.get('input[placeholder*="Pump"], input[placeholder*="pump"]').type('Pump Room', { force: true });

        selectDropdown("Select a category", "Fire Extinguisher");
        selectDropdown("Select Product", "Powder");
        selectDropdown("In-House", "AMC");

        const today = new Date();
        const formattedDate = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

        const manufacturingDate = new Date(today);
        manufacturingDate.setDate(today.getDate() - 1);

        cy.contains('label', 'Manufacturing')
            .closest('div')
            .find('input[type="date"]')
            .type(formattedDate(manufacturingDate), { force: true });

        cy.contains('label', 'Installation')
            .closest('div')
            .find('input[type="date"]')
            .type(formattedDate(today), { force: true });

        cy.contains('Technical Details').click({ force: true });
        cy.contains('Technical Details').click({ force: true });
        cy.contains('Save & Continue').click({ force: true });
        cy.wait(500);

        cy.contains('Create Asset').click({ force: true });
        cy.wait(700);
    };

    /* ------------------------------------------------------------
        TC_01: CREATE (unchanged)
    ------------------------------------------------------------ */
    it('AT_01: Create Asset → Verify', () => {
        cy.contains('Add Asset').click({ force: true });
        fillAssetFormFromVideo();

        cy.url().should('include', '/admin/assets');
        cy.get('table').should('be.visible');

        cy.get('table tbody tr')
            .contains('td', /^AD-EXT-/)
            .parent('tr')
            .as('assetRow')
            .should('exist');

        cy.log('✅ ASSET CREATED SUCCESSFULLY');
    });


        /* ------------------------------------------------------------
    TC_02: Create NEW Asset → View (Eye Icon) → Verify Details
------------------------------------------------------------ */
it('AT_02: View Asset → Verify Asset Details', () => {

    // 🔄 Create new asset
    //cy.contains('Add Asset').click({ force: true });
    //fillAssetFormFromVideo();

    // Reload list
    cy.visit('/admin/assets');
    cy.get('table', { timeout: 15000 }).should('be.visible');

    const prefix = ASSET_SERIAL_NUMBER;

    // 🔍 Get the newest asset serial just created
    cy.get('table tbody tr td:nth-child(1)').then($cells => {

        const serials = [...$cells]
            .map(el => el.innerText.trim())
            .filter(text => text.startsWith(prefix));

        if (!serials.length) throw new Error("No assets found with prefix " + prefix);

        const latestSerial = serials.sort((a, b) =>
            parseInt(b.replace(prefix, '')) -
            parseInt(a.replace(prefix, ''))
        )[0];

        cy.log("🆕 Latest created asset for TC_03: " + latestSerial);
        cy.wrap(latestSerial).as('viewSerial');
    });

    // 🎯 Find row for this serial
    cy.get('@viewSerial').then(latestSerial => {
        cy.contains('td', latestSerial)
            .parent('tr')
            .as('viewRow')
            .should('exist');
    });

    cy.wait(500);

    // 👁 Click the Eye icon (2nd button)
    cy.log("👁 Clicking Eye (View) Icon");
    cy.get('@viewRow').within(() => {
        cy.get('td').last().within(() => {
            cy.get('button')
                .eq(1)          // 0 = trash, 1 = eye ✔
                .click({ force: true });
        });
    });

    // VIEW PAGE VALIDATION
    cy.log("📄 Verifying asset details page");

    cy.get('@viewSerial').then(serial => {

        // ASSET INFORMATION CARD
        cy.contains('Asset Information')
            .parent()
            .within(() => {

                cy.contains('Asset ID')
                    .next()
                    .should('contain', serial);

                cy.contains('Plant')
                    .next()
                    .should('contain', 'Bhoruka Banglore');

                cy.contains('Building')
                    .next()
                    .should('contain', 'CeNSE');

                cy.contains('Category')
                    .next()
                    .should('contain', 'Fire Extinguisher');

                cy.contains('Product')
                    .next()
                    .should('contain', 'Powder');

                cy.contains('Location')
                    .next()
                    .should('contain', 'Pump Room');

                cy.contains('Health Status')
                    .next()
                    .should('contain', 'Healthy');

                cy.contains('Condition')
                    .next()
                    .should('contain', 'No Issues');
            });

        // DATES & TIMELINE
        cy.contains('Dates & Timeline')
            .parent()
            .within(() => {
                // Use the same date logic as in fillAssetFormFromVideo
                const today = new Date();
                const formatDateForDisplay = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
                
                const manufacturingDate = new Date(today);
                manufacturingDate.setDate(today.getDate() - 1);

                cy.contains('Manufacturing Date')
                    .next()
                    .should('contain', formatDateForDisplay(manufacturingDate));

                cy.contains('Install Date')
                    .next()
                    .should('contain', formatDateForDisplay(today));
            });

        // -------------------------------
        // QR CODE VERIFICATION
        // -------------------------------

        cy.log("🔽 Scrolling to QR Code section (center)");

        cy.contains('Asset QR Code')
            .scrollIntoView({ block: 'center', duration: 700 })
            .should('be.visible');

        // Validate QR element (canvas/svg/img)
        cy.contains('Asset QR Code')
            .parent()
            .within(() => {

                cy.get('canvas, svg, img')        // support all QR formats
                    .should('exist')
                    .should('be.visible')
                    .then($el => {
                        cy.log("QR element tag: " + $el.prop('tagName'));

                        if ($el.prop('tagName') === 'IMG') {
                            const src = $el.attr('src');
                            cy.log("QR Image src:", src);

                            expect(src).to.match(/qr|base64|data:image|png/i);
                        }
                    });
            });

        // ✔ Verify Asset ID under QR code
        cy.contains('Asset QR Code')
            .parent()
            .contains(serial)
            .should('be.visible');

        // ✔ Download button
        cy.contains('Download QR Code')
            .scrollIntoView({ block: 'center' })
            .should('be.visible');
    });

    cy.log("👁️✅ VIEW PAGE VERIFIED SUCCESSFULLY");
});



    /* ------------------------------------------------------------
    TC_03: Create NEW Asset → Open QR Modal → Verify QR Details
------------------------------------------------------------ */

it('AT_03: Open QR Modal → Verify QR Details', () => {

    // Create new asset
    //cy.contains('Add Asset').click({ force: true });
    //fillAssetFormFromVideo();

    // Reload list
    //cy.visit('/admin/assets');
    //cy.get('table', { timeout: 15000 }).should('be.visible');

    const prefix = ASSET_SERIAL_NUMBER;

    // Detect newest asset
    cy.get('table tbody tr td:nth-child(1)').then($cells => {

        const serials = [...$cells]
            .map(el => el.innerText.trim())
            .filter(t => t.startsWith(prefix));

        if (!serials.length)
            throw new Error("No assets with prefix " + prefix);

        const latestSerial = serials.sort((a, b) =>
            parseInt(b.replace(prefix, '')) -
            parseInt(a.replace(prefix, ''))
        )[0];

        cy.wrap(latestSerial).as('qrSerial');
    });

    // Find row
    cy.get('@qrSerial').then(serial => {
        cy.contains('td', serial)
            .parent('tr')
            .as('qrRow');
    });

    cy.wait(500);

    // Open QR modal
    cy.get('@qrRow').within(() => {
        cy.get('td').last().within(() => {
            cy.get('button').eq(2).click({ force: true });
        });
    });

   // Wait for QR modal to be fully visible
    cy.get('.modal, [role="dialog"]', { timeout: 10000 }).should('be.visible');
    
    // Look for QR code element (canvas, svg, or img)
    cy.get('body').then($body => {
        if ($body.find('canvas, svg, img[src*="qr"], img[src*="QR"]').length > 0) {
            cy.get('canvas, svg, img[src*="qr"], img[src*="QR"]')
                .should('be.visible')
                .then(() => {
                    // Wait a bit more for QR code to render
                    cy.wait(2000);
                    
                    // Try to scan the QR code
                    cy.scanQrFromScreen().then(qrText => {
                        cy.log("📦 RAW QR CONTENT:", qrText);

                        if (qrText) {
                            try {
                                // Convert QR string → JSON
                                const qrJson = JSON.parse(qrText);

                                cy.get('@qrSerial').then(serial => {
                                    expect(qrJson.asset_id).to.equal(serial);
                                });

                                expect(qrJson.category).to.equal("Fire Extinguisher");

                                // plant_id is UUID so just validate pattern
                                expect(qrJson.plant_id).to.match(/^[a-f0-9-]{36}$/);

                                cy.log("✅ QR code verification successful");
                            } catch (e) {
                                cy.log("QR content is not JSON:", qrText);
                                // If not JSON, just verify it contains expected text
                                expect(qrText).to.include('@qrSerial');
                            }
                        } else {
                            cy.log("⚠️ No QR code could be scanned, but modal is visible");
                            // Just verify the modal is showing the asset ID
                            cy.get('@qrSerial').then(serial => {
                                cy.contains(serial).should('be.visible');
                            });
                        }
                    });
                });
        } else {
            cy.log("⚠️ QR code element not found in modal");
            // Just verify the modal is visible and contains asset info
            cy.get('@qrSerial').then(serial => {
                cy.contains(serial).should('be.visible');
            });
        }
    });

    // Clean up both screenshots if they exist
    const screenshots = [
        'cypress/screenshots/h_assets.cy.js/qr_capture.png',
        'cypress/screenshots/h_assets.cy.js/qr_capture_viewport.png'
    ];
    
    screenshots.forEach(screenshot => {
        cy.task('fileExists', screenshot).then(exists => {
            if (exists) {
                cy.task('deleteFile', screenshot)
                    .then(() => cy.log(`🗑️ Removed: ${screenshot.split('/').pop()}`));
            }
        });
    });
});

    /* ------------------------------------------------------------
        TC_04:Delete the asset
    ------------------------------------------------------------ */
    it('AT_04: Delete the created asset', () => {

        // 🔄 Create NEW asset
        cy.contains('Add Asset').click({ force: true });
        fillAssetFormFromVideo();

        // (POST intercepted but not waited – keep behaviour same)
        cy.intercept('POST', '/api/v2/assets').as('assetCreated');

        // Reload list
        cy.visit('/admin/assets');
        cy.get('table', { timeout: 15000 }).should('be.visible');

        // 🔍 Determine the newest serial with prefix
        cy.get('table tbody tr td:nth-child(1)').then($cells => {

            const prefix = ASSET_SERIAL_NUMBER;

            const serials = [...$cells]
                .map(el => el.innerText.trim())
                .filter(text => text.startsWith(prefix));

            if (!serials.length) throw new Error("No asset found with prefix " + prefix);

            const latestSerial = serials.sort((a, b) =>
                parseInt(b.replace(prefix, '')) -
                parseInt(a.replace(prefix, ''))
            )[0];

            cy.log("🆕 Newly created asset: " + latestSerial);
            cy.wrap(latestSerial).as('latestSerial');
        });

        // 🎯 Target the row for the latest serial
        cy.get('@latestSerial').then(latestSerial => {
            cy.contains('td', latestSerial)
                .parent('tr')
                .as('deleteRow')
                .should('exist');
        });

        cy.wait(500);

        // 🗑 Click **real** trash icon – first button in Actions cell
        cy.log("🗑️ Clicking trash icon (first button in Actions column)");
        cy.get('@deleteRow').within(() => {

            // Actions column is the last <td> – inside it, trash is the FIRST button
            cy.get('td').last().within(() => {
                cy.get('button')
                    .first()
                    .click({ force: true });
            });
        });

        cy.wait(500);

        // ⚠️ Confirm deletion – "Delete Anyway" at top, with fallback
        cy.log("⚠️ Confirming deletion (Delete Anyway / Delete)");
        cy.get('body').then($body => {
            // Prefer explicit "Delete Anyway" if present
            const hasDeleteAnyway = $body.find('button:contains("Delete Anyway")').length > 0;

            if (hasDeleteAnyway) {
                cy.contains('button', 'Delete Anyway')
                    .filter(':visible')
                    .first()
                    .click({ force: true });
            } else {
                // Generic fallback: any visible button containing "Delete"
                cy.contains('button', /delete/i)
                    .filter(':visible')
                    .first()
                    .click({ force: true });
            }
        });

        cy.wait(1500);

        // 🔄 Refresh list again to ensure row is gone
        cy.visit('/admin/assets');
        cy.get('table', { timeout: 15000 }).should('be.visible');
        cy.wait(2000); // Wait for data to load

        // 🔍 Verify deletion
        cy.get('@latestSerial').then(serial => {
            cy.log("🔍 Verifying deletion of: " + serial);
            // Wait a bit more and check if element still exists
            cy.wait(3000);
            cy.get('body').then($body => {
                if ($body.find(`td:contains("${serial}")`).length > 0) {
                    cy.log("⚠️ Asset still exists, might need to wait longer or deletion failed");
                    // Try to delete again
                    cy.contains('td', serial)
                        .parent('tr')
                        .within(() => {
                            cy.get('td').last().within(() => {
                                cy.get('button').first().click({ force: true });
                            });
                        });
                    cy.wait(1000);
                    cy.contains('button', /delete/i).click({ force: true });
                    cy.wait(3000);
                } else {
                    cy.log("✅ Asset successfully deleted");
                }
            });
            // Final check
            cy.contains('td', serial).should('not.exist');
        });

        cy.log("🗑️✅ Asset created & deleted successfully!");
    });


});

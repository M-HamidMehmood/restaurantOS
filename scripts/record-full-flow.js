const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function recordFullFlow() {
  const outputDir = path.join(__dirname, '..', 'recordings');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Clear previous recordings
  const existingFiles = fs.readdirSync(outputDir);
  for (const f of existingFiles) {
    if (f.endsWith('.webm') || f.endsWith('.mp4')) {
      try {
        fs.unlinkSync(path.join(outputDir, f));
      } catch (e) {}
    }
  }

  console.log('🚀 Launching Google Chrome for RestaurantOS End-to-End Simulation...');
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
  });

  const context = await browser.newContext({
    recordVideo: {
      dir: outputDir,
      size: { width: 1440, height: 900 },
    },
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // Inject sleek animated pointer for user-visible clicks
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const cursor = document.createElement('div');
      cursor.id = 'demo-cursor';
      cursor.style.position = 'fixed';
      cursor.style.top = '0';
      cursor.style.left = '0';
      cursor.style.width = '24px';
      cursor.style.height = '24px';
      cursor.style.backgroundColor = 'rgba(234, 88, 12, 0.75)';
      cursor.style.border = '2px solid #ffffff';
      cursor.style.borderRadius = '50%';
      cursor.style.pointerEvents = 'none';
      cursor.style.zIndex = '999999';
      cursor.style.transform = 'translate(-50%, -50%)';
      cursor.style.transition = 'transform 0.06s ease, background-color 0.12s ease';
      cursor.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';
      document.body.appendChild(cursor);

      window.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
      });

      window.addEventListener('mousedown', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(0.65)';
        cursor.style.backgroundColor = 'rgba(220, 38, 38, 0.9)';
      });

      window.addEventListener('mouseup', () => {
        cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        cursor.style.backgroundColor = 'rgba(234, 88, 12, 0.75)';
      });
    });
  });

  const smoothClick = async (selector, options = {}) => {
    try {
      const el = await page.waitForSelector(selector, { timeout: 7000, state: 'visible' });
      if (el) {
        const box = await el.boundingBox();
        if (box) {
          const targetX = box.x + box.width / 2;
          const targetY = box.y + box.height / 2;
          await page.mouse.move(targetX, targetY, { steps: 10 });
          await sleep(200);
          await page.mouse.down();
          await sleep(150);
          await page.mouse.up();
          await sleep(300);
          return true;
        }
      }
    } catch (e) {
      console.warn(`Click failed for "${selector}":`, e.message);
    }
    return false;
  };

  // -------------------------------------------------------------
  // SCENE 1: CUSTOMER QR MENU & CUSTOMIZATION (Table T-05)
  // -------------------------------------------------------------
  console.log('📱 SCENE 1: Customer Digital QR Menu (Table T-05)...');
  await page.goto('http://localhost:3000/table/T-05', { waitUntil: 'networkidle' });
  await page.mouse.move(720, 450, { steps: 5 });
  await sleep(1800);

  // Smooth scroll down to browse menu items
  console.log('   Browsing categories and dishes...');
  await page.mouse.wheel(0, 300);
  await sleep(900);
  await page.mouse.wheel(0, -300);
  await sleep(800);

  // Click Customize button on first customizable dish
  console.log('   Opening dish customization modal...');
  const customizeButtons = await page.$$('button:has-text("Customize")');
  if (customizeButtons.length > 0) {
    const box = await customizeButtons[0].boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
      await sleep(250);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await sleep(1200);
    }
  }

  // Select a modifier option in the modal
  console.log('   Selecting modifier add-on...');
  const modifierButtons = await page.$$('div[role="dialog"] button:has-text("Rs.")');
  if (modifierButtons.length > 0) {
    const modBox = await modifierButtons[0].boundingBox();
    if (modBox) {
      await page.mouse.move(modBox.x + modBox.width / 2, modBox.y + modBox.height / 2, { steps: 8 });
      await sleep(200);
      await page.mouse.click(modBox.x + modBox.width / 2, modBox.y + modBox.height / 2);
      await sleep(600);
    }
  }

  // Type Kitchen Note in textarea if available
  try {
    const noteInput = await page.$('div[role="dialog"] textarea');
    if (noteInput) {
      const nBox = await noteInput.boundingBox();
      if (nBox) {
        await page.mouse.click(nBox.x + 20, nBox.y + 10);
        await noteInput.fill('Extra crispy patty, serve piping hot!');
        await sleep(600);
      }
    }
  } catch (e) {}

  // Click "Add to Cart" button in modal
  console.log('   Adding customized dish to cart...');
  const addToCartBtn = await page.$('div[role="dialog"] button:has-text("Add to Cart")');
  if (addToCartBtn) {
    const box = await addToCartBtn.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 8 });
      await sleep(250);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await sleep(1200);
    }
  }

  // Add a beverage directly (e.g. Karak Everyday Chai or Add button)
  console.log('   Adding Karak Everyday Chai to order...');
  const addButtons = await page.$$('button:has-text("Add")');
  if (addButtons.length > 0) {
    const aBox = await addButtons[0].boundingBox();
    if (aBox) {
      await page.mouse.move(aBox.x + aBox.width / 2, aBox.y + aBox.height / 2, { steps: 8 });
      await sleep(200);
      await page.mouse.click(aBox.x + aBox.width / 2, aBox.y + aBox.height / 2);
      await sleep(1000);
    }
  }

  // Open Floating Cart Sheet
  console.log('   Opening slide-out Cart Sheet...');
  const cartBar = await page.$('text=in order');
  if (cartBar) {
    const bBox = await cartBar.boundingBox();
    if (bBox) {
      await page.mouse.move(bBox.x + 50, bBox.y + 10, { steps: 10 });
      await sleep(300);
      await page.mouse.click(bBox.x + 50, bBox.y + 10);
      await sleep(1500);
    }
  }

  // Review Order Breakdown and Click "Place Order"
  console.log('   Reviewing order breakdown & dispatching...');
  const placeOrderBtn = await page.$('button:has-text("Place Order")');
  if (placeOrderBtn) {
    const pBox = await placeOrderBtn.boundingBox();
    if (pBox) {
      await page.mouse.move(pBox.x + pBox.width / 2, pBox.y + pBox.height / 2, { steps: 10 });
      await sleep(400);
      await page.mouse.click(pBox.x + pBox.width / 2, pBox.y + pBox.height / 2);
      await sleep(3000);
    }
  }

  // -------------------------------------------------------------
  // SCENE 2: LIVE KITCHEN STREAM & KANBAN (Operations Console)
  // -------------------------------------------------------------
  console.log('🍳 SCENE 2: Kitchen Live Operations & KDS (/admin/live)...');
  await page.goto('http://localhost:3000/admin/live', { waitUntil: 'networkidle' });
  await page.mouse.move(720, 450, { steps: 5 });
  await sleep(2000);

  // Accept pending order: click "Accept Order"
  console.log('   Kitchen accepting ticket into In Kitchen...');
  const acceptButtons = await page.$$('button:has-text("Accept Order")');
  if (acceptButtons.length > 0) {
    const btnBox = await acceptButtons[0].boundingBox();
    if (btnBox) {
      await page.mouse.move(btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2, { steps: 10 });
      await sleep(350);
      await page.mouse.click(btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2);
      await sleep(2000);
    }
  }

  // Advance cooking ticket: Click "Ready to Serve"
  console.log('   Marking dish ready at pass counter...');
  const readyButtons = await page.$$('button:has-text("Ready to Serve")');
  if (readyButtons.length > 0) {
    const rBox = await readyButtons[0].boundingBox();
    if (rBox) {
      await page.mouse.move(rBox.x + rBox.width / 2, rBox.y + rBox.height / 2, { steps: 10 });
      await sleep(350);
      await page.mouse.click(rBox.x + rBox.width / 2, rBox.y + rBox.height / 2);
      await sleep(2000);
    }
  }

  // Toggle view mode to Compact List and back to Kanban
  console.log('   Demonstrating Operations List View...');
  await smoothClick('button:has-text("Compact List")');
  await sleep(1800);

  console.log('   Switching back to Kitchen Kanban Board...');
  await smoothClick('button:has-text("Kanban")');
  await sleep(1500);

  // Demonstrate Simulate Order test button
  console.log('   Demonstrating staff 1-click test simulation order...');
  await smoothClick('button:has-text("Simulate Order")');
  await sleep(2500);

  // -------------------------------------------------------------
  // SCENE 3: FLOOR MANAGEMENT & BILL SETTLEMENT (/admin/floor)
  // -------------------------------------------------------------
  console.log('🏛️ SCENE 3: Table Floor Grid & Settlement (/admin/floor)...');
  await page.goto('http://localhost:3000/admin/floor', { waitUntil: 'networkidle' });
  await sleep(2000);

  // Smooth scroll floor grid
  await page.mouse.wheel(0, 200);
  await sleep(600);
  await page.mouse.wheel(0, -200);
  await sleep(600);

  // Click on Table 05 card to open billing drawer
  console.log('   Opening Table 05 Billing Drawer...');
  const table05 = await page.$('text=Table 05');
  if (table05) {
    const tBox = await table05.boundingBox();
    if (tBox) {
      await page.mouse.move(tBox.x + 30, tBox.y + 10, { steps: 10 });
      await sleep(300);
      await page.mouse.click(tBox.x + 30, tBox.y + 10);
      await sleep(2000);
    }
  }

  // Inside Billing Drawer: Apply 10% discount
  console.log('   Applying 10% promotional discount...');
  const discount10 = await page.$('button:has-text("10%")');
  if (discount10) {
    const dBox = await discount10.boundingBox();
    if (dBox) {
      await page.mouse.move(dBox.x + dBox.width / 2, dBox.y + dBox.height / 2, { steps: 8 });
      await sleep(200);
      await page.mouse.click(dBox.x + dBox.width / 2, dBox.y + dBox.height / 2);
      await sleep(1200);
    }
  }

  // Type cash tender amount
  console.log('   Calculating cash change: received Rs. 1000...');
  const tenderInput = await page.$('input[placeholder*="0"]');
  if (tenderInput) {
    const inBox = await tenderInput.boundingBox();
    if (inBox) {
      await page.mouse.click(inBox.x + 30, inBox.y + 10);
      await tenderInput.fill('1000');
      await sleep(1200);
    }
  }

  // Settle & Clear Table
  console.log('   Settling table bill and resetting table to available...');
  const settleBtn = await page.$('button:has-text("Settle & Clear Table")');
  if (settleBtn) {
    const sBox = await settleBtn.boundingBox();
    if (sBox) {
      await page.mouse.move(sBox.x + sBox.width / 2, sBox.y + sBox.height / 2, { steps: 8 });
      await sleep(300);
      await page.mouse.click(sBox.x + sBox.width / 2, sBox.y + sBox.height / 2);
      await sleep(2500);
    }
  }

  // Simulate customer Waiter Call alert
  console.log('   Simulating customer Waiter Call assistance...');
  await smoothClick('button:has-text("Simulate Waiter Call")');
  await sleep(2500);

  // Resolve the active waiter alert
  console.log('   Staff resolving waiter assistance alert...');
  const resolveBtn = await page.$('button:has-text("Resolve")');
  if (resolveBtn) {
    const resBox = await resolveBtn.boundingBox();
    if (resBox) {
      await page.mouse.move(resBox.x + resBox.width / 2, resBox.y + resBox.height / 2, { steps: 8 });
      await sleep(200);
      await page.mouse.click(resBox.x + resBox.width / 2, resBox.y + resBox.height / 2);
      await sleep(1800);
    }
  }

  // -------------------------------------------------------------
  // SCENE 4: MENU MANAGER & 86 SWITCHES (/admin/menu)
  // -------------------------------------------------------------
  console.log('📋 SCENE 4: Menu Manager & 86 Switches (/admin/menu)...');
  await page.goto('http://localhost:3000/admin/menu', { waitUntil: 'networkidle' });
  await sleep(2000);

  // Toggle availability of an item on the Quick 86 switchboard
  console.log('   Demonstrating 1-click 86 stock toggle...');
  const toggleButtons = await page.$$('button:has-text("In Stock")');
  if (toggleButtons.length > 0) {
    const togBox = await toggleButtons[0].boundingBox();
    if (togBox) {
      await page.mouse.move(togBox.x + togBox.width / 2, togBox.y + togBox.height / 2, { steps: 10 });
      await sleep(300);
      await page.mouse.click(togBox.x + togBox.width / 2, togBox.y + togBox.height / 2);
      await sleep(1800);

      // Toggle it back to in stock
      const outOfStockBtn = await page.$('button:has-text("86\'d (Out)")');
      if (outOfStockBtn) {
        const outBox = await outOfStockBtn.boundingBox();
        if (outBox) {
          await page.mouse.click(outBox.x + outBox.width / 2, outBox.y + outBox.height / 2);
          await sleep(1400);
        }
      }
    }
  }

  // Switch to Catalog Table Tab
  console.log('   Switching to Catalog Table & Modifiers view...');
  await smoothClick('button:has-text("Catalog Table & Modifiers")');
  await sleep(2000);

  // Switch back to 86 Switchboard
  await smoothClick('button:has-text("Daily Quick-Toggle")');
  await sleep(1200);

  // Return to Live Feed for final frame
  console.log('🏁 Returning to Live Operations Console...');
  await page.goto('http://localhost:3000/admin/live', { waitUntil: 'networkidle' });
  await sleep(2200);

  // Close browser to finalize video
  console.log('🎬 Finalizing and saving video recording...');
  await page.close();
  await context.close();
  await browser.close();

  // Find generated .webm file
  const files = fs.readdirSync(outputDir).filter((f) => f.endsWith('.webm'));
  if (files.length === 0) {
    throw new Error('No .webm file generated!');
  }

  const rawVideoPath = path.join(outputDir, files[0]);
  const finalWebmPath = path.join(outputDir, 'restaurantos-full-dashboard-flow.webm');

  if (rawVideoPath !== finalWebmPath) {
    fs.renameSync(rawVideoPath, finalWebmPath);
  }
  console.log(`✅ Saved High-Resolution WebM Video: ${finalWebmPath}`);

  const videoStats = fs.statSync(finalWebmPath);
  console.log(`🎉 Demo Video successfully recorded! Size: ${(videoStats.size / 1024 / 1024).toFixed(2)} MB`);
}

recordFullFlow().catch((err) => {
  console.error('❌ Recording failed:', err);
  process.exit(1);
});

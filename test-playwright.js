const { chromium } = require('playwright');

(async () => {
  console.log('Testing Playwright installation...');

  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log('✓ Browser launched successfully');

    await page.goto('https://example.com');
    console.log('✓ Navigated to example.com');

    const title = await page.title();
    console.log(`✓ Page title: ${title}`);

    await browser.close();
    console.log('✓ Browser closed successfully');
    console.log('\n✅ Playwright is working correctly!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
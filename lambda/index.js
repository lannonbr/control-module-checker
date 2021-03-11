const { chromium } = require("playwright");

exports.handler = async function () {
  let url =
    "https://www.ctrl-mod.com/products/mutable-instruments-blades-dual-multimode-filter";

  const browser = await chromium.launch();

  const page = await browser.newPage();
  await page.goto(url);

  const product = await page.textContent(".product-title");
  const status = await page.textContent("#stock-status-wrap > a");

  console.log(`Status for "${product}": ${status}`);

  await browser.close();
};

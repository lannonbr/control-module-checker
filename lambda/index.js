const { chromium } = require("playwright");
const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-east-1",
});

var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

exports.handler = async function () {
  const getParams = {
    TableName: process.env.DYNAMO_TABLE_NAME,
  };

  const data = await docClient.scan(getParams).promise();

  const urls = data.map((entry) => entry.url);

  const browser = await chromium.launch();

  let results = {};

  // let url =
  //   "https://www.ctrl-mod.com/products/mutable-instruments-blades-dual-multimode-filter";

  for (let url of urls) {
    const page = await browser.newPage();
    await page.goto(url);

    const product = await page.textContent(".product-title");
    const status = await page.textContent("#stock-status-wrap > a");

    console.log(`Status for "${product}": ${status}`);

    results[url] = status;

    await page.close();
  }

  await browser.close();
};

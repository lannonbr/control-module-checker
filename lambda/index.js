const AWS = require("aws-sdk");
const fetch = require("node-fetch");
const cheerio = require("cheerio");

AWS.config.update({
  region: "us-east-1",
});

// States
// ["Out of Stock", "Pre-Order", "In Stock"]

var docClient = new AWS.DynamoDB.DocumentClient({ apiVersion: "2012-08-10" });

exports.handler = async function () {
  const getParams = {
    TableName: process.env.DYNAMO_TABLE_NAME,
  };

  const data = await docClient.scan(getParams).promise();

  const entries = data.Items;

  let results = [];

  for (let entry of entries) {
    const status = await getStatus(entry.url);

    console.log(`Status for "${entry.name}": ${status}`);

    results.push({
      name: entry.name,
      inStock: status === "In Stock" || status === "Pre-Order",
      id: entry.id,
      url: entry.url,
    });
  }

  // TODO: Find diff between data in Dynamo and current state, notify modules in stock, and save changes back to Dynamo

  const inStockModules = results.filter((mod) => {
    return mod.inStock;
  });

  if (inStockModules.length === 0) {
    // No modules in stock, don't send any messages
  } else {
    // Notify me of available modules
    // && Save new update
    inStockModules.forEach(mod => {
      let updateParams = {
        TableName: process.env.DYNAMO_TABLE_NAME,
        Key: {
          id: mod.id,
        },
        UpdateExpression: 'set inStock = :s',
        ExpressionAttributeValues: {
          ":s": mod.inStock
        }
      }

      try {
        await docClient.update(updateParams).promise()
      } catch (err) {
        console.error('Failed to update item')
        console.error(err)
      }
    })
  }

  return {
    statusCode: 200,
  };
};

async function getStatus(url) {
  const resp = await fetch(url);
  const html = await resp.text();

  const $ = cheerio.load(html);

  let status = $("#stock-status-wrap > a").text().trim();

  return status;
}

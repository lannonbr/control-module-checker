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

  const diff = checkDiff(entries, results);

  const inStockModules = diff.filter((mod) => {
    return mod.inStock;
  });

  for (let mod of diff) {
    let updateParams = {
      TableName: process.env.DYNAMO_TABLE_NAME,
      Key: {
        id: mod.id,
      },
      UpdateExpression: "set inStock = :s",
      ExpressionAttributeValues: {
        ":s": mod.inStock,
      },
    };

    console.log("Saving ${mod.name} changes back to Dynamo");

    try {
      await docClient.update(updateParams).promise();
    } catch (err) {
      console.error("Failed to update item");
      console.error(err);
    }
  }

  if (inStockModules.length > 0) {
    const names = inStockModules.map((mod) => mod.name);

    console.log(names);

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require("twilio")(accountSid, authToken);

    let appName = "[CONTROL Module Checker]";

    let body = `${appName} New Modules in Stock: ${names.join(", ")}`;

    await client.messages
      .create({
        body,
        from: process.env.TWILIO_FROM_NUM,
        to: process.env.TWILIO_TO_NUM,
      })
      .then((message) => console.log(message.sid));
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

/**
 *
 * @param {Array} a
 * @param {Array} b
 */
function checkDiff(a, b) {
  const diffArray = [];

  a.forEach((aItem) => {
    const bItem = b.find((bItem) => bItem.id === aItem.id);

    if (bItem && aItem.inStock !== bItem.inStock) {
      diffArray.push(bItem);
    }
  });

  return diffArray;
}

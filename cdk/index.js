const cdk = require("@aws-cdk/core");
const lambda = require("@aws-cdk/aws-lambda");
const events = require("@aws-cdk/aws-events");
const targets = require("@aws-cdk/aws-events-targets");
const dynamodb = require("@aws-cdk/aws-dynamodb");
require("dotenv").config();

class ControlModuleCheckerStack extends cdk.Stack {
  constructor(app, id) {
    super(app, id);

    // Dynamo table
    const dbTable = new dynamodb.Table(this, "control-storage-table", {
      tableName: "control-storage-table",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function
    const fn = new lambda.Function(this, "Code", {
      code: new lambda.AssetCode("../lambda"),
      functionName: "control-module-checker-function",
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(60),
      environment: {
        DYNAMO_TABLE_NAME: dbTable.tableName,
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
        TWILIO_TO_NUM: process.env.TWILIO_TO_NUM,
        TWILIO_FROM_NUM: process.env.TWILIO_FROM_NUM,
      },
    });

    dbTable.grantReadWriteData(fn);

    // Event Trigger - Every day at 16:00 UTC
    const rule = new events.Rule(this, "Rule", {
      schedule: events.Schedule.expression("cron(0 16 * * ? *)"),
    });

    rule.addTarget(new targets.LambdaFunction(fn));
  }
}

const app = new cdk.App();

const stack = new ControlModuleCheckerStack(app, "ControlModuleChecker");
cdk.Tags.of(stack).add("Project", "control-module-checker");

app.synth();

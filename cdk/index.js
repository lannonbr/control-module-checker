const cdk = require("@aws-cdk/core");
const lambda = require("@aws-cdk/aws-lambda");
const events = require("@aws-cdk/aws-events");
const targets = require("@aws-cdk/aws-events-targets");
const dynamodb = require("@aws-cdk/aws-dynamodb");

class ControlModuleCheckerStack extends cdk.Stack {
  constructor(app, id) {
    super(app, id);

    // Lambda function
    const fn = new lambda.Function(this, "Code", {
      code: new lambda.AssetCode("../lambda"),
      functionName: "control-module-checker-function",
      handler: "index.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      memorySize: 512,
      timeout: cdk.Duration.seconds(15),
    });

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

    // Event Trigger
    const rule = new events.Rule(this, "Rule", {
      schedule: events.Schedule.expression("cron(0 18 * * *)"),
    });

    rule.addTarget(new targets.LambdaFunction(fn));
  }
}

const app = new cdk.App();
new ControlModuleCheckerStack(app, "ControlModuleChecker");
app.synth();

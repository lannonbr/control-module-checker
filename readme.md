# CONTROL module checker

A [CDK](https://aws.amazon.com/cdk/) stack to check if modules from [CONTROL](https://www.ctrl-mod.com/) are available.

## Parts

- Lambda function to visit CONTROL's site and check status of pages
- EventBridge rule to run the lambda on a daily basis
- DynamoDB table to store current status of modules
- Twilio for sending a SMS to me when items are back in stock.
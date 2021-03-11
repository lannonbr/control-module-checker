# CONTROL module checker

A CDK setup to check if modules from [CONTROL] are available.

## Parts

- Lambda function to visit CONTROL's site and check status of pages
- EventWatch trigger to run function on daily basis
- DynamoDB table to store current status of modules

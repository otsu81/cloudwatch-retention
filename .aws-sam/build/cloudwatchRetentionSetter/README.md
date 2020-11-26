# aws-cloudwatch-retention-bot

A common problem for large organizations with a multi-account structure is unmanaged CloudWatch logs. As the number of developer teams grow, people rotate in and out, and the ease of testing ideas become normal, so does the number of forgotten CloudWatch log groups which default to a "never expire" retention.

It's not uncommon that organizations pay for terabytes of unnecessary CloudWatch logs - logs from forgotten Lambda functions, deployed Elastic Beanstalk apps, SAM applications, Route 53 zones... You name it.

This is a SAM application which can iterate over all accounts over all regions in an AWS Organization, tries to discover which CloudWatch Log Groups have a "never expire" retention, and set it to a retention period specified as a parameter in the SAM application. This effectively creates a centrally enforced default retention.

## Requirements
The CloudWatch bot should be deployed in the Organizations master account. All child accounts must have a trust to the Organizations master account and provide a standard role.

The Lambda role must have the minimum following permissions:
* `organizations:ListAccounts`
* `sts:AssumeRole`

The IAM requirements for the role in child accounts are:
* `logs:DescribeLogGroups`
* `logs:PutRetentionPolicy`

By default, the AWS Organizations maintenance role is `OrganizationAccountAccessRole`.
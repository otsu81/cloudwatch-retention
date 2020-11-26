# aws-cloudwatch-retention-bot

A common problem for large organizations with a multi-account structure is unmanaged CloudWatch logs. The number of developer teams grow, people rotate in and out, and the ease of testing ideas become normal. By design, logs are usually not deleted automatically. It's easy to forget log groups are not automatically deleted or cleaned up when decommissioning other services like AppSync and Lambda. By default, log groups are also set to "never expire" meaning logs will be kept forever unless there is some deliberate intervention. Ultimately, this is probably a good thing, but it also results in the build-up of many obsolete log groups. It's not uncommon for large organizations to have excess of several terabytes of logs.

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
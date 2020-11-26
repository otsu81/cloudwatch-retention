const AWS = require('aws-sdk');
const getRoleCredentials = require('./getRoleCreds');
const getActiveAccountIds = require('./organizations');

const regions = [
    "eu-north-1",
    "eu-west-1",
    "ap-northeast-1",
    "ap-northeast-2",
    "ap-south-1",
    "ap-southeast-1",
    "ap-southeast-2",
    "ca-central-1",
    "eu-central-1",
    "eu-west-2",
    "eu-west-3",
    "us-east-1",
    "us-east-2",
    "us-west-1",
    "us-west-2"
    // "ap-northeast-3", // osaka region requires opt-in
    // "eu-south-1", // milan region requires opt-in
    // "me-south-1", // bahrain region requires opt-in
    // "sa-east-1", // sao paolo region requires opt-in
    // "af-south-1", // south africa region requires opt-in
    // "ap-east-1", // hong kong region requires opt-in
];

const outOfScopeAccounts = process.env.OUT_OF_SCOPE_ACCOUNTS.split(',');

// exponential backoff with jitter
const delay = retryCount => new Promise(resolve => setTimeout(resolve, 10 ** retryCount + Math.random(500)));

const getLogs = async(params, retryCount = 0, lastError = null) => {
    if (retryCount > 5) throw new Error(lastError);
    try {
        let cwl = new AWS.CloudWatchLogs({
            region: params.region,
            accessKeyId: params.credentials.Credentials.AccessKeyId,
            secretAccessKey: params.credentials.Credentials.SecretAccessKey,
            sessionToken: params.credentials.Credentials.SessionToken
        });
        result = await cwl.describeLogGroups().promise();
        for (r of result.logGroups) {
            if (typeof(r.retentionInDays) == 'undefined') {
                console.log(r.arn)
                // cwl.putRetentionPolicy({
                //     logGroupName: x.logGroupName,
                //     retentionInDays: '365'
                // }, function(err, data){});
            }
        }
    } catch (err) {
        console.log(err);
        if (err.code == 'RequestLimitExceeded') {
            console.log('RequestLimitExceeded, retryCount ', retryCount);
            await delay(retryCount);
            getLogs(params, retryCount + 1, err);
        }
    }
}

exports.handler = async(event, context) => {
    let activeAccounts = await getActiveAccountIds({}); // get set of active accounts
    for (id of outOfScopeAccounts) {
        activeAccounts.delete(id);
    }

    responses = [];
    for (a of activeAccounts) {
        var creds = await getRoleCredentials(a, process.env.ROLENAME, 'CloudwatchBot');
        for (r of regions) {
            params = {
                credentials: creds,
                'region': r
            }
            responses.push(getLogs(params));
        }
    }

    console.log(responses);
    Promise.all(responses).then((values) => {
        for (r of responses) {
            console.log(r)
        }
    });
}
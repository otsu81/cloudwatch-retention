const AWS = require('aws-sdk');
const getRoleCredentials = require('./getRoleCreds');
const getActiveAccountIds = require('./organizations');
const getLogGroups = require('./cloudwatch');

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

const setRetention = async(cwlClient, retryCount = 0, lastError = null) => {
    if (retryCount > 5) throw new Error(lastError);
    try {
        let logGroups = await getLogGroups(cwlClient);
        for (let l of logGroups) {
            if (typeof(l.retentionInDays) == 'undefined') {
                console.log(l.arn)
                cwlClient.putRetentionPolicy({
                    logGroupName: l.logGroupName,
                    retentionInDays: process.env.RETENTION_TIME,
                }, function(err, data){
                    if (err) console.log('ERROR: ', err);
                });
            }
        }
    } catch (err) {
        console.log(err);
        if (err.code == 'RequestLimitExceeded') {
            console.log('RequestLimitExceeded, retryCount ', retryCount);
            await delay(retryCount);
            setRetention(cwlClient, retryCount + 1, err);
        }
    }
}

exports.handler = async(event, context) => {
    let activeAccounts = await getActiveAccountIds({}); // get set of active accounts
    for (let id of outOfScopeAccounts) {
        activeAccounts.delete(id);
    }

    let responses = [];
    for (let a of activeAccounts) {
        var creds = await getRoleCredentials(a, process.env.ROLENAME, 'CloudwatchBot');
        for (let region of regions) {
            let params = {
                credentials: creds,
            }
            let cwl = new AWS.CloudWatchLogs({
                region: region,
                accessKeyId: params.credentials.Credentials.AccessKeyId,
                secretAccessKey: params.credentials.Credentials.SecretAccessKey,
                sessionToken: params.credentials.Credentials.SessionToken
            });
            responses.push(setRetention(cwl));
        }
    }

    console.log(responses);
    Promise.all(responses).then((values) => {
        for (let r of responses) {
            console.log('RESPONSES', r)
        }
    });
}
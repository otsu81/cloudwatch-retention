const AWS = require('aws-sdk');
const getPaginatedResults = require('./paginator');

let getActiveAccountIds = async(params) => {
    // endpoint for Organizations only exist in us-east-1
    AWS.config.update({region: 'us-east-1'});
    const org = new AWS.Organizations();

    const accounts = await getPaginatedResults(async (NextMarker) => {
        const accs = await org.listAccounts({NextToken: NextMarker}).promise();
        return {
            marker: accs.NextToken,
            results: accs.Accounts
        };
    });
    let activeAccounts = new Set();
    for (acc of accounts) {
        if (acc.Status == 'ACTIVE') {
            activeAccounts.add(acc.Id);
        }
    }
    return activeAccounts;
}

module.exports = getActiveAccountIds
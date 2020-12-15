const AWS = require('aws-sdk');
const getPaginatedResults = require('./paginator');

let getLogGroups = async(cwlClient) => {
    const logGroups = await getPaginatedResults(async (NextMarker) => {
        const l = await cwlClient.describeLogGroups({nextToken: NextMarker}).promise();
        return {
            marker: l.nextToken,
            results: l.logGroups
        }
    });
    return logGroups;
};

module.exports = getLogGroups;
'use strict';

var AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
var cloudwatchlogs = new AWS.CloudWatchLogs();
const config = require('../../config');

module.exports = {
  awsLog: function (stream, message) {
    let isLoggingEnabled = (process.env.CLOUDWATCH_LOGS_ENABLED && process.env.CLOUDWATCH_LOGS_ENABLED === 'true') ? true : false;
    console.log('Is Logging Enabled', isLoggingEnabled);
    if (isLoggingEnabled) {
      let logGroupName = config.CLOUDWATCH_LOG_GROUP_NAME;
      var descParam = {
        logGroupName: logGroupName,
      };
      cloudwatchlogs.describeLogStreams(descParam, function (err, data) {
        if (err)
          console.log(err, err.stack); // an error occurred
        else {
          let nextToken = data.logStreams.find(item => item.logStreamName === stream).uploadSequenceToken;
          var params = {
            logEvents: [
              {
                message: message,
                timestamp: (new Date()).valueOf()
              },
            ],
            logGroupName: logGroupName,
            logStreamName: stream,
            sequenceToken: nextToken
          };
          cloudwatchlogs.putLogEvents(params, function (err, data) {
            if (err)
              console.log(err, err.stack); // an error occurred
            else
              console.log(data); // successful response
          });
        }
      });
    }
  }
}
const { CloudWatchLogsClient, DescribeLogStreamsCommand, PutLogEventsCommand } = require("@aws-sdk/client-cloudwatch-logs");
const config = require("../../config");
const client = new CloudWatchLogsClient({ region: process.env.AWS_REGION || "us-east-1" });
module.exports = {
  async awsLog(stream, message) {
    if (process.env.CLOUDWATCH_LOGS_ENABLED !== "true") return;
    try {
      const result = await client.send(new DescribeLogStreamsCommand({ logGroupName: config.CLOUDWATCH_LOG_GROUP_NAME, logStreamNamePrefix: stream }));
      const selected = result.logStreams?.find((entry) => entry.logStreamName === stream);
      await client.send(new PutLogEventsCommand({
        logGroupName: config.CLOUDWATCH_LOG_GROUP_NAME,
        logStreamName: stream,
        sequenceToken: selected?.uploadSequenceToken,
        logEvents: [{ message, timestamp: Date.now() }],
      }));
    } catch (error) { console.error("CloudWatch logging failed:", error); }
  },
};

const axios = require('axios');
const cheerio = require('cheerio');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const settings = require('./config/settings');

class Handler {
  constructor(dynamoDbSvc) {
    this.dynamoDbSvc = dynamoDbSvc;
  }

  async main(event) {
    console.log('at', new Date().toISOString());

    const { data } = await axios.get(settings.commitMessageUrl);
    const loadHTML = cheerio.load(data);
    const [commitMessage] = loadHTML('#content').text().trim().split('\n');

    console.log(commitMessage);

    const params = {
      TableName: settings.dbTableName,
      Item: {
        id: uuidv4(),
        commitMessage,
        createdAt: new Date().toISOString(),
      },
    };

    await this.dynamoDbSvc.put(params).promise();

    console.log('finished');

    return { statusCode: 200 };
  }
}

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const handler = new Handler(dynamoDb);

module.exports = {
  scheduler: handler.main.bind(handler),
};

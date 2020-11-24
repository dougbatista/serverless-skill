const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DYNAMODB_PERSISTENCE_REGION });
const ddb = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

exports.teste = () => {
    const params = {
        TableName: process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
        Item: {
            'user_id ': { user_id: '12345' }
        }
    };
    return new Promise((resolve, reject) => {
        ddb.putItem(params, function (err, data) {
            if (err) {
                console.log("Error", err);
                console.log('REGION :: ', process.env.DYNAMODB_PERSISTENCE_REGION);
                console.log('TABLE :: ', process.env.DYNAMODB_PERSISTENCE_TABLE_NAME);
                reject(err);
            } else {
                resolve(data);
                
                console.log("Success", data);
            }
        });

    })
}
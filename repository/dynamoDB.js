const AWS = require('aws-sdk');
AWS.config.update({ region: process.env.DYNAMODB_PERSISTENCE_REGION });
const ddb = new AWS.DynamoDB.DocumentClient();

exports.insert = (data) => {

    const { userId, acoesArray } = data;

    const params = {
        TableName: process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
        Item: {
            "UserID": userId,
            "acoes": acoesArray
        }
    };
    return new Promise((resolve, reject) => {
        ddb.put(params, function (err, data) {
            if (err) {
                console.log("Error", err);
                reject(err);
            } else {
                resolve(data);
                console.log("Success", data);
            }
        });
    });
}

exports.update = (data) => {

    const { userId, acao, acoesLength } = data;

    const params = {
        TableName: process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
        Key: {
            "UserID": userId
        },
        UpdateExpression: `SET acoes[${acoesLength}] = :a`,
        ExpressionAttributeValues: {
            ":a": acao
        },
        ReturnValues: "UPDATED_NEW"
    };
    return new Promise((resolve, reject) => {
        console.log("Updating the item...");
        ddb.update(params, function (err, data) {
            if (err) {
                console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
                console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
                resolve(data);
            }
        });
    });
};

exports.get = (userId) => {

    const params = {
        TableName: process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
        Key: {
            "UserID": userId
        }
    }
    return new Promise((resolve, reject) => {
        ddb.get(params, function (err, data) {
            if (err) {
                console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
                reject(err);
            } else {
                console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
                resolve(data);
            }
        });
    });
};
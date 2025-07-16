"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Initialize AWS clients
const dynamoClient = new client_dynamodb_1.DynamoDBClient({});
const docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(dynamoClient, {
    marshallOptions: {
        removeUndefinedValues: true,
    },
});
// Get environment variables
const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || 'robot-orchestra-matches';
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
};
const handler = async (event) => {
    console.log('Match History received event:', JSON.stringify(event, null, 2));
    try {
        // Handle CORS preflight
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: '',
            };
        }
        // Get all matches from DynamoDB
        const result = await docClient.send(new lib_dynamodb_1.ScanCommand({
            TableName: TABLE_NAME,
            FilterExpression: '#ts = :zero',
            ExpressionAttributeNames: {
                '#ts': 'timestamp',
            },
            ExpressionAttributeValues: {
                ':zero': 0,
            },
        }));
        // Return full match data, just remove the timestamp field
        const matches = (result.Items || []).map(item => {
            const { timestamp, ...match } = item;
            return match;
        });
        // Sort by creation date (newest first)
        matches.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                matches,
                count: matches.length,
            }),
        };
    }
    catch (error) {
        console.error('Error in match history:', error);
        return {
            statusCode: 500,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
exports.handler = handler;

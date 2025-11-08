// index.mjs (ES Modules)
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB Client
const client = new DynamoDBClient({ region: "ap-south-1" }); // Replace with your AWS region
const dynamo = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'Expenses';

// Lambda handler and functions (update DynamoDB operations)
export const handler = async (event) => {
    let response;
    try {
        switch (event.httpMethod) {
            case 'GET':
                response = await getExpenses();
                break;
            case 'POST':
                response = await addExpense(JSON.parse(event.body));
                break;
            case 'PUT':
                response = await updateExpense(JSON.parse(event.body));
                break;
            case 'DELETE':
                response = await deleteExpense(JSON.parse(event.body).ExpenseID);
                break;
            default:
                response = buildResponse(405, 'Method Not Allowed');
        }
    } catch (err) {
        console.error("Error:", err);
        response = buildResponse(500, 'Internal Server Error');
    }
    return response;
};

const getExpenses = async () => {
    const params = { TableName: TABLE_NAME };
    const data = await dynamo.send(new ScanCommand(params));
    return buildResponse(200, data.Items);
};

const addExpense = async (expense) => {
    const params = { TableName: TABLE_NAME, Item: expense };
    await dynamo.send(new PutCommand(params));
    return buildResponse(201, 'Expense Added');
};

const updateExpense = async (expense) => {
    const params = {
        TableName: TABLE_NAME,
        Key: { ExpenseID: expense.ExpenseID },
        UpdateExpression: 'set #name = :name, #amount = :amount, #category = :category',
        ExpressionAttributeNames: { '#name': 'Name', '#amount': 'Amount', '#category': 'Category' },
        ExpressionAttributeValues: { ':name': expense.Name, ':amount': expense.Amount, ':category': expense.Category }
    };
    await dynamo.send(new UpdateCommand(params));
    return buildResponse(200, 'Expense Updated');
};

const deleteExpense = async (ExpenseID) => {
    const params = { TableName: TABLE_NAME, Key: { ExpenseID: ExpenseID } };
    await dynamo.send(new DeleteCommand(params));
    return buildResponse(200, 'Expense Deleted');
};

const buildResponse = (statusCode, body) => ({
    statusCode,
    headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(body),
});



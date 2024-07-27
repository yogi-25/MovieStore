const { KeyType } = require('@aws-sdk/client-dynamodb');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-west-2' }); // Replace 'your-region' with your AWS region

const dynamodb = new AWS.DynamoDB();

const moviesTableParams = {
  TableName: 'Movie',
  KeySchema: [
    { AttributeName: 'movieId', KeyType: 'HASH' },  // Partition key
    { AttributeName: 'title', KeyType: 'RANGE' }    // Sort key
  ],
  AttributeDefinitions: [
    { AttributeName: 'movieId', AttributeType: 'S' } ,
    { AttributeName: 'title', AttributeType: 'S' }      // Additional attribute
  ],
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
};

// Create tables
dynamodb.createTable(moviesTableParams, (err, data) => {
  if (err) console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
  else console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
});


const CastMembersTableParams = {
  TableName: 'CastMembers',
  KeySchema:[
    { AttributeName: 'castMember',KeyType:'HASH'},
    {AttributeName: 'movieId',KeyType:'RANGE'}
  ],
  AttributeDefinitions: [
    { AttributeName: 'castMember', AttributeType: 'S' } ,
    { AttributeName: 'movieId', AttributeType: 'S' } 
  ],
  ProvisionedThroughput:{
    ReadCapacityUnits:5,
    WriteCapacityUnits:5
  }
}
dynamodb.createTable(CastMembersTableParams,(err,data)=>{
  if(err) console.error("Unable to create a table",JSON.stringify(err,null,2));
  else console.log("Created table. Table description JSON:",JSON.stringify(data,null,2));
})



const GenresTableParams = {
  TableName: 'Genres',
  KeySchema:[
    { AttributeName: 'genres',KeyType:'HASH'},
    {AttributeName: 'movieId',KeyType:'RANGE'}
  ],
  AttributeDefinitions: [
    { AttributeName: 'genres', AttributeType: 'S' } ,
    { AttributeName: 'movieId', AttributeType: 'S' } 
  ],
  ProvisionedThroughput:{
    ReadCapacityUnits:5,
    WriteCapacityUnits:5
  }
}
dynamodb.createTable(GenresTableParams,(err,data)=>{
  if(err) console.error("Unable to create a table",JSON.stringify(err,null,2));
  else console.log("Created table. Table description JSON:",JSON.stringify(data,null,2));
})
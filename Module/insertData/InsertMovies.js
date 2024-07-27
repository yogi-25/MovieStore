const fs = require('fs');
const { DynamoDB } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const crypto = require('crypto'); // Import the crypto module

const dynamoDB = new DynamoDB({ region: 'us-west-2' }); // Replace 'us-east-1' with your AWS region

// Read the data from output_deduplicated.json
const rawData = fs.readFileSync('movies_data.json');
const moviesData = JSON.parse(rawData);

// Function to generate movieId from title
function generateMovieId(title) {
    const hash = crypto.createHash('sha256');
    hash.update(title);
    return hash.digest('hex');
}

// Function to batch write items into DynamoDB
async function batchWriteItems(tableName, items) {
    const chunks = [];
    const chunkSize = 25; // Maximum batch size is 25 items per request

    for (let i = 0; i < items.length; i += chunkSize) {
        chunks.push(items.slice(i, i + chunkSize));
    }

    const promises = chunks.map(async (chunk) => {
        const params = {
            RequestItems: {
                [tableName]: chunk.map(item => ({
                    PutRequest: {
                        Item: marshall(item)
                    }
                }))
            }
        };

        try {
            const data = await dynamoDB.batchWriteItem(params);
            console.log(`Batch write succeeded for ${tableName}:`, data);
        } catch (error) {
            console.error(`Error batch writing items to ${tableName}:`, error);
        }
    });

    await Promise.all(promises);
}

// Function to prepare items for insertion into Movie table
function prepareMovieItems(movie) {
    const movieId = generateMovieId(movie.title);
    return {
        movieId: movieId,
        title: movie.title,
        year: movie.year,
        href: movie.href,
        extract: movie.extract
    };
}

// Function to prepare items for insertion into CastMembers table
function prepareCastMemberItems(movie) {
    const movieId = generateMovieId(movie.title);
    return movie.cast.map(castMember => ({
        castMember: castMember,
        movieId: movieId
    }));
}

// Function to prepare items for insertion into Genres table
function prepareGenresItems(movie) {
    const movieId = generateMovieId(movie.title);
    return movie.genres.map(genre => ({
        genres: genre,
        movieId: movieId
    }));
}

// Batch write all data into DynamoDB tables
async function batchWriteData() {
    const movieItems = [];
    const castMemberItems = [];
    const genresItems = [];

    for (const movie of moviesData) {
        movieItems.push(prepareMovieItems(movie));
        castMemberItems.push(...prepareCastMemberItems(movie));
        genresItems.push(...prepareGenresItems(movie));
    }

    await batchWriteItems('Movie', movieItems);
    await batchWriteItems('CastMembers', castMemberItems);
    await batchWriteItems('Genres', genresItems);
}

// Call the function to start batch writing data
batchWriteData().then(() => {
    console.log('Batch write completed successfully.');
}).catch(err => {
    console.error('Error performing batch write:', err);
});

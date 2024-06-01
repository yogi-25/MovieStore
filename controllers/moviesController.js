const docClient = require('../config/aws-config');

const getMoviesByCastMember = async (req, res) => {
    const { castMember } = req.params;

    try {
        // Query CastMembers table using secondary index to get movieIds for the cast member
        const castParams = {
            TableName: 'CastMembers',
            IndexName: 'cast_member-movieId-index', // Secondary index on cast_member attribute
            KeyConditionExpression: 'cast_member = :castMember',
            ExpressionAttributeValues: {
                ':castMember': castMember
            }
        };

        const castData = await docClient.query(castParams).promise();
        if (!castData.Items || castData.Items.length === 0) {
            return res.status(404).json({ error: 'No movies found for the cast member' });
        }

        // Extract movieIds from the query result
        const movieIds = castData.Items.map(item => item.movieId);
        
        // Retrieve movie details directly from Movies table using MovieIdIndex
        const moviesDetails = await Promise.all(movieIds.map(async (movieId) => {
            const movieParams = {
                TableName: 'Movies',
                IndexName: 'movieId-index', // Secondary index on movieId attribute
                KeyConditionExpression: 'movieId = :movieId',
                ExpressionAttributeValues: {
                    ':movieId': movieId
                }
            };
            const movieData = await docClient.query(movieParams).promise();
            return movieData.Items[0]; // Assuming movieId is unique, return the first item
        }));

        // Return movie details
        res.json(moviesDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



const getMoviesByGenre = async (req, res) => {
    const { genre } = req.params;
    const { pageSize = 10, page = 1 } = req.query;

    try {
        // Query the genres table to get movieIds associated with the specified genre
        const genreParams = {
            TableName: 'Genres',
            KeyConditionExpression: 'genre = :genre',
            ExpressionAttributeValues: {
                ':genre': genre
            }
        };

        const genreData = await docClient.query(genreParams).promise();
        if (!genreData.Items || genreData.Items.length === 0) {
            return res.status(404).json({ error: 'No movies found for the genre' });
        }

        // Extract movieIds from the query result
        const movieIds = genreData.Items.map(item => item.movieId);

        // Query the Movies table using the secondary index on movieId attribute
        const movieDetails = await Promise.all(movieIds.map(async (movieId) => {
            const movieParams = {
                TableName: 'Movies',
                IndexName: 'movieId-index', // Secondary index on movieId attribute
                KeyConditionExpression: 'movieId = :movieId',
                ExpressionAttributeValues: {
                    ':movieId': movieId
                }
            };
            const movieData = await docClient.query(movieParams).promise();
            return movieData.Items[0]; // Assuming movieId is unique, return the first item
        }));

        // Implement pagination logic
        const startIndex = (page - 1) * pageSize;
        const paginatedMovies = movieDetails.slice(startIndex, startIndex + pageSize);

        // Return paginated movie details
        res.json(paginatedMovies);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMovieDetailsByMovieId = async (req, res) => {
    const { movieId } = req.params;

    const params = {
        TableName: 'Movies',
        IndexName: 'movieId-index', // Name of your secondary index with movieId as primary key
        KeyConditionExpression: 'movieId = :movieId',
        ExpressionAttributeValues: {
            ':movieId': movieId
        }
    };

    try {
        const data = await docClient.query(params).promise();
        if (data.Items && data.Items.length > 0) {
            res.json(data.Items[0]); // Assuming movieId is unique, return the first item
        } else {
            res.status(404).json({ error: 'Movie not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const addMovie = async (req, res) => {
    const { movieId, title, year, castMembers, genres } = req.body;

    try {
        // Validate input
        if (!movieId || !title || !year || !castMembers || !genres) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Transaction to update all three tables
        const transactionParams = {
            TransactItems: [
                {
                    Put: {
                        TableName: 'Movies',
                        Item: {
                            movieId: movieId,
                            title: title,
                            year: year
                        }
                    }
                },
                ...castMembers.map(castMember => ({
                    Put: {
                        TableName: 'CastMembers',
                        Item: {
                            cast_member: castMember,
                            movieId: movieId
                        }
                    }
                })),
                ...genres.map(genre => ({
                    Put: {
                        TableName: 'Genres',
                        Item: {
                            genre: genre,
                            movieId: movieId
                        }
                    }
                }))
            ]
        };

        await docClient.transactWrite(transactionParams).promise();
        res.json({ message: `Movie ${title} added successfully with cast members and genres.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getGenresForMovie = async (movieId) => {
    const params = {
        TableName: 'Genres',
        FilterExpression: 'movieId = :movieId',
        ExpressionAttributeValues: {
            ':movieId': movieId
        }
    };

    const data = await docClient.scan(params).promise();
    return data.Items.map(item => item.genre);
};

const removeCastMember = async (req, res) => {
    const { movieId } = req.params;
    const { castMember } = req.body;

    try {
        // Get the genres associated with the movie
        const genres = await getGenresForMovie(movieId);

        // Transaction to delete from all three tables
        const transactionParams = {
            TransactItems: [
                {
                    Delete: {
                        TableName: 'CastMembers',
                        Key: {
                            cast_member: castMember,
                            movieId: movieId
                        }
                    }
                },
                ...genres.map(genre => ({
                    Delete: {
                        TableName: 'Genres',
                        Key: {
                            genre: genre,
                            movieId: movieId
                        }
                    }
                }))
            ]
        };

        await docClient.transactWrite(transactionParams).promise();
        res.json({ message: `Cast member ${castMember} removed from movie ${movieId}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getMovieByTitle = async (req, res) => {
    const { title } = req.params;

    const params = {
        TableName: 'Movies',
        IndexName: 'title-movieId-index', // Replace with the name of your secondary index
        KeyConditionExpression: 'title = :title',
        ExpressionAttributeValues: {
            ':title': title
        }
    };

    try {
        const data = await docClient.query(params).promise();
        if (data.Items && data.Items.length > 0) {
            res.json(data.Items);
        } else {
            res.status(404).json({ error: 'Movie not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


module.exports = {
    getMoviesByCastMember,
    getMoviesByGenre,
    getMovieDetailsByMovieId,
    addMovie,
    removeCastMember,
    getMovieByTitle
};

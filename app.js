const express = require('express');
const movies = require('./movies.json'); 
const crypto = require('crypto');
const cors = require('cors');
const { validateMovie, validatePartialMovie } = require('./schemas/movies');

const app = express();
app.disable('x-powered-by'); // Deshabilitar 'X-Powered-By' header por seguridad
app.use(cors(
    {
        origin: (origin, callback) => {
            const ACCEPTED_ORIGINS = [
                'http://localhost:1234',
                'http://localhost:8080',
                'https://movies.com', 
            ];

            if (!origin || ACCEPTED_ORIGINS.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('CORS policy violation: Origin not allowed'));
            }
        }, 
        methods: ['GET', 'POST', 'DELETE', 'PATCH'], // Specify allowed methods
        allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
    }
)); 

app.use(express.json());




app.get('/movies', (req, res) => {
    const { genre } = req.query;
    if (genre) {
        const filteredMovies = movies.filter(
            movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        )
        return res.json(filteredMovies);
    }
    res.json(movies);
})

app.get('/movies/:id', (req, res) => {
    const { id } = req.params;
    const movie = movies.find(movie => movie.id === id)
    if (movie) return res.json(movie);
    res.status(404).json({ error: 'Movie not found' });
})

app.post('/movies', (req, res) => {
   
    const result = validateMovie(req.body);
    if (!result.success) {
        return res.status(400).json({
            error: 'Invalid movie data',
            details: JSON.parse(result.error.message)
        });
    }

    const newMovie = {
        id: crypto.randomUUID(),
        ...result.data,
    };

    movies.push(newMovie);
    res.status(201).json(newMovie);

})

app.delete('/movies/:id', (req, res) => {
    const { id } = req.params;
    const movieIndex = movies.findIndex(movie => movie.id === id);
    if (movieIndex === -1) {
        return res.status(404).json({ error: 'Movie not found' });
    }
    movies.splice(movieIndex, 1);
    res.status(204).send(); 
});


app.patch('/movies/:id', (req, res) => {
    const result = validatePartialMovie(req.body);
    if(!result.success) {
        return res.status(400).json({
            error: 'Invalid movie data',
            details: JSON.parse(result.error.message)
        });
    }
    const { id } = req.params;
    const movieIndex = movies.findIndex(movie => movie.id === id);

    if (movieIndex === -1) {
        return res.status(404).json({ error: 'Movie not found' });
    }

    const updateMovie = {
        ...movies[movieIndex],
        ...result.data,
    }
    movies[movieIndex] = updateMovie;
    return res.json(updateMovie);
})








const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
})
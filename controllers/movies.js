//import { MovieModel } from "../models/local-file-system/movie.js";
//import { MovieModel } from "../models/mysql/movie.js";
import { validateMovie, validatePartialMovie } from "../schemas/movies.js";

export class MovieController {
    constructor ({ movieModel }) {
        this.movieModel = movieModel;
    }

    getAll = async (req, res)  => {
        const { genre } = req.query;
        const movies = await this.movieModel.getAll({ genre });
        if (movies.length === 0) {
            return res.status(404).json({ error: 'No movies found' });
        }
        res.json(movies);
    }

    getById = async (req, res) => {
        const { id } = req.params;
        const movie = await this.movieModel.getById({ id });
        if (!movie ) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json(movie);
    }

    create = async (req, res) => {
        const result = validateMovie(req.body);
            if (!result.success) {
                return res.status(400).json({
                    error: 'Invalid movie data',
                    details: JSON.parse(result.error.message)
                });
            }
        const newMovie = await this.movieModel.create({ input: result.data });     
        res.status(201).json(newMovie);
    }

    delete = async (req, res) => {
        const { id } = req.params;
        const result = await this.movieModel.delete({ id });
        if (result === false) {
            return res.status(404).json({ error: 'Movie not found' });
        }   
        return res.json({ message: 'Movie deleted successfully' }); 
    
    }

    update = async (req, res) => {
        const result = validatePartialMovie(req.body);
        if (!result.success) {
            return res.status(400).json({
                error: 'Invalid movie data',
                details: JSON.parse(result.error.message)
            });
        }
        const { id } = req.params;
        const updatedMovie = await this.movieModel.update({ id, input: result.data });
        if (!updatedMovie) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        return res.json(updatedMovie);
    }
}
import mysql from 'mysql2/promise';

const config = {
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'moviesdb',
    port: 3306
}

const connection = await mysql.createPool(config);


export class MovieModel {
    static async getAll ({genre}) {
        if(genre) {
            const lowerCaseGenre = genre.toLowerCase();
            const [moviesByGenre] = await connection.query(
                `SELECT BIN_TO_UUID(movie_id) AS id, title, year, director, duration, poster, rate, name AS genre 
                FROM movies 
                JOIN movies_genre ON movies_genre.movie_id = movies.id
                JOIN genre ON movies_genre.genre_id = genre.id
                WHERE LOWER(genre.name) = ?`,
                [lowerCaseGenre]
            );
            return moviesByGenre;
            
        }

        const [movies] = await connection.query(
            'SELECT BIN_TO_UUID(id) AS id, title, year, director, duration, poster, rate  FROM movies;'
        );
       return movies
    }

    static async getById({ id }) {
      const movie = await connection.query(
            `SELECT BIN_TO_UUID(id) AS id, title, year, director, duration, poster, rate 
             FROM movies 
             WHERE id = UUID_TO_BIN(?)`, 
            [id]
        );
        if (movie.length === 0) return null;
        
        return movie[0]

    } 

    static async create({ input }) {
       const [uuidResult] = await connection.query('SELECT UUID() uuid;');
       const [{ uuid }] = uuidResult;

       const { title, year, director, duration, poster, rate } = input;
       try{
         await connection.query(
            `INSERT INTO movies (id, title, year, director, duration, poster, rate)
             VALUES (UUID_TO_BIN(${uuid}), ?, ?, ?, ?, ?, ?)`,
            [title, year, director, duration, poster, rate]
       );
       }catch (error) {
            console.error('Error inserting movie:', error);
            throw error;
       }
       const [movies] = await connection.query(
        `SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id
         FROM movies WHERE id = UUID_TO_BIN(?)`,
        [uuid]
       );
       
       return movies[0];
    }

    static async delete({ id }) {
        
    }

    static async update({ id, input }) {
       
    }
}
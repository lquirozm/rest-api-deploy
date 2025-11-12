import mysql from "mysql2/promise";

const config = {
  host: "localhost",
  user: "root",
  password: "",
  database: "moviesdb",
  port: 3306,
};

const connection = mysql.createPool(config);

export class MovieModel {
  static async getAll({ genre }) {
    if (genre) {
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
      "SELECT BIN_TO_UUID(id) AS id, title, year, director, duration, poster, rate  FROM movies;"
    );
    return movies;
  }

  static async getById({ id }) {
    const movie = await connection.query(
      `SELECT BIN_TO_UUID(id) AS id, title, year, director, duration, poster, rate 
             FROM movies 
             WHERE id = UUID_TO_BIN(?)`,
      [id]
    );
    if (movie.length === 0) return null;

    return movie[0];
  }

  static async create({ input }) {
    const [uuidResult] = await connection.query("SELECT UUID() uuid;");
    const [{ uuid }] = uuidResult;

    const {
      title,
      year,
      director,
      duration,
      poster,
      rate,
      genre: genreInput, //genre is an array
    } = input;

    try {
      await connection.query(
        `INSERT INTO movies (id, title, year, director, duration, poster, rate)
             VALUES (UUID_TO_BIN(?), ?, ?, ?, ?, ?, ?)`,
        [uuid, title, year, director, duration, poster, rate]
      );

      if (genreInput && genreInput.length > 0) {
        for (const genreName of genreInput) {
          const [genreResult] = await connection.query(
            `INSERT INTO movies_genre (movie_id, genre_id)
                    VALUES (UUID_TO_BIN(?), (SELECT id FROM genre WHERE name = ?))`,
            [uuid, genreName]
          );
          if (genreResult.affectedRows === 0) {
            throw new Error(`Genero no encontrado: ${genreName}`);
          }
        }
      }
      // Obtener la película recién insertada
      const [movies] = await connection.query(
        `SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id
         FROM movies WHERE id = UUID_TO_BIN(?)`,
        [uuid]
      );

      // Obtener los géneros de la película
      const [genres] = await connection.query(
        `SELECT g.name
       FROM genre g
       INNER JOIN movies_genre mg ON g.id = mg.genre_id
       WHERE mg.movie_id = UUID_TO_BIN(?)`,
        [uuid]
      );

      const movie = movies[0];
      movie.genre = genres.map((g) => g.name);

      return movie;
    } catch (error) {
      console.error("Error inserting movie:", error);
      throw error;
    }
  }

  static async delete({ id }) {
    try {
      const movie = await connection.query(
        `DELETE FROM movies WHERE id = UUID_TO_BIN(?)`,
        [id]
      );
      if (movie[0].affectedRows === 0) {
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error deleting movie:", error);
      throw error;
    }
  }

  static async update({ id, input }) {
    const { genre, ...movieData } = input;

    try {
      const [existingMovie] = await connection.query(
        `SELECT * FROM movies WHERE id = UUID_TO_BIN(?)`,
        [id]
      );

      if (existingMovie.length === 0) {
        return null;
      }

      const fieldsToUpdate = Object.keys(movieData);

      if (fieldsToUpdate.length > 0) {
        const setClause = fieldsToUpdate
          .map((field) => `${field} = ?`)
          .join(", ");
        const values = fieldsToUpdate.map((field) => movieData[field]);
        values.push(id);

        await connection.query(
          `UPDATE movies SET ${setClause} WHERE id = UUID_TO_BIN(?)`,
          values
        );
      }

      if (genre !== undefined && Array.isArray(genre)) {
        await connection.query(
          `DELETE FROM movies_genre WHERE id = UUID_TO_BIN(?)`,
          [id]
        );

        if (genre.length > 0) {
          for (const genreName of genre) {
            const [genreResult] = await connection.query(
              `INSERT INTO movies_genre (movie_id, genre_id)
                        VALUES (UUID_TO_BIN(?), (SELECT id FROM genre WHERE name = ?))`,
              [id, genreName]
            );

            if (genreResult.affectedRows === 0) {
              throw new Error(`Genre not found: ${genreName}`);
            }
          }
        }
      }

      //Obtener la pelicula actualizada con sus generos
      const [movies] = await connection.query(
        `SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id
           FROM movies WHERE id = UUID_TO_BIN(?)`,
        [id]
      );

      const [genres] = await connection.query(
        `SELECT g.name
          FROM genre g
          INNER JOIN movies_genre mg ON g.id = mg.genre_id
          WHERE mg.movie_id = UUID_TO_BIN(?)`,
        [id]
      );

      const movie = movies[0];
      movie.genre = genres.map((g) => g.name);

      return movie;
    } catch (error) {
      console.error("Error updating movie:", error);
      throw error;
    }
  }
}

import express, { json } from "express";
import { createMovieRouter } from "./routes/movies.js";
import { corsMiddleware } from "./middleware/cors.js";

//Importar Json de esta manera sigue en forma experimental
//import movies from './movies.json' with { type: 'json' };
export const createApp = ({ movieModel }) => {
  const app = express();
  app.disable("x-powered-by");
  app.use(corsMiddleware());
  app.use(json());

  app.use("/movies", createMovieRouter({ movieModel }));

  const PORT = process.env.PORT ?? 1234;

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
};

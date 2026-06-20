import express, { type Express, type Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

interface AppOptions {
  routes: { path: string; router: Router }[];
}

export const setupApp = (options: AppOptions): Express => {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  options.routes.forEach((route) => {
    app.use(route.path, route.router);
  });

  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal Server Error',
      },
    });
  });

  return app;
};

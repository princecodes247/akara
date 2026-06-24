import express, { type Express, type Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

type AppRoute = 
  | { path: string; router: Router }
  | { prefix?: string; middlewares?: express.RequestHandler[]; routes: AppRoute[] };

interface AppOptions {
  routes: AppRoute[];
}

export const setupApp = (options: AppOptions): Express => {
  const app = express();

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'", "cdn.jsdelivr.net"],
        "style-src": ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com"],
        "font-src": ["'self'", "fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "cdn.jsdelivr.net"],
      },
    },
  }));

  // Global rate limiting to prevent DoS and brute-force attacks
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes).
    standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  });
  app.use(limiter);

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const mountRoutes = (target: Router | Express, routes: AppRoute[]) => {
    routes.forEach((route) => {
      if ("router" in route) {
        (target as any).use(route.path, route.router);
      } else {
        const groupRouter = express.Router();
        if (route.middlewares && route.middlewares.length > 0) {
          groupRouter.use(...route.middlewares);
        }
        mountRoutes(groupRouter, route.routes);
        (target as any).use(route.prefix || "/", groupRouter);
      }
    });
  };

  mountRoutes(app, options.routes);

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

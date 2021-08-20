import cookieParser from 'cookie-parser';
import express, { Request, NextFunction, Response } from 'express';
import handlebars from 'express-handlebars';
import loginHandler from './routes/login';
import errorHandler from './routes/error';
import dashboard from './routes/dashboard';
import debug from './routes/debug';
import config, { SECURITY_MODE_JWT } from './config';
import { getTitle, onlyNodes, toUiNodePartial } from './helpers/ui';
import { extend, block } from './helpers/extend';
import settingsHandler from './routes/settings';
import verifyHandler from './routes/verification';
import recoveryHandler from './routes/recovery';
import morgan from 'morgan';
import * as path from 'path';
import protectSimple from './middleware/simple';
import protectOathkeeper from './middleware/oathkeeper';
import { metrics, metric } from './routes/metrics';
import { updateServices } from './routes/tenant';
import network from './routes/network';
import instructions from './routes/instructions';
import geolocation from './routes/geolocation';
import manifest from './routes/manifest';
import axios from 'axios';
import https from 'https';
const fs = require('fs');

https.globalAgent.options.rejectUnauthorized = false;

export const protect =
  config.securityMode === SECURITY_MODE_JWT ? protectOathkeeper : protectSimple;

export const app = express();
app.use(express.static(path.join(process.env.PERSIST_FILES_PATH as string)));
app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'hbs');

app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals.projectName = config.projectName;
  res.locals.baseUrl = config.baseUrl;
  res.locals.pathPrefix = path.join(config.baseUrl, './');
  next();
});

app.use(express.static('public'));
app.use(express.static('node_modules/normalize.css'));

app.engine(
  'hbs',
  handlebars({
    extname: 'hbs',
    layoutsDir: path.join(__dirname, '/../views/layouts/'),
    partialsDir: path.join(__dirname, '/../views/partials/'),
    defaultLayout: 'main',
    helpers: {
      ...require('handlebars-helpers')(),
      json: (context: any) => JSON.stringify(context),
      jsonPretty: (context: any) => JSON.stringify(context, null, 2),
      onlyNodes,
      getTitle,
      toUiNodePartial,
      extend,
      block
    }
  })
);

app.get('/', protect, dashboard);
app.get('/dashboard', protect, dashboard);
// app.get('/auth/registration', registrationHandler);
app.get('/auth/login', loginHandler);
app.get('/error', errorHandler);
app.get('/settings', protect, settingsHandler);
app.get('/verify', verifyHandler);
app.get('/recovery', recoveryHandler);

app.get('/health', (_: Request, res: Response) => res.send('ok'));
app.get('/debug', debug);

// cerebral routes
app.get('/network', protect, network);
app.get('/metrics/:type/:index', protect, metric);
app.get('/metrics', protect, metrics);
app.get('/instructions', protect, instructions);
app.post('/geolocation', protect, geolocation);
app.post('/tenant/updateServices', protect, updateServices);

// Do not protect the following routes
app.get('/manifest', manifest);
// app.get('*', (_: Request, res: Response) => {
//   res.redirect(config.baseUrl);
// });

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // console.error(err.stack);
  res.status(500).render('error', {
    message: JSON.stringify(err, null, 2)
  });
});

const port = Number(process.env.PORT) || 3000;

const listener = () => {
  const proto = config.https.enabled ? 'https' : 'http';
  console.log(`Listening on ${proto}://0.0.0.0:${port}`);
  console.log(`Security mode: ${config.securityMode}`);
};

if (config.https.enabled) {
  const options = {
    cert: fs.readFileSync(config.https.certificatePath),
    key: fs.readFileSync(config.https.keyPath)
  };

  https.createServer(options, app).listen(port, listener);
} else {
  app.listen(port, listener);
}

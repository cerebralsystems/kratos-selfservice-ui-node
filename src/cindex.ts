import { metrics, metric } from './routes/metrics';
import { updateServices } from './routes/tenant';
import network from './routes/network';
import instructions from './routes/instructions';
import geolocation from './routes/geolocation';
import manifest from './routes/manifest';
import * as Index from './index';

const app = Index.app;
const protect = Index.protect;

// cerebral routes
app.get('/network', protect, network);
app.get('/metrics/:type/:index', protect, metric);
app.get('/metrics', protect, metrics);
app.get('/instructions', protect, instructions);
app.post('/geolocation', protect, geolocation);
app.post('/tenant/updateServices', protect, updateServices);

// Do not protect the following routes
app.get('/manifest', manifest);

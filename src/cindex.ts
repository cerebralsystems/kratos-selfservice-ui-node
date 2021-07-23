import * as Index from './index';
import network from './routes/network';
import { metrics, metric } from './routes/metrics';
import instructions from './routes/instructions';

const app = Index.app;
const protect = Index.protect;

// cerebral routes
app.get('/network', protect, network);
app.get('/metrics/:type/:index', protect, metric);
app.get('/metrics', protect, metrics);
app.get('/instructions', protect, instructions);

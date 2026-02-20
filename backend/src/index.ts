import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { reservasRouter } from './routes/reservas.js';
import { contactosRouter } from './routes/contactos.js';

dotenv.config();

const app = express();

const port = Number(process.env.PORT ?? 3000);
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:4200';

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'backend', time: new Date().toISOString() });
});

app.use('/api/reservas', reservasRouter);

app.listen(port, () => {
  console.log(`[backend] listening on http://localhost:${port}`);
});

app.use('/api/contactos', contactosRouter);

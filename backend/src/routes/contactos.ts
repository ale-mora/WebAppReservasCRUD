import { Router } from 'express';
import { z } from 'zod';
import { makeClient } from '../make/client.js';

export const contactosRouter = Router();

contactosRouter.use((req, res, next) => {
  const requiredKey = process.env.API_KEY;
  if (!requiredKey) return res.status(500).json({ ok: false, error: 'API_KEY not configured' });

  const provided = req.header('x-api-key');
  if (provided !== requiredKey) return res.status(401).json({ ok: false, error: 'Unauthorized' });

  next();
});

// LIST Contacts -> READ webhook expects { tipo: "contacts" }
contactosRouter.get('/', async (req, res) => {
  const payload = { tipo: 'contacts', ...(req.query ?? {}) };

  const result = await makeClient.listReservas<any>(payload);
  if (!result.ok) return res.status(502).json({ ok: false, error: result.error });

  const arr = Array.isArray(result.data) ? result.data : [];

  const normalized = arr.map((x: any) => ({
    id: String(x?.id ?? x?.properties?.hs_object_id),
    email: x?.properties?.email ?? null,
    firstName: x?.properties?.firstname ?? null,
    lastName: x?.properties?.lastname ?? null,
    country: x?.properties?.country ?? null,
    createdAt: x?.createdAt ?? x?.properties?.createdate ?? null,
    updatedAt: x?.updatedAt ?? x?.properties?.lastmodifieddate ?? null,
  }));

  return res.json({ ok: true, data: normalized });
});

// GET Contact by id (sin cambiar Make): pedimos lista y filtramos local
contactosRouter.get('/:id', async (req, res) => {
  const id = z.coerce.string().min(1).parse(req.params.id);

  const result = await makeClient.listReservas<any>({ tipo: 'contacts' });
  if (!result.ok) return res.status(502).json({ ok: false, error: result.error });

  const arr = Array.isArray(result.data) ? result.data : [];
  const found = arr.find((x: any) => String(x?.id ?? x?.properties?.hs_object_id) === id);

  if (!found) return res.status(404).json({ ok: false, error: 'Not found', id });

  const normalized = {
    id: String(found?.id ?? found?.properties?.hs_object_id),
    email: found?.properties?.email ?? null,
    firstName: found?.properties?.firstname ?? null,
    lastName: found?.properties?.lastname ?? null,
    country: found?.properties?.country ?? null,
    createdAt: found?.createdAt ?? found?.properties?.createdate ?? null,
    updatedAt: found?.updatedAt ?? found?.properties?.lastmodifieddate ?? null,
  };

  return res.json({ ok: true, data: normalized });
});

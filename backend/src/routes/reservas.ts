import { Router } from 'express';
import { z } from 'zod';
import { makeClient } from '../make/client.js';
import { ReservaCreateSchema, ReservaUpdateSchema } from '../schemas/reserva.schema.js';

export const reservasRouter = Router();

reservasRouter.use((req, res, next) => {
  const requiredKey = process.env.API_KEY;
  if (!requiredKey) return res.status(500).json({ ok: false, error: 'API_KEY not configured' });

  const provided = req.header('x-api-key');
  if (provided !== requiredKey) return res.status(401).json({ ok: false, error: 'Unauthorized' });

  next();
});

// CREATE -> Make CREATE (upsert contact + create deal)
reservasRouter.post('/', async (req, res) => {
  const parsed = ReservaCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const result = await makeClient.createReserva<any>(parsed.data);
  if (!result.ok) return res.status(502).json({ ok: false, error: result.error });

  return res.status(201).json({ ok: true, data: result.data });
});

// LIST Deals -> Make READ expects { tipo: "deals" }
reservasRouter.get('/', async (req, res) => {
  const payload = { tipo: 'deals', ...(req.query ?? {}) };

  const result = await makeClient.listReservas<any>(payload);
  if (!result.ok) return res.status(502).json({ ok: false, error: result.error });

  const arr = Array.isArray(result.data) ? result.data : [];

  const normalized = arr.map((x: any) => ({
    id: String(x?.id ?? x?.properties?.hs_object_id),
    dealName: x?.properties?.dealname ?? null,
    checkIn: x?.properties?.check_in ?? null,
    checkOut: x?.properties?.check_out ?? null,
    pipeline: x?.properties?.pipeline ?? null,
    dealStage: x?.properties?.dealstage ?? null,
    createdAt: x?.createdAt ?? x?.properties?.createdate ?? null,
    updatedAt: x?.updatedAt ?? x?.properties?.hs_lastmodifieddate ?? null,
  }));

  return res.json({ ok: true, data: normalized });
});

reservasRouter.get('/:id', async (req, res) => {
  const id = z.coerce.string().min(1).parse(req.params.id);

  const result = await makeClient.listReservas<any>({ tipo: 'deals' });
  if (!result.ok) return res.status(502).json({ ok: false, error: result.error });

  const arr = Array.isArray(result.data) ? result.data : [];
  const found = arr.find((x: any) => String(x?.id ?? x?.properties?.hs_object_id) === id);

  if (!found) return res.status(404).json({ ok: false, error: 'Not found', id });

  const normalized = {
    id: String(found?.id ?? found?.properties?.hs_object_id),
    dealName: found?.properties?.dealname ?? null,
    checkIn: found?.properties?.check_in ?? null,
    checkOut: found?.properties?.check_out ?? null,
    pipeline: found?.properties?.pipeline ?? null,
    dealStage: found?.properties?.dealstage ?? null,
    createdAt: found?.createdAt ?? found?.properties?.createdate ?? null,
    updatedAt: found?.updatedAt ?? found?.properties?.hs_lastmodifieddate ?? null,
  };

  return res.json({ ok: true, data: normalized });
});

// UPDATE Deal -> Make UPDATE expects { id, tipo:"deals", properties:{...} }
reservasRouter.put('/:id', async (req, res) => {
  const id = z.coerce.string().min(1).parse(req.params.id);

  const parsed = ReservaUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.flatten() });

  const b: any = parsed.data ?? {};

  // Alineado a Make: dealname, check_in, check_out (pero aceptamos aliases)
  const properties = {
    ...(b.dealname !== undefined ? { dealname: b.dealname } : {}),
    ...(b.check_in !== undefined
      ? { check_in: b.check_in }
      : b.checkin !== undefined
        ? { check_in: b.checkin }
        : b.checkIn !== undefined
          ? { check_in: b.checkIn }
          : {}),
    ...(b.check_out !== undefined
      ? { check_out: b.check_out }
      : b.checkout !== undefined
        ? { check_out: b.checkout }
        : b.checkOut !== undefined
          ? { check_out: b.checkOut }
          : {}),
  };

  const payload = {
    id,
    tipo: 'deals',
    properties,
  };

  const result = await makeClient.updateReserva<any>(payload);
  if (!result.ok) return res.status(502).json({ ok: false, error: result.error });

  return res.json({ ok: true, data: result.data });
});

// DELETE Deal -> Make DELETE expects { id, tipo:"deals" }
reservasRouter.delete('/:id', async (req, res) => {
  const id = z.coerce.string().min(1).parse(req.params.id);

  const payload = { id, tipo: 'deals' };

  const result = await makeClient.deleteReserva<any>(payload);
  if (!result.ok) return res.status(502).json({ ok: false, error: result.error });

  // normalizado (evita ok duplicado dentro de data)
  return res.json({
    ok: true,
    data: {
      tipo: result.data?.tipo ?? 'deals',
      id: String(result.data?.id ?? id),
      deleted: true,
    },
  });
});

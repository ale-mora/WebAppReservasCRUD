type MakeResponse<T> = { ok: boolean; data?: T; error?: string };

async function postJson<T>(url: string, body: unknown): Promise<MakeResponse<T>> {
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    const text = await resp.text();
    const data = text ? safeJsonParse(text) : {};

    if (!resp.ok) {
      return { ok: false, error: `Make returned ${resp.status}: ${text || resp.statusText}` };
    }

    return { ok: true, data: data as T };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Unknown error' };
  }
}

function safeJsonParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const makeClient = {
  createReserva: <T>(payload: unknown) =>
    postJson<T>(requireEnv('MAKE_CREATE_RESERVA_URL'), payload),
  listReservas: <T>(payload: unknown) => postJson<T>(requireEnv('MAKE_LIST_RESERVAS_URL'), payload),
  getReserva: <T>(payload: unknown) => postJson<T>(requireEnv('MAKE_GET_RESERVA_URL'), payload),
  updateReserva: <T>(payload: unknown) =>
    postJson<T>(requireEnv('MAKE_UPDATE_RESERVA_URL'), payload),
  deleteReserva: <T>(payload: unknown) =>
    postJson<T>(requireEnv('MAKE_DELETE_RESERVA_URL'), payload),
};

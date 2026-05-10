import api from '../api';

function normalizeEvento(ev = {}) {
  return {
    ...ev,
    id: ev.id,
    name: ev.name || ev.nomeEvento || '',
    nomeEvento: ev.nomeEvento || ev.name || '',
    tipo: ev.tipo || '',
    data: ev.data || '',
    horaInicio: ev.horaInicio || '',
    horaFim: ev.horaFim || '',
    totalCheckins: ev.totalCheckins ?? ev.totalParticipantes ?? 0,
    scoreValue: ev.scoreValue ?? ev.pontuacao ?? 0,
    pontuacao: ev.pontuacao ?? ev.scoreValue ?? 0,
    minimumStayMinutes: ev.minimumStayMinutes ?? ev.tempoMinimoMinutos ?? 0,
    tempoMinimoMinutos: ev.tempoMinimoMinutos ?? ev.minimumStayMinutes ?? 0,
  };
}

function normalizeList(payload) {
  const list = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];
  return list.map(normalizeEvento);
}

export const eventService = {
  async list(params = {}) {
    const response = await api.get('/api/eventos', { params });
    return normalizeList(response.data);
  },

  async get(id) {
    const response = await api.get(`/api/eventos/${id}`);
    return normalizeEvento(response.data);
  },

  async create(data) {
    const toTime = (t) => t && t.length === 5 ? t + ':00' : (t || '00:00:00');
    const payload = {
      nomeEvento: data.nomeEvento || data.name || data.nome,
      tipo: data.tipo,
      data: data.data,
      horaInicio: toTime(data.horaInicio),
      horaFim: toTime(data.horaFim),
      pontuacao: data.pontuacao ?? data.scoreValue ?? 0,
      tempoMinimoMinutos: data.tempoMinimoMinutos ?? data.minimumStayMinutos ?? data.minimumStayMinutes ?? 0,
    };
    const response = await api.post('/api/eventos', payload);
    return response.data;
  },

  async update(id, data) {
    const toTime = (t) => t && t.length === 5 ? t + ':00' : (t || '00:00:00');
    const payload = {
      nomeEvento: data.nomeEvento || data.name || data.nome,
      tipo: data.tipo,
      data: data.data,
      horaInicio: toTime(data.horaInicio),
      horaFim: toTime(data.horaFim),
      pontuacao: data.pontuacao ?? data.scoreValue ?? 0,
      tempoMinimoMinutos: data.tempoMinimoMinutos ?? data.minimumStayMinutos ?? data.minimumStayMinutes ?? 0,
    };
    const response = await api.put(`/api/eventos/${id}`, payload);
    return response.data;
  },

  async delete(id) {
    await api.delete(`/api/eventos/${id}`);
    return true;
  },

  async publish(id) {
    const response = await api.post(`/api/events/${id}/publish`);
    return response.data;
  },

  // reason é uma string simples enviada como JSON
  async cancel(id, reason) {
    const response = await api.post(`/api/events/${id}/cancel`, JSON.stringify(reason), {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  },

  async close(id) {
    const response = await api.post(`/api/events/${id}/close`);
    return response.data;
  },
};

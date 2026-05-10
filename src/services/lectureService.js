import api from '../api';

function normalizeLecture(item = {}) {
  return {
    ...item,
    id: item.id,
    eventId: item.eventId ?? item.eventoId,
    eventoId: item.eventoId ?? item.eventId,
    title: item.title || item.titulo || '',
    titulo: item.titulo || item.title || '',
    description: item.description || item.descricao || '',
    descricao: item.descricao || item.description || '',
    speaker: item.speaker || item.palestrante || '',
    palestrante: item.palestrante || item.speaker || '',
    room: item.room || item.sala || '',
    sala: item.sala || item.room || '',
    startTime: item.startTime || item.inicio || '',
    endTime: item.endTime || item.fim || '',
    minimumStayMinutes: item.minimumStayMinutes ?? item.tempoMinimoMinutos ?? 0,
    tempoMinimoMinutos: item.tempoMinimoMinutos ?? item.minimumStayMinutes ?? 0,
    scoreValue: item.scoreValue ?? item.pontuacao ?? 0,
    pontuacao: item.pontuacao ?? item.scoreValue ?? 0,
  };
}

export const lectureService = {
  async list(params = {}) {
    const response = await api.get('/api/palestras', Object.keys(params).length ? { params } : undefined);
    const lista = Array.isArray(response.data) ? response.data : response.data?.items || [];
    return lista.map(normalizeLecture);
  },

  async listByEvent(eventId) {
    const response = await api.get('/api/palestras', { params: { eventoId: eventId } });
    const lista = Array.isArray(response.data) ? response.data : response.data?.items || [];
    return lista.map(normalizeLecture);
  },

  async get(id) {
    const response = await api.get(`/api/palestras/${id}`);
    return normalizeLecture(response.data || {});
  },

  async create(data) {
    const payload = {
      eventoId: data.eventoId ?? data.eventId,
      titulo: data.titulo || data.title,
      descricao: data.descricao || data.description || null,
      palestrante: data.palestrante || data.speaker,
      sala: data.sala || data.room || null,
      inicio: data.inicio || data.startTime || null,
      fim: data.fim || data.endTime || null,
      tempoMinimoMinutos: data.tempoMinimoMinutos ?? data.minimumStayMinutes ?? 0,
      pontuacao: data.pontuacao ?? data.scoreValue ?? 0,
    };
    const response = await api.post('/api/palestras', payload);
    return normalizeLecture(response.data || {});
  },

  async update(id, data) {
    const payload = {
      eventoId: data.eventoId ?? data.eventId,
      titulo: data.titulo || data.title,
      descricao: data.descricao || data.description || null,
      palestrante: data.palestrante || data.speaker,
      sala: data.sala || data.room || null,
      inicio: data.inicio || data.startTime || null,
      fim: data.fim || data.endTime || null,
      tempoMinimoMinutos: data.tempoMinimoMinutos ?? data.minimumStayMinutes ?? 0,
      pontuacao: data.pontuacao ?? data.scoreValue ?? 0,
    };
    const response = await api.put(`/api/palestras/${id}`, payload);
    return normalizeLecture(response.data || {});
  },

  async delete(id) {
    await api.delete(`/api/palestras/${id}`);
    return true;
  },
};

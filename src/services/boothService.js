import api from '../api';

function normalizeBooth(item = {}) {
  return {
    ...item,
    id: item.id,
    eventId: item.eventId ?? item.eventoId,
    eventoId: item.eventoId ?? item.eventId,
    name: item.name || item.nome || item.identificacao || '',
    nome: item.nome || item.name || item.identificacao || '',
    location: item.location || item.localizacao || item.local || '',
    localizacao: item.localizacao || item.location || item.local || '',
    exhibitors: item.exhibitors || item.expositores || [],
    expositores: item.expositores || item.exhibitors || [],
  };
}

async function tryGet(path, params) {
  const response = await api.get(path, params ? { params } : undefined);
  return response.data;
}

async function tryMutate(method, path, data) {
  const response = await api[method](path, data);
  return response.data;
}

export const boothService = {
  async list(params = {}) {
    const attempts = [
      () => tryGet('/api/estandes', params),
      () => tryGet('/estandes', params),
    ];

    for (const attempt of attempts) {
      try {
        const data = await attempt();
        const lista = Array.isArray(data) ? data : data?.items || [];
        return lista.map(normalizeBooth);
      } catch {
        // tenta o proximo endpoint
      }
    }
    return [];
  },

  async listByEvent(eventId) {
    const attempts = [
      () => tryGet('/api/estandes', { eventoId: eventId }),
      () => tryGet('/estandes', { eventoId: eventId }),
    ];

    for (const attempt of attempts) {
      try {
        const data = await attempt();
        const lista = Array.isArray(data) ? data : data?.items || [];
        return lista.map(normalizeBooth);
      } catch {
        // tenta o proximo endpoint
      }
    }
    return [];
  },

  async get(id) {
    const attempts = [
      () => tryGet(`/api/estandes/${id}`),
      () => tryGet(`/estandes/${id}`),
    ];

    for (const attempt of attempts) {
      try {
        const data = await attempt();
        return normalizeBooth(data || {});
      } catch {
        // tenta o proximo endpoint
      }
    }
    throw new Error('Nao foi possivel buscar o estande.');
  },

  async create(data) {
    const payloadPt = {
      eventoId: data.eventoId ?? data.eventId,
      nome: data.nome || data.name,
      localizacao: data.localizacao || data.location,
    };
    const attempts = [
      () => tryMutate('post', '/api/estandes', payloadPt),
      () => tryMutate('post', '/estandes', payloadPt),
    ];

    for (const attempt of attempts) {
      try {
        const result = await attempt();
        return normalizeBooth(result || {});
      } catch {
        // tenta o proximo endpoint
      }
    }
    throw new Error('Nao foi possivel criar o estande.');
  },

  async update(id, data) {
    const payloadPt = {
      eventoId: data.eventoId ?? data.eventId,
      nome: data.nome || data.name,
      localizacao: data.localizacao || data.location,
    };
    const attempts = [
      () => tryMutate('put', `/estandes/${id}`, payloadPt),
      () => tryMutate('put', `/booths/${id}`, data),
      () => tryMutate('put', `/api/booths/${id}`, data),
    ];

    for (const attempt of attempts) {
      try {
        const result = await attempt();
        return normalizeBooth(result || {});
      } catch {
        // tenta o proximo endpoint
      }
    }
    throw new Error('Nao foi possivel atualizar o estande.');
  },

  async delete(id) {
    const attempts = [
      () => api.delete(`/estandes/${id}`),
      () => api.delete(`/booths/${id}`),
      () => api.delete(`/api/booths/${id}`),
    ];

    for (const attempt of attempts) {
      try {
        await attempt();
        return true;
      } catch {
        // tenta o proximo endpoint
      }
    }
    throw new Error('Nao foi possivel excluir o estande.');
  },

  async assignExhibitor(boothId, exhibitorId) {
    const attempts = [
      () => api.post(`/estandes/${boothId}/expositores`, { expositorId: exhibitorId }),
      () => api.post(`/booths/${boothId}/exhibitors`, JSON.stringify(exhibitorId), { headers: { 'Content-Type': 'application/json' } }),
      () => api.post(`/api/booths/${boothId}/exhibitors`, JSON.stringify(exhibitorId), { headers: { 'Content-Type': 'application/json' } }),
    ];

    for (const attempt of attempts) {
      try {
        const response = await attempt();
        return response.data;
      } catch {
        // tenta o proximo endpoint
      }
    }
    throw new Error('Nao foi possivel vincular expositor ao estande.');
  },

  async removeExhibitor(boothId, exhibitorId) {
    const attempts = [
      () => api.delete(`/estandes/${boothId}/expositores/${exhibitorId}`),
      () => api.delete(`/booths/${boothId}/exhibitors/${exhibitorId}`),
      () => api.delete(`/api/booths/${boothId}/exhibitors/${exhibitorId}`),
    ];

    for (const attempt of attempts) {
      try {
        await attempt();
        return true;
      } catch {
        // tenta o proximo endpoint
      }
    }
    throw new Error('Nao foi possivel remover expositor do estande.');
  },
};

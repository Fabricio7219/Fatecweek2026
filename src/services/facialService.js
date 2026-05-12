import api from '../api';

// Converte Blob para string base64 (sem prefixo data:...)
const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('Falha ao converter imagem.'));
    reader.readAsDataURL(blob);
  });

// Valida resolução mínima de 100x100 pixels conforme documentação
const validateDimensions = (blob) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < 100 || img.height < 100) {
        reject(new Error('Resolução mínima exigida: 100x100 pixels.'));
      } else {
        resolve();
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível carregar a imagem para validação.'));
    };
    img.src = url;
  });

async function tryGet(endpoints) {
  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await api.get(endpoint.url, { params: endpoint.params });
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Falha na consulta.');
}

async function tryPost(endpoints, body) {
  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await api.post(endpoint.url, body);
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Falha no registro.');
}

async function tryPatch(endpoints, body) {
  let lastError = null;
  for (const endpoint of endpoints) {
    try {
      const response = await api.patch(endpoint.url, body);
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error('Falha na atualizacao.');
}

export const facialService = {
  // POST /api/facial/identify — { image: "base64-encoded-image" }
  async identify(imageBlob) {
    await validateDimensions(imageBlob);
    const image = await blobToBase64(imageBlob);
    const response = await api.post('/api/facial/identify', { image });
    return response.data; // { success, userId, confidence, name }
  },

  // POST /api/facial/register — { userId, image: "base64-encoded-image" }
  async register(userId, imageBlob) {
    await validateDimensions(imageBlob);
    const image = await blobToBase64(imageBlob);
    const response = await api.post('/api/facial/register', { userId, image });
    return response.data; // { success, message, faceId }
  },

  // GET /api/facial/check-in
  async checkIn() {
    const response = await api.get('/api/facial/check-in');
    return response.data;
  },

  async lookupByRa(ra) {
    const cleanRa = String(ra || '').trim();
    return tryGet([
      { url: `/api/alunos/por-ra/${cleanRa}` },
    ]);
  },

  async registerEntry(payload) {
    const ra = String(payload?.ra || '').trim();
    const eventoId = Number(payload?.eventoId);
    if (!ra) throw new Error('RA nao informado para entrada.');
    if (!Number.isFinite(eventoId) || eventoId <= 0) throw new Error('Evento nao selecionado para entrada.');

    // Busca o id inteiro do aluno pelo RA
    const aluno = await tryGet([{ url: `/api/alunos/por-ra/${ra}` }]);
    if (!aluno?.id) throw new Error('Aluno não encontrado para este RA.');

    // Atualiza semestre e turno se preenchidos pelo mesário
    if (payload?.semestre || payload?.turno) {
      try {
        await api.patch(`/api/alunos/${aluno.id}/checkin-info`, {
          semestre: payload.semestre || null,
          turno:    payload.turno    || null,
        });
      } catch {
        // Não bloqueia o check-in se o PATCH falhar
      }
    }

    let fotoCheckin;
    if (payload?.photoBlob && payload?.photoLinked !== false) {
      fotoCheckin = await blobToBase64(payload.photoBlob);
    }

    const body = {
      alunoId: aluno.id,
      eventoId,
      faceValidado: payload?.refusedPhoto ? false : Boolean(payload?.photoLinked),
      tipoParticipacao: 'visitante',
      fotoCheckin,
    };

    return tryPost([
      { url: '/api/checkins/entrada' },
    ], body);
  },

  async registerExit(payload) {
    const ra = String(payload?.ra || '').trim();
    const eventoId = Number(payload?.eventoId);
    if (!ra) throw new Error('RA nao informado para saida.');
    if (!Number.isFinite(eventoId) || eventoId <= 0) throw new Error('Evento nao selecionado para saida.');

    const aluno = await tryGet([
      { url: `/api/alunos/por-ra/${ra}` },
    ]);
    if (!aluno?.id) throw new Error('Aluno não encontrado para este RA.');

    const checkins = await tryGet([
      { url: '/api/checkins', params: { alunoId: aluno.id, eventoId } },
    ]);
    const lista = Array.isArray(checkins) ? checkins : [];
    const ativo = lista.find(c => !c.horarioSaida);
    if (!ativo?.id) throw new Error('Nao foi encontrado check-in ativo para este RA neste evento.');

    return tryPatch([
      { url: `/api/checkins/${ativo.id}/saida` },
    ], {});
  },
};

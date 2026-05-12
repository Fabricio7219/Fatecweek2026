import api from '../api';

export const reportService = {
  async getAttendanceByEvent(eventId) {
    const response = await api.get(`/api/checkins/relatorio/${eventId}`);
    const payload = response.data;

    // payload: { Evento, Data, Total, Checkins: [...] }
    const checkins = payload?.checkins ?? payload?.Checkins ?? [];

    return checkins.map((c) => ({
      ...c,
      name: c.nomeAluno || c.NomeAluno || c.nome || '',
      userName: c.nomeAluno || c.NomeAluno || c.nome || '',
      ra: c.ra || c.Ra || '',
      course: c.curso || c.Curso || 'Não informado',
      semester: c.semestre || c.Semestre || '',
      shift: c.turno || c.Turno || '',
      stayMinutes: c.tempoMinutos ?? c.TempoMinutos ?? null,
      totalPoints: c.pontuacaoObtida ?? c.PontuacaoObtida ?? null,
      isValid: c.faceValidado ?? c.FaceValidado ?? false,
      entryTime: c.horarioEntrada || c.HorarioEntrada || null,
      exitTime: c.horarioSaida || c.HorarioSaida || null,
      tipoParticipacao: c.tipoParticipacao || c.TipoParticipacao || '',
    }));
  },

  async getSummary(eventId) {
    const response = await api.get(`/api/checkins/relatorio/${eventId}`);
    return response.data;
  },

  // GET /api/pontuacoes/consolidado?eventoIds=1,2,3
  // Retorna por aluno: pontos de cada evento + total
  async getConsolidated(eventIds) {
    const ids = Array.isArray(eventIds) ? eventIds.join(',') : eventIds;
    const response = await api.get(`/api/pontuacoes/consolidado`, { params: { eventoIds: ids } });
    return response.data; // { Eventos: [...], TotalAlunos, Alunos: [...] }
  },
};

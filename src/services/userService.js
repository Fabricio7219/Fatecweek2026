import api from '../api'; // Importa a configuração do Axios com Interceptors

export const userService = {
  // Lista todos os usuários; tenta filtrar por role=mesario se suportado
  async listMesarios() {
    try {
      const response = await api.get('/api/usuarios', { params: { role: 'mesario' } });
      const data = response.data;
      return Array.isArray(data) ? data : (data.items ?? data.data ?? []);
    } catch {
      return [];
    }
  },

  create: async (userData) => {
    const response = await api.post('/api/usuarios', {
      nome:     userData.name,
      email:    userData.email,
      userName: userData.userName,
      password: userData.password,
      cpf:      userData.cpf,
      role:     userData.role ?? 'mesario',
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/api/usuarios/${id}`);
    return response.data;
  },

  update: async (id, userData) => {
    const response = await api.put(`/api/usuarios/${id}`, userData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/api/usuarios/${id}`);
    return response.status === 204;
  }
};
import api from '../api';

export const authService = {
  async login(email, password) {
    const response = await api.post('/api/auth/login', { email, password });

    const token = response.data.accessToken;
    localStorage.setItem('@App:token', token);
    return response.data;
  },

  logout() {
    localStorage.removeItem('@App:token');
  },

  getToken() {
    return localStorage.getItem('@App:token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};

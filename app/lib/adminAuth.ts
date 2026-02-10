export const setAdminToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_token', token);
  }
};

export const getAdminToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('admin_token');
  }
  return null;
};

export const removeAdminToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
  }
};

export const setAdminUser = (user: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('admin_user', JSON.stringify(user));
  }
};

export const getAdminUser = () => {
  if (typeof window !== 'undefined') {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const isAdminAuthenticated = (): boolean => {
  return !!getAdminToken();
};

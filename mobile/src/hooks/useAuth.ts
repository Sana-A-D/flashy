import { useAuthStore } from '../features/auth/store/useAuthStore';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isHydrating = useAuthStore((state) => state.isHydrating);
  const loginStore = useAuthStore((state) => state.login);
  const registerStore = useAuthStore((state) => state.register);
  const logout = useAuthStore((state) => state.logout);

  const login = async (email: string, password: string) => {
    return loginStore({ email, password });
  };

  const register = async (name: string, email: string, password: string) => {
    return registerStore({ name, email, password });
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isHydrating,
    login,
    register,
    logout,
  };
}

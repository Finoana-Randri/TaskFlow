'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { ME_QUERY } from './graphql/queries';
import { LOGIN, REGISTER, LOGOUT } from './graphql/mutation';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const { data, loading, refetch } = useQuery(ME_QUERY, {
    fetchPolicy: 'network-only',
    errorPolicy: 'ignore',
  });

  const [loginMutation] = useMutation(LOGIN);
  const [registerMutation] = useMutation(REGISTER);
  const [logoutMutation] = useMutation(LOGOUT);

  useEffect(() => {
    if (data && data.me) {
      setUser(data.me);
    } else if (!loading) {
      setUser(null);
    }
  }, [data, loading]);

  const login = async (email: string, password: string) => {
    const res = await loginMutation({
      variables: { email, password },
    });
    if (res.data?.login?.user) {
      setUser(res.data.login.user);
      await refetch();
    }
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await registerMutation({
      variables: { name, email, password },
    });
    if (res.data?.register?.user) {
      setUser(res.data.register.user);
      await refetch();
    }
  };

  const logout = async () => {
    await logoutMutation();
    setUser(null);
    await refetch();
    router.push('/login');
  };

  const refetchUser = async () => {
    const res = await refetch();
    if (res.data?.me) {
      setUser(res.data.me);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

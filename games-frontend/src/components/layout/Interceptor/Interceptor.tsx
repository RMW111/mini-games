import { useNavigate } from "react-router-dom";
import { type ReactNode, useLayoutEffect } from "react";
import { apiClient } from "src/api/apiClient.ts";

interface Props {
  children: ReactNode;
}

export const Interceptor = ({ children }: Props) => {
  const navigate = useNavigate();

  useLayoutEffect(() => {
    const responseInterceptor = apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          navigate("/login");
        }
        return Promise.reject(error);
      }
    );

    return () => apiClient.interceptors.response.eject(responseInterceptor);
  }, [navigate]);

  return children;
};

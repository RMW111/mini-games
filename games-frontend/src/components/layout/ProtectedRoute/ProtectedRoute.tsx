import type { ReactNode } from "react";
import { useAtomValue } from "jotai";
import { authAtom } from "src/store/auth.ts";
import { Navigate, useLocation } from "react-router-dom";
import { Loader } from "src/components/ui/Loader/Loader.tsx";

interface Props {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: Props) => {
  const { isLoggedIn, pending } = useAtomValue(authAtom);
  const location = useLocation();

  if (pending) {
    return <Loader />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

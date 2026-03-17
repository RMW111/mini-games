import type { AxiosError } from "axios";

type BackendErrors = Record<string, string[]>;

interface BackendErrorRes {
  errors: BackendErrors;
}

export const extractBackendErrors = (error: AxiosError<BackendErrorRes>) => {
  return error.response?.data.errors || {};
};

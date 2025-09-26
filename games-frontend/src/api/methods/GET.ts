import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { apiClient } from "src/api/apiClient";

export type ApiGetFn<Res> = (options?: AxiosRequestConfig) => Promise<Res>;
export type ApiGetFnFull<Res> = (options?: AxiosRequestConfig) => Promise<AxiosResponse<Res>>;

export function GET<Res>(path: string, fullAxiosResponse: false): ApiGetFn<Res>;
export function GET<Res>(path: string, fullAxiosResponse: true): ApiGetFnFull<Res>;
export function GET<Res>(path: string, fullAxiosResponse?: undefined): ApiGetFn<Res>;
export function GET(path: string, fullAxiosResponse = false) {
  return (options?: AxiosRequestConfig) => {
    return apiClient
      .get<Response>(path, options)
      .then((res) => (fullAxiosResponse ? res : res.data));
  };
}

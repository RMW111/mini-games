import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { apiClient } from "src/api/apiClient.ts";

export type ApiPostFn<Body, Res> = (body?: Body, options?: AxiosRequestConfig) => Promise<Res>;
export type ApiPostFnFull<Body, Res> = (
  body?: Body,
  options?: AxiosRequestConfig
) => Promise<AxiosResponse<Res>>;

export function POST<Body = void, Res = void>(
  path: string,
  fullResponse: false
): ApiPostFn<Body, Res>;
export function POST<Body = void, Res = void>(
  path: string,
  fullResponse: true
): ApiPostFnFull<Body, Res>;
export function POST<Body = void, Res = void>(
  path: string,
  fullResponse?: undefined
): ApiPostFn<Body, Res>;
export function POST<Body = void>(path: string, fullResponse = false) {
  return (body: Body, options?: AxiosRequestConfig) => {
    return apiClient
      .post<Response>(path, body, options)
      .then((res) => (fullResponse ? res : res.data));
  };
}

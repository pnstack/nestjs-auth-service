export interface ResponsePayload<T> {
  statusCode: number;
  message: string;
  data: T;
  path?: string;
  timestamp?: string;
}

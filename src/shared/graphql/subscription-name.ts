export const SubEventName = {
  hello: 'hello',
  sse: 'sse',
} as const;
export type SubEventNameType = keyof typeof SubEventName & string;

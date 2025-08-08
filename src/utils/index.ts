// Define your utils here.
export * from './time';
export * from './tool';

// Mock cache decorator for now
export function cache(ttl: number) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    return descriptor;
  };
}

import { createContext } from 'react';

// Only view preferences belong here. Server records remain in the request hooks.
export const ListMemory = createContext<Map<string, unknown> | null>(null);

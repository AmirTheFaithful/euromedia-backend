import { LRUCache } from "lru-cache";

// Caching mechanism configuration:
export const cache = new LRUCache<string, any>({
  max: 100,
  ttl: 1000 * 60 * 5,
});

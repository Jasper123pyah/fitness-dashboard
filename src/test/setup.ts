// Vitest draait in Node; IndexedDB bestaat daar niet. fake-indexeddb geeft Dexie
// een echte IndexedDB-implementatie zodat de databaselogica getest kan worden.
import "fake-indexeddb/auto";

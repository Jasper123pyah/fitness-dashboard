/**
 * Aanvullingen voor oudere iOS-versies. Dit bestand wordt als eerste
 * geïmporteerd, vóór React en de componentbibliotheek.
 *
 * Object.hasOwn bestaat pas sinds iOS 15.4. @base-ui/react roept het aan
 * tijdens het tekenen van keuzelijsten; zonder deze aanvulling crasht het
 * scherm met die lijsten (bijvoorbeeld Instellingen) tot een lege pagina.
 */
if (typeof Object.hasOwn !== "function") {
  Object.defineProperty(Object, "hasOwn", {
    value: (object: object, key: PropertyKey) =>
      Object.prototype.hasOwnProperty.call(Object(object), key),
    configurable: true,
    writable: true,
  });
}

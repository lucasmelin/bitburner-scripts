/** @param {NS} ns **/

export function spider(ns, server = "home") {
  // Crawl all servers that are reachable from a given server.
  const servers = [];
  function crawl(server) {
    const reachableServers = ns.scan(server);
    reachableServers.forEach((server) => {
      if (!servers.includes(server)) {
        servers.push(server);
        crawl(server);
      }
    });
  }
  crawl(server);
  return servers;
}

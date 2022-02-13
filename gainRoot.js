/** @param {NS} ns **/

export function gainRootAccess(ns, server) {
  // Run all programs to open ports that we have access to.
  if (ns.fileExists("BruteSSH.exe")) {
    ns.brutessh(server);
  }
  if (ns.fileExists("FTPCrack.exe")) {
    ns.ftpcrack(server);
  }
  if (ns.fileExists("relaySMTP.exe")) {
    ns.relaysmtp(server);
  }
  if (ns.fileExists("HTTPWorm.exe")) {
    ns.httpworm(server);
  }
  if (ns.fileExists("SQLInject.exe")) {
    ns.sqlinject(server);
  }
  // If we have enough ports open, acquire root.
  const serverData = ns.getServer(server);
  if (ns.getServerNumPortsRequired(server) <= serverData.openPortCount) {
    ns.nuke(server);
  }
}

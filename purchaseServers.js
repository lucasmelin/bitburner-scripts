/** @param {NS} ns **/

function calcBestRam(ns, numServers) {
  const ramOptions = [
    2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16_384, 32_768,
    65_536, 131_072, 262_144, 524_288, 1_048_576,
  ];

  const bestAffordableRam =
    ramOptions.filter(
      (ram) =>
        numServers * ns.getPurchasedServerCost(ram) <=
        ns.getServerMoneyAvailable("home")
    ).length - 1;

  return ramOptions[bestAffordableRam];
}

function deletePurchasedServers(ns, numServers, newRam) {
  const pservs = ns.getPurchasedServers();

  const pservDefinitions = pservs.map((server) => ({
    name: server,
    ram: ns.getServerMaxRam(server),
  }));

  // Sort servers according to RAM (ascending).
  pservDefinitions.sort((a, b) => a.ram - b.ram);

  const pservNames = [];
  pservDefinitions.forEach((server, index) => {
    if (ns.getServerMaxRam(server.name) >= newRam) {
      return;
    }
    if (index < numServers) {
      ns.killall(server.name);
      ns.deleteServer(server.name);
      return pservNames.push(server.name);
    }
  });

  return pservNames;
}

function purchaseServers(ns, maxServers, ram) {
  while (ns.getPurchasedServers().length < maxServers) {
    if (ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(ram)) {
      const host = `pserv-${ns.getPurchasedServers().length}`;
      ns.purchaseServer(host, ram);
    } else {
      return;
    }
  }
}

export async function main(ns, numServers = ns.args[0]) {
  const ram = calcBestRam(ns, numServers);
  const totalServers = ns.getPurchasedServers().length + numServers;
  const maxServers =
    ns.getPurchasedServerLimit() < totalServers
      ? ns.getPurchasedServerLimit()
      : totalServers;

  if (!(totalServers > ns.getPurchasedServerLimit())) {
    purchaseServers(ns, maxServers, ram);
  } else if (
    !(await ns.prompt(
      `You do not have enough room for ${numServers} servers. Do you want to delete existing servers with the smallest RAM to make room?`
    ))
  ) {
    // Chose not to delete servers.
    return;
  } else {
    const pservNames = deletePurchasedServers(
      ns,
      totalServers - ns.getPurchasedServerLimit(),
      ram
    );
    pservNames.forEach((name) => {
      ns.purchaseServer(name, ram);
    });
    purchaseServers(ns, maxServers, ram);
  }
}

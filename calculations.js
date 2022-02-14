/** @param {NS} ns **/

import { gainRootAccess } from "gainRoot.js";

export function calculateMostProfitableTarget(ns, targets) {
  targets
    .filter((server) => {
      if (server == "home") {
        // Skip home server.
        return false;
      }
      if (ns.getPurchasedServers().includes(server)) {
        // Skip purchased servers.
        return false;
      }
      return true;
    })
    .map((server) => {
      if (!ns.hasRootAccess(server)) {
        gainRootAccess(ns, server);
      }
    });
  const candidates = targets
    .filter((server) => {
      if (server == "home") {
        // Skip home server.
        return false;
      }
      if (ns.getPurchasedServers().includes(server)) {
        // Skip purchased servers.
        return false;
      }
      return true;
    })
    .filter((server) => {
      return ns.hasRootAccess(server);
    })
    .filter((server) => {
      return ns.getServerRequiredHackingLevel(server) <= ns.getHackingLevel();
    });

  const serverMoneyMaxes = candidates.map((target) =>
    ns.getServerMaxMoney(target)
  );

  const bestIndex = serverMoneyMaxes.reduce(
    (bestIndexSoFar, currentlyTestedValue, currentlyTestedIndex, array) =>
      currentlyTestedValue > array[bestIndexSoFar]
        ? currentlyTestedIndex
        : bestIndexSoFar,
    0
  );

  return candidates[bestIndex];
}

export function calculateHackThreads(ns, target) {
  return ns.hackAnalyzeThreads(target, ns.getServerMoneyAvailable(target) / 2);
}
export function calculateSecondIncrease(ns, hack_threads, grow_threads) {
  return (
    ns.hackAnalyzeSecurity(hack_threads) +
    ns.growthAnalyzeSecurity(grow_threads)
  );
}
export function calculateWeakenThreads(ns, second_increase) {
  let weakenThreads = 1;
  const factor = 1.1;
  while (ns.weakenAnalyze(weakenThreads) < second_increase * factor) {
    weakenThreads++;
  }
  return weakenThreads;
}
export function calculateRequiredRam(
  ns,
  hackThreads,
  growThreads,
  weakenThreads
) {
  const server = "home";
  return (
    hackThreads * ns.getScriptRam("hackTarget.js", server) +
    growThreads * ns.getScriptRam("growTarget.js", server) +
    weakenThreads * ns.getScriptRam("weakenTarget.js", server)
  );
}
export function calculateInitialGrowth(ns, target) {
  const factor = 0.5;
  return (
    (factor * ns.getServerMaxMoney(target)) / ns.getServerMoneyAvailable(target)
  );
}
export function calculateInitialWeaken(ns, target, growth_rate) {
  let weakenRate = 1;
  while (
    ns.weakenAnalyze(weakenRate) <
    ns.getServerSecurityLevel(target) +
      ns.growthAnalyzeSecurity(growth_rate) -
      ns.getServerMinSecurityLevel(target)
  ) {
    weakenRate++;
  }
  return weakenRate;
}

export function calculateStagingRam(ns, growth_rate, weaken_rate) {
  const server = "home";
  return (
    ns.getScriptRam("growTarget.js", server) * growth_rate +
    ns.getScriptRam("weakenTarget.js", server) * weaken_rate
  );
}

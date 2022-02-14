/** @param {NS} ns **/

import { spider } from "spider.js";
import {
  calculateMostProfitableTarget,
  calculateHackThreads,
  calculateSecondIncrease,
  calculateWeakenThreads,
  calculateRequiredRam,
  calculateInitialGrowth,
  calculateInitialWeaken,
  calculateStagingRam,
} from "calculations.js";
import { executeCycle } from "executeCycle.js";

export async function main(ns) {
  // Infinite loop
  while (true) {
    const allServers = spider(ns, "home");

    const hackTarget = calculateMostProfitableTarget(ns, allServers);
    const growThreads = ns.growthAnalyze(hackTarget, 2);
    const hackThreads = calculateHackThreads(ns, hackTarget);
    const secIncrease = calculateSecondIncrease(ns, hackThreads, growThreads);
    const weakenThreads = calculateWeakenThreads(ns, secIncrease);
    const requiredRam = calculateRequiredRam(
      ns,
      hackThreads,
      growThreads,
      weakenThreads
    );

    const purchasedServers = ns.getPurchasedServers();
    // Add our home server to the list of purchased servers.
    purchasedServers.push("home");

    const hostServers = purchasedServers.filter(function (server) {
      return ns.getServerMaxRam(server) >= requiredRam;
    });

    if (!hostServers) {
      ns.print(
        `No servers with required amount of RAM. Required RAM is ${requiredRam}`
      );
      // Error code return
      return 1;
    }

    const initialGrowthRate = calculateInitialGrowth(ns, hackTarget);
    const growthRate =
      initialGrowthRate > 1
        ? ns.growthAnalyze(hackTarget, initialGrowthRate)
        : 0;

    const weakenRate = calculateInitialWeaken(ns, hackTarget, growthRate);

    ns.print(`Weaken: ${weakenRate}\nGrowth: ${growthRate}`);

    const stagingRam = calculateStagingRam(ns, growthRate, weakenRate);
    const stagingServer = hostServers.find(
      (server) =>
        ns.getServerMaxRam(server) - ns.getServerUsedRam(server) >= stagingRam
    );

    const prep = stagingServer == null ? 0 : 1;
    ns.print(`Staging: ${stagingServer} ${prep}`);

    if (prep) {
      if (growthRate > 1) {
        await ns.scp("growTarget.js", stagingServer);
        await ns.scp("hackTarget.js", stagingServer);
        await ns.scp("weakenTarget.js", stagingServer);
        ns.exec(
          "growTarget.js",
          stagingServer,
          growthRate,
          growthRate,
          0,
          hackTarget
        );
        ns.exec(
          "weakenTarget.js",
          stagingServer,
          weakenRate,
          weakenRate,
          hackTarget
        );
      } else if (
        ns.getServerSecurityLevel(hackTarget) >
        ns.getServerMinSecurityLevel(hackTarget) * 1.5
      ) {
        ns.exec(
          "weakenTarget.js",
          stagingServer,
          weakenRate,
          weakenRate,
          hackTarget
        );
      }
      await ns.sleep(ns.getWeakenTime(hackTarget) + 1000);
    }

    let initialTime = Date.now();
    let currentServer = 0;

    for (let i = 0; i < hostServers.length; i++) {
      const weakenTime = ns.getWeakenTime(hackTarget);
      const growTime = ns.getGrowTime(hackTarget);
      const hackTime = ns.getHackTime(hackTarget);
      const growDelay = weakenTime - growTime - 2;
      const hackDelay = weakenTime - hackTime - 1;

      const server = hostServers[i];
      let possibleCycleCount = Math.floor(
        (ns.getServerMaxRam(server) - ns.getServerUsedRam(server)) / requiredRam
      );

      await ns.scp("growTarget.js", server);
      await ns.scp("hackTarget.js", server);
      await ns.scp("weakenTarget.js", server);
      // Execute cycles, synchronizing on the amount of time it takes to hack
      // so that we avoid completely draining the target server.
      for (possibleCycleCount; possibleCycleCount > 0; possibleCycleCount--) {
        if (Date.now() >= initialTime + ns.getHackTime(hackTarget)) {
          while (
            ns.getServerMaxRam(hostServers[currentServer]) -
              ns.getServerUsedRam(hostServers[currentServer]) <
            ns.getScriptRam("weakenTarget", "home") * weakenThreads
          ) {
            currentServer++;
            if (currentServer == hostServers.length) {
              currentServer = 0;
              await ns.sleep(10_000);
            }
          }
          ns.exec(
            "weakenTarget.js",
            hostServers[currentServer],
            weakenThreads,
            weakenThreads,
            hackTarget
          );
          await ns.sleep(weakenTime + 20);
          i = 0;
          initialTime = Date.now();
          break;
        }

        await executeCycle(
          ns,
          server,
          hackTarget,
          hackThreads,
          hackDelay,
          growThreads,
          growDelay,
          weakenThreads,
          possibleCycleCount
        );
      }

      await ns.sleep(5);
    }

    await ns.sleep(10);
  }
}

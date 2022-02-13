/** @param {NS} ns **/

export async function executeCycle(
  ns,
  hostServer,
  hackTarget,
  hackThreads,
  hackDelay,
  growThreads,
  growDelay,
  weakenThreads,
  possibleCycleCount
) {
  const afterCycleSleep = 3;
  ns.exec(
    "weakenTarget.js",
    hostServer,
    weakenThreads,
    weakenThreads,
    hackTarget,
    possibleCycleCount
  );
  ns.exec(
    "growTarget.js",
    hostServer,
    growThreads,
    growThreads,
    growDelay,
    hackTarget,
    possibleCycleCount
  );
  ns.exec(
    "hackTarget.js",
    hostServer,
    hackThreads,
    hackThreads,
    hackDelay,
    hackTarget,
    possibleCycleCount
  );
  await ns.sleep(afterCycleSleep);
}

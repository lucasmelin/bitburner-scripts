/** @param {NS} ns **/

export async function main(
  ns,
  threads = ns.args[0],
  time = ns.args[1],
  target = ns.args[2]
) {
  // Hack a specific target, sleeping beforehand.
  await ns.sleep(time);
  await ns.hack(target, { threads });
}

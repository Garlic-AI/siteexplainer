import dns from "node:dns/promises";
import { isPrivateHost } from "./url";

/**
 * SSRF guard. Hostname string-checks aren't enough: `127.0.0.1.nip.io` and
 * `localtest.me` are public names that resolve to private IPs. So before we fetch a
 * host we resolve it and reject any answer that lands in a loopback / private /
 * link-local / unique-local / cloud-metadata range. We re-run this on every redirect
 * hop (see fetch-site.ts) so a public URL can't bounce us to internal infra.
 *
 * Residual risk: DNS rebinding between this lookup and the actual connection. Pinning
 * the resolved IP into the socket isn't possible with `fetch`, so this is best-effort
 * — acceptable for a public summarizer that only ever issues GETs.
 */
export async function assertPublicHost(host: string): Promise<void> {
  const clean = host.toLowerCase().replace(/^www\./, "");
  if (!clean.includes(".") || isPrivateHost(clean)) {
    throw new BlockedHostError(host);
  }

  let answers: { address: string }[];
  try {
    answers = await dns.lookup(clean, { all: true });
  } catch {
    throw new BlockedHostError(host, "We couldn't resolve that site.");
  }

  if (answers.length === 0 || answers.some((a) => isPrivateIp(a.address))) {
    throw new BlockedHostError(host);
  }
}

export class BlockedHostError extends Error {
  constructor(host: string, message = `Refusing to fetch a non-public host (${host}).`) {
    super(message);
    this.name = "BlockedHostError";
  }
}

/** True for loopback / private / link-local / ULA / CGNAT / metadata addresses. */
export function isPrivateIp(ip: string): boolean {
  // Normalize IPv4-mapped IPv6 (e.g. "::ffff:127.0.0.1").
  const mapped = ip.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  const addr = mapped ? mapped[1] : ip;

  if (addr.includes(".")) return isPrivateIpv4(addr);
  return isPrivateIpv6(addr);
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) {
    return true; // malformed -> treat as unsafe
  }
  const [a, b] = parts;
  if (a === 0 || a === 10 || a === 127) return true; // this-host, private, loopback
  if (a === 169 && b === 254) return true; // link-local + cloud metadata (169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return true; // private
  if (a === 192 && b === 168) return true; // private
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const addr = ip.toLowerCase().split("%")[0]; // drop zone id
  if (addr === "::1" || addr === "::") return true; // loopback / unspecified
  if (addr.startsWith("fe80")) return true; // link-local
  if (addr.startsWith("fc") || addr.startsWith("fd")) return true; // unique-local (fc00::/7)
  return false;
}

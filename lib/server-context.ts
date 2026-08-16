import { cookies } from "next/headers";
import { getCountry, type CountryConfig } from "./country";

export type ServerContext = {
  locale: string;
  config: CountryConfig;
  deliverTo: { region: string; subRegion: string };
};

/**
 * Resolves the country config and the buyer's delivery area for a server
 * render. Deliver-to comes from a cookie so estimates are right before login.
 */
export async function getServerContext(locale: string): Promise<ServerContext> {
  const config = getCountry(locale.split("-")[1] ?? "NG");
  const store = await cookies();
  const raw = store.get("fm_deliver_to")?.value;
  const [region, subRegion] = raw
    ? decodeURIComponent(raw).split("|")
    : [config.defaultRegion, config.defaultSubRegion];

  return {
    locale,
    config,
    deliverTo: {
      region: region || config.defaultRegion,
      subRegion: subRegion || config.defaultSubRegion,
    },
  };
}

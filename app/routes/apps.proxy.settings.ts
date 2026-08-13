import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { vatDefaults } from "../vat-settings.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const shopDomain = url.searchParams.get("shop");

  if (!shopDomain) {
    return Response.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const shop = await db.shop.findUnique({ where: { shopDomain } });
  const settings = shop ? await db.vatSettings.findUnique({ where: { shopId: shop.id } }) : null;
  const [rates, translations] = shop ? await Promise.all([
    db.vatMarketRate.findMany({ where: { shopId: shop.id } }),
    db.vatTranslation.findMany({ where: { shopId: shop.id } }),
  ]) : [[], []];

  return Response.json({ version: settings?.settingsVersion ?? 1, settings: settings ?? vatDefaults, rates, translations });
}

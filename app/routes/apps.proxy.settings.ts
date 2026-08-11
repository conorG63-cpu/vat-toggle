import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const shopDomain = url.searchParams.get("shop");

  if (!shopDomain) {
    return Response.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  const shop = await db.shop.findUnique({ where: { shopDomain } });
  const settings = shop
    ? await db.vatSettings.findUnique({ where: { shopId: shop.id } })
    : null;

  return Response.json(settings ?? {
    defaultDisplayMode: "inclusive",
    defaultVatRate: 20,
    showPopupOnFirstVisit: true,
    togglePosition: "header",
    inclusiveLabel: "Inc. VAT",
    exclusiveLabel: "Ex. VAT",
    popupTitle: "How would you like to see prices?",
    popupMessage: "Choose your preferred pricing display",
    enableB2BMode: false,
    b2bCustomerTags: "b2b,wholesale,trade",
    b2bDefaultMode: "exclusive",
    toggleStyle: "pill",
    primaryColor: "#000000",
    backgroundColor: "#f4f4f4",
    activeTextColor: "#ffffff",
    borderRadius: "medium",
    showVatIndicator: true,
    indicatorPosition: "after",
    animationStyle: "smooth",
  });
}

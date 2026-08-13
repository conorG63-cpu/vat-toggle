import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function action({ request }: ActionFunctionArgs) {
  const { shop, payload } = await authenticate.webhook(request); const customerId = (payload.customer?.id || payload.customer_id) as string | number | undefined;
  const record = await db.shop.findUnique({ where: { shopDomain: shop } });
  if (record && customerId) await db.vatValidation.deleteMany({ where: { shopId: record.id, customerId: `gid://shopify/Customer/${customerId}` } });
  return new Response();
}

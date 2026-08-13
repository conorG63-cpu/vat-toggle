import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getVatExemptionSettings } from "../vat-exemption.server";

const formats: Record<string, RegExp> = { AT: /^U\d{8}$/, BE: /^0?\d{9,10}$/, DE: /^\d{9}$/, DK: /^\d{8}$/, ES: /^[A-Z0-9]\d{7}[A-Z0-9]$/, FR: /^[A-Z0-9]{2}\d{9}$/, IE: /^\d[A-Z0-9+*]\d{5}[A-Z]$/, IT: /^\d{11}$/, NL: /^\d{9}B\d{2}$/, SE: /^\d{12}$/, PL: /^\d{10}$/ };
const reply = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function action({ request }: ActionFunctionArgs) {
  const context = await authenticate.public.appProxy(request);
  const url = new URL(request.url); const shopDomain = url.searchParams.get("shop") || ""; const customerNumber = url.searchParams.get("logged_in_customer_id") || "";
  const body = await request.json().catch(() => null) as { countryCode?: string; vatNumber?: string } | null;
  const countryCode = body?.countryCode?.trim().toUpperCase() || ""; const vatNumber = body?.vatNumber?.replace(/\s+/g, "").toUpperCase().replace(new RegExp(`^${countryCode}`), "") || "";
  if (!shopDomain || !customerNumber) return reply({ error: "Please log in before validating a VAT number." }, 401);
  if (!countryCode || !vatNumber) return reply({ error: "Enter a country and VAT number." }, 400);
  const { shop, settings } = await getVatExemptionSettings(shopDomain); const allowed = settings.allowedCountries.split(",").map((code) => code.trim().toUpperCase());
  await db.vatValidation.deleteMany({ where: { shopId: shop.id, checkedAt: { lt: new Date(Date.now() - settings.retentionDays * 86_400_000) } } });
  if (!settings.enabled) return reply({ error: "VAT exemption is not enabled for this store." }, 403);
  if (countryCode === settings.homeCountry || !allowed.includes(countryCode)) return reply({ error: "VAT exemption is not available for the selected country." }, 400);
  if (formats[countryCode] && !formats[countryCode].test(vatNumber)) return reply({ error: `That VAT number does not match the expected ${countryCode} format.` }, 400);
  const admin = "admin" in context ? context.admin : undefined; const customerId = `gid://shopify/Customer/${customerNumber}`;
  if (!admin) return reply({ error: "The store session is unavailable. Please try again." }, 503);
  const customerJson: any = await (await admin.graphql(`query PriceSwitchCustomer($id: ID!) { customer(id: $id) { id email } }`, { variables: { id: customerId } })).json(); const customer = customerJson.data?.customer;
  if (!customer?.email) return reply({ error: "We could not verify your customer account. Please log out and log in again." }, 401);
  const email = customer.email.toLowerCase(); if (await db.vatValidation.count({ where: { shopId: shop.id, email, checkedAt: { gte: new Date(Date.now() - 60_000) } } }) >= 5) return reply({ error: "Please wait a minute before trying again." }, 429);
  let vies: any;
  try { const response = await fetch("https://ec.europa.eu/taxation_customs/vies/rest-api/check-vat-number", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ countryCode, vatNumber }), signal: AbortSignal.timeout(12_000) }); if (!response.ok) throw new Error("VIES unavailable"); vies = await response.json(); } catch { await db.vatValidation.create({ data: { shopId: shop.id, email, countryCode, vatNumber, valid: false, status: "service_unavailable" } }); return reply({ error: "The EU VAT service is temporarily unavailable. Please try again later." }, 503); }
  if (!vies.valid) { await db.vatValidation.create({ data: { shopId: shop.id, email, countryCode, vatNumber, valid: false, status: "invalid" } }); return reply({ error: "This VAT number could not be validated." }, 400); }
  try {
    const tagsJson: any = await (await admin.graphql(`mutation PriceSwitchTag($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { userErrors { message } } }`, { variables: { id: customerId, tags: [settings.customerTag] } })).json(); if (tagsJson.data?.tagsAdd?.userErrors?.length) throw new Error(tagsJson.data.tagsAdd.userErrors[0].message);
    const metafieldsJson: any = await (await admin.graphql(`mutation PriceSwitchVatMetafields($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { message } } }`, { variables: { metafields: [{ ownerId: customerId, namespace: "tax", key: "vat_number", type: "single_line_text_field", value: `${countryCode}${vatNumber}` }, { ownerId: customerId, namespace: "tax", key: "vat_valid", type: "boolean", value: "true" }, { ownerId: customerId, namespace: "tax", key: "vat_checked_at", type: "date_time", value: new Date().toISOString() }] } })).json(); if (metafieldsJson.data?.metafieldsSet?.userErrors?.length) throw new Error(metafieldsJson.data.metafieldsSet.userErrors[0].message);
    // Consequential tax status is deliberately the final remote write.
    const updateJson: any = await (await admin.graphql(`mutation PriceSwitchExemption($input: CustomerInput!) { customerUpdate(input: $input) { customer { id } userErrors { message } } }`, { variables: { input: { id: customerId, taxExempt: true } } })).json(); if (updateJson.data?.customerUpdate?.userErrors?.length) throw new Error(updateJson.data.customerUpdate.userErrors[0].message);
    await db.vatValidation.create({ data: { shopId: shop.id, email, countryCode, vatNumber, valid: true, status: "validated", companyName: vies.name || null, customerId } }); return reply({ valid: true, companyName: vies.name || null });
  } catch { await db.vatValidation.create({ data: { shopId: shop.id, email, countryCode, vatNumber, valid: false, status: "shopify_update_failed", customerId } }); return reply({ error: "VAT was validated, but we could not activate the exemption. Please try again or contact the store." }, 502); }
}

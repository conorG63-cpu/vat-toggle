import type { Prisma } from "@prisma/client";
import db from "./db.server";
import { getVatSettings } from "./vat-settings.server";

export const euCountries = ["AT", "BE", "BG", "HR", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"];

export async function getVatExemptionSettings(shopDomain: string) {
  const { shop } = await getVatSettings(shopDomain);
  const settings = await db.vatExemptionSettings.upsert({ where: { shopId: shop.id }, create: { shopId: shop.id }, update: {} });
  return { shop, settings };
}

export function exemptionSettingsFromForm(form: FormData): Prisma.VatExemptionSettingsUpdateInput {
  const values: Prisma.VatExemptionSettingsUpdateInput = {};
  for (const field of ["homeCountry", "allowedCountries", "customerTag", "widgetMode", "title", "description", "buttonLabel"] as const) if (form.has(field)) values[field] = String(form.get(field) || "");
  for (const field of ["enabled", "showCartBlock", "showDrawer", "showExpressWarning"] as const) if (form.has(`${field}Present`)) values[field] = form.get(field) === "on";
  if (form.has("retentionDays")) { const value = Number(form.get("retentionDays")); if (Number.isInteger(value) && value >= 30 && value <= 730) values.retentionDays = value; }
  return values;
}

export async function saveVatExemptionSettings(shopDomain: string, values: Prisma.VatExemptionSettingsUpdateInput) {
  const { shop } = await getVatExemptionSettings(shopDomain);
  return db.vatExemptionSettings.update({ where: { shopId: shop.id }, data: values });
}

export async function syncExemptionSettings(admin: any, settings: any) {
  const installation = await (await admin.graphql(`query { currentAppInstallation { id } }`)).json();
  const ownerId = installation.data?.currentAppInstallation?.id;
  if (!ownerId) throw new Error("Could not find the Shopify app installation");
  const value = JSON.stringify({ enabled: settings.enabled, homeCountry: settings.homeCountry, allowedCountries: settings.allowedCountries, customerTag: settings.customerTag, widgetMode: settings.widgetMode, showCartBlock: settings.showCartBlock, showDrawer: settings.showDrawer, showExpressWarning: settings.showExpressWarning, title: settings.title, description: settings.description, buttonLabel: settings.buttonLabel });
  const response = await admin.graphql(`mutation SetExemptionSettings($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { message } } }`, { variables: { metafields: [{ ownerId, namespace: "vat_toggle", key: "exemption", type: "json", value }] } });
  const json = await response.json(); const errors = json.data?.metafieldsSet?.userErrors ?? []; if (errors.length) throw new Error(errors.map((error: { message: string }) => error.message).join(", "));
}

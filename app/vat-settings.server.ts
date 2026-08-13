import type { Prisma } from "@prisma/client";
import db from "./db.server";

export const vatDefaults = {
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
};

export async function getVatSettings(shopDomain: string) {
  const shop = await db.shop.upsert({ where: { shopDomain }, create: { shopDomain }, update: {} });
  const settings = await db.vatSettings.upsert({
    where: { shopId: shop.id },
    create: { shopId: shop.id, ...vatDefaults },
    update: {},
  });
  return { shop, settings };
}

export function settingsFromForm(form: FormData): Prisma.VatSettingsUpdateInput {
  const values: Prisma.VatSettingsUpdateInput = {};
  const stringFields = [
    "defaultDisplayMode", "togglePosition", "inclusiveLabel", "exclusiveLabel", "popupTitle",
    "popupMessage", "b2bCustomerTags", "b2bDefaultMode", "toggleStyle", "primaryColor",
    "backgroundColor", "activeTextColor", "borderRadius", "indicatorPosition", "animationStyle",
  ] as const;

  for (const field of stringFields) {
    if (form.has(field)) values[field] = String(form.get(field) || "");
  }

  if (form.has("defaultVatRate")) {
    const rate = Number(form.get("defaultVatRate"));
    if (Number.isFinite(rate) && rate >= 0 && rate <= 100) values.defaultVatRate = rate;
  }

  for (const field of ["showPopupOnFirstVisit", "enableB2BMode", "showVatIndicator"] as const) {
    if (form.has(`${field}Present`)) values[field] = form.get(field) === "on";
  }

  return values;
}

export async function saveVatSettings(shopDomain: string, values: Prisma.VatSettingsUpdateInput) {
  const { shop } = await getVatSettings(shopDomain);
  return db.vatSettings.update({ where: { shopId: shop.id }, data: values });
}

export async function syncSettingsToAppMetafield(admin: any, settings: any) {
  const installationResponse = await admin.graphql(`query { currentAppInstallation { id } }`);
  const installationJson = await installationResponse.json();
  const ownerId = installationJson.data?.currentAppInstallation?.id;
  if (!ownerId) throw new Error("Could not find the Shopify app installation");

  const value = JSON.stringify({
    defaultDisplayMode: settings.defaultDisplayMode,
    defaultVatRate: settings.defaultVatRate,
    showPopupOnFirstVisit: settings.showPopupOnFirstVisit,
    togglePosition: settings.togglePosition,
    inclusiveLabel: settings.inclusiveLabel,
    exclusiveLabel: settings.exclusiveLabel,
    popupTitle: settings.popupTitle,
    popupMessage: settings.popupMessage,
    enableB2BMode: settings.enableB2BMode,
    b2bCustomerTags: settings.b2bCustomerTags,
    b2bDefaultMode: settings.b2bDefaultMode,
    toggleStyle: settings.toggleStyle,
    primaryColor: settings.primaryColor,
    backgroundColor: settings.backgroundColor,
    activeTextColor: settings.activeTextColor,
    borderRadius: settings.borderRadius,
    showVatIndicator: settings.showVatIndicator,
    indicatorPosition: settings.indicatorPosition,
    animationStyle: settings.animationStyle,
  });

  const response = await admin.graphql(
    `#graphql
      mutation SetVatSettings($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) { userErrors { field message } }
      }`,
    { variables: { metafields: [{ ownerId, namespace: "vat_toggle", key: "settings", type: "json", value }] } },
  );
  const json = await response.json();
  const errors = json.data?.metafieldsSet?.userErrors ?? [];
  if (errors.length) throw new Error(errors.map((error: { message: string }) => error.message).join(", "));
}

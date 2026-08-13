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
  settingsVersion: 1,
  widgetPosition: "bottom-right",
  desktopOffsetX: 24,
  desktopOffsetY: 24,
  mobileOffsetX: 16,
  mobileOffsetY: 80,
  widgetPadding: 12,
  controlSize: "medium",
  widgetBorderWidth: 0,
  widgetBorderColor: "#e1e3e5",
  widgetShadow: "medium",
  allowMinimize: true,
  helperTextSize: "medium",
  helperTextColor: "#6d7175",
  popupChoiceDays: 30,
  popupWidth: 420,
  popupBackgroundColor: "#ffffff",
  popupOverlayColor: "#000000",
  popupOverlayOpacity: 55,
  popupBorderRadius: "medium",
  popupTitleColor: "#202223",
  popupTextColor: "#616161",
  popupButtonStyle: "solid",
  popupShowClose: true,
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
    "widgetPosition", "controlSize", "widgetBorderColor", "widgetShadow", "helperTextSize",
    "helperTextColor", "popupBackgroundColor", "popupOverlayColor", "popupBorderRadius",
    "popupTitleColor", "popupTextColor", "popupButtonStyle",
  ] as const;

  for (const field of stringFields) {
    if (form.has(field)) values[field] = String(form.get(field) || "");
  }

  if (form.has("defaultVatRate")) {
    const rate = Number(form.get("defaultVatRate"));
    if (Number.isFinite(rate) && rate >= 0 && rate <= 100) values.defaultVatRate = rate;
  }

  for (const field of ["desktopOffsetX", "desktopOffsetY", "mobileOffsetX", "mobileOffsetY", "widgetPadding", "widgetBorderWidth", "popupChoiceDays", "popupWidth", "popupOverlayOpacity"] as const) {
    if (!form.has(field)) continue;
    const value = Number(form.get(field));
    if (Number.isInteger(value) && value >= 0 && value <= (field === "popupWidth" ? 900 : 200)) values[field] = value;
  }

  for (const field of ["showPopupOnFirstVisit", "enableB2BMode", "showVatIndicator", "allowMinimize", "popupShowClose"] as const) {
    if (form.has(`${field}Present`)) values[field] = form.get(field) === "on";
  }

  return values;
}

export async function saveVatSettings(shopDomain: string, values: Prisma.VatSettingsUpdateInput) {
  const { shop } = await getVatSettings(shopDomain);
  return db.vatSettings.update({ where: { shopId: shop.id }, data: { ...values, settingsVersion: { increment: 1 } } });
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
    settingsVersion: settings.settingsVersion,
    widgetPosition: settings.widgetPosition,
    desktopOffsetX: settings.desktopOffsetX,
    desktopOffsetY: settings.desktopOffsetY,
    mobileOffsetX: settings.mobileOffsetX,
    mobileOffsetY: settings.mobileOffsetY,
    widgetPadding: settings.widgetPadding,
    controlSize: settings.controlSize,
    widgetBorderWidth: settings.widgetBorderWidth,
    widgetBorderColor: settings.widgetBorderColor,
    widgetShadow: settings.widgetShadow,
    allowMinimize: settings.allowMinimize,
    helperTextSize: settings.helperTextSize,
    helperTextColor: settings.helperTextColor,
    popupChoiceDays: settings.popupChoiceDays,
    popupWidth: settings.popupWidth,
    popupBackgroundColor: settings.popupBackgroundColor,
    popupOverlayColor: settings.popupOverlayColor,
    popupOverlayOpacity: settings.popupOverlayOpacity,
    popupBorderRadius: settings.popupBorderRadius,
    popupTitleColor: settings.popupTitleColor,
    popupTextColor: settings.popupTextColor,
    popupButtonStyle: settings.popupButtonStyle,
    popupShowClose: settings.popupShowClose,
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

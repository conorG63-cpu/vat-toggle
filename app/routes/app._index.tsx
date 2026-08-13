import { useState } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

const defaults = {
  defaultDisplayMode: "inclusive", defaultVatRate: 20, showPopupOnFirstVisit: true,
  togglePosition: "header", inclusiveLabel: "Inc. VAT", exclusiveLabel: "Ex. VAT",
  popupTitle: "How would you like to see prices?", popupMessage: "Choose your preferred pricing display",
  enableB2BMode: false, b2bCustomerTags: "b2b,wholesale,trade", b2bDefaultMode: "exclusive",
  toggleStyle: "pill", primaryColor: "#000000", backgroundColor: "#f4f4f4",
  activeTextColor: "#ffffff", borderRadius: "medium", showVatIndicator: true,
  indicatorPosition: "after", animationStyle: "smooth",
};

async function getSettings(shopDomain: string) {
  const shop = await db.shop.upsert({ where: { shopDomain }, create: { shopDomain }, update: {} });
  return db.vatSettings.upsert({ where: { shopId: shop.id }, create: { shopId: shop.id, ...defaults }, update: {} });
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { settings: await getSettings(session.shop), shop: session.shop };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const shop = await db.shop.upsert({ where: { shopDomain: session.shop }, create: { shopDomain: session.shop }, update: {} });
  const actionType = String(form.get("actionType") || "save");
  const values = valuesFromForm(form);

  if (actionType === "activate") {
    await db.vatSettings.update({ where: { shopId: shop.id }, data: { ...values, setupCompleted: true, activated: true, activatedAt: new Date() } });
  } else {
    await db.vatSettings.upsert({
      where: { shopId: shop.id },
      create: { shopId: shop.id, ...defaults, ...values, setupCompleted: actionType === "complete" },
      update: { ...values, ...(actionType === "complete" ? { setupCompleted: true } : {}) },
    });
  }
  return { saved: true, completed: actionType === "complete" || actionType === "activate" };
};

function valuesFromForm(form: FormData) {
  return {
    defaultDisplayMode: String(form.get("defaultDisplayMode") || defaults.defaultDisplayMode),
    defaultVatRate: Number(form.get("defaultVatRate") || defaults.defaultVatRate),
    showPopupOnFirstVisit: form.get("showPopupOnFirstVisit") === "on",
    togglePosition: String(form.get("togglePosition") || defaults.togglePosition),
    inclusiveLabel: String(form.get("inclusiveLabel") || defaults.inclusiveLabel),
    exclusiveLabel: String(form.get("exclusiveLabel") || defaults.exclusiveLabel),
    popupTitle: String(form.get("popupTitle") || defaults.popupTitle),
    popupMessage: String(form.get("popupMessage") || defaults.popupMessage),
    enableB2BMode: form.get("enableB2BMode") === "on",
    b2bCustomerTags: String(form.get("b2bCustomerTags") || defaults.b2bCustomerTags),
    b2bDefaultMode: String(form.get("b2bDefaultMode") || defaults.b2bDefaultMode),
    toggleStyle: String(form.get("toggleStyle") || defaults.toggleStyle),
    primaryColor: String(form.get("primaryColor") || defaults.primaryColor),
    backgroundColor: String(form.get("backgroundColor") || defaults.backgroundColor),
    activeTextColor: String(form.get("activeTextColor") || defaults.activeTextColor),
    borderRadius: String(form.get("borderRadius") || defaults.borderRadius),
    showVatIndicator: form.get("showVatIndicator") === "on",
    indicatorPosition: String(form.get("indicatorPosition") || defaults.indicatorPosition),
    animationStyle: String(form.get("animationStyle") || defaults.animationStyle),
  };
}

function Progress({ step }: { step: number }) {
  return <s-stack direction="inline" gap="base">{["Business", "Display", "B2B", "Activate"].map((label, index) => <s-badge key={label} tone={index + 1 === step ? "info" : index + 1 < step ? "success" : "neutral"}>{index + 1}. {label}</s-badge>)}</s-stack>;
}

function SetupWizard({ shop, settings }: { shop: string; settings: Awaited<ReturnType<typeof getSettings>> }) {
  const [step, setStep] = useState(1);
  const navigation = useNavigation();
  const heading = ["Business setup", "Price display", "B2B settings", "Preview and activate"][step - 1];

  return <s-page heading="Set up your VAT pricing">
    <s-section heading="Get your store ready in a few minutes"><s-stack direction="block" gap="base"><s-paragraph>Choose how retail and trade customers should see prices. You can change everything later.</s-paragraph><Progress step={step} /></s-stack></s-section>
    <s-section heading={heading}><Form method="post"><input type="hidden" name="actionType" value="complete" /><s-stack direction="block" gap="base">
      {step === 1 && <><s-select label="Default price display" name="defaultDisplayMode" value={settings.defaultDisplayMode}><s-option value="inclusive">Inclusive of VAT (retail)</s-option><s-option value="exclusive">Exclusive of VAT (trade)</s-option></s-select><s-text-field label="Default VAT rate (%)" name="defaultVatRate" value={String(settings.defaultVatRate)} /><s-paragraph>Store: {shop}</s-paragraph></>}
      {step === 2 && <><s-select label="Where should customers choose?" name="togglePosition" value={settings.togglePosition}><s-option value="header">Header toggle</s-option><s-option value="popup">First-visit popup</s-option><s-option value="both">Header toggle and popup</s-option></s-select><s-text-field label="Inclusive label" name="inclusiveLabel" value={settings.inclusiveLabel} /><s-text-field label="Exclusive label" name="exclusiveLabel" value={settings.exclusiveLabel} /><s-checkbox label="Show a VAT label beside prices" name="showVatIndicator" checked={settings.showVatIndicator} /></>}
      {step === 3 && <><s-checkbox label="Enable B2B customer mode" name="enableB2BMode" checked={settings.enableB2BMode} /><s-text-field label="Trade customer tags" name="b2bCustomerTags" value={settings.b2bCustomerTags} /><s-select label="Trade customer display" name="b2bDefaultMode" value={settings.b2bDefaultMode}><s-option value="exclusive">Exclusive of VAT</s-option><s-option value="inclusive">Inclusive of VAT</s-option></s-select><s-paragraph>Approved trade customers are identified by Shopify customer tags. VAT-number approval is the next feature.</s-paragraph></>}
      {step === 4 && <><s-banner tone="success">Your settings are ready. Activate the app embed in your theme to show the pricing control.</s-banner><s-paragraph>After activation, check a product, collection, and cart before going live.</s-paragraph><s-link href={`https://${shop}/admin/themes/current/editor?context=apps`} target="_blank">Open theme editor</s-link></>}
      <s-stack direction="inline" gap="base">{step > 1 && <s-button type="button" onClick={() => setStep(step - 1)}>Back</s-button>}{step < 4 ? <s-button type="button" variant="primary" onClick={() => setStep(step + 1)}>Continue</s-button> : <s-button type="submit" variant="primary" {...(navigation.state !== "idle" ? { loading: true } : {})}>Save setup</s-button>}</s-stack>
    </s-stack></Form></s-section>
  </s-page>;
}

export default function SettingsPage() {
  const { settings, shop } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  if (!settings.setupCompleted) return <SetupWizard shop={shop} settings={settings} />;
  return <s-page heading="VAT pricing">
    <s-section heading="Your store is set up"><s-stack direction="block" gap="base"><s-banner tone={settings.activated ? "success" : "warning"}>{settings.activated ? "VAT pricing is active." : "Finish by activating the app embed in your theme."}</s-banner><s-link href={`https://${shop}/admin/themes/current/editor?context=apps`} target="_blank">Open theme editor</s-link>{!settings.activated && <Form method="post"><input type="hidden" name="actionType" value="activate" /><s-button type="submit" variant="primary">I've activated the app embed</s-button></Form>}</s-stack></s-section>
    <s-section heading="Price display settings"><Form method="post"><input type="hidden" name="actionType" value="save" /><s-stack direction="block" gap="base"><s-select label="Default display mode" name="defaultDisplayMode" value={settings.defaultDisplayMode}><s-option value="inclusive">Inclusive of VAT</s-option><s-option value="exclusive">Exclusive of VAT</s-option></s-select><s-text-field label="Default VAT rate (%)" name="defaultVatRate" value={String(settings.defaultVatRate)} /><s-text-field label="Inclusive label" name="inclusiveLabel" value={settings.inclusiveLabel} /><s-text-field label="Exclusive label" name="exclusiveLabel" value={settings.exclusiveLabel} /><s-checkbox label="Show popup on first visit" name="showPopupOnFirstVisit" checked={settings.showPopupOnFirstVisit} /><s-checkbox label="Show VAT indicator beside prices" name="showVatIndicator" checked={settings.showVatIndicator} /><s-checkbox label="Enable B2B customer mode" name="enableB2BMode" checked={settings.enableB2BMode} /><s-text-field label="Trade customer tags" name="b2bCustomerTags" value={settings.b2bCustomerTags} /><s-button type="submit" variant="primary" {...(navigation.state !== "idle" ? { loading: true } : {})}>Save changes</s-button>{result?.saved && <s-banner tone="success">Settings saved.</s-banner>}</s-stack></Form></s-section>
  </s-page>;
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);

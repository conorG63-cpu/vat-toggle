import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

const defaults = {
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

async function getSettings(shopDomain: string) {
  const shop = await db.shop.upsert({
    where: { shopDomain },
    create: { shopDomain },
    update: {},
  });

  return db.vatSettings.upsert({
    where: { shopId: shop.id },
    create: { shopId: shop.id, ...defaults },
    update: {},
  });
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await getSettings(session.shop);
  return { settings, shop: session.shop };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const form = await request.formData();
  const shop = await db.shop.upsert({
    where: { shopDomain: session.shop },
    create: { shopDomain: session.shop },
    update: {},
  });

  await db.vatSettings.upsert({
    where: { shopId: shop.id },
    create: {
      shopId: shop.id,
      ...defaults,
      ...valuesFromForm(form),
    },
    update: valuesFromForm(form),
  });

  return { saved: true };
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

export default function SettingsPage() {
  const { settings, shop } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();

  return (
    <s-page heading="VAT settings">
      <s-section heading={`Settings for ${shop}`}>
        <Form method="post">
          <s-stack direction="block" gap="base">
            <s-select label="Default display mode" name="defaultDisplayMode" value={settings.defaultDisplayMode}>
              <s-option value="inclusive">Inclusive of VAT</s-option>
              <s-option value="exclusive">Exclusive of VAT</s-option>
            </s-select>
            <s-text-field label="Default VAT rate (%)" name="defaultVatRate" value={String(settings.defaultVatRate)} />
            <s-text-field label="Inclusive label" name="inclusiveLabel" value={settings.inclusiveLabel} />
            <s-text-field label="Exclusive label" name="exclusiveLabel" value={settings.exclusiveLabel} />
            <s-select label="Toggle position" name="togglePosition" value={settings.togglePosition}>
              <s-option value="header">Header</s-option>
              <s-option value="popup">Popup</s-option>
              <s-option value="both">Both</s-option>
            </s-select>
            <s-text-field label="Popup title" name="popupTitle" value={settings.popupTitle} />
            <s-text-field label="Popup message" name="popupMessage" value={settings.popupMessage} />
            <s-checkbox label="Show popup on first visit" name="showPopupOnFirstVisit" checked={settings.showPopupOnFirstVisit} />
            <s-checkbox label="Show VAT indicator beside prices" name="showVatIndicator" checked={settings.showVatIndicator} />
            <s-select label="Indicator position" name="indicatorPosition" value={settings.indicatorPosition}>
              <s-option value="before">Before price</s-option>
              <s-option value="after">After price</s-option>
              <s-option value="below">Below price</s-option>
            </s-select>
            <s-checkbox label="Enable B2B customer mode" name="enableB2BMode" checked={settings.enableB2BMode} />
            <s-text-field label="B2B customer tags" name="b2bCustomerTags" value={settings.b2bCustomerTags} />
            <s-select label="B2B default mode" name="b2bDefaultMode" value={settings.b2bDefaultMode}>
              <s-option value="inclusive">Inclusive of VAT</s-option>
              <s-option value="exclusive">Exclusive of VAT</s-option>
            </s-select>
            <s-button type="submit" {...(navigation.state !== "idle" ? { loading: true } : {})}>
              Save settings
            </s-button>
            {result?.saved && <s-banner tone="success">Settings saved.</s-banner>}
          </s-stack>
        </Form>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);

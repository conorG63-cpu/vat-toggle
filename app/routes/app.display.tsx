import { useState } from "react";
import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getVatSettings, saveVatSettings, settingsFromForm, syncSettingsToAppMetafield } from "../vat-settings.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return getVatSettings(session.shop);
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const settings = await saveVatSettings(session.shop, settingsFromForm(await request.formData()));
  await syncSettingsToAppMetafield(admin, settings);
  return { saved: true };
};

export default function DisplaySettings() {
  const { settings } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const [preview, setPreview] = useState({
    mode: settings.defaultDisplayMode,
    rate: String(settings.defaultVatRate),
    inclusive: settings.inclusiveLabel,
    exclusive: settings.exclusiveLabel,
    style: settings.toggleStyle,
    primary: settings.primaryColor,
    background: settings.backgroundColor,
    text: settings.activeTextColor,
    popupTitle: settings.popupTitle,
    popupMessage: settings.popupMessage,
    popupEnabled: settings.showPopupOnFirstVisit,
    popupVisible: false,
  });
  const exclusivePrice = (120 / (1 + Number(preview.rate || 20) / 100)).toFixed(2);

  return <s-page heading="Price display">
    <div className="vat-page">
      {result?.saved && <s-banner tone="success">Saved and synced to your theme.</s-banner>}
      <section className="vat-display-heading">
        <div><span className="vat-eyebrow">STOREFRONT DISPLAY</span><h1>Floating VAT control</h1><p>Your PriceSwitch control appears in the bottom-right corner of the storefront. Configure its labels, styling, and first-visit prompt here.</p></div>
        <span className="vat-status vat-status--ready">Bottom-right widget</span>
      </section>
      <div className="vat-settings-layout">
        <Form method="post" className="vat-card vat-form vat-display-form">
          <div><h2>Floating control</h2><p className="vat-help">This is always a floating storefront control, so there is no header placement to configure.</p></div>
          <div className="vat-form-grid">
            <label>Default display<select name="defaultDisplayMode" defaultValue={settings.defaultDisplayMode} onChange={(e) => setPreview({ ...preview, mode: e.currentTarget.value })}><option value="inclusive">Inclusive of VAT</option><option value="exclusive">Exclusive of VAT</option></select></label>
            <label>VAT rate (%)<input name="defaultVatRate" type="number" min="0" max="100" step="0.01" defaultValue={settings.defaultVatRate} onChange={(e) => setPreview({ ...preview, rate: e.currentTarget.value })} /></label>
            <label>Inclusive label<input name="inclusiveLabel" defaultValue={settings.inclusiveLabel} onChange={(e) => setPreview({ ...preview, inclusive: e.currentTarget.value })} /></label>
            <label>Exclusive label<input name="exclusiveLabel" defaultValue={settings.exclusiveLabel} onChange={(e) => setPreview({ ...preview, exclusive: e.currentTarget.value })} /></label>
            <label>Toggle style<select name="toggleStyle" defaultValue={settings.toggleStyle} onChange={(e) => setPreview({ ...preview, style: e.currentTarget.value })}><option value="pill">Pill</option><option value="buttons">Buttons</option><option value="switch">Switch</option><option value="minimal">Minimal</option></select></label>
          </div>
          <div className="vat-colours"><label>Primary colour<input name="primaryColor" type="color" defaultValue={settings.primaryColor} onChange={(e) => setPreview({ ...preview, primary: e.currentTarget.value })} /></label><label>Widget background<input name="backgroundColor" type="color" defaultValue={settings.backgroundColor} onChange={(e) => setPreview({ ...preview, background: e.currentTarget.value })} /></label><label>Active text<input name="activeTextColor" type="color" defaultValue={settings.activeTextColor} onChange={(e) => setPreview({ ...preview, text: e.currentTarget.value })} /></label></div>
          <input type="hidden" name="showVatIndicatorPresent" value="true" /><label className="vat-check"><input name="showVatIndicator" type="checkbox" defaultChecked={settings.showVatIndicator} /> Show the active VAT label beside storefront prices</label>
          <div className="vat-divider" />
          <div><h2>First-visit popup</h2><p className="vat-help">Ask visitors whether they want to view prices including or excluding VAT. They only see this until they make a choice.</p></div>
          <input type="hidden" name="showPopupOnFirstVisitPresent" value="true" /><label className="vat-check"><input name="showPopupOnFirstVisit" type="checkbox" defaultChecked={settings.showPopupOnFirstVisit} onChange={(e) => setPreview({ ...preview, popupEnabled: e.currentTarget.checked })} /> Show a popup on the first visit</label>
          <label>Popup heading<input name="popupTitle" defaultValue={settings.popupTitle} onChange={(e) => setPreview({ ...preview, popupTitle: e.currentTarget.value })} /></label>
          <label>Popup message<textarea name="popupMessage" defaultValue={settings.popupMessage} rows={3} onChange={(e) => setPreview({ ...preview, popupMessage: e.currentTarget.value })} /></label>
          <button className="vat-primary" type="submit" disabled={navigation.state !== "idle"}>Save display settings</button>
        </Form>
        <aside className="vat-card vat-preview">
          <div className="vat-preview-header"><div><span>LIVE PREVIEW</span><h2>Your storefront</h2></div>{preview.popupEnabled && <button type="button" className="vat-preview-link" onClick={() => setPreview({ ...preview, popupVisible: true })}>Preview popup</button>}</div>
          <div className="vat-store-preview">
            <div className="vat-store-preview__nav">Your store <span>Search&nbsp;&nbsp; Cart</span></div>
            <div className="vat-store-preview__content"><small>FEATURED PRODUCT</small><h3>Example product</h3><div className="vat-preview-price"><strong>{preview.mode === "inclusive" ? "£120.00" : `£${exclusivePrice}`}</strong><span>{preview.mode === "inclusive" ? preview.inclusive : preview.exclusive}</span></div></div>
            <div className={`vat-preview-toggle vat-preview-toggle--${preview.style}`} style={{ backgroundColor: preview.style === "minimal" ? "transparent" : preview.background }}><button type="button" className={preview.mode === "inclusive" ? "active" : ""} onClick={() => setPreview({ ...preview, mode: "inclusive" })} style={preview.mode === "inclusive" ? { backgroundColor: preview.primary, color: preview.text } : {}}>{preview.inclusive}</button><button type="button" className={preview.mode === "exclusive" ? "active" : ""} onClick={() => setPreview({ ...preview, mode: "exclusive" })} style={preview.mode === "exclusive" ? { backgroundColor: preview.primary, color: preview.text } : {}}>{preview.exclusive}</button></div>
            {preview.popupVisible && <div className="vat-popup-preview"><div className="vat-popup-preview__dialog"><button type="button" className="vat-popup-close" onClick={() => setPreview({ ...preview, popupVisible: false })}>×</button><h3>{preview.popupTitle || "How would you like to see prices?"}</h3><p>{preview.popupMessage || "Choose your preferred pricing display"}</p><div><button type="button" onClick={() => setPreview({ ...preview, mode: "inclusive", popupVisible: false })}>{preview.inclusive}</button><button type="button" onClick={() => setPreview({ ...preview, mode: "exclusive", popupVisible: false })} style={{ backgroundColor: preview.primary, color: preview.text }}>{preview.exclusive}</button></div></div></div>}
          </div>
        </aside>
      </div>
    </div>
  </s-page>;
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);

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
  const [preview, setPreview] = useState({ mode: settings.defaultDisplayMode, rate: String(settings.defaultVatRate), inclusive: settings.inclusiveLabel, exclusive: settings.exclusiveLabel, style: settings.toggleStyle, primary: settings.primaryColor, background: settings.backgroundColor, text: settings.activeTextColor });
  const exclusivePrice = (120 / (1 + Number(preview.rate || 20) / 100)).toFixed(2);
  return <s-page heading="Price display">
    {result?.saved && <s-banner tone="success">Saved and synced to your theme.</s-banner>}
    <div className="vat-settings-layout"><Form method="post" className="vat-card vat-form"><h2>Display settings</h2>
      <label>Default display<select name="defaultDisplayMode" defaultValue={settings.defaultDisplayMode} onChange={(e) => setPreview({ ...preview, mode: e.currentTarget.value })}><option value="inclusive">Inclusive of VAT</option><option value="exclusive">Exclusive of VAT</option></select></label>
      <label>VAT rate (%)<input name="defaultVatRate" type="number" min="0" max="100" step="0.01" defaultValue={settings.defaultVatRate} onChange={(e) => setPreview({ ...preview, rate: e.currentTarget.value })} /></label>
      <label>Toggle location<select name="togglePosition" defaultValue={settings.togglePosition}><option value="header">Header</option><option value="popup">Popup</option><option value="both">Both</option></select></label>
      <label>Inclusive label<input name="inclusiveLabel" defaultValue={settings.inclusiveLabel} onChange={(e) => setPreview({ ...preview, inclusive: e.currentTarget.value })} /></label>
      <label>Exclusive label<input name="exclusiveLabel" defaultValue={settings.exclusiveLabel} onChange={(e) => setPreview({ ...preview, exclusive: e.currentTarget.value })} /></label>
      <label>Toggle style<select name="toggleStyle" defaultValue={settings.toggleStyle} onChange={(e) => setPreview({ ...preview, style: e.currentTarget.value })}><option value="pill">Pill</option><option value="buttons">Buttons</option><option value="switch">Switch</option><option value="minimal">Minimal</option></select></label>
      <div className="vat-colours"><label>Primary<input name="primaryColor" type="color" defaultValue={settings.primaryColor} onChange={(e) => setPreview({ ...preview, primary: e.currentTarget.value })} /></label><label>Background<input name="backgroundColor" type="color" defaultValue={settings.backgroundColor} onChange={(e) => setPreview({ ...preview, background: e.currentTarget.value })} /></label><label>Active text<input name="activeTextColor" type="color" defaultValue={settings.activeTextColor} onChange={(e) => setPreview({ ...preview, text: e.currentTarget.value })} /></label></div>
      <input type="hidden" name="showPopupOnFirstVisitPresent" value="true" /><label className="vat-check"><input name="showPopupOnFirstVisit" type="checkbox" defaultChecked={settings.showPopupOnFirstVisit} /> Show popup on first visit</label>
      <input type="hidden" name="showVatIndicatorPresent" value="true" /><label className="vat-check"><input name="showVatIndicator" type="checkbox" defaultChecked={settings.showVatIndicator} /> Show VAT indicator beside prices</label>
      <button className="vat-primary" type="submit" disabled={navigation.state !== "idle"}>Save display settings</button>
    </Form><aside className="vat-card vat-preview"><span>LIVE PREVIEW</span><h2>How customers will see it</h2><div className={`vat-preview-toggle vat-preview-toggle--${preview.style}`} style={{ backgroundColor: preview.style === "minimal" ? "transparent" : preview.background }}><button className={preview.mode === "inclusive" ? "active" : ""} style={preview.mode === "inclusive" ? { backgroundColor: preview.primary, color: preview.text } : {}}>{preview.inclusive}</button><button className={preview.mode === "exclusive" ? "active" : ""} style={preview.mode === "exclusive" ? { backgroundColor: preview.primary, color: preview.text } : {}}>{preview.exclusive}</button></div><div className="vat-preview-price"><strong>{preview.mode === "inclusive" ? "£120.00" : `£${exclusivePrice}`}</strong><span>{preview.mode === "inclusive" ? preview.inclusive : preview.exclusive}</span></div><p>Example product price</p></aside></div>
  </s-page>;
}
export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);

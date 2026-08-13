import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import { getVatSettings, saveVatSettings, settingsFromForm, syncSettingsToAppMetafield } from "../vat-settings.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  return { ...(await getVatSettings(session.shop)), shopDomain: session.shop };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const form = await request.formData();
  const values = settingsFromForm(form);
  const actionType = String(form.get("actionType") || "save");
  if (actionType === "complete") values.setupCompleted = true;
  const settings = await saveVatSettings(session.shop, values);
  await syncSettingsToAppMetafield(admin, settings);
  return { saved: true, message: actionType === "complete" ? "Setup saved. Next, add the app embed to your theme." : "Settings saved and synced to your theme." };
};

export default function Overview() {
  const { settings, shopDomain } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const saving = navigation.state !== "idle";

  return <s-page heading="VAT pricing">
    {result?.saved && <s-banner tone="success">{result.message}</s-banner>}
    <s-section heading={settings.setupCompleted ? "Your VAT pricing workspace" : "Quick setup"}>
      <div className="vat-grid">
        <div className="vat-card vat-card--wide">
          <h2>{settings.setupCompleted ? "Keep your pricing clear for every customer" : "Start with the essentials"}</h2>
          <p>{settings.setupCompleted ? "Update your storefront display, B2B behaviour, and theme activation from one calm workspace." : "Choose a default price view, VAT rate, and how customers switch. You can refine the styling afterwards."}</p>
          <Form method="post" className="vat-quick-form">
            <input type="hidden" name="actionType" value="complete" />
            <label>Default customer view<select name="defaultDisplayMode" defaultValue={settings.defaultDisplayMode}><option value="inclusive">Prices including VAT</option><option value="exclusive">Prices excluding VAT</option></select></label>
            <label>VAT rate (%)<input name="defaultVatRate" type="number" min="0" max="100" step="0.01" defaultValue={settings.defaultVatRate} /></label>
            <label>Customer choice<select name="togglePosition" defaultValue={settings.togglePosition}><option value="header">Header toggle</option><option value="popup">First-visit popup</option><option value="both">Header toggle and popup</option></select></label>
            <button className="vat-primary" type="submit" disabled={saving}>{settings.setupCompleted ? "Save quick settings" : "Save and continue"}</button>
          </Form>
        </div>
        <div className="vat-card">
          <span className={`vat-status ${settings.setupCompleted ? "vat-status--ready" : ""}`}>{settings.setupCompleted ? "Setup complete" : "Setup needed"}</span>
          <h3>Theme activation</h3>
          <p>Enable the PriceSwitch app embed in your live theme, then check a product and cart.</p>
          <a className="vat-link" href={`https://${shopDomain}/admin/themes/current/editor?context=apps`} target="_blank" rel="noreferrer">Open theme editor →</a>
        </div>
      </div>
    </s-section>
    <s-section heading="Manage your pricing">
      <div className="vat-grid vat-grid--three">
        <a className="vat-card vat-card--link" href="/app/display"><span>01</span><h3>Price display</h3><p>Labels, styles, popup copy, and live preview.</p></a>
        <a className="vat-card vat-card--link" href="/app/b2b"><span>02</span><h3>B2B customers</h3><p>Automatically show trade customers the right view.</p></a>
        <div className="vat-card"><span>03</span><h3>Compatibility</h3><p>Check product, collection, cart, and mini-cart before going live.</p><small>Coming next</small></div>
      </div>
    </s-section>
  </s-page>;
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);

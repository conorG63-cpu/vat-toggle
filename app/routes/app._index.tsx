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
    <div className="vat-page">
      {result?.saved && <s-banner tone="success">{result.message}</s-banner>}
      <section className="vat-hero">
        <div>
          <span className="vat-eyebrow">PRICE DISPLAY CONTROL</span>
          <h1>{settings.setupCompleted ? "VAT pricing is ready to manage" : "Set up clear VAT pricing"}</h1>
          <p>{settings.setupCompleted ? "Keep retail and trade pricing consistent across your storefront." : "Start with the three choices customers notice most. You can fine-tune the rest later."}</p>
        </div>
        <div className="vat-activation">
          <span className={`vat-status ${settings.setupCompleted ? "vat-status--ready" : ""}`}>{settings.setupCompleted ? "Setup complete" : "Setup needed"}</span>
          <strong>Theme app embed</strong>
          <p>Enable PriceSwitch in your live theme before going live.</p>
          <a className="vat-link" href={`https://${shopDomain}/admin/themes/current/editor?context=apps`} target="_blank" rel="noreferrer">Open theme editor</a>
        </div>
      </section>
      <section className="vat-panel">
        <div className="vat-panel-heading"><div><h2>Quick settings</h2><p>Set the default view and where customers can switch prices.</p></div><span>Changes sync to your theme when saved</span></div>
        <Form method="post" className="vat-quick-form">
          <input type="hidden" name="actionType" value="complete" />
          <label>Default customer view<select name="defaultDisplayMode" defaultValue={settings.defaultDisplayMode}><option value="inclusive">Prices including VAT</option><option value="exclusive">Prices excluding VAT</option></select></label>
          <label>VAT rate (%)<input name="defaultVatRate" type="number" min="0" max="100" step="0.01" defaultValue={settings.defaultVatRate} /></label>
          <input type="hidden" name="showPopupOnFirstVisitPresent" value="true" /><label className="vat-quick-check"><input name="showPopupOnFirstVisit" type="checkbox" defaultChecked={settings.showPopupOnFirstVisit} /> Ask visitors on their first visit</label>
          <button className="vat-primary" type="submit" disabled={saving}>{settings.setupCompleted ? "Save changes" : "Save and continue"}</button>
        </Form>
      </section>
      <section className="vat-panel vat-panel--flush">
        <div className="vat-panel-heading"><div><h2>Manage VAT pricing</h2><p>Configure each area without losing your place.</p></div></div>
        <div className="vat-feature-list">
          <a className="vat-feature" href="/app/display"><span className="vat-feature-number">01</span><div><h3>Price display</h3><p>Labels, styles, popup copy, colours, and a live storefront preview.</p></div><span className="vat-arrow">→</span></a>
          <a className="vat-feature" href="/app/rates"><span className="vat-feature-number">02</span><div><h3>VAT rates</h3><p>Set a default rate, then override it for Shopify Markets and countries.</p></div><span className="vat-arrow">→</span></a>
          <a className="vat-feature" href="/app/languages"><span className="vat-feature-number">03</span><div><h3>Languages</h3><p>Translate the toggle and first-visit popup for each storefront locale.</p></div><span className="vat-arrow">→</span></a>
          <a className="vat-feature" href="/app/compatibility"><span className="vat-feature-number">04</span><div><h3>Compatibility check</h3><p>Test product pages, collections, cart, and mini-cart before going live.</p></div><span className="vat-arrow">→</span></a>
        </div>
      </section>
    </div>
  </s-page>;
}

export const headers: HeadersFunction = (headersArgs) => boundary.headers(headersArgs);

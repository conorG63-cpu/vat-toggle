import type { ActionFunctionArgs, HeadersFunction, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { getVatSettings } from "../vat-settings.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request); const { shop, settings } = await getVatSettings(session.shop);
  return { settings, rates: await db.vatMarketRate.findMany({ where: { shopId: shop.id }, orderBy: [{ marketName: "asc" }, { countryCode: "asc" }] }) };
}
export async function action({ request }: ActionFunctionArgs) {
  const { session, admin } = await authenticate.admin(request); const { shop, settings } = await getVatSettings(session.shop); const form = await request.formData(); const intent = String(form.get("intent"));
  if (intent === "delete") { const id = String(form.get("id")); const rate = await db.vatMarketRate.findFirst({ where: { id, shopId: shop.id } }); if (rate) await db.vatMarketRate.delete({ where: { id: rate.id } }); }
  if (intent === "save") { const marketId = String(form.get("marketId") || "manual"); const countryCode = String(form.get("countryCode") || "").toUpperCase(); const rate = Number(form.get("rate")); if (!Number.isFinite(rate) || rate < 0 || rate > 100) return { error: "Use a VAT rate between 0 and 100." }; const id = String(form.get("id") || ""); const existing = id ? await db.vatMarketRate.findFirst({ where: { id, shopId: shop.id } }) : null; if (existing) await db.vatMarketRate.update({ where: { id: existing.id }, data: { marketName: String(form.get("marketName") || countryCode || "Custom market"), countryCode, rate } }); else await db.vatMarketRate.upsert({ where: { shopId_marketId_countryCode: { shopId: shop.id, marketId, countryCode } }, create: { shopId: shop.id, marketId, marketName: String(form.get("marketName") || countryCode || "Custom market"), countryCode, rate }, update: { marketName: String(form.get("marketName") || countryCode || "Custom market"), rate } }); }
  if (intent === "import") {
    try {
      const response = await admin.graphql(`
      #graphql
      query PriceSwitchMarkets {
        markets(first: 250) { nodes { id name } }
      }
    `);
      const json: any = await response.json();
      if (json.errors?.length) return { error: "Shopify could not load Markets. Make sure the app has read_markets access, then reinstall it after deploying the updated app configuration." };
      const markets = json.data?.markets?.nodes ?? [];
      return { markets, defaultRate: settings.defaultVatRate };
    } catch {
      return { error: "Shopify could not load Markets. Make sure the app has read_markets access, then reinstall it after deploying the updated app configuration." };
    }
  }
  if (intent === "saveImported") {
    const marketIds = form.getAll("marketId").map(String); const names = form.getAll("marketName").map(String); const countries = form.getAll("countryCode").map(String); const rates = form.getAll("rate").map(Number);
    for (let index = 0; index < marketIds.length; index += 1) { const rate = rates[index]; if (!Number.isFinite(rate) || rate < 0 || rate > 100) return { error: "Each imported rate must be between 0 and 100." }; await db.vatMarketRate.upsert({ where: { shopId_marketId_countryCode: { shopId: shop.id, marketId: marketIds[index], countryCode: countries[index].toUpperCase() } }, create: { shopId: shop.id, marketId: marketIds[index], marketName: names[index], countryCode: countries[index].toUpperCase(), rate }, update: { marketName: names[index], rate } }); }
  }
  return { saved: true };
}
export default function VatRates() {
  const { settings, rates } = useLoaderData<typeof loader>();
  const result = useActionData<typeof action>();
  const navigation = useNavigation();
  const importing = result && "markets" in result ? result.markets : null;
  const importedDefaultRate = result && "defaultRate" in result ? result.defaultRate : settings.defaultVatRate;
  return <s-page heading="VAT rates"><div className="vat-page">
    <section className="vat-display-heading"><div><span className="vat-eyebrow">SHOPIFY MARKETS</span><h1>Rates by market</h1><p>Review each imported market before saving its rate.</p></div><Form method="post"><input type="hidden" name="intent" value="import"/><button className="vat-secondary" disabled={navigation.state !== "idle"}>Import Shopify Markets</button></Form></section>
    {result?.error && <s-banner tone="critical">{result.error}</s-banner>}{result?.saved && <s-banner tone="success">VAT rates saved.</s-banner>}
    <section className="vat-panel"><div className="vat-panel-heading"><div><h2>Add a rate</h2><p>Default rate: {settings.defaultVatRate}%.</p></div></div><Form method="post" className="vat-inline-form"><input type="hidden" name="intent" value="save"/><label>Market name<input name="marketName" required placeholder="United Kingdom"/></label><label>Country code (optional)<input name="countryCode" maxLength={2} placeholder="GB"/></label><label>VAT rate (%)<input name="rate" type="number" min="0" max="100" step="0.01" required defaultValue={settings.defaultVatRate}/></label><button className="vat-primary" disabled={navigation.state !== "idle"}>Add rate</button></Form></section>
    <section className="vat-panel"><h2>Configured rates</h2>{rates.length === 0 ? <p className="vat-empty">No market overrides yet. Your default VAT rate applies everywhere.</p> : <div className="vat-table">{rates.map((rate) => <Form method="post" key={rate.id} className="vat-rate-row"><input type="hidden" name="id" value={rate.id}/><input type="hidden" name="marketId" value={rate.marketId}/><input type="hidden" name="marketName" value={rate.marketName}/><span><strong>{rate.marketName}</strong><small>{rate.countryCode || "Market-wide rate"}</small></span><input name="countryCode" maxLength={2} defaultValue={rate.countryCode} placeholder="Country" aria-label={`${rate.marketName} country code`}/><input name="rate" type="number" min="0" max="100" step="0.01" defaultValue={rate.rate} aria-label={`${rate.marketName} VAT rate`}/><button className="vat-text-button" name="intent" value="save" disabled={navigation.state !== "idle"}>Save</button><button className="vat-text-button" name="intent" value="delete">Remove</button></Form>)}</div>}</section>
    {importing && <div className="vat-modal-backdrop"><section className="vat-modal" role="dialog" aria-modal="true" aria-labelledby="import-title"><span className="vat-eyebrow">REVIEW IMPORT</span><h2 id="import-title">Set VAT rates before saving</h2><p>We have suggested your default rate. Change each value and optionally add a two-letter country code, then confirm.</p><Form method="post"><input type="hidden" name="intent" value="saveImported"/><div className="vat-import-list">{importing.map((market: { id: string; name: string }) => <div key={market.id}><input type="hidden" name="marketId" value={market.id}/><input type="hidden" name="marketName" value={market.name}/><strong>{market.name}</strong><input name="countryCode" maxLength={2} placeholder="Country" aria-label={`${market.name} country code`}/><input name="rate" type="number" min="0" max="100" step="0.01" defaultValue={importedDefaultRate} aria-label={`${market.name} VAT rate`}/><span>%</span></div>)}</div><button className="vat-primary" disabled={navigation.state !== "idle"}>Confirm and save rates</button></Form></section></div>}
  </div></s-page>;
}
export const headers: HeadersFunction = (args) => boundary.headers(args);

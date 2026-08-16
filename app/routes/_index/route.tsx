import type { LoaderFunctionArgs } from "react-router";
import { redirect, Form, useLoaderData } from "react-router";

import { login } from "../../shopify.server";

import styles from "./styles.module.css";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();

  return (
    <div className={styles.index}>
      <div className={styles.content}>
        <div className={styles.hero}>
          <div className={styles.brand}>
            <span className={styles.brandMark} aria-hidden="true">↔</span>
            <span>PriceSwitch</span>
          </div>
          <p className={styles.eyebrow}>B2B VAT pricing for Shopify</p>
          <h1 className={styles.heading}>Clear VAT pricing for every customer.</h1>
          <p className={styles.text}>
            Give shoppers a simple inclusive or exclusive VAT view, while keeping
            your storefront and tax setup in your control.
          </p>
        </div>
        {showForm && (
          <Form className={styles.form} method="post" action="/auth/login">
            <label className={styles.label}>
              <span className={styles.labelTitle}>Your Shopify store</span>
              <input
                className={styles.input}
                type="text"
                name="shop"
                placeholder="your-store.myshopify.com"
                autoComplete="url"
                required
              />
              <span className={styles.help}>Enter your permanent .myshopify.com address.</span>
            </label>
            <button className={styles.button} type="submit">
              Open PriceSwitch
              <span aria-hidden="true">→</span>
            </button>
          </Form>
        )}
        <ul className={styles.list}>
          <li>
            <span className={styles.featureNumber}>01</span>
            <div>
              <strong>Flexible price display</strong>
              <p>Give every shopper a clean inclusive or exclusive VAT choice.</p>
            </div>
          </li>
          <li>
            <span className={styles.featureNumber}>02</span>
            <div>
              <strong>Markets and language ready</strong>
              <p>Set VAT rates and storefront copy for the places you sell.</p>
            </div>
          </li>
          <li>
            <span className={styles.featureNumber}>03</span>
            <div>
              <strong>Built for B2B</strong>
              <p>Offer a clear route to VAT exemption for eligible customers.</p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

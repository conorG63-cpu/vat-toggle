import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  // The root URL is Shopify's app entry point. Installed merchants should land
  // in the embedded, authenticated workspace rather than the standalone login.
  throw redirect(`/app${url.search}`);
};

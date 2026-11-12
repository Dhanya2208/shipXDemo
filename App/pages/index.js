import React, { useEffect, useState } from "react";

export default function Index() {
  const [state, setState] = useState({ loading: true, data: null, error: "" });
  useEffect(() => {
    let active = true;
    fetch("/api/setup")
      .then(async (response) => {
        if (!response.ok) throw new Error(`Shopify request failed (${response.status})`);
        return response.json();
      })
      .then((data) => { if (active) setState({ loading: false, data, error: "" }); })
      .catch((error) => { if (active) setState({ loading: false, data: null, error: error.message }); });
    return () => { active = false; };
  }, []);
  if (state.loading) return <main style={{ padding: 32 }}>Loading your Shopify store…</main>;
  if (state.error) return <main style={{ padding: 32 }}><h1>Could not load the store</h1><p>{state.error}</p><p>Open this app from Shopify admin and confirm the app URL and credentials.</p></main>;
  const shop = state.data?.shop;
  return <main style={{ padding: 32, fontFamily: "Arial, sans-serif" }}><h1>Shop — {shop?.name || shop?.myshopifyDomain || "Shopify store"}</h1><p>Contact — {shop?.contactEmail || shop?.email || "Not provided"}</p></main>;
}

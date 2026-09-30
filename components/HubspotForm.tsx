"use client";
import Script from "next/script";

declare global {
  interface Window {
    hbspt?: { forms: { create: (options: Record<string, string>) => void } };
  }
}

export default function HubspotForm() {
  return (
    <>
      <div id="hubspot-form" />
      <Script
        src="https://js.hsforms.net/forms/embed/v2.js"
        onReady={() => {
          const el = document.getElementById("hubspot-form");
          if (el) el.innerHTML = "";
          window.hbspt?.forms.create({
            portalId: "45449793",
            formId: "18b187f7-3e17-4922-adaf-24257ce096b6",
            region: "na1",
            target: "#hubspot-form",
          });
        }}
      />
    </>
  );
}

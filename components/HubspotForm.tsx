"use client"; // This code runs in the visitor's browser (needed because it reacts to clicks and form submissions)

// ── IMPORTS ──────────────────────────────────────────────────────
// useEffect: lets us run code once the form is on the screen
// Script: Next.js's safe way to load an outside script (HubSpot's form code)
import { useEffect } from "react";
import Script from "next/script";

// ── TELL TYPESCRIPT WHAT "hbspt" IS ──────────────────────────────
// HubSpot's script adds a tool called "hbspt" to the page. TypeScript doesn't
// know about it on its own, so this describes it. Without this, the build fails.
declare global {
  interface Window {
    hbspt?: { forms: { create: (options: Record<string, string>) => void } };
  }
}

// ── THE FORM COMPONENT ───────────────────────────────────────────
// "onSubmitted" is a function the page passes in. We call it when someone
// successfully submits the form, so the page can unlock the PDF download.
export default function HubspotForm({ onSubmitted }: { onSubmitted?: () => void }) {

  // ── LISTEN FOR A SUCCESSFUL SUBMISSION ─────────────────────────
  // After a successful submit, HubSpot sends a message inside the browser.
  // We watch for that message and, when it arrives, tell the page.
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (
        event.data?.type === "hsFormCallback" &&
        event.data?.eventName === "onFormSubmitted"
      ) {
        onSubmitted?.();
      }
    }
    window.addEventListener("message", handleMessage);
    // Clean-up: stop listening when the form leaves the screen
    return () => window.removeEventListener("message", handleMessage);
  }, [onSubmitted]);

  return (
    <>
      {/* Empty box where HubSpot draws the form */}
      <div id="hubspot-form" />

      {/* Loads HubSpot's form code, then builds the form inside the box above */}
      <Script
        src="https://js.hsforms.net/forms/embed/v2.js"
        onReady={() => {
          // Empty the box first so the form never shows up twice
          const el = document.getElementById("hubspot-form");
          if (el) el.innerHTML = "";

          // Ask HubSpot for the client's form and put it in the box
          window.hbspt?.forms.create({
            portalId: "45449793",                               // The client's HubSpot account number
            formId: "18b187f7-3e17-4922-adaf-24257ce096b6",     // Which form in that account
            region: "na1",                                      // HubSpot's North American servers
            target: "#hubspot-form",                            // Put the form in the box with this id
          });
        }}
      />
    </>
  );
}

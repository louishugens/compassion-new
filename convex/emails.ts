"use node";

import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { Resend } from "resend";
import AccountCreationCodeEmail from "../email/AccessCodeEmail";
import * as React from "react";

/**
 * Send access code email to user
 */
export const sendAccessCodeEmail = internalAction({
  args: {
    email: v.string(),
    code: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    // Initialize Resend inside the handler
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send email using Resend with React component
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Compassion Haiti <noreply@compassion.bizhightech.com>",
      to: args.email,
      subject: "Votre code pour créer votre compte Compassion Haiti",
      react: React.createElement(AccountCreationCodeEmail, {
        creationCode: args.code,
        email: args.email,
      }),
    });

    return null;
  },
});


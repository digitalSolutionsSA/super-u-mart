function normalizeWhatsappNumber(value: string | undefined | null) {
  return String(value || "").replace(/[^\d]/g, "").trim();
}

function sanitizeTemplateText(value: unknown, fallback = "-") {
  const text = String(value ?? fallback)
    .replace(/[\n\r\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();

  return text || fallback;
}

function moneyFromItem(item: any) {
  const cents =
    Number.isFinite(Number(item?.price_cents)) && Number(item?.price_cents) > 0
      ? Number(item.price_cents)
      : Math.round(Number(item?.price || 0) * 100);

  return `R${(cents / 100).toFixed(2)}`;
}

export const handler = async (event: any) => {
  try {
    console.log("send-order-notification invoked");

    if (event.httpMethod && event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing request body" }),
      };
    }

    console.log("Raw body:", event.body);

    const order = JSON.parse(event.body);

    console.log("Parsed order payload:", order);

    const {
      orderRef,
      createdAt,
      customerName,
      phone,
      email,
      address,
      note,
      items,
      total,
      courierFee,
      deliveryMethod,
    } = order || {};

    const phoneNumberId = sanitizeTemplateText(
      process.env.SUPERUMART_WHATSAPP_PHONE_NUMBER_ID ||
        process.env.WHATSAPP_PHONE_NUMBER_ID,
      ""
    );

    const accessToken = sanitizeTemplateText(
      process.env.SUPERUMART_WHATSAPP_ACCESS_TOKEN ||
        process.env.WHATSAPP_ACCESS_TOKEN,
      ""
    );

    const ownerWhatsapp = normalizeWhatsappNumber(
      process.env.SUPERUMART_OWNER_WHATSAPP || process.env.OWNER_WHATSAPP
    );

    console.log("Env check:", {
      hasSuperUMartPhoneNumberId: !!process.env.SUPERUMART_WHATSAPP_PHONE_NUMBER_ID,
      hasWhatsappPhoneNumberId: !!process.env.WHATSAPP_PHONE_NUMBER_ID,
      hasSuperUMartAccessToken: !!process.env.SUPERUMART_WHATSAPP_ACCESS_TOKEN,
      hasWhatsappAccessToken: !!process.env.WHATSAPP_ACCESS_TOKEN,
      hasSuperUMartOwnerWhatsapp: !!process.env.SUPERUMART_OWNER_WHATSAPP,
      hasOwnerWhatsapp: !!process.env.OWNER_WHATSAPP,
      resolvedPhoneNumberId: !!phoneNumberId,
      resolvedAccessToken: !!accessToken,
      resolvedOwnerWhatsapp: !!ownerWhatsapp,
    });

    if (!phoneNumberId || !accessToken || !ownerWhatsapp) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error:
            "Missing required environment variables. Expected one of: SUPERUMART_WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_PHONE_NUMBER_ID, SUPERUMART_WHATSAPP_ACCESS_TOKEN or WHATSAPP_ACCESS_TOKEN, SUPERUMART_OWNER_WHATSAPP or OWNER_WHATSAPP",
        }),
      };
    }

    const normalizedDeliveryMethod = String(deliveryMethod || "").toLowerCase();

    const fulfilment =
      normalizedDeliveryMethod === "delivery" ||
      normalizedDeliveryMethod === "courier"
        ? "Delivery"
        : "Collection";

    const formattedAddress =
      fulfilment === "Delivery"
        ? sanitizeTemplateText(address, "-")
        : "Collect in store";

    const courier =
      fulfilment === "Delivery"
        ? `R${Number(courierFee || 0).toFixed(2)}`
        : "R0.00";

    const itemsArray = Array.isArray(items) ? items : [];

    const itemsText =
      itemsArray.length > 0
        ? itemsArray
            .map((i: any) => {
              const qty = Number(i?.qty || i?.quantity || 0);
              const name = sanitizeTemplateText(i?.name, "Unnamed item");
              return `- ${qty}x ${name} @ ${moneyFromItem(i)}`;
            })
            .join(" | ")
        : "- No items supplied";

    const whatsappPayload = {
      messaging_product: "whatsapp",
      to: ownerWhatsapp,
      type: "template",
      template: {
        name: "owner_order_alert_super_umart",
        language: { code: "en" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: sanitizeTemplateText(orderRef, "Pending") },
              {
                type: "text",
                text: sanitizeTemplateText(
                  createdAt,
                  new Date().toISOString()
                ),
              },
              {
                type: "text",
                text: sanitizeTemplateText(customerName, "Unknown customer"),
              },
              { type: "text", text: sanitizeTemplateText(phone, "-") },
              { type: "text", text: sanitizeTemplateText(email, "-") },
              { type: "text", text: sanitizeTemplateText(fulfilment, "Collection") },
              { type: "text", text: formattedAddress },
              { type: "text", text: sanitizeTemplateText(note, "-") },
              { type: "text", text: sanitizeTemplateText(itemsText, "-") },
              { type: "text", text: sanitizeTemplateText(total, "R0.00") },
              { type: "text", text: sanitizeTemplateText(courier, "R0.00") },
            ],
          },
        ],
      },
    };

    console.log("Sending WhatsApp payload:", {
      url: `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      to: ownerWhatsapp,
      templateName: whatsappPayload.template.name,
      language: whatsappPayload.template.language.code,
    });

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(whatsappPayload),
      }
    );

    const data = await response.json();

    console.log("WhatsApp response status:", response.status);
    console.log("WhatsApp response body:", data);

    if (!response.ok) {
      console.error("WhatsApp API error:", data);
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: "WhatsApp API request failed",
          details: data,
        }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error: any) {
    console.error("WhatsApp send error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to send WhatsApp message",
        details: error?.message || "Unknown error",
      }),
    };
  }
};
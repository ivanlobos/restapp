import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const { items, tableId } = await req.json();

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: items.map((item: any) => ({
          id: item.id,
          title: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          currency_id: "CLP",
        })),
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/mesa/${tableId}/success`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/mesa/${tableId}/failure`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/mesa/${tableId}/pending`,
        },
        auto_return: "approved",
      },
    });

    return NextResponse.json({ init_point: result.init_point });
  } catch (error) {
    console.error("MP Error:", error);
    return NextResponse.json({ error: "Error creando preferencia" }, { status: 500 });
  }
}

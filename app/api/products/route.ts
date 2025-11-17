// app/api/products/route.ts
import { NextResponse } from "next/server";
import { wcApi } from "@/lib/wooClient";

export const dynamic = "force-dynamic"; // ensures this API route runs fresh each time

/**
 * GET /api/products
 *
 * Fetches products directly from WooCommerce
 */
export async function GET(req: Request) {
  try {
    console.log("📦 Fetching products from WooCommerce...");

    const { data: wcProducts } = (await wcApi.get("products", {
      per_page: 100,
      status: 'publish' // Only get published products
    })) as { data: any };

    console.log(`✅ WooCommerce returned ${wcProducts.length} products`);

    return NextResponse.json(wcProducts);
  } catch (error: any) {
    console.error("❌ Products fetch failed:", error);

    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
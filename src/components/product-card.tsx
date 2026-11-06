import Link from "next/link";

import { Garment } from "@/components/garment";
import { ArrowUpRightIcon } from "@/components/icons";
import type { Locale } from "@/lib/i18n";
import { formatPrice, garmentLabels, type Product } from "@/lib/products";

export function ProductCard({
  product,
  locale,
}: {
  product: Product;
  locale: Locale;
}) {
  const color = product.colors[0];

  return (
    <Link href={`/${locale}/products/${product.slug}`} className="group block">
      <div className="relative aspect-4/5 overflow-hidden rounded-3xl border border-line bg-stage">
        <Garment
          type={product.type}
          color={color.hex}
          className="h-full w-full p-6 transition-transform duration-700 ease-out group-hover:scale-[1.04] md:p-9"
        />
        <span className="absolute start-3 top-3 rounded-full bg-paper/90 px-2.5 py-1 text-[9px] font-semibold text-ink-soft backdrop-blur-sm">
          {garmentLabels[product.type][locale]}
        </span>
        <span className="absolute bottom-3 end-3 flex h-10 w-10 items-center justify-center rounded-full bg-paper text-ink shadow-sm transition-colors duration-300 group-hover:bg-ink group-hover:text-paper">
          <ArrowUpRightIcon size={17} />
        </span>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4 px-1">
        <div>
          <h2 className="text-sm font-semibold">{product.name[locale]}</h2>
          <div className="mt-2 flex items-center gap-1.5">
            {product.colors.map((item) => (
              <span
                key={item.hex}
                title={item.name[locale]}
                aria-hidden="true"
                className="h-3 w-3 rounded-full border border-line"
                style={{ backgroundColor: item.hex }}
              />
            ))}
            <span className="sr-only">
              {product.colors.map((item) => item.name[locale]).join("، ")}
            </span>
          </div>
        </div>
        <span className="shrink-0 text-sm tabular-nums text-ink-soft">
          {formatPrice(product.price, locale)}
        </span>
      </div>
    </Link>
  );
}

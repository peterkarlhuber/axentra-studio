import { createContext, useContext } from 'react';
import type { Meta, Product, ProductAccess } from '@/api/models';

export const MetaContext = createContext<Meta | null>(null);

/** Server metadata from `GET /v1/meta`; available everywhere below the bootstrap gate. */
export function useMeta(): Meta {
  const meta = useContext(MetaContext);
  if (!meta) throw new Error('useMeta must be used below <MetaGate>');
  return meta;
}

export interface ProductScopeValue {
  productId: string;
  product: Product | undefined;
  access: ProductAccess | undefined;
}

export const ProductScopeContext = createContext<ProductScopeValue | null>(null);

export function useProductScope(): ProductScopeValue {
  const value = useContext(ProductScopeContext);
  if (!value) throw new Error('useProductScope must be used inside /p/:productId routes');
  return value;
}

export function useOptionalProductScope(): ProductScopeValue | null {
  return useContext(ProductScopeContext);
}

/** Product id of single-product mode (`meta.product`), else null. */
export function singleProductId(meta: Meta): string | null {
  return meta.mode === 'single' ? (meta.product?.id ?? null) : null;
}

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  note: string;
};

function cartKey(tableToken: string): string {
  return `konobar:cart:${tableToken}`;
}

export function loadCart(tableToken: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(cartKey(tableToken));
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function saveCart(tableToken: string, items: CartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cartKey(tableToken), JSON.stringify(items));
}

export function clearCart(tableToken: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(cartKey(tableToken));
}

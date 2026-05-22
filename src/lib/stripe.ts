import Stripe from "stripe";

/**
 * Stripe se inicializa de forma lazy (bajo demanda), NO al cargar el modulo.
 * Razon: en esta etapa el pago real usa Mercado Pago. Stripe esta implementado
 * pero puede no tener llaves configuradas. Instanciar en el top-level con una
 * llave undefined hace que el SDK lance error y tumbe cualquier ruta que importe
 * este archivo. Con lazy + guard, el codigo es seguro aunque falten las llaves.
 */

let _stripe: Stripe | null = null;

/** True si hay una STRIPE_SECRET_KEY usable (no vacia, no placeholder). */
export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return false;
  if (key.trim().length === 0) return false;
  if (key.includes("YOUR_KEY") || key.includes("placeholder")) return false;
  return true;
}

/**
 * Devuelve la instancia de Stripe, creandola la primera vez.
 * Lanza si no esta configurado: los callers deben chequear isStripeConfigured()
 * antes y devolver un error HTTP elegante (503).
 */
export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("Stripe no esta configurado (falta STRIPE_SECRET_KEY)");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2026-03-25.dahlia",
    });
  }
  return _stripe;
}

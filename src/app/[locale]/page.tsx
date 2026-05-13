export default async function LandingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-10 text-center">
        <div className="text-6xl mb-4">🍽️</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-3">RestaurantApp</h1>
        <p className="text-gray-500 mb-8 text-lg">
          Gestión de restaurantes simple y rápida.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
          <p className="text-sm text-amber-800 mb-3 font-medium">
            ¿Eres administrador de un local?
          </p>
          <p className="text-xs text-amber-700">
            Accede a través de la URL específica de tu restaurante:
            <br />
            <code className="bg-white px-2 py-0.5 rounded mt-2 inline-block text-amber-900">
              /{locale}/&lt;tu-restaurante&gt;/admin
            </code>
          </p>
        </div>

        <div className="text-xs text-gray-400 pt-4 border-t border-gray-100">
          ¿Eres cliente? Escanea el QR de tu mesa para ver la carta.
        </div>
      </div>
    </div>
  );
}

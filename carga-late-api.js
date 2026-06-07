const BASE = 'https://restapp-six.vercel.app';
const TENANT = 'el-late';
const KEY = 'late2024';

async function api(method, path, body) {
  const r = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-admin-key': KEY, 'x-tenant-slug': TENANT },
    body: body ? JSON.stringify(body) : undefined
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return t; }
}

const categorias = [
  { name: 'Schop', sortOrder: 1, productos: [
    { name: 'Schop Onix', price: 4800, description: 'Graduacion Alcoholica: 7.0% IBU: 30' },
    { name: 'Jarra Onix', price: 17500, description: 'Graduacion Alcoholica: 7.0% IBU: 30' },
    { name: 'Schop Inferno', price: 4900, description: 'Graduacion Alcoholica: 9.0% IBU: 28' },
    { name: 'Jarra Inferno', price: 18500, description: 'Graduacion Alcoholica: 9.0% IBU: 28' },
    { name: 'Schop Rubi', price: 4500, description: 'Graduacion Alcoholica: 7.0% IBU: 16' },
    { name: 'Jarra Rubi', price: 15000, description: 'Graduacion Alcoholica: 7.0% IBU: 30' },
    { name: 'Schop Golden Aurica', price: 4100, description: 'Graduacion Alcoholica: 5.0% IBU: 15' },
    { name: 'Jarra Golden Aurica', price: 14500, description: 'Graduacion Alcoholica: 5.0% IBU: 15' },
    { name: 'Schop IPA', price: 5000, description: 'Graduacion Alcoholica: 5.0% IBU: 55' },
    { name: 'Jarra IPA', price: 18000, description: 'Graduacion Alcoholica: 5.0% IBU: 55' },
  ]},
  { name: 'Cervezas', sortOrder: 2, productos: [
    { name: 'Kross Golden', price: 4300, description: 'Graduacion Alcoholica: 5.3%' },
    { name: 'Kross Stout', price: 4400, description: 'Graduacion Alcoholica: 5.4%' },
    { name: 'Kross 5', price: 4500, description: 'Graduacion Alcoholica: 7.2%' },
    { name: 'Kross Maibock', price: 4400, description: 'Graduacion Alcoholica: 6.5%' },
    { name: 'Kunstmann Torobayo', price: 4400, description: 'Graduacion Alcoholica: 5.0%' },
    { name: 'Kunstmann Arandano', price: 4100, description: 'Graduacion Alcoholica: 4.8%' },
    { name: 'Kunstmann Miel', price: 4200, description: 'Graduacion Alcoholica: 4.8%' },
    { name: 'Gran Torobayo', price: 5900, description: 'Graduacion Alcoholica: 7.5%' },
    { name: 'Heineken', price: 4100, description: 'Graduacion Alcoholica: 5.0%' },
    { name: 'Royal Guard', price: 4400, description: 'Graduacion Alcoholica: 5.0%' },
    { name: 'Budweiser', price: 4100, description: 'Graduacion Alcoholica: 4.9%' },
    { name: 'Corona', price: 4100, description: 'Graduacion Alcoholica: 4.5%' },
    { name: 'Miller', price: 4200, description: 'Graduacion Alcoholica: 4.7%' },
    { name: 'Calafate', price: 4400, description: 'Graduacion Alcoholica: 5.0%' },
    { name: 'Stella Artois', price: 4200, description: 'Graduacion Alcoholica: 5.0%' },
  ]},
  { name: 'Hamburguesas', sortOrder: 3, productos: [
    { name: 'Lovezno', price: 10900, description: 'Pan Brioche con queso cheddar, aros de cebolla, salsa BBQ y papas fritas rusticas' },
    { name: 'Ciri', price: 10600, description: 'Pan Brioche con lechuga, tomate, cebolla morada, pepinillo, mayonesa y papas fritas rusticas' },
    { name: 'Dallas', price: 11100, description: 'Pan Brioche con tomate, palta, mayonesa y papas fritas rusticas' },
    { name: 'Bluecheese', price: 11500, description: 'Pan Brioche con queso azul, cebolla caramelizada, tocino y papas fritas rusticas' },
    { name: 'MacDowell', price: 10100, description: 'Pan Brioche con doble queso cheddar, pepinillos, cebolla, mostaza, ketchup y papas fritas rusticas' },
  ]},
  { name: 'Chorrillanas', sortOrder: 4, productos: [
    { name: 'Strogonoff', price: 16200, description: 'Carne de res a la crema, papas fritas, champinones, cebolla, cilantro y salsa lactonesa' },
    { name: 'Late', price: 21800, description: 'Carne de res, pollo, camarones, papas fritas, cebolla morada, crema, queso mantecoso, parmesano, salsa de tomate y albahaca' },
    { name: 'Mar y Tierra', price: 18600, description: 'Pollo, camarones, papas fritas, champinones, cebolla caramelizada, pan tostado, 2 huevos fritos y salsa lactonesa' },
    { name: 'Tradicional', price: 16300, description: 'Carne de res, longaniza, papas fritas, cebolla caramelizada, 2 huevos fritos, pan tostado y salsa lactonesa' },
    { name: 'Mixta', price: 17400, description: 'Pollo, carne de res, papas fritas, longaniza, cebolla caramelizada, 2 huevos fritos, pan tostado y salsa lactonesa' },
    { name: 'De Pollo', price: 15700, description: 'Carne de pollo, papas fritas, cebollin, cebolla caramelizada, 2 huevos fritos, pan tostado y salsa lactonesa' },
    { name: 'Blanca', price: 16000, description: 'Carne de pollo, papas fritas, cebolla blanca, tocino, champinon, crema, cilantro y salsa lactonesa' },
    { name: 'Nueva Cheddar', price: 18300, description: 'Carne de res, papas fritas, tocino, champinones, queso cheddar derretido, aros de cebolla y salsa lactonesa' },
    { name: 'Saltada', price: 17700, description: 'Carne de res, papas fritas, cebolla morada, tomate, cilantro y salsa lactonesa' },
  ]},
  { name: 'Pizzas', sortOrder: 5, productos: [
    { name: 'Late', price: 14000, description: 'Salsa de tomate, mozzarella, carne, tocino, champinones y pimenton rojo' },
    { name: 'Carnes', price: 15000, description: 'Salsa de tomate, mozzarella, carne, pollo, tocino, salame y cebolla morada' },
    { name: 'Vegetariana', price: 14300, description: 'Salsa de tomate, mozzarella, champinon, pimenton verde, cebolla morada, choclo y tomate' },
    { name: 'Napolitana', price: 14000, description: 'Salsa de tomate, mozzarella, oregano, tomate y jamon' },
    { name: 'Pizzame', price: 15000, description: 'Salsa de tomate, mozzarella, crema, carne de res, jamon serrano, cebolla morada, albahaca y parmesano' },
    { name: 'Margarita', price: 14300, description: 'Salsa de tomate, mozzarella, champinon a la plancha, tomate cherry y albahaca' },
  ]},
  { name: 'Tragos y Cocktails', sortOrder: 6, productos: [
    { name: 'Kir Royale', price: 6500, description: 'Licor de cassis y espumante' },
    { name: 'Manhattan', price: 7100, description: 'Whisky Johnnie Red Label, vermouth rosso y amargo de angostura' },
    { name: 'Padrino', price: 7100, description: 'Whisky Johnnie Red Label y amaretto' },
    { name: 'Laguna Azul', price: 7000, description: 'Vodka, jugo de pina y curazao blue' },
    { name: 'Long Island Tea', price: 7100, description: 'Gin, vodka, whisky, tequila, jugo de limon y coca cola' },
    { name: 'Orgasmo', price: 7000, description: 'Vodka, crema, triple sec, goma y ralladura de chocolate' },
    { name: 'Multi Orgasmo', price: 7400, description: 'Licor de cafe, amaretto, vodka y baileys' },
    { name: 'Baileys', price: 6200, description: 'Shot de Baileys' },
    { name: 'Jagermeister', price: 6500, description: 'Shot de Jagermeister' },
    { name: 'Jager Bomb', price: 7700, description: 'Shot de Jager + 1 energetica' },
    { name: 'Fernet Branca', price: 5900, description: 'Shot o vaso con Coca Cola' },
    { name: 'Negroni', price: 6100, description: 'Campari, gin y Martini Rosso' },
    { name: 'Aperol Spritz', price: 6100, description: 'Aperol, espumante, rodaja de citrico y agua mineral' },
    { name: 'Tropical Gin', price: 8200, description: 'Gin, hielo, Red Bull Yellow y shot de maracuya' },
    { name: 'Moscow Mule', price: 8300, description: 'Vodka, ginger beer, hielo y jugo de limon' },
    { name: 'London Mule', price: 8600, description: 'Beefeater, ginger beer, hielo y jugo de limon' },
    { name: 'St Germain Spritz', price: 7700, description: 'St Germain, espumante, rodaja de citrico y agua mineral' },
    { name: 'Maracazzotti', price: 6500, description: 'Ramazzotti, Maracuya Stones y rodaja de citrico' },
  ]},
];

async function main() {
  for (const cat of categorias) {
    const c = await api('POST', `/${TENANT}/categories`, { name: cat.name, sortOrder: cat.sortOrder });
    console.log('Categoria:', cat.name, c.id || JSON.stringify(c));
    for (let i = 0; i < cat.productos.length; i++) {
      const p = cat.productos[i];
      const r = await api('POST', `/${TENANT}/products`, { ...p, sortOrder: i+1, categoryId: c.id, isAvailable: true });
      process.stdout.write('.');
    }
    console.log('');
  }
  console.log('Listo!');
}

main().catch(console.error);

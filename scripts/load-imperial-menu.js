/**
 * Carga la carta REAL de Bar Imperial.
 *
 * Uso:
 *   node scripts/load-imperial-menu.js [--prod]
 *   (sin flag = usa la DB del .env; con --prod exige confirmacion adicional)
 *
 * Que hace, en orden seguro:
 *   1. Encuentra el tenant 'imperial'
 *   2. Borra Orders del tenant (cascade borra sus OrderItems) -> libera FK a Products
 *   3. Borra Products del tenant
 *   4. Borra Categories del tenant
 *   5. Crea 17 categorias + 148 productos (carta real, aplanada)
 *
 * NO toca otros tenants (demo, etc). Todo filtrado por tenantId de imperial.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SLUG = 'imperial';

const CARTA = [
  { cat: "Promoción", productos: [
    { name: "Promo Original 4Latas", price: 12000, description: "SOLO PARA LLEVAR. 4 Latas de Cervecería Original a elección. * Válido solo pagando con efectivo o transferencia." },
    { name: "Promo Pizzapleto", price: 6500, description: "Elige tu pizzapleto favorito + schop de cerveza de la casa (Cervecería Original) por solo $6.500" },
  ]},
  { cat: "Cervecería Original en Barril", productos: [
    { name: "Summer Ale Schop Cervecería Original", price: 4500, description: "Es una cerveza de color dorado intenso. En sabor es dulce suave, en perfecto equilibrio con el amargor del lúpulo. Ligera y refrescante. 4 ABV 12 IBU" },
    { name: "James Brown Schop Cervecería Original", price: 4500, description: "Brown Ale de nombre artístico James Brown. Cerveza de color oscuro, de cuerpo medio a bajo, con más malta que lúpulo, lo que le da un sabor tostado, achocolatado, a caramelo o toffee. 6 ABV 30 IBU" },
    { name: "JagerBrown Schop Cervecería Original", price: 4900, description: "JagerBrown = es nuestra clásica Brown Ale con Jägermeister y un proceso de maduración en frío. Los alcoholes se complementan y afinan, dando una mezcla brutal!" },
    { name: "EPA Schop Cervecería Original", price: 4500, description: "Nuestra EPA English Pale Ale o Pale Ale inglesa es una cerveza de color dorado oscuro, relativamente ligera y deliciosamente refrescante. Equilibrio perfecto de cebada malteada y lúpulo, sabor moderadamente afrutado acaramelado y cuerpo completo." },
    { name: "Calafate Pinta 473cc Cervecería Original", price: 4500, description: "Cerveza de color ámbar oscuro y un aroma intenso propio del calafate, un fruto de color negro azulado de sabor dulce y con propiedades antioxidantes proveniente de la Patagonia. 4 ABV 20 IBU" },
    { name: "Red Ale Schop Cervecería Original", price: 4500, description: "La Red Ale, conocida también como Irish red ale, es un tipo de cerveza ale original de Irlanda. Su ligero color rojo es debido al tostado de la cebada además de la malta. 4 ABV 30 IBU" },
    { name: "Brigitte Pinta 473cc Cervecería Original", price: 5000, description: "Indian Pale Lager - IPL. Estilo American Pale Ale. Es una IPA fermentada con levadura lager pero que experimenta un lupulado de American IPA. Cerveza equilibrada hacia el lúpulo, de color dorado y final más bien seco. ABV 6 IBU 50" },
    { name: "Cheetara Schop Cervecería Original", price: 4500, description: "La Cheetara es una IPA de estilo inglés, impregnada de tradición y de lúpulo adicional. Aroma cítrico y maltosidad agradable. 6 ABV 55 IBU" },
    { name: "Barley Wine Copa 473cc Cervecería Original", price: 5500, description: "Nuestra Barley Wine es una cerveza fuerte, con cuerpo, inmensamente maltosa y compleja, pero equilibrada con el amargor, aroma y sabor del lúpulo. Estilo: Barley Wine 10% ABV. Premios: Copa Cervezas de América 2022, Copa Nacional de cervezas Chile 2022" },
    { name: "Stout Cacho de cabra Schop Original", price: 5500, description: "Una cerveza negra de cuerpo pleno con intensas notas a café y chocolate amargo. La adición de ají cacho de cabra aporta un aroma ahumado y distintivo y un picor sutil, equilibrando el dulzor de la malta." },
  ]},
  { cat: "Invitadas en Barril", productos: [
    { name: "Y gracias por los lúpulos Pinta 473cc", price: 6200, description: "Nace cuando todavía éramos Craft, llamándose 'Hasta Pronto y gracias por los lúpulos', por el disco de NoFX. Fue nuestra primera IPA y best seller. West Coast IPA de muchísima tomabilidad, amargor alto pero de corta duración, con aromas a frutas tropicales, pino y cítricos. 6.3% Cervecería Hasta Pronto" },
    { name: "Intergalactic Pinta 473cc", price: 5500, description: "Intergalactic – HAZY IPA. Alcohol: 7°. Hazy IPA que destaca por su perfil altamente lupulado en sabor y aroma, de apariencia nubosa, sedosa y jugosa en boca, con notas de frutas tropicales: mango, maracuyá y notas resinosas." },
    { name: "El Retorno del IBU Pinta 473cc JESTER", price: 5500, description: "Una cerveza super lupulada, inspirada por las clásicas IPAs del pasado. Firme en su amargor, combinan aromas intensos a maracuyá, frutas tropicales y cítricas. Destaca lo cítrico, particularmente mandarinas. 6.2% Alc." },
    { name: "Kasteel Rouge copa 330cc KASTEEL", price: 5000, description: "Cerveza flamenca Meggyes al 8% Van Honsebrouck. Variante roja con sabor a fruta de las 'cervezas de castillo' de Inglemunster. Color rubí intenso y espuma rosada. Aroma dominado por la cereza y la almendra. Cuerpo delgado pero firme." },
    { name: "Kasteel Rouge 500cc KASTEEL", price: 6500, description: "Cerveza flamenca Meggyes al 8% Van Honsebrouck. Variante roja con sabor a fruta de las 'cervezas de castillo' de Inglemunster. Color rubí intenso y espuma rosada. Aroma dominado por la cereza y la almendra. Cuerpo delgado pero firme." },
    { name: "CortaCorriente Pinta 473cc TAMANGO", price: 5900, description: "CORTA CORRIENTE (Hazy IPA). Es la IPA emblema de Tamango Brebajes, se distingue por la intensidad del lúpulo fresco y tropical. Una verdadera explosión en tu boca. Estilo: Hazy IPA. ABV: 6%. Fermentación: Ale" },
    { name: "Tamango Triple Nectar Pinta 473cc", price: 6500, description: "Extra Juicy Triple Hazy IPA de 10% ABV. Con mayor expresividad de nuestra levadura New England. Color naranjo turbio, denso, jugoso con espuma blanca. Aromas a Uva Moscatel, Pepino dulce, Papaya y notas de Amaretto. ALTA JUGOSIDAD!" },
    { name: "KuraReggae Puesco Pinta 473cc", price: 5500, description: "Cerveza artesanal producida en Curarrehue, en la Araucanía, con toques a maracuyá. Con un sabor refrescante y tropical." },
    { name: "Alameda beer (pinta) CO CSM West Coast IPA", price: 5500, description: "La clásica IPA de Alameda Beer. Notas a pino, hierbas y cítricos gracias a sus abundantes lúpulos Citra, Simcoe y Mosaic: CSM! Ganó oro en los World Beer Awards 2023 en la categoría IPA - American Style. ABV: 7,0% IBU: 70. Origen: Santiago. Formato: Lata 473ml" },
  ]},
  { cat: "Coctelería Cervecera de la perra", productos: [
    { name: "Chelada de la casa", price: 6000, description: "Nuestra cerveza Summer Ale de 4ABV, borde de sal y jugo de limón." },
    { name: "Michelada de la casa", price: 6200, description: "Nuestra cerveza Summer Ale de 4 ABV, borde de sal y merkén, jugo de limón, salsa tabasco y salsa inglesa" },
    { name: "Mojito Mango", price: 6000, description: "Mojito elaborado con nuestra cerveza Summer Ale, pulpa de mango, goma, limón, menta y hielo frappé." },
    { name: "Summer LOVE 2.0", price: 5500, description: "Cóctel elaborado con nuestra Summer Ale de siempre, granadina, jugo de limón, goma, menta y hielo frappé." },
    { name: "Mojito ¿Cómo me dijiste?", price: 6000, description: "Nuestra Summer ale de siempre, limón, menta, goma, pulpa de maracuyá y hielo frappé. Mojito de Cerveza." },
    { name: "Mojito Andai Fresco!", price: 6000, description: "Nuestra Summer Ale de siempre, limón, menta, goma y hielo frappé. Mojito de Cerveza." },
    { name: "Mojito Frambuesa", price: 6000, description: "Nuestra Summer Ale de siempre, limón, menta, goma, pulpa de frambuesa y hielo frappé. Mojito de Cerveza." },
    { name: "Mojito s/alcohol", price: 6000, description: "Agua gasificada, limón, menta, goma y hielo frappé." },
    { name: "Summer RED BULL", price: 6000, description: "Cerveza Summer Ale acompañada de RedBull tradicional." },
    { name: "Maracu Summer", price: 4900, description: "Nuestra cerveza Summer, pulpa de maracuyá, goma, hielo frappé." },
  ]},
  { cat: "Cervezas Sin Alcohol", productos: [
    { name: "Clausthaler Original S/A Bot. 330ml", price: 3700, description: "Contenido: 330 cc. País de Origen: Alemania. Graduación Alcohólica: 0.0°" },
    { name: "Gingerbeer LATA 473cc", price: 4000, description: "Fermentado de Jengibre con propiedades antiinflamatorias y de recuperación para entrenamientos duros." },
    { name: "Maisels Weisse 500cc Sin Alcohol", price: 4500, description: "Ofrece un sabor equilibrado, refrescante y tradicional, destacando también por sus variantes sin alcohol y dunkel." },
    { name: "Jamaicano", price: 3900, description: "Bebida refrescante sin alcohol. Infusión de Flor de Jamaica con un dulzor y acidez justa." },
  ]},
  { cat: "Cervezas del Refri", productos: [
    { name: "Summer Ale Lata 473cc Cervecería Original", price: 4200, description: "Nuestra Summer Ale es una cerveza de color dorado intenso. Sabor dulce suave, en perfecto equilibrio con el amargor del lúpulo. Aroma con notas florales, herbales y sutilmente especiadas. 4 ABV 12 IBU" },
    { name: "Cheetara Lata 473cc Cervecería Original", price: 4200, description: "¿Porque Cheetara? Color anaranjado, muy rápida para beberla y entera rica! Nuestra Ipa es altamente lupulada, amarga y sabrosa. Tiene 6% de puro poder felino y 50 de IBU." },
    { name: "James Brown Lata 473cc Cervecería Original", price: 4200, description: "Nuestra Brown Ale de nombre artístico James Brown, cerveza de color oscuro, de cuerpo medio a bajo, con más malta que lúpulo, sabor tostado, achocolatado, a caramelo o toffee. 6 ABV 30 IBU" },
    { name: "EPA Lata 473cc Cervecería Original", price: 4200, description: "Nuestra EPA English Pale Ale o Pale Ale inglesa, cerveza de color dorado oscuro, relativamente ligera y deliciosamente refrescante. Equilibrio perfecto de cebada malteada y lúpulo, con notas cítricas." },
    { name: "Bundor Belzeboo - lata 470cc", price: 5900, description: "Destaca por su profundo color negro, cuerpo pleno y textura sedosa. En nariz y boca despliega un intenso carácter caluroso acompañado de marcadas notas a cacao, café expreso, ciruelas maduras y frutos secos. ABV: 11.0% IBU: 65" },
    { name: "Cuello Negro Stout - lata 470cc", price: 5500, description: "Galardonada cerveza artesanal chilena nacida en Valdivia. Destaca por su color negro profundo, espuma densa y un robusto perfil con notas intensas a chocolate amargo, café tostado y frutos secos. AVB: 8.0% IBU: 56" },
    { name: "Delirium Red - Botella 330cc", price: 5500, description: "Cerveza frutal, elaborada con Malta de cebada, cilantro, lúpulo Hallertau Brewers Gold y diferentes tipos de frutos rojos. De color rojo oscuro. En boca es dulce y frutal con un leve sabor ácido debido a las cerezas." },
    { name: "Kasteel Nitro Rouge Lata 330cc", price: 4800, description: "ABV: 7%. La Kasteel Rouge es una mezcla única de la Kasteel Donker y cerezas maceradas. Color rubí, espuma y sabor dulce dan como resultado una cerveza especial con sabor equilibrado y toques sutiles de cerezas." },
    { name: "Michelob 79Calorias 355cc Lata", price: 4000, description: "Cerveza ultra ligera, con tan solo 96 calorías y 2.6 gramos de carbohidratos. Sutiles notas cítricas, provenientes de un proceso natural de elaboración." },
    { name: "Nothus Coffe Stout - Lata 473cc", price: 5900, description: "Nuestra Lillo Stout es una cerveza negra de avena con adición de café Boliviano y nibs de cacao. ABV: 5,6% IBU: 30" },
    { name: "Corta Corriente Tamango lata 355cc", price: 5000, description: "Toda la intensidad del lúpulo fresco y tropical que se mezcla para crear este jugo balanceado y adictivo. ABV 6.0" },
    { name: "Red Nose Tamango lata 355cc", price: 5000, description: "Una Strong Festive Ale, especiada y madurada con cubos de roble. En nariz tiene notas a maraschino, bourbon, clavo de olor y sutiles notas a café. ABV 8,5" },
    { name: "Calafate lata 473cc Cervecería Original", price: 5500, description: "Cerveza de color ámbar oscuro y un aroma intenso propio del calafate, un fruto de color negro azulado de sabor dulce y con propiedades antioxidantes proveniente de la Patagonia. 4 ABV 20 IBU" },
    { name: "Kasteel Nitro Quad 330 Lata", price: 4000, description: "Cerveza belga de estilo Quadrupel que se distingue por su técnica de infusión con nitrógeno, textura suave y cremosa. Color oscuro y rica cabeza de espuma. Notas claras de caramelo, toffee y chocolate." },
    { name: "Societe Brewing Butcher Imperial Stout de 9.666% ABV", price: 6900, description: "La Societe Brewing Butcher Imperial Stout es una cerveza robusta y compleja, clasificada como una Imperial Stout, estilo originario de Inglaterra. Alta graduación alcohólica y mayor contenido de lúpulo." },
    { name: "JagerBrown LATA 473cc", price: 5500, description: "JagerBrown = es nuestra clásica Brown Ale con Jägermeister y un proceso de maduración en frío. Los alcoholes se complementan y afinan, dando una mezcla brutal! AHORA EN LATA!" },
    { name: "Rare Fog Riwaka Triple Hazy IPA", price: 8500, description: "ABV 10%. Rare Fog Riwaka forma parte de la máxima expresión dentro de la icónica serie de IPAs de Abomination. Una Triple Hazy IPA de 10% ABV triplemente lupulada con Riwaka." },
    { name: "Wandering Into the Fog Zamba", price: 7900, description: "Doble Hazy IPA DH Zamba de Abomination, esta vez con un masivo dry hop de Zamba!" },
    { name: "Maris Goes Nuts English Barleywine", price: 9700, description: "ABV 13%. Elaborada en colaboración con Horus Aged Ales (CA, USA) y Mindful Ales (NJ, USA). Acondicionada con una mezcla de almendras tostadas y nueces." },
    { name: "Imperial Biscotti Break Evil Twin", price: 8200, description: "ABV 11,5%. Color negro profundo con espuma marrón. Aromas a café, cacao, caramelo y maltas tostadas. Sabores a caramelo, café, chocolate, vainilla y galletas de amaretto. Cuerpo completo." },
    { name: "Noa Pecan Mud Cake", price: 9900, description: "ABV 11% IBU 60. Concebida pensando en un cremoso Brownie. Aromas a chocolate belga, frutos secos, vainilla, avellanas, café. En boca predomina el dulzor con un leve amargor. Gruesa, rica y excesivamente decadente!" },
    { name: "In Plenty Almond Coffee Omnipollo", price: 9900, description: "Serie de Imperial Stouts, densas y exquisitas, inspiradas en pasteles. Stout inspirada en un pastel de café con almendras, llena de vainilla y café con almendras, con notas tostadas y a frutos secos, rematada con cremoso relleno de vainilla." },
    { name: "Velvet Divorce Lata 355cc TAMANGO", price: 5100, description: "Cerveza de nuestra serie de cervezas Checas, esta vez con 'Velvet Divorce', una Czech Amber Lager que honra el divorcio suave entre República Checa y Eslovaquia en 1991. LATA 355cc 5,5% ABV" },
    { name: "Hablo contigo y me da sed Lata 473ml INTERGALACTIC", price: 5500, description: "Irish Red Ale diseñada para ser muy fácil de beber. Cerveza roja marcadamente maltosa, notas dulces a caramelo, toffee y corteza de pan. Cuerpo bajo y final seco con tostado suave." },
    { name: "No lo sé Rick West coast ipa LATA 473ml INTERGALACTIC", price: 5500, description: "Session West Coast IPA. Tapizada en lúpulos de tomabilidad infinita. Notas cítricas, resinosas y frutas tropicales. Alcohol: 4,5° IBU: 50. Formato: Lata 475cc" },
    { name: "Reto roki amber", price: 4500, description: "Equilibrio entre maltas y lúpulos. Notas a caramelo, toffee y pan tostado provenientes de las maltas especiales, complementadas por un fondo leve a frutos secos. El lúpulo aporta un carácter floral y levemente cítrico." },
    { name: "Reto black stout", price: 4500, description: "BLACK OUT (Foreign Extra Stout). Despertará todos tus sentidos con sus notas intensas de grano tostado, café y chocolate oscuro. Cremosidad en boca. Estilo: Foreign Extra Stout. ABV: 6,5% IBU: 35. Formato: Lata 473 cc" },
    { name: "Reto American Ipa", price: 5500, description: "Una mordida directa del Pacífico. IPA con todo el carácter de la costa oeste Estadounidense, intensamente lupulada y de final seco. Notas de papaya, pomelo, mango y resina fresca. Estilo: American IPA. ABV: 6,4% IBU: 43. Formato: Lata 473 cc" },
    { name: "Reto Matriusk", price: 5800, description: "MATRIUSKA (Russian Imperial Stout). Una RIS intensa hecha en colaboración con Santa Cebada. Complejidad, cuerpo pleno y perfil tostado profundo. La adición de avena redondea la textura. ABV: 8,5% IBU: 60. Formato: Lata 473 cc" },
    { name: "Reto Noise", price: 5000, description: "NOISE (Bohemian Pilsner). Bohemian Pilsner, oda a los beats del Lower East Side de Manhattan. Cuerpo suave, amargor elegante, refrescante. Estilo: Bohemian Pilsner. ABV: 5,4% IBU: 37. Formato: Lata 473 cc" },
    { name: "PRE EMERGENCIA lata (Hazy IPA) cervecería Alameda", price: 5500, description: "New England IPA ultra turbia, extremadamente sedosa en boca, acompañada de una inmensa cantidad de lúpulos. Estilo: Hazy IPA. ABV: 6,0% IBU: 30. Origen: Santiago. Formato: Lata 473 cc" },
    { name: "CSM TURBIO lata cervecería Alameda", price: 5500, description: "Cerveza de color amarillo pálido y apariencia opaca (turbia), textura sedosa en boca. Intensos aromas y sabores a frutas tropicales como mango y maracuyá. Estilo: Hazy IPA. ABV: 6,0% IBU: 30. Formato: Lata 473 cc" },
    { name: "LÍNEA 1 lata (Amber Ale) cervecería Alameda", price: 5300, description: "Una Amber Ale roja como las venas que atraviesan el subsuelo santiaguino. Cerveza acaramelada, de tonos cobrizos y complejo perfil de maltas. Estilo: American Amber Ale. ABV: 5,5% IBU: 19. Origen: Santiago. Formato: Lata 473cc" },
    { name: "Black Neon Tetra LATA 355cc", price: 5000, description: "Cerveza extremadamente refrescante, seca y de amargor punzante, donde destaca el uso de lúpulo Nelson Sauvin, aportando notas a uva blanca y resina. ABV: 6.5% IBU: 60. Estilo: West Coast IPA" },
    { name: "La Montaña Yuta - Botella 330cc", price: 3900, description: "Color cobre profundo y gran nitidez traslúcida. En boca destaca por un marcado pero equilibrado carácter ahumado con notas a madera, tocino, caramelo oscuro, nueces y pasas. Cuerpo medio. ABV: 5.6% IBU: 20" },
    { name: "Fisura Robust Porter El Regreso - Lata 470cc", price: 5500, description: "Robust Porter de Valdivia. Color marrón oscuro, espuma cremosa y cuerpo sedoso por la avena. Notas a chocolate amargo, cacao puro y café. ABV: 6.0% IBU: 40" },
    { name: "Porter Tequila Cumbres del Ranco - Botella 330cc", price: 4900, description: "Galardonada Imperial Porter originaria de Lago Ranco. Moderadamente fuerte, color oscuro, perfil tostado de notas a chocolate, vainilla y madera de roble. Maduración con tequila aporta aroma complejo. ABV: 11.0% IBU: 30" },
    { name: "Mad Charlie's Imperial Stout - lata 470cc", price: 5500, description: "Potente y estructurada variedad artesanal de Valdivia. Color marrón oscuro profundo, aspecto turbio y generosa espuma beige. Cuerpo intenso y sedoso, aromas y sabores a malta tostada, cacao puro y café expreso. ABV: 8.2% IBU: 60" },
    { name: "La Condená Porter - Lata 470cc", price: 5500, description: "Variedad artesanal de Chiloé con perfil clásico y amigable. Color negro oscuro con matices caoba, espuma beige cremosa y amargor medio-bajo. Notas tradicionales a café, cacao amargo y caramelo tostado. ABV: 6.0% IBU: 20-25" },
  ]},
  { cat: "Bebidas, Jugos, Té, Café", productos: [
    { name: "Agua Mineral Con Gas", price: 1800, description: "Agua Mineral con Gas. Preguntar por marca disponible." },
    { name: "Agua Mineral Sin Gas", price: 1800, description: "Agua Mineral Sin Gas. Preguntar por marca disponible." },
    { name: "Lata Coca Cola Normal 220ml", price: 1900, description: "Lata Coca Cola Normal 220cc" },
    { name: "Lata Coca Cola Zero 220ml", price: 1900, description: "Coca Cola Zero 220cc" },
    { name: "Fanta Normal 350cc", price: 2300, description: null },
    { name: "Limonada", price: 3500, description: "Limonada menta - jengibre" },
    { name: "Redbull energy drink", price: 3300, description: "Red Bull Energy Drink 250ml" },
    { name: "Lata Sprite zero 220ml", price: 1900, description: "Disfruta el sabor de tu bebida Sprite Sin Azúcar" },
    { name: "Lata Sprite normal 220ml", price: 1900, description: null },
    { name: "Taza de te", price: 1500, description: "Te" },
    { name: "Coca cola normal 350ml", price: 2300, description: null },
    { name: "Coca cola zero 350ml", price: 2300, description: null },
    { name: "Sprite normal 350ml", price: 2300, description: null },
    { name: "Red bull sugar free 250ml", price: 3300, description: "Red Bull Sugarfree es una bebida energética sin azúcar - 350ml" },
    { name: "Red Bull Yellow Edition", price: 3300, description: "Red Bull Yellow Edition es una bebida energética con un refrescante sabor a frutas tropicales - 350ml" },
  ]},
  { cat: "Almuerzos", productos: [
    { name: "Arroz Pollo Camarón", price: 8900, description: "Arroz, huevo, cebollín, champiñón, pollo y camarón." },
    { name: "Carne mechada c/ agr", price: 10500, description: "Carne de Mechada con dos acompañamientos. Puedes elegir entre papas fritas, arroz o ensalada." },
    { name: "Ensalada Veggie Summer", price: 7200, description: "Ensalada de lechuga, champiñón, trozos de queso vegano, tomate cherry y trozos de hamburguesa de porotos negros elaborada en nuestro bar. SEGÚN DISPONIBILIDAD." },
    { name: "Ensalada mixta", price: 4000, description: "Ensalada de lechuga, tomate y palta. SEGÚN DISPONIBILIDAD." },
    { name: "Salteado de carne al plato", price: 8500, description: "Carne con verduras salteadas, arroz y papas fritas. Al mismísimo estilo de nuestros queridos vecinos pe!" },
    { name: "Pechuga a la plancha con agreg.", price: 7600, description: "Pechuga de pollo a la plancha con dos acompañamientos. Puedes elegir entre papas fritas, arroz o ensaladas." },
    { name: "Pechuga Champiñón", price: 7900, description: "Pechuga a la plancha con salsa champiñón con dos acompañamientos. Puedes elegir entre arroz, papas fritas o ensalada." },
    { name: "Pechuga Mostaza", price: 7900, description: "Pechuga a la plancha con salsa a la mostaza con dos acompañamientos. Puedes elegir entre arroz, papas fritas o ensalada." },
    { name: "Spaghetti pollo a la crema", price: 8100, description: "Spaghetti a la crema, pollo, champiñón, cebollín y queso." },
    { name: "Adicional dos Huevos", price: 1200, description: "2 unidades de huevo frito." },
    { name: "Spaghetti Carne Salteada", price: 9100, description: "Spaghetti con lomo salteado con cebolla morada, pimentón y tomate en concasé." },
  ]},
  { cat: "Chorrillanas", productos: [
    { name: "Chorrillana Clásica", price: 13900, description: "Papas fritas acompañadas de exquisita carne de vacuno, longaniza y cebolla caramelizada, más dos huevos fritos." },
    { name: "Chorrillana del mar", price: 16500, description: "Papas fritas acompañada de un mix de carne de vacuno, pollo y camarones con un toque de crema, champiñones y cebollín." },
    { name: "Chorrillana Estilo Peruano", price: 14300, description: "Papas fritas acompañadas de exquisita carne de res en trozos, tomate, cebolla y pimentón. Además del toque especial con condimentos imperiales." },
    { name: "Chorrillana Pollo a la Crema", price: 14900, description: "Papas fritas acompañadas de trozos de pechuga de pollo, crema, queso fundido, cebollín, champiñón y ciboulette." },
    { name: "Chorrillana Champichoclo", price: 12900, description: "Papas fritas acompañadas de nuestra exquisita mezcla de crema con champiñón, cebollín y choclo." },
  ]},
  { cat: "Frituras", productos: [
    { name: "Canasto Fritanga", price: 7300, description: "Papas fritas acompañadas de 4 aritos de cebolla y 4 empanaditas de queso." },
    { name: "Canasto Empanadas de Queso", price: 5200, description: "8 unidades de empanaditas de queso." },
    { name: "Papas Cheddar", price: 9400, description: "Nuestras clásicas papas fritas, ricas y crujientes con mucho queso cheddar para chuparse los dedos." },
    { name: "Porción aros de cebolla", price: 4000, description: "8 crujientes aritos de cebolla." },
    { name: "Canasto Papas Fritas", price: 6500, description: null },
    { name: "Papas Cheddar y Bacon", price: 10900, description: "Papas Fritas con cheddar fundido y trocitos de bacon para chuparse los dedos." },
    { name: "Papas rústicas", price: 6900, description: "Papas rústicas doradas, acompañadas de salsa de cilantro, salsa picante, salsa sour. Puedes elegir topping de tocino crujiente o queso cheddar" },
  ]},
  { cat: "Quesadillas", productos: [
    { name: "Quesadilla Carne", price: 10400, description: "Tortillas de trigo rellenas de carne de res, mix de pimentones y queso gouda fundido." },
    { name: "Quesadilla de pollo", price: 8900, description: "Tortillas de trigo rellenas de trozos de pollo, mix de pimentones y queso gouda fundido." },
    { name: "Quesadilla Verduras Salteadas", price: 7900, description: "Quesadillas rellenas con un mix de verduras salteadas. Puedes pedirlas con queso gouda o queso vegano. La elección es tuya!" },
    { name: "Tortillas Campestre", price: 9400, description: "Tortillas rellenas con carne mechada, lechuga, palta, choclo y mayonesa casera." },
  ]},
  { cat: "Tablas", productos: [
    { name: "Crudo Don Benito", price: 12900, description: "Nuestro crudo imperial carne de res cocida al limón con la receta secreta del Bar. Acompañado de mayonesa casera, ají en trozos, cebolla morada y crujientes pancitos para untar." },
    { name: "Tabla Mar y Tierra", price: 16500, description: "Tabla Mix de carne, pollo, verduras, papas fritas, salmón ahumado, camarones en salsa blanca. Ideal para compartir en pareja." },
    { name: "Degusta Crudo", price: 2900, description: "3 Tapitas de crudo de la casa para degustar" },
    { name: "Crudo Don Benito Individual", price: 6500, description: "El clásico de la casa en formato individual: crudo al limón, mayo casera, cebolla morada, ají y pancitos crujientes." },
  ]},
  { cat: "Pizzas", productos: [
    { name: "Pizza BBQ", price: 9900, description: "Masa artesanal de 25 a 30cm. Queso, cebolla caramelizada, salsa BBQ y tocino." },
    { name: "Pizza Carne Mechada", price: 12900, description: "Masa artesanal de 25 a 30cm. Carne mechada, pimentón, champiñón y aceitunas." },
    { name: "Pizza Don Benito", price: 11500, description: "Masa artesanal de 25 a 30cm. Con nuestro crudo especial de la casa, junto a una capa contundente de queso. (Crudo, cebolla morada, ají verde)" },
    { name: "Pizza Hawaii", price: 9900, description: "Masa artesanal de 25 a 30cm. Queso, trozos de piña, tocino y cebolla caramelizada." },
    { name: "Pizza Margarita", price: 8900, description: "Masa artesanal de 25 a 30cm. Queso, albahaca, tomate cherry y champiñón." },
    { name: "PIZZA Pollo Camarón", price: 12400, description: "Masa artesanal de 25 a 30cm. Pollo, camarones, cebolla y tomate cherry." },
    { name: "Pizza pepperoni", price: 8900, description: "Deliciosa pizza con masa artesanal. Queso mozzarella y abundantes rodajas de pepperoni." },
    { name: "Pesto y abrazos pizza", price: 10500, description: "Rica masa artesanal de 25 a 30cm. Pollo, camarón y salsa al pesto, recomendación del día. (La salsa pesto contiene Almendras)" },
    { name: "Pizza Cabra QLA", price: 10900, description: "Masa de 25 a 30cm. Queso cabra, salsa de tomate, cebolla caramelizada, salteado champiñones y tomate cherry" },
  ]},
  { cat: "Hamburguesas", productos: [
    { name: "Hamburguesa BBQ", price: 9800, description: "Hamburguesa 200gr, cebolla caramelizada, queso cheddar, Aros de cebolla fritos, tocino y salsa bbq. Acompañada de papas fritas." },
    { name: "Hamburguesa Imperial", price: 9900, description: "Hamburguesa 200gr, Lechuga, tomate, mayo casera, cebolla morada, queso y pepinillo. Acompañada de papas fritas." },
    { name: "Hamburguesa Italiana", price: 10500, description: "Hamburguesa 200gr, Palta, tomate, mayonesa de la casa. Acompañada de papas fritas." },
    { name: "Hamburguesa Luco", price: 9200, description: "Hamburguesa casera de 200g, quesito mantecoso. Acompañada de papas fritas." },
    { name: "Hamburguesa Original", price: 9900, description: "Hamburguesa, cebolla caramelizada, queso cheddar, aros de cebolla y champiñón. Acompañada de papas fritas." },
    { name: "Hamburguesa Mc Cuarto imperial", price: 9900, description: "Hamburguesa 200gr, queso cheddar, pepinillos, cebolla morada, mayonesa. Acompañada de papas fritas." },
  ]},
  { cat: "Sandwich", productos: [
    { name: "Sandwich Mechada LUCO", price: 9500, description: "Jugosa carne desmechada de vacuno, montada en marraqueta calientita y crujiente acompañada con queso mantecoso y papas fritas" },
    { name: "Sandwich Mechada IMPERIAL", price: 10500, description: "Jugosa carne desmechada de vacuno, montada en marraqueta calientita y crujiente acompañada de lechuga, tomate, mayo casera, cebolla morada, queso, pepinillo y acompañada de papas fritas" },
    { name: "Sandwich mechada ITALIANA", price: 10900, description: "Jugosa carne desmechada de vacuno, montada en marraqueta calientita y crujiente acompañada de palta, tomate, mayonesa de la casa. Acompañada de papas fritas" },
  ]},
  { cat: "Completos", productos: [
    { name: "Pizzapleto Brutal de Carne", price: 5450, description: "Completo de masa de pizza, carne mechada, mayonesa de la casa, cebolla caramelizada, queso derretido y tocino crujiente" },
    { name: "Pizzapleto Dinamico Imperial", price: 4450, description: "Clásico completo con vienesa, tomate, palta, chucrut, salsa americana y mayonesa, servido en nuestro pan de masa de pizza." },
    { name: "Pizzapleto L'Originale", price: 4450, description: "El clásico completo italiano con vienesa, tomate, palta y mayonesa casera, servido en nuestro pan de masa de pizza artesanal." },
    { name: "Pizzapleto El Tentacion", price: 4450, description: "Pollo apanado crujiente, lechuga, pepinillos y cebolla morada, acompañado de mayonesa casera en nuestro característico pan de pizzapleto." },
  ]},
  { cat: "Growler", productos: [
    { name: "Growler 3.8 Litros", price: 10000, description: "Growler de 3.8 Litros vacío. Un Growler es un recipiente, en este caso de vidrio para transportar cerveza y rellenarlo." },
    { name: "Growler 1.9 Litros", price: 7000, description: "Growler de 1.9 Litros vacío. Un Growler es un recipiente, en este caso de vidrio para transportar cerveza y rellenarlo." },
    { name: "Growler 1 Litro", price: 6000, description: "Growler de 1 Litro vacío. Un Growler es un recipiente, en este caso de vidrio para transportar cerveza y rellenarlo." },
    { name: "Relleno Growler 3.8L", price: 20000, description: "Relleno de Growler de 3.8 litros para llevar con cervezas de la casa según disponibilidad. Pregunta qué estilos están disponibles para el relleno." },
    { name: "Relleno Growler 1.9 Litros", price: 11000, description: "Relleno de Growler de 1.9 litros para llevar con cervezas de la casa según disponibilidad. Pregunta qué estilos están disponibles para el relleno." },
    { name: "Relleno Growler 1 Litro", price: 6000, description: "Relleno de Growler de 1 Litro para llevar con cervezas de la casa según disponibilidad. Pregunta qué estilos están disponibles para el relleno." },
  ]},
];

async function main() {
  const isProd = process.argv.includes('--prod');
  console.log('\n=========================================');
  console.log('  CARGA CARTA IMPERIAL ' + (isProd ? '(PROD!)' : '(dev)'));
  console.log('=========================================');

  const tenant = await prisma.tenant.findUnique({ where: { slug: SLUG } });
  if (!tenant) { console.error('ERROR: no se encontro el tenant ' + SLUG); process.exit(1); }
  console.log('  Tenant: ' + tenant.name + ' (' + tenant.id + ')');

  const totalProd = CARTA.reduce((a, c) => a + c.productos.length, 0);
  console.log('  A cargar: ' + CARTA.length + ' categorias, ' + totalProd + ' productos');

  const result = await prisma.$transaction(async (tx) => {
    const delOrders = await tx.order.deleteMany({ where: { tenantId: tenant.id } });
    const delProducts = await tx.product.deleteMany({ where: { tenantId: tenant.id } });
    const delCats = await tx.category.deleteMany({ where: { tenantId: tenant.id } });

    let catCount = 0, prodCount = 0;
    for (let i = 0; i < CARTA.length; i++) {
      const c = CARTA[i];
      const category = await tx.category.create({
        data: { tenantId: tenant.id, name: c.cat, sortOrder: i, isActive: true },
      });
      catCount++;
      const productsData = c.productos.map((p, j) => ({
        tenantId: tenant.id,
        categoryId: category.id,
        name: p.name,
        description: p.description || null,
        price: p.price,
        isAvailable: true,
        sortOrder: j,
      }));
      const created = await tx.product.createMany({ data: productsData });
      prodCount += created.count;
    }
    return { delOrders: delOrders.count, delProducts: delProducts.count, delCats: delCats.count, catCount, prodCount };
  }, { maxWait: 15000, timeout: 60000 });

  console.log('  ----------------------------------------');
  console.log('  Borrados: ' + result.delOrders + ' orders, ' + result.delProducts + ' products, ' + result.delCats + ' categories');
  console.log('  Creados:  ' + result.catCount + ' categorias, ' + result.prodCount + ' productos');
  console.log('  OK Carta cargada.');
  console.log('=========================================\n');
}

main()
  .catch((e) => { console.error('FALLO:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

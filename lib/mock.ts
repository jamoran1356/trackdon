// Mock data — placeholders until the real DB queries land.
// All shapes mirror the public views in supabase/migrations/0002_rls.sql.

export const mockTotales = {
  total_donaciones_usd: 142_350,
  cantidad_donaciones: 1_283,
  centros_activos: 18,
  influencers_activos: 7,
  damnificados_registrados: 412,
  total_rendido_usd: 96_120
};

export const mockCentros = [
  { id: 'c1', nombre: 'Centro Norte', tipo: 'fisico', items: 1280, ultimo: '2 min', estado: 'activo' },
  { id: 'c2', nombre: 'Botica Solidaria', tipo: 'comprador_medicamentos', items: 84, ultimo: '14 min', estado: 'activo' },
  { id: 'c3', nombre: 'Centro Este', tipo: 'fisico', items: 612, ultimo: '1 h', estado: 'activo' },
  { id: 'c4', nombre: 'Centro Sur', tipo: 'fisico', items: 305, ultimo: '3 h', estado: 'activo' }
];

export const mockInfluencers = [
  { id: 'i1', nombre: '@anonimo1', recibido: 12_300, rendido: 11_800, pendiente: 500 },
  { id: 'i2', nombre: '@anonimo2', recibido: 8_400, rendido: 4_900, pendiente: 3_500 },
  { id: 'i3', nombre: '@anonimo3', recibido: 3_120, rendido: 3_120, pendiente: 0 }
];

export const mockDonacionesPublicas = [
  { id: 'd1', donante: 'Ana M.', descripcion: 'Caja de medicinas (paracetamol, suero)', tipo: 'bienes', valor: 80, centro: 'Centro Norte', estado: 'distribuida', creado: '13 min' },
  { id: 'd2', donante: 'Anónimo', descripcion: 'Transferencia USDC', tipo: 'dinero_cripto', valor: 250, centro: '@anonimo1', estado: 'en_transito', creado: '24 min' },
  { id: 'd3', donante: 'Carlos R.', descripcion: '5 cajas de agua', tipo: 'bienes', valor: 35, centro: 'Centro Este', estado: 'recibida', creado: '1 h' },
  { id: 'd4', donante: 'Familia P.', descripcion: 'Zelle', tipo: 'dinero_fiat', valor: 120, centro: '@anonimo2', estado: 'recibida', creado: '1 h' },
  { id: 'd5', donante: 'Sofía G.', descripcion: 'Ropa de niño (2-6 años)', tipo: 'bienes', valor: 40, centro: 'Centro Sur', estado: 'pendiente', creado: '2 h' }
];

export const mockCentroInventario = [
  { id: 'it1', tipo: 'Agua (litros)', total: 480, ingresados: 540, salidos: 60 },
  { id: 'it2', tipo: 'Pañales (paquetes)', total: 32, ingresados: 40, salidos: 8 },
  { id: 'it3', tipo: 'Medicamentos genéricos', total: 215, ingresados: 250, salidos: 35 },
  { id: 'it4', tipo: 'Comida no perecedera (kg)', total: 612, ingresados: 700, salidos: 88 }
];

export const mockInfluencerRendiciones = [
  { id: 'r1', concepto: 'Compra medicamentos · farmacia X', monto: 320, destino: 'compra_insumos', estado: 'verificado', creado: '20 min' },
  { id: 'r2', concepto: 'Transferencia a Centro Norte', monto: 800, destino: 'transferencia_centro', estado: 'verificado', creado: '1 h' },
  { id: 'r3', concepto: 'Compra pañales y leche', monto: 145, destino: 'compra_insumos', estado: 'pendiente_verif', creado: '3 h' }
];


import axios from 'axios'
import type { Producto } from './admin/productos/productos.types'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_URL,
})

// ==========================================
// SERVICIOS
// ==========================================

export interface MaterialServicioBackend {
  producto:
  | string
  | {
    _id: string
    nombre: string
    codigo: string
    unidadMedida: string
    precioCompra?: number
    stock?: number
    activo?: boolean
  }
  cantidad: number
}

export interface ServicioBackend {
  _id: string
  nombreServicio: string
  descripcionServicio: string
  precioServicio: number
  monedaServicio: string
  disponible?: boolean
  materiales?: MaterialServicioBackend[]
}

export interface ServicioNuevo {
  nombreServicio: string
  descripcionServicio: string
  precioServicio: number
  monedaServicio: string
  disponible?: boolean
  materiales?: {
    producto: string
    cantidad: number
  }[]
}

export async function getServicios(): Promise<ServicioBackend[]> {
  const { data } = await api.get<ServicioBackend[]>('/servicios')
  return data
}

export async function createServicio(
  datos: ServicioNuevo,
): Promise<ServicioBackend> {
  const { data } = await api.post<ServicioBackend>('/servicios', datos)
  return data
}

export async function updateServicio(
  id: string,
  datos: Partial<ServicioNuevo>,
): Promise<ServicioBackend> {
  const { data } = await api.patch<ServicioBackend>(
    `/servicios/${id}`,
    datos,
  )
  return data
}

export async function deleteServicio(id: string): Promise<void> {
  await api.delete(`/servicios/${id}`)
}

// ==========================================
// CLIENTES
// ==========================================

export interface ClienteBackend {
  _id: string
  ci: string
  nombre: string
  apellidos: string
  telefono: string
  edad?: number
  direccion?: string
}

export interface ClienteNuevo {
  ci: string
  nombre: string
  apellidos: string
  telefono: string
  edad?: number
  direccion?: string
}

export async function getClientes(): Promise<ClienteBackend[]> {
  const { data } = await api.get<ClienteBackend[]>('/cliente')
  return data
}

export async function getClientePorCi(
  ci: string,
): Promise<ClienteBackend> {
  const { data } = await api.get<ClienteBackend>(
    `/cliente/ci/${encodeURIComponent(ci)}`,
  )
  return data
}

export async function createCliente(
  datos: ClienteNuevo,
): Promise<ClienteBackend> {
  const { data } = await api.post<ClienteBackend>('/cliente', datos)
  return data
}

export async function updateCliente(
  id: string,
  datos: Partial<ClienteNuevo>,
): Promise<ClienteBackend> {
  const { data } = await api.patch<ClienteBackend>(
    `/cliente/${id}`,
    datos,
  )
  return data
}

export async function deleteCliente(id: string): Promise<void> {
  await api.delete(`/cliente/${id}`)
}


// ==========================================
// CITAS
// ==========================================

export interface MaterialConsumidoBackend {
  producto: string
  nombre: string
  codigo: string
  cantidad: number
  precioUnitario: number
  costoTotal: number
}

export interface CitaBackend {
  _id: string
  cliente: string
  servicio: string
  fecha: string

  estadoAtencion?: 'pendiente' | 'realizada' | 'cancelada'
  estadoPago?: 'pendiente' | 'pagado'

  precioCobrado?: number
  monedaCobro?: string | null
  fechaRealizacion?: string | null

  materialesConsumidos?: MaterialConsumidoBackend[]
}

export interface CitaNueva {
  cliente: string
  servicio: string
  fecha: string
}

export type CitaActualizacion = Partial<CitaNueva>

export async function getCitas(): Promise<CitaBackend[]> {
  const { data } = await api.get<CitaBackend[]>('/cita')
  return data
}

export async function crearCita(
  cita: CitaNueva,
): Promise<CitaBackend> {
  const { data } = await api.post<CitaBackend>('/cita', cita)
  return data
}

export async function updateCita(
  id: string,
  datos: CitaActualizacion,
): Promise<CitaBackend> {
  const { data } = await api.patch<CitaBackend>(
    `/cita/${id}`,
    datos,
  )
  return data
}

export async function deleteCita(id: string): Promise<void> {
  await api.delete(`/cita/${id}`)
}

// Marcar una cita como realizada.
// El backend descuenta los materiales y guarda el historial.

export async function realizarCita(
  id: string,
): Promise<CitaBackend> {
  const { data } = await api.patch<CitaBackend>(
    `/cita/${id}/realizar`,
  )
  return data
}

// Registrar el importe realmente cobrado por una cita realizada.

export async function registrarPagoCita(
  id: string,
  precioCobrado: number,
): Promise<CitaBackend> {
  const { data } = await api.patch<CitaBackend>(
    `/cita/${id}/pagar`,
    { precioCobrado },
  )

  return data
}


// ==========================================
// MONEDAS
// ==========================================

export interface MonedaBackend {
  _id: string
  tipoMoneda: string
}

export interface MonedaNueva {
  tipoMoneda: string
}

export async function getMonedas(): Promise<MonedaBackend[]> {
  const { data } = await api.get<MonedaBackend[]>('/moneda')
  return data
}

export async function createMoneda(
  datos: MonedaNueva,
): Promise<MonedaBackend> {
  const { data } = await api.post<MonedaBackend>('/moneda', datos)
  return data
}

export async function updateMoneda(
  id: string,
  datos: Partial<MonedaNueva>,
): Promise<MonedaBackend> {
  const { data } = await api.patch<MonedaBackend>(
    `/moneda/${id}`,
    datos,
  )
  return data
}

export async function deleteMoneda(id: string): Promise<void> {
  await api.delete(`/moneda/${id}`)
}

// ==========================================
// CONFIGURACIÓN
// ==========================================

export interface HorarioBackend {
  days: string
  hours: string
}

export interface ConfiguracionBackend {
  _id?: string
  name: string
  address: string
  telephone: string
  email: string
  whatsapp: string
  whatsappUrl: string
  facebook: string
  instagram: string
  schedule: HorarioBackend[]
  maxCitasPorDia?: number
}

export async function getConfiguracion(): Promise<ConfiguracionBackend> {
  const { data } = await api.get<ConfiguracionBackend>('/configuracion')
  return data
}

export async function updateConfiguracion(
  config: Partial<ConfiguracionBackend>,
): Promise<ConfiguracionBackend> {
  const { data } = await api.patch<ConfiguracionBackend>(
    '/configuracion',
    config,
  )
  return data
}

// ==========================================
// DÍAS INHABILITADOS
// ==========================================

export interface DiaInhabilitadoBackend {
  _id: string
  fecha: string
}

export async function getDiasInhabilitados(): Promise<
  DiaInhabilitadoBackend[]
> {
  const { data } = await api.get<DiaInhabilitadoBackend[]>(
    '/dias-inhabilitados',
  )
  return data
}

export async function crearDiaInhabilitado(
  fecha: string,
): Promise<DiaInhabilitadoBackend> {
  const { data } = await api.post<DiaInhabilitadoBackend>(
    '/dias-inhabilitados',
    { fecha },
  )
  return data
}

export async function eliminarDiaInhabilitado(
  id: string,
): Promise<void> {
  await api.delete(`/dias-inhabilitados/${id}`)
}

// ==========================================
// PRODUCTOS
// ==========================================

export interface ProductoBackend {
  _id: string
  codigo: string
  nombre: string
  descripcion: string
  categoria: string
  unidadMedida: string
  precioCompra: number
  precioVenta: number
  stock: number
  stockMinimo: number
  activo: boolean
}

// Convierte el producto de MongoDB al tipo utilizado por React.
function convertirProducto(producto: ProductoBackend): Producto {
  return {
    id: producto._id,
    codigo: producto.codigo,
    nombre: producto.nombre,
    descripcion: producto.descripcion ?? '',
    categoria: producto.categoria,
    unidadMedida: producto.unidadMedida,
    precioCompra: Number(producto.precioCompra),
    precioVenta: Number(producto.precioVenta),
    stock: Number(producto.stock),
    stockMinimo: Number(producto.stockMinimo),
    activo: producto.activo,
  }
}

export async function getProductos(): Promise<Producto[]> {
  const { data } = await api.get<ProductoBackend[]>('/productos')
  return data.map(convertirProducto)
}

export async function createProducto(
  datos: Omit<Producto, 'id'>,
): Promise<Producto> {
  const { data } = await api.post<ProductoBackend>(
    '/productos',
    datos,
  )
  return convertirProducto(data)
}

// El stock se modifica desde compras y movimientos,
// no desde la edición normal del producto.
export async function updateProducto(
  id: string,
  datos: Partial<Omit<Producto, 'id' | 'stock'>>,
): Promise<Producto> {
  const { data } = await api.patch<ProductoBackend>(
    `/productos/${id}`,
    datos,
  )
  return convertirProducto(data)
}

export async function deleteProducto(id: string): Promise<void> {
  await api.delete(`/productos/${id}`)
}

// ==========================================
// CATEGORÍAS DEL INVENTARIO
// ==========================================

export interface CategoriaBackend {
  _id: string
  nombre: string
  descripcion: string
  activa: boolean
  createdAt?: string
  updatedAt?: string
}

export interface CategoriaNueva {
  nombre: string
  descripcion: string
  activa: boolean
}

export async function getCategorias(): Promise<CategoriaBackend[]> {
  const { data } = await api.get<CategoriaBackend[]>('/categorias')
  return data
}

export async function getCategoria(
  id: string,
): Promise<CategoriaBackend> {
  const { data } = await api.get<CategoriaBackend>(
    `/categorias/${id}`,
  )
  return data
}

export async function createCategoria(
  datos: CategoriaNueva,
): Promise<CategoriaBackend> {
  const { data } = await api.post<CategoriaBackend>(
    '/categorias',
    datos,
  )
  return data
}

export async function updateCategoria(
  id: string,
  datos: Partial<CategoriaNueva>,
): Promise<CategoriaBackend> {
  const { data } = await api.patch<CategoriaBackend>(
    `/categorias/${id}`,
    datos,
  )
  return data
}

export async function deleteCategoria(id: string): Promise<void> {
  await api.delete(`/categorias/${id}`)
}

// ==========================================
// MOVIMIENTOS
// ==========================================

export type TipoMovimiento = 'entrada' | 'salida'

export interface ProductoMovimientoBackend {
  _id: string
  codigo: string
  nombre: string
  categoria: string
  unidadMedida: string
}

export interface MovimientoBackend {
  _id: string
  producto: ProductoMovimientoBackend
  tipo: TipoMovimiento
  cantidad: number
  stockAnterior: number
  stockResultante: number
  motivo: string
  fechaMovimiento: string
  createdAt?: string
  updatedAt?: string
}

export interface MovimientoNuevo {
  producto: string
  tipo: TipoMovimiento
  cantidad: number
  motivo?: string
}

export interface MovimientoActualizado {
  motivo?: string
}

export interface FiltrosMovimientos {
  producto?: string
  tipo?: TipoMovimiento
  fechaDesde?: string
  fechaHasta?: string
}

export async function getMovimientos(
  filtros?: FiltrosMovimientos,
): Promise<MovimientoBackend[]> {
  const { data } = await api.get<MovimientoBackend[]>(
    '/movimientos',
    { params: filtros },
  )
  return data
}

export async function getMovimientoPorId(
  id: string,
): Promise<MovimientoBackend> {
  const { data } = await api.get<MovimientoBackend>(
    `/movimientos/${id}`,
  )
  return data
}

export async function createMovimiento(
  datos: MovimientoNuevo,
): Promise<MovimientoBackend> {
  const { data } = await api.post<MovimientoBackend>(
    '/movimientos',
    datos,
  )
  return data
}

export async function updateMovimiento(
  id: string,
  datos: MovimientoActualizado,
): Promise<MovimientoBackend> {
  const { data } = await api.patch<MovimientoBackend>(
    `/movimientos/${id}`,
    datos,
  )
  return data
}

// ==========================================
// COMPRAS
// ==========================================

export interface CompraProductoBackend {
  _id: string
  codigo: string
  nombre: string
  categoria: string
  unidadMedida: string
}

export interface CompraMonedaBackend {
  _id: string
  tipoMoneda: string
}

export interface CompraBackend {
  _id: string
  producto: CompraProductoBackend
  cantidad: number
  precioUnitario: number
  total: number
  moneda: CompraMonedaBackend
  monedaCodigo: string
  proveedor: string
  fechaCompra: string
  observaciones: string
  createdAt?: string
  updatedAt?: string
}

export interface CompraNueva {
  productoId: string
  cantidad: number
  precioUnitario: number
  monedaId: string
  proveedor?: string
  fechaCompra?: string
  observaciones?: string
}

export async function getCompras(): Promise<CompraBackend[]> {
  const { data } = await api.get<CompraBackend[]>('/compras')
  return data
}

export async function getCompra(
  id: string,
): Promise<CompraBackend> {
  const { data } = await api.get<CompraBackend>(
    `/compras/${id}`,
  )
  return data
}

export async function createCompra(
  datos: CompraNueva,
): Promise<CompraBackend> {
  const { data } = await api.post<CompraBackend>(
    '/compras',
    datos,
  )
  return data
}

export const formVacio = {
  nombre: '',
  descripcion: '',
  precio: '',
  moneda: '',
  disponible: true,
}

export const clienteVacio = {
  ci: '',
  nombre: '',
  apellidos: '',
  telefono: '',
  edad: '',
  direccion: '',
}

export const citaVacio = {
  cliente: '',
  servicio: '',
  fecha: '',
}

export interface ModalResultado {
  tipo: 'exito' | 'error'
  titulo: string
  mensaje: string
}

export const LOGIN_STORAGE_KEY = 'clinica-sonrisa-admin-login'
export const USUARIO = 'alex'
export const CONTRASEÑA = '1234'

export const OPCIONES_MENU = [
  { id: 'dashboard', label: 'Dashboard', icono: 'home' },
  { id: 'servicios', label: 'Servicios', icono: 'servicios' },
  { id: 'clientes', label: 'Clientes', icono: 'clientes' },
  { id: 'citas', label: 'Citas', icono: 'citas' },
  {
    id: 'inventario',
    label: 'Inventario',
    icono: 'entrada',
    submenu: [
      { id: 'productos', label: 'Productos' },
      { id: 'movimientos', label: 'Movimientos' },
    ],
  },
  { id: 'stock', label: 'Stock', icono: 'stock' },
] as const

export const OPCIONES_SECUNDARIAS = [
  { id: 'nomenclador', label: 'Nomenclador', icono: 'moneda' },
  { id: 'configuracion', label: 'Configuración', icono: 'config' },
] as const

export const NOMENCLADORES = [
  { id: 'monedas', label: 'Monedas' },
] as const

type SubmenuIds = {
  [K in keyof typeof OPCIONES_MENU]:
    (typeof OPCIONES_MENU)[K] extends { submenu: infer S }
      ? S extends readonly { id: infer Id }[]
        ? Id
        : never
      : never
}[keyof typeof OPCIONES_MENU]

export type Seccion =
  | (typeof OPCIONES_MENU)[number]['id']
  | Extract<SubmenuIds, string>
  | (typeof OPCIONES_SECUNDARIAS)[number]['id']

export function formatearFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-')
  return `${dia}/${mes}/${anio}`
}
export type EstadoStock = 'Disponible' | 'Stock bajo' | 'Agotado'

export interface Producto {
  id: string
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
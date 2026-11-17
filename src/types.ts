
export interface MaterialServicio {
  producto: string
  nombre?: string
  codigo?: string
  unidadMedida?: string
  cantidad: number
}

export interface Servicio {
  id: string
  nombre: string
  descripcion: string
  precio: number
  moneda: string
  disponible: boolean
  materiales: MaterialServicio[]
}

export interface Cita {
  ci: string
  nombre: string
  apellidos: string
  edad: string
  celular: string
  servicio: string
  fecha: string
}

export type Vista =
  | 'home'
  | 'servicios'
  | 'citas'
  | 'contactenos'
  | 'administrador'

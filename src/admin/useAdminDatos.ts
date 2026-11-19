
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  getServicios,
  getMonedas,
  getClientes,
  getCitas,
  getDiasInhabilitados,
  createServicio,
  updateServicio,
  deleteServicio,
  createCliente,
  updateCliente,
  deleteCliente,
  crearCita,
  deleteCita,
  updateCita,
  crearDiaInhabilitado,
  eliminarDiaInhabilitado,
  createMoneda,
  updateMoneda,
  deleteMoneda,
  realizarCita,
  registrarPagoCita as registrarPagoCitaApi,
} from '../api'

import type {
  CitaBackend,
  CitaNueva,
  CitaActualizacion,
  ClienteBackend,
  ClienteNuevo,
  DiaInhabilitadoBackend,
  MonedaBackend,
  ServicioBackend,
} from '../api'

import type { Servicio } from '../types'

import {
  CONTRASEÑA,
  LOGIN_STORAGE_KEY,
  USUARIO,
} from './admin'

import type {
  ModalResultado,
  Seccion,
} from './admin'

export function useAdminDatos() {
  const [autenticado, setAutenticado] = useState(
    () => localStorage.getItem(LOGIN_STORAGE_KEY) === 'true'
  )

  const [seccion, setSeccion] = useState<Seccion>('dashboard')

  const [servicios, setServicios] = useState<Servicio[]>([])
  const [serviciosBackend, setServiciosBackend] = useState<ServicioBackend[]>([])
  const [monedas, setMonedas] = useState<MonedaBackend[]>([])
  const [clientes, setClientes] = useState<ClienteBackend[]>([])
  const [citas, setCitas] = useState<CitaBackend[]>([])
  const [diasInhabilitados, setDiasInhabilitados] = useState<DiaInhabilitadoBackend[]>([])

  const [diaModal, setDiaModal] = useState<{
    fecha: string
    inhabilitado: boolean
  } | null>(null)

  const [guardandoDia, setGuardandoDia] = useState(false)
  const [datosCargados, setDatosCargados] = useState(false)
  const [cargandoDashboard, setCargandoDashboard] = useState(false)
  const [errorDashboard, setErrorDashboard] = useState('')
  const [revisionDashboard, setRevisionDashboard] = useState(0)

  const [modalConfig, setModalConfig] = useState<ModalResultado | null>(null)

  const fechasInhabilitadas = useMemo(
    () => new Set(diasInhabilitados.map((d) => d.fecha.slice(0, 10))),
    [diasInhabilitados]
  )

  const revisar = useCallback(() => {
    setRevisionDashboard((prev) => prev + 1)
  }, [])

  // ==========================================
  // CARGAR DATOS DEL BACKEND
  // ==========================================

  useEffect(() => {
    if (!autenticado) return

    let activo = true

    async function cargarDatos() {
      try {
        const [
          serviciosData,
          monedasData,
          clientesData,
          citasData,
          diasData,
        ] = await Promise.all([
          getServicios(),
          getMonedas(),
          getClientes(),
          getCitas(),
          getDiasInhabilitados(),
        ])

        if (!activo) return

        const monedaPorId = new Map(
          monedasData.map((m) => [m._id, m.tipoMoneda])
        )

        setMonedas(monedasData)
        setServiciosBackend(serviciosData)

        setServicios(
          serviciosData.map((s) => ({
            id: s._id,
            nombre: s.nombreServicio,
            descripcion: s.descripcionServicio,
            precio: s.precioServicio,
            moneda: monedaPorId.get(s.monedaServicio) ?? '',
            disponible: s.disponible !== false,

            materiales: (s.materiales ?? []).map((m) => {
              const producto =
                typeof m.producto === 'string'
                  ? null
                  : m.producto

              return {
                producto: producto?._id ?? m.producto as string,
                nombre: producto?.nombre,
                codigo: producto?.codigo,
                unidadMedida: producto?.unidadMedida,
                cantidad: m.cantidad,
              }
            }),
          }))
        )

        setClientes(clientesData)
        setCitas(citasData)
        setDiasInhabilitados(diasData)

        setDatosCargados(true)
        setErrorDashboard('')
      } catch {
        if (activo) {
          setErrorDashboard('No se pudo conectar con el backend.')
        }
      } finally {
        if (activo) {
          setCargandoDashboard(false)
        }
      }
    }

    setCargandoDashboard(true)

    cargarDatos()

    const intervalo = setInterval(cargarDatos, 10000)

    return () => {
      activo = false
      clearInterval(intervalo)
    }
  }, [autenticado, revisionDashboard])

  // ==========================================
  // AUTENTICACIÓN
  // ==========================================

  const iniciarSesion = useCallback(
    (usuario: string, contraseña: string): boolean => {
      if (usuario === USUARIO && contraseña === CONTRASEÑA) {
        localStorage.setItem(LOGIN_STORAGE_KEY, 'true')
        setAutenticado(true)
        return true
      }

      return false
    },
    []
  )

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(LOGIN_STORAGE_KEY)
    setAutenticado(false)
    setSeccion('dashboard')
  }, [])

  // ==========================================
  // MONEDAS
  // ==========================================

  const idMoneda = useCallback(
    (moneda: string) =>
      monedas.find((m) => m.tipoMoneda === moneda)?._id,
    [monedas]
  )

  const agregarMoneda = useCallback(async (nombre: string) => {
    await createMoneda({ tipoMoneda: nombre })
    revisar()
  }, [revisar])

  const modificarMoneda = useCallback(
    async (id: string, nombre: string) => {
      await updateMoneda(id, { tipoMoneda: nombre })
      revisar()
    },
    [revisar]
  )

  const eliminarMoneda = useCallback(
    async (id: string) => {
      await deleteMoneda(id)
      revisar()
    },
    [revisar]
  )

  // ==========================================
  // SERVICIOS
  // ==========================================

  const agregarServicio = useCallback(
    async (s: Omit<Servicio, 'id'>) => {
      const monedaServicio = idMoneda(s.moneda)

      if (!monedaServicio) {
        throw new Error('Moneda no válida')
      }

      await createServicio({
        nombreServicio: s.nombre,
        descripcionServicio: s.descripcion,
        precioServicio: s.precio,
        monedaServicio,
        disponible: s.disponible,
        materiales: (s.materiales ?? []).map((m) => ({
          producto: m.producto,
          cantidad: Number(m.cantidad),
        })),
      })

      revisar()
    },
    [idMoneda, revisar]
  )

  const modificarServicio = useCallback(
    async (s: Servicio) => {
      const monedaServicio = idMoneda(s.moneda)

      if (!monedaServicio) {
        throw new Error('Moneda no válida')
      }

      await updateServicio(s.id, {
        nombreServicio: s.nombre,
        descripcionServicio: s.descripcion,
        precioServicio: s.precio,
        monedaServicio,
        disponible: s.disponible,
        materiales: (s.materiales ?? []).map((m) => ({
          producto: m.producto,
          cantidad: Number(m.cantidad),
        })),
      })

      revisar()
    },
    [idMoneda, revisar]
  )

  const eliminarServicio = useCallback(
    async (id: string) => {
      await deleteServicio(id)
      revisar()
    },
    [revisar]
  )

  // ==========================================
  // CLIENTES
  // ==========================================

  const registrarCliente = useCallback(
    async (datos: ClienteNuevo) => {
      await createCliente(datos)
      revisar()
    },
    [revisar]
  )

  const modificarCliente = useCallback(
    async (id: string, datos: Partial<ClienteNuevo>) => {
      await updateCliente(id, datos)
      revisar()
    },
    [revisar]
  )

  const eliminarCliente = useCallback(
    async (id: string) => {
      await deleteCliente(id)
      revisar()
    },
    [revisar]
  )

  // ==========================================
  // CITAS
  // ==========================================

  const registrarCita = useCallback(
    async (cita: CitaNueva) => {
      await crearCita(cita)
      revisar()
    },
    [revisar]
  )

  const eliminarCita = useCallback(
    async (id: string) => {
      await deleteCita(id)
      revisar()
    },
    [revisar]
  )

  const modificarCita = useCallback(
    async (id: string, datos: CitaActualizacion) => {
      await updateCita(id, datos)
      revisar()
    },
    [revisar]
  )

  // Marcar una cita como realizada.
  // El backend descuenta los materiales y guarda su historial.
  const realizarCitaAdmin = useCallback(
    async (id: string) => {
      await realizarCita(id)
      revisar()
    },
    [revisar]
  )

  // Registrar el importe realmente cobrado por una cita realizada.
  const registrarPagoCita = useCallback(
    async (id: string, precioCobrado: number) => {
      await registrarPagoCitaApi(id, precioCobrado)
      revisar()
    },
    [revisar]
  )

  // ==========================================
  // DÍAS INHABILITADOS
  // ==========================================

  const abrirModalDia = useCallback(
    (fecha: string) => {
      setDiaModal({
        fecha,
        inhabilitado: fechasInhabilitadas.has(fecha),
      })
    },
    [fechasInhabilitadas]
  )

  const confirmarModalDia = useCallback(async () => {
    if (!diaModal) return

    setGuardandoDia(true)

    try {
      if (diaModal.inhabilitado) {
        const ids = diasInhabilitados
          .filter((d) => d.fecha.slice(0, 10) === diaModal.fecha)
          .map((d) => d._id)

        for (const id of ids) {
          await eliminarDiaInhabilitado(id)
        }
      } else {
        await crearDiaInhabilitado(diaModal.fecha)
      }

      const data = await getDiasInhabilitados()

      setDiasInhabilitados(data)
      setDiaModal(null)
    } catch {
      setModalConfig({
        tipo: 'error',
        titulo: 'No se pudo actualizar el día',
        mensaje: 'No se pudo conectar con el backend. Inténtalo de nuevo.',
      })
    } finally {
      setGuardandoDia(false)
    }
  }, [diaModal, diasInhabilitados])

  // ==========================================
  // DATOS DISPONIBLES PARA EL ADMINISTRADOR
  // ==========================================

  return {
    autenticado,
    iniciarSesion,
    cerrarSesion,

    seccion,
    setSeccion,

    servicios,
    serviciosBackend,
    monedas,
    clientes,
    citas,
    diasInhabilitados,
    fechasInhabilitadas,

    cargandoDashboard,
    errorDashboard,
    datosCargados,
    revisar,

    agregarServicio,
    modificarServicio,
    eliminarServicio,

    agregarMoneda,
    modificarMoneda,
    eliminarMoneda,

    registrarCliente,
    modificarCliente,
    eliminarCliente,

    registrarCita,
    modificarCita,
    eliminarCita,

    realizarCita: realizarCitaAdmin,
    registrarPagoCita,

    diaModal,
    guardandoDia,
    abrirModalDia,
    confirmarModalDia,
    setDiaModal,

    modalConfig,
    setModalConfig,
  }
}

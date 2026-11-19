
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import CalendarioCitas from '../components/CalendarioCitas'
import type {
  CitaBackend,
  CitaNueva,
  CitaActualizacion,
  ClienteBackend,
  ServicioBackend,
} from '../api'

import { citaVacio, formatearFecha } from './admin'
import { useContacto } from '../contactConfig'
import ConfirmarEliminacion from '../components/ConfirmarEliminacion'

const CITA_POR_PAGINA = 8

function obtenerMensajeError(
  error: any,
  mensajePredeterminado: string,
): string {
  const mensaje = error?.response?.data?.message

  if (Array.isArray(mensaje)) {
    return mensaje.join(', ')
  }

  return typeof mensaje === 'string'
    ? mensaje
    : mensajePredeterminado
}

// Validar importes con máximo dos decimales
function importeValido(importe: number): boolean {
  return (
    Number.isFinite(importe) &&
    importe >= 0 &&
    Math.abs(
      importe - Math.round(importe * 100) / 100,
    ) <= 1e-8
  )
}

// Campos del formulario de citas
function CamposCita({
  form,
  onCambiar,
  clientes,
  serviciosBackend,
  fechasInhabilitadas,
  citasPorDia,
  maxCitasPorDia,
}: {
  form: { cliente: string; servicio: string; fecha: string }
  onCambiar: (
    dato: Partial<{ cliente: string; servicio: string; fecha: string }>
  ) => void
  clientes: ClienteBackend[]
  serviciosBackend: ServicioBackend[]
  fechasInhabilitadas: Set<string>
  citasPorDia: Map<string, number>
  maxCitasPorDia: number
}) {
  return (
    <>
      <div className="campo">
        <label htmlFor="cita-cliente">Cliente</label>

        <select
          id="cita-cliente"
          required
          value={form.cliente}
          onChange={(e) => onCambiar({ cliente: e.target.value })}
        >
          <option value="" disabled>
            {clientes.length === 0
              ? 'No hay clientes registrados'
              : 'Selecciona un cliente'}
          </option>

          {clientes.map((c) => (
            <option key={c._id} value={c._id}>
              {c.ci} – {c.nombre} {c.apellidos}
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <label htmlFor="cita-servicio">Servicio</label>

        <select
          id="cita-servicio"
          required
          value={form.servicio}
          onChange={(e) => onCambiar({ servicio: e.target.value })}
        >
          <option value="" disabled>
            {serviciosBackend.length === 0
              ? 'No hay servicios registrados'
              : 'Selecciona un servicio'}
          </option>

          {serviciosBackend.map((s) => (
            <option key={s._id} value={s._id}>
              {s.nombreServicio}
            </option>
          ))}
        </select>
      </div>

      <div className="campo">
        <span className="campo-label">Fecha</span>

        <CalendarioCitas
          fechasInhabilitadas={fechasInhabilitadas}
          fechaSeleccionada={form.fecha}
          bloquearInhabilitados
          bloquearPasados
          citasPorDia={citasPorDia}
          maxCitasPorDia={maxCitasPorDia}
          onSeleccionarDia={(fecha) => onCambiar({ fecha })}
        />

        <p className="campo-ayuda">
          Los días en rojo están inhabilitados y los verdes están al máximo
          de cupos.{' '}
          {form.fecha
            ? `Fecha seleccionada: ${form.fecha}`
            : 'Selecciona un día del calendario.'}
        </p>
      </div>
    </>
  )
}

export default function CitasView({
  clientes,
  serviciosBackend,
  citas,
  fechasInhabilitadas,
  cargando,
  datosCargados,
  onRegistrarCita,
  onEliminarCita,
  onModificarCita,
  onRealizarCita,
  onRegistrarPago,
  onRevision,
  onMostrarModal,
}: {
  clientes: ClienteBackend[]
  serviciosBackend: ServicioBackend[]
  citas: CitaBackend[]
  fechasInhabilitadas: Set<string>
  cargando: boolean
  datosCargados: boolean

  onRegistrarCita: (cita: CitaNueva) => Promise<void>
  onEliminarCita: (id: string) => Promise<void>
  onModificarCita: (
    id: string,
    datos: CitaActualizacion
  ) => Promise<void>

  onRealizarCita: (id: string) => Promise<void>

  onRegistrarPago: (
    id: string,
    precioCobrado: number
  ) => Promise<void>

  onRevision: () => void
  onMostrarModal: (
    tipo: 'exito' | 'error',
    titulo: string,
    mensaje: string
  ) => void
}) {
  const { contacto } = useContacto()

  const [formCita, setFormCita] = useState(citaVacio)
  const [mostrarFormCita, setMostrarFormCita] = useState(false)
  const [guardandoCita, setGuardandoCita] = useState(false)

  const [citaAEliminar, setCitaAEliminar] =
    useState<CitaBackend | null>(null)

  const [citaAEditar, setCitaAEditar] =
    useState<CitaBackend | null>(null)

  const [formCitaEdit, setFormCitaEdit] = useState({ ...citaVacio })
  const [guardandoEdicionCita, setGuardandoEdicionCita] = useState(false)

  // Estados para registrar el pago
  const [citaAPagar, setCitaAPagar] =
    useState<CitaBackend | null>(null)

  const [importeCobrado, setImporteCobrado] = useState('')
  const [guardandoPago, setGuardandoPago] = useState(false)

  const [paginaCitas, setPaginaCitas] = useState(0)
  const [citaProcesando, setCitaProcesando] = useState<string | null>(null)

  // Realizar una cita y descontar los materiales
  async function manejarRealizarCita(cita: CitaBackend) {
    setCitaProcesando(cita._id)

    try {
      await onRealizarCita(cita._id)

      onRevision()

      onMostrarModal(
        'exito',
        'Servicio realizado',
        'La cita se marcó como realizada y los materiales fueron descontados del inventario.'
      )
    } catch (error: any) {
      onMostrarModal(
        'error',
        'No se pudo realizar el servicio',
        obtenerMensajeError(
          error,
          'Verifica el stock disponible y la conexión con el backend.'
        )
      )
    } finally {
      setCitaProcesando(null)
    }
  }

  // Abrir el modal de pago
  function abrirModalPago(cita: CitaBackend) {
    const servicio = serviciosBackend.find(
      (s) => s._id === cita.servicio
    )

    // Usar el importe guardado en la cita.
    // Si no existe, utilizar el precio del servicio.
    const precioInicial =
      cita.precioCobrado ?? servicio?.precioServicio ?? 0

    setCitaAPagar(cita)
    setImporteCobrado(String(precioInicial))
  }

  // Cerrar el modal de pago
  function cerrarModalPago() {
    if (guardandoPago) return

    setCitaAPagar(null)
    setImporteCobrado('')
  }

  // Registrar el importe realmente cobrado
  async function manejarRegistrarPago(e: FormEvent) {
    e.preventDefault()

    if (!citaAPagar) return

    const importe = Number(importeCobrado)

    if (
      importeCobrado.trim() === '' ||
      !importeValido(importe)
    ) {
      onMostrarModal(
        'error',
        'Importe incorrecto',
        'Introduce un importe válido, no negativo y con máximo dos decimales.'
      )
      return
    }

    setGuardandoPago(true)
    setCitaProcesando(citaAPagar._id)

    try {
      await onRegistrarPago(citaAPagar._id, importe)

      setCitaAPagar(null)
      setImporteCobrado('')

      onRevision()

      onMostrarModal(
        'exito',
        'Pago registrado',
        `El pago de ${importe.toFixed(2)} se registró correctamente.`
      )
    } catch (error: any) {
      onMostrarModal(
        'error',
        'No se pudo registrar el pago',
        obtenerMensajeError(
          error,
          'Verifica la conexión con el backend.'
        )
      )
    } finally {
      setGuardandoPago(false)
      setCitaProcesando(null)
    }
  }

  // Cerrar formulario de creación
  function cerrarFormCita() {
    setMostrarFormCita(false)
    setFormCita(citaVacio)
  }

  // Crear una cita
  async function manejarCrearCita(e: FormEvent) {
    e.preventDefault()

    if (!formCita.cliente || !formCita.servicio || !formCita.fecha) {
      return
    }

    setGuardandoCita(true)

    try {
      await onRegistrarCita({
        cliente: formCita.cliente,
        servicio: formCita.servicio,
        fecha: formCita.fecha,
      })

      setFormCita(citaVacio)
      setMostrarFormCita(false)

      onRevision()

      onMostrarModal(
        'exito',
        'Cita registrada',
        'La cita se registró correctamente.'
      )
    } catch (error: any) {
      onMostrarModal(
        'error',
        'Error al guardar',
        obtenerMensajeError(
          error,
          'No se pudo registrar la cita. Verifica el backend y que el cliente no tenga otra cita en esa fecha.'
        )
      )
    } finally {
      setGuardandoCita(false)
    }
  }

  // Confirmar eliminación
  async function confirmarEliminarCita() {
    if (!citaAEliminar) return

    try {
      await onEliminarCita(citaAEliminar._id)

      setCitaAEliminar(null)
      onRevision()

      onMostrarModal(
        'exito',
        'Cita eliminada',
        'La cita se eliminó correctamente.'
      )
    } catch (error: any) {
      onMostrarModal(
        'error',
        'Error al eliminar',
        obtenerMensajeError(
          error,
          'No se pudo eliminar la cita. Verifica que el backend esté disponible.'
        )
      )
    }
  }

  // Abrir formulario de edición
  function abrirEditarCita(cita: CitaBackend) {
    setCitaAEditar(cita)

    setFormCitaEdit({
      cliente: cita.cliente,
      servicio: cita.servicio,
      fecha: cita.fecha.slice(0, 10),
    })
  }

  // Cerrar formulario de edición
  function cerrarEditarCita() {
    setCitaAEditar(null)
    setFormCitaEdit({ ...citaVacio })
  }

  // Guardar cambios de una cita
  async function manejarGuardarCita(e: FormEvent) {
    e.preventDefault()

    if (!citaAEditar) return

    if (
      !formCitaEdit.cliente ||
      !formCitaEdit.servicio ||
      !formCitaEdit.fecha
    ) {
      return
    }

    setGuardandoEdicionCita(true)

    try {
      await onModificarCita(citaAEditar._id, {
        cliente: formCitaEdit.cliente,
        servicio: formCitaEdit.servicio,
        fecha: formCitaEdit.fecha,
      })

      cerrarEditarCita()
      onRevision()

      onMostrarModal(
        'exito',
        'Cita actualizada',
        'La cita se actualizó correctamente.'
      )
    } catch (error: any) {
      onMostrarModal(
        'error',
        'Error al guardar',
        obtenerMensajeError(
          error,
          'No se pudo modificar la cita. Verifica el backend y que el cliente no tenga otra cita en esa fecha.'
        )
      )
    } finally {
      setGuardandoEdicionCita(false)
    }
  }

  // Relacionar clientes y servicios con sus citas
  const clientePorId = new Map(
    clientes.map((c) => [c._id, `${c.nombre} ${c.apellidos}`])
  )

  const servicioPorId = new Map(
    serviciosBackend.map((s) => [s._id, s.nombreServicio])
  )

  // Contar citas por día
  const citasPorDia = new Map<string, number>()

  for (const cita of citas) {
    const fecha = cita.fecha.slice(0, 10)

    citasPorDia.set(
      fecha,
      (citasPorDia.get(fecha) ?? 0) + 1
    )
  }

  useEffect(() => {
    setPaginaCitas(0)
  }, [citas.length])

  // Paginación
  const totalPaginasCitas = Math.max(
    1,
    Math.ceil(citas.length / CITA_POR_PAGINA)
  )

  const paginaCitasSegura = Math.min(
    paginaCitas,
    totalPaginasCitas - 1
  )

  const inicioCitas = paginaCitasSegura * CITA_POR_PAGINA

  const citasVisibles = citas.slice(
    inicioCitas,
    inicioCitas + CITA_POR_PAGINA
  )

  return (
    <div className="admin-seccion">
      <div className="admin-section-header">
        <div>
          <h2>Citas</h2>
          <p className="page-subtitle">
            Administra las citas agendadas en la clínica.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => setMostrarFormCita(!mostrarFormCita)}
        >
          {mostrarFormCita ? 'Cerrar formulario' : '+ Agregar cita'}
        </button>
      </div>

      {/* Formulario para agregar cita */}
      {mostrarFormCita && (
        <div className="modal-overlay" onClick={cerrarFormCita}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Agregar cita</h2>

              <button
                className="modal-close"
                onClick={cerrarFormCita}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={manejarCrearCita}>
              <CamposCita
                form={formCita}
                onCambiar={(dato) =>
                  setFormCita((prev) => ({ ...prev, ...dato }))
                }
                clientes={clientes}
                serviciosBackend={serviciosBackend}
                fechasInhabilitadas={fechasInhabilitadas}
                citasPorDia={citasPorDia}
                maxCitasPorDia={contacto.maxCitasPorDia}
              />

              <div className="form-buttons">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardandoCita}
                >
                  {guardandoCita ? 'Guardando...' : 'Agregar cita'}
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={guardandoCita}
                  onClick={cerrarFormCita}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabla de citas */}
      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Atención</th>
              <th>Pago</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {citas.length === 0 ? (
              <tr>
                <td className="table-empty" colSpan={6}>
                  {cargando && !datosCargados
                    ? 'Cargando citas...'
                    : 'No hay citas registradas.'}
                </td>
              </tr>
            ) : (
              citasVisibles.map((cita) => {
                const estadoAtencion =
                  cita.estadoAtencion ?? 'pendiente'

                const estadoPago =
                  cita.estadoPago ?? 'pendiente'

                const procesando = citaProcesando === cita._id

                return (
                  <tr key={cita._id}>
                    <td>
                      {clientePorId.has(cita.cliente) ? (
                        clientePorId.get(cita.cliente)
                      ) : (
                        <span className="servicio-eliminado">
                          Cliente no disponible
                        </span>
                      )}
                    </td>

                    <td>
                      {servicioPorId.has(cita.servicio) ? (
                        servicioPorId.get(cita.servicio)
                      ) : (
                        <span className="servicio-eliminado">
                          Servicio eliminado
                        </span>
                      )}
                    </td>

                    <td>{formatearFecha(cita.fecha)}</td>

                    <td>
                      <span
                        className={`estado-cita estado-${estadoAtencion}`}
                      >
                        {estadoAtencion === 'realizada'
                          ? 'Realizada'
                          : estadoAtencion === 'cancelada'
                            ? 'Cancelada'
                            : 'Pendiente'}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`estado-pago estado-${estadoPago}`}
                      >
                        {estadoPago === 'pagado'
                          ? 'Pagado'
                          : 'Pendiente'}
                      </span>
                    </td>

                    <td>
                      <div className="servicio-acciones">
                        {estadoAtencion === 'pendiente' && (
                          <>
                            <button
                              type="button"
                              className="btn btn-small btn-outline"
                              onClick={() => abrirEditarCita(cita)}
                              title="Editar la cita"
                              disabled={procesando}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="btn btn-small btn-primary"
                              onClick={() => manejarRealizarCita(cita)}
                              disabled={procesando}
                            >
                              {procesando ? 'Procesando...' : 'Realizar'}
                            </button>

                            <button
                              type="button"
                              className="btn btn-small btn-danger"
                              onClick={() => setCitaAEliminar(cita)}
                              disabled={procesando}
                            >
                              Eliminar
                            </button>
                          </>
                        )}

                        {estadoAtencion === 'realizada' &&
                          estadoPago !== 'pagado' && (
                            <button
                              type="button"
                              className="btn btn-small btn-primary"
                              onClick={() => abrirModalPago(cita)}
                              disabled={procesando}
                            >
                              Registrar pago
                            </button>
                          )}

                        {estadoAtencion === 'realizada' &&
                          estadoPago === 'pagado' && (
                            <span className="campo-ayuda">
                              Servicio completado
                            </span>
                          )}

                        {estadoAtencion === 'cancelada' && (
                          <span className="campo-ayuda">
                            Cita cancelada
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Paginación */}
        {citas.length > CITA_POR_PAGINA && (
          <div className="grafico-paginacion">
            <button
              type="button"
              className="btn btn-small btn-outline"
              disabled={paginaCitasSegura === 0}
              onClick={() =>
                setPaginaCitas((p) => Math.max(0, p - 1))
              }
              aria-label="Anterior"
            >
              ←
            </button>

            <span className="grafico-pagina-info">
              {inicioCitas + 1}–
              {Math.min(
                inicioCitas + CITA_POR_PAGINA,
                citas.length
              )}{' '}
              de {citas.length}
            </span>

            <button
              type="button"
              className="btn btn-small btn-outline"
              disabled={
                paginaCitasSegura >= totalPaginasCitas - 1
              }
              onClick={() => setPaginaCitas((p) => p + 1)}
              aria-label="Siguiente"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Modal para registrar el importe realmente cobrado */}
      {citaAPagar && (
        <div
          className="modal-overlay"
          onClick={cerrarModalPago}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Registrar pago</h2>

              <button
                type="button"
                className="modal-close"
                onClick={cerrarModalPago}
                disabled={guardandoPago}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={manejarRegistrarPago}>
              <p>
                Cliente:{' '}
                <strong>
                  {clientePorId.get(citaAPagar.cliente) ??
                    'Cliente no disponible'}
                </strong>
              </p>

              <p>
                Servicio:{' '}
                <strong>
                  {servicioPorId.get(citaAPagar.servicio) ??
                    'Servicio no disponible'}
                </strong>
              </p>

              <div className="campo">
                <label htmlFor="importe-cobrado">
                  Importe realmente cobrado
                </label>

                <input
                  id="importe-cobrado"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={importeCobrado}
                  onChange={(e) =>
                    setImporteCobrado(e.target.value)
                  }
                  placeholder="Introduce el importe cobrado"
                  disabled={guardandoPago}
                  autoFocus
                />

                <p className="campo-ayuda">
                  El importe aparece inicialmente con el precio del
                  servicio, pero puedes modificarlo si cobraste más
                  o menos.
                </p>
              </div>

              <div className="form-buttons">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={
                    guardandoPago ||
                    importeCobrado.trim() === ''
                  }
                >
                  {guardandoPago
                    ? 'Registrando pago...'
                    : 'Confirmar pago'}
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={cerrarModalPago}
                  disabled={guardandoPago}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal reutilizable para confirmar eliminación */}
      <ConfirmarEliminacion
        abierto={!!citaAEliminar}
        titulo="Eliminar cita"
        textoConfirmar="Sí, eliminar"
        onCancelar={() => setCitaAEliminar(null)}
        onConfirmar={confirmarEliminarCita}
      >
        {citaAEliminar && (
          <p>
            ¿Estás seguro de que deseas borrar la cita del{' '}
            <strong>
              {clientePorId.get(citaAEliminar.cliente) ??
                citaAEliminar.cliente}
            </strong>{' '}
            del día{' '}
            <strong>
              {formatearFecha(citaAEliminar.fecha)}
            </strong>
            ?
          </p>
        )}
      </ConfirmarEliminacion>

      {/* Modal para editar cita */}
      {citaAEditar && (
        <div
          className="modal-overlay"
          onClick={cerrarEditarCita}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Editar cita</h2>

              <button
                className="modal-close"
                onClick={cerrarEditarCita}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <form onSubmit={manejarGuardarCita}>
              <CamposCita
                form={formCitaEdit}
                onCambiar={(dato) =>
                  setFormCitaEdit((prev) => ({ ...prev, ...dato }))
                }
                clientes={clientes}
                serviciosBackend={serviciosBackend}
                fechasInhabilitadas={fechasInhabilitadas}
                citasPorDia={citasPorDia}
                maxCitasPorDia={contacto.maxCitasPorDia}
              />

              <div className="form-buttons">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardandoEdicionCita}
                >
                  {guardandoEdicionCita
                    ? 'Guardando...'
                    : 'Guardar cambios'}
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={guardandoEdicionCita}
                  onClick={cerrarEditarCita}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

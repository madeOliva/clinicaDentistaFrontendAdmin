import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import CalendarioCitas from '../components/CalendarioCitas'
import type { CitaBackend, CitaNueva, ClienteBackend, ServicioBackend } from '../api'
import { citaVacio, formatearFecha } from './admin'
import { useContacto } from '../contactConfig'
import ConfirmarEliminacion from '../components/ConfirmarEliminacion'

const CITA_POR_PAGINA = 8

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
  onCambiar: (dato: Partial<{ cliente: string; servicio: string; fecha: string }>) => void
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
            {clientes.length === 0 ? 'No hay clientes registrados' : 'Selecciona un cliente'}
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
          Los días en rojo están inhabilitados y los verdes están al máximo de cupos.{' '}
          {form.fecha ? `Fecha seleccionada: ${form.fecha}` : 'Selecciona un día del calendario.'}
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
  onModificarCita: (id: string, datos: Partial<CitaNueva>) => Promise<void>
  onRevision: () => void
  onMostrarModal: (tipo: 'exito' | 'error', titulo: string, mensaje: string) => void
}) {
  const { contacto } = useContacto()
  const [formCita, setFormCita] = useState(citaVacio)
  const [mostrarFormCita, setMostrarFormCita] = useState(false)
  const [guardandoCita, setGuardandoCita] = useState(false)
  const [citaAEliminar, setCitaAEliminar] = useState<CitaBackend | null>(null)
  const [citaAEditar, setCitaAEditar] = useState<CitaBackend | null>(null)
  const [formCitaEdit, setFormCitaEdit] = useState({ ...citaVacio })
  const [guardandoEdicionCita, setGuardandoEdicionCita] = useState(false)
  const [paginaCitas, setPaginaCitas] = useState(0)

  function cerrarFormCita() {
    setMostrarFormCita(false)
    setFormCita(citaVacio)
  }

  async function manejarCrearCita(e: FormEvent) {
    e.preventDefault()
    if (!formCita.cliente || !formCita.servicio || !formCita.fecha) return

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
    } catch {
      onMostrarModal(
        'error',
        'Error al guardar',
        'No se pudo registrar la cita. Verifica el backend y que el cliente no tenga otra cita en esa fecha.',
      )
    } finally {
      setGuardandoCita(false)
    }
  }

  async function confirmarEliminarCita() {
    if (!citaAEliminar) return
    try {
      await onEliminarCita(citaAEliminar._id)
      setCitaAEliminar(null)
      onRevision()
    } catch {
      onMostrarModal(
        'error',
        'Error al eliminar',
        'No se pudo eliminar la cita. Verifica que el backend esté disponible.',
      )
    }
  }

  function abrirEditarCita(cita: CitaBackend) {
    setCitaAEditar(cita)
    setFormCitaEdit({
      cliente: cita.cliente,
      servicio: cita.servicio,
      fecha: cita.fecha.slice(0, 10),
    })
  }

  function cerrarEditarCita() {
    setCitaAEditar(null)
    setFormCitaEdit({ ...citaVacio })
  }

  async function manejarGuardarCita(e: FormEvent) {
    e.preventDefault()
    if (!citaAEditar) return
    if (!formCitaEdit.cliente || !formCitaEdit.servicio || !formCitaEdit.fecha) return

    setGuardandoEdicionCita(true)
    try {
      await onModificarCita(citaAEditar._id, {
        cliente: formCitaEdit.cliente,
        servicio: formCitaEdit.servicio,
        fecha: formCitaEdit.fecha,
      })
      cerrarEditarCita()
      onRevision()
      onMostrarModal('exito', 'Cita actualizada', 'La cita se actualizó correctamente.')
    } catch {
      onMostrarModal(
        'error',
        'Error al guardar',
        'No se pudo modificar la cita. Verifica el backend y que el cliente no tenga otra cita en esa fecha.',
      )
    } finally {
      setGuardandoEdicionCita(false)
    }
  }

  const clientePorId = new Map(clientes.map((c) => [c._id, `${c.nombre} ${c.apellidos}`]))
  const servicioPorId = new Map(serviciosBackend.map((s) => [s._id, s.nombreServicio]))

  const citasPorDia = new Map<string, number>()
  for (const cita of citas) {
    const fecha = cita.fecha.slice(0, 10)
    citasPorDia.set(fecha, (citasPorDia.get(fecha) ?? 0) + 1)
  }

  useEffect(() => {
    setPaginaCitas(0)
  }, [citas.length])

  const totalPaginasCitas = Math.max(1, Math.ceil(citas.length / CITA_POR_PAGINA))
  const paginaCitasSegura = Math.min(paginaCitas, totalPaginasCitas - 1)
  const inicioCitas = paginaCitasSegura * CITA_POR_PAGINA
  const citasVisibles = citas.slice(inicioCitas, inicioCitas + CITA_POR_PAGINA)

  return (
    <div className="admin-seccion">
      <div className="admin-section-header">
        <div>
          <h2>Citas</h2>
          <p className="page-subtitle">Administra las citas agendadas en la clínica.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setMostrarFormCita(!mostrarFormCita)}>
          {mostrarFormCita ? 'Cerrar formulario' : '+ Agregar cita'}
        </button>
      </div>

      {mostrarFormCita && (
        <div className="modal-overlay" onClick={cerrarFormCita}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Agregar cita</h2>
              <button className="modal-close" onClick={cerrarFormCita} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <form onSubmit={manejarCrearCita}>
              <CamposCita
                form={formCita}
                onCambiar={(dato) => setFormCita((prev) => ({ ...prev, ...dato }))}
                clientes={clientes}
                serviciosBackend={serviciosBackend}
                fechasInhabilitadas={fechasInhabilitadas}
                citasPorDia={citasPorDia}
                maxCitasPorDia={contacto.maxCitasPorDia}
              />

              <div className="form-buttons">
                <button type="submit" className="btn btn-primary" disabled={guardandoCita}>
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

      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {citas.length === 0 ? (
              <tr>
                <td className="table-empty" colSpan={4}>
                  {cargando && !datosCargados ? 'Cargando citas...' : 'No hay citas registradas.'}
                </td>
              </tr>
            ) : (
              citasVisibles.map((cita) => (
                <tr key={cita._id}>
                  <td>
                    {clientePorId.has(cita.cliente) ? (
                      clientePorId.get(cita.cliente)
                    ) : (
                      <span className="servicio-eliminado">Cliente no disponible</span>
                    )}
                  </td>
                  <td>
                    {servicioPorId.has(cita.servicio) ? (
                      servicioPorId.get(cita.servicio)
                    ) : (
                      <span className="servicio-eliminado">Servicio eliminado</span>
                    )}
                  </td>
                  <td>{formatearFecha(cita.fecha)}</td>
                  <td>
                    <div className="servicio-acciones">
                      <button
                        className="btn btn-small btn-outline"
                        onClick={() => abrirEditarCita(cita)}
                        title="Editar la cita"
                      >
                        Editar
                      </button>
                      <button
                        className="btn btn-small btn-danger"
                        onClick={() => setCitaAEliminar(cita)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {citas.length > CITA_POR_PAGINA && (
          <div className="grafico-paginacion">
            <button
              type="button"
              className="btn btn-small btn-outline"
              disabled={paginaCitasSegura === 0}
              onClick={() => setPaginaCitas((p) => Math.max(0, p - 1))}
              aria-label="Anterior"
            >
              ←
            </button>
            <span className="grafico-pagina-info">
              {inicioCitas + 1}–
              {Math.min(inicioCitas + CITA_POR_PAGINA, citas.length)} de {citas.length}
            </span>
            <button
              type="button"
              className="btn btn-small btn-outline"
              disabled={paginaCitasSegura >= totalPaginasCitas - 1}
              onClick={() => setPaginaCitas((p) => p + 1)}
              aria-label="Siguiente"
            >
              →
            </button>
          </div>
        )}
      </div>

      {/* Modal reutilizable para confirmar la eliminación */}
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
            </strong>?
          </p>
        )}
      </ConfirmarEliminacion>

      {citaAEditar && (
        <div className="modal-overlay" onClick={cerrarEditarCita}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar cita</h2>
              <button className="modal-close" onClick={cerrarEditarCita} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <form onSubmit={manejarGuardarCita}>
              <CamposCita
                form={formCitaEdit}
                onCambiar={(dato) => setFormCitaEdit((prev) => ({ ...prev, ...dato }))}
                clientes={clientes}
                serviciosBackend={serviciosBackend}
                fechasInhabilitadas={fechasInhabilitadas}
                citasPorDia={citasPorDia}
                maxCitasPorDia={contacto.maxCitasPorDia}
              />

              <div className="form-buttons">
                <button type="submit" className="btn btn-primary" disabled={guardandoEdicionCita}>
                  {guardandoEdicionCita ? 'Guardando...' : 'Guardar cambios'}
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
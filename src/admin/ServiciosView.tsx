
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getProductos } from '../api'
import type { MonedaBackend } from '../api'
import type { Servicio, MaterialServicio } from '../types'
import type { Producto } from './productos/productos.types'
import { formVacio } from './admin'
import ConfirmarEliminacion from '../components/ConfirmarEliminacion'

type FormularioServicio = typeof formVacio & {
  materiales: MaterialServicio[]
}

const formularioInicial: FormularioServicio = {
  ...formVacio,
  materiales: [],
}

const SERVICIO_POR_PAGINA = 8

export default function ServiciosView({
  servicios,
  monedas,
  cargando,
  datosCargados,
  onAgregarServicio,
  onModificarServicio,
  onEliminarServicio,
  onRevision,
  onMostrarModal,
}: {
  servicios: Servicio[]
  monedas: MonedaBackend[]
  cargando: boolean
  datosCargados: boolean
  onAgregarServicio: (s: Omit<Servicio, 'id'>) => Promise<void>
  onModificarServicio: (s: Servicio) => Promise<void>
  onEliminarServicio: (id: string) => Promise<void>
  onRevision: () => void
  onMostrarModal: (
    tipo: 'exito' | 'error',
    titulo: string,
    mensaje: string,
  ) => void
}) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [cargandoProductos, setCargandoProductos] = useState(false)
  const [errorProductos, setErrorProductos] = useState('')
  const [paginaServicios, setPaginaServicios] = useState(0)

  const [form, setForm] = useState<FormularioServicio>(formularioInicial)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [editando, setEditando] = useState<Servicio | null>(null)
  const [servicioAEliminar, setServicioAEliminar] =
    useState<Servicio | null>(null)
  const [formEdit, setFormEdit] =
    useState<FormularioServicio>(formularioInicial)

  // Cargar productos activos del inventario
  useEffect(() => {
    let activo = true

    async function cargarProductos() {
      try {
        setCargandoProductos(true)
        setErrorProductos('')

        const datos = await getProductos()

        if (activo) {
          setProductos(datos.filter((producto) => producto.activo))
        }
      } catch {
        if (activo) {
          setErrorProductos(
            'No se pudieron cargar los productos del inventario.',
          )
        }
      } finally {
        if (activo) {
          setCargandoProductos(false)
        }
      }
    }

    cargarProductos()

    return () => {
      activo = false
    }
  }, [])

  function cerrarFormulario() {
    setMostrarFormulario(false)
    setForm({ ...formularioInicial })
  }

  function agregarMaterial(
    materiales: MaterialServicio[],
    actualizar: (materiales: MaterialServicio[]) => void,
  ) {
    actualizar([
      ...materiales,
      {
        producto: '',
        cantidad: 1,
      },
    ])
  }

  function actualizarMaterial(
    materiales: MaterialServicio[],
    indice: number,
    cambios: Partial<MaterialServicio>,
    actualizar: (materiales: MaterialServicio[]) => void,
  ) {
    actualizar(
      materiales.map((material, i) =>
        i === indice ? { ...material, ...cambios } : material,
      ),
    )
  }

  function eliminarMaterial(
    materiales: MaterialServicio[],
    indice: number,
    actualizar: (materiales: MaterialServicio[]) => void,
  ) {
    actualizar(materiales.filter((_, i) => i !== indice))
  }

  // Crear servicio
  async function manejarEnvio(e: FormEvent) {
    e.preventDefault()

    const precio = Number(form.precio)

    if (!form.nombre.trim() || !Number.isFinite(precio) || precio < 0) {
      return
    }

    const materialesInvalidos = form.materiales.some(
      (m) =>
        !m.producto ||
        !Number.isFinite(Number(m.cantidad)) ||
        Number(m.cantidad) <= 0,
    )

    if (materialesInvalidos) {
      onMostrarModal(
        'error',
        'Materiales incompletos',
        'Selecciona un producto e indica una cantidad vÃ¡lida para cada material.',
      )
      return
    }

    try {
      await onAgregarServicio({
        nombre: form.nombre.trim(),
        descripcion: form.descripcion,
        precio,
        moneda: form.moneda || monedas[0]?.tipoMoneda || '',
        disponible: form.disponible,
        materiales: form.materiales.map((m) => ({
          producto: m.producto,
          cantidad: Number(m.cantidad),
        })),
      })

      setForm({ ...formularioInicial })
      setMostrarFormulario(false)
      onRevision()

      onMostrarModal(
        'exito',
        'Servicio guardado',
        'El servicio se guardÃ³ correctamente.',
      )
    } catch {
      onMostrarModal(
        'error',
        'Error al guardar',
        'No se pudo guardar el servicio. Verifica que el backend estÃ© disponible.',
      )
    }
  }

  // Abrir ediciÃ³n
  function abrirEditar(s: Servicio) {
    setEditando(s)

    setFormEdit({
      nombre: s.nombre,
      descripcion: s.descripcion,
      precio: String(s.precio),
      moneda: s.moneda,
      disponible: s.disponible,
      materiales: (s.materiales ?? []).map((m) => ({
        producto: m.producto,
        cantidad: m.cantidad,
      })),
    })
  }

  // Guardar ediciÃ³n
  async function guardarEdicion(e: FormEvent) {
    e.preventDefault()

    if (!editando) return

    const precio = Number(formEdit.precio)

    if (
      !formEdit.nombre.trim() ||
      !Number.isFinite(precio) ||
      precio < 0
    ) {
      return
    }

    const materialesInvalidos = formEdit.materiales.some(
      (m) =>
        !m.producto ||
        !Number.isFinite(Number(m.cantidad)) ||
        Number(m.cantidad) <= 0,
    )

    if (materialesInvalidos) {
      onMostrarModal(
        'error',
        'Materiales incompletos',
        'Selecciona un producto e indica una cantidad vÃ¡lida para cada material.',
      )
      return
    }

    try {
      await onModificarServicio({
        ...editando,
        nombre: formEdit.nombre.trim(),
        descripcion: formEdit.descripcion,
        precio,
        moneda: formEdit.moneda,
        disponible: formEdit.disponible,
        materiales: formEdit.materiales.map((m) => ({
          producto: m.producto,
          cantidad: Number(m.cantidad),
        })),
      })

      setEditando(null)
      setFormEdit({ ...formularioInicial })
      onRevision()

      onMostrarModal(
        'exito',
        'Servicio actualizado',
        'Los cambios del servicio se guardaron correctamente.',
      )
    } catch {
      onMostrarModal(
        'error',
        'Error al guardar',
        'No se pudo modificar el servicio. Verifica que el backend estÃ© disponible.',
      )
    }
  }

  // Eliminar servicio
  async function confirmarEliminarServicio() {
    if (!servicioAEliminar) return

    try {
      await onEliminarServicio(servicioAEliminar.id)

      setServicioAEliminar(null)
      onRevision()

      onMostrarModal(
        "exito",
        "Servicio eliminado",
        "El servicio se eliminó correctamente.",
      )
    } catch {
      onMostrarModal(
        "error",
        "Error al eliminar",
        "No se pudo eliminar el servicio. Verifica que el backend está disponible.",
      )
    }
  }

  function cancelar() {
    setEditando(null)
    setFormEdit({ ...formularioInicial })
  }

  useEffect(() => {
    setPaginaServicios(0)
  }, [servicios.length])

  const totalPaginasServicios = Math.max(1, Math.ceil(servicios.length / SERVICIO_POR_PAGINA))
  const paginaServiciosSegura = Math.min(paginaServicios, totalPaginasServicios - 1)
  const inicioServicios = paginaServiciosSegura * SERVICIO_POR_PAGINA
  const serviciosVisibles = servicios.slice(inicioServicios, inicioServicios + SERVICIO_POR_PAGINA)

  return (
    <div className="admin-seccion">
      <div className="admin-section-header">
        <div>
          <h2>Servicios</h2>
          <p className="page-subtitle">
            Administra los servicios que se muestran en la vista de servicios.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          {mostrarFormulario ? 'Cerrar formulario' : '+ Agregar servicio'}
        </button>
      </div>

      {/* FORMULARIO PARA AGREGAR */}
      {mostrarFormulario && (
        <div className="modal-overlay" onClick={cerrarFormulario}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Agregar servicio</h2>

              <button
                type="button"
                className="modal-close"
                onClick={cerrarFormulario}
                aria-label="Cerrar"
              >
                âœ•
              </button>
            </div>

            <form onSubmit={manejarEnvio}>
              <div className="campo">
                <label htmlFor="s-nombre">Nombre del servicio</label>
                <input
                  id="s-nombre"
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) =>
                    setForm({ ...form, nombre: e.target.value })
                  }
                  placeholder="Ej. Blanqueamiento dental"
                />
              </div>

              <div className="campo">
                <label htmlFor="s-desc">DescripciÃ³n</label>
                <textarea
                  id="s-desc"
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  placeholder="Breve descripciÃ³n del servicio"
                />
              </div>

              <div className="campo-row">
                <div className="campo">
                  <label htmlFor="s-precio">Precio</label>
                  <input
                    id="s-precio"
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={form.precio}
                    onChange={(e) =>
                      setForm({ ...form, precio: e.target.value })
                    }
                    placeholder="20"
                  />
                </div>

                <div className="campo">
                  <label htmlFor="s-moneda">Moneda</label>
                  <select
                    id="s-moneda"
                    value={form.moneda || monedas[0]?.tipoMoneda || ''}
                    onChange={(e) =>
                      setForm({ ...form, moneda: e.target.value })
                    }
                  >
                    {monedas.length === 0 ? (
                      <option value="" disabled>
                        No hay monedas registradas
                      </option>
                    ) : (
                      monedas.map((m) => (
                        <option key={m._id} value={m.tipoMoneda}>
                          {m.tipoMoneda}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="campo">
                <label htmlFor="s-disponible">Disponibilidad</label>
                <select
                  id="s-disponible"
                  value={form.disponible ? '1' : '0'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      disponible: e.target.value === '1',
                    })
                  }
                >
                  <option value="1">Disponible</option>
                  <option value="0">No disponible</option>
                </select>
              </div>

              <EditorMateriales
                materiales={form.materiales}
                productos={productos}
                cargando={cargandoProductos}
                error={errorProductos}
                onAgregar={() =>
                  agregarMaterial(form.materiales, (materiales) =>
                    setForm({ ...form, materiales }),
                  )
                }
                onActualizar={(indice, cambios) =>
                  actualizarMaterial(
                    form.materiales,
                    indice,
                    cambios,
                    (materiales) => setForm({ ...form, materiales }),
                  )
                }
                onEliminar={(indice) =>
                  eliminarMaterial(form.materiales, indice, (materiales) =>
                    setForm({ ...form, materiales }),
                  )
                }
              />

              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  Agregar servicio
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={cerrarFormulario}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LISTA DE SERVICIOS */}
      <div className="orders-table-wrap">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Servicio</th>
              <th>DescripciÃ³n</th>
              <th>Precio</th>
              <th>Disponibilidad</th>
              <th>Materiales</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {servicios.length === 0 ? (
              <tr>
                <td className="table-empty" colSpan={6}>
                  {cargando && !datosCargados
                    ? 'Cargando servicios...'
                    : 'No hay servicios registrados.'}
                </td>
              </tr>
            ) : (
              serviciosVisibles.map((s) => (
                <tr key={s.id}>
                  <td>{s.nombre}</td>
                  <td>{s.descripcion || 'â€”'}</td>
                  <td>{s.moneda} {s.precio}</td>
                  <td>
                    <span
                      className={`estado-servicio ${
                        s.disponible ? 'disponible' : 'no-disponible'
                      }`}
                    >
                      {s.disponible ? 'Disponible' : 'No disponible'}
                    </span>
                  </td>
                  <td>{s.materiales?.length ?? 0}</td>
                  <td>
                    <div className="servicio-acciones">
                      <button
                        type="button"
                        className="btn btn-small btn-outline"
                        onClick={() => abrirEditar(s)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-small btn-danger"
                        onClick={() => setServicioAEliminar(s)}
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

        {servicios.length > SERVICIO_POR_PAGINA && (
          <div className="grafico-paginacion">
            <button
              type="button"
              className="btn btn-small btn-outline"
              disabled={paginaServiciosSegura === 0}
              onClick={() => setPaginaServicios((p) => Math.max(0, p - 1))}
              aria-label="Anterior"
            >
              â€¹
            </button>
            <span className="grafico-pagina-info">
              {inicioServicios + 1}â€“{Math.min(inicioServicios + SERVICIO_POR_PAGINA, servicios.length)} de {servicios.length}
            </span>
            <button
              type="button"
              className="btn btn-small btn-outline"
              disabled={paginaServiciosSegura >= totalPaginasServicios - 1}
              onClick={() => setPaginaServicios((p) => p + 1)}
              aria-label="Siguiente"
            >
              â€º
            </button>
          </div>
        )}
      </div>

      {/* FORMULARIO PARA EDITAR */}
      {editando && (
        <div className="modal-overlay" onClick={cancelar}>
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Modificar servicio</h2>

              <button
                type="button"
                className="modal-close"
                onClick={cancelar}
                aria-label="Cerrar"
              >
                âœ•
              </button>
            </div>

            <form onSubmit={guardarEdicion}>
              <div className="campo">
                <label htmlFor="edit-nombre">Nombre del servicio</label>
                <input
                  id="edit-nombre"
                  type="text"
                  required
                  value={formEdit.nombre}
                  onChange={(e) =>
                    setFormEdit({ ...formEdit, nombre: e.target.value })
                  }
                  placeholder="Ej. Blanqueamiento dental"
                />
              </div>

              <div className="campo">
                <label htmlFor="edit-desc">DescripciÃ³n</label>
                <textarea
                  id="edit-desc"
                  value={formEdit.descripcion}
                  onChange={(e) =>
                    setFormEdit({ ...formEdit, descripcion: e.target.value })
                  }
                  placeholder="Breve descripciÃ³n del servicio"
                />
              </div>

              <div className="campo-row">
                <div className="campo">
                  <label htmlFor="edit-precio">Precio</label>
                  <input
                    id="edit-precio"
                    type="number"
                    required
                    min={0}
                    step="0.01"
                    value={formEdit.precio}
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, precio: e.target.value })
                    }
                    placeholder="20"
                  />
                </div>

                <div className="campo">
                  <label htmlFor="edit-moneda">Moneda</label>
                  <select
                    id="edit-moneda"
                    value={
                      monedas.some(
                        (m) => m.tipoMoneda === formEdit.moneda,
                      )
                        ? formEdit.moneda
                        : monedas[0]?.tipoMoneda || ''
                    }
                    onChange={(e) =>
                      setFormEdit({ ...formEdit, moneda: e.target.value })
                    }
                  >
                    {monedas.length === 0 ? (
                      <option value="" disabled>
                        No hay monedas registradas
                      </option>
                    ) : (
                      monedas.map((m) => (
                        <option key={m._id} value={m.tipoMoneda}>
                          {m.tipoMoneda}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div className="campo">
                <label htmlFor="edit-disponible">Disponibilidad</label>
                <select
                  id="edit-disponible"
                  value={formEdit.disponible ? '1' : '0'}
                  onChange={(e) =>
                    setFormEdit({
                      ...formEdit,
                      disponible: e.target.value === '1',
                    })
                  }
                >
                  <option value="1">Disponible</option>
                  <option value="0">No disponible</option>
                </select>
              </div>

              <EditorMateriales
                materiales={formEdit.materiales}
                productos={productos}
                cargando={cargandoProductos}
                error={errorProductos}
                onAgregar={() =>
                  agregarMaterial(formEdit.materiales, (materiales) =>
                    setFormEdit({ ...formEdit, materiales }),
                  )
                }
                onActualizar={(indice, cambios) =>
                  actualizarMaterial(
                    formEdit.materiales,
                    indice,
                    cambios,
                    (materiales) => setFormEdit({ ...formEdit, materiales }),
                  )
                }
                onEliminar={(indice) =>
                  eliminarMaterial(
                    formEdit.materiales,
                    indice,
                    (materiales) =>
                      setFormEdit({ ...formEdit, materiales }),
                  )
                }
              />

              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  Guardar cambios
                </button>

                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={cancelar}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA ELIMINAR */}
      <ConfirmarEliminacion
        abierto={!!servicioAEliminar}
        titulo="Eliminar servicio"
        textoConfirmar="SÃ­, eliminar"
        onCancelar={() => setServicioAEliminar(null)}
        onConfirmar={confirmarEliminarServicio}
      >
        {servicioAEliminar && (
          <p>
            Â¿EstÃ¡s seguro de que deseas borrar el servicio{' '}
            <strong>{servicioAEliminar.nombre}</strong>?
          </p>
        )}
      </ConfirmarEliminacion>
    </div>
  )
}

// COMPONENTE PARA SELECCIONAR MATERIALES
function EditorMateriales({
  materiales,
  productos,
  cargando,
  error,
  onAgregar,
  onActualizar,
  onEliminar,
}: {
  materiales: MaterialServicio[]
  productos: Producto[]
  cargando: boolean
  error: string
  onAgregar: () => void
  onActualizar: (
    indice: number,
    cambios: Partial<MaterialServicio>,
  ) => void
  onEliminar: (indice: number) => void
}) {
  return (
    <div className="campo">
      <h3>Materiales necesarios</h3>

      <p>
        Selecciona los productos y las cantidades que se utilizan
        para realizar este servicio.
      </p>

      {cargando && <p>Cargando productos...</p>}

      {error && <p className="error">{error}</p>}

      {!cargando && productos.length === 0 && !error && (
        <p>No hay productos activos en el inventario.</p>
      )}

      {materiales.map((material, indice) => (
        <div
          className="campo-row"
          key={`${indice}-${material.producto}`}
        >
          <div className="campo">
            <label>Producto</label>

            <select
              value={material.producto}
              onChange={(e) =>
                onActualizar(indice, { producto: e.target.value })
              }
              required
            >
              <option value="">Seleccionar producto</option>

              {productos.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.codigo} - {producto.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label>Cantidad</label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              required
              value={material.cantidad}
              onChange={(e) =>
                onActualizar(indice, {
                  cantidad:
                    e.target.value === '' ? 0 : Number(e.target.value),
                })
              }
            />
          </div>

          <button
            type="button"
            className="btn btn-danger"
            onClick={() => onEliminar(indice)}
          >
            Quitar
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-outline"
        onClick={onAgregar}
        disabled={productos.length === 0 || cargando}
      >
        + Agregar material
      </button>
    </div>
  )
}

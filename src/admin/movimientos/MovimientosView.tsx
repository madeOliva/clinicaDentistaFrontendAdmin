import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import './MovimientosView.css'
import { type MovimientoBackend, type TipoMovimiento, getProductos, getMovimientos, createMovimiento } from '../../api'
import DataTable, { type DataTableColumn } from '../productos/DataTable'
import type { Producto } from '../productos/productos.types'


export default function MovimientosView() {
  const [movimientos, setMovimientos] = useState<MovimientoBackend[]>([])
  const [productos, setProductos] = useState<Producto[]>([])

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [errorApi, setErrorApi] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')

  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [productoSeleccionado, setProductoSeleccionado] = useState('')
  const [tipoMovimiento, setTipoMovimiento] =
    useState<TipoMovimiento>('entrada')
  const [cantidad, setCantidad] = useState('')
  const [motivo, setMotivo] = useState('')

  const [filtroProducto, setFiltroProducto] = useState('Todos')
  const [filtroTipo, setFiltroTipo] = useState('Todos')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // Cargar productos y movimientos desde el backend.
  const cargarDatos = async () => {
    try {
      setCargando(true)
      setErrorApi('')

      const [productosCargados, movimientosCargados] =
        await Promise.all([
          getProductos(),
          getMovimientos(),
        ])

      setProductos(productosCargados)
      setMovimientos(movimientosCargados)
    } catch (error) {
      console.error('Error al cargar movimientos:', error)

      setErrorApi(
        'No se pudieron cargar los movimientos. Verifica la conexión con el servidor.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargarDatos()
  }, [])

  // Productos disponibles para registrar movimientos.
  const productosActivos = productos.filter(
    (producto) => producto.activo,
  )

  // Producto seleccionado actualmente.
  const productoActual = productos.find(
    (producto) => producto.id === productoSeleccionado,
  )

  // Filtrar el historial.
  const movimientosFiltrados = movimientos.filter((movimiento) => {
    const coincideProducto =
      filtroProducto === 'Todos' ||
      movimiento.producto?._id === filtroProducto

    const coincideTipo =
      filtroTipo === 'Todos' ||
      movimiento.tipo === filtroTipo

    const fechaMovimiento =
      movimiento.fechaMovimiento?.slice(0, 10) ?? ''

    const coincideFechaDesde =
      !fechaDesde || fechaMovimiento >= fechaDesde

    const coincideFechaHasta =
      !fechaHasta || fechaMovimiento <= fechaHasta

    return (
      coincideProducto &&
      coincideTipo &&
      coincideFechaDesde &&
      coincideFechaHasta
    )
  })

  // Registrar entrada o salida.
  const registrarMovimiento = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault()

    setErrorApi('')
    setMensajeExito('')

    const cantidadNumerica = Number(cantidad)

    if (!productoSeleccionado) {
      setErrorApi('Debes seleccionar un producto.')
      return
    }

    if (
      !Number.isInteger(cantidadNumerica) ||
      cantidadNumerica <= 0
    ) {
      setErrorApi('La cantidad debe ser un número entero mayor que cero.')
      return
    }

    if (
      tipoMovimiento === 'salida' &&
      productoActual &&
      cantidadNumerica > productoActual.stock
    ) {
      setErrorApi(
        `No hay suficiente stock. Existencias actuales: ${productoActual.stock}.`,
      )
      return
    }

    try {
      setGuardando(true)

      await createMovimiento({
        producto: productoSeleccionado,
        tipo: tipoMovimiento,
        cantidad: cantidadNumerica,
        motivo: motivo.trim(),
      })

      setMensajeExito(
        tipoMovimiento === 'entrada'
          ? 'La entrada se registró correctamente.'
          : 'La salida se registró correctamente.',
      )

      setProductoSeleccionado('')
      setTipoMovimiento('entrada')
      setCantidad('')
      setMotivo('')
      setMostrarFormulario(false)

      // Recargar el historial y el stock actualizado.
      await cargarDatos()
    } catch (error: unknown) {
      console.error('Error al registrar movimiento:', error)

      const errorAxios = error as {
        response?: {
          data?: {
            message?: string | string[]
          }
        }
      }

      const mensajeError = errorAxios.response?.data?.message

      setErrorApi(
        Array.isArray(mensajeError)
          ? mensajeError.join(', ')
          : mensajeError ||
              'No se pudo registrar el movimiento. Intenta nuevamente.',
      )
    } finally {
      setGuardando(false)
    }
  }

  // Formatear fecha para mostrarla en la tabla.
  const formatearFecha = (fecha: string) => {
    if (!fecha) return ''

    const fechaObjeto = new Date(fecha)

    if (Number.isNaN(fechaObjeto.getTime())) {
      return fecha
    }

    return fechaObjeto.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Columnas de la tabla.
  const columnas: DataTableColumn<MovimientoBackend>[] = [
    {
      key: 'producto',
      label: 'Producto',
      render: (movimiento) => (
        <div>
          <div className="inventario-producto-nombre">
            {movimiento.producto?.nombre ?? 'Producto desconocido'}
          </div>

          <span className="inventario-producto-descripcion">
            Código: {movimiento.producto?.codigo ?? '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'tipo',
      label: 'Tipo',
      render: (movimiento) => (
        <span
          className={`inventario-estado ${
            movimiento.tipo === 'entrada'
              ? 'inventario-estado-disponible'
              : 'inventario-estado-agotado'
          }`}
        >
          {movimiento.tipo === 'entrada' ? 'Entrada' : 'Salida'}
        </span>
      ),
    },
    {
      key: 'cantidad',
      label: 'Cantidad',
      render: (movimiento) => (
        <strong>{movimiento.cantidad}</strong>
      ),
    },
    {
      key: 'stockAnterior',
      label: 'Stock anterior',
    },
    {
      key: 'stockResultante',
      label: 'Stock resultante',
      render: (movimiento) => (
        <span className="inventario-stock">
          {movimiento.stockResultante}
        </span>
      ),
    },
    {
      key: 'motivo',
      label: 'Motivo',
      render: (movimiento) => movimiento.motivo || 'Sin motivo',
    },
    {
      key: 'fechaMovimiento',
      label: 'Fecha',
      render: (movimiento) =>
        formatearFecha(movimiento.fechaMovimiento),
    },
  ]

  // Limpiar los filtros.
  const limpiarFiltros = () => {
    setFiltroProducto('Todos')
    setFiltroTipo('Todos')
    setFechaDesde('')
    setFechaHasta('')
  }

  return (
    <div className="admin-seccion inventario-seccion">
      {/* Encabezado */}
      <div className="admin-section-header">
        <div>
          <h2>Movimientos</h2>

          <p className="page-subtitle">
            Registra las entradas y salidas de productos y consulta
            el historial del inventario.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setErrorApi('')
            setMensajeExito('')
            setMostrarFormulario(true)
          }}
          disabled={cargando || guardando}
        >
          + Registrar movimiento
        </button>
      </div>

      {/* Mensajes */}
      {errorApi && !mostrarFormulario && (
        <div className="producto-form-error">
          {errorApi}
        </div>
      )}

      {mensajeExito && (
        <div className="success-box">
          {mensajeExito}
        </div>
      )}

      {/* Modal de registro de movimiento */}
      {/* Modal de registro de movimiento */}
      {mostrarFormulario && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!guardando) {
              setMostrarFormulario(false)
              setErrorApi('')
            }
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Registrar movimiento</h2>

            <form onSubmit={registrarMovimiento}>
              <div className="campo">
                <label htmlFor="movimiento-producto">Producto *</label>

                <select
                  id="movimiento-producto"
                  value={productoSeleccionado}
                  onChange={(e) =>
                    setProductoSeleccionado(e.target.value)
                  }
                  required
                  disabled={guardando}
                >
                  <option value="">Selecciona un producto</option>

                  {productosActivos.map((producto) => (
                    <option key={producto.id} value={producto.id}>
                      {producto.codigo} - {producto.nombre}
                    </option>
                  ))}
                </select>

                {productoActual && (
                  <small>
                    Stock actual: {productoActual.stock}{' '}
                    {productoActual.unidadMedida}
                    {cantidad !== '' && Number(cantidad) > 0 && (
                      <>
                        {' · '}
                        Stock resultante estimado:{' '}
                        {tipoMovimiento === 'entrada'
                          ? productoActual.stock + Number(cantidad)
                          : productoActual.stock - Number(cantidad)}
                      </>
                    )}
                  </small>
                )}
              </div>

              <div className="campo">
                <label htmlFor="movimiento-tipo">
                  Tipo de movimiento *
                </label>

                <select
                  id="movimiento-tipo"
                  value={tipoMovimiento}
                  onChange={(e) =>
                    setTipoMovimiento(e.target.value as TipoMovimiento)
                  }
                  required
                  disabled={guardando}
                >
                  <option value="entrada">Entrada de inventario</option>
                  <option value="salida">Salida de inventario</option>
                </select>
              </div>

              <div className="campo">
                <label htmlFor="movimiento-cantidad">Cantidad *</label>

                <input
                  id="movimiento-cantidad"
                  type="number"
                  min="1"
                  step="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Introduce la cantidad"
                  required
                  disabled={guardando}
                />
              </div>

              <div className="campo">
                <label htmlFor="movimiento-motivo">Motivo</label>

                <input
                  id="movimiento-motivo"
                  type="text"
                  maxLength={250}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder={
                    tipoMovimiento === 'entrada'
                      ? 'Ej. Compra de productos'
                      : 'Ej. Consumo en consulta'
                  }
                  disabled={guardando}
                />
              </div>

              {productosActivos.length === 0 && (
                <div className="producto-form-error">
                  No hay productos activos disponibles para registrar
                  movimientos.
                </div>
              )}

              {errorApi && (
                <div className="producto-form-error">{errorApi}</div>
              )}

              <div className="form-buttons">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => {
                    if (!guardando) {
                      setMostrarFormulario(false)
                      setErrorApi('')
                    }
                  }}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={guardando || productosActivos.length === 0}
                >
                  {guardando ? 'Registrando...' : 'Guardar movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="inventario-filtros inventario-filtros-movimientos">
        <div className="inventario-filtro">
          <label htmlFor="filtro-movimiento-producto">
            Producto
          </label>

          <select
            id="filtro-movimiento-producto"
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
          >
            <option value="Todos">Todos los productos</option>

            {productos.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.codigo} - {producto.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="inventario-filtro">
          <label htmlFor="filtro-movimiento-tipo">
            Tipo
          </label>

          <select
            id="filtro-movimiento-tipo"
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="entrada">Entradas</option>
            <option value="salida">Salidas</option>
          </select>
        </div>

        <div className="inventario-filtro">
          <label htmlFor="movimiento-fecha-desde">
            Fecha desde
          </label>

          <input
            id="movimiento-fecha-desde"
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
          />
        </div>

        <div className="inventario-filtro">
          <label htmlFor="movimiento-fecha-hasta">
            Fecha hasta
          </label>

          <input
            id="movimiento-fecha-hasta"
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
          />
        </div>

        <button
          type="button"
          className="btn btn-outline inventario-limpiar"
          onClick={limpiarFiltros}
        >
          Limpiar filtros
        </button>
      </div>

      {/* Historial */}
      <div className="inventario-tabla-contenedor">
        <div className="inventario-tabla-header">
          <div>
            <h3>Historial de movimientos</h3>

            <p>
              {movimientosFiltrados.length}{' '}
              {movimientosFiltrados.length === 1
                ? 'movimiento encontrado'
                : 'movimientos encontrados'}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => void cargarDatos()}
            disabled={cargando || guardando}
          >
            {cargando ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        <DataTable
          columns={columnas}
          data={movimientosFiltrados}
          loading={cargando}
          getRowId={(movimiento) => movimiento._id}
          emptyMessage={
            errorApi
              ? 'No se pudieron mostrar los movimientos.'
              : 'No hay movimientos registrados con los filtros seleccionados.'
          }
        />
      </div>
    </div>
  )
}


import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'


import './ComprasView.css'
import { type CompraBackend, type MonedaBackend, getCompras, getProductos, getMonedas, type CompraNueva, createCompra } from '../../api'
import DataTable, { type DataTableColumn } from '../productos/DataTable'
import type { Producto } from '../productos/productos.types'

export default function ComprasView() {
  const [compras, setCompras] = useState<CompraBackend[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [monedas, setMonedas] = useState<MonedaBackend[]>([])

  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)

  const [mostrarFormulario, setMostrarFormulario] = useState(false)

  const [productoSeleccionado, setProductoSeleccionado] = useState('')
  const [monedaSeleccionada, setMonedaSeleccionada] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [precioUnitario, setPrecioUnitario] = useState('')
  const [fechaCompra, setFechaCompra] = useState(
    new Date().toISOString().slice(0, 10),
  )
  const [proveedor, setProveedor] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [errorApi, setErrorApi] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')

  // Cargar compras, productos y monedas.
  const cargarDatos = async () => {
    try {
      setCargando(true)
      setErrorApi('')

      const [
        comprasCargadas,
        productosCargados,
        monedasCargadas,
      ] = await Promise.all([
        getCompras(),
        getProductos(),
        getMonedas(),
      ])

      setCompras(comprasCargadas)
      setProductos(productosCargados)
      setMonedas(monedasCargadas)
    } catch (error) {
      console.error('Error al cargar compras:', error)

      setErrorApi(
        'No se pudieron cargar las compras. Verifica la conexión con el servidor.',
      )
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    void cargarDatos()
  }, [])

  // Productos activos para el formulario.
  const productosActivos = productos.filter(
    (producto) => producto.activo,
  )

  // Producto seleccionado.
  const productoActual = productos.find(
    (producto) => producto.id === productoSeleccionado,
  )

  // Vista previa del total.
  const cantidadNumerica = Number(cantidad)
  const precioNumerico = Number(precioUnitario)

  const totalCalculado =
    cantidadNumerica > 0 &&
    precioNumerico >= 0 &&
    Number.isFinite(cantidadNumerica) &&
    Number.isFinite(precioNumerico)
      ? cantidadNumerica * precioNumerico
      : 0

  // Limpiar formulario.
  const limpiarFormulario = () => {
    setProductoSeleccionado('')
    setMonedaSeleccionada('')
    setCantidad('')
    setPrecioUnitario('')
    setFechaCompra(new Date().toISOString().slice(0, 10))
    setProveedor('')
    setObservaciones('')
  }

  // Registrar compra.
  const registrarCompra = async (
    e: FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault()

    setErrorApi('')
    setMensajeExito('')

    if (!productoSeleccionado) {
      setErrorApi('Debes seleccionar un producto.')
      return
    }

    if (!monedaSeleccionada) {
      setErrorApi('Debes seleccionar una moneda.')
      return
    }

    if (
      !Number.isInteger(cantidadNumerica) ||
      cantidadNumerica < 1
    ) {
      setErrorApi(
        'La cantidad debe ser un número entero mayor que cero.',
      )
      return
    }

    if (
      !Number.isFinite(precioNumerico) ||
      precioNumerico < 0
    ) {
      setErrorApi('El precio unitario no es válido.')
      return
    }

    const datosCompra: CompraNueva = {
      productoId: productoSeleccionado,
      cantidad: cantidadNumerica,
      precioUnitario: precioNumerico,
      monedaId: monedaSeleccionada,
      proveedor: proveedor.trim(),
      fechaCompra: new Date(
        `${fechaCompra}T12:00:00`,
      ).toISOString(),
      observaciones: observaciones.trim(),
    }

    try {
      setGuardando(true)

      await createCompra(datosCompra)

      setMensajeExito(
        'La compra se registró correctamente y el stock fue actualizado.',
      )

      limpiarFormulario()
      setMostrarFormulario(false)

      await cargarDatos()
    } catch (error: unknown) {
      console.error('Error al registrar compra:', error)

      const errorAxios = error as {
        response?: {
          data?: {
            message?: string | string[]
          }
        }
      }

      const mensaje = errorAxios.response?.data?.message

      setErrorApi(
        Array.isArray(mensaje)
          ? mensaje.join(', ')
          : mensaje ??
              'No se pudo registrar la compra. Verifica los datos.',
      )
    } finally {
      setGuardando(false)
    }
  }

  // Columnas de la tabla.
  const columnas: DataTableColumn<CompraBackend>[] = [
    {
      key: 'producto',
      label: 'Producto',
      render: (compra) =>
        compra.producto?.nombre ?? 'Producto no disponible',
    },
    {
      key: 'cantidad',
      label: 'Cantidad',
      render: (compra) =>
        `${compra.cantidad} ${
          compra.producto?.unidadMedida ?? ''
        }`,
    },
    {
      key: 'precioUnitario',
      label: 'Precio unitario',
      render: (compra) =>
        `${Number(compra.precioUnitario).toFixed(2)} ${
          compra.monedaCodigo ?? compra.moneda?.tipoMoneda ?? ''
        }`,
    },
    {
      key: 'total',
      label: 'Total',
      render: (compra) =>
        `${Number(compra.total).toFixed(2)} ${
          compra.monedaCodigo ?? compra.moneda?.tipoMoneda ?? ''
        }`,
    },
    {
      key: 'monedaCodigo',
      label: 'Moneda',
      render: (compra) =>
        compra.monedaCodigo ?? compra.moneda?.tipoMoneda ?? '',
    },
    {
      key: 'fechaCompra',
      label: 'Fecha',
      render: (compra) =>
        compra.fechaCompra
          ? new Date(compra.fechaCompra).toLocaleDateString()
          : '',
    },
    {
      key: 'proveedor',
      label: 'Proveedor',
      render: (compra) => compra.proveedor || '—',
    },
  ]

  return (
    <section className="admin-seccion inventario-seccion">
      <div className="admin-section-header">
        <div>
          <h2>Compras</h2>

          <p className="page-subtitle">
            Registra las compras de materiales e insumos de la clínica.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setErrorApi('')
            setMensajeExito('')
            setMostrarFormulario((actual) => !actual)
          }}
        >
          {mostrarFormulario
            ? 'Cancelar'
            : '+ Registrar compra'}
        </button>
      </div>

      {errorApi && (
        <div className="producto-form-error">
          {errorApi}
        </div>
      )}

      {mensajeExito && (
        <div className="success-box">
          {mensajeExito}
        </div>
      )}

      {mostrarFormulario && (
        <form
          className="compras-formulario"
          onSubmit={registrarCompra}
        >
          <h2>Registrar nueva compra</h2>

          <div className="compras-form-grid">
            <div className="compras-campo">
              <label htmlFor="productoCompra">
                Producto *
              </label>

              <select
                id="productoCompra"
                value={productoSeleccionado}
                onChange={(e) =>
                  setProductoSeleccionado(e.target.value)
                }
                required
              >
                <option value="">
                  Selecciona un producto
                </option>

                {productosActivos.map((producto) => (
                  <option
                    key={producto.id}
                    value={producto.id}
                  >
                    {producto.codigo} - {producto.nombre}
                  </option>
                ))}
              </select>

              {productoActual && (
                <small>
                  Stock actual: {productoActual.stock}{' '}
                  {productoActual.unidadMedida}
                </small>
              )}
            </div>

            <div className="compras-campo">
              <label htmlFor="monedaCompra">
                Moneda *
              </label>

              <select
                id="monedaCompra"
                value={monedaSeleccionada}
                onChange={(e) =>
                  setMonedaSeleccionada(e.target.value)
                }
                required
              >
                <option value="">
                  Selecciona una moneda
                </option>

                {monedas.map((moneda) => (
                  <option
                    key={moneda._id}
                    value={moneda._id}
                  >
                    {moneda.tipoMoneda}
                  </option>
                ))}
              </select>
            </div>

            <div className="compras-campo">
              <label htmlFor="cantidadCompra">
                Cantidad *
              </label>

              <input
                id="cantidadCompra"
                type="number"
                min="1"
                step="1"
                value={cantidad}
                onChange={(e) =>
                  setCantidad(e.target.value)
                }
                required
              />
            </div>

            <div className="compras-campo">
              <label htmlFor="precioCompra">
                Precio unitario *
              </label>

              <input
                id="precioCompra"
                type="number"
                min="0"
                step="0.01"
                value={precioUnitario}
                onChange={(e) =>
                  setPrecioUnitario(e.target.value)
                }
                required
              />
            </div>

            <div className="compras-campo">
              <label htmlFor="fechaCompra">
                Fecha de compra *
              </label>

              <input
                id="fechaCompra"
                type="date"
                value={fechaCompra}
                onChange={(e) =>
                  setFechaCompra(e.target.value)
                }
                required
              />
            </div>

            <div className="compras-campo">
              <label htmlFor="proveedorCompra">
                Proveedor
              </label>

              <input
                id="proveedorCompra"
                type="text"
                value={proveedor}
                onChange={(e) =>
                  setProveedor(e.target.value)
                }
                placeholder="Nombre del proveedor"
              />
            </div>

            <div className="compras-campo compras-campo-completo">
              <label htmlFor="observacionesCompra">
                Observaciones
              </label>

              <textarea
                id="observacionesCompra"
                rows={3}
                value={observaciones}
                onChange={(e) =>
                  setObservaciones(e.target.value)
                }
                placeholder="Detalles adicionales de la compra"
              />
            </div>
          </div>

          <div className="compras-total">
            <span>Total de la compra</span>

            <strong>
              {totalCalculado.toFixed(2)}{' '}
              {monedas.find(
                (moneda) =>
                  moneda._id === monedaSeleccionada,
              )?.tipoMoneda ?? ''}
            </strong>
          </div>

          <div className="compras-form-acciones">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => {
                limpiarFormulario()
                setMostrarFormulario(false)
                setErrorApi('')
              }}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={guardando}
            >
              {guardando
                ? 'Registrando...'
                : 'Registrar compra'}
            </button>
          </div>
        </form>
      )}

      <div className="inventario-tabla-contenedor">
        <div className="inventario-tabla-header">
          <div>
            <h3>Historial de compras</h3>

            <p>
              {compras.length}{' '}
              {compras.length === 1
                ? 'compra registrada'
                : 'compras registradas'}
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => void cargarDatos()}
            disabled={cargando}
          >
            {cargando ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>

        <DataTable
          columns={columnas}
          data={compras}
          loading={cargando}
          getRowId={(compra) => compra._id}
          emptyMessage="Todavía no hay compras registradas."
        />
      </div>
    </section>
  )
}

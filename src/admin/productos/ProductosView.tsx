
import { useMemo, useState } from 'react'
import type { Producto, EstadoStock } from './productos.types'
import { productosMock } from './productos.mock'
import ProductoFormModal from './ProductoFormModal'
import ConfirmacionEliminarModal from './ConfirmacionEliminarModal'

export default function ProductosView() {
  const [productos, setProductos] = useState<Producto[]>(productosMock)

  const [mostrarModal, setMostrarModal] = useState(false)
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null)

  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false)
  const [productoEliminar, setProductoEliminar] = useState<Producto | null>(null)

  const [busqueda, setBusqueda] = useState('')
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas')
  const [estadoSeleccionado, setEstadoSeleccionado] = useState('Todos')

  // Obtener categorías únicas
  const categorias = useMemo(() => {
    const categoriasUnicas = productos.map((producto) => producto.categoria)

    return ['Todas', ...Array.from(new Set(categoriasUnicas))]
  }, [productos])

  // Determinar el estado del stock
  const obtenerEstadoStock = (producto: Producto): EstadoStock => {
    if (producto.stock <= 0) {
      return 'Agotado'
    }

    if (producto.stock <= producto.stockMinimo) {
      return 'Stock bajo'
    }

    return 'Disponible'
  }

  // Resumen del inventario
  const totalProductos = productos.length

  const totalCategorias = new Set(
    productos.map((producto) => producto.categoria),
  ).size

  const productosStockBajo = productos.filter(
    (producto) =>
      producto.stock > 0 && producto.stock <= producto.stockMinimo,
  ).length

  const productosAgotados = productos.filter(
    (producto) => producto.stock <= 0,
  ).length

  // Filtrar productos
  const productosFiltrados = productos.filter((producto) => {
    const textoBusqueda = busqueda.toLowerCase().trim()

    const coincideBusqueda =
      producto.nombre.toLowerCase().includes(textoBusqueda) ||
      producto.codigo.toLowerCase().includes(textoBusqueda)

    const coincideCategoria =
      categoriaSeleccionada === 'Todas' ||
      producto.categoria === categoriaSeleccionada

    const estadoProducto = obtenerEstadoStock(producto)

    const coincideEstado =
      estadoSeleccionado === 'Todos' ||
      estadoProducto === estadoSeleccionado

    return coincideBusqueda && coincideCategoria && coincideEstado
  })

  // Abrir modal para agregar
  const abrirModalAgregar = () => {
    setProductoEditando(null)
    setMostrarModal(true)
  }

  // Abrir modal para editar
  const abrirModalEditar = (producto: Producto) => {
    setProductoEditando(producto)
    setMostrarModal(true)
  }

  // Cerrar modal
  const cerrarModal = () => {
    setMostrarModal(false)
    setProductoEditando(null)
  }

  // Guardar producto
  const guardarProducto = (datos: Omit<Producto, 'id'>) => {
    if (productoEditando) {
      setProductos((actuales) =>
        actuales.map((producto) =>
          producto.id === productoEditando.id
            ? {
              ...producto,
              ...datos,
              // Se conserva el stock actual.
              stock: producto.stock,
            }
            : producto,
        ),
      )
    } else {
      const nuevoProducto: Producto = {
        ...datos,
        id: crypto.randomUUID(),
      }

      setProductos((actuales) => [...actuales, nuevoProducto])
    }

    cerrarModal()
  }

  const abrirModalEliminar = (producto: Producto) => {
    setProductoEliminar(producto)
    setMostrarModalEliminar(true)
  }

  const cerrarModalEliminar = () => {
    setMostrarModalEliminar(false)
    setProductoEliminar(null)
  }

  const eliminarProducto = () => {
    if (!productoEliminar) return

    setProductos((actuales) =>
      actuales.filter((producto) => producto.id !== productoEliminar.id),
    )
  }

  return (
    <div className="admin-seccion inventario-seccion">
      {/* Encabezado */}
      <div className="admin-section-header inventario-header">
        <div>
          <h2 className="dashboard-bienvenida">Inventario</h2>

          <p className="inventario-subtitulo">
            Gestiona los productos y consulta el estado de las existencias.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={abrirModalAgregar}
        >
          + Agregar producto
        </button>
      </div>

      {/* Tarjetas de resumen */}
      <div className="inventario-resumen">
        <div className="resumen-card inventario-card">
          <span className="resumen-label">Total de productos</span>
          <span className="resumen-valor">{totalProductos}</span>
          <span className="inventario-card-descripcion">
            Productos registrados
          </span>
        </div>

        <div className="resumen-card inventario-card">
          <span className="resumen-label">Categorías</span>
          <span className="resumen-valor">{totalCategorias}</span>
          <span className="inventario-card-descripcion">
            Categorías diferentes
          </span>
        </div>

        <div className="resumen-card inventario-card inventario-card-alerta">
          <span className="resumen-label">Stock bajo</span>
          <span className="resumen-valor">{productosStockBajo}</span>
          <span className="inventario-card-descripcion">
            Necesitan reposición
          </span>
        </div>

        <div className="resumen-card inventario-card inventario-card-agotado">
          <span className="resumen-label">Agotados</span>
          <span className="resumen-valor">{productosAgotados}</span>
          <span className="inventario-card-descripcion">
            Sin existencias
          </span>
        </div>
      </div>

      {/* Filtros */}
      <div className="inventario-filtros">
        <div className="inventario-busqueda">
          <label htmlFor="buscar-producto">Buscar producto</label>

          <input
            id="buscar-producto"
            type="text"
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="inventario-filtro">
          <label htmlFor="filtro-categoria">Categoría</label>

          <select
            id="filtro-categoria"
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
          >
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {categoria}
              </option>
            ))}
          </select>
        </div>

        <div className="inventario-filtro">
          <label htmlFor="filtro-estado">Estado del stock</label>

          <select
            id="filtro-estado"
            value={estadoSeleccionado}
            onChange={(e) => setEstadoSeleccionado(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Disponible">Disponible</option>
            <option value="Stock bajo">Stock bajo</option>
            <option value="Agotado">Agotado</option>
          </select>
        </div>

        <button
          type="button"
          className="btn btn-outline inventario-limpiar"
          onClick={() => {
            setBusqueda('')
            setCategoriaSeleccionada('Todas')
            setEstadoSeleccionado('Todos')
          }}
        >
          Limpiar filtros
        </button>
      </div>

      {/* Tabla de productos */}
      <div className="inventario-tabla-contenedor">
        <div className="inventario-tabla-header">
          <div>
            <h3>Listado de productos</h3>

            <p>
              {productosFiltrados.length}{' '}
              {productosFiltrados.length === 1
                ? 'producto encontrado'
                : 'productos encontrados'}
            </p>
          </div>
        </div>

        {productosFiltrados.length > 0 ? (
          <div className="orders-table-wrap inventario-tabla-wrap">
            <table className="orders-table inventario-tabla">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Unidad</th>
                  <th>Precio compra</th>
                  <th>Precio venta</th>
                  <th>Stock</th>
                  <th>Stock mínimo</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {productosFiltrados.map((producto) => {
                  const estado = obtenerEstadoStock(producto)

                  return (
                    <tr key={producto.id}>
                      <td className="inventario-codigo">
                        {producto.codigo}
                      </td>

                      <td>
                        <div className="inventario-producto-nombre">
                          {producto.nombre}
                        </div>

                        <span className="inventario-producto-descripcion">
                          {producto.descripcion}
                        </span>
                      </td>

                      <td>{producto.categoria}</td>

                      <td>{producto.unidadMedida}</td>

                      <td>{producto.precioCompra.toLocaleString()}</td>

                      <td>{producto.precioVenta.toLocaleString()}</td>

                      <td className="inventario-stock">
                        {producto.stock}
                      </td>

                      <td>{producto.stockMinimo}</td>

                      <td>
                        <span
                          className={`inventario-estado inventario-estado-${estado
                            .toLowerCase()
                            .replace(' ', '-')}`}
                        >
                          {estado}
                        </span>
                      </td>

                      <td>
                        <div className="inventario-acciones">
                          <button
                            type="button"
                            className="inventario-btn-editar"
                            onClick={() => abrirModalEditar(producto)}
                            title="Editar producto"
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="inventario-btn-eliminar"
                            onClick={() => abrirModalEliminar(producto)}
                            title="Eliminar producto"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-box inventario-empty">
            <p className="empty">
              No se encontraron productos con los filtros seleccionados.
            </p>
          </div>
        )}
      </div>

      {/* Modal agregar / editar: fuera del ternario de la tabla */}
      {mostrarModal && (
        <ProductoFormModal
          key={productoEditando?.id ?? 'nuevo-producto'}
          producto={productoEditando}
          productos={productos}
          onGuardar={guardarProducto}
          onCerrar={cerrarModal}
        />
      )}

      {mostrarModalEliminar && productoEliminar && (
        <ConfirmacionEliminarModal
          nombreElemento={productoEliminar.nombre}
          onConfirmar={eliminarProducto}
          onCerrar={cerrarModalEliminar}
        />
      )}
    </div>
  )
}

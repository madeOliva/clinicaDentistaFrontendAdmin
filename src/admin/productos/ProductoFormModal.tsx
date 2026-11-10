
import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Producto } from './productos.types'

interface ProductoFormModalProps {
  producto?: Producto | null
  productos: Producto[]
  onGuardar: (producto: Omit<Producto, 'id'>) => Promise<void>
  onCerrar: () => void
}

interface ProductoForm {
  codigo: string
  nombre: string
  descripcion: string
  categoria: string
  unidadMedida: string
  precioCompra: string
  precioVenta: string
  stock: string
  stockMinimo: string
  activo: boolean
}

const formInicial: ProductoForm = {
  codigo: '',
  nombre: '',
  descripcion: '',
  categoria: '',
  unidadMedida: 'Unidad',
  precioCompra: '',
  precioVenta: '',
  stock: '0',
  stockMinimo: '0',
  activo: true,
}

export default function ProductoFormModal({
  producto,
  productos,
  onGuardar,
  onCerrar,
}: ProductoFormModalProps) {
  const editando = Boolean(producto)

  const [form, setForm] = useState<ProductoForm>(() => {
    if (!producto) return formInicial

    return {
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      categoria: producto.categoria,
      unidadMedida: producto.unidadMedida,
      precioCompra: String(producto.precioCompra),
      precioVenta: String(producto.precioVenta),
      stock: String(producto.stock),
      stockMinimo: String(producto.stockMinimo),
      activo: producto.activo,
    }
  })

  const [error, setError] = useState('')

  const actualizarCampo = (
    campo: keyof ProductoForm,
    valor: string | boolean,
  ) => {
    setForm((actual) => ({
      ...actual,
      [campo]: valor,
    }))
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    const codigo = form.codigo.trim().toUpperCase()
    const nombre = form.nombre.trim()
    const categoria = form.categoria.trim()
    const unidadMedida = form.unidadMedida.trim()

    if (!codigo || !nombre || !categoria || !unidadMedida) {
      setError('Completa todos los campos obligatorios.')
      return
    }

    const codigoExiste = productos.some(
      (p) =>
        p.codigo.trim().toUpperCase() === codigo &&
        p.id !== producto?.id,
    )

    if (codigoExiste) {
      setError('Ya existe un producto con ese código.')
      return
    }

    const precioCompra = Number(form.precioCompra)
    const precioVenta = Number(form.precioVenta)
    const stockMinimo = Number(form.stockMinimo)

    if (
      form.precioCompra.trim() === '' ||
      form.precioVenta.trim() === '' ||
      !Number.isFinite(precioCompra) ||
      !Number.isFinite(precioVenta) ||
      precioCompra < 0 ||
      precioVenta < 0
    ) {
      setError('Los precios deben ser números válidos y no negativos.')
      return
    }

    if (
      form.stockMinimo.trim() === '' ||
      !Number.isInteger(stockMinimo) ||
      stockMinimo < 0
    ) {
      setError('El stock mínimo debe ser un entero no negativo.')
      return
    }

    let stock = 0

    if (!editando) {
      stock = Number(form.stock)

      if (
        form.stock.trim() === '' ||
        !Number.isInteger(stock) ||
        stock < 0
      ) {
        setError('El stock inicial debe ser un entero no negativo.')
        return
      }
    } else if (producto) {
      // Al editar, el stock se conserva.
      stock = producto.stock
    }

    try {
      await onGuardar({
        codigo,
        nombre,
        descripcion: form.descripcion.trim(),
        categoria,
        unidadMedida,
        precioCompra,
        precioVenta,
        stock,
        stockMinimo,
        activo: form.activo,
      })
    } catch (error) {
      const mensaje = (
        error as {
          response?: {
            data?: {
              message?: string | string[]
            }
          }
        }
      )?.response?.data?.message

      setError(
        Array.isArray(mensaje)
          ? mensaje.join(', ')
          : mensaje || 'No se pudo guardar el producto.',
      )
    }
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div
        className="modal-card producto-form-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="producto-modal-header">
          <div>
            <h2>{editando ? 'Editar producto' : 'Agregar producto'}</h2>
            <p>
              {editando
                ? 'Modifica la información del producto.'
                : 'Registra un nuevo producto en el inventario.'}
            </p>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onCerrar}
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="producto-form-error">
              {error}
            </div>
          )}

          <div className="producto-form-grid">
            <div className="producto-form-campo">
              <label htmlFor="producto-codigo">
                Código <span>*</span>
              </label>
              <input
                id="producto-codigo"
                value={form.codigo}
                onChange={(e) => actualizarCampo('codigo', e.target.value)}
                placeholder="Ej. PROD-001"
                required
              />
            </div>

            <div className="producto-form-campo">
              <label htmlFor="producto-nombre">
                Nombre <span>*</span>
              </label>
              <input
                id="producto-nombre"
                value={form.nombre}
                onChange={(e) => actualizarCampo('nombre', e.target.value)}
                placeholder="Nombre del producto"
                required
              />
            </div>

            <div className="producto-form-campo">
              <label htmlFor="producto-categoria">
                Categoría <span>*</span>
              </label>
              <input
                id="producto-categoria"
                value={form.categoria}
                onChange={(e) => actualizarCampo('categoria', e.target.value)}
                placeholder="Ej. Higiene"
                required
              />
            </div>

            <div className="producto-form-campo">
              <label htmlFor="producto-unidad">
                Unidad de medida <span>*</span>
              </label>
              <select
                id="producto-unidad"
                value={form.unidadMedida}
                onChange={(e) =>
                  actualizarCampo('unidadMedida', e.target.value)
                }
                required
              >
                <option value="Unidad">Unidad</option>
                <option value="Kg">Kilogramo (Kg)</option>
                <option value="Gramo">Gramo</option>
                <option value="Litro">Litro</option>
                <option value="Mililitro">Mililitro</option>
                <option value="Paquete">Paquete</option>
                <option value="Caja">Caja</option>
                <option value="Frasco">Frasco</option>
                <option value="Metro">Metro</option>
              </select>
            </div>

            <div className="producto-form-campo">
              <label htmlFor="producto-precio-compra">
                Precio de compra <span>*</span>
              </label>
              <input
                id="producto-precio-compra"
                type="number"
                min="0"
                step="0.01"
                value={form.precioCompra}
                onChange={(e) =>
                  actualizarCampo('precioCompra', e.target.value)
                }
                required
              />
            </div>

            <div className="producto-form-campo">
              <label htmlFor="producto-precio-venta">
                Precio de venta <span>*</span>
              </label>
              <input
                id="producto-precio-venta"
                type="number"
                min="0"
                step="0.01"
                value={form.precioVenta}
                onChange={(e) =>
                  actualizarCampo('precioVenta', e.target.value)
                }
                required
              />
            </div>

            <div className="producto-form-campo">
              <label htmlFor="producto-stock-minimo">
                Stock mínimo <span>*</span>
              </label>
              <input
                id="producto-stock-minimo"
                type="number"
                min="0"
                step="1"
                value={form.stockMinimo}
                onChange={(e) =>
                  actualizarCampo('stockMinimo', e.target.value)
                }
                required
              />
            </div>

            {!editando && (
              <div className="producto-form-campo">
                <label htmlFor="producto-stock-inicial">
                  Stock inicial <span>*</span>
                </label>
                <input
                  id="producto-stock-inicial"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) =>
                    actualizarCampo('stock', e.target.value)
                  }
                  required
                />
              </div>
            )}

            {editando && (
              <div className="producto-form-campo">
                <label>Stock actual</label>
                <input
                  type="number"
                  value={producto?.stock ?? 0}
                  disabled
                />
                <small>
                  El stock se modificará desde el módulo de movimientos.
                </small>
              </div>
            )}

            <div className="producto-form-campo producto-form-campo-completo">
              <label htmlFor="producto-descripcion">Descripción</label>
              <textarea
                id="producto-descripcion"
                rows={3}
                value={form.descripcion}
                onChange={(e) =>
                  actualizarCampo('descripcion', e.target.value)
                }
                placeholder="Descripción del producto..."
              />
            </div>

            <div className="producto-form-campo producto-form-campo-completo">
              <label className="producto-form-checkbox">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) =>
                    actualizarCampo('activo', e.target.checked)
                  }
                />
                Producto activo
              </label>
            </div>
          </div>

          <div className="producto-form-acciones">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onCerrar}
            >
              Cancelar
            </button>

            <button type="submit" className="btn btn-primary">
              {editando ? 'Guardar cambios' : 'Agregar producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

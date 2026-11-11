
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'

import {
    getCategorias,
    createCategoria,
    updateCategoria,
    deleteCategoria,
} from '../../api'

import type {
    CategoriaBackend,
    CategoriaNueva,
} from '../../api'
import type { DataTableColumn } from '../productos/DataTable'
import DataTable from '../productos/DataTable'

interface FormularioCategoria {
    nombre: string
    descripcion: string
    activa: boolean
}

const formularioVacio: FormularioCategoria = {
    nombre: '',
    descripcion: '',
    activa: true,
}

export default function CategoriasView() {
    const [categorias, setCategorias] = useState<CategoriaBackend[]>([])
    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    const [mostrarFormulario, setMostrarFormulario] = useState(false)
    const [categoriaEditando, setCategoriaEditando] =
        useState<CategoriaBackend | null>(null)

    const [formulario, setFormulario] =
        useState<FormularioCategoria>(formularioVacio)

    useEffect(() => {
        cargarCategorias()
    }, [])

    async function cargarCategorias() {
        try {
            setCargando(true)
            setError('')

            const datos = await getCategorias()
            setCategorias(datos)
        } catch (err) {
            console.error(err)
            setError('No se pudieron cargar las categorías.')
        } finally {
            setCargando(false)
        }
    }

    function abrirFormularioAgregar() {
        setCategoriaEditando(null)
        setFormulario(formularioVacio)
        setError('')
        setMensaje('')
        setMostrarFormulario(true)
    }

    function abrirFormularioEditar(categoria: CategoriaBackend) {
        setCategoriaEditando(categoria)

        setFormulario({
            nombre: categoria.nombre,
            descripcion: categoria.descripcion ?? '',
            activa: categoria.activa,
        })

        setError('')
        setMensaje('')
        setMostrarFormulario(true)
    }

    function cerrarFormulario() {
        setMostrarFormulario(false)
        setCategoriaEditando(null)
        setFormulario(formularioVacio)
        setError('')
    }

    function actualizarCampo(
        campo: keyof FormularioCategoria,
        valor: string | boolean,
    ) {
        setFormulario((actual) => ({
            ...actual,
            [campo]: valor,
        }))
    }

    const columnas: DataTableColumn<CategoriaBackend>[] = [
        {
            key: 'nombre',
            label: 'Nombre',
        },
        {
            key: 'descripcion',
            label: 'Descripción',
            render: (categoria) =>
                categoria.descripcion || 'Sin descripción',
        },
        {
            key: 'activa',
            label: 'Estado',
            render: (categoria) =>
                categoria.activa ? 'Activa' : 'Inactiva',
        },
    ]

    async function guardarCategoria(e: FormEvent<HTMLFormElement>) {
        e.preventDefault()

        const nombre = formulario.nombre.trim()
        const descripcion = formulario.descripcion.trim()

        if (nombre.length < 2) {
            setError('El nombre debe tener al menos 2 caracteres.')
            return
        }

        const nombreDuplicado = categorias.some(
            (categoria) =>
                categoria.nombre.trim().toLowerCase() === nombre.toLowerCase() &&
                categoria._id !== categoriaEditando?._id,
        )

        if (nombreDuplicado) {
            setError('Ya existe una categoría con ese nombre.')
            return
        }

        const datos: CategoriaNueva = {
            nombre,
            descripcion,
            activa: formulario.activa,
        }

        try {
            setGuardando(true)
            setError('')

            if (categoriaEditando) {
                const actualizada = await updateCategoria(
                    categoriaEditando._id,
                    datos,
                )

                setCategorias((actuales) =>
                    actuales.map((categoria) =>
                        categoria._id === actualizada._id
                            ? actualizada
                            : categoria,
                    ),
                )

                setMensaje('Categoría actualizada correctamente.')
            } else {
                const nueva = await createCategoria(datos)

                setCategorias((actuales) =>
                    [...actuales, nueva].sort((a, b) =>
                        a.nombre.localeCompare(b.nombre),
                    ),
                )

                setMensaje('Categoría creada correctamente.')
            }

            cerrarFormulario()
        } catch (err) {
            console.error(err)
            setError('No se pudo guardar la categoría.')
        } finally {
            setGuardando(false)
        }
    }

    async function eliminarCategoria(categoria: CategoriaBackend) {
        const confirmar = window.confirm(
            `¿Deseas eliminar la categoría "${categoria.nombre}"?`,
        )

        if (!confirmar) return

        try {
            setError('')
            setMensaje('')

            await deleteCategoria(categoria._id)

            setCategorias((actuales) =>
                actuales.filter((item) => item._id !== categoria._id),
            )

            setMensaje('Categoría eliminada correctamente.')
        } catch (err) {
            console.error(err)
            setError(
                'No se pudo eliminar la categoría. Comprueba si tiene productos asociados.',
            )
        }
    }


    return (
        <section className="admin-seccion">
            <div className="orders-header">
                <div>
                    <h1 className="orders-title">Categorías</h1>
                    <p className="orders-found">
                        Administra las categorías del inventario.
                    </p>
                </div>

                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={abrirFormularioAgregar}
                >
                    + Agregar categoría
                </button>
            </div>
            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {mensaje && (
                <div className="alert alert-success">
                    {mensaje}
                </div>
            )}

            <DataTable
                columns={columnas}
                data={categorias}
                loading={cargando}
                getRowId={(categoria) => categoria._id}
                emptyMessage="No hay categorías registradas."
                onEdit={abrirFormularioEditar}
                onDelete={eliminarCategoria}
            />

            {mostrarFormulario && (
                <div
                    className="modal-overlay"
                    onClick={cerrarFormulario}
                >
                    <div
                        className="modal-card"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2>
                            {categoriaEditando
                                ? 'Editar categoría'
                                : 'Agregar categoría'}
                        </h2>

                        <form onSubmit={guardarCategoria}>
                            <div className="campo">
                                <label htmlFor="categoria-nombre">
                                    Nombre *
                                </label>

                                <input
                                    id="categoria-nombre"
                                    value={formulario.nombre}
                                    onChange={(e) =>
                                        actualizarCampo('nombre', e.target.value)
                                    }
                                    placeholder="Ej. Higiene"
                                    minLength={2}
                                    required
                                />
                            </div>

                            <div className="campo">
                                <label htmlFor="categoria-descripcion">
                                    Descripción
                                </label>

                                <textarea
                                    id="categoria-descripcion"
                                    value={formulario.descripcion}
                                    onChange={(e) =>
                                        actualizarCampo('descripcion', e.target.value)
                                    }
                                    placeholder="Descripción de la categoría..."
                                    rows={3}
                                />
                            </div>

                            <div className="campo">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={formulario.activa}
                                        onChange={(e) =>
                                            actualizarCampo('activa', e.target.checked)
                                        }
                                    />
                                    Categoría activa
                                </label>
                            </div>

                            {error && (
                                <div className="alert alert-error">
                                    {error}
                                </div>
                            )}

                            <div className="producto-form-acciones">
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={cerrarFormulario}
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
                                        ? 'Guardando...'
                                        : categoriaEditando
                                            ? 'Guardar cambios'
                                            : 'Agregar categoría'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}

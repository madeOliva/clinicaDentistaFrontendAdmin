
import { useEffect, useMemo, useState } from 'react'
import {
  getCitas,
  getCompras,
  getMonedas,
  type CitaBackend,
  type CompraBackend,
  type MonedaBackend,
} from '../api'
import './DashboardFinanciero.css'

function hoyClaveLocal(): string {
  const ahora = new Date()
  const local = new Date(
    ahora.getTime() - ahora.getTimezoneOffset() * 60000,
  )
  return local.toISOString().slice(0, 10)
}

function primerDiaMes(): string {
  return `${hoyClaveLocal().slice(0, 7)}-01`
}

function formatearImporte(importe: number, moneda: string): string {
  const valor = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(importe)

  return `${valor} ${moneda}`
}

function fechaDentroDelPeriodo(
  fecha: string | null | undefined,
  desde: string,
  hasta: string,
): boolean {
  if (!fecha) return false

  const clave = fecha.slice(0, 10)
  return clave >= desde && clave <= hasta
}

interface ResumenMoneda {
  moneda: string
  ingresos: number
  gastos: number
  cantidadPagos: number
  cantidadCompras: number
}

interface MovimientoFinanciero {
  id: string
  tipo: 'Ingreso' | 'Gasto'
  fecha: string
  descripcion: string
  moneda: string
  importe: number
}

export default function DashboardFinanciero() {
  const [citas, setCitas] = useState<CitaBackend[]>([])
  const [compras, setCompras] = useState<CompraBackend[]>([])
  const [monedas, setMonedas] = useState<MonedaBackend[]>([])

  const [desde, setDesde] = useState(primerDiaMes)
  const [hasta, setHasta] = useState(hoyClaveLocal)

  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [recarga, setRecarga] = useState(0)

  useEffect(() => {
    let activo = true

    async function cargarDatos() {
      try {
        setCargando(true)
        setError('')

        const [citasData, comprasData, monedasData] =
          await Promise.all([
            getCitas(),
            getCompras(),
            getMonedas(),
          ])

        if (!activo) return

        setCitas(citasData)
        setCompras(comprasData)
        setMonedas(monedasData)
      } catch (err: unknown) {
        if (!activo) return

        if (
          typeof err === 'object' &&
          err !== null &&
          'response' in err
        ) {
          const errorAxios = err as {
            response?: {
              data?: {
                message?: string | string[]
              }
            }
          }

          const mensaje = errorAxios.response?.data?.message

          setError(
            Array.isArray(mensaje)
              ? mensaje.join(', ')
              : mensaje || 'No se pudieron cargar los datos financieros.',
          )
        } else {
          setError('No se pudieron cargar los datos financieros.')
        }
      } finally {
        if (activo) setCargando(false)
      }
    }

    cargarDatos()

    return () => {
      activo = false
    }
  }, [recarga])

  const codigoMonedaPorId = useMemo(() => {
    return new Map(
      monedas.map((moneda) => [
        moneda._id,
        moneda.tipoMoneda,
      ]),
    )
  }, [monedas])

  const movimientos = useMemo<MovimientoFinanciero[]>(() => {
    const resultado: MovimientoFinanciero[] = []

    // INGRESOS: solamente citas realizadas y pagadas.
    for (const cita of citas) {
      if (
        cita.estadoAtencion !== 'realizada' ||
        cita.estadoPago !== 'pagado'
      ) {
        continue
      }

      const fecha = cita.fechaRealizacion || cita.fecha

      if (!fechaDentroDelPeriodo(fecha, desde, hasta)) {
        continue
      }

      const moneda = cita.monedaCobro
        ? codigoMonedaPorId.get(cita.monedaCobro) || 'SIN MONEDA'
        : 'SIN MONEDA'

      resultado.push({
        id: `cita-${cita._id}`,
        tipo: 'Ingreso',
        fecha,
        descripcion: `Pago de cita #${cita._id.slice(-6)}`,
        moneda,
        importe: Number(cita.precioCobrado) || 0,
      })
    }

    // GASTOS: compras registradas.
    for (const compra of compras) {
      if (!fechaDentroDelPeriodo(compra.fechaCompra, desde, hasta)) {
        continue
      }

      const moneda =
        compra.monedaCodigo ||
        compra.moneda?.tipoMoneda ||
        'SIN MONEDA'

      resultado.push({
        id: `compra-${compra._id}`,
        tipo: 'Gasto',
        fecha: compra.fechaCompra,
        descripcion: `Compra: ${compra.producto?.nombre || 'Producto'}`,
        moneda,
        importe: Number(compra.total) || 0,
      })
    }

    return resultado.sort(
      (a, b) =>
        new Date(b.fecha).getTime() -
        new Date(a.fecha).getTime(),
    )
  }, [citas, compras, desde, hasta, codigoMonedaPorId])

  const resumenPorMoneda = useMemo<ResumenMoneda[]>(() => {
    const resumen = new Map<string, ResumenMoneda>()

    for (const movimiento of movimientos) {
      if (!resumen.has(movimiento.moneda)) {
        resumen.set(movimiento.moneda, {
          moneda: movimiento.moneda,
          ingresos: 0,
          gastos: 0,
          cantidadPagos: 0,
          cantidadCompras: 0,
        })
      }

      const actual = resumen.get(movimiento.moneda)!

      if (movimiento.tipo === 'Ingreso') {
        actual.ingresos += movimiento.importe
        actual.cantidadPagos++
      } else {
        actual.gastos += movimiento.importe
        actual.cantidadCompras++
      }
    }

    return Array.from(resumen.values()).sort(
      (a, b) => a.moneda.localeCompare(b.moneda),
    )
  }, [movimientos])

  const totalIngresos = movimientos.filter(
    (m) => m.tipo === 'Ingreso',
  ).length

  const totalGastos = movimientos.filter(
    (m) => m.tipo === 'Gasto',
  ).length

  if (cargando) {
    return (
      <div className="finanzas-seccion">
        <p className="finanzas-estado">
          Cargando resumen financiero...
        </p>
      </div>
    )
  }

  return (
    <div className="finanzas-seccion">
      <header className="finanzas-header">
        <div>
          <h2>Resumen financiero</h2>
          <p>
            Control de ingresos, gastos y balance por moneda.
          </p>
        </div>

        <button
          type="button"
          className="finanzas-btn-actualizar"
          onClick={() => setRecarga((valor) => valor + 1)}
          title="Actualizar información"
          aria-label="Actualizar información"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M20 7v5h-5" />
            <path d="M4 17v-5h5" />
            <path d="M5.64 9A8 8 0 0 1 19 7l1 5" />
            <path d="M4 12l1 5a8 8 0 0 0 13.36-2" />
          </svg>
          <span>Actualizar</span>
        </button>
      </header>

      <section className="finanzas-filtros">
        <div>
          <label htmlFor="finanzas-desde">Desde</label>
          <input
            id="finanzas-desde"
            type="date"
            value={desde}
            max={hasta}
            onChange={(e) => setDesde(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="finanzas-hasta">Hasta</label>
          <input
            id="finanzas-hasta"
            type="date"
            value={hasta}
            min={desde}
            max={hoyClaveLocal()}
            onChange={(e) => setHasta(e.target.value)}
          />
        </div>
      </section>

      {error && (
        <div className="finanzas-error" role="alert">
          {error}
          <button
            type="button"
            onClick={() => setRecarga((valor) => valor + 1)}
          >
            Reintentar
          </button>
        </div>
      )}

      {!error && (
        <>
          <section className="finanzas-indicadores">
            <article className="finanzas-indicador">
              <span>Ingresos registrados</span>
              <strong>{totalIngresos}</strong>
              <small>Pagos de citas</small>
            </article>

            <article className="finanzas-indicador">
              <span>Gastos registrados</span>
              <strong>{totalGastos}</strong>
              <small>Compras de productos</small>
            </article>

            <article className="finanzas-indicador">
              <span>Monedas utilizadas</span>
              <strong>{resumenPorMoneda.length}</strong>
              <small>Sin conversiones</small>
            </article>
          </section>

          <div className="finanzas-resumen-graficos">
            <section className="finanzas-panel">
              <h3>Balance por moneda</h3>

              {resumenPorMoneda.length === 0 ? (
                <p className="finanzas-vacio">
                  No hay ingresos ni gastos en este período.
                </p>
              ) : (
                <div className="finanzas-tarjetas">
                  {resumenPorMoneda.map((item) => {
                    const balance = item.ingresos - item.gastos

                    return (
                      <article
                        className="finanzas-moneda-card"
                        key={item.moneda}
                      >
                        <div className="finanzas-moneda-titulo">
                          <h4>{item.moneda}</h4>
                          <span>Balance</span>
                        </div>

                        <strong
                          className={
                            balance >= 0
                              ? 'finanzas-balance-positivo'
                              : 'finanzas-balance-negativo'
                          }
                        >
                          {formatearImporte(balance, item.moneda)}
                        </strong>

                        <div className="finanzas-linea">
                          <span>Ingresos</span>
                          <strong className="finanzas-verde">
                            {formatearImporte(item.ingresos, item.moneda)}
                          </strong>
                        </div>

                        <div className="finanzas-linea">
                          <span>Gastos</span>
                          <strong className="finanzas-rojo">
                            {formatearImporte(item.gastos, item.moneda)}
                          </strong>
                        </div>

                        <div className="finanzas-linea">
                          <span>Pagos</span>
                          <strong>{item.cantidadPagos}</strong>
                        </div>

                        <div className="finanzas-linea">
                          <span>Compras</span>
                          <strong>{item.cantidadCompras}</strong>
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>

            <section className="finanzas-panel finanzas-panel-grafico">
              <div className="finanzas-grafico-header">
                <div>
                  <h3>Ingresos vs. gastos</h3>
                  <p>Comparación por moneda</p>
                </div>
                <span className="finanzas-grafico-icono" aria-hidden="true">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 3v18h18" />
                    <rect x="7" y="10" width="3" height="7" rx="1" />
                    <rect x="14" y="5" width="3" height="12" rx="1" />
                  </svg>
                </span>
              </div>

              <div className="finanzas-leyenda">
                <span>
                  <i className="finanzas-punto ingreso" />
                  Ingresos
                </span>
                <span>
                  <i className="finanzas-punto gasto" />
                  Gastos
                </span>
              </div>

              {resumenPorMoneda.length === 0 ? (
                <p className="finanzas-vacio">
                  No hay datos para mostrar en el gráfico.
                </p>
              ) : (
                <div className="finanzas-grafico">
                  {resumenPorMoneda.map((item) => {
                    const maximo = Math.max(
                      item.ingresos,
                      item.gastos,
                      1,
                    )

                    const porcentajeIngresos =
                      (item.ingresos / maximo) * 100

                    const porcentajeGastos =
                      (item.gastos / maximo) * 100

                    return (
                      <div
                        className="finanzas-grafico-grupo"
                        key={item.moneda}
                      >
                        <div className="finanzas-grafico-valores">
                          <span className="finanzas-valor-ingreso">
                            {formatearImporte(item.ingresos, item.moneda)}
                          </span>
                          <span className="finanzas-valor-gasto">
                            {formatearImporte(item.gastos, item.moneda)}
                          </span>
                        </div>

                        <div
                          className="finanzas-grafico-barras"
                          role="img"
                          aria-label={`${item.moneda}: ingresos ${formatearImporte(item.ingresos, item.moneda)}, gastos ${formatearImporte(item.gastos, item.moneda)}`}
                        >
                          <div className="finanzas-barra-contenedor">
                            <div
                              className="finanzas-barra ingreso"
                              style={{
                                height: `${porcentajeIngresos}%`,
                              }}
                              title={`Ingresos: ${formatearImporte(item.ingresos, item.moneda)}`}
                            />
                          </div>

                          <div className="finanzas-barra-contenedor">
                            <div
                              className="finanzas-barra gasto"
                              style={{
                                height: `${porcentajeGastos}%`,
                              }}
                              title={`Gastos: ${formatearImporte(item.gastos, item.moneda)}`}
                            />
                          </div>
                        </div>

                        <strong>{item.moneda}</strong>
                      </div>
                    )
                  })}
                </div>
              )}

              <p className="finanzas-grafico-nota">
                Cada moneda utiliza su propia escala para comparar sus
                ingresos y gastos sin mezclarlos.
              </p>
            </section>
          </div>

          <section className="finanzas-panel">
            <h3>Historial financiero</h3>

            {movimientos.length === 0 ? (
              <p className="finanzas-vacio">
                No hay operaciones para las fechas seleccionadas.
              </p>
            ) : (
              <div className="finanzas-tabla-contenedor">
                <table className="finanzas-tabla">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Descripción</th>
                      <th>Moneda</th>
                      <th>Importe</th>
                    </tr>
                  </thead>

                  <tbody>
                    {movimientos.map((movimiento) => (
                      <tr key={movimiento.id}>
                        <td>{movimiento.fecha.slice(0, 10)}</td>
                        <td>
                          <span
                            className={
                              movimiento.tipo === 'Ingreso'
                                ? 'finanzas-etiqueta-ingreso'
                                : 'finanzas-etiqueta-gasto'
                            }
                          >
                            {movimiento.tipo}
                          </span>
                        </td>
                        <td>{movimiento.descripcion}</td>
                        <td>{movimiento.moneda}</td>
                        <td
                          className={
                            movimiento.tipo === 'Ingreso'
                              ? 'finanzas-verde'
                              : 'finanzas-rojo'
                          }
                        >
                          {formatearImporte(
                            movimiento.importe,
                            movimiento.moneda,
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}


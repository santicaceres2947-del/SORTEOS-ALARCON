const express = require("express")
const fs = require("fs")
const cors = require("cors")

const app = express()
app.use(express.json())
app.use(cors())
app.use(express.static("public"))

const PORT = process.env.PORT || 3000

let datos = {
  numeros: [],
  compras: [],
  cuentas: [
    {id:1, whatsapp:"573000000000", nequi:"3000000000", daviplata:"3000000000"}
  ]
}

let config = {
  adminPass: "1234",
  precio: 10000,
  cierre: "2026-04-01T20:00:00"
}

function authAdmin(req, res, next) {
  const pass = req.headers["x-admin-pass"]

  if (pass !== config.adminPass) {
    return res.status(401).json({ error: "No autorizado" })
  }

  next()
}

// generar números
if (datos.numeros.length === 0) {
  for (let i = 0; i < 1000000; i++) {
    datos.numeros.push({
      numero: i,
      estado: "disponible"
    })
  }
}

app.get("/numeros", (req, res) => {
  let pagina = parseInt(req.query.pagina) || 1
  let inicio = (pagina - 1) * 100
  let fin = inicio + 100

  res.json(datos.numeros.slice(inicio, fin))
})

app.get("/azar", (req, res) => {
  let cantidad = parseInt(req.query.cantidad) || 1

  let disponibles = datos.numeros.filter(n => n.estado === "disponible")
  let seleccionados = []

  for (let i = 0; i < cantidad; i++) {
    let r = Math.floor(Math.random() * disponibles.length)
    seleccionados.push(disponibles[r])
    disponibles.splice(r, 1)
  }

  res.json(seleccionados)
})

app.post("/pago", (req, res) => {
  let { numeros, nombre, telefono, referencia } = req.body

  numeros.forEach(n => {
    let num = datos.numeros.find(x => x.numero == n)
    if (num) num.estado = "pagado"
  })

  datos.compras.push({ numeros, nombre, telefono, referencia })

  res.json({ ok: true })
})

app.get("/mis-numeros", (req, res) => {
  let telefono = req.query.telefono

  let resultado = datos.compras
    .filter(c => c.telefono == telefono)
    .flatMap(c => c.numeros.map(n => ({ numero: n })))

  res.json(resultado)
})

app.get("/recaudado", (req, res) => {
  let total = datos.numeros.filter(n => n.estado == "pagado").length * config.precio
  res.json({ recaudado: total })
})

app.get("/admin/precio", (req, res) => {
  res.json({ precio: config.precio })
})

app.get("/admin/cierre", (req, res) => {
  res.json({ cierre: config.cierre })
})

app.get("/imagenes", (req, res) => {
  fs.readdir("./public/imagenes", (err, files) => {
    if (err) return res.json([])
    res.json(files)
  })
})

app.get("/admin/imagenes", (req, res) => {
  fs.readdir("./public/imagenes", (err, files) => {
    if (err) return res.json([])
    res.json(files)
  })
})

app.get("/cuenta-random", (req, res) => {
  let r = Math.floor(Math.random() * datos.cuentas.length)
  res.json(datos.cuentas[r])
})

app.post("/liberar", authAdmin, (req, res) => {
  let { numeros } = req.body

  numeros.forEach(n => {
    let num = datos.numeros.find(x => x.numero == n)
    if (num) num.estado = "disponible"
  })

  res.json({ mensaje: "Números liberados" })
})

app.post("/admin/agregar-cuenta", authAdmin, (req, res) => {
  let { whatsapp, nequi, daviplata } = req.body
  let id = Date.now()

  datos.cuentas.push({ id, whatsapp, nequi, daviplata })

  res.json({ ok: true })
})

app.post("/admin/eliminar-cuenta", authAdmin, (req, res) => {
  let { id } = req.body
  datos.cuentas = datos.cuentas.filter(c => c.id != id)

  res.json({ ok: true })
})

app.post("/admin/reset", authAdmin, (req, res) => {
  datos.numeros.forEach(n => n.estado = "disponible")
  datos.compras = []

  res.json({ mensaje: "Sorteo reiniciado" })
})

app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT)
})
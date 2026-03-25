const express = require("express")
const app = express()
const multer = require("multer")
const fs = require("fs")
const supabase = require("./supabase")

app.use(express.json())
app.use(express.static("public"))

const ADMIN_PASS = "1234"

// 🔐 AUTH
function authAdmin(req, res, next) {
  const pass = req.headers["x-admin-pass"]
  if (pass !== ADMIN_PASS) {
    return res.status(401).json({ error: "No autorizado" })
  }
  next()
}

// 📁 IMÁGENES
if (!fs.existsSync("public/imagenes")) {
  fs.mkdirSync("public/imagenes", { recursive: true })
}

const storage = multer.diskStorage({
  destination: __dirname + "/public/imagenes",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  }
})

const upload = multer({ storage })

app.get("/imagenes", (req, res) => {
  fs.readdir(__dirname + "/public/imagenes", (err, files) => {
    if (err) return res.json([])
    res.json(files)
  })
})

app.post("/admin/subir-imagen", authAdmin, upload.single("imagen"), (req, res) => {
  res.json({ ok: true })
})

// 🔎 BUSCAR
app.get("/buscar", async (req, res) => {
  let numero = parseInt(req.query.numero)

  let { data } = await supabase
    .from("numeros")
    .select("*")
    .eq("numero", numero)
    .single()

  if (!data) return res.json({ estado: "disponible" })

  res.json({
    estado: "vendido",
    nombre: data.nombre,
    telefono: data.telefono,
    referencia: data.referencia
  })
})

// 💰 PAGOS (ARREGLADO)
app.post("/pago", async (req, res) => {
  let { numeros, nombre, telefono, referencia } = req.body

  for (let n of numeros) {
    await supabase.from("numeros").upsert({
      numero: n,
      estado: "pagado",
      nombre,
      telefono,
      referencia,
      fecha_pago: new Date()
    })
  }

  res.json({ ok: true })
})

// 🔓 LIBERAR
app.post("/liberar", authAdmin, async (req, res) => {
  let { numeros } = req.body

  for (let n of numeros) {
    await supabase.from("numeros").delete().eq("numero", n)
  }

  res.json({ ok: true })
})

// 📊 VENTAS
app.get("/ventas", async (req, res) => {
  let { data } = await supabase
    .from("numeros")
    .select("numero,nombre,telefono,referencia")
    .eq("estado", "pagado")

  res.json(data || [])
})

// 🔢 NUMEROS (CLAVE)
app.get("/numeros", async (req,res)=>{

let pagina = parseInt(req.query.pagina) || 1
let limite = 100
let inicio = (pagina-1) * limite

let {data} = await supabase
.from("numeros")
.select("numero")
.range(inicio, inicio + limite - 1)

let lista=[]

for(let i=0;i<limite;i++){

let num = inicio + i
let encontrado = data.find(d=>d.numero==num)

lista.push({
numero:num,
estado: encontrado ? "pagado" : "disponible"
})

}

res.json(lista)

})

app.listen(3000, () => {
  console.log("Servidor funcionando")
})
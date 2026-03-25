const express = require("express")
const app = express()
const multer = require("multer")
const fs = require("fs")
const supabase = require("./supabase")

app.use(express.json())
app.use(express.static("public"))

const ADMIN_PASS = "1234"

// 🔐 AUTH
function authAdmin(req,res,next){
  const pass = req.headers["x-admin-pass"]
  if(pass !== ADMIN_PASS){
    return res.status(401).json({error:"No autorizado"})
  }
  next()
}

// 📁 CARPETA IMÁGENES
if (!fs.existsSync("public/imagenes")) {
  fs.mkdirSync("public/imagenes", { recursive: true })
}

// 📤 SUBIR IMAGEN
const storage = multer.diskStorage({
  destination: __dirname + "/public/imagenes",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  }
})

const upload = multer({ storage })

// 🖼️ VER IMÁGENES
app.get("/imagenes",(req,res)=>{
  fs.readdir(__dirname + "/public/imagenes",(err,files)=>{
    if(err) return res.json([])
    res.json(files)
  })
})

// 🖼️ ADMIN IMÁGENES
app.post("/admin/subir-imagen",authAdmin,upload.single("imagen"),(req,res)=>{
  res.json({ok:true})
})

app.post("/admin/eliminar-imagen",authAdmin,(req,res)=>{
  let {nombre} = req.body
  let ruta = __dirname + "/public/imagenes/" + nombre

  if(fs.existsSync(ruta)){
    fs.unlinkSync(ruta)
  }

  res.json({ok:true})
})

// 🔢 NUMEROS
app.get("/numeros", async (req,res)=>{

  let pagina = parseInt(req.query.pagina) || 1
  let limite = 100
  let inicio = (pagina-1)*limite

  let {data} = await supabase.from("numeros").select("numero")

  let vendidos = {}
  if(data){
    data.forEach(n=>vendidos[n.numero]=true)
  }

  let lista=[]

  for(let i=0;i<limite;i++){
    let num = inicio + i
    if(num >= 1000000) break

    lista.push({
      numero:num,
      estado: vendidos[num] ? "pagado" : "disponible"
    })
  }

  res.json(lista)

})

// 💳 PAGO
app.post("/pago", async (req,res)=>{

  let {numeros,nombre,telefono,referencia} = req.body

  for(let n of numeros){
    await supabase.from("numeros").insert({
      numero:n,
      estado:"pagado",
      nombre,
      telefono,
      referencia,
      fecha_pago:new Date()
    })
  }

  res.json({ok:true})

})

// 🎰 MAQUINA
app.get("/azar", async (req,res)=>{

  let cantidad = parseInt(req.query.cantidad) || 1

  let {data} = await supabase.from("numeros").select("numero")
  let vendidos = data ? data.map(n=>n.numero) : []

  let resultado=[]

  while(resultado.length < cantidad){
    let r = Math.floor(Math.random()*1000000)

    if(!vendidos.includes(r) && !resultado.includes(r)){
      resultado.push(r)
    }
  }

  res.json(resultado.map(n=>({numero:n})))

})

// 🔓 LIBERAR
app.post("/liberar",authAdmin, async (req,res)=>{

  let {numeros} = req.body

  for(let n of numeros){
    await supabase.from("numeros").delete().eq("numero",n)
  }

  res.json({ok:true})

})

// 🔍 MIS NUMEROS
app.get("/mis-numeros", async (req,res)=>{

  let telefono = req.query.telefono

  let {data} = await supabase
  .from("numeros")
  .select("numero")
  .eq("telefono",telefono)

  res.json(data || [])

})

// 🧾 VENTAS ADMIN
app.get("/admin/ventas", async (req,res)=>{

  let {data} = await supabase
  .from("numeros")
  .select("*")
  .order("fecha_pago",{ascending:false})

  res.json(data || [])

})

// 💰 RECAUDADO
app.get("/recaudado", async (req,res)=>{

  let {data} = await supabase.from("numeros").select("numero")
  let total = data ? data.length : 0

  res.json({recaudado: total * 10000})

})

// ⚙️ CONFIG
app.get("/config",(req,res)=>{
  res.json({adminPass: ADMIN_PASS})
})

// 🚀 SERVER
app.listen(3000,()=>{
  console.log("Servidor funcionando")
})
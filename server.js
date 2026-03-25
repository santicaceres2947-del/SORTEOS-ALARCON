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

app.get("/imagenes",(req,res)=>{
  fs.readdir(__dirname + "/public/imagenes",(err,files)=>{
    if(err) return res.json([])
    res.json(files)
  })
})

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

// 🔢 NUMEROS (FUNCIONANDO)
app.get("/numeros", async (req,res)=>{

  let pagina = parseInt(req.query.pagina) || 1
  let limite = 100
  let inicio = (pagina-1)*limite

  let {data,error} = await supabase
  .from("numeros")
  .select("numero")

  let vendidos = {}

  if(data){
    data.forEach(n=>{
      vendidos[n.numero] = true
    })
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

// 💳 PAGO (ARREGLADO)
app.post("/pago", async (req,res)=>{

  let {numeros,nombre,telefono,referencia} = req.body

  for(let n of numeros){

    await supabase
    .from("numeros")
    .insert({
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

// 🎰 MAQUINA (ARREGLADA)
app.get("/azar", async (req,res)=>{

  let cantidad = parseInt(req.query.cantidad) || 1

  let {data} = await supabase
  .from("numeros")
  .select("numero")

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

// 🔎 BUSCAR
app.get("/buscar", async (req,res)=>{

  let numero = parseInt(req.query.numero)

  let {data} = await supabase
  .from("numeros")
  .select("*")
  .eq("numero",numero)
  .single()

  if(!data){
    return res.json({estado:"disponible"})
  }

  res.json({
    estado:"vendido",
    nombre:data.nombre,
    telefono:data.telefono
  })

})

// 🔓 LIBERAR
app.post("/liberar",authAdmin, async (req,res)=>{

  let {numeros} = req.body

  for(let n of numeros){
    await supabase
    .from("numeros")
    .delete()
    .eq("numero",n)
  }

  res.json({ok:true})

})
app.get("/admin/ventas", async (req,res)=>{

  let {data,error} = await supabase
  .from("numeros")
  .select("*")
  .order("fecha_pago",{ascending:false})

  res.json(data || [])

})
app.get("/mis-numeros", async (req,res)=>{

  let telefono = req.query.telefono

  let {data} = await supabase
  .from("numeros")
  .select("numero")
  .eq("telefono",telefono)

  res.json(data || [])

})
app.get("/recaudado", async (req,res)=>{

  let {data} = await supabase
  .from("numeros")
  .select("numero")

  let total = data ? data.length : 0

  res.json({
    recaudado: total * 10000
  })

})
app.get("/recaudado", async (req,res)=>{

  let {data} = await supabase
  .from("numeros")
  .select("numero")

  let total = data ? data.length : 0

  res.json({
    recaudado: total * 10000
  })

})

// 👤 CUENTAS
let cuentas=[]

app.get("/cuenta-random",(req,res)=>{

  if(cuentas.length==0){
    return res.json({
      whatsapp:"573000000000",
      nequi:"0000000000",
      daviplata:"0000000000"
    })
  }

  let r = Math.floor(Math.random()*cuentas.length)

  res.json(cuentas[r])

})

app.get("/admin/cuentas",(req,res)=>{
  res.json(cuentas)
})

app.post("/admin/agregar-cuenta",authAdmin,(req,res)=>{
  let {whatsapp,nequi,daviplata} = req.body

  cuentas.push({
    id:Date.now(),
    whatsapp,
    nequi,
    daviplata
  })

  res.json({ok:true})
})

app.post("/admin/eliminar-cuenta",authAdmin,(req,res)=>{
  let {id} = req.body
  cuentas = cuentas.filter(c=>c.id != id)
  res.json({ok:true})
})

// ⚙️ CONFIG
let config={
  precio:10000,
  cierre:"2026-04-01T20:00:00"
}

app.get("/admin/precio",(req,res)=>{
  res.json({precio:config.precio})
})

app.get("/admin/cierre",(req,res)=>{
  res.json({cierre:config.cierre})
})

// 🚀 SERVER
app.listen(3000,()=>{
  console.log("Servidor funcionando en puerto 3000")
})
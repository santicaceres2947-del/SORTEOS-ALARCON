const express = require("express")
const app = express()
const multer=require("multer")
const fs = require("fs")
const supabase = require("./supabase")

if (!fs.existsSync("public/imagenes")) {
fs.mkdirSync("public/imagenes", { recursive: true })
}

const storage=multer.diskStorage({
destination:__dirname + "/public/imagenes",
filename:(req,file,cb)=>{
cb(null,Date.now()+"-"+file.originalname)
}
})

const upload=multer({storage})

app.use(express.json())
app.use(express.static("public"))

const TOTAL = 1000000

let vendidos = {}

let config = {
adminPass:"1234",
precio:10000,
cierre:"2026-04-01T20:00:00"
}

let cuentas=[{
id:1,
whatsapp:"573223726763",
nequi:"3223726763",
daviplata:"3223726763"
}]
app.post("/admin/precio",(req,res)=>{

let {precio} = req.body

config.precio = precio

res.json({mensaje:"Precio actualizado"})

})
app.get("/admin/precio",(req,res)=>{

res.json({precio:config.precio})

})
app.post("/admin/cierre",(req,res)=>{

let {fecha} = req.body

config.cierre = fecha

res.json({mensaje:"Fecha guardada"})

})
app.get("/imagenes",(req,res)=>{

fs.readdir(__dirname + "/public/imagenes",(err,files)=>{

if(err){
return res.json([])
}

res.json(files)

})

})
app.post("/admin/eliminar-imagen",(req,res)=>{

let {nombre}=req.body

let ruta=__dirname+"/public/imagenes/"+nombre

if(fs.existsSync(ruta)){
fs.unlinkSync(ruta)
}

res.json({ok:true})

})
app.get("/imagenes",(req,res)=>{

fs.readdir(__dirname + "/public/imagenes",(err,files)=>{

if(err) return res.json([])

res.json(files)

})

})


// NUMEROS
app.get("/numeros", async (req,res)=>{

let pagina = parseInt(req.query.pagina) || 1
let inicio = (pagina-1)*100
let fin = inicio + 100

let {data,error} = await supabase
.from("numeros")
.select("numero")

let vendidos = {}

if(data && data.length>0){
data.forEach(n=>{
vendidos[parseInt(n.numero)] = true
})
}

let lista=[]

for(let i=inicio;i<fin;i++){

if(i>=1000000) break

lista.push({
numero:i,
estado: vendidos[i] ? "pagado" : "disponible"
})

}

res.json(lista)

})
app.post("/pago", async (req,res)=>{

let {numeros,nombre,telefono,referencia} = req.body

for(let n of numeros){

await supabase
.from("numeros")
.insert({

numero:n,
estado:"pagado",
nombre:nombre,
telefono:telefono,
referencia:referencia,
fecha_pago:new Date()

})

}

res.json({mensaje:"Pago registrado"})

})

// LIBERAR
app.post("/liberar",(req,res)=>{

let {numeros}=req.body

numeros.forEach(n=>{

delete vendidos[n]

})

res.json({mensaje:"Numeros liberados"})

})

// CONFIG
app.get("/config",(req,res)=>{

res.json(config)

})

// CUENTA RANDOM
app.get("/cuenta-random",(req,res)=>{

let r=Math.floor(Math.random()*cuentas.length)

res.json(cuentas[r])

})

// VER CUENTAS
app.get("/admin/cuentas",(req,res)=>{

res.json(cuentas)

})

// AGREGAR CUENTA
app.post("/admin/agregar-cuenta",(req,res)=>{

let {whatsapp,nequi,daviplata}=req.body

cuentas.push({

id:Date.now(),
whatsapp,
nequi,
daviplata

})

res.json({mensaje:"Cuenta agregada"})

})
app.post("/admin/subir-logo", upload.single("logo"), (req,res)=>{

if(!req.file){
return res.json({error:"No se subió ningún archivo"})
}

let rutaOrigen = req.file.path
let rutaDestino = __dirname + "/public/logo.png"

try{

if(fs.existsSync(rutaDestino)){
fs.unlinkSync(rutaDestino)
}

fs.renameSync(rutaOrigen, rutaDestino)

res.json({mensaje:"Logo actualizado"})

}catch(err){

console.log(err)
res.json({error:"Error moviendo el logo"})

}

})
// ELIMINAR CUENTA
app.post("/admin/eliminar-cuenta",(req,res)=>{

let {id}=req.body

cuentas=cuentas.filter(c=>c.id!=id)

res.json({mensaje:"Cuenta eliminada"})

})
app.get("/azar", async (req,res)=>{

let cantidad = parseInt(req.query.cantidad) || 1

let resultado = []

let {data} = await supabase
.from("numeros")
.select("numero")

let vendidos = {}

if(data){
data.forEach(n=>{
vendidos[n.numero] = true
})
}

while(resultado.length < cantidad){

let r = Math.floor(Math.random()*1000000)

if(!vendidos[r] && !resultado.includes(r)){
resultado.push(r)
}

}

res.json(
resultado.map(n=>({numero:n}))
)

})
app.get("/ventas", async (req,res)=>{

let {data,error} = await supabase
.from("numeros")
.select("numero,nombre,telefono,referencia")
.eq("estado","pagado")

if(error){
return res.json([])
}

res.json(data)

})
app.get("/vendidos", async (req,res)=>{

let {data,error} = await supabase
.from("ventas")
.select("numero")

if(error){
return res.json([])
}

res.json(data)

})
app.get("/admin/cierre",(req,res)=>{

res.json({cierre:config.cierre})

})

app.get("/mis-numeros", async (req,res)=>{

let telefono = req.query.telefono

let {data,error} = await supabase
.from("numeros")
.select("numero")
.eq("telefono",telefono)

if(error){
console.log(error)
return res.json([])
}

res.json(data)

})
app.listen(3000,()=>{

console.log("Servidor funcionando en http://localhost:3000")

})
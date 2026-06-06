const express = require('express')
const app = express()
const cors = require('cors')
const dotenv = require("dotenv")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-node-cjs-runtime');

dotenv.config()

app.use(cors())
app.use(express.json())


const port = process.env.PORT

app.get('/', (req, res) => {
  res.send('Hello World!')
})


const uri = process.env.MONGODB_URI

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
  )

const verifyToken = async(req, res , next)=>{
  const authHeader = req?.headers.authorization
  if(!authHeader){
    return res.status(401).json({message: "Unauthorized"});
  }
  const token = authHeader.split(" ")[1];
  if(!token){
    return res.status(401).json({message: "Unauthorized"})
  }
try {
   const {payload}  = await jwtVerify(token, JWKS)
    // console.log(payload)
    next()
  
} catch (error) {
  return res.status(403).json({message: "Forbidden"})
}



}
async function run() {
  try {
    
    // await client.connect();

    const database = client.db("hireloop");
    const jobsCollection = database.collection("jobs");

    
    app.post('/jobs',verifyToken, async(req, res)=>{

        try {
            const newJob = req.body;
            const result = await jobsCollection.insertOne(newJob);
            res.json(result)
            
        } catch (error) {
            console.log(error, "from posting time of create jobs")
        }
    })

    app.get('/jobs/:userId',verifyToken, async(req, res)=>{
        const userId = req.params.userId;
        const query = {companyId: userId};
        const cursor  = jobsCollection.find(query);
        const result = await cursor.toArray();
        res.json(result);
    })

    app.get("/jobs", async(req, res)=>{
      const cursor  = jobsCollection.find();
      const result = await cursor.toArray();
        res.json(result); 
    })
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally{

  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
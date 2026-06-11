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
    return res.status(401).json({message: "headers error: Unauthorized"});
  }
  const token = authHeader.split(" ")[1];
  if(!token){
    return res.status(401).json({message: "token in headers error: Unauthorized"})
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
    const companiesCollection = database.collection("companies")
    const applicationsCollection = database.collection("applications")
    const plansCollection = database.collection("plans")

    
    app.post('/jobs',verifyToken, async(req, res)=>{

        try {
            const newJob = req.body;
            const result = await jobsCollection.insertOne(newJob);
            res.json(result)
            
        } catch (error) {
            console.log(error, "from posting time of create jobs")
        }
    })

    app.get('/jobs/company/:userId',verifyToken, async(req, res)=>{
        const userId = req.params.userId;
        const query = {companyId: userId};
        const cursor  = jobsCollection.find(query);
        const result = await cursor.toArray();
        res.json(result);
    })

    app.get("/jobs/:jobId",verifyToken,  async(req, res)=>{
      const {jobId} = req.params;
      if (!ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: "Invalid Job ID format" });
    }
      const query = {_id: new ObjectId(jobId)}
      const result  = await jobsCollection.findOne(query);
      
      if (!result) {
      return res.status(404).json({ message: "Job not found" });
    }
        res.json(result); 
    })


    app.get("/jobs", async(req, res)=>{
      const {search, category, type } = req.query;
      const query = {}
      if(search && search.trim() !== ''){
        query.title = {
          $regex : search.trim(),
          $options : 'i'
        }

      }

       if(category && category !== 'All'){
        query.category = category
      }
      if(type && type !=='All'){
        query.type = type
      }
      const cursor  = jobsCollection.find(query);
      const result = await cursor.toArray();
        res.json(result); 
    })

    app.post('/companies', async(req, res)=>{
      const registredData = req.body;
      const result = await companiesCollection.insertOne(registredData)
      res.json(result)
    })

     app.post('/applications', async(req, res)=>{

        try {
            const newApp = req.body;
            newApp.appliedAt = new Date();
            const result = await applicationsCollection.insertOne(newApp);
            res.json(result)
            
        } catch (error) {
            console.log(error, "Job applicatiion submiting failed")
        }
    })

    app.get('/applications', async(req, res)=>{
      try {
        const userEmail = req.query.userEmail;
        const query = {email: userEmail};
        const cursor = await applicationsCollection.find(query);
        const result = await cursor.toArray();
        res.json(result);
      } catch (error) {
        console.log(error, "internal server error");
      }
    })

    app.get('/plans', async(req, res)=>{
      const planId = req.query.plan_id;
      const query = {plan_id: planId}
      try {
       const result  = await plansCollection.findOne(query)
      res.json(result)
      } catch (error) {
        console.log("failed upload plans collection",error);
        
      }
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
const express = require('express')
const app = express()
const cors = require('cors')
const dotenv = require("dotenv")
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

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

async function run() {
  try {
    
    await client.connect();

    const database = client.db("hireloop");
    const jobsCollection = database.collection("jobs");

    
    app.post('/jobs', async(req, res)=>{
        try {
            const newJob = req.body;
            const result = await jobsCollection.insertOne(newJob);
            res.json(result)
            
        } catch (error) {
            console.log(error, "from posting time of create jobs")
        }
    })

    app.get('/jobs/:userId', async(req, res)=>{
        const userId = req.params.userId;
        const query = {companyId: userId};
        const cursor  = jobsCollection.find(query);
        const result = await cursor.toArray();
        res.json(result);
    })
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally{

  }
}
run().catch(console.dir);


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
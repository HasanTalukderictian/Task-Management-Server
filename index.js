const express = require('express')
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;
require('dotenv').config()
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

// middleware 
app.use(cors())
app.use(express.json())









const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vtmwivk.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});



const verifyJwt =(req, res, next) =>{
    // console.log('hitting VerifyJwt');
    
    const authorization = req.headers.authorization;
    if (!authorization) {
      return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

     console.log('token inside verify jwt', token);
    jwt.verify(token, process.env.TKOEN, (err, decoded) => {
      if (err) {
        return res.status(401).send({ error: true, message: 'unauthorized access' })
      }
      req.decoded = decoded;
      next();
    })
  }


async function run() {
    try {

        await client.connect();



        const tasksCollection = client.db("TaskManager").collection("task");



        // 

        app.get('/task/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }

            const result = await tasksCollection.findOne(query);
            res.send(result);

        })

        // JWT 


        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.TKOEN, { expiresIn: '10h' })

            res.send({ token })
        })


        // post task 

        app.post('/task',  async (req, res) => {
            const user = req.body;
            // console.log('new user', user);
            const result = await tasksCollection.insertOne(user)
            res.send(result);
        })

        // get users data 

        // app.get('/task',async (req, res) => {
        //     // console.log(req.headers.authorization)
        //     const cursor = tasksCollection.find();
        //     const result = await cursor.toArray();
        //     res.send( result );
        // })

        app.get('/task', verifyJwt, async (req, res) => {
            // console.log(req.headers.authorization)
            let query = {};
            if(req.query?.email){
                query= {email: req.query.email}
            }
            const cursor = tasksCollection.find(query);
            const result = await cursor.toArray();
            res.send( result );
        })


        // Delete Data 
        app.delete('/task/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await tasksCollection.deleteOne(query);
            res.send(result);
        })


        app.put('/task/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedtask = req.body;
            const options = { upsert: true }
            console.log(updatedtask);
            const updateDoc = {
                $set: {
                    title: updatedtask.title,
                    task: updatedtask.task
                },
            };
            const result = await tasksCollection.updateOne(filter, updateDoc, options);
            res.send(result);
        })


        // Connect the client to the server	(optional starting in v4.7)

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
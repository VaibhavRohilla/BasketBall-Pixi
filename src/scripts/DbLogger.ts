// import { MongoClient } from "mongodb";

// const DB_NAME = "BasketBallGameLogs";
// const DB_URI = "mongodb+srv://Html5Games:JdFpLNN64y0Eve6k@html5gamelogs.is34dnv.mongodb.net/?retryWrites=true&w=majority";


// const client = new MongoClient(DB_URI);

// async function main() {
//     // Use connect method to connect to the server
//     await client.connect();
//     console.log('Connected successfully to server');

  
//     return 'done.';
// }

// main()
//   .then(console.log)
//   .catch(console.error)
//   .finally(() => client.close());


// export async function sendToDB(data : any)
// {
//     const db = client.db(DB_NAME);
//     const collection = db.collection("BallPositionErrors");

//     data.time = new Date();
//     const insertResult = await collection.insertOne(data);

//     console.log('Inserted Documents');
// }

interface logDataType {
    type : string,
    x : number,
    y : number,
    velocity : string,
    rotation : number
}

// import https from 'https';

export async function sendToDB(data : logDataType)
{
    fetch(`https://gamedashboardserver.cap2.yonzo.io/getBasketBallGameLogs?type=${data.type}&x=${data.x}&y=${data.y}&velocity=${data.velocity}&rotation=${data.rotation}`, {
        method : 'GET'
    }).then(response => {
        if(response.status != 200)
        {
            console.log("Failed Inserted Documents")
        } else 
        {
            console.log("Successfully Inserted Documents");
        }
    });

    // console.log('Inserted Documents');
}

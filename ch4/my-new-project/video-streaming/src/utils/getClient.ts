import { MongoClient } from "mongodb";

const DBHOST = process.env.DBHOST || "";

const getClient = async () => {
  const client = new MongoClient(`mongodb://db:27018`);

  try {
    await client.connect();
    return client;
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    }
  }
};

export default getClient;

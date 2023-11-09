import { MongoClient } from "mongodb";

interface GetCollectionsArgs {
  dbName: string;
  collectionName: string;
}

const getClient = async () => {
  const client = new MongoClient(process.env.DBHOST!);
  await client.connect();
  return client;
};

export const getDb = async (dbName: string) => {
  const client = await getClient();
  return { client, db: client.db(dbName) };
};

export const getCollection = async ({
  collectionName,
  dbName,
}: GetCollectionsArgs) => {
  const { client, db } = await getDb(dbName);
  return { client, collection: db.collection(collectionName) };
};

export default getClient;

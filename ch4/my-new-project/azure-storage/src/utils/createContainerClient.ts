import {
  BlobServiceClient,
  StorageSharedKeyCredential,
} from "@azure/storage-blob";

interface createBlobServiceArgs {
  containerName: string;
}

const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME;
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY;

const sharedKeyCredential = new StorageSharedKeyCredential(
  STORAGE_ACCOUNT_NAME || "",
  STORAGE_ACCESS_KEY || ""
);
const createContainerClient = ({ containerName }: createBlobServiceArgs) => {
  const blobServiceClient = new BlobServiceClient(
    `https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
    sharedKeyCredential
  );
  return blobServiceClient.getContainerClient(containerName);
};

export default createContainerClient;

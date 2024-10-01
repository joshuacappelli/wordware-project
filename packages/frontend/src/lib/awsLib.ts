import { Storage } from "aws-amplify";

export async function s3Upload(file: File) {
  const filename = `${Date.now()}-${file.name}`;

  const stored = await Storage.vault.put(filename, file, {
    contentType: file.type,
  });

  return stored.key;
}

export async function s3GetAttachment(key: string) {
  try {
    // Retrieve the file using the key (the key is the filename stored in S3)
    const fileUrl = await Storage.vault.get(key);
    
    // You can return the file URL or fetch the actual file content from the URL
    return fileUrl; // This returns the URL to access the file
  } catch (error) {
    console.error("Error retrieving file from S3:", error);
    throw new Error("Could not retrieve the file");
  }
}
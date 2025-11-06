"use server"

import { UTApi } from "uploadthing/server"

const utapi = new UTApi()

export async function deleteImage(url: string) {
  try {
    // Extract the file key from the URL
    const fileKey = url.substring(url.lastIndexOf("/") + 1)
    await utapi.deleteFiles(fileKey)
    return { success: true }
  } catch (error) {
    console.error("Error deleting file:", error)
    return { success: false, error: "Failed to delete file" }
  }
}

